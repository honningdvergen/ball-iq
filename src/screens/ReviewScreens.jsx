// The Daily 7 and club-quiz review screens — extracted from App.jsx on
// 2026-09-06 (review E16, brick 10).
import { dateToYMD } from "../lib/date.js";
import { Home, Share, Flame } from "lucide-react";
import { useMemo, useCallback } from "react";
import { APP_NAME } from "../lib/scoring.js";
import { computeFootleStreak, getFootleNumber, getWordleAnswerForDayIndex, gradeWordleGuess } from "../lib/wordle.js";
import { CB_MODE, DailyHeroCountdown, FootleGetAppCTA, IS_NATIVE, InstallBanner, ReviewQuestionCard, TIMINGS, shareCard } from "../App.jsx";

export function Mini7Strip({ history, today }) {
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const firstDailyTime = (() => {
    const keys = history ? Object.keys(history) : [];
    if (!keys.length) return null;
    let earliest = Infinity;
    for (const k of keys) {
      const [Y, M, D] = k.split("-").map(Number);
      if (!Y || !M || !D) continue;
      const t = new Date(Y, M - 1, D).getTime();
      if (t < earliest) earliest = t;
    }
    return earliest === Infinity ? null : earliest;
  })();
  const cells = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayMid - i * TIMINGS.DAY_MS);
    const ymd = dateToYMD(d);
    const score = history?.[ymd];
    const isCompleted = typeof score === "number";
    const isToday = d.getTime() === todayMid;
    const isPreJoin = !isCompleted && firstDailyTime !== null && d.getTime() < firstDailyTime && !isToday;
    cells.push({ d, isCompleted, isToday, isPreJoin });
  }
  return (
    <div className="m7-strip" aria-label="Last 7 days">
      {cells.map((c, i) => {
        let cls = "m7-cell";
        if (c.isCompleted) cls += " m7-done";
        else if (c.isPreJoin) cls += " m7-pre";
        else cls += " m7-miss";
        if (c.isToday) cls += " m7-today";
        return (
          <div key={i} className="m7-col">
            <div className={cls} />
            <div className="m7-label">{c.d.toLocaleDateString(undefined, { weekday: "short" })}</div>
          </div>
        );
      })}
    </div>
  );
}

