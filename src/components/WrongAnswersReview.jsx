import { useEffect } from "react";
import { Check, Flag, X } from "lucide-react";
import ReportButton from "./ReportButton.jsx";
import { bumpUsage } from "../lib/usageCounters.js";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useQuestionText } from "../i18n/questionText.js";
import { rich } from "../i18n/rich.jsx";

// The question's own number in the quiz ("Question 6"), when the answers on
// hand say which ones were missed: the k-th card of the list is the k-th answer
// that was not right (QuizEngine adds to both records in the same breath, a
// timeout included). Without them (a result stored before the answers were
// kept), or if the two do not add up, the list counts for itself, as it did
// when the number stood alone in the margin.
export function missedNumbers(wrongAnswers, allAnswers) {
  const own = wrongAnswers.map((_, i) => i + 1);
  if (!Array.isArray(allAnswers)) return own;
  const at = [];
  allAnswers.forEach((a, i) => { if (!a || a.isCorrect !== true) at.push(i + 1); });
  if (at.length !== wrongAnswers.length) return own;
  const other = wrongAnswers.some((w, k) => { const a = allAnswers[at[k] - 1]; return !!a && typeof a.q === "string" && typeof w?.q === "string" && a.q !== w.q; });
  return other ? own : at;
}

// Wrong-answer review list — shared by the mobile results stack and the
// desktop rd-card so the learn-loop survives at every width (desktop used to
// silently drop it: the list lived inside .rd-mobile, display:none >= 1024).
// The results screen is the RIGHT home for reporting, and until now it had none.
// In-quiz, the report control sits on a screen that auto-advances, so it can be
// gone before the player has finished reading. Here there is no timer, the player
// is already re-reading the questions they got wrong, and every MCQ mode — daily,
// classic, club, league, survival, hot streak — ends up on this one component.
export function WrongAnswersReview({ wrongAnswers, onReport, mode, allAnswers }) {
  const t = useT();
  const loc = useQuestionText();
  // Usage counter INSIDE the guard: an empty review isn't a stats view.
  useEffect(() => { if (wrongAnswers?.length) bumpUsage('review-viewed'); }, []);
  if (!wrongAnswers || wrongAnswers.length === 0) return null;
  const numbers = missedNumbers(wrongAnswers, allAnswers);
  return (
    <div style={{marginTop:24}}>
      {/* ONE CARD PER QUESTION (25 Nov 2026). Alex, on a screenshot of the list
          the tidy pass of 10 Nov left: "question explainers look hectic and not
          properly divided or structured, separated from one question to the
          other, looks like a mess to be honest". Every miss sat in one outlined
          box with a hairline between them, and the question, "Your answer" and
          the explanation were three greys at nearly one size, so nothing said
          where one question ended and the next began.
          Now each miss is its own filled card, and inside it one order, top to
          bottom: a quiet line that says which question it was, with the report
          flag at its right; the question, in white; the right answer, green
          with a tick; the player's own, grey with a red cross (not printed when
          the clock ran out: nothing is claimed about a pick they never made);
          then the explanation, smaller, as a note. Same information, same
          controls, same strings. The day review in History (App.jsx,
          ReviewQuestionCard) keeps its own rows: .wrong-review and .wr-item. */}
      <h3 className="wr-head">{rich(t("rs.reviewMissed"), { n: wrongAnswers.length, w: t("rs.answers", { count: wrongAnswers.length }) })}</h3>
      <div className="wm-list">
        {wrongAnswers.map((w, i) => {
          // Shown in the player's language; the report still files the English.
          const v = loc.missed(w);
          return (
          <div key={i} className="wm-card">
            <div className="wm-top">
              <span className="wm-n">{t("quiz.question", { n: numbers[i] })}</span>
              {onReport && (
                <ReportButton
                  key={w.id != null ? String(w.id) : w.q}
                  onReport={onReport}
                  idle={<><Flag size={15} strokeWidth={2.2} aria-hidden="true" /><span className="wr-flag-t">{t("rs.looksWrong")}</span></>}
                  sending={<><Flag size={15} strokeWidth={2.2} aria-hidden="true" /><span className="wr-flag-t">{t("report.sending")}</span></>}
                  done={<><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span className="wr-flag-t">{t("report.done")}</span></>}
                  info={{ id: w.id, q: w.q, picked: w.user ?? null, correct: w.correct ?? null, mode }}
                  idleColor="var(--t3)"
                  // 44 by 44 to the thumb, 20 tall to the layout: the label line keeps its height.
                  style={{
                    position:"relative", flex:"none", width:44, height:44, margin:"-12px -12px -12px 0", padding:0,
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    background:"none", border:"none", borderRadius:12,
                  }}
                />
              )}
            </div>
            <div className="wm-q">{v.q}</div>
            <div className="wm-a"><Check size={16} strokeWidth={3} aria-hidden="true" /><span>{v.correct}</span></div>
            {v.user && <div className="wm-u"><X size={16} strokeWidth={3} aria-hidden="true" /><span>{t("rs.youSaid", { a: v.user })}</span></div>}
            {v.hint && <div className="wm-why">{v.hint}</div>}
          </div>
          );
        })}
      </div>
    </div>
  );
}


export default WrongAnswersReview;
