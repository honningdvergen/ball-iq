import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../useAuth.jsx";
import { dateToYMD } from "../lib/date.js";

// Sprint #16 helper — milliseconds until next UTC midnight. Used by the
// greeting strip's "KO in Xh Ym" chip. UTC midnight is when daily puzzles
// roll over server-side; deriving from the same frame keeps client +
// server in agreement across timezones.
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

function DailyTabScreenImpl({ profile, xp, shieldActive, onUseShield, dailyHistory }) {
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
          if (parsed?.status === "won") map.set(ymd, "won");
          else if (parsed?.status === "lost") map.set(ymd, "lost");
          else if (Array.isArray(parsed?.guesses) && parsed.guesses.length > 0) map.set(ymd, "in-progress");
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
      const footleAttempt = f === "won" || f === "lost";
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
      const fStatus = footleHistory.get(ymd);
      const fWon = fStatus === "won";
      const fAttempt = fWon || fStatus === "lost";
      const isToday = i === 0;
      let wdl;
      if (isToday && !t7Done && !fAttempt) wdl = null; // pending
      else if (t7Done && fAttempt) wdl = "W";
      else if (t7Done || fAttempt) wdl = "D";
      else wdl = "L";
      let dateLabel;
      if (isToday) dateLabel = "Today";
      else if (i === 1) dateLabel = "Yesterday";
      else dateLabel = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateSub = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      rows.push({
        ymd, md, dateLabel, dateSub, isToday, wdl,
        t7Done, fAttempt,
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
      else if (t7 || fAttempt) { cls = "D"; label = t7 ? "Today's 7 only" : "Footle only"; }
      else { cls = "L"; label = isToday ? "Pending" : "Missed"; }
      out.push({ ymd, cls, isToday, aria: `${ymd}: ${label}` });
    }
    return out;
  }, [today, dailyHistory, footleHistory]);

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

      {/* Sprint #24 v4 — tactics card hero + restructured fixtures list
          land in stages V2 + V3. Render shells are stubbed in Stage 1
          so the screen isn't blank between commits. */}

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
    </div>
  );
}
export const DailyTabScreen = React.memo(DailyTabScreenImpl);