// Phase 5x — single question card on the Daily review screen. Renders
// the question, options (or typed UI), highlighting the user's pick
// (red if wrong) and the correct answer (green).
// Calm review of a completed Daily 7. Used by:
// - Today's 7 done card on Home and Daily tab
// - Calendar past-completed-day tap on Daily tab
// Deliberately not the full Results screen: no celebration banner, no
// Play Again, no Share. Phase 5x renders the FULL ordered review when
// allAnswers is present; falls back to the wrongAnswers-only block for
// Phase 5u-5w days, or to score-card-only for pre-Phase-5u days.
export function DailyReviewScreen({ date, score, wrongAnswers, allAnswers, dailyHistory, loginStreak, onBack }) {
  const todayYMD = dateToYMD(new Date());
  const dateYMD = dateToYMD(date);
  const isToday = dateYMD === todayYMD;
  const dayLabel = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const dateLabel = isToday ? `Today · ${dayLabel}` : dayLabel;
  const hasAll = Array.isArray(allAnswers) && allAnswers.length > 0;
  const hasWrong = Array.isArray(wrongAnswers) && wrongAnswers.length > 0;
  const today = useMemo(() => new Date(), []);

  const streakLine = (() => {
    if (!loginStreak || loginStreak < 1) return null;
    if (loginStreak === 1) return <><Flame size={14} strokeWidth={2.4} aria-hidden="true" /> Day 1 of a new streak</>;
    return <><Flame size={14} strokeWidth={2.4} aria-hidden="true" /> Day {loginStreak} of your daily streak</>;
  })();

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">Daily review</div>
      </div>
      <div className="settings-card" style={{padding:"22px 20px", textAlign:"center", marginBottom:18}}>
        <div style={{fontSize:13, fontWeight:600, color:"var(--t2)", marginBottom:14}}>
          {dateLabel}
        </div>
        <div style={{fontSize:22, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.4px", marginBottom:6}}>
          You scored <span style={{color:"var(--accent)", fontWeight:800}}>{score}/7</span>
        </div>
        <div style={{fontSize:13, color:"var(--t3)"}}>
          Next challenge in <DailyHeroCountdown />
        </div>
        {streakLine && (
          <div style={{fontSize:13, color:"var(--t2)", marginTop:12, fontWeight:600}}>
            {streakLine}
          </div>
        )}
      </div>
      {/* Return-loop (1.4.0): web players finishing the Daily 7 are a prime
          value moment to convert to an installed shell — install is web's only
          path to the daily reminder. Renders nothing on native/installed. */}
      <InstallBanner />
      <Mini7Strip history={dailyHistory} today={today} />
      {hasAll ? (
        <>
          <div className="ds-eyebrow settings-section-title" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
            <span>Full review</span>
            <span style={{color:"var(--t3)", fontSize:11, fontWeight:600, letterSpacing:0.4, textTransform:"none"}}>{score}/7 correct</span>
          </div>
          <div className="dr-list">
            {allAnswers.map((a, i) => <ReviewQuestionCard key={i} a={a} index={i} />)}
          </div>
        </>
      ) : hasWrong ? (
        <>
          {/* Legacy Phase 5u–5w fallback: missed-answers-only block. */}
          <div className="ds-eyebrow settings-section-title">
            Missed {wrongAnswers.length === 1 ? "answer" : "answers"}
          </div>
          <div className="wrong-review">
            {wrongAnswers.map((w, i) => (
              <div key={i} className="wr-item">
                <div className="wr-q">{w.q}</div>
                {w.user && (
                  <div className="wr-user">
                    <span className="wr-x">✗</span>{w.user}
                  </div>
                )}
                <div className="wr-a"><span className="wr-tick">✓</span>{w.correct}</div>
                {w.hint && <div className="wr-why">{w.hint}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          fontSize:13,
          color:"var(--t3)",
          fontStyle:"italic",
          textAlign:"center",
          padding:"4px 16px",
          lineHeight:1.5,
        }}>
          Full review wasn't recorded for this day.
        </div>
      )}
    </div>
  );
}

// Phase 5z — calm review of a completed Today's Puzzle (won or lost).
// Mirrors DailyReviewScreen philosophy: no celebration, no Play Again,
// just the calm "here's what you did" surface. Reuses the active
// puzzle's grid CSS (.wd-grid, .wd-row, .wd-tile, .wd-grid--ended) and
// share path (shareCard + the canonical FootballWordle shareText
// template). Wordle streak isn't tracked separately yet — no streak
// line until that's its own state.
export function PuzzleReviewScreen({ date, guesses, status, onBack }) {
  // J1/J2 fix: was using `WORDLE_PLAYERS[dayIndex % length]` here, which
  // disagrees with the stride formula used by the active game and the home
  // FootleHero. Result: Review re-graded the user's guesses against the
  // wrong answer — wrong colors AND, when the wrong answer was longer than
  // the user's guesses, an extra empty rightmost column from a too-wide
  // grades array. Now shares getWordleAnswerForDayIndex with the active game.
  const answer = useMemo(() => {
    const dayIndex = Math.floor(date.getTime() / TIMINGS.DAY_MS);
    return getWordleAnswerForDayIndex(dayIndex);
  }, [date]);

  const won = status === "won";
  const lost = status === "lost";
  const hasData = Array.isArray(guesses) && guesses.length > 0;
  const cols = answer.length;

  const resultLine = won
    ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
    : lost ? "Better luck tomorrow"
    : "";

  // Performance tier on won state. Skip on lost (the "Better luck
  // tomorrow" already covers tone). Calmly informative — no emoji.
  const tierLine = !won ? null
    : guesses.length === 1 ? "Incredible"
    : guesses.length === 2 ? "Excellent"
    : guesses.length === 3 ? "Great"
    : guesses.length === 4 ? "Good"
    : guesses.length === 5 ? "Phew"
    : guesses.length === 6 ? "Just made it"
    : null;

  const dateLabel = useMemo(
    () => date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    [date]
  );

  // Match the active puzzle's share text exactly so users sharing from
  // FootballWordle's "Share result" button vs this review screen get
  // identical output. One source of truth.
  const shareText = useMemo(() => {
    if (!hasData || (!won && !lost)) return "";
    const grid = guesses.map(g => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map(c => c === "green" ? (CB_MODE() ? "🟧" : "🟩") : c === "yellow" ? (CB_MODE() ? "🟦" : "🟨") : "⬛").join("");
    }).join("\n");
    const num = getFootleNumber(date);
    const tag = num > 0 ? ` #${num}` : "";
    const streak = won ? computeFootleStreak(date) : 0;
    // Wordle-convention first line ("Footle #64 3/6") — the number + compact
    // score is what makes grids comparable between strangers in a feed. The
    // grid right below disambiguates "3/6" (the Sprint #99 concern), so the
    // explicit "guesses" wording lives only on the PNG card headline.
    const head = `⚽ ${APP_NAME} Footle${tag} ${won ? guesses.length : "X"}/6`;
    const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day Footle streak` : "";
    return `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
  }, [guesses, answer, won, lost, hasData, date]);

  const onShare = useCallback(async () => {
    if (!shareText) return;
    const grades = guesses.map(g => gradeWordleGuess(g, answer));
    await shareCard("wordle", {
      score: guesses.length, total: 6, grades, dateLabel, failed: lost, num: getFootleNumber(date),
    }, { onToast: () => {}, textFallback: shareText });
  }, [shareText, guesses, answer, dateLabel, lost, date]);

  // Read-only grid. Phase 5z polish: drop empty rows on won state —
  // show only the rows the user actually used. Lost state keeps all 6
  // rows since the user used them all (guesses.length === 6 by game
  // logic). No flip animation, no shake, no input.
  const totalRows = lost ? 6 : (hasData ? guesses.length : 0);
  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    if (hasData && r < guesses.length) {
      const g = guesses[r];
      const grades = gradeWordleGuess(g, answer);
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className={`wd-tile wd-${grades[i]}`}>{g[i]}</div>
          ))}
        </div>
      );
    } else {
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: cols }, (_, i) => <div key={i} className="wd-tile" />)}
        </div>
      );
    }
  }

  return (
    <div className="screen">
      {/* Phase 5z polish: dropped the top back-btn chevron. Result
          screens get the bottom "Back to Home" pattern instead.
          Title stays in the page-hdr; left-aligns by default flex. */}
      <div className="page-hdr">
        <div className="page-title">Footle</div>
      </div>

      {hasData ? (
        <>
          <div style={{textAlign:"center", fontSize:15, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.2px", marginBottom: tierLine ? 0 : 18}}>
            {resultLine}
          </div>
          {tierLine && (
            <div style={{textAlign:"center", fontSize:13, fontWeight:600, color:"var(--t2)", marginTop:8, marginBottom:18}}>
              {tierLine}
            </div>
          )}

          <div className="wd-grid wd-grid--ended" style={{ "--wd-cols": cols }}>
            {rows}
          </div>

          {lost && (
            <div style={{textAlign:"center", marginTop:14, fontSize:14, color:"var(--t2)"}}>
              Today's word: <strong style={{color:"var(--accent)", fontWeight:800, letterSpacing:"0.5px"}}>{answer}</strong>
            </div>
          )}

          {(won || lost) && (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:20}}>
              {/* width:min(310px, calc(100vw - 80px)) matches the
                  .wd-grid--ended .wd-row max-width — buttons edge-align
                  with the grid above on every viewport. padding:14px 22px
                  bumps height inline (base .wd-share keeps 10px 22px so
                  the active puzzle's share button stays unaffected).
                  marginTop:0 overrides .wd-share's baked-in margin:4px
                  auto 0 so Share and Back share an identical 10px gap
                  from the flex parent. */}
              <button onClick={onShare} className="wd-share" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}}>Share result</button>
              {/* Web-only, same rationale as the active-game screen: native's
                  share sheet already offers WhatsApp with the PNG card. */}
              {!IS_NATIVE && shareText && (
                <a className="wd-share wd-share--wa" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}}>Share on WhatsApp</a>
              )}
              {/* Same App Store nudge as the live puzzle's result (archive
                  visitors from the indexed /footle archive are pure web). */}
              <FootleGetAppCTA style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}} />
              <button onClick={onBack} className="wd-back" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px"}}>Back to Home</button>
            </div>
          )}

          <div style={{textAlign:"center", marginTop:14, fontSize:13, color:"var(--t3)"}}>
            Next puzzle in <DailyHeroCountdown />
          </div>
        </>
      ) : (
        <>
          <div style={{textAlign:"center", padding:"40px 20px", fontSize:14, color:"var(--t3)", fontStyle:"italic"}}>
            Puzzle wasn't recorded for this day.
          </div>
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:8}}>
            <button onClick={onBack} className="wd-back" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px"}}>Back to Home</button>
          </div>
        </>
      )}
    </div>
  );
}

