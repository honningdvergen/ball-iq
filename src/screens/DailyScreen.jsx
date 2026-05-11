import React, { useState, useEffect, useMemo } from "react";
import { APP_NAME } from "../lib/scoring.js";
import { dateToYMD } from "../lib/date.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";

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

// StreakHero — Daily tab visual anchor. v2: flame + big streak number on
// the same row, "DAY STREAK" eyebrow underneath, then a personal-best
// progress bar with "{N} days from {best} personal best" subtext (or
// "Personal best!" when at-or-above). Daily-completion nudge moved to
// the Today container below — this hero focuses purely on streak state.
function StreakHero({ loginStreak, bestStreak }) {
  const streakCount = loginStreak || 0;
  const best = typeof bestStreak === "number" ? bestStreak : 0;
  // "At PB" includes current === best (counts as tying); we only call it
  // PB when there's a non-zero streak to celebrate.
  const isPB = streakCount > 0 && streakCount >= best;
  const distance = Math.max(0, best - streakCount);
  // Progress fills against the local target = max(current, best) so the
  // bar reads sensibly when the user is *at* PB (full bar).
  const target = Math.max(best, streakCount, 1);
  const progressPct = Math.min(100, Math.round((streakCount / target) * 100));
  const showPB = best > 0 || streakCount > 0;
  const subLine = !showPB ? null
    : isPB ? "Personal best!"
    : `${distance} day${distance === 1 ? "" : "s"} from ${best} personal best`;

  return (
    <div
      className="streak-hero"
      role="status"
      aria-label={`${streakCount} day login streak${best > 0 ? `, personal best ${best} days` : ""}.`}
    >
      <div className="streak-hero-row">
        <div className="streak-hero-flame" aria-hidden="true">🔥</div>
        <div className="streak-hero-num">{streakCount}</div>
      </div>
      <div className="streak-hero-label">Day Streak</div>
      {showPB && (
        <>
          <div className="streak-hero-pb-bar">
            <div className={`streak-hero-pb-fill${isPB ? " is-pb" : ""}`} style={{width: `${progressPct}%`}} />
          </div>
          <div className={`streak-hero-sub${isPB ? " is-pb" : ""}`}>{subLine}</div>
        </>
      )}
    </div>
  );
}

function DailyTabScreenImpl({ stats, dailyDone, dailyScore, loginStreak, bestLoginStreak, onPlay, onPlayWordle, onSuggest, xp, onUseShield, shieldActive, dailyHistory, onPlayDate, onViewScore, onViewPuzzle, footleCard, sevenCard }) {
  // Audit Phase 5 (D2): poll for day rollover so the screen-local `today`
  // refreshes if the user keeps the tab open across midnight. Without
  // this, today + todayYMD stay frozen at mount time and the calendar /
  // hero card show the wrong "today" the next morning. Mirrors Wordle's
  // day-rollover polling pattern (its handler reloads the page; here we
  // just refresh state since DailyTab doesn't need a full reload).
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setToday(prev => now.toDateString() !== prev.toDateString() ? now : prev);
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
      <StreakHero
        loginStreak={loginStreak}
        bestStreak={bestLoginStreak}
      />
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
