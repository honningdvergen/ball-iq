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
// THE PHONE LIST (26 Nov 2026). Alex on the wrapping pills, then on a grid of
// coloured tiles drawn for him: "a 5 or 6", then "a bit overstimulating" and
// "primera liga gets its own full line but the others do not?"; flags were his
// idea. Of the third drawing (ball-iq-audit/2026-11-24/finish/quiz-picker-3.png,
// the right phone, "Calmer, with flags"): "Yes, build it". Under 1024 wide every
// topic is the same row in a plain card, one card per group: a lead mark, the
// name, and a green tick on the chosen one. Leagues lead with their country's
// flag, a static picture from public/flags/ (never a league's logo: those are
// the leagues' trademarks, and the app has no licence); the rest with a grey
// lucide icon. Colour comes only from the flags and the chosen row.
// The wide window (1024 and up: the website's rail and the installed app's
// sidebar) keeps the pills it had, unchanged; it was not part of the drawing.
// The rows keep the class qz-chip and the button qz-start, which the e2e specs
// tap by. Whatever starts a quiz is the same in both.
//
// Lazy on purpose: this file and quiz.css are off Home's eager budget
// (scripts/audit-home-budget.mjs); Home only carries the row that opens it.
import React from "react";
import { swatchEdge } from '../lib/colourMath.js';
import { ArrowLeft, ArrowRight, Check, ChevronRight, LandPlot, ScrollText, Sparkle, Sparkles, Timer } from "lucide-react";
import { QUIZ_LEAGUE_FLAGS, QUIZ_TOPIC_ICONS } from "../lib/quizTopicMarks.js";
import { prefetchQuestions } from "../questions-loader.js";
import { faceAbbrForCat } from "../lib/ballIqCard.js";
import { LEAGUE_QUIZ_SECTIONS } from "../App.jsx";
import { haptic } from "../lib/feedback.js";
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
// The phone list's marks for Mix, as drawn: Chaos is the plain four-point sparkle
// there (the wide window's pill keeps Sparkles, the one with the small stars).
const LIST_ICON = { chaos: Sparkle };
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

// A league's lead mark on the phone list: its country's flag; every other topic
// one plain grey line icon. Both tables live in lib/quizTopicMarks.js since 26
// Nov 2026, so the question card wears the same marks; re-exported here, where
// quiz-topic.test.js holds the flags in step with src/data/nationFlags.json.
export { QUIZ_LEAGUE_FLAGS, QUIZ_TOPIC_ICONS };

