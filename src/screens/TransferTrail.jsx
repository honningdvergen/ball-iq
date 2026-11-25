// Transfer Trail — daily "name the player from their career" screen.
// Spec: docs/transfer-trail-spec-v2.md.
//
// The career is revealed chronologically, two clubs to open, one more per miss.
// v1 asked players to SORT a scrambled career instead; it was pulled the hour it
// shipped, because sorting is only deduction if you already know whose career it
// is — without recognition it is blind permutation. Naming the player is the
// genre convention and needs no tutorial.
//
// Only revealed clubs are drawn. No "?" placeholders for the rest: the LENGTH of
// a career is itself a clue — a six-club journeyman reads very differently from
// a three-club one-club-man — and handing that over free undoes the ladder.
import GameTitle from "../components/GameTitle.jsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChallengeBanner from "../components/ChallengeBanner.jsx";
import { dateToYMD } from "../lib/date.js";
import {
  TRAIL_MAX_ATTEMPTS,
  getTrailAnswer,
  getTrailNumber,
  guessMatchesPlayer,
  cluesShown,
  openingFor,
  hintFor,
  computeTrailStreak,
  buildTrailShareText,
  startsAnnounced,
  owesCredit,
  finishedBefore,
  enterGuess,
  guessCareers,
  wrongPathNote,
} from "../lib/trail.js";
// ⚠️ NO IMPORT FROM App.jsx. This screen also mounts as an island on the static
// /transfer-trail/ page (src/islands/trail.jsx), and an island that imported
// App.jsx would bundle the whole monolith. Haptics, sound and confetti arrive
// through `services` (src/games/dailyServices.js); the club colours and codes
// come from a module gen-club-index.mjs writes out of App.jsx on every build.
import { resolveDailyServices } from "../games/dailyServices.js";
import { DailyDone } from "../components/DailyDone.jsx";
import { StreakChip } from "../components/StreakChip.jsx";
import { getTrailXP } from "../lib/dailyXp.js";
import { clubColour, clubAbbr, tint, lift, crestPaint } from "../lib/clubColour.js";
import { CLUB_PACK_COLOURS, CLUB_PACK_ABBR } from "../data/clubPackColours.js";
/* Shares mysteryPool.json with Mystery Player ON PURPOSE — both screens
   import() the same module, so Vite hoists it into one chunk a player who does
   both dailies downloads ONCE. A slim 4-field index was built and measured
   first: it cut a Trail-only visit 359 -> 206 KB, but pushed anyone playing
   BOTH dailies to 867 KB, and duplicated 784 KB into the native binary, which
   ships all of dist/. Loaded on the first focus of the guess box since
   2026-09-05 (see usePlayerPool) so the static page pays for it only when
   someone actually starts typing. */
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { careerOf } from "../lib/mysteryCareer.js";

// Space between two clubs on the trail, and the length of the link drawn in it.
const TRAIL_GAP = 12;
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight } from "../lib/useKeyboardAwareInput.js";
import ResultFoot, { ReportLink } from "../components/ResultFoot.jsx";
// An installed app plays the day's career from the log the SITE serves when it
// has kept a good copy (lib/scheduleRemote.js), so it stays on the website's
// player after the log is re-planned. Nothing is kept on the website, so there
// this always hands back the player the caller resolved from the bundle.
import { trailPlayerForDate } from "../lib/scheduleRemote.js";
import { t as tNow, useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path

function loadDay(ymd) {
  try {
    const raw = localStorage.getItem(`biq_trail_${ymd}`);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p?.attempts) ? p : null;
  } catch { return null; }
}
function saveDay(ymd, state) {
  try { localStorage.setItem(`biq_trail_${ymd}`, JSON.stringify(state)); } catch {}
}

