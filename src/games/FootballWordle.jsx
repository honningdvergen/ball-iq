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
import {
  WORDLE_FULL_NAMES, getWordleAnswer, gradeWordleGuess, computeFootleStreak, getFootleNumber,
} from '../lib/wordle.js';
import { getWordleDateKey } from '../lib/wordleStatus.js';
import { safeSetItem } from '../safeStorage.js';
import { APP_NAME } from '../lib/scoring.js';
import { FOOTLE_SHORT } from '../lib/modeCopy.js';
import { getFootleXP } from '../lib/footleXp.js';
import ReportButton from '../components/ReportButton.jsx';
import { DailyDone } from '../components/DailyDone.jsx';
import './footle.css';

// Per-tile flip duration; the reveal waits for the whole row to turn.
export const WORDLE_FLIP_MS = 280;

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
      onToast?.('Copied — paste it anywhere');
    } catch (e) {
      // AbortError is the user closing the share sheet — nothing to say. Any
      // other failure (no clipboard, unfocused document) must not be silent:
      // a button that does nothing is the one thing a result card cannot have.
      if (e?.name !== 'AbortError') onToast?.('Could not copy — use Share on WhatsApp below');
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

function FootleReportButton({ answer, status, onReport }) {
  const [prefix, surname] = WORDLE_FULL_NAMES[answer] || ["", answer];
  return (
    <ReportButton
      onReport={onReport}
      idle="⚑ Bad answer? Tell us"
      info={{
        id: `footle:${answer}`,
        q: `Footle answer "${answer}" (${(prefix ? prefix + " " : "") + surname})`,
        picked: null,
        correct: answer,
        mode: status === "won" ? "footle" : "footle-lost",
      }}
      style={{
        margin: "10px auto 0", padding: "9px 13px", minHeight: 40, display: "block",
        background: "none", border: "1px solid var(--border)", borderRadius: 10,
        fontSize: 12.5, fontWeight: 700,
      }}
    />
  );
}

export const FootballWordle = React.memo(function FootballWordle({ onBack, userId, onHowToPlay, onReport, date = new Date(), services }) {
  // Everything the screen needs from the app shell arrives here; the island
  // passes its own (src/islands/footle.jsx). Missing keys fall back to inert.
  const { haptic, playSound, markBadReviewMoment, onSync, shareCard, Confetti, InstallBanner, GetAppCTA, isNative, dailyDone } = { ...DEFAULT_SERVICES, ...(services || {}) };
  // One puzzle per day — answer + storage key derive from today's date and
  // automatically resync on the day-rollover reload below.
  // `date` drives the storage key AND the answer together — they must never be
  // derived from different days, which is precisely the bug the timezone
  // comment in lib/wordle.js describes (key from local date, answer from UTC,
  // so a player got tomorrow's word stored under today's key).
  const dateKey = getWordleDateKey(date);
  const isArchive = dateKey !== getWordleDateKey();
  const storageKey = `biq_wordle_${dateKey}`;
  const answer = useMemo(() => getWordleAnswer(date), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Audit Phase 5 (C2): track shake (450ms) + reveal (~2-3s) setTimeouts
  // so we can clear them on unmount. Without this, setShake(false) and
  // setRevealed(true) could fire on unmounted component if the user backs
  // out mid-animation.
  const timeoutsRef = useRef([]);
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

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
  const [countdown, setCountdown] = useState("");
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

  // Persist on every change to the game state.
  useEffect(() => {
    // Archive plays are stamped so history readers can tell a live day from
    // a back-filled one — the streak walks break on `arc` and the form strip
    // marks it. Without the stamp, catching up an old day silently extends
    // the local streak (reproduced 2026-08-20: an archive solve showed as a
    // 2-day streak). Same stamp in Trail and Mystery.
    safeSetItem(storageKey, JSON.stringify(isArchive ? { ...state, arc: 1 } : state));
    // Cross-device sync — push to profiles.wordle_state via atomic JSON
    // merge. Skip the empty-grid initial state to avoid a useless write.
    if (userId && state.guesses.length > 0 && onSync) onSync(dateKey, state);
  }, [state, storageKey, userId, dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live "new player tomorrow" countdown. Ticks once per second.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = tomorrow - now;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Detect day rollover while the screen is open — full reload so the new
  // day's answer, storageKey and game state all resync together.
  useEffect(() => {
    const id = setInterval(() => {
      if (getWordleDateKey() !== dateKey) window.location.reload();
    }, 5000);
    return () => clearInterval(id);
  }, [dateKey]);

  const submitGuess = useCallback(() => {
    if (state.status !== "playing") return;
    if (current.length !== answer.length) {
      setShake(true);
      timeoutsRef.current.push(setTimeout(() => setShake(false), 450));
      return;
    }
    const newGuesses = [...state.guesses, current];
    let newStatus = "playing";
    if (current === answer) newStatus = "won";
    else if (newGuesses.length >= 6) newStatus = "lost";
    setState({ guesses: newGuesses, status: newStatus });
    setCurrent("");
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
        try { window.dispatchEvent(new CustomEvent('biq:daily-completed', { detail: { positive: newStatus === "won", game: 'footle', won: newStatus === "won", guesses: newGuesses.length } })); } catch {}
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
  }, [state, current, answer]);

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

  // Physical keyboard support. Ignore when modifier keys are held so we don't
  // hijack browser shortcuts (cmd-R, etc.).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); handleKeyRef.current("ENTER"); }
      else if (e.key === "Backspace") { e.preventDefault(); handleKeyRef.current("DEL"); }
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyRef.current(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
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
              className={`wd-tile wd-${grades[i]} wd-flip`}
              style={{ animationDelay: `${i * 280}ms` }}
              aria-label={`${g[i]}, ${grades[i] === "green" ? "correct" : grades[i] === "yellow" ? "wrong position" : "not in the name"}`}
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
  const shareText = useMemo(() => {
    if (state.status === "playing") return "";
    const won = state.status === "won";
    const grid = state.guesses.map((g) => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map((c) => (c === "green" ? (CB_MODE() ? "🟧" : "🟩") : c === "yellow" ? (CB_MODE() ? "🟦" : "🟨") : "⬛")).join("");
    }).join("\n");
    const num = getFootleNumber();
    const tag = num > 0 ? ` #${num}` : "";
    const streak = won ? computeFootleStreak(new Date()) : 0;
    // Same Wordle-convention format as the review screen's builder — the two
    // MUST stay in sync (one puzzle, one share format).
    const head = `⚽ ${APP_NAME} Footle${tag} ${won ? state.guesses.length : "X"}/6`;
    const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day Footle streak` : "";
    return `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
  }, [state, answer]);

  const onShare = useCallback(async () => {
    if (!shareText) return;
    // Build the per-guess grades grid for the canvas card. Each guess is an
    // array of "green" | "yellow" | "grey" matching the in-app tile colours.
    const grades = state.guesses.map((g) => gradeWordleGuess(g, answer));
    await shareCard("wordle", {
      score: state.guesses.length,
      total: 6,
      grades,
      dateLabel,
      failed: state.status === "lost",
      num: getFootleNumber(),
    }, {
      onToast: (msg) => { try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: String(msg) })); } catch {} },
      textFallback: shareText,
    });
  }, [shareText, state.guesses, state.status, answer, dateLabel]);

  return (
    <div className="wd-screen">
      <div className="wd-header">
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        <div className="wd-header-text">
          <div className="wd-title">Footle</div>
          {/* Shortened when the "?" joined this row: the button + its gap take
              56px out of the flex:1 text column, which wrapped the old
              "Player or manager — guess the surname" onto a 3rd line and pushed
              the grid + keyboard down (measured 375px: header 56→71.5px). The
              player-or-manager rule it carried now lives in the rules sheet
              (step 4), which auto-opens for first-timers. Measured with the "?"
              present: header 44px @375, 56px @320 — at or under the pre-"?"
              baseline at both. Re-measure both if this string grows. */}
          <div className="wd-sub">{FOOTLE_SHORT}</div>
        </div>
        {onHowToPlay && (
          <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play Footle" title="How to play">?</button>
        )}
        {/* Only once today's puzzle is over. Before you've played, a countdown
            to TOMORROW is the least useful thing on the screen, and it was
            rendered in the accent colour competing with the board and ENTER.
            Afterwards it's the one thing you want — when can I play again. */}
        {state.status !== "playing" && (
          <div className="wd-countdown" title="New player tomorrow">
            <div className="wd-countdown-label">Next</div>
            <div className="wd-countdown-time">{countdown}</div>
          </div>
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
      <div className={`wd-grid${state.status !== "playing" ? " wd-grid--ended" : ""}`} style={{ "--wd-cols": answer.length }}>
        {showLegend && (
          <div className="wd-legend" aria-hidden="true">
            <span className="wd-legend-item"><i className="wd-legend-chip is-green" />right spot</span>
            <span className="wd-legend-item"><i className="wd-legend-chip is-amber" />wrong spot</span>
          </div>
        )}
        {rows}
      </div>

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
            `${ch} ${grades[i] === "green" ? "correct spot" : grades[i] === "yellow" ? "wrong spot" : "not in name"}`);
          const outcome = state.status === "won" ? ` Solved — the answer is ${answer}.`
            : state.status === "lost" ? ` Out of guesses — the answer was ${answer}.` : "";
          return `Guess ${state.guesses.length} of 6: ${parts.join(", ")}.${outcome}`;
        })()}
      </div>

      {state.status !== "playing" && revealed && (
        <div className="wd-result">
          {/* 1.1: celebrate a fresh solve. Gated on !wasFinishedAtMount so
              re-opening today's solved puzzle doesn't re-fire the confetti. */}
          {state.status === "won" && !wasFinishedAtMount.current && Confetti && <Confetti />}
          <div className="wd-result-title">
            {state.status === "won" ? "Brilliant!" : "Better luck tomorrow"}
          </div>
          {/* Sprint #81 YY2: reveal renders proper-cased full name from
              WORDLE_FULL_NAMES (tuple [firstNamePrefix, properSurname]).
              First name (if present) inherits the muted .wd-result-sub
              color; surname stays accent via <strong>. Empty prefix →
              single-name brand (Pelé, Neymar) renders just the surname
              with no leading whitespace. Falls back to raw uppercase
              answer if a pool entry is unmapped (defensive). */}
          {(() => {
            const [prefix, surname] = WORDLE_FULL_NAMES[answer] || ["", answer];
            return (
              <div className="wd-result-sub">
                The answer was {prefix && <>{prefix} </>}<strong>{surname}</strong>
              </div>
            );
          })()}
          {/* Static earned-XP footer, mirroring every other result screen —
              the daily hero now visibly feeds the same progression economy. */}
          <div style={{fontSize:13,fontWeight:700,color:"var(--accent)",marginBottom:10}}>
            +{getFootleXP(state.status === "won", state.guesses.length)} XP
          </div>
          {/* Footle had NO report path. It is the most-played mode in the app and
              its failure mode is the nastiest we ship: an answer that is
              misspelled or not a real surname is UNWINNABLE, and the player has
              no way to tell us — two literally unwinnable answers have shipped
              before. The daily answer is the whole payload, so one button does it. */}
          {onReport && <FootleReportButton answer={answer} status={state.status} onReport={onReport} />}
        </div>
      )}

      {/* The return loop, built once for all four dailies (components/DailyDone.jsx):
          streak · countdown + remind · SHARE · how everyone did · still open today
          · save (guest) · get the app (web). Replaced this screen's own share
          button, WhatsApp link, countdown footer, Daily 7 cross-sell and store
          CTA (2026-09-06). A sibling of .wd-result, not a child — no card in a
          card. */}
      {state.status !== "playing" && revealed && (
        <div style={{ marginTop: 10 }}>
          <DailyDone
            game="footle"
            edition={getFootleNumber(date)}
            won={state.status === "won"}
            bucket={state.status === "won" ? state.guesses.length : 0}
            isArchive={isArchive}
            streak={dailyDone?.streak || { count: state.status === "won" ? computeFootleStreak(date) : 0, label: "Footle streak" }}
            onShare={onShare}
            waText={!isNative && shareText ? shareText : undefined}
            remind={dailyDone?.remind}
            nextUp={dailyDone?.nextUp || []}
            save={dailyDone?.save}
            GetAppCTA={GetAppCTA}
            track={dailyDone?.track}
          />
          {/* Sprint #64 FF1: post-Footle install nudge (web only; the hook gates
              on installed / standalone / affordance / 30-day cooldown). */}
          {InstallBanner && <InstallBanner />}
        </div>
      )}

      {state.status === "playing" && (
        <div className="wd-keyboard">
          {WORDLE_KB_ROWS.map((row, ri) => (
            <div className="wd-kb-row" key={ri}>
              {row.map((k) => {
                const isAction = k === "DEL";
                const st = isAction ? null : getWordleKeyState(k, state.guesses, answer);
                const cls = isAction ? `wd-key wd-key-action` : `wd-key wd-key-${st || "idle"}`;
                // Append the key's revealed state so SR users get the same
                // feedback the colors carry (medical accessibility).
                const stDesc = st === "green" ? ", correct" : st === "yellow" ? ", wrong position" : st === "grey" ? ", not in the name" : "";
                return (
                  <button key={k} className={cls} onClick={() => handleKey(k)} aria-label={k === "DEL" ? "Delete last letter" : `${k}${stDesc}`}>
                    {k === "DEL" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
          <button className="wd-key-enter" onClick={() => handleKey("ENTER")} aria-label="Enter key — submit guess">ENTER</button>
        </div>
      )}
    </div>
  );
});
