import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../useAuth.jsx";
import { dateToYMD } from "../lib/date.js";
import { getWordleAnswer } from "../lib/wordle.js";

// Shared monospace stack for tabular numerals (countdown, scores). Mirrors the
// inline font used by the mobile markup so the >=1024 desktop layout renders
// identical figures.
const MONO = "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace";

// Milliseconds until the next LOCAL midnight. The "KO in Xh Ym" chip
// previewed when the next Daily set unlocks for THIS user. Sprint #70
// LL6 fix: originally computed against UTC midnight on the assumption
// that server-side rollover was UTC-anchored. It isn't — dayIndexForDate
// + dateToYMD both key off the user's LOCAL date, so each user's Daily
// rolls at their LOCAL midnight. A UTC anchor would mislead UTC-negative
// users (NYC at 19:00 saw "24h" when actual rollover was 5h) and UTC-
// positive users (Tokyo at 23:30 saw "9h 30m" when actual was 30m).
function msToNextLocalMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
function formatKO(ms) {
  if (ms <= 0) return "soon";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
function timeOfDayGreeting(d = new Date()) {
  const h = d.getHours();
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

function DailyTabScreenImpl({ profile, xp, shieldCount, dailyHistory, startMode, setScreen, dailyDone, dailyScore }) {
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
          if (parsed?.status === "won") map.set(ymd, { status: "won", used });
          else if (parsed?.status === "lost") map.set(ymd, { status: "lost", used });
          else if (used > 0) map.set(ymd, { status: "in-progress", used });
        } catch {}
      }
    } catch {}
    return map;
  }, [todayYMD]);

  // Sprint #16 Stage 1: run + form derivations. Trimmed in Sprint #24
  // (v4 tactics card no longer uses per-mode streak chips, so footleRun
  // and t7Run dropped).
  // - unbeaten: consecutive days backward from today where AT LEAST ONE
  //   mode was attempted (Footle 'won' or 'lost' counts as attempt;
  //   'in-progress' does not — the day isn't decided yet)
  // - bestUnbeaten: max historical run of the same shape, walking forward
  //   from the earliest played day
  const runStats = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const playedOn = (ymd) => {
      const f = footleHistory.get(ymd);
      const footleAttempt = f?.status === "won" || f?.status === "lost";
      return t7Set.has(ymd) || footleAttempt;
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
  }, [today, dailyHistory, footleHistory]);

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
    for (const [ymd, status] of footleHistory) {
      if (status === "in-progress") continue;
      const [y, m, d] = ymd.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      if (t < firstTime) firstTime = t;
    }
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
      const isToday = i === 0;
      let dateLabel;
      if (isToday) dateLabel = "Today";
      else if (i === 1) dateLabel = "Yesterday";
      else dateLabel = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateSub = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      rows.push({
        ymd, md, dateLabel, dateSub, isToday, t7Score, t7Done, fAttempt, fWon, fUsed,
      });
    }
    return rows;
  }, [today, dailyHistory, footleHistory]);

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
    for (const [ymd, status] of footleHistory) {
      if (status === "in-progress") continue;
      const [y, m, d] = ymd.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      if (t < firstTime) firstTime = t;
    }
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayMid - i * 86400000);
      const ymd = dateToYMD(d);
      const isToday = i === 0;
      const t7 = t7Set.has(ymd);
      const fInfo = footleHistory.get(ymd);
      const fAttempt = fInfo?.status === "won" || fInfo?.status === "lost";
      let cls, label;
      if (t7 && fAttempt) { cls = "W"; label = "Win"; }
      else if (t7 || fAttempt) { cls = "D"; label = t7 ? "Daily 7 only" : "Footle only"; }
      else if (!isToday && d.getTime() < firstTime) { cls = "pre"; label = "Before your first puzzle"; }
      else { cls = "L"; label = isToday ? "Pending" : "Missed"; }
      out.push({ ymd, cls, isToday, aria: `${ymd}: ${label}` });
    }
    return out;
  }, [today, dailyHistory, footleHistory]);

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
        const ko = formatKO(msToNextLocalMidnight(now));
        const f = footleHistory.get(todayYMD);
        const fPlayed = f?.status === "won" || f?.status === "lost";
        const playedCount = (fPlayed ? 1 : 0) + (dailyDone ? 1 : 0);
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

            {/* Today's two puzzles — each a tinted row-card (green Footle,
                amber Daily 7), matching the web Daily tab. */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 2px", marginBottom: 2 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t2)" }}>Today · {todayLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{playedCount} of 2 played</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,rgba(88,204,2,0.13),rgba(88,204,2,0.02) 55%,var(--s1))", border: "1px solid rgba(88,204,2,0.22)", borderRadius: 16, padding: "14px 16px" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--s2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>⚽</span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--t1)" }}>Footle</span>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>Guess the player</span>
                </div>
                {fPlayed ? (
                  <button onClick={() => setScreen?.("wordle")} style={{ borderRadius: 12, background: "rgba(88,204,2,0.1)", border: "1.5px solid rgba(88,204,2,0.5)", padding: "10px 18px", fontSize: 13.5, fontWeight: 800, color: "#8AE042", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    {f?.status === "won" ? `✓ Solved in ${f.used}` : "✗ Not solved"}
                  </button>
                ) : (
                  <button onClick={() => setScreen?.("wordle")} style={{ borderRadius: 12, background: "rgba(88,204,2,0.15)", border: "1px solid rgba(88,204,2,0.42)", padding: "11px 24px", fontSize: 14, fontWeight: 800, color: "#8AE042", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>{f?.status === "in-progress" ? "Continue" : "Play"}</button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(120deg,rgba(255,170,0,0.12),rgba(255,193,7,0.03) 55%,var(--s1))", border: "1px solid rgba(255,193,7,0.22)", borderRadius: 16, padding: "14px 16px" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--s2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>📋</span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--t1)" }}>Daily 7</span>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>7 questions · ~3 min</span>
                </div>
                {dailyDone ? (
                  <span style={{ borderRadius: 12, background: "rgba(255,193,7,0.1)", border: "1.5px solid rgba(255,193,7,0.4)", padding: "10px 18px", fontSize: 13.5, fontWeight: 800, color: "#FFC107", flexShrink: 0 }}>{dailyScore}/7</span>
                ) : (
                  <button onClick={() => startMode?.("daily")} style={{ borderRadius: 12, background: "rgba(255,193,7,0.14)", border: "1px solid rgba(255,193,7,0.42)", padding: "11px 24px", fontSize: 14, fontWeight: 800, color: "#FFC107", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Play</button>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Streak strip (redesign): 🔥 line + last-14 form squares. Played days
          #2E7D1F, today-played bright green with glow, missed raised bg,
          today-pending = amber outline until a puzzle is completed. */}
      <div role="status" aria-label={`${runStats.unbeaten}-day daily streak, best ${runStats.bestUnbeaten}`}
        style={{ marginTop: 12, borderRadius: 18, background: "var(--s1)", border: "1px solid var(--border)", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t1)" }}>{runStats.unbeaten} day streak</span>
          <span style={{ fontSize: 12, color: "var(--t2)" }}>{runStats.unbeaten > 0 ? "— come back tomorrow to keep it" : "— play one puzzle to light it"}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }} role="group" aria-label="Form — last 14 days">
          {form14.map((d) => {
            const played = d.cls === "W" || d.cls === "D";
            const s = { flex: 1, height: 18, borderRadius: 4 };
            if (d.isToday && played) Object.assign(s, { background: "#58CC02", boxShadow: "0 0 8px rgba(88,204,2,0.5)" });
            else if (d.isToday) Object.assign(s, { background: "transparent", border: "1.5px solid #FFC107" });
            else if (played) Object.assign(s, { background: "#2E7D1F" });
            else Object.assign(s, { background: "var(--s2)", opacity: d.cls === "pre" ? 0.45 : 1 });
            return <span key={d.ymd} style={s} aria-label={d.aria} title={d.aria} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "var(--t3)" }}>2 WK AGO</span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "#FFC107" }}>TODAY</span>
        </div>
      </div>

      {/* Recent days table (redesign): green FOOTLE / amber DAILY 7 chip
          columns (purple was off-palette), today row highlighted. */}
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 18 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t2)", flex: 1 }}>Recent days</span>
        <span style={{ width: 70, textAlign: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: "#8AE042" }}>FOOTLE</span>
        <span style={{ width: 70, textAlign: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: "#FFC107" }}>DAILY 7</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9, marginBottom: 14 }}>
        {matchdays.map(m => {
          const footleAria = m.fWon ? `Footle solved in ${m.fUsed}` : m.fAttempt ? "Footle not solved" : "Footle not played";
          const daily7Aria = m.t7Done ? `Daily 7 ${m.t7Score} of 7` : "Daily 7 not played";
          return (
            <div key={m.ymd} aria-label={`${m.dateLabel} ${m.dateSub} — ${footleAria}, ${daily7Aria}`}
              style={{ borderRadius: 13, padding: "10px 14px", display: "flex", alignItems: "center",
                background: m.isToday ? "rgba(88,204,2,0.05)" : "var(--s1)",
                border: m.isToday ? "1px solid rgba(88,204,2,0.4)" : "1px solid var(--border)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t1)" }}>{m.dateLabel}</span>
                <span style={{ fontSize: 10.5, color: "var(--t3)" }}>{m.dateSub}</span>
              </div>
              <span style={{ width: 70, display: "inline-flex", justifyContent: "center" }} aria-hidden="true">
                {m.fWon
                  ? <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 999, background: "rgba(88,204,2,0.1)", fontSize: 12, fontWeight: 800, color: "#8AE042" }}>✓ in {m.fUsed}</span>
                  : m.fAttempt
                  ? <span style={{ fontSize: 13, fontWeight: 700, color: "#FF6B6B" }}>✗</span>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: "#3A3D4A" }}>—</span>}
              </span>
              <span style={{ width: 70, display: "inline-flex", justifyContent: "center" }} aria-hidden="true">
                {m.t7Done
                  ? <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 999, background: "rgba(255,193,7,0.1)", fontSize: 12, fontWeight: 800, color: "#FFC107" }}>{m.t7Score}/7</span>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: "#3A3D4A" }}>—</span>}
              </span>
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
          const ko = formatKO(msToNextLocalMidnight(now));
          const f = footleHistory.get(todayYMD);
          const fWon = f?.status === "won";
          const fPlayed = fWon || f?.status === "lost";
          const playedCount = (fPlayed ? 1 : 0) + (dailyDone ? 1 : 0);
          // Real Footle answer length (only the LENGTH is surfaced, never the
          // word) — mirrors Home's DesktopFootleHero so the sub-label is honest
          // rather than the mock's fixed "7 letters".
          const footleLen = (() => { try { return getWordleAnswer().length; } catch { return 0; } })();

          // 14-day form cells reuse the Home rail streak card's shape (done +
          // today), derived from the SAME form14 the mobile strip renders so
          // both breakpoints light identical days.
          const streakCells = form14.map(d => ({ done: d.cls === "W" || d.cls === "D", isToday: d.isToday }));

          // "This week" — last 7 local days. Puzzles solved = Footle wins +
          // Daily 7 completions; Avg Daily 7 = mean score over completed Daily 7s.
          const weekMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          let solved = 0, d7sum = 0, d7count = 0;
          for (let i = 0; i < 7; i++) {
            const ymd = dateToYMD(new Date(weekMid - i * 86400000));
            if (footleHistory.get(ymd)?.status === "won") solved++;
            const sc = dailyHistory?.[ymd];
            if (typeof sc === "number") { solved++; d7sum += sc; d7count++; }
          }
          const avgDaily7 = d7count > 0 ? (d7sum / d7count).toFixed(1) : null;

          // Recent-days list = matchdays minus today (today lives in the two
          // hero cards above, matching the handoff).
          const recentDays = matchdays.filter(m => !m.isToday);

          const rowCard = { display: "flex", alignItems: "center", gap: 16, borderRadius: 16, padding: "18px 20px" };
          const iconBox = { width: 46, height: 46, flex: "0 0 auto", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" };
          const colHead = { width: 74, textAlign: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em" };
          const chip = { padding: "3px 10px", borderRadius: 999, fontFamily: MONO, fontSize: 12, fontWeight: 800 };
          const dash = { fontSize: 13, fontWeight: 700, color: "var(--t3)" };
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
                    <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{playedCount} / 2 played</span>
                  </div>

                  {/* Footle row-card (green) */}
                  <div style={{ ...rowCard, border: "1px solid #234029", background: "linear-gradient(120deg,#10331B,var(--s1) 62%)" }}>
                    <span style={{ ...iconBox, background: "rgba(88,204,2,0.14)", border: "1px solid rgba(88,204,2,0.3)", fontSize: 20 }}>⚽</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>Footle</div>
                      <div style={{ fontSize: 12.5, color: "var(--t2)" }}>{footleLen > 0 ? `${footleLen} letters · ` : ""}surname of a footballer</div>
                    </div>
                    {fPlayed ? (
                      <button onClick={() => setScreen?.("wordle")} style={{ flex: "0 0 auto", padding: "9px 16px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13.5, ...(fWon ? { background: "rgba(88,204,2,0.1)", border: "1.5px solid rgba(88,204,2,0.5)", color: "#8AE042" } : { background: "rgba(255,107,107,0.10)", border: "1.5px solid rgba(255,107,107,0.35)", color: "#FF6B6B" }) }}>
                        {fWon ? `✓ Solved in ${f.used}` : "✗ Not solved"}
                      </button>
                    ) : (
                      <button onClick={() => setScreen?.("wordle")} style={{ flex: "0 0 auto", padding: "10px 22px", borderRadius: 12, background: "rgba(88,204,2,0.14)", border: "1px solid rgba(88,204,2,0.4)", color: "#8AE042", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                        {f?.status === "in-progress" ? "Continue" : "Play"}
                      </button>
                    )}
                  </div>

                  {/* Daily 7 row-card (amber) */}
                  <div style={{ ...rowCard, border: "1px solid #33280E", background: "linear-gradient(120deg,rgba(255,140,0,0.10),var(--s1) 62%)" }}>
                    <span style={{ ...iconBox, background: "rgba(255,170,0,0.14)", border: "1px solid rgba(255,193,7,0.3)", fontSize: 19 }}>📋</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>Daily 7</div>
                      <div style={{ fontSize: 12.5, color: "var(--t2)" }}>7 questions · ~3 min · shared by everyone today</div>
                    </div>
                    {dailyDone ? (
                      <span style={{ flex: "0 0 auto", padding: "9px 16px", borderRadius: 11, background: "rgba(255,193,7,0.1)", border: "1.5px solid rgba(255,193,7,0.4)", color: "#FFC107", fontWeight: 800, fontSize: 13.5 }}>{dailyScore}/7</span>
                    ) : (
                      <button onClick={() => startMode?.("daily")} style={{ flex: "0 0 auto", padding: "10px 22px", borderRadius: 12, background: "rgba(255,193,7,0.14)", border: "1px solid rgba(255,193,7,0.4)", color: "#FFC107", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Play</button>
                    )}
                  </div>

                  {/* Recent days */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)" }}>Recent days</span>
                      <span style={{ display: "flex", gap: 26 }}>
                        <span style={{ ...colHead, color: "#8AE042" }}>FOOTLE</span>
                        <span style={{ ...colHead, color: "#FFC107" }}>DAILY 7</span>
                      </span>
                    </div>
                    {recentDays.length === 0 ? (
                      <div style={{ borderRadius: 13, background: "var(--s1)", border: "1px solid var(--border)", padding: "14px 16px", fontSize: 12.5, color: "var(--t3)" }}>
                        Play today, then your recent days show up here.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {recentDays.map(m => {
                          const footleAria = m.fWon ? `Footle solved in ${m.fUsed}` : m.fAttempt ? "Footle not solved" : "Footle not played";
                          const daily7Aria = m.t7Done ? `Daily 7 ${m.t7Score} of 7` : "Daily 7 not played";
                          return (
                            <div key={m.ymd} aria-label={`${m.dateLabel} ${m.dateSub} — ${footleAria}, ${daily7Aria}`}
                              style={{ display: "flex", alignItems: "center", borderRadius: 13, background: "var(--s1)", border: "1px solid var(--border)", padding: "11px 16px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t1)" }}>{m.dateLabel}</span>{" "}
                                <span style={{ fontSize: 11, color: "var(--t3)" }}>{m.dateSub}</span>
                              </div>
                              <span style={{ width: 74, textAlign: "center" }} aria-hidden="true">
                                {m.fWon
                                  ? <span style={{ ...chip, background: "rgba(88,204,2,0.1)", color: "#8AE042" }}>{m.fUsed}</span>
                                  : m.fAttempt
                                  ? <span style={{ fontSize: 13, fontWeight: 700, color: "#FF6B6B" }}>✗</span>
                                  : <span style={dash}>—</span>}
                              </span>
                              <span style={{ width: 74, textAlign: "center" }} aria-hidden="true">
                                {m.t7Done
                                  ? <span style={{ ...chip, background: "rgba(255,193,7,0.1)", color: "#FFC107" }}>{m.t7Score}/7</span>
                                  : <span style={dash}>—</span>}
                              </span>
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
                  <div className="hr-card hr-streak" role="status" aria-label={`${runStats.unbeaten}-day daily streak, best ${runStats.bestUnbeaten}`}>
                    <div className="hr-streak-head">
                      <div className="hr-streak-num"><span className="hr-flame" aria-hidden="true">🔥</span>{runStats.unbeaten}</div>
                      <div className="hr-streak-meta">
                        <div className="hr-streak-label">Day streak</div>
                        <div className="hr-streak-best">Best · {runStats.bestUnbeaten}</div>
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