// `stitch` (Stitch-up, 16 Oct 2026): the same board as a one-off a mate built.
//   { opening, sub, load(), save(state), onFinish({ won, clubsUsed }), Done }
// ⚠️ A STITCH-UP IS NOT A DAILY. It never reads or writes biq_trail_<day>,
// never fires biq:daily-completed (XP, the streak, a scores row) or
// biq:daily-reviewed, shows no puzzle number, no challenge banner and no
// return-loop panel. Its own attempts go through stitch.load/save only.
export default function TransferTrail({ player: bundledPlayer, date = new Date(), onBack, onReport, services, embedded = false, stitch = null }) {
  const t = useT();
  const { haptic, playSound, Confetti, GetAppCTA, dailyDone, shareCard, paysXp } = resolveDailyServices(services);
  const daily = !stitch;
  const ymd = dateToYMD(date);
  // Keyed by the day, not the Date object: the island passes none, and the
  // default is a new Date on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // A Stitch-up plays the career its sender chose, never the day's log.
  const player = useMemo(() => (stitch ? bundledPlayer : trailPlayerForDate(date, bundledPlayer)), [ymd, bundledPlayer, stitch]);
  const number = daily ? getTrailNumber(date) : 0;
  // A Stitch-up opens on what its sender chose; the daily on two clubs, or
  // three for the careers in TRAIL_OPEN_THREE (trail.js).
  const opening = stitch?.opening ?? openingFor(player);
  const career = useMemo(() => player?.clubs || [], [player]);

  // Attempts are the raw submissions — { text, skipped } — and everything else
  // derives. Same store-inputs-not-derived-state rule as Footle, so a mid-game
  // reload rebuilds the exact board rather than trusting a cached verdict.
  // The day as it was saved when this screen opened, read before anything here
  // has written to it: what tells a finish made now from one made earlier.
  const savedAtMount = useRef(null);
  if (savedAtMount.current === null) savedAtMount.current = (daily ? loadDay(ymd) : stitch.load?.()) || {};
  const [attempts, setAttempts] = useState(() => savedAtMount.current.attempts || []);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  const won = attempts.some((a) => !a.skipped && guessMatchesPlayer(a.text, player));
  const misses = attempts.filter((a) => a.skipped || !guessMatchesPlayer(a.text, player)).length;
  const lost = !won && misses >= TRAIL_MAX_ATTEMPTS;
  const done = won || lost;

  const shown = done ? career.length : cluesShown(misses, career.length, opening);
  const clubsUsed = won ? cluesShown(misses, career.length, opening) : career.length;
  // How many clubs were on screen at the last commit. A club beyond that is
  // arriving now, so it rises in, and when several arrive together (the full
  // career at the end) they follow each other 70ms apart instead of landing
  // as one block.
  const prevShown = useRef(shown);
  useEffect(() => { prevShown.current = shown; }, [shown]);
  const hint = done ? null : hintFor(player, misses);
  const left = Math.max(0, TRAIL_MAX_ATTEMPTS - misses);
  const isArchive = daily && ymd !== dateToYMD(new Date());

  useEffect(() => {
    if (!daily) { stitch.save?.({ status: won ? "won" : lost ? "lost" : "playing", attempts }); return; }
    // arc: archive plays are visible history but never streak fuel — the
    // walks in lib/trail.js break on it (same stamp as Footle and Mystery).
    saveDay(ymd, {
      status: won ? "won" : lost ? "lost" : "playing", attempts, ...(isArchive ? { arc: 1 } : {}),
      ...(owesCredit(embedded, savedAtMount.current, won || lost) ? { owed: 1 } : {}),
    });
  }, [ymd, attempts, won, lost]);

  // Fire the shared daily-completed event exactly once. App.jsx listens and
  // cancels the evening reminder, awards XP and writes the `scores` row — a mode
  // that stays silent here is invisible in the only table anyone queries, which
  // is how Footle went months looking unplayed.
  //
  // ⚠️ A DAY ALREADY FINISHED WHEN THE SCREEN OPENS IS NOT ANNOUNCED AGAIN. The
  // guard was a ref that started false, "because the screen re-mounts whenever
  // you navigate back into a finished puzzle" — but a new mount gets a new ref,
  // so every Review of a finished Trail paid its 40 XP again, wrote another
  // `scores` row and replayed the chord (seen in the simulator, 12 Oct 2026:
  // 172 XP to 212 on reopening). The saved status is the memory that survives
  // a mount, and it is read here, before this mount has saved anything. Read
  // from storage and not from `done`, which is false until the player loads.
  // A finish on the static page, where nothing listens, is saved as owed and
  // credited on the first open in the app (lib/trail.js, owesCredit).
  const announced = useRef(startsAnnounced(savedAtMount.current));
  // Opened to look at, not to play: tell the app so the visit is not logged as
  // an abandoned game. No XP and no scores row ride on this.
  useEffect(() => {
    if (!announced.current || embedded || !daily) return;
    try { window.dispatchEvent(new CustomEvent("biq:daily-reviewed", { detail: { game: "trail" } })); } catch { /* best effort */ }
  }, []);
  // ⚠️ ARCHIVE PLAYS DO NOT COUNT. The Trail already accepted a `date`, but it
  // announced completion whichever day it was — so replaying an old puzzle
  // would have ticked today's streak and paid XP. That turns the archive into
  // a way to farm the streak, and a farmable streak stops meaning "I showed up
  // every day", which is the only reason it exists. The board still records
  // the solve; only the habit metrics are protected.
  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
    if (!daily) { stitch.onFinish?.({ won, clubsUsed }); return; }
    if (isArchive) {
      // Streak repair hook — see the Footle twin for why this exists.
      try { window.dispatchEvent(new CustomEvent("biq:archive-completed", { detail: { game: "trail", ymd } })); } catch {}
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("biq:daily-completed", {
        detail: { positive: won, game: "trail", won, attempts: Math.max(1, misses) },
      }));
    } catch { /* best effort; never block the reveal */ }
  }, [done, won, misses, isArchive]);

  const submit = useCallback((skipped, explicit) => {
    if (done) return;
    // ⚠️ `explicit` exists because tapping a suggestion cannot go through
    // setEntry() first: this callback closes over `entry`, so it would read the
    // PREVIOUS keystroke's value and guess the wrong player. The tapped name is
    // passed straight in instead.
    const text = skipped ? "" : String(explicit ?? entry).trim();
    if (!skipped && !text) return;
    const hit = !skipped && guessMatchesPlayer(text, player);
    // ⚠️ iOS WKWebView: unmounting a FOCUSED input strands the keyboard on
    // screen and leaves the viewport in its keyboard-resized, scroll-locked
    // state (playtester report, 2026-08-11: "keyboard would not go away and
    // the app would not let him scroll"). This attempt ends the game exactly
    // when it's a hit or the final miss — blur BEFORE the state update
    // unmounts the input. Mid-game guesses keep focus for rapid re-guessing.
    const willEnd = hit || misses + 1 >= TRAIL_MAX_ATTEMPTS;
    if (willEnd) { try { document.activeElement?.blur?.(); } catch {} }
    setAttempts((a) => [...a, { text, skipped: !!skipped }]);
    setEntry("");
    // ⚠️ SOUND DEFAULTS ON FOR NATIVE IN 1.7.0 (App.jsx:8791), which is exactly
    // when this mode's silence starts being felt. Scouting report #4: App.jsx
    // carries 19 playSound calls, and Trail / Mystery / Stadiums carried ZERO
    // between them — so a native player hears Classic and Footle and then hits
    // a wall of silence in the newer modes. Paired with the haptics that were
    // already here, so the two channels always agree.
    if (hit) { haptic("hardCorrect"); playSound("correct"); }
    else { haptic("wrong"); playSound("wrong"); setShake(true); setTimeout(() => setShake(false), 420); }
  }, [done, entry, player, misses]);

  /* Name autocomplete, same ranker as Mystery Player (lib/playerSearch.js).
     Alex, after playing: "players type the first letter or two like mystery
     player and a list of suggestions comes up". It also removes the spelling
     tax — a Trail guess is limited, so losing an attempt to a mistyped
     "Szczesny" punishes typing rather than football knowledge.
     Already-guessed players are filtered out for the same reason Mystery does
     it: re-offering a name you have spent is a wasted tap on a limited board. */
  const guessedNames = useMemo(
    () => new Set(attempts.filter((a) => !a.skipped).map((a) => a.text.toLowerCase().trim())),
    [attempts],
  );
  const { pool, ensure: ensurePool } = usePlayerPool({ extras: true });
  // The careers of the players guessed, for the line under a wrong guess that
  // fits the board (lib/trail.js, wrongPathNote). Same files Mystery Player
  // ranks against, so a player who has done Mystery already holds them; anyone
  // else fetches them after a first miss, never before, and the static page
  // pays nothing for a first-guess solve. (careerOf, the code that reads them,
  // is small and already shares a chunk with the name search above.)
  const { careers, ensure: ensureCareers } = usePlayerPool({ careers: true });
  const missedOnce = attempts.some((a) => !a.skipped && !guessMatchesPlayer(a.text, player));
  useEffect(() => {
    if (missedOnce && !done) ensureCareers();
  }, [missedOnce, done, ensureCareers]);
  // Each wrong guess with the board it was made against: a guess fits or
  // misses the clubs that were on screen when it was typed, and the line under
  // it says which (lib/trail.js, wrongPathNote). Memoised: finding a name in
  // nine thousand must not run again on every keystroke in the box.
  const wrongOnes = useMemo(() => {
    const boardNow = career.slice(0, shown);
    const out = [];
    let missesBefore = 0;
    for (const a of attempts) {
      const miss = a.skipped || !guessMatchesPlayer(a.text, player);
      if (miss && !a.skipped) {
        const n = cluesShown(missesBefore, career.length, opening);
        const boardThen = n === boardNow.length ? boardNow : career.slice(0, n);
        out.push({ ...a, note: wrongPathNote(a.text, guessCareers(a.text, { pool, careers, careerOf }), boardNow, boardThen) });
      }
      if (miss) missesBefore++;
    }
    return out;
  }, [attempts, player, career, shown, pool, careers, opening]);
  const notes = wrongOnes.filter((a) => a.note);
  const suggestions = useMemo(
    () => rankPlayerSuggestions(pool, entry, { limit: SUGGEST_MAX })
      .filter((p) => !guessedNames.has(p.name.toLowerCase())),
    [pool, entry, guessedNames],
  );

  // ⚠️ Every miss inserts a club row above the input (and at three misses, the
  // hint block too), pushing the field down by ~55px a time. iOS scrolls a
  // focused field into view when it GAINS focus and never again, so once the
  // fourth and fifth clubs land the input — and the clue just revealed — have
  // slid under the keyboard, and the keyboard-shrunk viewport makes the page
  // read as scroll-locked (player report, 2026-08-21: "keyboard stuck on top
  // of the game ... exiting and re-entering fixed it"). Keeping focus between
  // guesses is deliberate (see submit), so pull the input back up rather than
  // dropping the keyboard. Gated on a visibly shrunk visualViewport: that is
  // the on-screen keyboard, and without the gate this would yank the page on
  // desktop where nothing is covered. `center` clears the keyboard without
  // needing to know which ancestor scrolls.
  // Now the shared hook (lib/useKeyboardAwareInput.js). Behaviour is unchanged
  // — the hook was extracted FROM this code — but the same shape had to be
  // fixed a third time in Mystery Player on 2026-08-22, so it lives in one
  // place now rather than drifting across three screens.
  const { inputRef, keepInputVisible, kbInset } = useKeyboardAwareInput();
  // How much room is there between the input and the top of the keyboard?
  // Recomputed whenever the keyboard moves or the list changes length, because
  // both change the answer. visualViewport.height already excludes the
  // keyboard, so this needs no guesswork about its height.
  const inputWrapRef = useRef(null);
  // Shared with Mystery Player — see useDropdownMaxHeight for why the first,
  // locally-copied version went stale and mixed coordinate spaces.
  const dropMax = useDropdownMaxHeight(inputWrapRef, { kbInset });
  useEffect(() => {
    if (done) return undefined;
    return keepInputVisible();
  }, [shown, hint, done, keepInputVisible]);

  const streak = useMemo(() => (won && daily ? computeTrailStreak(date) : 0), [won, date, daily]);
  // The result card's words (components/ResultCard.jsx via DailyDone). A win:
  // the club it took out of the career's clubs, a word for how early (the
  // five win words Footle uses for its first five guesses: one voice for the
  // dailies), and the name. A loss has no score and the name is the headline.
  //
  // THE CAREER IS ON THE CARD (25 Nov 2026, the layout Footle and the Daily 7
  // ended on). Until now the ladder stayed above and a second green card under
  // it said the result again; Alex, shown this finish and Top 10's in the new
  // layout: "Yes, both". The card carries every club as a row with the app's
  // own badge: the one the player was named on is green ("Got him here"), the
  // ones never needed are dimmed ("Not needed"), and a lost Trail shows them
  // all plain, because all of them were shown. The name is one quiet line
  // under the clubs on a win, the headline on a loss. Once the result is up
  // the ladder itself is not drawn (see below).
  const trailCard = (!done || stitch) ? null : (() => {
    const name = (player.display || []).join(" ");
    const picture = (
      <ol className="rc-clubs">
        {career.map((club, i) => {
          const col = clubColour(club, CLUB_PACK_COLOURS);
          const paint = col ? crestPaint(col) : null;
          const got = won && i === clubsUsed - 1;
          const off = won && i >= clubsUsed;
          return (
            <li key={i} className={got ? "is-got" : off ? "is-off" : undefined}>
              <i aria-hidden="true" style={paint ? { background: paint.bg, color: paint.ink, WebkitTextFillColor: paint.ink } : undefined}>{clubAbbr(club, CLUB_PACK_ABBR)}</i>
              <b>{club}</b>
              {/* A second spell and a loan are said on the card as on the ladder
                  (the ladder's note on return spells says why they must be). */}
              {career.slice(0, i).includes(club) && <small>{t("trail.return")}</small>}
              {player.loans?.[i] && <small className="is-loan">{t("trail.loan")}</small>}
              {(got || off) && <em>{t(got ? "trail.gotHere" : "trail.notNeeded")}</em>}
            </li>
          );
        })}
      </ol>
    );
    return {
      picture,
      title: "Transfer Trail", tag: number > 0 ? t("game.no", { n: number }) : null,
      score: won ? clubsUsed : null, outOf: career.length,
      // A win on the last attempt takes Footle's last-guess word, as there.
      verdict: won ? t(`footle.win${misses >= TRAIL_MAX_ATTEMPTS - 1 ? 6 : Math.min(misses + 1, 4)}`) : name,
      // As on Footle's card: a win says who it was as one quiet line under the
      // picture (the XP has the place under the verdict); after a loss the
      // name is the headline and "Out of guesses" stays under it.
      sub: won ? null : t("rc.footleLost"),
      note: won ? `${t("trail.itWas")} ${name}` : null,
      pinSub: true,
      // "3/4" here counts clubs, and fewer is better: on a button it would
      // read as three quarters of something. The button says "Share my
      // result"; the message it sends says the clubs in words.
      plainShare: true,
      // An old Trail pays nothing and neither does the static page: only a
      // host that really pays says so (`paysXp`, the app's DAILY_SERVICES).
      xp: isArchive || !paysXp ? 0 : getTrailXP(won),
    };
  })();
  // The app's one streak; on the static page, where there is none, the Trail's own.
  const finishStreak = dailyDone?.streak || { count: streak, label: t("dd.l.trail") };
  const shareText = useMemo(
    () => (done ? buildTrailShareText({ number, won, clubsUsed, streak }) : ""),
    [done, number, won, clubsUsed, streak]
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    // In the app the result goes as a picture (shareCardRender "trail"): the
    // text was a row of emoji balls, which chats blow up (23 Oct).
    if (shareCard) {
      const toast = (m) => window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: m }));
      return shareCard("trail", { num: number, won, clubsUsed, max: TRAIL_MAX_ATTEMPTS, streak, deepLink: "/trail" }, { textFallback: shareText, onToast: toast });
    }
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return false; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: `📋 ${tNow("game.copied")}` }));
    } catch {}
  }, [shareText, shareCard, number, won, clubsUsed, streak]);

  // Unrouted or a bad day index: land somewhere real rather than on a blank board.
  if (!career.length) {
    return (
      <div className="screen" style={{ padding: 24, textAlign: "center" }}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Transfer Trail</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>{t("trail.soon")}</div>
      </div>
    );
  }

  // What a "Career looks wrong?" report carries: the full ladder.
  const reportInfo = {
    id: `trail:${player.key}`,
    q: `${daily ? `Transfer Trail #${number}` : "Stitch-up"} — ${(player.display || []).join(" ")}: ${career.join(" → ")}`,
    picked: null,
    correct: (player.display || []).join(" "),
    mode: "trail",
  };

  // Club identity on the ladder, mirroring the Club Quiz rows. CLUB_PACKS
  // carries {name, color}; the resolver handles the fact that careers say
  // "Man Utd" where the packs say "Man United".
  // tint / lift / onColour now live in lib/clubColour.js alongside the lookup,
  // because Stadiums needs the identical treatment and two copies of colour
  // maths is how two screens drift into painting the same club differently.
  const packColours = CLUB_PACK_COLOURS;

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: kbInset ? 20 + kbInset : "var(--foot-clear, 20px)", maxWidth: 640, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
      {/* Only for a solve made now. It used to fall again on every review of a
          solved Trail. */}
      {won && !finishedBefore(savedAtMount.current.status) && Confetti ? <Confetti /> : null}

      <div style={{ display: "flex", alignItems: "center", gap: trailCard ? 12 : 10, padding: embedded ? "2px 4px 8px" : "8px 4px" }}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
        {/* embedded: on the static page the H1 above already names the game,
            so the title row becomes one masthead line, like Footle's — the
            number and the state, nothing said twice. Before the finish that
            is the number alone: "name the player from their career" was the
            H1 and the lead above, said a third time (declutter, 26 Oct 2026). */}
        {embedded ? (
          <div style={{ flex: trailCard ? "0 1 auto" : 1, minWidth: 0, fontSize: 13.5, color: "var(--t2)", fontVariantNumeric: "tabular-nums" }}>
            {number > 0 && <b style={{ color: "var(--t1)", fontWeight: 800 }}>Trail #{number}</b>}
            {done && <>{number > 0 ? " · " : ""}{t(won ? "trail.solved" : "trail.notThisTime")}</>}
          </div>
        ) : (
          <div style={{ flex: trailCard ? "0 1 auto" : 1, minWidth: 0 }}>
            <GameTitle no={number}>{daily ? "Transfer Trail" : t("su.title")}</GameTitle>
            <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
              <ChallengeBanner game="trail" edition={daily && !isArchive ? number : -1} finished={done}>
                {done ? t(won ? "trail.solved" : "trail.notThisTime") : (stitch?.sub || t("trail.sub"))}
              </ChallengeBanner>
            </div>
          </div>
        )}
        {/* ONCE THE RESULT IS UP THE STREAK HAS THIS CORNER (25 Nov 2026, as
            on Footle and the Daily 7): a small filled chip where the guesses
            left sat during play. The title keeps its own width and the chip
            takes what is left (components/StreakChip.jsx). */}
        {trailCard && <StreakChip streak={finishStreak} isArchive={isArchive} />}
        {!done && (
          /* Guesses left, drawn: one pip a guess, spent ones dimmed, the last
             one red. It was a bare number over a 9px "LEFT" (Alex's recording,
             12 Oct 2026: nothing said what the 5 counted). */
          <div role="img" aria-label={t("game.left", { count: left })} style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
              {Array.from({ length: TRAIL_MAX_ATTEMPTS }, (_, i) => (
                <i key={i} style={{ width: 9, height: 9, borderRadius: 5,
                                    background: i < left ? (left <= 1 ? "var(--red)" : "var(--t1)") : "var(--s3)" }} />
              ))}
            </div>
            <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: left <= 1 ? "var(--red)" : "var(--t2)", fontVariantNumeric: "tabular-nums" }}>
              {t("game.left", { count: left })}
            </div>
          </div>
        )}
      </div>

      {stitch?.Banner && !done && <stitch.Banner />}

      {/* ONCE THE RESULT IS UP THE LADDER IS NOT DRAWN (25 Nov 2026): its clubs
          are on the result card below (trailCard.picture), so the result is on
          screen once. A Stitch-up has no card and keeps its ladder. */}
      {!trailCard && (
      <div style={{ display: "flex", flexDirection: "column", gap: TRAIL_GAP, padding: "6px 2px" }}>
        {career.slice(0, shown).map((club, i) => {
          const col = clubColour(club, packColours);
          const prevCol = i > 0 ? clubColour(career[i - 1], packColours) : null;
          return (
            <div key={i} className="tt-club" style={{
              animationDelay: `${Math.max(0, i - prevShown.current) * 70}ms`,
              position: "relative",
              display: "flex", alignItems: "center", gap: 11,
              background: col ? `linear-gradient(90deg, ${tint(lift(col), 0.3)} 0%, ${tint(lift(col), 0.05)} 100%)` : "var(--s1)",
              border: `1px solid ${col ? tint(lift(col), 0.45) : "var(--border)"}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              {/* THE TRAIL ITSELF (2026-10-08). The game is called a trail and
                  drew none: the clubs were stacked boxes with nothing joining
                  them. A short link now runs from the club above to this one,
                  under the two crests, shading from that club's colour into
                  this one's. It is a child of the row, so it arrives with it. */}
              {i > 0 && (
                <span aria-hidden="true" style={{
                  position: "absolute", left: 51, top: -(TRAIL_GAP + 1), width: 2, height: TRAIL_GAP,
                  borderRadius: 1,
                  background: `linear-gradient(${prevCol ? lift(prevCol) : "var(--border2)"}, ${col ? lift(col) : "var(--border2)"})`,
                }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", width: 12, flexShrink: 0 }}>{i + 1}</span>
              <span aria-hidden="true" style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                background: col ? crestPaint(col).bg : "var(--s3)", color: col ? crestPaint(col).ink : "var(--t3)",
              }}>{clubAbbr(club, CLUB_PACK_ABBR)}</span>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--t1)", flex: 1, minWidth: 0 }}>{club}</span>
              {/* ⚠️ RETURN SPELLS READ AS ERRORS WITHOUT THIS. The two most
                  reported careers in question_reports — Alonso (3 reports) and
                  Flamini (3) — are exactly the two whose puzzles show the same
                  club twice, and both are Wikipedia-verified correct (the spec
                  deliberately renders return spells as separate rungs). A
                  player who does not know about the Eibar loan sees "Real
                  Sociedad" twice and concludes the career is wrong; the data
                  was never the problem, the silence was. One word turns
                  "looks broken" into "learned something". */}
              {career.slice(0, i).includes(club) && (
                <span style={{ fontSize: 10.5, color: "var(--t3)", fontWeight: 700, flexShrink: 0 }}>{t("trail.return")}</span>
              )}
              {player.loans?.[i] && (
                <span style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>{t("trail.loan")}</span>
              )}
            </div>
          );
        })}
      </div>
      )}

      {hint && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 11,
                      background: "rgba(255,193,7,0.10)", border: "1px solid rgba(255,193,7,0.3)",
                      color: "var(--gold)", fontSize: 13, fontWeight: 700 }}>
          {hint}
        </div>
      )}

      {wrongOnes.length > 0 && !done && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {wrongOnes.map((a, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", textDecoration: "line-through",
                                   textDecorationColor: "var(--red)", background: "var(--s2)", borderRadius: 8, padding: "5px 10px" }}>{a.text}</span>
          ))}
        </div>
      )}
      {/* A wrong guess that took in every club on the board (design review,
          15 Oct 2026: Falcao against Atlético Madrid and Man Utd was struck
          through without a word). Read the trail right, took the wrong path
          from it: worth saying, and true by the career record. Polite live
          region, so a screen reader hears it after the strike-through. */}
      {notes.length > 0 && !done && (
        <div role="status" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, padding: "0 4px" }}>
          {notes.map((a, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", lineHeight: 1.35 }}>{a.note}</div>
          ))}
        </div>
      )}

      {!done && (
        <>
          <div ref={inputWrapRef} style={{ position: "relative", marginTop: 14, display: "flex", gap: 8,
                        transform: shake ? "translateX(-4px)" : "none", transition: "transform .12s" }}>
            <input
              ref={inputRef}
              value={entry}
              onFocus={ensurePool}
              onChange={(e) => { ensurePool(); setEntry(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // lib/trail.js, enterGuess: a guess is a player, never loose text.
                const name = enterGuess({ text: entry, isAnswer: guessMatchesPlayer(entry.trim(), player), top: suggestions[0]?.name, poolReady: pool.length > 0 });
                if (name) submit(false, name);
                else if (entry.trim()) { setShake(true); setTimeout(() => setShake(false), 420); }
              }}
              placeholder={t("game.typePlayer")}
              aria-label={t("game.yourGuess")}
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
              style={{ flex: 1, minWidth: 0, background: "var(--s1)", border: "1px solid var(--border)",
                       borderRadius: 12, padding: "13px 15px", color: "var(--t1)", fontSize: 16,
                       fontFamily: "inherit", outline: "none" }}
            />
            {/* No Guess button (Alex, 13 Oct 2026). Every real guess goes through a
                suggestion or Enter, and the button's only other use was sending
                text that was no player. The box takes the whole row. */}
            {suggestions.length > 0 && (
              // ⚠️ PLAYER-REPORTED ON DEVICE, 2026-08-23: "i still can not scroll
              // down to see more names, the keyboard seems stuck over it".
              //
              // Two separate causes, and fixing only one leaves it broken:
              //   · This list is position:absolute, so it contributes NOTHING to
              //     page height. Bottom padding on the root — the usual fix, and
              //     the one applied above — cannot reach it: there is no page
              //     below the keyboard to scroll to, because the list is floating
              //     over it. It needed its own bound.
              //   · Trail took only HALF the keyboard hook. useKeyboardAwareInput
              //     says in its own docstring "TWO HALVES, and a mode needs both",
              //     and Trail — the mode the hook was EXTRACTED FROM — destructured
              //     keepInputVisible and left kbInset behind, with paddingBottom
              //     hardcoded to 20. Mystery and Stadiums both take both.
              //
              // maxHeight is measured against the visual viewport, which already
              // excludes the keyboard on iOS, so the list is sized to the space
              // that actually exists and scrolls inside it. 132px keeps at least
              // two rows reachable even on a short screen with a tall keyboard.
              <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 20, marginTop: 6,
                            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 14,
                            maxHeight: dropMax, overflowY: "auto", WebkitOverflowScrolling: "touch",
                            overscrollBehavior: "contain",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                {suggestions.map((p) => (
                  <button key={p.id} type="button" onClick={() => submit(false, p.name)}
                    onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                             width: "100%", padding: "9px 14px", background: "none", border: "none",
                             borderBottom: "1px solid var(--border)", color: "var(--t1)", cursor: "pointer",
                             fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: "var(--t3)", fontWeight: 600, maxWidth: "100%",
                                   whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {suggestionSubtitle(p, { club: false })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {entry.trim().length >= 2 && pool.length > 0 && suggestions.length === 0 && !guessMatchesPlayer(entry.trim(), player) && (
            <div role="status" style={{ marginTop: 8, padding: "0 4px", fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>
              {t("trail.noPlayer")}
            </div>
          )}
          <button onClick={() => submit(true)}
            onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}
            /* minHeight, not padding: this is full-width so nothing shifts
               sideways, and 10px padding around 13px text landed at 38px —
               six short of the 44px floor (experience audit, 2026-08-23). */
            style={{ marginTop: 8, width: "100%", minHeight: 44, background: "transparent", border: "1px solid var(--border)",
                     borderRadius: 11, padding: "10px", color: "var(--t2)", fontSize: 13, fontWeight: 700,
                     fontFamily: "inherit", cursor: "pointer" }}>
            {t("trail.skip")}
          </button>
        </>
      )}

      {done && trailCard && (
        /* THE FINISH AS ONE OBJECT (25 Nov 2026): the card with the career and
           one quiet Share button, then the caption, the other dailies as one
           list and the quiet lines (components/DailyDone.jsx, layout "one",
           which has the why). 6px here and the header's own 8 put the card 14
           under the header, as on Footle and the Daily 7. */
        <div style={{ marginTop: 6 }}>
          <DailyDone
            game="trail"
            card={trailCard}
            layout="one"
            edition={number}
            won={won}
            bucket={won ? clubsUsed : 0}
            isArchive={isArchive}
            streak={finishStreak}
            promoted={dailyDone?.promoted}
            onShare={onShare}
            remind={dailyDone?.remind}
            nextUp={dailyDone?.nextUp || []}
            day={dailyDone?.day}
            save={dailyDone?.save}
            GetAppCTA={GetAppCTA}
            track={dailyDone?.track}
            bucketMax={career.length}
            stitch={dailyDone?.stitch}
          />
          {/* The way out, as the quiet filled pill; then the report link. */}
          <ResultFoot onHome={onBack} pill />
          {/* A wrong career order is UNFALSIFIABLE to the player: they cannot
              tell a puzzle they misread from data we got wrong, so without this
              they simply lose trust and say nothing. Same trust class as a wrong
              answer key. Sends the full ladder so the row is actionable. */}
          <ReportLink thing="Career" onReport={onReport} info={reportInfo} style={{ marginTop: 12 }} />
        </div>
      )}
      {done && stitch && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--t2)" }}>{t("trail.itWas")}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--t1)", marginTop: 2 }}>
            {(player.display || []).join(" ")}
          </div>
          <stitch.Done won={won} clubsUsed={clubsUsed} />
          {/* A stitch-up's own panel above carries the way out, so it takes
              the report link alone. */}
          <ReportLink thing="Career" onReport={onReport} info={reportInfo} style={{ marginTop: 10 }} />
        </div>
      )}
    </div>
  );
}

/**
 * The app's daily route (App.jsx, `screen === "trail"`): the screen above with
 * the day's career resolved HERE, inside the lazy chunk. App.jsx used to call
 * getTrailAnswer(day) itself and pass the player in, which put every career in
 * lib/trail.js on Home's eager JavaScript (24 Nov 2026).
 *
 * ⚠️ The career is resolved for the SAME `date` the screen is told it is
 * showing. An archive date with today's player would store today's answer
 * under yesterday's key: the board would look right and the saved result
 * would be a lie.
 *
 * No career for that day: nothing is drawn and the player is sent back, as the
 * route did. App.jsx asks hasTrailOn(day) first, so this is the second lock.
 */
export function DailyTransferTrail({ date, onBack, ...rest }) {
  const player = getTrailAnswer(date);
  useEffect(() => {
    if (player || !onBack) return undefined;
    const id = setTimeout(onBack, 0);
    return () => clearTimeout(id);
  }, [player, onBack]);
  if (!player) return null;
  return <TransferTrail player={player} date={date} onBack={onBack} {...rest} />;
}
