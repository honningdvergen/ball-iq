import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../useAuth.jsx";
import { APP_NAME } from "../lib/scoring.js";
import { dateToYMD } from "../lib/date.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";

// Sprint #16 helper — milliseconds until next UTC midnight. Used by the
// greeting strip's "KO in Xh Ym" chip and the Up next card. UTC midnight
// is when daily puzzles roll over server-side; deriving from the same
// frame keeps client + server in agreement across timezones.
function msToNextUTCMidnight(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
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

function MonthlyCalendar({ history, footleHistory, today, viewDate, setViewDate, onPlayDate, onViewScore }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // First-play detection — earliest dailyHistory OR footleHistory entry.
  // Days before this are styled as "pre-join" instead of red "missed".
  const firstDailyTime = (() => {
    const keys = [
      ...(history ? Object.keys(history) : []),
      ...(footleHistory ? Array.from(footleHistory.keys()) : []),
    ];
    if (keys.length === 0) return null;
    let earliest = Infinity;
    for (const k of keys) {
      const [Y, M, D] = k.split("-").map(Number);
      if (!Y || !M || !D) continue;
      const t = new Date(Y, M - 1, D).getTime();
      if (t < earliest) earliest = t;
    }
    return earliest === Infinity ? null : earliest;
  })();

  // Disable forward nav when the viewed month is the current month or later
  const viewedMonthIdx = year * 12 + month;
  const todayMonthIdx = today.getFullYear() * 12 + today.getMonth();
  const atCurrentMonth = viewedMonthIdx >= todayMonthIdx;

  // Header sub-line (Sprint #15 Stage 6): "{N} days played · {M} perfect (both)"
  // counted within the currently-viewed month.
  const viewedYM = `${year}-${String(month + 1).padStart(2, "0")}`;
  let monthPlayed = 0, monthPerfect = 0;
  {
    const seen = new Set();
    for (const ymd of Object.keys(history || {})) {
      if (ymd.startsWith(viewedYM)) seen.add(ymd);
    }
    for (const [ymd, status] of (footleHistory || new Map())) {
      if (status === "won" && ymd.startsWith(viewedYM)) seen.add(ymd);
    }
    monthPlayed = seen.size;
    for (const ymd of seen) {
      const t7 = history && typeof history[ymd] === "number";
      const f = footleHistory && footleHistory.get(ymd) === "won";
      if (t7 && f) monthPerfect++;
    }
  }

  return (
    <div className="streak-section">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month">←</button>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <div className="cal-month">{monthLabel}</div>
          <div className="cal-month-sub">
            <strong>{monthPlayed}</strong> day{monthPlayed === 1 ? "" : "s"} played · <strong>{monthPerfect}</strong> perfect <span style={{color:"var(--t3)",fontWeight:600}}>(both)</span>
          </div>
        </div>
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))} disabled={atCurrentMonth} aria-label="Next month">→</button>
      </div>
      <div className="cal-dow">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
          <div key={d} className="cal-dow-cell">{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="cal-cell cal-empty" />;
          const ymd = dateToYMD(d);
          const score = history?.[ymd];
          const t7Done = typeof score === "number";
          const footleDone = footleHistory?.get(ymd) === "won";
          const anyDone = t7Done || footleDone;
          const dTime = d.getTime();
          const isToday = dTime === todayMidnight;
          const isFuture = dTime > todayMidnight;
          const isPreJoin = !anyDone && firstDailyTime !== null && dTime < firstDailyTime && !isToday;
          const isPastMissed = dTime < todayMidnight && !anyDone && !isPreJoin;

          let cls = "cal-cell";
          // Diagonal-split (Sprint #15 Stage 6): Footle = top-left orange,
          // T7 = bottom-right purple. Both = full split. Replaces the old
          // solid-green cal-done styling.
          if (t7Done && footleDone) cls += " cal-both";
          else if (footleDone) cls += " cal-footle";
          else if (t7Done) cls += " cal-t7";
          if (isToday) cls += " cal-today";
          if (isFuture) cls += " cal-future";
          else if (isPreJoin) cls += " cal-pre-join";
          else if (isPastMissed) cls += " cal-missed";

          const handleClick = () => {
            if (isFuture || isPreJoin) return;
            if (t7Done) onViewScore(d, score);
            else if (!footleDone) onPlayDate(d); // unplayed (or Footle-only): route to T7 play-on-date
            // Footle-only days: no T7 score to view; tap is a no-op (parent
            // could route to Footle review in a future iteration).
          };

          const aria = `${ymd}${
            t7Done && footleDone ? " — Footle solved and Today's 7 completed (perfect day)" :
            footleDone ? " — Footle solved" :
            t7Done ? ` — Today's 7 completed ${score}/7` :
            isToday ? " today" :
            isPreJoin ? " before you joined" :
            isPastMissed ? " missed" : ""
          }`;

          return (
            <button key={ymd} className={cls} onClick={handleClick} disabled={isFuture || isPreJoin || (footleDone && !t7Done)} aria-label={aria}>
              <span className="cal-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"#7C3AED"}} />Footle</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"#FF6A00"}} />Today's 7</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"linear-gradient(135deg,#7C3AED 0%,#7C3AED 49.5%,#FF6A00 50.5%,#FF6A00 100%)"}} />Both</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"var(--accent-dim)", border:"1.5px solid var(--accent)"}} />Today</span>
      </div>
    </div>
  );
}

// FormHero — Sprint #16 Daily v3 centerpiece. Replaces StreakHero v2.
// Reads three derived quantities from the parent and renders:
//   1. Overall unbeaten run + best run sub-line (combined, any mode played)
//   2. Two per-mode streak chips (Footle solve run · T7 done run)
//   3. Form strip — last 14 days W/D/L with mode-mirroring colors:
//        W (both played) = accent green
//        D (Footle only) = purple
//        D (T7 only)     = orange
//        L (neither)     = neutral
function FormHero({ unbeaten, bestUnbeaten, footleRun, t7Run, form14 }) {
  const distance = Math.max(0, bestUnbeaten - unbeaten);
  const atPB = unbeaten > 0 && unbeaten >= bestUnbeaten;
  const subLine = bestUnbeaten === 0
    ? null
    : atPB
      ? `Best run: ${bestUnbeaten} — personal best!`
      : `Best run: ${bestUnbeaten} — ${distance} to go`;
  return (
    <div className="form-hero" role="status" aria-label={`${unbeaten}-match unbeaten run`}>
      <div className="form-hero-num">
        <span className="num mono">{unbeaten}</span>
        <span className="lab">match unbeaten run</span>
      </div>
      {subLine && (
        <div className={`form-hero-sub${atPB ? " is-pb" : ""}`}>{subLine}</div>
      )}
      <div className="form-hero-chips">
        <div className="run-chip f">
          <span className="run-chip-dot" />
          <span className="run-chip-lab">Footle solve run</span>
          <span className="run-chip-val mono">{footleRun}</span>
        </div>
        <div className="run-chip t">
          <span className="run-chip-dot" />
          <span className="run-chip-lab">T7 done run</span>
          <span className="run-chip-val mono">{t7Run}</span>
        </div>
      </div>
      <div className="form-strip-wrap">
        <div className="form-strip" role="group" aria-label="Form — last 14 matches">
          {form14.map((d, i) => (
            <div
              key={d.ymd}
              className={`form-cell ${d.cls}${d.isToday ? " is-today" : ""}`}
              aria-label={d.aria}
              title={d.aria}
            />
          ))}
        </div>
        <div className="form-strip-axis">
          <span>2 weeks ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function DailyTabScreenImpl({ profile, stats, dailyDone, dailyScore, loginStreak, bestLoginStreak, onPlay, onPlayWordle, onSuggest, xp, onUseShield, shieldActive, dailyHistory, onPlayDate, onViewScore, onViewPuzzle, footleCard, sevenCard }) {
  const { user, profile: authProfile, isGuest } = useAuth();
  // Audit Phase 5 (D2): poll for day rollover so the screen-local `today`
  // refreshes if the user keeps the tab open across midnight. Without
  // this, today + todayYMD stay frozen at mount time and the calendar /
  // hero card show the wrong "today" the next morning. Mirrors Wordle's
  // day-rollover polling pattern (its handler reloads the page; here we
  // just refresh state since DailyTab doesn't need a full reload).
  const [today, setToday] = useState(() => new Date());
  // Sprint #16: per-minute tick drives the KO countdown chip + Up next
  // card. `today` still only updates on day rollover (downstream memos
  // depend on todayYMD identity), but `now` ticks every minute so the
  // countdown stays current.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNow(n);
      setToday(prev => n.toDateString() !== prev.toDateString() ? n : prev);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  // Audit Phase 5 (D1): localStorage read promoted from render body to
  // useMemo([todayYMD, dailyScore]). Was reading on every render (~3-7×
  // per session × multiple renders per session = wasted reads). Memo
  // re-evaluates only on day rollover (todayYMD) or score propagation
  // (dailyScore). Defensive intent preserved — still catches the case
  // where localStorage has a value the parent state hasn't surfaced yet.
  const todayYMD = dateToYMD(today);
  const { localDone, localScore } = useMemo(() => {
    let done = false;
    let score = dailyScore;
    try {
      const raw = localStorage.getItem(`biq_daily_${todayYMD}`);
      if (raw) {
        done = true;
        try { const p = JSON.parse(raw); if (typeof p?.score === "number") score = p.score; } catch {}
      }
    } catch {}
    return { localDone: done, localScore: score };
  }, [todayYMD, dailyScore]);
  const isDone = dailyDone || localDone;
  const shownScore = dailyScore != null ? dailyScore : localScore;

  // Footle history map (Sprint #15 Stage 4+6): walks biq_wordle_* keys in
  // localStorage once and exposes the per-day status (won/lost/in-progress)
  // for both the 4-stat row reduction and the diagonal-split calendar
  // cells. Memoised on todayYMD + localDone so it re-runs at most once per
  // day rollover or daily-completion event. ~365 keys/year — trivial.
  const footleHistory = useMemo(() => {
    const map = new Map();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("biq_wordle_")) continue;
        const ymd = k.slice("biq_wordle_".length);
        try {
          const parsed = JSON.parse(localStorage.getItem(k));
          if (parsed?.status === "won") map.set(ymd, "won");
          else if (parsed?.status === "lost") map.set(ymd, "lost");
          else if (Array.isArray(parsed?.guesses) && parsed.guesses.length > 0) map.set(ymd, "in-progress");
        } catch {}
      }
    } catch {}
    return map;
  }, [todayYMD, localDone]);

  // Sprint #16 Stage 1: run + form derivations for the new FormHero.
  // - unbeaten: consecutive days backward from today where AT LEAST ONE
  //   mode was attempted (Footle 'won' or 'lost' counts as attempt;
  //   'in-progress' does not — the day isn't decided yet)
  // - bestUnbeaten: max historical run of the same shape, walking forward
  //   from the earliest played day
  // - footleRun: consecutive Footle 'won' days backward from today
  // - t7Run: consecutive dailyHistory entries backward from today
  // - form14: last 14 days each tagged W/D/L plus mode-mirroring color
  //   class (D-footle = purple, D-t7 = orange, W = green, L = neutral)
  const runStats = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const playedOn = (ymd) => {
      const f = footleHistory.get(ymd);
      const footleAttempt = f === "won" || f === "lost";
      return t7Set.has(ymd) || footleAttempt;
    };

    // Current unbeaten run
    let unbeaten = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(todayMid - i * 86400000);
      if (!playedOn(dateToYMD(d))) break;
      unbeaten++;
    }
    // Current Footle solve run
    let footleRun = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(todayMid - i * 86400000);
      if (footleHistory.get(dateToYMD(d)) !== "won") break;
      footleRun++;
    }
    // Current T7 done run
    let t7Run = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(todayMid - i * 86400000);
      if (!t7Set.has(dateToYMD(d))) break;
      t7Run++;
    }

    // Historical best unbeaten — walk from first-played forward to today.
    let bestUnbeaten = 0;
    {
      const dates = new Set(t7Set);
      for (const [ymd, status] of footleHistory) {
        if (status === "won" || status === "lost") dates.add(ymd);
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
    return { unbeaten, bestUnbeaten, footleRun, t7Run };
  }, [today, dailyHistory, footleHistory]);

  // Sprint #16 Stage 4: per-matchday rows for the history list. Walks
  // backward from today to either 30 days or first-played, whichever
  // comes sooner. Each row holds the parsed Footle + T7 results plus
  // a derived W/D/L badge.
  const matchdays = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    // First played day across both stores — anchors matchday numbering.
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
      const fStatus = footleHistory.get(ymd);
      const fWon = fStatus === "won";
      const fAttempt = fWon || fStatus === "lost";
      // Footle guesses count for the "{N}/6 solved" line — read straight
      // from localStorage so we don't hold the entire guesses payload in
      // memory just for the display number.
      let fGuesses = 0;
      if (fAttempt) {
        try {
          const raw = localStorage.getItem(`biq_wordle_${ymd}`);
          if (raw) {
            const p = JSON.parse(raw);
            if (Array.isArray(p?.guesses)) fGuesses = p.guesses.length;
          }
        } catch {}
      }
      const isToday = i === 0;
      let wdl;
      if (isToday && !t7Done && !fAttempt) wdl = null; // pending
      else if (t7Done && fAttempt) wdl = "W";
      else if (t7Done || fAttempt) wdl = "D";
      else wdl = "L";
      // Date label — Today / Yesterday / weekday + date
      let dateLabel;
      if (isToday) dateLabel = "Today";
      else if (i === 1) dateLabel = "Yesterday";
      else dateLabel = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateSub = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      rows.push({
        ymd, md, dateLabel, dateSub, isToday, wdl,
        t7Done, t7Score: t7Done ? t7Score : null,
        fAttempt, fWon, fGuesses,
      });
    }
    return rows;
  }, [today, dailyHistory, footleHistory]);

  const form14 = useMemo(() => {
    const t7Set = new Set(Object.keys(dailyHistory || {}));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayMid - i * 86400000);
      const ymd = dateToYMD(d);
      const isToday = i === 0;
      const t7 = t7Set.has(ymd);
      const fStatus = footleHistory.get(ymd);
      const fAttempt = fStatus === "won" || fStatus === "lost";
      let cls, label;
      if (t7 && fAttempt) { cls = "W"; label = "Win"; }
      else if (t7) { cls = "D-t7"; label = "Today's 7 only"; }
      else if (fAttempt) { cls = "D-f"; label = "Footle only"; }
      else { cls = "L"; label = isToday ? "Pending" : "Missed"; }
      out.push({ ymd, cls, isToday, aria: `${ymd}: ${label}` });
    }
    return out;
  }, [today, dailyHistory, footleHistory]);

  const dailyStats = useMemo(() => {
    const currentYM = todayYMD.slice(0, 7); // "YYYY-MM"
    const dailyDoneSet = new Set(Object.keys(dailyHistory || {}));

    let monthFootleWins = 0, monthDaily = 0, perfectDays = 0;
    let lifetimeFootleWins = 0, footleAttempts = 0;
    for (const [ymd, status] of footleHistory) {
      footleAttempts++;
      if (status === "won") {
        lifetimeFootleWins++;
        if (ymd.startsWith(currentYM)) monthFootleWins++;
        if (dailyDoneSet.has(ymd)) perfectDays++;
      }
    }
    for (const ymd of dailyDoneSet) {
      if (ymd.startsWith(currentYM)) monthDaily++;
    }
    const thisMonth = monthFootleWins + monthDaily;
    const lifetime = lifetimeFootleWins + dailyDoneSet.size;
    const winRate = footleAttempts === 0 ? null : Math.round((lifetimeFootleWins / footleAttempts) * 100);
    return { thisMonth, perfectDays, lifetime, winRate };
  }, [todayYMD, dailyHistory, footleHistory]);
  return (
    <div className="tab-content">
      {/* Sprint #16 Stage 2: greeting strip + KO countdown chip. Same
          K3-style fallback logic as Home — drop the name slot rather
          than show "Guest" when no name is available, and don't render
          a misleading default while authProfile is mid-fetch. */}
      {(() => {
        const authLoading = !!user && !authProfile;
        const name = authProfile?.username || profile?.name || null;
        const ko = formatKO(msToNextUTCMidnight(now));
        return (
          <div className="daily-greet" role="status">
            <div className="daily-greet-text">
              <span className="daily-greet-when">{timeOfDayGreeting(now)}{(name || authLoading) ? "," : ""}</span>
              {authLoading ? (
                <span className="daily-greet-name is-loading">Loading…</span>
              ) : name ? (
                <span className="daily-greet-name">{name}</span>
              ) : null}
            </div>
            <div className="daily-greet-ko" aria-label={`Next puzzle kicks off in ${ko}`}>
              <span className="daily-greet-ko-lab">KO in</span>
              <span className="daily-greet-ko-val mono">{ko}</span>
            </div>
          </div>
        );
      })()}
      <FormHero
        unbeaten={runStats.unbeaten}
        bestUnbeaten={runStats.bestUnbeaten}
        footleRun={runStats.footleRun}
        t7Run={runStats.t7Run}
        form14={form14}
      />

      {/* Sprint #16 Stage 3: Up next anticipation card. Always points at
          tomorrow — today's call-to-action lives on Home, Daily is a
          history-first surface. The KO countdown re-renders with `now`. */}
      <div className="up-next" role="status" aria-label={`Tomorrow's Daily — kickoff in ${formatKO(msToNextUTCMidnight(now))}`}>
        <div className="up-next-left">
          <div className="up-next-eyebrow">Up next</div>
          <div className="up-next-title">Tomorrow's Daily</div>
        </div>
        <div className="up-next-right">
          <div className="up-next-ko-lab">Kicks off in</div>
          <div className="up-next-ko-val mono">{formatKO(msToNextUTCMidnight(now))}</div>
        </div>
      </div>

      {/* Sprint #16 Stage 4: matchday list. Per-row Footle + T7 results
          with W/D/L badge. ~6-8 most recent visible, scroll for older. */}
      {/* Stage 5's footer is rendered below the list. Holding here in JSX
          order so the source reads top-to-bottom: greet → form hero →
          up next → matchday list → stats footer → other modes. */}
      {matchdays.length > 0 && (
        <>
          <div className="md-eyebrow">Recent matchdays</div>
          <div className="md-list">
            {matchdays.map(m => (
              <div key={m.ymd} className={`md-row${m.isToday ? " is-today" : ""}`}>
                <div className="md-meta">
                  <div className="md-num mono">MD {m.md}</div>
                  <div className="md-day">{m.dateLabel}</div>
                  <div className="md-date">{m.dateSub}</div>
                </div>
                <div className="md-modes">
                  <div className={`md-mode f${m.fAttempt ? "" : " miss"}`}>
                    <span className="md-mode-dot" />
                    <span className="md-mode-name">Footle</span>
                    <span className="md-mode-res mono">
                      {m.fAttempt
                        ? <>{m.fGuesses}/6 {m.fWon ? "✓" : "✗"}</>
                        : (m.isToday ? "—" : "missed")}
                    </span>
                  </div>
                  <div className={`md-mode t${m.t7Done ? "" : " miss"}`}>
                    <span className="md-mode-dot" />
                    <span className="md-mode-name">Today's 7</span>
                    <span className="md-mode-res mono">
                      {m.t7Done
                        ? <>{m.t7Score}/7 ✓</>
                        : (m.isToday ? "—" : "missed")}
                    </span>
                  </div>
                </div>
                <div className={`md-wdl ${m.wdl || "pending"}`} aria-label={m.wdl || "pending"}>
                  {m.wdl || "·"}
                </div>
              </div>
            ))}
          </div>
          {/* Sprint #16 Stage 5: quiet stats footer. Single muted line —
              supporting context, not centerpieces. Replaces the 4-stat row. */}
          <div className="stats-footer">
            <span className="sf-pair"><strong>{dailyStats.perfectDays}</strong> perfect day{dailyStats.perfectDays === 1 ? "" : "s"}</span>
            <span className="sf-sep">·</span>
            <span className="sf-pair">solve rate <strong>{dailyStats.winRate == null ? "—" : `${dailyStats.winRate}%`}</strong></span>
          </div>
        </>
      )}
      {/* 4-stat row (Sprint #15 Stage 4) */}
      <div className="daily-stats-row" role="group" aria-label="Daily stats">
        <div className="stat-tile">
          <div className="st-val">{dailyStats.thisMonth}</div>
          <div className="ds-eyebrow st-key">This Month</div>
        </div>
        <div className="stat-tile">
          <div className="st-val" style={{color:"var(--gold)"}}>{dailyStats.perfectDays}</div>
          <div className="ds-eyebrow st-key">Perfect Days</div>
        </div>
        <div className="stat-tile">
          <div className="st-val">{dailyStats.lifetime}</div>
          <div className="ds-eyebrow st-key">Lifetime</div>
        </div>
        <div className="stat-tile">
          <div className="st-val" style={{color:"var(--accent)"}}>{dailyStats.winRate == null ? "—" : `${dailyStats.winRate}%`}</div>
          <div className="ds-eyebrow st-key">Win Rate</div>
        </div>
      </div>
      {/* Today container (Sprint #15 Stage 5) — reuses Home's FootleHero +
          Today's 7 cards passed in as props so the two surfaces read
          visually identical. X/2 status mirrors the home zone's indicator. */}
      {(footleCard || sevenCard) && (() => {
        const ws = readWordleTodayStatus();
        const footleDone = ws.kind === "won" || ws.kind === "lost";
        const doneCount = (footleDone ? 1 : 0) + (isDone ? 1 : 0);
        const allDone = doneCount === 2;
        return (
          <div className="daily-zone" role="group" aria-label="Today">
            <div className="daily-zone-head">
              <span className="daily-zone-eyebrow">Today</span>
              <span className={`daily-zone-status${allDone ? " is-done" : ""}`}>
                {allDone ? "2/2 done" : `${doneCount}/2 today`}
              </span>
            </div>
            {footleCard}
            {sevenCard}
          </div>
        );
      })()}
      {shieldActive && (
        <div style={{background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.10)",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🛡️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>Streak Shield available</div>
              <div style={{fontSize:11,color:"var(--t2)"}}>Earned at {Math.floor((xp||0)/200)*200} XP — protects your streak once</div>
            </div>
          </div>
          <button onClick={onUseShield} style={{background:"transparent",border:"1px solid var(--accent)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,color:"var(--accent)",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,fontFamily:"inherit"}}>Use 🛡️</button>
        </div>
      )}
      <MonthlyCalendar
        history={dailyHistory}
        footleHistory={footleHistory}
        today={today}
        viewDate={viewDate}
        setViewDate={setViewDate}
        onPlayDate={onPlayDate}
        onViewScore={onViewScore}
      />
      <div style={{background:"var(--s1)",borderRadius:14,padding:"16px 18px",marginTop:12,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:10}}>
          {isDone ? "While you wait for tomorrow…" : "Other modes to try"}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {icon:"🧠", label:`Take the ${APP_NAME} Test`, action:"balliq"},
            {icon:"⚡🔥", label:"Try Hot Streak", action:"hotstreak"},
            {icon:"🔥", label:"Try Survival Mode", action:"survival"},
          ].map(({icon, label, action}) => (
            <button key={action} className="mode-item" onClick={() => onSuggest(action)} style={{padding:"12px 14px"}}>
              <div className="mi-icon" style={{fontSize:18}}>{icon}</div>
              <div className="mi-body"><div className="mi-name" style={{fontSize:14}}>{label}</div></div>
              <div className="mi-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export const DailyTabScreen = React.memo(DailyTabScreenImpl);
