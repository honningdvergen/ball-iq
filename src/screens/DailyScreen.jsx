import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ClipboardList, Route, UserRoundSearch } from "lucide-react";
import { useAuth } from "../useAuth.jsx";
import { Confetti, haptic } from "../App.jsx";
import { dateToYMD, msToNextLocalMidnight, formatCountdown } from '../lib/date.js';
import { getWordleAnswer } from "../lib/wordle.js";
import { getTrailAnswer } from "../lib/trail.js";
import { answerIdForDay, mysteryDayIndex, MYSTERY_ENABLED } from "../lib/mysteryPlayer.js";
import MYSTERY_SCHEDULE from "../data/mysterySchedule.json";
import { FOOTLE_SHORT } from "../lib/modeCopy.js";
import { MODE_ACCENT } from "../lib/accents.js";

// Shared monospace stack for tabular numerals (countdown, scores). Mirrors the
// inline font used by the mobile markup so the >=1024 desktop layout renders
// identical figures.
const MONO = "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace";

// msToNextLocalMidnight + formatCountdown moved to lib/date.js on 2026-08-23
// so the Mystery result screen can show the same countdown. One definition;
// two surfaces cannot drift about when tomorrow starts.
// Kept in step with HomeScreen's greeting — 00:00-04:59 is not "morning".
function timeOfDayGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Sprint #24 V2 helpers — the tactics card subtitle + form-row right
// label encode 5 edge cases the brief calls out: zero history, mid-
// streak, at PB, beyond PB, plus the single-day bootstrap. Keep them
// pure functions so the JSX stays readable and these are unit-testable
// in isolation if/when needed.
function tacticsSubtitle(unbeaten, bestUnbeaten) {
  if (unbeaten === 0) return "Start your streak today";
  const unit = unbeaten === 1 ? "day in a row" : "days in a row";
  if (unbeaten > bestUnbeaten) return `${unit} · new best!`;
  return unit;
}
function tacticsPbDistance(unbeaten, bestUnbeaten) {
  if (unbeaten === 0 || bestUnbeaten === 0) return "";
  if (unbeaten > bestUnbeaten) return `+${unbeaten - bestUnbeaten} over best`;
  if (unbeaten === bestUnbeaten) return "at your best";
  return `${bestUnbeaten - unbeaten} to your best`;
}

// Was there a Trail / Mystery puzzle on this day at all? Both modes launched
// AFTER Footle and the Daily 7, so a naive column would print "—" (which reads
// as "you missed it") for days when the mode did not exist yet. Both answer
// look-ups already return null outside their schedule, so they are the honest
// gate — a blank cell, not a dash. Module scope so the memos below don't
// re-run on every render.
//
// ⚠️ noon() is now REDUNDANT for Mystery and kept for the Trail. It existed
// because mysteryDayIndex floored a UTC millisecond count, so local midnight in
// a UTC+ zone landed on the previous UTC day and the first Mystery rendered as
// "not available". mysteryDayIndex now reads the LOCAL calendar date, so noon
// and midnight of the same local day give the same index. Left in place rather
// than unpicked from the call sites: it is a no-op for Mystery and still the
// safe input for anything date-shaped.
function trailLiveOn(d) {
  try { return !!getTrailAnswer(d); } catch { return false; }
}
function mysteryLiveOn(d) {
  if (!MYSTERY_ENABLED) return false;
  try { return !!answerIdForDay(MYSTERY_SCHEDULE, mysteryDayIndex(d)); } catch { return false; }
}
function noon(t) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

// Footle's mark is a lettermark, the other three are lucide glyphs painted with
// currentColor — so the caller sets colour on the wrapper, not here.
function ModeGlyph({ mode, size = 22 }) {
  if (mode === "footle") {
    return <span style={{ width: 26, height: 26, borderRadius: 7, background: "#58CC02", color: "#06230C", fontWeight: 800, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>F</span>;
  }
  if (mode === "daily7") return <ClipboardList size={size} strokeWidth={2} />;
  if (mode === "trail") return <Route size={size} strokeWidth={2} />;
  // ⚠️ Must match Home's More Modes grid. `Search` was both this glyph AND
  // the icon inside Mystery's own search field, so the mode was identified
  // by the same mark as one of its controls.
  return <UserRoundSearch size={size} strokeWidth={2} />;
}

// Recent-days column width. Four modes have to share the row that two used to
// have, so 74pt/70pt drops to 44 — enough for "5/7" in a pill, and it leaves
// ~139pt of the 375pt phone for the date, which "Yesterday" needs.
const COL_W = 44;

const MODE_LABEL = { footle: "Footle", daily7: "Daily 7", trail: "Transfer Trail", mystery: "Mystery Player" };

// Local yesterday, at NOON — the same guard the availability checks use, so a
// UTC-offset device cannot land on the wrong side of a date boundary.
function yesterday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12, 0, 0, 0);
}

// One Recent-days cell. Five states, not two — a mode that did not EXIST that
// day must not render the same "—" as a day the user skipped, and Mystery has
// no lose state so an abandoned board is "open", never a red ✗.
function ScoreCell({ state, text, theme, w = COL_W }) {
  const base = { width: w, display: "inline-flex", justifyContent: "center", flexShrink: 0 };
  if (state === "off") return <span style={base} aria-hidden="true" />;
  return (
    <span style={base} aria-hidden="true">
      {state === "win"
        ? <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 999, background: theme.chipBg, fontFamily: MONO, fontSize: 11.5, fontWeight: 800, color: theme.fg, fontVariantNumeric: "tabular-nums" }}>{text}</span>
        : state === "miss"
        ? <span style={{ fontSize: 13, fontWeight: 700, color: "#FF6B6B" }}>✗</span>
        : state === "open"
        ? <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)" }}>·</span>
        : <span style={{ fontSize: 13, fontWeight: 700, color: "#3E4150" }}>—</span>}
    </span>
  );
}

