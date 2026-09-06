// The results screen for Classic, Speed, Survival, Legends, Chaos and the
// Daily 7 — the first screen extracted from App.jsx along its props seam
// (review 2026-09-06, E16). Nothing here reaches into AppInner state: every
// collaborator arrives as a prop, and `haptic` / `Confetti` come from App the
// way the lazy screens already import them.
import { useEffect } from "react";
import { Star, Trophy } from "lucide-react";
import { haptic, Confetti } from "../App.jsx";
import { DailyDone } from "../components/DailyDone.jsx";
import { CountUp } from "../components/CountUp.jsx";
import { ResultsCloseBtn } from "../components/ResultsCloseBtn.jsx";
import { WrongAnswersReview } from "../components/WrongAnswersReview.jsx";
import { dayIndexForDate } from "../lib/date.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";
import { getXPForResult } from "../lib/scoring.js";
import { dailyTierCopy, scoreTagline } from "../lib/resultsCopy.js";
import { stumpLink, shareStumpText } from "../lib/stump.js";

// TomorrowTeaser (the Daily-7-only return moment) retired 2026-09-06: the
// return loop is one component for all four dailies — components/DailyDone.jsx.
export function Results({ result, mode, onHome, onRetry, onShare, onPlayFootle, onPlayDaily, dailyOpen, survivalBest, wrongAnswers, askedQuestions, classicBest, label, onReport, photoNudge, dailyDone }) {
  const isPerfect = result && result.score === result.total && result.total >= 10;
  const pct = Math.round((result.score / result.total) * 100);
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const isSurvival = mode === "survival";
  const isSpeed = mode === "speed";
  const isDaily = mode === "daily";


  const xpEarned = getXPForResult(result.score, result.total, mode);
  const showConfetti = isSurvival ? result.score >= 10 : pct >= 80;

  // Daily 7 is one-shot: "Play Again" would just re-call startMode('daily')
  // and toast "Already done today" — a dead primary button. Point the CTA at
  // the OTHER daily loop (Footle) while it's still open; when both dailies
  // are done, show a non-button "come back tomorrow" state instead.
  /* ⚠️ READ FOR EVERY MODE, not just the daily. This was isDaily-gated, which
     meant the daily cross-sell could only ever appear on the ONE results screen
     whose players are already inside the daily loop. Measured 2026-08-31: 77%
     of players who enter through a non-daily door never reach a daily game, and
     of everyone who has ever finished a club quiz, the number whose first app
     event came on a later day is zero. The door has to exist where the people
     without it actually are. */
  const footleToday = readWordleTodayStatus();
  const footleOpen = footleToday && (footleToday.kind === "ready" || footleToday.kind === "in-progress");
  const footleCta = footleToday?.kind === "in-progress" ? "Continue today's Footle" : "Play today's Footle";

  // Personal best detection
  const eligibleForPB = mode === "classic" && result.total === 10;
  const isNewBest = eligibleForPB && result.score > (classicBest || 0) && result.score > 0;

  // Stump-a-mate ammo (contextual, per Alex's call): prefer the hardest
  // question that got the player (self-deprecating share beats a brag for
  // k-factor), else the hardest one they aced. Plain code, NOT hooks — this
  // askedQuestions rows are the
  // shuffled play copies, but stumpLink only reads id/q/cat, and the
  // recipient re-resolves the original row from the bank by id.
  const diffRank = { hard: 3, medium: 2, easy: 1 };
  const stumpables = (askedQuestions || []).filter((x) => x && x.id && x.type === "mcq" && Array.isArray(x.o) && x.o.length >= 2);
  const wrongTexts = new Set((wrongAnswers || []).map((w) => w.q));
  const stumpWrong = stumpables.filter((x) => wrongTexts.has(x.q));
  const stumpPool = stumpWrong.length ? stumpWrong : stumpables;
  const stumpQ = stumpPool.length ? stumpPool.slice().sort((a, b) => (diffRank[b.diff] || 0) - (diffRank[a.diff] || 0))[0] : null;
  const onStump = () => {
    if (!stumpQ) return;
    haptic("soft");
    const text = stumpWrong.length
      ? `This one got me 🙈 bet you can't get it either ⚽ ${stumpLink(stumpQ)}`
      : `I got this one — bet you can't 😏 ⚽ ${stumpLink(stumpQ)}`;
    shareStumpText(text);
  };
  const survivalNewBest = isSurvival && result.score > (survivalBest || 0) && result.score >= 3;
  const isNewPersonalBest = isNewBest || survivalNewBest;

  // Huge-score display + caption per mode
  const hugeScore = isSpeed ? (result.speedScore || 0) : result.score;
  const scoreCaption = isSpeed
    ? `${result.score} correct out of ${result.total} · speed bonus included`
    : isSurvival
    ? (result.score === 0 ? "Out on the first question — it happens to everyone" : `${result.score} in a row before missing one`)
    : `${result.score} correct out of ${result.total}`;
  // Best run rides the caption (review C: the amber pill was a third accent on
  // a screen that already has green and gold). Hidden below 3 — noise.
  const bestRun = !isSurvival && result.bestStreak != null && result.bestStreak >= 3 && result.bestStreak < result.total ? result.bestStreak : 0;

  // One primary. Whichever daily is still open wins it, "Play again" demotes to
  // the quiet row — except a Survival death on the first question, where the
  // only honest next step is the same run again.
  const dailyCta = dailyOpen && onPlayDaily ? { label: "Play today's Daily 7", onClick: onPlayDaily }
    : footleOpen ? { label: footleCta, onClick: onPlayFootle } : null;
  const retryDemoted = !!dailyCta && !(isSurvival && result.score === 0);

  // ── desktop-web-refresh (Results #03): values for the >=1024 card (circular
  //  score badge · per-question dots · stat tiles). Render-always / CSS-revealed
  //  via the .rd-desktop wrapper; the mobile results is wrapped in .rd-mobile
  //  (display:contents→none at desktop) so it stays byte-identical. ──
  const RD_MODE_LABEL = { classic:"Classic", speed:"Speed Round", daily:"Daily 7", survival:"Survival", legends:"Legends", chaos:"Chaos" };
  const rdSubtitle = [RD_MODE_LABEL[mode] || "Quiz", label].filter(Boolean).join(" · ");
  const rdDots = (() => {
    const arr = Array.isArray(result.allAnswers) ? result.allAnswers.map(a => a.isCorrect === true) : [];
    while (arr.length < result.total) arr.push(false); // timed-out / unanswered → miss
    return arr.slice(0, result.total);
  })();
  const rdTier = isDaily ? dailyTierCopy(result.score, result.total).headline : scoreTagline(pct);
  const rdBestStreak = result.bestStreak != null ? result.bestStreak : 0;

  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {(isPerfect || showConfetti) && <Confetti />}
      <div className="rd-mobile">
      <ResultsCloseBtn onClose={onHome} />

      {/* Final score eyebrow + huge green number + caption */}
      <div style={{textAlign:"center", padding:"20px 0 8px"}}>
        <div className="ds-eyebrow">Final score</div>
        <div
          className="numeric"
          style={{
            marginTop:8,
            fontSize:88,
            fontWeight:900,
            // Green is the app's "this went well" signal — earned, not automatic.
            // A zero (Survival's first-question death, a blank round) reads in
            // the quiet text colour with no glow (review C10).
            color: hugeScore > 0 ? "var(--accent)" : "var(--t2)",
            letterSpacing:"-0.03em",
            lineHeight:1,
            textShadow: hugeScore > 0 ? "0 8px 32px rgba(88,204,2,0.35)" : "none",
          }}
        >
          <CountUp value={hugeScore} duration={900} delay={200} triggerHaptic />
        </div>
        <div style={{marginTop:8, fontSize:15, color:"var(--t2)"}}>{scoreCaption}{bestRun ? <> · best run <span className="numeric">{bestRun}</span> in a row</> : null}</div>
        {/* Score-tier tagline. Daily uses the daily-specific tier copy so
            the personality from the old DailySocialProof callout is kept
            ("Tomorrow's another chance to climb" etc.) without the
            duplicate card. Survival skips — its caption + PB callout
            already carry the moment. */}
        {isDaily ? (() => {
          const { headline, sub } = dailyTierCopy(result.score, result.total);
          return (
            <>
              <div style={{marginTop:6, fontSize:15, color:"var(--t1)", fontWeight:700}}>{headline}</div>
              <div style={{marginTop:2, fontSize:13, color:"var(--t3)", fontWeight:500}}>{sub}</div>
            </>
          );
        })() : isSurvival ? (result.score === 0 && (
          <div style={{marginTop:6, fontSize:14, color:"var(--t3)", fontWeight:500}}>
            One wrong answer ends a run. The next one starts clean.
          </div>
        )) : (
          <div style={{marginTop:6, fontSize:14, color:"var(--t3)", fontWeight:500}}>
            {scoreTagline(pct)}
          </div>
        )}
        {isNewPersonalBest && (
          <div style={{marginTop:10, display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:"var(--gold)"}}>
            <Star size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>Personal best{isNewBest && classicBest ? ` — was ${classicBest}` : survivalNewBest && survivalBest ? ` — was ${survivalBest}` : ""}</span>
          </div>
        )}
        {/* XP indicator promoted into the celebration moment — was a muted
            footer below the buttons; now sits with the score in gold so it
            reads as a reward rather than a footnote. Gold matches XP
            theming elsewhere in the app (toasts, level-up overlay). */}
        {xpEarned > 0 && (
          <div style={{marginTop:14, fontSize:14, color:"var(--gold)", fontWeight:700}}>
            +{xpEarned} XP
          </div>
        )}
      </div>

      {result.winner && (
        <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:6, margin:"14px 0", fontSize:15, fontWeight:700, color:"var(--gold)"}}><Trophy size={16} strokeWidth={2.4} aria-hidden="true" />{result.winner} wins!</div>
      )}

      {/* Two-tier action stack: filled green primary, ghost secondaries.
          Amber Share was dropped for cross-screen consistency — Share is a
          secondary action everywhere now. */}
      {/* ⚠️ AFTER the game, never before it. Alex asked for a nudge to set a
          profile picture "the first time they open the app"; the measurement
          argued it down to here and he agreed. 36.2% of accounts never play a
          single game, and the five-star sign-up blocker was LITERALLY a
          mandatory step in that same gap — the username wall rejecting Apple
          and Google's own pre-filled names. Another step before the first game
          is the same bet, placed again. Here they have just finished
          something, there is a score to attach a face to, and it costs zero
          activation. */}
      {photoNudge}

      {/* Daily 7: the return loop — streak, countdown + remind, share, how
          everyone did, the other open dailies. One component for all four
          dailies (components/DailyDone.jsx); the edition is the day index. */}
      {isDaily && dailyDone && (
        <div style={{marginTop:18}}>
          <DailyDone game="daily7" edition={dayIndexForDate(new Date())} won bucket={result.score}
            streak={dailyDone.streak} onShare={onShare} remind={dailyDone.remind} nextUp={dailyDone.nextUp}
            save={dailyDone.save} stump={stumpQ ? onStump : null} track={dailyDone.track} />
        </div>
      )}

      {isDaily ? (
        <>
          {/* Daily 7: the panel IS the action set — share, remind, stump a mate,
              save. What is left is the review of what got you, then the way out. */}
          <WrongAnswersReview wrongAnswers={wrongAnswers} onReport={onReport} mode={mode} />
          <div className="results-actions" style={{marginTop:18}}>
            <button className="results-exit" onClick={onHome}>Back to Home</button>
          </div>
        </>
      ) : (
        <>
          {/* One primary, a row of two quiet buttons, a text link, the way out.
              Five stacked buttons in three weights (review C9) asked the player
              to rank the app's wishes; this ranks them for them. */}
          <div className="results-actions" style={{marginTop:18}}>
            {retryDemoted
              ? <button className="btn-3d" onClick={dailyCta.onClick}>{dailyCta.label}</button>
              : <button className="btn-3d" onClick={onRetry}>{isSurvival ? "Go again" : "Play again"}</button>}
            <div className="results-row">
              {retryDemoted && <button className="btn-3d ghost" onClick={onRetry}>Play again</button>}
              <button className="btn-3d ghost" onClick={onShare}>Share score</button>
              {!retryDemoted && stumpQ && <button className="btn-3d ghost" onClick={onStump}>Stump a mate</button>}
            </div>
            {retryDemoted && stumpQ && <button className="results-link" onClick={onStump}>Stump a mate with a question</button>}
            <button className="results-exit" onClick={onHome}>Back to Home</button>
          </div>
          <WrongAnswersReview wrongAnswers={wrongAnswers} onReport={onReport} mode={mode} />
        </>
      )}
      </div>{/* /.rd-mobile */}

      {/* ── desktop-web-refresh (Results #03): centered card. display:none <1024;
          revealed at desktop where .rd-mobile is hidden. Standalone PWA resets
          both so installed desktop shells keep the mobile results. ── */}
      <div className="rd-desktop">
        <div className="rd-card">
          {/* ⚠️ SURVIVAL IS NOT A ROUND. This card was added in the desktop
              refresh and inherited none of the survival handling the mobile
              results above had already worked out, so a sudden-death run ended
              on "Round complete · 0/1 · 0% accuracy · Tough round." — a
              denominator for a mode whose whole point is that there isn't one,
              and a first-timer's very first Survival death reading 0/1/0%/+0/0.
              The Daily tab now routes finished days straight into Survival, so
              this is a first impression, not an edge case.
              Every branch below mirrors a decision the mobile hero already
              made: no denominator, the run caption instead of a percentage
              tier, and the personal-best callout. */}
          <div className="rd-eyebrow">{isSurvival ? "Run over" : "Round complete"}</div>
          <div className="rd-sub">{rdSubtitle}</div>
          <div className="rd-badge">
            <div className="rd-badge-score">
              {result.score}
              {!isSurvival && <span className="rd-badge-total">/{result.total}</span>}
            </div>
            {/* Mobile deliberately skips the percentage tagline for survival —
                the caption and the PB carry the moment, and a percentage of a
                run you died in is noise. Kept SHORT here rather than reusing
                mobile's full scoreCaption: this sits inside a circular badge,
                and the long form wrapped to two lines and pushed against the
                curve. The number already says how many; this says of what. */}
            <div className="rd-badge-tier">{isSurvival ? "in a row" : rdTier}</div>
          </div>
          {/* Dots are a per-question map of a fixed-length round. A survival run
              has no fixed length — a long one would spray dozens of them across
              the card — and the streak number is already the whole story. */}
          {!isSurvival && (
            <div className="rd-dots" aria-hidden="true">
              {rdDots.map((ok, i) => (
                <span key={i} className={`rd-dot ${ok ? "ok" : "no"}`}>{ok ? "✓" : "✗"}</span>
              ))}
            </div>
          )}
          {isNewPersonalBest && (
            <div className="rd-pb">
              <Star size={14} strokeWidth={2.4} aria-hidden="true" />
              <span>
                Personal best
                {isNewBest && classicBest ? ` — was ${classicBest}`
                  : survivalNewBest && survivalBest ? ` — was ${survivalBest}` : ""}
              </span>
            </div>
          )}
          <div className="rd-tiles">
            {/* Accuracy on a sudden-death run is always "everything until the one
                that ended it", so it carries no information. What a survival
                player actually wants is the number to beat. */}
            {isSurvival ? (
              // "—" not "0" with no PB yet. A first run already shows +0 XP and
              // best streak 0; a third hard zero reads like the app failed to
              // record something rather than like a record waiting to be set.
              <div className="rd-tile"><div className="rd-tile-v">{survivalBest > 0 ? survivalBest : "—"}</div><div className="rd-tile-k">Best ever</div></div>
            ) : (
              <div className="rd-tile"><div className="rd-tile-v">{pct}%</div><div className="rd-tile-k">Accuracy</div></div>
            )}
            <div className="rd-tile"><div className="rd-tile-v rd-amber">+{xpEarned}</div><div className="rd-tile-k">XP earned</div></div>
            <div className="rd-tile"><div className="rd-tile-v rd-green">{rdBestStreak}</div><div className="rd-tile-k">Best streak</div></div>
          </div>
          {isDaily && dailyDone && (
            <div style={{margin:"18px 0"}}>
              <DailyDone game="daily7" edition={dayIndexForDate(new Date())} won bucket={result.score}
                streak={dailyDone.streak} onShare={onShare} remind={dailyDone.remind} nextUp={dailyDone.nextUp}
                save={dailyDone.save} stump={stumpQ ? onStump : null} track={dailyDone.track} />
            </div>
          )}
          <div className="rd-actions">
            {!isDaily && dailyOpen && onPlayDaily && (
              <button className="rd-btn rd-btn-primary" onClick={onPlayDaily}>Play today&#39;s Daily 7</button>
            )}
            {!isDaily && !dailyOpen && footleOpen && (
              <button className="rd-btn rd-btn-primary" onClick={onPlayFootle}>{footleCta}</button>
            )}
            {!isDaily && <button className={`rd-btn ${(dailyOpen && onPlayDaily) || footleOpen ? "rd-btn-ghost" : "rd-btn-primary"}`} onClick={onRetry}>Play again</button>}
            <button className="rd-btn rd-btn-ghost" onClick={onHome}>Home</button>
            {!isDaily && <button className="rd-btn rd-btn-ghost" onClick={onShare}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M12 15V4M8 8l4-4 4 4"></path></svg>
              Share
            </button>}
            {stumpQ && !isDaily && <button className="rd-btn rd-btn-ghost" onClick={onStump}>Stump a mate</button>}
          </div>
        </div>
        {/* Same review loop as mobile — constrained to the rd-card column. */}
        <div style={{maxWidth:560, margin:"0 auto"}}>
          <WrongAnswersReview wrongAnswers={wrongAnswers} onReport={onReport} mode={mode} />
        </div>
      </div>
    </div>
  );
}


export default Results;
