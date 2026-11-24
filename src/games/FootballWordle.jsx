// ── FOOTLE — the daily surname game, as one component for two hosts ──────────
// Moved out of App.jsx on 2026-09-05 (it lived there as ~480 lines from the
// first version) so that the static /football-wordle/ page can render the
// SAME game as an island (src/islands/footle.jsx) — Alex's brief for the
// website critique of that day: the app's Footle interface is the design; do
// not re-draw it, and never re-implement the grader (duplicate-letter scoring
// drifted once already). Behaviour in the app is unchanged: App.jsx passes
// its own haptics, sound, confetti, install banner, share card and cloud sync
// through `services`; the island passes light equivalents.
//
// Storage is the same key on both hosts (biq_wordle_<date>), so a guest who
// plays on the website and later opens the app on the same phone finds today
// already played — one puzzle, one record.
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChallengeBanner from "../components/ChallengeBanner.jsx";
import InAppStrip, { useInAppStrip } from "../components/InAppStrip.jsx";
import {
  WORDLE_FULL_NAMES, footleAnswerFor, gradeWordleGuess, computeFootleStreak, getFootleNumber,
  footleClue, footleShareHead, FOOTLE_CLUE_AFTER,
} from '../lib/wordle.js';
import { Lightbulb, CircleHelp } from 'lucide-react';
import { getWordleDateKey } from '../lib/wordleStatus.js';
import { safeSetItem } from '../safeStorage.js';
import { APP_NAME } from '../lib/scoring.js';
import GameTitle from "../components/GameTitle.jsx";
import { getFootleXP } from '../lib/footleXp.js';
import ResultFoot, { ReportLink } from '../components/ResultFoot.jsx';
import { DailyDone } from '../components/DailyDone.jsx';
import { StreakChip } from '../components/StreakChip.jsx';
import { t, useT, fmtLocaleEnglish } from '../i18n/index.js';
import '../i18n/en.js'; // the full English table: not on Home's eager path
import { rich } from '../i18n/rich.jsx';
import './footle.css';

// Per-tile flip duration; the reveal waits for the whole row to turn.
export const WORDLE_FLIP_MS = 180;

// Colour-blind palette state, read where share strings are built so the
// emoji squares match the tiles the player actually saw (🟧🟦 vs 🟩🟨).
function CB_MODE() {
  try { return document.documentElement.classList.contains("biq-cb"); } catch { return false; }
}

// What the app shell supplies. Every key is optional; these are the inert
// versions so the board plays anywhere React can mount.
export const DEFAULT_SERVICES = {
  haptic: () => {},
  playSound: () => {},
  markBadReviewMoment: () => {},
  onSync: null,                // (dateKey, state) => void — cloud sync for a signed-in player
  shareCard: async (_type, _data, { textFallback, onToast } = {}) => {
    try {
      if (navigator.share) { await navigator.share({ text: textFallback }); return; }
      await navigator.clipboard.writeText(textFallback || '');
      onToast?.(t('game.copied'));
    } catch (e) {
      // AbortError is the user closing the share sheet — nothing to say. Any
      // other failure (no clipboard, unfocused document) must not be silent:
      // a button that does nothing is the one thing a result card cannot have.
      if (e?.name === 'AbortError') return false; // no "Shared" tick for a dismissed sheet
      onToast?.(t('game.copyFailed'));
    }
  },
  Confetti: null,
  InstallBanner: null,
  dailyDone: null,
  GetAppCTA: () => null,
  isNative: false,
};

function getWordleKeyState(letter, guesses, answer) {
  let best = null;
  for (const g of guesses) {
    const grades = gradeWordleGuess(g, answer);
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== letter) continue;
      const c = grades[i];
      if (c === "green") return "green";
      if (c === "yellow" && best !== "green") best = "yellow";
      if (c === "grey" && !best) best = "grey";
    }
  }
  return best;
}

const WORDLE_KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M","DEL"],
];

// ⚠️ The report control was a 40px bordered button carrying 10px of its own
// margin ON TOP of the result card's 8px gap — the biggest element in the
// reward panel, spent on its rarest action. Alex on device 2026-09-09: the grey
// box has too much read space. It is now quiet underlined text (the
// .dd-share-alt idiom), which gives the box back ~34pt and stops a correction
// competing with the celebration.
function FootleReportButton({ answer, status, onReport }) {
  const [prefix, surname] = WORDLE_FULL_NAMES[answer] || ["", answer];
  return (
    <ReportLink
      thing="Answer"
      onReport={onReport}
      info={{
        id: `footle:${answer}`,
        q: `Footle answer "${answer}" (${(prefix ? prefix + " " : "") + surname})`,
        picked: null,
        correct: answer,
        mode: status === "won" ? "footle" : "footle-lost",
      }}
      // Inside the result card it stays as small as it was: no 44pt box here.
      // No auto margin: it shares its row with "How to play" (.wd-report-row).
      style={{ margin: 0, padding: 0, minHeight: 0, fontSize: 12 }}
    />
  );
}

// The word over a win, by how many guesses it took. It said "Brilliant!" for
// every win, a sixth-guess scrape included (play-test, 14 Oct 2026).
// The six words are footle.win1..6 in src/i18n/en.js.
export function footleWinWord(n) { return t(`footle.win${Math.min(Math.max(n, 1), 6)}`); }