// An un-played past cell becomes a replay control — the whole visible table
// (14 days) is the back-catalogue, now that arc-stamped saves keep archive
// plays out of streaks and honestly marked in the form strip.
//
// ⚠️ A replay does NOT tick the streak or pay XP (guarded in each mode's own
// screen). It fills the board because that IS a true record; letting it move
// the streak would make the streak farmable and undo the point of it.
function ReplayCell({ w, theme, label, onTap }) {
  return (
    <span style={{ width: w, flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
      <button onClick={onTap} aria-label={label} title={label}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, borderRadius: 999, background: theme.chipBg,
          border: theme.resBd, fontSize: 13, fontWeight: 800, color: theme.fg,
          cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>↺</button>
    </span>
  );
}

// One tint per mode, shared by the mobile cards, the desktop cards and the
// Recent-days column heads so the same puzzle is never two different colours.
// THREE hues, not four: the palette pass deliberately unloaded colour, and a
// fourth would read as a rainbow. Mystery takes a neutral treatment instead —
// which suits it (the unknown has no colour) and matches the user's own ranking
// of it as the quietest of the four.
const MODE_THEME = {
  footle: {
    fg: MODE_ACCENT.footle, head: MODE_ACCENT.footle,
    card: "linear-gradient(120deg,rgba(88,204,2,0.13),rgba(88,204,2,0.02) 55%,var(--s1))",
    bd: "1px solid rgba(88,204,2,0.22)",
    iconBg: "rgba(88,204,2,0.14)", iconBd: "1px solid rgba(88,204,2,0.3)",
    btnBg: "rgba(88,204,2,0.15)", btnBd: "1px solid rgba(88,204,2,0.42)",
    chipBg: "rgba(88,204,2,0.1)", resBd: "1.5px solid rgba(88,204,2,0.5)",
  },
  daily7: {
    fg: MODE_ACCENT.daily7, head: MODE_ACCENT.daily7,
    card: "linear-gradient(120deg,rgba(255,170,0,0.12),rgba(255,193,7,0.03) 55%,var(--s1))",
    bd: "1px solid rgba(255,193,7,0.22)",
    iconBg: "rgba(255,170,0,0.14)", iconBd: "1px solid rgba(255,193,7,0.3)",
    btnBg: "rgba(255,193,7,0.14)", btnBd: "1px solid rgba(255,193,7,0.42)",
    chipBg: "rgba(255,193,7,0.1)", resBd: "1.5px solid rgba(255,193,7,0.4)",
  },
  trail: {
    fg: MODE_ACCENT.trail, head: MODE_ACCENT.trail,
    card: "linear-gradient(120deg,rgba(78,168,222,0.12),rgba(78,168,222,0.03) 55%,var(--s1))",
    bd: "1px solid rgba(78,168,222,0.22)",
    iconBg: "rgba(78,168,222,0.14)", iconBd: "1px solid rgba(78,168,222,0.3)",
    btnBg: "rgba(78,168,222,0.14)", btnBd: "1px solid rgba(78,168,222,0.42)",
    chipBg: "rgba(78,168,222,0.1)", resBd: "1.5px solid rgba(78,168,222,0.5)",
  },
  // ⚠️ MYSTERY WAS THE ONE MODE WITH NO COLOUR — greys and whites, sitting in a
  // row beside Footle's green, Daily 7's amber and Trail's blue. Next to three
  // tinted cards with tinted buttons, a neutral card with a neutral ghost
  // button does not read as "different", it reads as DISABLED — on a mode the
  // app is actively trying to get discovered, carrying a NEW badge on Home.
  // Violet because nothing else in the app uses it, so it extends the existing
  // per-mode language rather than colliding with a mode already spoken for.
  // #B9A5FF on --s1 measures 8.87:1.
  mystery: {
    fg: MODE_ACCENT.mystery, head: MODE_ACCENT.mystery,
    card: "linear-gradient(120deg,rgba(139,108,240,0.13),rgba(139,108,240,0.03) 55%,var(--s1))",
    bd: "1px solid rgba(139,108,240,0.24)",
    iconBg: "rgba(139,108,240,0.15)", iconBd: "1px solid rgba(139,108,240,0.32)",
    btnBg: "rgba(139,108,240,0.16)", btnBd: "1px solid rgba(139,108,240,0.44)",
    chipBg: "rgba(139,108,240,0.11)", resBd: "1.5px solid rgba(139,108,240,0.5)",
  },
};

// Recent-days columns, left to right. Same order as the Today cards.
const MODE_COLS = [
  { key: "footle", label: "FOOTLE", theme: MODE_THEME.footle },
  { key: "daily7", label: "DAILY 7", theme: MODE_THEME.daily7 },
  { key: "trail", label: "TRAIL", theme: MODE_THEME.trail },
  { key: "mystery", label: "MYSTERY", theme: MODE_THEME.mystery },
];

// A matchday row → its four cells, plus the sentence a screen reader gets.
// Derived in one place so the mobile table and the desktop table can never
// disagree about what a given day means.
function rowCells(m) {
  return [
    { key: "footle", theme: MODE_THEME.footle, text: String(m.fUsed),
      state: m.fWon ? "win" : m.fAttempt ? "miss" : "none",
      aria: m.fWon ? `Footle solved in ${m.fUsed}` : m.fAttempt ? "Footle not solved" : "Footle not played" },
    { key: "daily7", theme: MODE_THEME.daily7, text: `${m.t7Score}/7`,
      state: m.t7Done ? "win" : "none",
      aria: m.t7Done ? `Daily 7 ${m.t7Score} of 7` : "Daily 7 not played" },
    { key: "trail", theme: MODE_THEME.trail, text: String(m.trUsed),
      state: !m.trLive ? "off" : m.trWon ? "win" : m.trAttempt ? "miss" : "none",
      aria: !m.trLive ? "" : m.trWon ? `Transfer Trail solved in ${m.trUsed}` : m.trAttempt ? "Transfer Trail not solved" : "Transfer Trail not played" },
    // Mystery cannot be lost, so an unfinished board is "open", never a miss.
    { key: "mystery", theme: MODE_THEME.mystery, text: String(m.myUsed),
      state: !m.myLive ? "off" : m.myWon ? "win" : m.myAttempt ? "open" : "none",
      aria: !m.myLive ? "" : m.myWon ? `Mystery Player solved in ${m.myUsed}` : m.myAttempt ? "Mystery Player still open" : "Mystery Player not played" },
  ];
}
// Which screen a given column replays into. Daily 7 keeps its own launcher
// (it replays a QUESTION SET, not a single puzzle, so it has always taken a
// different path); the other three go through playArchive.
const REPLAY_SCREEN = { footle: "wordle", trail: "trail", mystery: "mystery" };

function rowAria(m) {
  return `${m.dateLabel} ${m.dateSub} — ${rowCells(m).map(c => c.aria).filter(Boolean).join(", ")}`;
}

// What is still open from yesterday, derived from the SAME predicates the
// Recent-days table uses to turn a cell into a replay control — including the
// `playArchive`/`playDailyForDate` presence checks, so the panel cannot offer a
// launch the table would have rendered as an inert score cell. Deriving this
// independently would let the panel and the row directly below it disagree,
// which is the exact drift this file has already had to fix once.
//
// The DayComplete panel stays yesterday-only (the day people actually want
// back is the one they just missed) — but the Recent-days TABLE now replays
// any unplayed day it shows. The gate that blocked this is fixed: archive
// saves carry an `arc` stamp, the streak walks break on it, and form14
// labels/dims arc-only days, so back-filling can no longer repaint the form
// strip or extend a streak.
function yesterdayOpen(matchdays, today, playArchive, playDailyForDate) {
  const y = matchdays.find(m => m.isYesterday);
  if (!y) return [];
  const out = [];
  for (const c of rowCells(y)) {
    const item = { key: c.key, theme: c.theme, label: MODE_LABEL[c.key] };
    if (c.key === "daily7") {
      // Daily 7 replays a question SET, so it keeps its own launcher. Date
      // expression is byte-identical to the table's catch-up glyph so both
      // controls open the same puzzle.
      if (!y.t7Done && playDailyForDate) {
        out.push({ ...item, onTap: () => playDailyForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)) });
      }
    } else if (c.state === "none" && REPLAY_SCREEN[c.key] && playArchive) {
      out.push({ ...item, onTap: () => playArchive(REPLAY_SCREEN[c.key], yesterday()) });
    }
  }
  return out;
}