// 1024 is where app.css hands the app its wide layout (the rail, the sidebar).
const WIDE = "(min-width: 1024px)";
function useWide() {
  const [wide, setWide] = React.useState(() => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(WIDE).matches);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return wide;
}

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
  const wide = useWide();
  const line = mix ? t(`qz.${mix.key}Sum`) : catSum;
  // On the phone a summary too long for one line (the longer ones at 320) breaks
  // only between its parts, after a dot: never "10" from "questions", and no
  // line starts with "·".
  const parts = line.split(" · ");
  const phoneSum = parts.map((p, i) => (
    <React.Fragment key={i}>{" "}<span className="qz-seg">{p}{i < parts.length - 1 ? "\u00a0·" : ""}</span></React.Fragment>
  ));
  const tick = (on) => on && <Check className="qz-tick" size={18} strokeWidth={2.6} aria-hidden="true" />;
  const foot = (
    <>
      {/* Room for the fixed footer, so the last card can scroll clear of it. */}
      <div className="qz-pad" aria-hidden="true" />
      <div className="qz-foot">
        <div className="qz-foot-in">
          {wide
            ? <p className="qz-sum" aria-live="polite"><strong>{label}</strong> · {line}</p>
            : <p className="qz-sum" aria-live="polite"><span className="qz-seg"><strong>{label}</strong>{"\u00a0·"}</span>{phoneSum}</p>}
          <button type="button" className="next-btn-primary qz-start" onClick={start}>{t("qz.start")}</button>
        </div>
      </div>
    </>
  );
  if (!wide) return (
    <div className="screen qz-screen is-list">
      <header className="qz-top">
        <button className="back-btn" onClick={onBack} aria-label={t("game.goBack")}><ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" /></button>
        <div className="qz-id">
          <h1 className="qz-title">{t("home.quiz.title")}</h1>
          <p className="qz-line">{t("qz.classicSum")}</p>
        </div>
      </header>

      <section aria-labelledby="qz-h-mix">
        <h2 className="home-section-title" id="qz-h-mix">{t("qz.mix")}</h2>
        <div className="gp-list qz-card">
          {QUIZ_MIX.map(({ key, Icon }) => {
            const on = topic === key;
            const every = key === "classic";
            return (
              <button key={key} type="button" className={`qz-chip qz-row${every ? " is-big" : ""}${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(key)}>
                <span className={`qz-lead${every ? " is-go" : ""}`} aria-hidden="true">{React.createElement(LIST_ICON[key] || Icon, { size: every ? 20 : 18, strokeWidth: 2.1 })}</span>
                {every
                  ? <span className="qz-txt"><span className="qz-name">{t("qz.classic")}</span><span className="qz-sub">{t("qz.classicSub")}</span></span>
                  : key === "legends"
                    ? <span className="qz-txt is-line"><span className="qz-name">{t("cat.Legends")}</span><span className="qz-era">{t("qz.legendsEra")}</span></span>
                    : <span className="qz-name">{t(`qz.${key}`)}</span>}
                {tick(on)}
              </button>
            );
          })}
        </div>
      </section>

      {QUIZ_CAT_SECTIONS.map((section) => (
        <section key={section.label} aria-labelledby={`qz-h-${section.label}`}>
          <h2 className="home-section-title" id={`qz-h-${section.label}`}>{en[`qz.${section.label}`] ? t(`qz.${section.label}`) : section.label}</h2>
          <div className="gp-list qz-card">
            {section.items.map((it) => {
              const on = topic === it.cat;
              const flag = QUIZ_LEAGUE_FLAGS[it.cat];
              const Icon = QUIZ_TOPIC_ICONS[it.cat];
              return (
                <button key={it.cat} type="button" className={`qz-chip qz-row${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => pick(it.cat)}>
                  {flag
                    ? <img className="qz-flag" src={`/${flag}`} width="26" height="18" loading="lazy" decoding="async" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    : <span className="qz-lead" aria-hidden="true">{Icon && <Icon size={18} strokeWidth={2.1} />}</span>}
                  <span className="qz-name">{chipName(t, it)}</span>
                  {tick(on)}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section aria-labelledby="qz-h-runs">
        <h2 className="home-section-title" id="qz-h-runs">{t("qz.notTen")}</h2>
        <div className="gp-list qz-card">
          <button type="button" className="qz-row is-big qz-stadiums" onClick={() => onStadiums(topic)}>
            <span className="qz-lead" aria-hidden="true"><LandPlot size={18} strokeWidth={2.1} /></span>
            <span className="qz-txt"><span className="qz-name">{t("qz.stadiums")}</span><span className="qz-sub">{t("qz.stadiumsSub")}</span></span>
            <ChevronRight className="qz-go" size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </section>
      {foot}
    </div>
  );
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
        <button type="button" className="qz-run" onClick={() => onStadiums(topic)}>
          <span className="qz-well" aria-hidden="true"><LandPlot size={20} strokeWidth={2.2} /></span>
          <span className="qz-run-body">
            <span className="qz-run-name">{t("qz.stadiums")}</span>
            <span className="qz-run-sub">{t("qz.stadiumsSub")}</span>
          </span>
          <span className="qz-run-go">{t("home.row.open")}<ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /></span>
        </button>
      </section>

      {foot}
    </div>
  );
}
