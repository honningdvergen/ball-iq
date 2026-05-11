import React, { useState, useEffect, useMemo } from "react";
import { APP_NAME } from "../lib/scoring.js";
import { dateToYMD } from "../lib/date.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";

function MonthlyCalendar({ history, today, viewDate, setViewDate, onPlayDate, onViewScore, gamesThisWeek, gamesLastWeek }) {
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

  // First-play detection — earliest dailyHistory entry. Days before this
  // are styled as "pre-join" (neutral grey) instead of red "missed", since
  // the user wasn't here yet to play them.
  const firstDailyTime = (() => {
    const keys = history ? Object.keys(history) : [];
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

  const showWeekSub = typeof gamesThisWeek === "number";
  const weekDelta = (showWeekSub && typeof gamesLastWeek === "number" && gamesLastWeek > 0)
    ? gamesThisWeek - gamesLastWeek : null;

  return (
    <div className="streak-section">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month">←</button>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <div className="cal-month">{monthLabel}</div>
          {showWeekSub && (
            <div className="cal-month-sub">
              <strong>{gamesThisWeek}</strong> played this week
              {weekDelta !== null && (
                <span className="cal-month-delta" style={{color: weekDelta >= 0 ? "var(--accent)" : "var(--t3)"}}>
                  {weekDelta >= 0 ? "↑" : "↓"} {Math.abs(weekDelta)} vs last
                </span>
              )}
            </div>
          )}
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
          const score = history[ymd];
          const isCompleted = typeof score === "number";
          const dTime = d.getTime();
          const isToday = dTime === todayMidnight;
          const isFuture = dTime > todayMidnight;
          const isPreJoin = !isCompleted && firstDailyTime !== null && dTime < firstDailyTime && !isToday;
          const isPastMissed = dTime < todayMidnight && !isCompleted && !isPreJoin;

          let cls = "cal-cell";
          if (isCompleted) cls += " cal-done";
          if (isToday) cls += " cal-today";
          if (isFuture) cls += " cal-future";
          else if (isPreJoin) cls += " cal-pre-join";
          else if (isPastMissed) cls += " cal-missed";

          const handleClick = () => {
            if (isFuture || isPreJoin) return;
            if (isCompleted) onViewScore(d, score);
            else onPlayDate(d);
          };

          return (
            <button key={ymd} className={cls} onClick={handleClick} disabled={isFuture || isPreJoin} aria-label={`${ymd}${isCompleted ? ` completed ${score}/7` : isToday ? " today" : isPreJoin ? " before you joined" : isPastMissed ? " missed" : ""}`}>
              <span className="cal-num">{d.getDate()}</span>
              {isCompleted && <span className="cal-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"var(--accent)"}} />Done</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"var(--accent-dim)", border:"1.5px solid var(--accent)"}} />Today</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.25)"}} />Missed</span>
      </div>
    </div>
  );
}

// StreakHero — Daily tab visual anchor. Centered hero block with the
// login-streak number as the dominant element (64px tabular-nums), a
// "DAY STREAK" eyebrow label below, and a sub-line carrying the
// best-streak chip + nudge framed around today's Daily challenge.
// Pure presentational: reads loginStreak / bestStreak / dailyHistory
// props already on DailyTabScreen; no new fetches or schema.
function StreakHero({ loginStreak, bestStreak, history, today }) {
  const todayYMD = dateToYMD(today);
  const playedToday = typeof history?.[todayYMD] === "number";

  // Login streak (the hero number) ticks on app-open; the daily challenge
  // is a separate engagement. Phrase the nudge in terms of the Daily
  // challenge — what the calendar below reflects — so the sub-line tells
  // the user something they can act on, not just restating the hero.
  const nudge = playedToday
    ? "✓ Daily complete today"
    : "Play today's Daily";

  const showBest = typeof bestStreak === "number" && bestStreak > loginStreak && bestStreak > 0;
  const streakCount = loginStreak || 0;

  return (
    <div
      className="streak-hero"
      role="status"
      aria-label={`${streakCount} day login streak${showBest ? `, best ${bestStreak} days` : ""}. ${nudge}.`}
    >
      <div className="streak-hero-flame" aria-hidden="true">🔥</div>
      <div className="streak-hero-num">{streakCount}</div>
      <div className="streak-hero-label">Day Streak</div>
      <div className="streak-hero-sub">
        {showBest && <><span className="streak-hero-best">Best: {bestStreak}</span> · </>}
        <span>{nudge}</span>
      </div>
    </div>
  );
}

function DailyTabScreenImpl({ stats, dailyDone, dailyScore, loginStreak, bestLoginStreak, onPlay, onPlayWordle, onSuggest, xp, onUseShield, shieldActive, dailyHistory, onPlayDate, onViewScore, onViewPuzzle }) {
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
  return (
    <div className="tab-content">
      {/* Compact "Today" action row — Daily-tab specific. Replaces the
          home-style daily-pair cards (which still live on Home). Each pill
          is a tap-target with title + compact status; played → review,
          unplayed → play. No "Resets in…" sub-line — that lives on Home;
          on Daily, the calendar below is the time signal. */}
      {(() => {
        const ws = readWordleTodayStatus();
        const wordleDone = ws.kind === "won" || ws.kind === "lost";
        const wordleStatus =
          ws.kind === "won"         ? <>✅ <strong>{ws.used}/6</strong></> :
          ws.kind === "lost"        ? <>❌ Missed</> :
          ws.kind === "in-progress" ? <><strong>{ws.used}/6</strong> used</> :
          <>Play</>;
        const dailyClass  = "today-action ta-daily" + (isDone ? " is-done" : " is-pending");
        const puzzleClass = "today-action ta-puzzle" + (wordleDone ? " is-done" : " is-pending");
        return (
          <div className="today-actions">
            <button
              className={dailyClass}
              onClick={() => isDone ? onViewScore(today, shownScore) : onPlay()}
              aria-label={isDone ? `Daily challenge complete: ${shownScore} out of 7` : "Play today's daily challenge"}
            >
              <div className="ta-title">Today's 7</div>
              <div className="ta-status">
                {isDone ? <>✅ <strong>{shownScore}/7</strong></> : <>Play</>}
              </div>
            </button>
            <button
              className={puzzleClass}
              onClick={() => wordleDone ? (onViewPuzzle && onViewPuzzle(ws)) : (onPlayWordle && onPlayWordle())}
              aria-label={wordleDone ? (ws.kind === "won" ? `Footle solved in ${ws.used} of 6` : "Footle missed today") : "Play today's Footle"}
            >
              <div className="ta-title">Footle</div>
              <div className="ta-status">{wordleStatus}</div>
            </button>
          </div>
        );
      })()}
      <StreakHero
        loginStreak={loginStreak}
        bestStreak={bestLoginStreak}
        history={dailyHistory}
        today={today}
      />
      {(() => {
        // Weekly summary chip — "X of N days this week" where N counts
        // calendar days from local Monday through today (inclusive). Anchors
        // to the locked decision (league spec C2): week-start = local
        // Monday. Renders as a compact chip directly under the hero —
        // bridges streak-emotion → calendar-data narratively.
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dow = todayDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysSinceMon = (dow + 6) % 7;
        const possibleDays = daysSinceMon + 1;
        let played = 0;
        for (let i = 0; i <= daysSinceMon; i++) {
          const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - daysSinceMon + i);
          const ymd = dateToYMD(d);
          if (typeof dailyHistory?.[ymd] === "number") played++;
        }
        const isPerfect = played === 7;
        return (
          <div className={`week-chip${isPerfect ? " is-perfect" : ""}`} aria-label={`Played ${played} of ${possibleDays} possible days this week`}>
            {isPerfect
              ? <><strong>7 / 7</strong> · perfect week</>
              : <><strong>{played}</strong> of {possibleDays} day{possibleDays === 1 ? "" : "s"} this week</>}
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
        today={today}
        viewDate={viewDate}
        setViewDate={setViewDate}
        onPlayDate={onPlayDate}
        onViewScore={onViewScore}
        gamesThisWeek={stats?.gamesThisWeek}
        gamesLastWeek={stats?.gamesLastWeek}
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