// The day-complete destination. A finished day used to end on a wall: every
// card had turned into a result chip and the only thing still moving was the
// countdown. This offers the one thing that is both playable right now and
// already plumbed — yesterday's unplayed puzzles — and falls back to Survival,
// which needs no difficulty picker, no account, and never runs out.
function DayComplete({ open, onSurvival, wide, todayYMD }) {
  const hasOpen = open.length > 0;
  // The clean sweep is the single most-earned moment in the product and this
  // card used to whisper it (scouting panel, gameplay 7/B). Confetti + a heavy
  // pulse, ONCE per local day — the panel re-mounts on every hub visit and on
  // the mobile/wide layout switch, so the localStorage stamp (not state) is
  // what keeps a finished day from re-celebrating all evening.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    try {
      if (!todayYMD || localStorage.getItem("biq_sweep_seen") === todayYMD) return;
      localStorage.setItem("biq_sweep_seen", todayYMD);
      setCelebrate(true);
      haptic("heavy");
      const t = setTimeout(() => setCelebrate(false), 4200);
      return () => clearTimeout(t);
    } catch { /* storage unavailable: skip the celebration, keep the card */ }
  }, [todayYMD]);
  return (
    <div style={{ borderRadius: 16, padding: wide ? "18px 20px" : "14px 16px", background: "rgba(88,204,2,0.06)", border: "1px solid rgba(88,204,2,0.28)", display: "flex", flexDirection: "column", gap: hasOpen ? 12 : 0 }}>
      {celebrate && Confetti ? <Confetti /> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: "rgba(88,204,2,0.14)", border: "1px solid rgba(88,204,2,0.30)", color: "#58CC02", fontSize: 16, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">✓</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: wide ? 16 : 15, fontWeight: 800, color: "var(--t1)" }}>Clean sweep — today&apos;s done</div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
            {hasOpen ? "Yesterday is still open" : "Survival never runs out"}
          </div>
        </div>
        {!hasOpen && (
          <button onClick={onSurvival}
            style={{ flexShrink: 0, padding: wide ? "10px 22px" : "11px 20px", borderRadius: 12, background: "rgba(88,204,2,0.14)", border: "1.5px solid rgba(88,204,2,0.42)", color: "#58CC02", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            Survival
          </button>
        )}
      </div>
      {hasOpen && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {open.map(o => (
            <button key={o.key} onClick={o.onTap} aria-label={`Play yesterday's ${o.label}`}
              style={{ padding: "9px 14px", borderRadius: 11, background: o.theme.btnBg, border: o.theme.btnBd, color: o.theme.fg, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              ↺ {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The comeback banner (scouting panel, Retention): an un-shielded streak
// broke TODAY and the stash is still live — playing any of yesterday's open
// puzzles repairs it (the app shell listens for biq:archive-completed and
// calls repair_login_streak). Same open-list derivation as DayComplete so
// the buttons can never offer a puzzle the table would call unplayable.
function StreakRepairBanner({ repair, open, wide }) {
  if (!repair) return null;
  return (
    <div style={{ borderRadius: 16, padding: wide ? "16px 20px" : "14px 16px", background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.30)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">💔</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: wide ? 15.5 : 14.5, fontWeight: 800, color: "var(--t1)" }}>Your {repair.fell}-day streak broke</div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
            {open.length > 0
              ? "Play one of yesterday's puzzles before midnight to repair it"
              : "Yesterday's puzzles are all done — the repair will land with your next play"}
          </div>
        </div>
      </div>
      {open.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {open.map(o => (
            <button key={o.key} onClick={o.onTap} aria-label={`Repair the streak — play yesterday's ${o.label}`}
              style={{ padding: "9px 14px", borderRadius: 11, background: o.theme.btnBg, border: o.theme.btnBd, color: o.theme.fg, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              🔥 {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyTabScreenImpl({ profile, xp, shieldCount, dailyHistory, startMode, setScreen, dailyDone, dailyScore, playDailyForDate, loginStreak, bestLoginStreak, playArchive, streakRepair }) {
  const { user, profile: authProfile } = useAuth();
  // Audit Phase 5 (D2): poll for day rollover so the screen-local `today`
  // refreshes if the user keeps the tab open across midnight. Without
  // this, today + todayYMD stay frozen at mount time and downstream
  // memos show the wrong "today" the next morning.
  const [today, setToday] = useState(() => new Date());
  // Sprint #16: per-minute tick drives the KO countdown chip. `today`
  // still only updates on day rollover (downstream memos depend on
  // todayYMD identity), but `now` ticks every minute so the countdown
  // stays current.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNow(n);
      setToday(prev => n.toDateString() !== prev.toDateString() ? n : prev);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayYMD = dateToYMD(today);

  // Footle history map (Sprint #15 Stage 4+6): walks biq_wordle_* keys in
  // localStorage once and exposes the per-day status (won/lost/in-progress)
  // for downstream run + form derivations. Memoised on todayYMD so it
  // re-runs at most once per day rollover.
  const footleHistory = useMemo(() => {
    const map = new Map();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("biq_wordle_")) continue;
        const ymd = k.slice("biq_wordle_".length);
        try {
          const parsed = JSON.parse(localStorage.getItem(k));
          // 1.1 Daily v2: store guess count too so the fixtures Footle column
          // can show "solved in N/6", not just played/not.
          const used = Array.isArray(parsed?.guesses) ? parsed.guesses.length : 0;
          const arc = !!parsed?.arc;
          if (parsed?.status === "won") map.set(ymd, { status: "won", used, arc });
          else if (parsed?.status === "lost") map.set(ymd, { status: "lost", used, arc });
          else if (used > 0) map.set(ymd, { status: "in-progress", used, arc });
        } catch {}
      }
    } catch {}
    return map;
  }, [todayYMD]);

  // Trail + Mystery history, same shape as footleHistory ({ status, used }) so
  // the row renderer treats all four modes identically. One pass over
  // localStorage for both — walking it twice for two prefixes is pure waste.
  //
  // Storage shapes differ by mode and are NOT ours to change here:
  //   biq_trail_<ymd>   → { status: won|lost|playing, attempts: [...] }
  //   biq_mystery_<ymd> → { won: bool, guesses: [...] }        (no lose state —
  //                        Mystery is unlimited guesses, so "lost" cannot occur)
  const { trailHistory, mysteryHistory } = useMemo(() => {
    const trail = new Map();
    const mystery = new Map();
    const TP = "biq_trail_";
    const MP = "biq_mystery_";
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(TP)) {
          try {
            const p = JSON.parse(localStorage.getItem(k));
            const used = Array.isArray(p?.attempts) ? p.attempts.length : 0;
            if (p?.status === "won" || p?.status === "lost") trail.set(k.slice(TP.length), { status: p.status, used, arc: !!p.arc });
            else if (used > 0) trail.set(k.slice(TP.length), { status: "in-progress", used, arc: !!p.arc });
          } catch {}
        } else if (k.startsWith(MP)) {
          try {
            const p = JSON.parse(localStorage.getItem(k));
            const used = Array.isArray(p?.guesses) ? p.guesses.length : 0;
            if (p?.won) mystery.set(k.slice(MP.length), { status: "won", used, arc: !!p.arc });
            else if (used > 0) mystery.set(k.slice(MP.length), { status: "in-progress", used, arc: !!p.arc });
          } catch {}
        }
      }
    } catch {}
    return { trailHistory: trail, mysteryHistory: mystery };
  }, [todayYMD]);

  // Sprint #16 Stage 1: run + form derivations. Trimmed in Sprint #24
  // (v4 tactics card no longer uses per-mode streak chips, so footleRun
  // and t7Run dropped).
  // - unbeaten: consecutive days backward from today where AT LEAST ONE
  //   mode was attempted (Footle 'won' or 'lost' counts as attempt;
  //   'in-progress' does not — the day isn't decided yet)
  // - bestUnbeaten: max historical run of the same shape, walking forward
  //   from the earliest played day
  const localRun = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    // An "attempt" is a DECIDED day. Footle and the Trail both terminate
    // (won|lost), so an in-progress board doesn't count — the day isn't over.
    // Mystery has no lose state (unlimited guesses), so requiring a win there
    // would mean an honest failed attempt never counted at all; any guess
    // counts instead.
    const playedOn = (ymd) => {
      const f = footleHistory.get(ymd);
      const footleAttempt = f?.status === "won" || f?.status === "lost";
      const tr = trailHistory.get(ymd);
      const trailAttempt = tr?.status === "won" || tr?.status === "lost";
      const mysteryAttempt = !!mysteryHistory.get(ymd);
      return t7Set.has(ymd) || footleAttempt || trailAttempt || mysteryAttempt;
    };

    let unbeaten = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(todayMid - i * 86400000);
      if (!playedOn(dateToYMD(d))) break;
      unbeaten++;
    }

    let bestUnbeaten = 0;
    {
      const dates = new Set(t7Set);
      for (const [ymd, info] of footleHistory) {
        if (info?.status === "won" || info?.status === "lost") dates.add(ymd);
      }
      for (const [ymd, info] of trailHistory) {
        if (info?.status === "won" || info?.status === "lost") dates.add(ymd);
      }
      for (const ymd of mysteryHistory.keys()) dates.add(ymd);
      const sorted = Array.from(dates).sort();
      if (sorted.length > 0) {
        const first = sorted[0].split("-").map(Number);
        const firstTime = new Date(first[0], first[1] - 1, first[2]).getTime();
        let cur = 0;
        for (let t = firstTime; t <= todayMid; t += 86400000) {
          const d = new Date(t);
          if (playedOn(dateToYMD(d))) {
            cur++;
            if (cur > bestUnbeaten) bestUnbeaten = cur;
          } else cur = 0;
        }
      }
    }
    bestUnbeaten = Math.max(bestUnbeaten, unbeaten);
    return { unbeaten, bestUnbeaten };
  }, [today, dailyHistory, footleHistory, trailHistory, mysteryHistory]);

  // ⭐ ONE STREAK, shown identically here and on Home.
  //
  // These two surfaces used to disagree — Home rendered loginStreak (opens),
  // this screen rendered `localRun` (plays) — and both called it "day streak"
  // under the same flame. tickLoginStreak now fires on puzzle completion, so
  // loginStreak IS the play streak and it is the one to render: it is
  // server-authoritative, survives a reinstall, and merges across devices,
  // none of which a localStorage walk can do.
  //
  // The local derivation stays as the fallback for guests, who have no server
  // row, and as the source for the 14-day form strip below (which needs
  // per-day detail the streak scalar doesn't carry).
  const streak = useMemo(() => (
    typeof loginStreak === "number"
      ? { unbeaten: loginStreak, bestUnbeaten: Math.max(bestLoginStreak || 0, loginStreak) }
      : localRun
  ), [loginStreak, bestLoginStreak, localRun]);

  // Sprint #16 Stage 4: per-matchday rows for the history list. Walks
  // backward from today to either 30 days or first-played, whichever
  // comes sooner. Each row holds the parsed Footle + T7 results plus
  // a derived W/D/L badge.
  const matchdays = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let firstTime = todayMid;
    for (const ymd of t7Set) {
      const [y, m, d] = ymd.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      if (t < firstTime) firstTime = t;
    }
    // ⚠️ `info` is the { status, used } record, not a bare string. The original
    // destructured it as `status` and compared it to "in-progress", which was
    // never true — an abandoned Footle board silently pushed the first matchday
    // further back. Same shape for all three maps, so one helper covers them.
    const widenFirstTime = (map, decidedOnly) => {
      for (const [ymd, info] of map) {
        if (decidedOnly && info?.status === "in-progress") continue;
        const [y, m, d] = ymd.split("-").map(Number);
        const t = new Date(y, m - 1, d).getTime();
        if (t < firstTime) firstTime = t;
      }
    };
    widenFirstTime(footleHistory, true);
    widenFirstTime(trailHistory, true);
    widenFirstTime(mysteryHistory, false);
    const totalMatchdays = Math.floor((todayMid - firstTime) / 86400000) + 1;
    const showCount = Math.min(30, totalMatchdays);
    const rows = [];
    for (let i = 0; i < showCount; i++) {
      const t = todayMid - i * 86400000;
      const d = new Date(t);
      const ymd = dateToYMD(d);
      const md = Math.floor((t - firstTime) / 86400000) + 1;
      const t7Score = dailyHistory?.[ymd];
      const t7Done = typeof t7Score === "number";
      const fInfo = footleHistory.get(ymd);
      const fStatus = fInfo?.status || null;
      const fWon = fStatus === "won";
      const fAttempt = fWon || fStatus === "lost";
      const fUsed = fInfo?.used || 0;
      const trInfo = trailHistory.get(ymd);
      const trWon = trInfo?.status === "won";
      const trAttempt = trWon || trInfo?.status === "lost";
      const trUsed = trInfo?.used || 0;
      const myInfo = mysteryHistory.get(ymd);
      const myWon = myInfo?.status === "won";
      const myAttempt = !!myInfo;
      const myUsed = myInfo?.used || 0;
      // Availability is per-day, not global: both modes launched after Footle,
      // so cells before their first puzzle stay blank rather than printing a
      // dash the user could read as a missed day.
      const dNoon = noon(t);
      const trLive = trailLiveOn(dNoon);
      const myLive = mysteryLiveOn(dNoon);
      const isToday = i === 0;
      let dateLabel;
      if (isToday) dateLabel = "Today";
      else if (i === 1) dateLabel = "Yesterday";
      else dateLabel = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateSub = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      rows.push({
        // isYesterday still gates the DAILY 7 catch-up (a question SET replay
        // stays yesterday-only, close enough to live to count as it). The
        // other three modes now replay from ANY unplayed row via `md` — their
        // archive saves carry the arc stamp, so back-fill is streak-inert.
        ymd, md, dateLabel, dateSub, isToday, isYesterday: i === 1, t7Score, t7Done, fAttempt, fWon, fUsed,
        trAttempt, trWon, trUsed, trLive, myAttempt, myWon, myUsed, myLive,
      });
    }
    return rows;
  }, [today, dailyHistory, footleHistory, trailHistory, mysteryHistory]);

  const form14 = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    // Sprint #62 fix 1: compute the user's first-played day. Days before
    // it are rendered as "pre" (neutral, no aria-label of "Missed") so a
    // brand-new user doesn't see a 13-cell graveyard accusing them of
    // missing days that didn't exist for them yet. Mirrors the firstTime
    // logic in the matchdays memo below.
    let firstTime = todayMid;
    for (const ymd of t7Set) {
      const [y, m, d] = ymd.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      if (t < firstTime) firstTime = t;
    }
    const widenFirstTime = (map, decidedOnly) => {
      for (const [ymd, info] of map) {
        if (decidedOnly && info?.status === "in-progress") continue;
        const [y, m, d] = ymd.split("-").map(Number);
        const t = new Date(y, m - 1, d).getTime();
        if (t < firstTime) firstTime = t;
      }
    };
    widenFirstTime(footleHistory, true);
    widenFirstTime(trailHistory, true);
    widenFirstTime(mysteryHistory, false);
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayMid - i * 86400000);
      const ymd = dateToYMD(d);
      const isToday = i === 0;
      const t7 = t7Set.has(ymd);
      const fInfo = footleHistory.get(ymd);
      const fAttempt = fInfo?.status === "won" || fInfo?.status === "lost";
      const trInfo = trailHistory.get(ymd);
      const trAttempt = trInfo?.status === "won" || trInfo?.status === "lost";
      const myAttempt = !!mysteryHistory.get(ymd);
      // Four modes now, so W/D can't mean "both" any more: W = a properly
      // full day (2+ modes), D = exactly one. The squares themselves only
      // render played-vs-not, so this distinction is carried by the label.
      const done = [
        t7 && "Daily 7", fAttempt && "Footle", trAttempt && "Trail", myAttempt && "Mystery",
      ].filter(Boolean);
      // A day whose every play carries the arc stamp was CAUGHT UP later, not
      // played on the day — it still fills the strip (a true record of the
      // puzzle being done) but says so, and renders dimmed. This is the
      // honesty rule that unblocked the back-catalogue: back-filling may
      // never silently repaint the form. (Daily 7 has no arc stamp — its
      // catch-up is yesterday-only, close enough to live to count as it.)
      const liveDone = [
        t7 && "Daily 7",
        fAttempt && !fInfo?.arc && "Footle",
        trAttempt && !trInfo?.arc && "Trail",
        myAttempt && !mysteryHistory.get(ymd)?.arc && "Mystery",
      ].filter(Boolean);
      const arcOnly = done.length > 0 && liveDone.length === 0;
      let cls, label;
      if (done.length >= 2) { cls = "W"; label = done.join(" + "); }
      else if (done.length === 1) { cls = "D"; label = `${done[0]} only`; }
      else if (!isToday && d.getTime() < firstTime) { cls = "pre"; label = "Before your first puzzle"; }
      else { cls = "L"; label = isToday ? "Pending" : "Missed"; }
      if (arcOnly) label += " · caught up later";
      out.push({ ymd, cls, isToday, arcOnly, aria: `${ymd}: ${label}` });
    }
    return out;
  }, [today, dailyHistory, footleHistory, trailHistory, mysteryHistory]);

  // Today's playable set. Built once and rendered by BOTH breakpoints — the
  // two-card version had already drifted (mobile said "Guess the player",
  // desktop "N letters · surname of a footballer"), and four modes across two
  // layouts is where that becomes a real maintenance trap.
  //
  // Trail and Mystery are CONDITIONAL: neither has an answer for every date, so
  // a hard-coded card would offer a puzzle that cannot be played. Same gate
  // HomeScreen uses for its tiles.
  const todayModes = useMemo(() => {
    const nowNoon = noon(today.getTime());
    const f = footleHistory.get(todayYMD);
    const tr = trailHistory.get(todayYMD);
    const my = mysteryHistory.get(todayYMD);
    const footleLen = (() => { try { return getWordleAnswer().length; } catch { return 0; } })();

    const list = [
      {
        key: "footle", name: "Footle", theme: MODE_THEME.footle,
        sub: FOOTLE_SHORT,
        subLong: `${footleLen > 0 ? `${footleLen} letters · ` : ""}surname of a footballer in 6 guesses`,
        done: f?.status === "won" || f?.status === "lost",
        won: f?.status === "won",
        result: f?.status === "won" ? `✓ Solved in ${f.used}` : "✗ Not solved",
        cta: f?.status === "in-progress" ? "Continue" : "Play",
        // Result stays tappable — reopening a solved Footle shows the board
        // and the share button, which is the whole return loop.
        replay: true,
        onTap: () => setScreen?.("wordle"),
      },
      {
        key: "daily7", name: "Daily 7", theme: MODE_THEME.daily7,
        sub: "7 questions · ~3 min",
        subLong: "7 questions · ~3 min · shared by everyone today",
        done: !!dailyDone, won: true,
        result: `${dailyScore}/7`,
        cta: "Play",
        replay: false,
        onTap: () => startMode?.("daily"),
      },
    ];
    if (trailLiveOn(nowNoon)) {
      list.push({
        key: "trail", name: "Transfer Trail", theme: MODE_THEME.trail,
        sub: "Name him from his clubs",
        subLong: "Clubs revealed one by one · 5 guesses",
        done: tr?.status === "won" || tr?.status === "lost",
        won: tr?.status === "won",
        result: tr?.status === "won" ? `✓ In ${tr.used}` : "✗ Not solved",
        cta: tr?.status === "in-progress" ? "Continue" : "Play",
        replay: true,
        onTap: () => setScreen?.("trail"),
      });
    }
    if (mysteryLiveOn(nowNoon)) {
      list.push({
        key: "mystery", name: "Mystery Player", theme: MODE_THEME.mystery,
        // Short enough to stay on ONE line beside a 46pt icon and a Play
        // button at 375pt — the longer copy wrapped and made this card taller
        // than the three above it.
        sub: "Warmer or colder",
        subLong: "Every guess is ranked · unlimited tries",
        // No lose state: Mystery is unlimited guesses, so the day is only
        // "done" once it is solved.
        done: my?.status === "won",
        won: my?.status === "won",
        result: `✓ In ${my?.used || 0}`,
        cta: my ? "Continue" : "Play",
        replay: true,
        onTap: () => setScreen?.("mystery"),
      });
    }
    return list;
  }, [today, todayYMD, footleHistory, trailHistory, mysteryHistory, dailyDone, dailyScore, setScreen, startMode]);

  const playedCount = todayModes.filter(m => m.done).length;

  // A3. `todayModes.length > 0` is not paranoia — Trail and Mystery are
  // conditional, so a day with neither live and both fixed modes played is the
  // shortest possible complete day, and an empty list must never read as one.
  const allDone = todayModes.length > 0 && playedCount === todayModes.length;
  const dayOpen = useMemo(
    () => (allDone || streakRepair ? yesterdayOpen(matchdays, today, playArchive, playDailyForDate) : []),
    [allDone, streakRepair, matchdays, today, playArchive, playDailyForDate],
  );
  const playSurvival = useCallback(() => startMode?.("survival"), [startMode]);

  return (
    <div className="tab-content daily-screen">
      {/* ═══ MOBILE (<1024) — byte-identical existing markup. Wrapped in a
          display:contents box (generates no layout box, so mobile flow is
          unchanged) that flips to display:none at >=1024. ═══ */}
      <div className="daily-col-mobile">
      {/* Daily redesign ("Today first" handoff): gear + greeting + title with
          countdown pill, then the hero checklist card — today's two puzzles
          with real CTAs that flip to result chips once played. */}
      {(() => {
        const authLoading = !!user && !authProfile;
        const name = authProfile?.username || profile?.name || null;
        const ko = formatCountdown(msToNextLocalMidnight(now));
        const todayLabel = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        return (
          <>
            {/* No local gear — AppInner's global header already renders one. */}
            <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 2 }} role="status">
              {timeOfDayGreeting(now)}{(name || authLoading) ? ", " : ""}
              {authLoading ? <b style={{ color: "var(--t1)", fontWeight: 700 }}>…</b> : name ? <b style={{ color: "var(--t1)", fontWeight: 700 }}>{name}</b> : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--t1)" }}>Daily</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 999, background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.25)" }} aria-label={`New puzzles in ${ko}`}>
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: "var(--t2)" }}>NEW PUZZLES IN</span>
                <span style={{ fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace", fontSize: 13, fontWeight: 800, color: "#FFC107", fontVariantNumeric: "tabular-nums" }}>{ko}</span>
              </span>
            </div>

            {/* Today's puzzles — one tinted row-card per live mode. Trail and
                Mystery only appear on days they actually have an answer, so the
                count is derived, never "of 2". */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 2px", marginBottom: 2 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t2)" }}>Today · {todayLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{playedCount} of {todayModes.length} played</span>
              </div>
              {todayModes.map(m => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 13, background: m.theme.card, border: m.theme.bd, borderRadius: 16, padding: "14px 16px" }}>
                  <span style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 13, background: m.theme.iconBg, border: m.theme.iconBd, color: m.theme.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true"><ModeGlyph mode={m.key} size={22} /></span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--t1)" }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: "var(--t3)" }}>{m.sub}</span>
                  </div>
                  {m.done && !m.replay ? (
                    // Daily 7 is the one mode with nothing to come back to once
                    // scored, so its result is a label rather than a control.
                    <span style={{ borderRadius: 12, background: m.theme.chipBg, border: m.theme.resBd, padding: "10px 18px", fontSize: 13.5, fontWeight: 800, color: m.theme.fg, flexShrink: 0 }}>{m.result}</span>
                  ) : (
                    <button onClick={m.onTap}
                      aria-label={m.done ? `${m.name} — ${m.result}` : `${m.cta} ${m.name}`}
                      style={{ borderRadius: 12, background: m.done ? m.theme.chipBg : m.theme.btnBg, border: m.done ? m.theme.resBd : m.theme.btnBd, padding: m.done ? "10px 18px" : "11px 24px", fontSize: m.done ? 13.5 : 14, fontWeight: 800, color: m.theme.fg, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      {m.done ? m.result : m.cta}
                    </button>
                  )}
                </div>
              ))}
              <StreakRepairBanner repair={streakRepair} open={dayOpen} />
              {allDone && <DayComplete open={dayOpen} onSurvival={playSurvival} todayYMD={todayYMD} />}
            </div>
          </>
        );
      })()}

      {/* Streak strip (redesign): 🔥 line + last-14 form squares. Played days
          #2E7D1F, today-played bright green with glow, missed raised bg,
          today-pending = amber outline until a puzzle is completed. */}
      <div role="status" aria-label={`${streak.unbeaten}-day daily streak, best ${streak.bestUnbeaten}`}
        style={{ marginTop: 12, borderRadius: 18, background: "var(--s1)", border: "1px solid var(--border)", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t1)" }}>{streak.unbeaten} day streak</span>
          <span style={{ fontSize: 12, color: "var(--t2)" }}>{streak.unbeaten > 0 ? "— come back tomorrow to keep it" : "— play one puzzle to light it"}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }} role="group" aria-label="Form — last 14 days">
          {form14.map((d) => {
            const played = d.cls === "W" || d.cls === "D";
            const s = { flex: 1, height: 18, borderRadius: 4 };
            if (d.isToday && played) Object.assign(s, { background: "#58CC02", boxShadow: "0 0 8px rgba(88,204,2,0.5)" });
            else if (d.isToday) Object.assign(s, { background: "transparent", border: "1.5px solid #FFC107" });
            else if (played) Object.assign(s, { background: "#2E7D1F", opacity: d.arcOnly ? 0.55 : 1 });
            else Object.assign(s, { background: "var(--s2)", opacity: d.cls === "pre" ? 0.45 : 1 });
            return <span key={d.ymd} style={s} aria-label={d.aria} title={d.aria} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "var(--t3)" }}>2 WK AGO</span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "#FFC107" }}>TODAY</span>
        </div>
      </div>

      {/* Recent days table — one column per mode. The header carries 14px of
          side padding so its labels sit over the cells inside the row cards,
          which have the same padding (the two-column version was 14px out). */}
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 18, padding: "0 14px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t2)", flex: 1 }}>Recent days</span>
        {MODE_COLS.map(c => (
          <span key={c.key} style={{ width: COL_W, flexShrink: 0, textAlign: "center", fontSize: 8.5, fontWeight: 800, letterSpacing: "0.02em", color: c.theme.head }}>{c.label}</span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9, marginBottom: 14 }}>
        {matchdays.map(m => {
          const cells = rowCells(m);
          const catchUp = m.isYesterday && !m.t7Done && playDailyForDate;
          return (
            <div key={m.ymd} aria-label={rowAria(m)}
              style={{ borderRadius: 13, padding: "10px 14px", display: "flex", alignItems: "center",
                background: m.isToday ? "rgba(88,204,2,0.05)" : "var(--s1)",
                border: m.isToday ? "1px solid rgba(88,204,2,0.4)" : "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t1)" }}>{m.dateLabel}</span>
                <span style={{ fontSize: 10.5, color: "var(--t3)" }}>{m.dateSub}</span>
              </div>
              {cells.map(c => (
                c.key === "daily7" && catchUp ? (
                  // Comeback hook (opportunity-scan #8): yesterday's missed
                  // Daily 7 stays playable for one day. A 44pt column can't hold
                  // the words "Catch up", so it becomes a replay glyph — still a
                  // real control, and it keeps its label for screen readers.
                  <span key={c.key} style={{ width: COL_W, flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
                    <button onClick={() => playDailyForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))}
                      aria-label="Catch up — play yesterday's Daily 7" title="Catch up — play yesterday's Daily 7"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "rgba(255,193,7,0.14)", border: "1px solid rgba(255,193,7,0.42)", fontSize: 13, fontWeight: 800, color: "#FFC107", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>↺</button>
                  </span>
                ) : (!m.isToday && c.state === "none" && REPLAY_SCREEN[c.key] && playArchive) ? (
                  <ReplayCell key={c.key} w={COL_W} theme={c.theme}
                    label={`Play ${m.dateLabel}'s ${MODE_LABEL[c.key]}`}
                    onTap={() => { const [ry, rm, rd] = m.ymd.split("-").map(Number); playArchive(REPLAY_SCREEN[c.key], new Date(ry, rm - 1, rd)); }} />
                ) : <ScoreCell key={c.key} state={c.state} text={c.text} theme={c.theme} />
              ))}
            </div>
          );
        })}
      </div>

      {shieldCount > 0 && (
        <div style={{background:"rgba(88,204,2,0.04)",border:"1px solid rgba(88,204,2,0.10)",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🛡️</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{shieldCount} streak shield{shieldCount === 1 ? "" : "s"} ready</div>
            <div style={{fontSize:11,color:"var(--t2)"}}>Auto-protects your streak if you miss a day — earn one every 200 XP</div>
          </div>
        </div>
      )}
      </div>{/* /.daily-col-mobile — end of byte-identical mobile markup */}

      {/* ═══ DESKTOP (>=1024) — two-column layout copied from the design handoff
          (screen 05 · Daily). Rendered always but display:none <1024, so mobile
          stays byte-identical; reset in the PWA-standalone killswitch so an
          installed desktop PWA also stays mobile-identical. All data comes from
          the same derivations the mobile markup uses (footleHistory, dailyDone/
          dailyScore, runStats, matchdays, form14) — nothing hardcoded. ═══ */}
      <div className="daily-desktop">
        {(() => {
          const ko = formatCountdown(msToNextLocalMidnight(now));

          // 14-day form cells reuse the Home rail streak card's shape (done +
          // today), derived from the SAME form14 the mobile strip renders so
          // both breakpoints light identical days.
          const streakCells = form14.map(d => ({ done: d.cls === "W" || d.cls === "D", isToday: d.isToday }));

          // "This week" — last 7 local days. Puzzles solved now counts all four
          // modes, not just Footle + Daily 7; leaving Trail and Mystery out
          // would under-report the week the moment they appear in the table
          // right above this card.
          const weekMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          let solved = 0, d7sum = 0, d7count = 0;
          for (let i = 0; i < 7; i++) {
            const ymd = dateToYMD(new Date(weekMid - i * 86400000));
            if (footleHistory.get(ymd)?.status === "won") solved++;
            if (trailHistory.get(ymd)?.status === "won") solved++;
            if (mysteryHistory.get(ymd)?.status === "won") solved++;
            const sc = dailyHistory?.[ymd];
            if (typeof sc === "number") { solved++; d7sum += sc; d7count++; }
          }
          const avgDaily7 = d7count > 0 ? (d7sum / d7count).toFixed(1) : null;

          // Recent-days list = matchdays minus today (today lives in the two
          // hero cards above, matching the handoff).
          const recentDays = matchdays.filter(m => !m.isToday);

          const rowCard = { display: "flex", alignItems: "center", gap: 16, borderRadius: 16, padding: "18px 20px" };
          const iconBox = { width: 46, height: 46, flex: "0 0 auto", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" };
          // Desktop has the room mobile doesn't, so its columns stay wider than
          // COL_W — but they're still driven by the same MODE_COLS/rowCells.
          const DCOL_W = 62;
          const colHead = { width: DCOL_W, flexShrink: 0, textAlign: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em" };
          return (
            <>
              {/* Header: title + amber countdown pill */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--t1)" }}>Daily</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.25)" }} aria-label={`New puzzles in ${ko}`}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: "var(--t2)" }}>NEW PUZZLES IN</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#FFC107", fontVariantNumeric: "tabular-nums" }}>{ko}</span>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.55fr 0.9fr", gap: 22, marginTop: 22, alignItems: "start" }}>
                {/* ── LEFT column ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t3)" }}>Today</span>
                    <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{playedCount} / {todayModes.length} played</span>
                  </div>

                  {/* One row-card per live mode — same todayModes the mobile
                      layout renders, so the two can't drift apart again. */}
                  {todayModes.map(m => (
                    <div key={m.key} style={{ ...rowCard, border: m.theme.bd, background: m.theme.card }}>
                      <span style={{ ...iconBox, background: m.theme.iconBg, border: m.theme.iconBd, color: m.theme.fg }} aria-hidden="true"><ModeGlyph mode={m.key} size={21} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>{m.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--t2)" }}>{m.subLong}</div>
                      </div>
                      {m.done && !m.replay ? (
                        <span style={{ flex: "0 0 auto", padding: "9px 16px", borderRadius: 11, background: m.theme.chipBg, border: m.theme.resBd, color: m.theme.fg, fontWeight: 800, fontSize: 13.5 }}>{m.result}</span>
                      ) : (
                        <button onClick={m.onTap}
                          aria-label={m.done ? `${m.name} — ${m.result}` : `${m.cta} ${m.name}`}
                          style={{ flex: "0 0 auto", cursor: "pointer", fontFamily: "inherit", fontWeight: 800,
                            ...(m.done
                              ? { padding: "9px 16px", borderRadius: 11, fontSize: 13.5, ...(m.won
                                  ? { background: m.theme.chipBg, border: m.theme.resBd, color: m.theme.fg }
                                  : { background: "rgba(255,107,107,0.10)", border: "1.5px solid rgba(255,107,107,0.35)", color: "#FF6B6B" }) }
                              : { padding: "10px 22px", borderRadius: 12, fontSize: 14, background: m.theme.btnBg, border: m.theme.btnBd, color: m.theme.fg }) }}>
                          {m.done ? m.result : m.cta}
                        </button>
                      )}
                    </div>
                  ))}

                  <StreakRepairBanner repair={streakRepair} open={dayOpen} wide />
                  {allDone && <DayComplete open={dayOpen} onSurvival={playSurvival} wide todayYMD={todayYMD} />}

                  {/* Recent days */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)" }}>Recent days</span>
                      <span style={{ display: "flex", paddingRight: 16 }}>
                        {MODE_COLS.map(c => (
                          <span key={c.key} style={{ ...colHead, color: c.theme.head }}>{c.label}</span>
                        ))}
                      </span>
                    </div>
                    {recentDays.length === 0 ? (
                      <div style={{ borderRadius: 13, background: "var(--s1)", border: "1px solid var(--border)", padding: "14px 16px", fontSize: 12.5, color: "var(--t3)" }}>
                        Play today, then your recent days show up here.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {recentDays.map(m => {
                          const cells = rowCells(m);
                          const catchUp = m.isYesterday && !m.t7Done && playDailyForDate;
                          return (
                            <div key={m.ymd} aria-label={rowAria(m)}
                              style={{ display: "flex", alignItems: "center", borderRadius: 13, background: "var(--s1)", border: "1px solid var(--border)", padding: "11px 16px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t1)" }}>{m.dateLabel}</span>{" "}
                                <span style={{ fontSize: 11, color: "var(--t3)" }}>{m.dateSub}</span>
                              </div>
                              {cells.map(c => (
                                c.key === "daily7" && catchUp ? (
                                  // Same catch-up affordance, and the same glyph
                                  // as mobile: at 62pt the words "Catch up" wrap
                                  // to two lines and push the row taller than
                                  // its neighbours.
                                  <span key={c.key} style={{ width: DCOL_W, flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
                                    <button onClick={() => playDailyForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))}
                                      aria-label="Catch up — play yesterday's Daily 7" title="Catch up — play yesterday's Daily 7"
                                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "rgba(255,193,7,0.14)", border: "1px solid rgba(255,193,7,0.42)", fontSize: 13, fontWeight: 800, color: "#FFC107", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>↺</button>
                                  </span>
                                ) : (!m.isToday && c.state === "none" && REPLAY_SCREEN[c.key] && playArchive) ? (
                                  <ReplayCell key={c.key} w={DCOL_W} theme={c.theme}
                                    label={`Play ${m.dateLabel}'s ${MODE_LABEL[c.key]}`}
                                    onTap={() => { const [ry, rm, rd] = m.ymd.split("-").map(Number); playArchive(REPLAY_SCREEN[c.key], new Date(ry, rm - 1, rd)); }} />
                                ) : <ScoreCell key={c.key} w={DCOL_W} state={c.state} text={c.text} theme={c.theme} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT rail ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                  {/* Streak card — reuses the Home rail .hr-card.hr-streak markup +
                      tokens, fed with Daily's own streak (runStats) + form14 so
                      the mobile strip and this card never disagree. */}
                  <div className="hr-card hr-streak" role="status" aria-label={`${streak.unbeaten}-day daily streak, best ${streak.bestUnbeaten}`}>
                    <div className="hr-streak-head">
                      <div className="hr-streak-num"><span className="hr-flame" aria-hidden="true">🔥</span>{streak.unbeaten}</div>
                      <div className="hr-streak-meta">
                        <div className="hr-streak-label">Day streak</div>
                        <div className="hr-streak-best">Best · {streak.bestUnbeaten}</div>
                      </div>
                    </div>
                    <div className="hr-form" aria-hidden="true">
                      {streakCells.map((c, i) => (
                        <span key={i} className={`hr-form-cell${c.done ? " is-done" : ""}${c.isToday ? " is-today" : ""}`} />
                      ))}
                    </div>
                    <div className="hr-form-cap">Last 14 days</div>
                  </div>

                  {/* This week */}
                  <div style={{ borderRadius: 18, border: "1px solid var(--border)", background: "var(--s1)", padding: "18px 20px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>This week</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "var(--t2)" }}>Puzzles solved</span>
                        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>{solved}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "var(--t2)" }}>Avg. Daily 7</span>
                        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: avgDaily7 ? "var(--t1)" : "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{avgDaily7 ? `${avgDaily7} / 7` : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
export const DailyTabScreen = React.memo(DailyTabScreenImpl);
