// The Quiz screen: one door for every ten-question topic (16 Oct 2026).
//
// Home used to carry five separate entries for "a quiz on a topic": the League
// Quiz row plus the Classic, Legends, Chaos and Stadiums tiles. Alex approved
// folding them into one Quiz row that opens this screen (mock-up and mapping in
// ball-iq-audit/2026-10-16/simplify/merge-proposal.md). Nothing about the
// quizzes themselves changed: every chip hands off to the SAME launcher the old
// entry called, so pools, scoring, XP, results, History rows and analytics are
// whatever they were.
//
//   Everything        -> startMode("classic")   (was the Classic tile)
//   Chaos             -> startMode("chaos")     (was the Chaos tile)
//   Legends · pre-2000-> startMode("legends")   (was the Legends tile)
//   Leagues / Tournaments / Themes chips
//                     -> launchLeagueQuiz(cat)  (was the League Quiz picker)
//   Stadiums row      -> the Stadiums screen    (was the Stadiums tile)
//
// ⚠️ LEGENDS IS LISTED ONCE. It used to be two doors into one pool: the Legends
// tile (mode "legends") and the Legends row under Themes in the League Quiz
// picker (cat "Legends"). The chip in Mix keeps the mode; the Themes copy is
// dropped here only. LEAGUE_QUIZ_SECTIONS still carries it, because the
// /quiz/legends/ page's ?quiz=legends link and the card colours read it there.
//
// Lazy on purpose: this file and quiz.css are off Home's eager budget
// (scripts/audit-home-budget.mjs); Home only carries the row that opens it.
import React from "react";
import { ArrowLeft, ArrowRight, Check, LandPlot, ScrollText, Sparkles, Timer } from "lucide-react";
import { prefetchQuestions } from "../questions-loader.js";
import { faceAbbrForCat } from "../lib/ballIqCard.js";
import { haptic, LEAGUE_QUIZ_SECTIONS } from "../App.jsx";
import "./quiz.css";

// The Mix group: the three old tiles that were whole-bank draws, each still
// started by its own mode so nothing downstream can tell the difference.
export const QUIZ_MIX = [
  { key: "classic", name: "Everything",         Icon: Timer,      sum: "10 questions · easy to hard" },
  { key: "chaos",   name: "Chaos",              Icon: Sparkles,   sum: "10 questions · wild cards" },
  { key: "legends", name: "Legends · pre-2000", short: "Legends", Icon: ScrollText, sum: "10 questions · pre-2000" },
];
export const QUIZ_MIX_KEYS = new Set(QUIZ_MIX.map((m) => m.key));
// Legends lives in Mix (above), so it leaves the Themes group on this screen.
export const QUIZ_CAT_SECTIONS = LEAGUE_QUIZ_SECTIONS
  .map((s) => ({ label: s.label, items: s.items.filter((it) => it.cat !== "Legends") }))
  .filter((s) => s.items.length > 0);
const CAT_KEYS = new Set(QUIZ_CAT_SECTIONS.flatMap((s) => s.items.map((it) => it.cat)));

// Any id the app hands us lands on a real chip. "Legends" (the cat, from a
// league-quiz Legends round) is the same pool as the Legends chip.
export function normaliseQuizTopic(t) {
  if (QUIZ_MIX_KEYS.has(t) || CAT_KEYS.has(t)) return t;
  if (t === "Legends") return "legends";
  return "classic";
}

export function QuizScreen({ initialTopic, onStartMode, onStartCat, onStadiums, onBack, catStats, cardLeague }) {
  const [topic, setTopic] = React.useState(() => normaliseQuizTopic(initialTopic));
  React.useEffect(() => {
    // Landing here is play intent: warm the bank so the parse overlaps the
    // choice instead of colliding with the Start tap (as the old picker did).
    prefetchQuestions();
  }, []);
  const pick = (key) => { if (key !== topic) haptic("select"); setTopic(key); };
  const mix = QUIZ_MIX.find((m) => m.key === topic);
  const catItem = !mix ? QUIZ_CAT_SECTIONS.flatMap((s) => s.items).find((it) => it.cat === topic) : null;
  // The per-row "Builds your EPL rating" line of the old picker, kept for the
  // chip that is picked. Per player: slot 0 of the card is THEIR league.
  const catSum = catItem ? (() => {
    const ab = faceAbbrForCat(catItem.cat, catStats, cardLeague);
    return ab ? `10 questions · builds your ${ab} rating` : "10 questions · counts toward your overall Ball IQ";
  })() : "";
  const label = mix ? (mix.short || mix.name) : catItem?.name || "";
  const start = () => {
    if (mix) onStartMode(mix.key, topic);
    else if (catItem) onStartCat(catItem.cat, topic);
  };
  return (
    <div className="screen qz-screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back"><ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" /></button>
        <h1 className="page-title">Quiz</h1>
      </div>
      <p className="qz-intro">Pick a topic. Ten questions, and every answer builds your Ball IQ card.</p>

      <section className="qz-group" aria-labelledby="qz-h-mix">
        <h2 className="qz-h" id="qz-h-mix">Mix</h2>
        <div className="cf-chips qz-chips">
          {QUIZ_MIX.map(({ key, name, Icon }) => {
            const on = topic === key;
            return (
              <button key={key} type="button" className={`cf-chip qz-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(key)}>
                <span className="qz-well" aria-hidden="true"><Icon size={16} strokeWidth={2.2} /></span>
                <span className="cf-chip-name">{name}</span>
                {on && <Check className="qz-tick" size={15} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {QUIZ_CAT_SECTIONS.map((section) => (
        <section key={section.label} className="qz-group" aria-labelledby={`qz-h-${section.label}`}>
          <h2 className="qz-h" id={`qz-h-${section.label}`}>{section.label}</h2>
          <div className="cf-chips qz-chips">
            {section.items.map((it) => {
              const on = topic === it.cat;
              return (
                <button key={it.cat} type="button" className={`cf-chip qz-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(it.cat)}>
                  <span className="cf-abbr" style={{ background: it.color, color: "#fff" }} aria-hidden="true">{it.abbr}</span>
                  <span className="cf-chip-name">{it.name}</span>
                  {on && <Check className="qz-tick" size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="qz-group" aria-labelledby="qz-h-runs">
        <h2 className="qz-h" id="qz-h-runs">Not ten questions</h2>
        <button type="button" className="qz-run" onClick={onStadiums}>
          <span className="qz-well" aria-hidden="true"><LandPlot size={20} strokeWidth={2.2} /></span>
          <span className="qz-run-body">
            <span className="qz-run-name">Stadiums</span>
            <span className="qz-run-sub">Name every ground in a league</span>
          </span>
          <span className="qz-run-go">Open<ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /></span>
        </button>
      </section>

      {/* Room for the fixed footer, so Stadiums can scroll clear of it. */}
      <div className="qz-pad" aria-hidden="true" />
      <div className="qz-foot">
        <div className="qz-foot-in">
          <p className="qz-sum" aria-live="polite"><strong>{label}</strong> · {mix ? mix.sum : catSum}</p>
          <button type="button" className="next-btn-primary qz-start" onClick={start}>Start quiz</button>
        </div>
      </div>
    </div>
  );
}
