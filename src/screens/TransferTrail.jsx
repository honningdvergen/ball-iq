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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dateToYMD } from "../lib/date.js";
import {
  TRAIL_MAX_ATTEMPTS,
  getTrailNumber,
  guessMatchesPlayer,
  cluesShown,
  hintFor,
  computeTrailStreak,
  buildTrailShareText,
} from "../lib/trail.js";
// ⚠️ NO IMPORT FROM App.jsx. This screen also mounts as an island on the static
// /transfer-trail/ page (src/islands/trail.jsx), and an island that imported
// App.jsx would bundle the whole monolith. Haptics, sound and confetti arrive
// through `services` (src/games/dailyServices.js); the club colours and codes
// come from a module gen-club-index.mjs writes out of App.jsx on every build.
import { resolveDailyServices } from "../games/dailyServices.js";
import { clubColour, clubAbbr, tint, lift, onColour } from "../lib/clubColour.js";
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
import { rankPlayerSuggestions, suggestionSubtitle } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight } from "../lib/useKeyboardAwareInput.js";
import ReportButton from "../components/ReportButton.jsx";

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

export default function TransferTrail({ player, date = new Date(), onBack, onReport, onPlayMystery, services, embedded = false }) {
  const { haptic, playSound, Confetti, GetAppCTA } = resolveDailyServices(services);
  const ymd = dateToYMD(date);
  const number = getTrailNumber(date);
  const career = useMemo(() => player?.clubs || [], [player]);

  // Attempts are the raw submissions — { text, skipped } — and everything else
  // derives. Same store-inputs-not-derived-state rule as Footle, so a mid-game
  // reload rebuilds the exact board rather than trusting a cached verdict.
  const [attempts, setAttempts] = useState(() => loadDay(ymd)?.attempts || []);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  const won = attempts.some((a) => !a.skipped && guessMatchesPlayer(a.text, player));
  const misses = attempts.filter((a) => a.skipped || !guessMatchesPlayer(a.text, player)).length;
  const lost = !won && misses >= TRAIL_MAX_ATTEMPTS;
  const done = won || lost;

  const shown = done ? career.length : cluesShown(misses, career.length);
  const clubsUsed = won ? cluesShown(misses, career.length) : career.length;
  const hint = done ? null : hintFor(player, misses);
  const left = Math.max(0, TRAIL_MAX_ATTEMPTS - misses);

  useEffect(() => {
    // arc: archive plays are visible history but never streak fuel — the
    // walks in lib/trail.js break on it (same stamp as Footle and Mystery).
    saveDay(ymd, { status: won ? "won" : lost ? "lost" : "playing", attempts, ...(isArchive ? { arc: 1 } : {}) });
  }, [ymd, attempts, won, lost]);

  // Fire the shared daily-completed event exactly once. App.jsx listens and
  // cancels the evening reminder, awards XP and writes the `scores` row — a mode
  // that stays silent here is invisible in the only table anyone queries, which
  // is how Footle went months looking unplayed. Ref-guarded because the screen
  // re-mounts whenever you navigate back into a finished puzzle.
  const announced = useRef(false);
  // ⚠️ ARCHIVE PLAYS DO NOT COUNT. The Trail already accepted a `date`, but it
  // announced completion whichever day it was — so replaying an old puzzle
  // would have ticked today's streak and paid XP. That turns the archive into
  // a way to farm the streak, and a farmable streak stops meaning "I showed up
  // every day", which is the only reason it exists. The board still records
  // the solve; only the habit metrics are protected.
  const isArchive = ymd !== dateToYMD(new Date());
  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
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
  const { pool, ensure: ensurePool } = usePlayerPool();
  const suggestions = useMemo(
    () => rankPlayerSuggestions(pool, entry, { limit: 6 })
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

  const streak = useMemo(() => (won ? computeTrailStreak(date) : 0), [won, date]);
  const shareText = useMemo(
    () => (done ? buildTrailShareText({ number, won, clubsUsed, streak }) : ""),
    [done, number, won, clubsUsed, streak]
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch {}
  }, [shareText]);

  // Unrouted or a bad day index: land somewhere real rather than on a blank board.
  if (!career.length) {
    return (
      <div className="screen" style={{ padding: 24, textAlign: "center" }}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Transfer Trail</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>Coming soon — a new career to name every day.</div>
      </div>
    );
  }

  const wrongOnes = attempts.filter((a) => !a.skipped && !guessMatchesPlayer(a.text, player));

  // Club identity on the ladder, mirroring the Club Quiz rows. CLUB_PACKS
  // carries {name, color}; the resolver handles the fact that careers say
  // "Man Utd" where the packs say "Man United".
  // tint / lift / onColour now live in lib/clubColour.js alongside the lookup,
  // because Stadiums needs the identical treatment and two copies of colour
  // maths is how two screens drift into painting the same club differently.
  const packColours = CLUB_PACK_COLOURS;

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 20 + kbInset, maxWidth: 640, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
      {won && Confetti ? <Confetti /> : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: embedded ? "2px 4px 8px" : "12px 4px" }}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        {/* embedded: on the static page the H1 above already names the game,
            so the title row becomes one masthead line, like Footle's — the
            number and the state, nothing said twice. */}
        {embedded ? (
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "var(--t2)", fontVariantNumeric: "tabular-nums" }}>
            {number > 0 && <><b style={{ color: "var(--t1)", fontWeight: 800 }}>Trail #{number}</b>{" · "}</>}
            {done ? (won ? "Solved" : "Not this time") : "name the player from their career"}
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>
              Transfer Trail{number > 0 ? ` #${number}` : ""}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
              {done ? (won ? "Solved" : "Not this time") : "Name the player from their career"}
            </div>
          </div>
        )}
        {!done && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: left <= 1 ? "var(--red)" : "var(--t1)" }}>{left}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)" }}>left</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "6px 2px" }}>
        {career.slice(0, shown).map((club, i) => {
          const col = clubColour(club, packColours);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 11,
              background: col ? `linear-gradient(90deg, ${tint(lift(col), 0.3)} 0%, ${tint(lift(col), 0.05)} 100%)` : "var(--s1)",
              border: `1px solid ${col ? tint(lift(col), 0.45) : "var(--border)"}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", width: 12, flexShrink: 0 }}>{i + 1}</span>
              <span aria-hidden="true" style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                background: col || "var(--s3)", color: col ? onColour(col) : "var(--t3)",
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
                <span style={{ fontSize: 10.5, color: "var(--t3)", fontWeight: 700, flexShrink: 0 }}>↩ return</span>
              )}
              {player.loans?.[i] && (
                <span style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>loan</span>
              )}
            </div>
          );
        })}
      </div>

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
            <span key={i} style={{ fontSize: 12.5, color: "var(--t3)", textDecoration: "line-through",
                                   background: "var(--s2)", borderRadius: 8, padding: "4px 9px" }}>{a.text}</span>
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
              onKeyDown={(e) => { if (e.key === "Enter") submit(false); }}
              placeholder="Type a player’s name…"
              aria-label="Your guess"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
              style={{ flex: 1, minWidth: 0, background: "var(--s1)", border: "1px solid var(--border)",
                       borderRadius: 12, padding: "13px 15px", color: "var(--t1)", fontSize: 16,
                       fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={() => submit(false)} disabled={!entry.trim()}
              style={{ flexShrink: 0, padding: "0 20px", borderRadius: 12, border: "none",
                       background: entry.trim() ? "var(--accent)" : "var(--s2)",
                       color: entry.trim() ? "var(--grn-ink)" : "var(--t3)", fontWeight: 800, fontSize: 14,
                       fontFamily: "inherit", cursor: entry.trim() ? "pointer" : "default" }}>Guess</button>
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
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                             width: "100%", padding: "9px 14px", background: "none", border: "none",
                             borderBottom: "1px solid var(--border)", color: "var(--t1)", cursor: "pointer",
                             fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: "var(--t3)", fontWeight: 600, maxWidth: "100%",
                                   whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {suggestionSubtitle(p)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => submit(true)}
            /* minHeight, not padding: this is full-width so nothing shifts
               sideways, and 10px padding around 13px text landed at 38px —
               six short of the 44px floor (experience audit, 2026-08-23). */
            style={{ marginTop: 8, width: "100%", minHeight: 44, background: "transparent", border: "1px solid var(--border)",
                     borderRadius: 11, padding: "10px", color: "var(--t2)", fontSize: 13, fontWeight: 700,
                     fontFamily: "inherit", cursor: "pointer" }}>
            Skip — show me another club
          </button>
        </>
      )}

      {done && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--t2)" }}>It was</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--t1)", marginTop: 2 }}>
            {(player.display || []).join(" ")}
          </div>
          <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 6 }}>
            {won
              // ⚠️ Archive plays deliberately do NOT tick the streak (see the
              // effect above, which returns early when isArchive), so claiming
              // one here would credit the player for something that did not
              // happen. Same class as "back tomorrow" on a puzzle from the past.
              ? `Got it on ${clubsUsed} club${clubsUsed === 1 ? "" : "s"}${!isArchive && streak > 1 ? ` · 🔥 ${streak}-day Trail streak` : ""}`
              : isArchive
                ? "Out of guesses — that one's in the books"
                : "Out of guesses — back tomorrow"}
          </div>
          {/* On a LOSS the session's natural next beat is the other daily,
              not sharing a defeat — chain into Mystery Player when the parent
              offers it (live, today's, unplayed) and demote share. Wins keep
              share as the primary: that's the brag moment. */}
          {lost && onPlayMystery ? (
            <>
              <button onClick={onPlayMystery}
                style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 999, border: "none",
                         background: "var(--accent)", color: "var(--grn-ink)", fontWeight: 800, fontSize: 15,
                         fontFamily: "inherit", cursor: "pointer" }}>Try Mystery Player →</button>
              <button onClick={onShare}
                style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                         border: "1px solid var(--border)", background: "transparent", color: "var(--t1)",
                         fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>Share result</button>
            </>
          ) : (
            <button onClick={onShare}
              style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 999, border: "none",
                       background: "var(--accent)", color: "var(--grn-ink)", fontWeight: 800, fontSize: 15,
                       fontFamily: "inherit", cursor: "pointer" }}>Share result</button>
          )}
          {/* A wrong career order is UNFALSIFIABLE to the player — they cannot
              tell a puzzle they misread from data we got wrong, so without this
              they simply lose trust and say nothing. Same trust class as a wrong
              answer key. Sends the full ladder so the row is actionable. */}
          <ReportButton
            onReport={onReport}
            idle="⚑ Career looks wrong? Tell us"
            info={{
              id: `trail:${player.key}`,
              q: `Transfer Trail #${number} — ${(player.display || []).join(" ")}: ${career.join(" → ")}`,
              picked: null,
              correct: (player.display || []).join(" "),
              mode: "trail",
            }}
            style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                     border: "1px solid var(--border)", background: "transparent",
                     fontWeight: 700, fontSize: 13 }}
          />

          {/* The island passes a phone-only app link here; the app passes nothing. */}
          {GetAppCTA ? <div style={{ marginTop: 10 }}><GetAppCTA /></div> : null}

          {onBack && (
            <button onClick={onBack}
              style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                       border: "1px solid var(--border)", background: "transparent", color: "var(--t2)",
                       fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>Back home</button>
          )}
        </div>
      )}
    </div>
  );
}
