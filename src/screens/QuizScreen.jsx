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
import { swatchEdge } from '../lib/colourMath.js';
import { ArrowLeft, ArrowRight, Check, LandPlot, ScrollText, Sparkles, Timer } from "lucide-react";
import { prefetchQuestions } from "../questions-loader.js";
import { faceAbbrForCat } from "../lib/ballIqCard.js";
import { haptic, LEAGUE_QUIZ_SECTIONS } from "../App.jsx";
import { useT } from "../i18n/index.js";
import en from "../i18n/en.js";
import "./quiz.css";

// The Mix group: the three old tiles that were whole-bank draws, each still
// started by its own mode so nothing downstream can tell the difference.
// Names and summaries are qz.<key> / qz.<key>Sum in src/i18n/en.js; `short`
// is the key of the name the footer uses when the chip's own is too long.
export const QUIZ_MIX = [
  { key: "classic", Icon: Timer },
  { key: "chaos",   Icon: Sparkles },
  { key: "legends", short: "cat.Legends", Icon: ScrollText },
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

// A chip's name: Spanish renames a few categories (cat.* in en.js); the
// competitions keep LEAGUE_QUIZ_SECTIONS' name, the same in both languages.
const chipName = (t, it) => (en[`cat.${it.cat}`] ? t(`cat.${it.cat}`) : it.name);

export function QuizScreen({ initialTopic, onStartMode, onStartCat, onStadiums, onBack, catStats, cardLeague }) {
  const t = useT();
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
    return ab ? t("qz.catSum", { ab }) : t("qz.catSumAll");
  })() : "";
  const label = mix ? t(mix.short || `qz.${mix.key}`) : catItem ? chipName(t, catItem) : "";
  const start = () => {
    if (mix) onStartMode(mix.key, topic);
    else if (catItem) onStartCat(catItem.cat, topic);
  };
  return (
    <div className="screen qz-screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label={t("game.goBack")}><ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" /></button>
        <h1 className="page-title">{t("home.quiz.title")}</h1>
      </div>
      <p className="qz-intro">{t("qz.intro")}</p>

      <section className="qz-group" aria-labelledby="qz-h-mix">
        <h2 className="qz-h" id="qz-h-mix">{t("qz.mix")}</h2>
        <div className="cf-chips qz-chips">
          {QUIZ_MIX.map(({ key, Icon }) => {
            const on = topic === key;
            return (
              <button key={key} type="button" className={`cf-chip qz-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(key)}>
                <span className="qz-well" aria-hidden="true"><Icon size={16} strokeWidth={2.2} /></span>
                <span className="cf-chip-name">{t(`qz.${key}`)}</span>
                {on && <Check className="qz-tick" size={15} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {QUIZ_CAT_SECTIONS.map((section) => (
        <section key={section.label} className="qz-group" aria-labelledby={`qz-h-${section.label}`}>
          <h2 className="qz-h" id={`qz-h-${section.label}`}>{en[`qz.${section.label}`] ? t(`qz.${section.label}`) : section.label}</h2>
          <div className="cf-chips qz-chips">
            {section.items.map((it) => {
              const on = topic === it.cat;
              return (
                <button key={it.cat} type="button" className={`cf-chip qz-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(it.cat)}>
                  <span className="cf-abbr" style={{ background: it.color, color: "#fff", boxShadow: swatchEdge(it.color) || undefined }} aria-hidden="true">{it.abbr}</span>
                  <span className="cf-chip-name">{chipName(t, it)}</span>
                  {on && <Check className="qz-tick" size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="qz-group" aria-labelledby="qz-h-runs">
        <h2 className="qz-h" id="qz-h-runs">{t("qz.notTen")}</h2>
        <button type="button" className="qz-run" onClick={onStadiums}>
          <span className="qz-well" aria-hidden="true"><LandPlot size={20} strokeWidth={2.2} /></span>
          <span className="qz-run-body">
            <span className="qz-run-name">{t("qz.stadiums")}</span>
            <span className="qz-run-sub">{t("qz.stadiumsSub")}</span>
          </span>
          <span className="qz-run-go">{t("home.row.open")}<ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /></span>
        </button>
      </section>

      {/* Room for the fixed footer, so Stadiums can scroll clear of it. */}
      <div className="qz-pad" aria-hidden="true" />
      <div className="qz-foot">
        <div className="qz-foot-in">
          <p className="qz-sum" aria-live="polite"><strong>{label}</strong> · {mix ? t(`qz.${mix.key}Sum`) : catSum}</p>
          <button type="button" className="next-btn-primary qz-start" onClick={start}>{t("qz.start")}</button>
        </div>
      </div>
    </div>
  );
}