export const FootballWordle = React.memo(function FootballWordle({ onBack, userId, onHowToPlay, onReport, date: dateProp, services }) {
  const t = useT();
  // ⚠️ THE DAY IS FIXED WHEN THE BOARD OPENS (review, 17 Oct 2026). `date`
  // used to default to `new Date()` on EVERY render, and a finished board
  // re-renders every second for its countdown, so just after midnight the key,
  // the answer and the save all moved to the new day before the 5 s rollover
  // reload below: yesterday's win was written into today's record, and a
  // player reopening at 00:00 met a "won" Footle graded against the new word.
  // A live board now keeps the day it opened on until that reload.
  const [openedAt] = useState(() => new Date());
  const date = dateProp || openedAt;
  // Everything the screen needs from the app shell arrives here; the island
  // passes its own (src/islands/footle.jsx). Missing keys fall back to inert.
  const { haptic, playSound, markBadReviewMoment, onSync, shareCard, Confetti, InstallBanner, GetAppCTA, isNative, dailyDone, paysXp } = { ...DEFAULT_SERVICES, ...(services || {}) };
  // The in-app-browser app strip (components/InAppStrip.jsx). The shell's own
  // isNative is checked on top of the strip's three native signals.
  const inAppStrip = useInAppStrip();
  const inApp = isNative ? { src: null, dismiss: inAppStrip.dismiss } : inAppStrip;
  // One puzzle per day — answer + storage key derive from today's date and
  // automatically resync on the day-rollover reload below.
  // `date` drives the storage key AND the answer together — they must never be
  // derived from different days, which is precisely the bug the timezone
  // comment in lib/wordle.js describes (key from local date, answer from UTC,
  // so a player got tomorrow's word stored under today's key).
  const dateKey = getWordleDateKey(date);
  // An archive board is one opened FOR another day, not one that the clock
  // has walked past: a live board after midnight is still live (and reloads).
  const isArchive = dateKey !== getWordleDateKey(openedAt);
  const storageKey = `biq_wordle_${dateKey}`;
  const answer = useMemo(() => footleAnswerFor(date), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audit Phase 5 (C2): track shake (450ms) + reveal (~2-3s) setTimeouts
  // so we can clear them on unmount. Without this, setShake(false) and
  // setRevealed(true) could fire on unmounted component if the user backs
  // out mid-animation.
  const timeoutsRef = useRef([]);
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // ⚠️ WHICH ROW IS ALLOWED TO FLIP. `wd-flip` used to sit on EVERY completed
  // row unconditionally, which is wrong twice over: re-opening a finished
  // puzzle re-played all six reveals from scratch, and a completed row kept a
  // live 3D-transform animation (and its compositing layer) forever — so the
  // board carried up to 36 animated layers on a screen that is not animating.
  // Reported on device 2026-09-09: "I got the right answer on the last attempt
  // and the reveal happened on all six rows instead of just the last."
  // Only the row submitted THIS moment flips, and the class is dropped the
  // instant the reveal finishes, so no engine can restart an animation that is
  // no longer declared. -1 = nothing animating, which is the state on mount.
  const [animRow, setAnimRow] = useState(-1);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.guesses)) return parsed;
      }
    } catch {}
    return { guesses: [], status: "playing" };
  });
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(false);
  // HARD MODE (Alex, 14 Oct 2026): opt-in, only a real footballer's name
  // counts as a guess. The default stays as it was, any letters accepted, on
  // purpose: a strict Footle was too hard for most players. The switch works
  // at any point in the game (Alex, 28 Oct: he wanted out after his first row).
  // The day's record (`state.hard`) stays true only while EVERY guess so far was
  // made in hard mode, so turning it on late cannot earn the "Hard" result. The
  // names (src/data/footleNames.json, scripts/gen-footle-names.mjs) load only
  // when hard mode is on.
  const [hardPref, setHardPref] = useState(() => { try { return localStorage.getItem("biq_footle_hard") === "1"; } catch { return false; } });
  const [hardNames, setHardNames] = useState(null);
  const [revealed, setRevealed] = useState(() => {
    // If the user already finished today's puzzle, reveal the result card on
    // mount instead of waiting for the flip-animation timer.
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.status === "won" || parsed?.status === "lost";
      }
    } catch {}
    return false;
  });

  // 1.1: whether today's puzzle was ALREADY finished when this screen
  // mounted. Distinguishes a fresh solve (fire confetti once) from re-opening
  // a solved puzzle later in the day (no confetti on every revisit).
  const wasFinishedAtMount = useRef(state.status !== "playing");
  // The game's end is the "natural pause" the deferred consent bar waits for on
  // Footle arrivals (index.html sets __biqConsentDefer = 'game' for /footle).
  // Without this the bar would wait until the player left the screen; with a
  // timer it would land mid-game and shrink the board (2026-09-23).
  //
  // ⚠️ NOT THE INSTANT THE GAME ENDS (2026-10-05). Fired on the status change,
  // the bar (143px on a phone) rose over the result as it appeared: at 393x852
  // it covered Share, the WhatsApp link and the third "still open" row, and at
  // 700px tall all three rows (product walkthrough, shots j2-04, j6-12). The
  // one moment a first-time player might share was the moment we covered the
  // button. So a fresh finish gets nine seconds with the whole result first
  // (about two of them are the tile flip); reopening a finished puzzle gets
  // three. A player who leaves inside that window is not asked on this visit,
  // which fails safe: Clarity and PostHog stay off for them.
  useEffect(() => {
    if (state.status === "playing") return;
    const t = setTimeout(() => {
      try {
        window.__biqConsentMomentFired = true;
        window.dispatchEvent(new Event("biq:consent-moment"));
      } catch { /* consent is a nicety here, never a reason to break the game */ }
    }, wasFinishedAtMount.current ? 3000 : 9000);
    return () => clearTimeout(t);
  }, [state.status]);

  // The rules sheet used to auto-open here, once, for a first-time player.
  // Alex, 2026-07-29: "do we really need the explainer first time someone opens
  // footle?" — no. Of its five lines, two repeated the card you tapped to get
  // here ("Surname of a footballer", "6 guesses"), two were the colour
  // convention, and the fifth ("guesses must be a real footballer's surname")
  // was simply untrue: submitGuess checks length and nothing else.
  //
  // The colour convention was the only line worth keeping, and a modal is the
  // wrong way to deliver it — colour is not prose. It is now a legend strip
  // above the grid (see below) that costs no taps and retires itself after the
  // first guess. The sheet stays reachable behind "?" for anyone who wants it.
  //
  // The first guess someone plays now happens without anything on top of it.
  const showLegend = state.status === "playing" && state.guesses.length === 0;

  // The result card's words (components/ResultCard.jsx via DailyDone). A win
  // shows the guess count out of six with the verdict beside it and the
  // answer's name under it; a loss has no score, and the name is the
  // headline.
  //
  // THE BOARD IS ON THE CARD (24 Nov 2026). Until now the finished board stayed
  // above the card and the card drew no picture: the result was on screen
  // twice, and Alex called it "thrown together … a divorced couple". The card
  // now carries the rows that were played (one to six, never the empty ones),
  // graded by the same gradeWordleGuess as the live board, and once the result
  // is up the board itself is not drawn. Tiles are capped at 48px and the grid
  // is centred whatever the name's length (footle.css, .wd-cg).
  const footleCard = (() => {
    if (state.status === "playing") return null;
    const [prefix, surname] = WORDLE_FULL_NAMES[answer] || ["", answer];
    const full = `${prefix ? `${prefix} ` : ""}${surname}`;
    const won = state.status === "won";
    const picture = (
      <div className={`wd-cg${state.guesses.length >= 5 ? " is-tall" : ""}`} style={{ "--wd-cols": answer.length }}>
        {state.guesses.map((gs, r) => {
          const grades = gradeWordleGuess(gs, answer);
          return (
            // One row is one picture to a screen reader: a label on a plain span is
            // not reliably read, so the tiles are hidden and the row says them all.
            <div className="wd-cg-row" key={r} role="img" aria-label={Array.from({ length: answer.length }, (_, i) => `${gs[i]}, ${t(grades[i] === "green" ? "footle.green" : grades[i] === "yellow" ? "footle.yellow" : "footle.grey")}`).join("; ")}>
              {Array.from({ length: answer.length }, (_, i) => (
                <span key={i} className={`wd-ct is-${grades[i]}`} aria-hidden="true">{gs[i]}</span>
              ))}
            </div>
          );
        })}
      </div>
    );
    return {
      picture,
      title: "Footle", tag: t("game.no", { n: getFootleNumber(date) }),
      score: won ? state.guesses.length : null, outOf: 6,
      verdict: won ? footleWinWord(state.guesses.length) : full,
      // A win says who it was as one quiet line UNDER the played rows (round
      // two, 24 Nov 2026): the XP has the place under the verdict. After a
      // loss the name is the headline and "Out of guesses" stays under it.
      sub: won ? null : t("rc.footleLost"),
      note: won ? t("footle.answerWas", { name: full }) : null,
      pinSub: true,
      // An old puzzle from the archive pays no XP (nothing is announced for
      // it, see the finish effect), so its card claims none. Nor does the
      // static /football-wordle/ page, which has no XP at all: only a host
      // that really pays says so (`paysXp`, the app's FOOTLE_SERVICES).
      xp: isArchive || !paysXp ? 0 : getFootleXP(won, state.guesses.length),
    };
  })();
  // The result is up: the last row has turned and the card is drawn.
  const over = state.status !== "playing" && revealed;
  // The app's one streak; on the static page, where there is none, Footle's own.
  const finishStreak = dailyDone?.streak || { count: state.status === "won" ? computeFootleStreak(date) : 0, label: t("dd.l.footle") };

  // The clue takes the legend's slot inside the board: the legend retires on
  // the first guess and the clue cannot appear before the third, so the two
  // never compete, and the keyboard geometry (footle-keyboard-geometry gate)
  // is untouched. Offered, never forced — a player chasing a clean grid just
  // keeps typing. Once taken it stays on the board for the rest of the day.
  const clueOffer = state.status === "playing" && !state.clue && state.guesses.length >= FOOTLE_CLUE_AFTER;
  const clueShown = !!state.clue && state.status === "playing";
  const takeClue = useCallback(() => {
    if (state.status !== "playing" || state.clue) return;
    setState((s) => ({ ...s, clue: 1 }));
    try { haptic("select"); } catch {}
    try { dailyDone?.track?.("footle-clue", { guesses: state.guesses.length, len: answer.length }); } catch {}
  }, [state.status, state.clue, state.guesses.length, answer.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist on every change to the game state.
  useEffect(() => {
    // Archive plays are stamped so history readers can tell a live day from
    // a back-filled one — the streak walks break on `arc` and the form strip
    // marks it. Without the stamp, catching up an old day silently extends
    // the local streak (reproduced 2026-08-20: an archive solve showed as a
    // 2-day streak). Same stamp in Trail and Mystery.
    // The answer rides with the record once a guess is in (footleAnswerFor in
    // lib/wordle.js): a later fetched schedule can never re-grade this board.
    const base = state.guesses.length > 0 ? { ...state, answer } : state;
    const rec = isArchive ? { ...base, arc: 1 } : base;
    safeSetItem(storageKey, JSON.stringify(rec));
    // Cross-device sync — push to profiles.wordle_state via atomic JSON
    // merge. Skip the empty-grid initial state to avoid a useless write.
    // ⚠️ The WHOLE record (review, 17 Oct 2026): `state` alone carried neither
    // the answer stamp nor the archive `arc` stamp, and the sign-in merge
    // (useAuth.jsx) writes the remote copy over the local one, so both were
    // wiped on the next launch.
    if (userId && state.guesses.length > 0 && onSync) onSync(dateKey, rec);
  }, [state, storageKey, userId, dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The header's own "Next 05:23:11" box is gone (24 Nov 2026). The agreed
  // finish has a plain header, and the time to the next puzzles is one quiet
  // line of the finish panel (DailyDone, "new puzzles in 5h 23m"), which was
  // already saying it a second time. With the box went its one-second clock,
  // which re-rendered this whole screen sixty times a minute to print it.

  // Detect day rollover while the screen is open — full reload so the new
  // day's answer, storageKey and game state all resync together.
  //
  // ⚠️ NEVER ON AN ARCHIVE BOARD. `isArchive` IS `dateKey !== today` (line
  // ~124) — the very condition this watcher reloads on. So every History →
  // Yesterday → Footle replay hard-reloaded the app five seconds after it
  // opened, every time, dumping the player on Home mid-guess. The feature
  // Alex asked for twice was 100% unplayable and no gate could see it: both
  // halves are individually correct, they just share one predicate with
  // opposite intent. Found by playing the build in the simulator, 2026-09-09.
  useEffect(() => {
    if (isArchive) return undefined;
    const id = setInterval(() => {
      if (getWordleDateKey() !== dateKey) window.location.reload();
    }, 5000);
    return () => clearInterval(id);
  }, [dateKey, isArchive]);

  // Never on an archive replay: the switch is not offered there.
  const hardNow = !isArchive && hardPref;
  useEffect(() => {
    if (!hardNow || hardNames) return undefined;
    let live = true;
    import("../data/footleNames.json").then((m) => { if (live) setHardNames(new Set(m.default)); })
      // If the list cannot load (offline after a deploy), hard mode stands aside
      // rather than refusing every guess but the answer.
      .catch(() => { if (live) setHardNames("failed"); });
    return () => { live = false; };
  }, [hardNow, hardNames]);
  const toggleHard = () => {
    const v = !hardPref;
    setHardPref(v);
    try { localStorage.setItem("biq_footle_hard", v ? "1" : "0"); } catch { /* private mode */ }
    // Mid-game, say what the switch does to today's result.
    if (state.guesses.length > 0) {
      const msg = !v ? (state.hard ? "footle.hardOff" : null) : (state.hard ? null : "footle.hardLate");
      if (msg) { try { window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: t(msg) })); } catch { /* no toast here */ } }
    }
  };

  const submitGuess = useCallback(() => {
    if (state.status !== "playing") return;
    if (current.length !== answer.length) {
      setShake(true);
      timeoutsRef.current.push(setTimeout(() => setShake(false), 450));
      // Say why. Until 21 Nov 2026 a short guess only shook the row: Clarity
      // counted 298 taps on ENTER in one week that changed nothing on screen,
      // the most of any control on the page. A player who types SALAH into an
      // eight-letter row was never told the name has eight letters.
      try { window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: t("footle.short", { n: answer.length }) })); } catch { /* no toast here */ }
      return;
    }
    if (hardNow && hardNames !== "failed" && current !== answer && !(hardNames && hardNames.has(current))) {
      setShake(true);
      timeoutsRef.current.push(setTimeout(() => setShake(false), 450));
      try { window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: t(hardNames ? "footle.hardUnknown" : "footle.hardLoading") })); } catch { /* no toast here */ }
      return;
    }
    const newGuesses = [...state.guesses, current];
    let newStatus = "playing";
    if (current === answer) newStatus = "won";
    else if (newGuesses.length >= 6) newStatus = "lost";
    // Spread, not a fresh object: `clue` rides in the same record.
    setState({ ...state, guesses: newGuesses, status: newStatus, ...(!isArchive ? { hard: state.guesses.length === 0 ? hardPref : !!state.hard && hardPref } : {}) });
    setCurrent("");
    // The reveal belongs to this row alone. Cleared after the last tile lands
    // (delay of the final tile + the 500ms flip) plus a little slack, so the
    // class never disappears mid-turn.
    const rowIdx = newGuesses.length - 1;
    setAnimRow(rowIdx);
    timeoutsRef.current.push(setTimeout(
      () => setAnimRow((r) => (r === rowIdx ? -1 : r)),
      (answer.length - 1) * WORDLE_FLIP_MS + 580,
    ));
    if (newStatus !== "playing") {
      setRevealed(false);
      timeoutsRef.current.push(setTimeout(() => setRevealed(true), answer.length * WORDLE_FLIP_MS + 200));
      // Win/loss feedback at the moment of truth (scan #3) — playSound
      // self-gates on the user's sound setting.
      if (newStatus === "won") { try { haptic("correct"); playSound("correct"); } catch {} }
      else {
        try { haptic("wrong"); playSound("wrong"); } catch {}
        // ⚠️ THE MOST BRUISING TWO MINUTES IN THE PRODUCT, and it marked nothing.
        // Footle is lost on 38% of the days it is played (180 of 641), and until
        // now the rating engine had no idea: a player could burn six guesses,
        // miss, open a mode and be asked "Enjoying Ball IQ?" minutes later. That
        // is the single worst-timed ask available, and it was reachable.
        // Suppresses the ask for 24h — the same treatment a crash gets.
        try { markBadReviewMoment(); } catch {}
      }
      // 1.1: completing today's Footle cancels tonight's reminder; a solve is
      // also a positive moment to surface the notification pre-prompt.
      // game/won/guesses ride along so the app shell can award Footle XP
      // exactly once (this transition fires once per day by construction —
      // finished puzzles never re-enter submitGuess).
      // ⚠️ Archive plays record the solve but do not tick the streak or pay XP
      // — see the guards in TransferTrail/MysteryPlayer for why a farmable
      // streak is worse than no archive.
      if (!isArchive) {
        try { window.dispatchEvent(new CustomEvent('biq:daily-completed', { detail: { positive: newStatus === "won", game: 'footle', won: newStatus === "won", guesses: newGuesses.length, clue: !!state.clue } })); } catch {}
      } else {
        // Streak repair listens for this: finishing YESTERDAY's puzzle from
        // the back-catalogue is the one act that can relight a streak that
        // broke today (repair_login_streak). Never touches habit metrics
        // directly — the app shell decides if a repair is available.
        try { window.dispatchEvent(new CustomEvent('biq:archive-completed', { detail: { game: 'footle', ymd: dateKey } })); } catch {}
      }
      // The ⭐ 5-star ask used to fire from right here, and it stacked the iOS
      // rating card on top of our own notification sheet on a fresh install.
      // It now rides the event above, handled in the app shell, which is the
      // only place that knows whether the notification sheet just opened.
    }
  }, [state, current, answer, hardNow, hardNames, hardPref]);

  const handleKey = useCallback((key) => {
    if (state.status !== "playing") return;
    if (key === "ENTER") return submitGuess();
    if (key === "DEL") { setCurrent((c) => c.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key)) {
      setCurrent((c) => (c.length < answer.length ? c + key : c));
    }
  }, [state.status, submitGuess, answer.length]);

  // Audit Phase 5 (C3): ref-stabilize handleKey so the global keydown
  // listener attaches once per mount instead of once per keystroke.
  // handleKey's deps cascade through submitGuess → current, so handleKey
  // identity changes on every letter typed; without the ref the effect
  // below tore down and re-added the window listener ~6 times per puzzle.
  // Keypress correctness preserved: handleKeyRef.current always returns
  // the freshest callback at fire time.
  const handleKeyRef = useRef(handleKey);
  useEffect(() => { handleKeyRef.current = handleKey; });
  // Once the puzzle is decided the keys belong to the page again (24 Nov 2026).
  // The listener below called preventDefault on every Enter, so on a finished
  // board Enter did nothing on a focused button: Share, a row of the list,
  // Back to Home. Found with a real keyboard on the built app, where Enter on
  // "Share my 3/6" never opened its sheet.
  const playingRef = useRef(state.status === "playing");
  playingRef.current = state.status === "playing";

  // ⚠️ THE KEYS TYPE ON CLICK, AS THEY ALWAYS DID. On 13 Oct they were moved
  // to pointerup to cure letters lost in a fast burst of taps. That loss was
  // only ever seen in the simulator, whose taps are machine-made; on Alex's
  // phone the pointerup keys then typed letters he had not pressed, sometimes
  // twice, sometimes a different letter (build 146, 14 Oct 2026). iOS decides
  // what counts as a tap before it sends a click (a resting thumb, a long
  // press or a slide is not one); pointerup has no such judgement. Do not
  // move the keys off click again without a recording from a real phone that
  // shows letters being lost.

  // Physical keyboard support. Ignore when modifier keys are held so we don't
  // hijack browser shortcuts (cmd-R, etc.).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!playingRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // ⚠️ Same guard ReviewScreen has and this listener never did: while a
      // sheet is open, or focus is in a field, keys belong to THAT. Without it,
      // Enter on a sheet's button both activated the button and submitted the
      // row as a guess — verified on device 2026-09-08.
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      // (unquoted attribute selectors on purpose: a11y-structure.test.js counts
      //  the literal role="dialog" as a dialog DECLARATION)
      if (document.querySelector('[role=dialog], [aria-modal=true]')) return;
      if (e.key === "Enter") { e.preventDefault(); handleKeyRef.current("ENTER"); }
      else if (e.key === "Backspace") { e.preventDefault(); handleKeyRef.current("DEL"); }
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyRef.current(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString(fmtLocaleEnglish(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }); // the share card's date: English, like its text
  }, [dateKey]);

  // Build all 6 grid rows: completed guesses get coloured, current row shows
  // the in-progress entry, future rows are blanks.
  const rows = [];
  for (let r = 0; r < 6; r++) {
    if (r < state.guesses.length) {
      const g = state.guesses[r];
      const grades = gradeWordleGuess(g, answer);
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div
              key={i}
              className={`wd-tile wd-${grades[i]}${r === animRow ? " wd-flip" : ""}`}
              style={r === animRow ? { animationDelay: `${i * WORDLE_FLIP_MS}ms` } : undefined}
              aria-label={`${g[i]}, ${t(grades[i] === "green" ? "footle.green" : grades[i] === "yellow" ? "footle.yellow" : "footle.grey")}`}
            >{g[i]}</div>
          ))}
        </div>
      );
    } else if (r === state.guesses.length && state.status === "playing") {
      rows.push(
        <div className={`wd-row wd-row--active${shake ? " wd-shake" : ""}`} key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div
              key={i}
              className={`wd-tile${current[i] ? " wd-filled" : ""}${!current[i] && i === current.length ? " wd-tile--next" : ""}`}
            >{current[i] || ""}</div>
          ))}
        </div>
      );
    } else {
      rows.push(
        <div className="wd-row wd-row--future" key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div key={i} className="wd-tile" />
          ))}
        </div>
      );
    }
  }

  // Build the share text: emoji grid built from each actual guess. ⬛ for grey
  // matches the in-app dark theme rather than NYT Wordle's ⬜. Layout:
  //   ⚽ APP_NAME — Today's Puzzle
  //   {score}/6
  //   <blank line>
  //   <emoji grid, one row per guess>
  //   <blank line>
  //   balliq.app
  // The URL is also passed via navigator.share's `url` field so apps that
  // recognise it (Snapchat, WhatsApp, iMessage, Twitter) render it as a
  // tappable link rather than inline text.
  // The coloured grid on its own: the share text carries it, and so does the
  // message "Send it to a mate" puts in a chat (DailyDone challengeGrid).
  const shareGrid = useMemo(() => {
    if (state.status === "playing") return "";
    return state.guesses.map((g) => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map((c) => (c === "green" ? (CB_MODE() ? "🟧" : "🟩") : c === "yellow" ? (CB_MODE() ? "🟦" : "🟨") : "⬛")).join("");
    }).join("\n");
  }, [state.status, state.guesses, answer]);
  const shareText = useMemo(() => {
    if (state.status === "playing") return "";
    const won = state.status === "won";
    const grid = shareGrid;
    const streak = won ? computeFootleStreak(new Date()) : 0;
    // One head for all three share builders (lib/wordle.js) — one puzzle,
    // one share format, and a clued solve says so.
    const head = footleShareHead(APP_NAME, getFootleNumber(), won, state.guesses.length, !!state.clue, !!state.hard);
    const streakLine = won && streak > 0 ? `\n${t("share.footleStreak", { count: streak, n: streak })}` : "";
    return `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
  }, [state, answer, shareGrid]);

  const onShare = useCallback(async () => {
    if (!shareText) return;
    // Build the per-guess grades grid for the canvas card. Each guess is an
    // array of "green" | "yellow" | "grey" matching the in-app tile colours.
    const grades = state.guesses.map((g) => gradeWordleGuess(g, answer));
    return shareCard("wordle", {
      score: state.guesses.length,
      total: 6,
      grades,
      dateLabel,
      failed: state.status === "lost",
      num: getFootleNumber(),
      clue: !!state.clue,
      hard: !!state.hard,
      streak: state.status === "won" ? computeFootleStreak(date) : 0,
    }, {
      onToast: (msg) => { try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: String(msg) })); } catch {} },
      textFallback: shareText,
    });
  }, [shareText, state.guesses, state.status, state.clue, answer, dateLabel, date]);

  return (
    <div className={`wd-screen${inApp.src ? " has-inapp" : ""}`}>
      {/* Social in-app browsers only (no Smart App Banner there). A row the
          height budget pays for: has-inapp -> --wd-inapp-h in footle.css. */}
      <InAppStrip src={inApp.src} onDismiss={inApp.dismiss} />
      <div className={`wd-header${over ? " is-over" : ""}`}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
        <div className="wd-header-text">
          {/* The shared title, with the number beside the name as Home writes
              it (13 Oct 2026). The header's height is the back button's 44px
              and is part of the ENTER-on-screen budget (--wd-chrome): the
              title's own size does not move it. Re-measure if that changes. */}
          <GameTitle no={getFootleNumber(date)}>Footle</GameTitle>
          {/* Shortened when the "?" joined this row: the button + its gap take
              56px out of the flex:1 text column, which wrapped the old
              "Player or manager — guess the surname" onto a 3rd line and pushed
              the grid + keyboard down (measured 375px: header 56→71.5px). The
              player-or-manager rule it carried now lives in the rules sheet
              (step 4), which auto-opens for first-timers. Measured with the "?"
              present: header 44px @375, 56px @320 — at or under the pre-"?"
              baseline at both. Re-measure both if this string grows. */}
          {/* ⚠️ AN ARCHIVE BOARD MUST SAY WHICH DAY IT IS. Trail's header
              reads "#37" and Mystery's says "archive"; Footle's replay was
              pixel-identical to today's board, so a player who tapped Play on
              yesterday in History had no way to tell they were not about to
              spend today's puzzle. It mattered less while the replay was
              broken (it reloaded after 5s); now that it works, it matters. */}
          {/* Once the board is over, the rule has nothing left to teach and the
              "Next" countdown takes 70px of this row: the rule wrapped to two
              lines at 360-390px and three at 320 (measured 2026-10-04, header
              44px -> 54/69px). The puzzle number is what a finished player
              shares and compares, and it fits on one line at every width. */}
          <div className="wd-sub"><ChallengeBanner game="footle" edition={isArchive ? -1 : getFootleNumber(date)} finished={state.status !== "playing"}>{isArchive ? t("footle.archive") : state.status !== "playing" ? t(state.hard ? "footle.todayHard" : "footle.today") : hardNow && state.guesses.length > 0 ? t("footle.hardSub") : t("mode.footle.short")}</ChallengeBanner></div>
        </div>
        {/* ONCE THE RESULT IS UP THE STREAK HAS THIS CORNER (round two of the
            finish, 24 Nov 2026): a small filled chip, as on Home, where "?"
            sits during play. The rules stay one tap away for a finished
            player: "How to play" is a quiet link at the foot of the screen,
            beside "Answer looks wrong? Tell us". */}
        {over ? <StreakChip streak={finishStreak} won={state.status === "won"} isArchive={isArchive} />
          : onHowToPlay && (
            <button className="icon-btn" onClick={onHowToPlay} aria-label={t("footle.howTo")} title={t("game.howTo")}>?</button>
          )}
      </div>

      {/* What the auto-opening rules sheet was actually for. Full page width, so
          it fits where the header subtitle could not (that string is width-
          constrained — a longer one already wrapped the header onto a third
          line at 375px once). Gone the moment a guess lands, because by then
          the board has taught it better than any caption could. */}
      {/* ⚠️ THE LEGEND LIVES INSIDE THE BOARD, and that is a layout decision, not
          tidiness. As a SIBLING of .wd-grid it was separated from the tiles by
          the grid's centring slack — measured 54px to the first row on a 440pt
          phone while sitting only 24px under the header, so the caption read as
          part of the HEADER rather than as a key to the board it describes.
          Proximity is what carries that meaning and it pointed at the wrong
          thing. Reported on device: "should we not shorten the gap between the
          grid and the green and yellow explainer?"
          Inside the grid it rides with the tiles (6-10px away on every device
          measured) and the spare height collects above the pair instead of
          between them. This KEEPS .wd-grid's justify-content:center, which the
          footle-keyboard-geometry gate requires — that centring is what stops
          slack pooling as a single hole (233px below ENTER, once). */}
      {/* ONCE THE RESULT IS UP THE BOARD IS NOT DRAWN (24 Nov 2026): its played
          rows are on the result card below (footleCard.picture), so the result
          is on screen once. Between the last ENTER and `revealed` (the row is
          still turning) the board stays exactly as it was. */}
      {!(state.status !== "playing" && revealed) && (
      <div className={`wd-grid${state.status !== "playing" ? " wd-grid--ended" : ""}`} style={{ "--wd-cols": answer.length }}>
        {/* The key stays in the layout for the whole game and only goes
            invisible after the first guess (2026-10-08). It used to be removed,
            and because the grid is centred the whole board hopped up about
            30px the moment the first row landed (seen in the simulator). */}
        {/* ONE SLOT, ONE HEIGHT, FOR THE WHOLE GAME. The key, the clue offer and
            the clue itself take turns in it and are never on screen together.
            They used to be three separate blocks: when "Stuck? Take a clue"
            arrived after the third guess it pushed the board AND the keyboard
            about 40pt down, under the player's thumbs (Alex's own recording on
            an iPhone 17 Pro Max, 12 Oct 2026). */}
        {state.status === "playing" && (
          <div className="wd-slot">
            <div className="wd-slot-row">
              {clueOffer ? (
                <button type="button" className="wd-clue wd-clue--offer" onClick={takeClue}>
                  <Lightbulb size={16} strokeWidth={2} aria-hidden="true" />
                  {t("footle.clueOffer")}
                </button>
              ) : clueShown ? (
                <div className="wd-clue wd-clue--shown" role="status">
                  <Lightbulb size={16} strokeWidth={2} aria-hidden="true" />
                  {footleClue(answer)}
                </div>
              ) : showLegend ? (
                // THE KEY IS A WAY IN TO THE RULES (22 Nov 2026). People tap it
                // expecting more: Clarity counted about 300 taps a week on the
                // key and the line beside it, and nothing happened. It looks
                // the same and now does what "?" does: the rules sheet in the
                // app, a scroll to "How to play" on the static Footle page
                // (islands/footle.jsx). With no handler at all it stays plain
                // text. Its spoken name keeps the words on screen and adds
                // where it leads.
                onHowToPlay ? (
                  <button type="button" className="wd-legend wd-legend--tap" onClick={onHowToPlay}>
                    <span className="wd-legend-item"><i className="wd-legend-chip is-green" />{t("footle.rightSpot")}</span>
                    <span className="wd-legend-item"><i className="wd-legend-chip is-amber" />{t("footle.wrongSpot")}</span>
                    <span className="sr-only">{`. ${t("footle.howTo")}`}</span>
                  </button>
                ) : (
                  <div className="wd-legend" aria-hidden="true">
                    <span className="wd-legend-item"><i className="wd-legend-chip is-green" />{t("footle.rightSpot")}</span>
                    <span className="wd-legend-item"><i className="wd-legend-chip is-amber" />{t("footle.wrongSpot")}</span>
                  </div>
                )
              ) : null}
              {/* The switch stays for the whole game, beside whatever holds the slot. */}
              {!isArchive && (
                <button type="button" className={`wd-hard${hardPref ? " is-on" : ""}`} aria-pressed={hardPref} onClick={toggleHard}>
                  {t(hardPref ? "footle.hardOn" : "footle.hard")}
                </button>
              )}
            </div>
          </div>
        )}
        {rows}
      </div>
      )}

      {/* Screen-reader narration of the latest guess (scouting panel, a11y):
          the tile flips are pure colour, so a VoiceOver/TalkBack player got
          silence after every submit. Announces letter-by-letter grades for
          the most recent guess only — announcing the whole board every turn
          would bury the new information under five rows of old news. */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {state.guesses.length > 0 && (() => {
          const g = state.guesses[state.guesses.length - 1];
          const grades = gradeWordleGuess(g, answer);
          const parts = [...g].map((ch, i) =>
            `${ch} ${t(grades[i] === "green" ? "footle.srGreen" : grades[i] === "yellow" ? "footle.wrongSpot" : "footle.srGrey")}`);
          const outcome = state.status === "won" ? ` ${t("footle.srSolved", { a: answer })}`
            : state.status === "lost" ? ` ${t("footle.srLost", { a: answer })}` : "";
          return `${t("footle.srGuess", { n: state.guesses.length, parts: parts.join(", ") })}${outcome}`;
        })()}
      </div>

      {/* THE RESULT CARD (22 Nov 2026), same family as the Daily 7's: drawn
          by DailyDone below, which holds the day's numbers. It replaced this
          screen's own result block (the win word, "The answer was …", the
          "Solved in 3/6 · +48 XP" pill). What stays here is the confetti; the
          report link sits under the panel. */}
      {state.status === "won" && revealed && !wasFinishedAtMount.current && Confetti && <Confetti />}

      {/* The return loop, built once for all four dailies (components/DailyDone.jsx):
          streak · countdown + remind · SHARE · how everyone did · still open today
          · save (guest) · get the app (web). Replaced this screen's own share
          button, WhatsApp link, countdown footer, Daily 7 cross-sell and store
          CTA (2026-09-06). A sibling of .wd-result, not a child — no card in a
          card.
          Since 24 Nov 2026 Footle asks for the panel's "one" layout: the card
          carries the board and one Share button, and under it sit a caption
          line and the other dailies as one list (DailyDone.jsx says why). The
          other dailies keep the classic panel until their turn. */}
      {/* No margin on the wrapper below. .wd-screen is a flex column with
          gap:14px, so a marginTop on a sibling is added TO that gap, not
          instead of it — 24pt of nothing between the result card and the
          return panel. Alex 2026-09-09: "if we removed some vertical deadspace
          the next suggested daily modes would be a bit further up." */}
      {over && (
        <div>
          <DailyDone
            game="footle"
            edition={getFootleNumber(date)}
            won={state.status === "won"}
            bucket={state.status === "won" ? state.guesses.length : 0}
            isArchive={isArchive}
            streak={finishStreak}
            promoted={dailyDone?.promoted}
            onShare={onShare}
            challengeGrid={shareGrid}
            remind={dailyDone?.remind}
            nextUp={dailyDone?.nextUp || []}
            day={dailyDone?.day}
            save={dailyDone?.save}
            GetAppCTA={GetAppCTA}
            track={dailyDone?.track}
            card={footleCard}
            layout="one"
          />
          {/* Sprint #64 FF1: post-Footle install nudge (web only; the hook gates
              on installed / standalone / affordance / 30-day cooldown). */}
          {InstallBanner && <InstallBanner />}
          {/* The way out, as a quiet filled pill (round two): it was a
              full-width outlined button under the report link. */}
          <ResultFoot onHome={onBack} pill />
          {/* Last, two quiet links: the answer is wrong, and the rules (the
              header's "?" gave its corner to the streak). */}
          {footleCard && (onReport || onHowToPlay) && (
            <div className="wd-report-row">
              {onReport && <FootleReportButton answer={answer} status={state.status} onReport={onReport} />}
              {onHowToPlay && (
                <button type="button" className="wd-howto" onClick={onHowToPlay} aria-label={t("footle.howTo")}>
                  <CircleHelp size={13} strokeWidth={2.4} aria-hidden="true" /> {t("game.howTo")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {state.status === "playing" && (
        <div className="wd-keyboard">
          {WORDLE_KB_ROWS.map((row, ri) => (
            <div className="wd-kb-row" key={ri}>
              {row.map((k) => {
                const isAction = k === "DEL";
                // THE KEYS WAIT FOR THE TILES (15 Nov 2026). A key took its colour
                // the instant ENTER was pressed, while the row's tiles were still
                // turning one by one: the keyboard gave the result away before
                // the board showed it. While a row is flipping (animRow), the
                // keys are graded on the rows before it; they catch up when the
                // last tile has landed.
                const st = isAction ? null : getWordleKeyState(k, animRow >= 0 ? state.guesses.slice(0, animRow) : state.guesses, answer);
                const cls = isAction ? `wd-key wd-key-action` : `wd-key wd-key-${st || "idle"}`;
                // Append the key's revealed state so SR users get the same
                // feedback the colors carry (medical accessibility).
                const stDesc = st ? `, ${t(`footle.${st}`)}` : "";
                return (
                  <button key={k} className={cls} onClick={() => handleKey(k)} aria-label={k === "DEL" ? t("footle.del") : `${k}${stDesc}`}>
                    {k === "DEL" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
          <button className={`wd-key-enter${current.length === answer.length ? "" : " is-short"}`} onClick={() => handleKey("ENTER")} aria-label={t("footle.enterAria")}>{t("footle.enter")}</button>
        </div>
      )}
    </div>
  );
});
