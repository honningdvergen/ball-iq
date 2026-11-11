// Hot Streak and True-or-False result screens — extracted from App.jsx on
// 2026-09-06 (review E16, brick 8). resultVerdict is shared with the club quiz.
import { CountUp } from "../components/CountUp.jsx";
import { ResultsCloseBtn } from "../components/ResultsCloseBtn.jsx";
import { Home, Share } from "lucide-react";
import { useEffect } from "react";
import { Confetti } from "../components/Confetti.jsx";
import { haptic } from "../lib/feedback.js";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { rich } from "../i18n/rich.jsx";

// Loop instrumentation (opportunity scan 2026-08-10 P0): a named Clarity event
// at each share invocation and pending-token conversion, so k-factor per loop
// stops being a guess. Fire-and-forget; web-only by construction (Clarity
// never loads in the native shell, and the stub queue absorbs early calls).
// Terrace-voice verdict ladder (scan P1): one quotable line per accuracy
// band, used by the results screen AND the share text so the most-seen screen
// and the most-sent sentence carry the same football verdict. No statistical
// claims (App Store 2.3 — the IQ_LABELS lesson).
// resultVerdict now lives in ../lib/resultVerdict.js — see that file for why.
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
  const t = useT();
  const title = t(score >= 25 ? "hs.t25" : score >= 15 ? "hs.t15" : score >= 8 ? "hs.t8" : "hs.t0");
  const xpEarned = score * 8;
  useEffect(() => { if (isNewBest && !isFirstRun && score >= 5) haptic("levelup"); }, [isNewBest, isFirstRun, score]);
  // 8+ is a real run on a 60-second clock: the accent is earned on the count
  // (there is no denominator here), as on the quiz results screen.
  const strong = score >= 8;
  return (
    <div className="screen foot-clear" style={{paddingTop:8, position:"relative"}}>
      {score >= 15 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      {/* THE SAME FINISH AS EVERY OTHER MODE (11 Nov 2026). This screen was a
          generation behind: emoji in the header and above the title, a card
          the back button overlapped, and the result said three times ("1
          correct", then tiles for Correct, Answered and Accuracy). Now: the
          mode's name, the number, the verdict, one line that carries the
          rest, and one solid button. */}
      <div style={{textAlign:"center", padding:"20px 0 8px"}}>
        <div className="ds-eyebrow">{t("home.mode.hotstreak")}</div>
        <div className="numeric" style={{
          marginTop:8, fontSize:88, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1,
          color: strong ? "var(--accent)" : score > 0 ? "var(--text)" : "var(--t2)",
          textShadow: strong ? "0 8px 32px rgba(88,204,2,0.18)" : "none",
        }}>
          <CountUp value={score} duration={900} delay={250} triggerHaptic />
        </div>
        <div style={{marginTop:10, fontSize:17, fontWeight:800, color:"var(--t1)", letterSpacing:"-0.01em"}}>{title}</div>
        <div style={{marginTop:4, fontSize:14, color:"var(--t2)"}}>{rich(t("hs.line"), { right: <span className="numeric">{score}</span>, n: <span className="numeric">{answered}</span> })}</div>
        {isNewBest && !isFirstRun && prevBest > 0 && <div className="new-best" style={{marginTop:14}}>{rich(t("hs.newBest"), { n: prevBest })}</div>}
        {isFirstRun && <div className="new-best" style={{marginTop:14}}>{rich(t("hs.first", { count: score }), { n: score })}</div>}
        {prevBest > 0 && !isNewBest && <div style={{fontSize:13,color:"var(--t3)",marginTop:10}}>{rich(t("hs.pb"), { n: prevBest })}</div>}
        {xpEarned > 0 && (
          <div style={{marginTop:14, fontSize:14, color:"var(--gold)", fontWeight:700}}>
            {rich(t("rs.xp"), { n: xpEarned })}
          </div>
        )}
      </div>
      <div className="results-actions" style={{marginTop:18}}>
        <button className="btn-3d" onClick={onRetry}>{t("hs.again")}</button>
        <div className="results-row">
          <button className="btn-3d ghost" onClick={onShare}>{t("rs.shareScore")}</button>
        </div>
        <button className="results-exit" onClick={onHome}>{t("quiz.backHome")}</button>
      </div>
    </div>
  );
}

// ─── TRUE OR FALSE RESULTS ────────────────────────────────────────────────────
export function TrueFalseResults({ result, onRetry, onHome, onShare }) {
  const { score, total } = result;
  const pct = Math.round((score / total) * 100);
  const isPerfect = score === total;
  const t = useT();
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const emoji = pct === 100 ? "🧠" : pct >= 80 ? "✅" : pct >= 60 ? "⚽" : pct >= 40 ? "🤔" : "❌";
  // resultVerdict's bands, in the player's language (the share text keeps resultVerdict's English).
  const title = t(pct === 100 ? "rv.100" : pct >= 80 ? "rv.80" : pct >= 60 ? "rv.60" : pct >= 40 ? "rv.40" : "rv.0");
  const xpEarned = score * 8;
  return (
    <div className="screen foot-clear" style={{paddingTop:8, position:"relative"}}>
      {pct >= 80 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",letterSpacing:2}}>{t("tf.label")}</span>
      </div>
      <div className="rc">
        <div className="rc-icon">{emoji}</div>
        <div className="rc-title">{title}</div>
        {/* The accent is the app's "this went well" signal, so it is earned
            rather than automatic — 1/7 in celebration green misreads the
            moment and devalues green everywhere else. */}
        <div className={`score-big${total > 0 && score / total >= 0.7 ? " is-strong" : ""}`}><CountUp value={score} duration={900} delay={250} triggerHaptic /><span style={{fontSize:30,color:"var(--t2)"}}>/{total}</span></div>
      </div>

      {isPerfect && total >= 10 && <div className="new-best">{t("tf.perfect")}</div>}

      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--green)"}}><CountUp value={score} duration={700} delay={550} /></div><div className="sbox-k">{t("rs.correct")}</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--red)"}}><CountUp value={total - score} duration={700} delay={650} /></div><div className="sbox-k">{t("rs.wrong")}</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}><CountUp value={pct} duration={700} delay={750} suffix="%" /></div><div className="sbox-k">{t("home.rail.accuracy")}</div></div>
      </div>
      <div className="results-actions" style={{marginTop:14}}>
        <button className="btn-3d" onClick={onRetry}>{t("tf.again")}</button>
        <button className="btn-3d ghost" onClick={onShare}>{t("rs.shareScore")}</button>
        <button className="btn-3d ghost" onClick={onHome}>{t("quiz.backHome")}</button>
      </div>
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          {rich(t("rs.xpEarned"), { n: xpEarned })}
        </div>
      )}
    </div>
  );
}


