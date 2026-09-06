import { useEffect } from "react";
import { Flag } from "lucide-react";
import ReportButton from "./ReportButton.jsx";
import { bumpUsage } from "../lib/usageCounters.js";

// Wrong-answer review list — shared by the mobile results stack and the
// desktop rd-card so the learn-loop survives at every width (desktop used to
// silently drop it: the list lived inside .rd-mobile, display:none >= 1024).
// The results screen is the RIGHT home for reporting, and until now it had none.
// In-quiz, the report control sits on a screen that auto-advances, so it can be
// gone before the player has finished reading. Here there is no timer, the player
// is already re-reading the questions they got wrong, and every MCQ mode — daily,
// classic, club, league, survival, hot streak — ends up on this one component.
export function WrongAnswersReview({ wrongAnswers, onReport, mode }) {
  // Usage counter INSIDE the guard: an empty review isn't a stats view.
  useEffect(() => { if (wrongAnswers?.length) bumpUsage('review-viewed'); }, []);
  if (!wrongAnswers || wrongAnswers.length === 0) return null;
  return (
    <div style={{marginTop:24}}>
      <div className="ds-eyebrow" style={{textAlign:"center", marginBottom:10}}>
        Review {wrongAnswers.length} missed {wrongAnswers.length === 1 ? "answer" : "answers"}
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
            {onReport && (
              <ReportButton
                key={w.id != null ? String(w.id) : w.q}
                onReport={onReport}
                idle={<><Flag size={13} strokeWidth={2.4} aria-hidden="true" /> This looks wrong</>}
                info={{ id: w.id, q: w.q, picked: w.user ?? null, correct: w.correct ?? null, mode }}
                style={{
                  marginTop:10, padding:"7px 11px", minHeight:36,
                  background:"none", border:"1px solid var(--border)", borderRadius:9,
                  fontSize:12, fontWeight:700,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export default WrongAnswersReview;
