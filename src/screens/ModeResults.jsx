// Hot Streak and True-or-False result screens — extracted from App.jsx on
// 2026-09-06 (review E16, brick 8). resultVerdict is shared with the club quiz.
import { CountUp } from "../components/CountUp.jsx";
import { ResultsCloseBtn } from "../components/ResultsCloseBtn.jsx";
import { Home, Share } from "lucide-react";
import { useEffect } from "react";
import { Confetti, haptic } from "../App.jsx";

// Loop instrumentation (opportunity scan 2026-08-10 P0): a named Clarity event
// at each share invocation and pending-token conversion, so k-factor per loop
// stops being a guess. Fire-and-forget; web-only by construction (Clarity
// never loads in the native shell, and the stub queue absorbs early calls).
// Terrace-voice verdict ladder (scan P1): one quotable line per accuracy
// band, used by the results screen AND the share text so the most-seen screen
// and the most-sent sentence carry the same football verdict. No statistical
// claims (App Store 2.3 — the IQ_LABELS lesson).
export function resultVerdict(pct) {
  if (pct === 100) return "Ballon d'Or form";
  if (pct >= 80) return "Top-corner finish";
  if (pct >= 60) return "Solid at the back";
  if (pct >= 40) return "Squad rotation material";
  return "Sunday league, first half";
}
// Per-token once-only guard for challenge measurement rpcs. StrictMode
// double-invokes effects in dev (both settle sites live in effect/handler
// paths that mount-fire), and the same token can be restored from
// localStorage across boots — a marker per (event, token) makes the
// measurement idempotent everywhere instead of relying on prod's
// single-invoke behaviour.
// ─── HOT STREAK RESULTS ───────────────────────────────────────────────────────
export function HotStreakResults({ result, onRetry, onHome, onShare, prevBest }) {
  const score = result.score;
  const answered = result.total;
  const isNewBest = prevBest === 0 || score > prevBest;
  const isFirstRun = prevBest === 0 && score > 0;
  const pct = answered > 0 ? Math.round((score / answered) * 100) : 0;
  const emoji = score >= 25 ? "🐐" : score >= 15 ? "🔥" : score >= 8 ? "⚡" : "⏱️";
  const title = score >= 25 ? "Prime Messi numbers" : score >= 15 ? "Golden Boot pace" : score >= 8 ? "Poacher's instinct" : "Pre-season sharpness";
  const xpEarned = score * 8;
  useEffect(() => { if (isNewBest && !isFirstRun && score >= 5) haptic("levelup"); }, [isNewBest, isFirstRun, score]);
  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {score >= 15 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",letterSpacing:2}}>⚡🔥 Hot Streak</span>
      </div>
      <div className="rc">
        <div className="rc-icon">{emoji}</div>
        <div className="rc-title">{title}</div>
        {/* ⚠️ THE SIBLING CALL SITE. The quiz results screen earns the accent at
            70%+; this one hardcoded it, so Survival and Hot Streak showed
            celebration green for a score of 1. There is no denominator here
            (it is "N correct in 60 seconds"), so the band is on the count:
            8+ is a real run on a 60-second clock. */}
        <div className={`score-big${score >= 8 ? " is-strong" : ""}`}><CountUp value={score} duration={900} delay={250} triggerHaptic /><span style={{fontSize:22,color:"var(--t2)",fontWeight:500}}> correct</span></div>
        <div className="score-pct">in 60 seconds · {answered} answered</div>
      </div>

      {/* 🏆 Personal best callout */}
      {isNewBest && !isFirstRun && prevBest > 0 && <div className="new-best">🏆 New Hot Streak best — was {prevBest}!</div>}
      {isFirstRun && <div className="new-best">⚡ First Hot Streak run: {score} correct</div>}
      {prevBest > 0 && !isNewBest && <div style={{textAlign:"center",fontSize:12,color:"var(--t2)",margin:"4px 0 10px"}}>Personal best: {prevBest}</div>}

      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--accent)"}}><CountUp value={score} duration={700} delay={550} /></div><div className="sbox-k">Correct</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--t2)"}}><CountUp value={answered} duration={700} delay={650} /></div><div className="sbox-k">Answered</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}><CountUp value={pct} duration={700} delay={750} suffix="%" /></div><div className="sbox-k">Accuracy</div></div>
      </div>
      <div className="results-actions" style={{marginTop:14}}>
        <button className="btn-3d" onClick={onRetry}>Run it back</button>
        <button className="btn-3d ghost" onClick={onShare}>Share score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          +{xpEarned} XP earned
        </div>
      )}
    </div>
  );
}

// ─── TRUE OR FALSE RESULTS ────────────────────────────────────────────────────
export function TrueFalseResults({ result, onRetry, onHome, onShare }) {
  const { score, total } = result;
  const pct = Math.round((score / total) * 100);
  const isPerfect = score === total;
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const emoji = pct === 100 ? "🧠" : pct >= 80 ? "✅" : pct >= 60 ? "⚽" : pct >= 40 ? "🤔" : "❌";
  const title = resultVerdict(pct);
  const xpEarned = score * 8;
  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {pct >= 80 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",letterSpacing:2}}>✅ True or False</span>
      </div>
      <div className="rc">
        <div className="rc-icon">{emoji}</div>
        <div className="rc-title">{title}</div>
        {/* The accent is the app's "this went well" signal, so it is earned
            rather than automatic — 1/7 in celebration green misreads the
            moment and devalues green everywhere else. */}
        <div className={`score-big${total > 0 && score / total >= 0.7 ? " is-strong" : ""}`}><CountUp value={score} duration={900} delay={250} triggerHaptic /><span style={{fontSize:30,color:"var(--t2)"}}>/{total}</span></div>
      </div>

      {isPerfect && total >= 10 && <div className="new-best">🎯 Perfect round — no lies slipped past!</div>}

      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--green)"}}><CountUp value={score} duration={700} delay={550} /></div><div className="sbox-k">Correct</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--red)"}}><CountUp value={total - score} duration={700} delay={650} /></div><div className="sbox-k">Wrong</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}><CountUp value={pct} duration={700} delay={750} suffix="%" /></div><div className="sbox-k">Accuracy</div></div>
      </div>
      <div className="results-actions" style={{marginTop:14}}>
        <button className="btn-3d" onClick={onRetry}>Another round</button>
        <button className="btn-3d ghost" onClick={onShare}>Share score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          +{xpEarned} XP earned
        </div>
      )}
    </div>
  );
}


