import { useEffect } from "react";
import { Check, Flag } from "lucide-react";
import ReportButton from "./ReportButton.jsx";
import { bumpUsage } from "../lib/usageCounters.js";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useQuestionText } from "../i18n/questionText.js";
import { rich } from "../i18n/rich.jsx";

// Wrong-answer review list — shared by the mobile results stack and the
// desktop rd-card so the learn-loop survives at every width (desktop used to
// silently drop it: the list lived inside .rd-mobile, display:none >= 1024).
// The results screen is the RIGHT home for reporting, and until now it had none.
// In-quiz, the report control sits on a screen that auto-advances, so it can be
// gone before the player has finished reading. Here there is no timer, the player
// is already re-reading the questions they got wrong, and every MCQ mode — daily,
// classic, club, league, survival, hot streak — ends up on this one component.
export function WrongAnswersReview({ wrongAnswers, onReport, mode }) {
  const t = useT();
  const loc = useQuestionText();
  // Usage counter INSIDE the guard: an empty review isn't a stats view.
  useEffect(() => { if (wrongAnswers?.length) bumpUsage('review-viewed'); }, []);
  if (!wrongAnswers || wrongAnswers.length === 0) return null;
  return (
    <div style={{marginTop:24}}>
      {/* TIDY PASS (10 Nov 2026). Alex on the old list: "explanations are
          correct but they are presented so untidy". Each miss was five pieces
          on four left edges: the question, a red line, a green line, an
          indented explanation behind a rule and a boxed report button. Now one
          left edge: the right answer leads and is the only colour, the wrong
          pick is a grey "You said", the explanation is plain text, and the
          report control is a flag in the corner. */}
      <h3 className="wr-head">{rich(t("rs.reviewMissed"), { n: wrongAnswers.length, w: t("rs.answers", { count: wrongAnswers.length }) })}</h3>
      <div className="wrong-review">
        {wrongAnswers.map((w, i) => {
          // Shown in the player's language; the report still files the English.
          const v = loc.missed(w);
          return (
          <div key={i} className="wr-item">
            <span className="wr-n" aria-hidden="true">{i + 1}</span>
            <div className="wr-body">
              <div className="wr-q">{v.q}</div>
              <div className="wr-a">{v.correct}</div>
              {v.user && <div className="wr-user">{t("rs.youSaid", { a: v.user })}</div>}
              {v.hint && <div className="wr-why">{v.hint}</div>}
            </div>
            {onReport && (
              <ReportButton
                key={w.id != null ? String(w.id) : w.q}
                onReport={onReport}
                idle={<><Flag size={15} strokeWidth={2.2} aria-hidden="true" /><span className="wr-flag-t">{t("rs.looksWrong")}</span></>}
                sending={<><Flag size={15} strokeWidth={2.2} aria-hidden="true" /><span className="wr-flag-t">{t("report.sending")}</span></>}
                done={<><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span className="wr-flag-t">{t("report.done")}</span></>}
                info={{ id: w.id, q: w.q, picked: w.user ?? null, correct: w.correct ?? null, mode }}
                idleColor="var(--t3)"
                style={{
                  position:"relative", flex:"none", width:36, height:36, margin:"-6px -8px 0 0", padding:0,
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  background:"none", border:"none", borderRadius:10,
                }}
              />
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}


export default WrongAnswersReview;
