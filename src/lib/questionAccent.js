// The question card's accent on a phone: its coloured left edge and the soft
// wash across it (screens/QuizEngine.jsx, 26 Nov 2026).
//
// It is the same colour qCardStyle (lib/ballIqCard.js) gives the card today,
// catColour() through lift(), with FOUR exceptions. Alex saw the card drawn in
// every topic's colour (ball-iq-audit/2026-11-26/quiz-question/all-topics/) and,
// asked "Shall the build use the lifted colours for those four: yes, lifted, or
// keep today's?", answered "Yes, lifted". Champions League, Ligue 1, Primeira
// Liga and International (which Euros wears) were too dark or too muddy to show
// on a dark card; each keeps its hue, only clearer. The swap is made HERE, on
// the lifted value, and nowhere else: the Ball IQ card's faces, its rating dots
// and the colours card-comp-colours.test.js pins are as they were.
//
// ⚠️ SHARED COLOURS STAY SHARED ON PURPOSE. Euros wears International's colour
// and Managers wears Records', because the colour says which rating on the Ball
// IQ card the question builds. Keyed on lift()'s output, the swap follows the
// colour wherever it is used, so Euros is lifted with International for free.
//
// Its own file, not ballIqCard.js: that file is on Home's eager path and this
// is only ever needed once a quiz is under way.
import { catColour } from "./ballIqCard.js";
import { lift } from "./colourMath.js";

export const LIFTED_ACCENTS = {
  "#123a8f": "#2E63D6", // Champions League
  "#3f54a6": "#5B6FDB", // Ligue 1 (lift() of its face's #1B2447)
  "#046a38": "#14A05A", // Primeira Liga
  "#8a6d1b": "#C79A2B", // International, and Euros with it
};

/** The accent for a category, or null when it has no colour (Chaos's own rows). */
export function questionAccent(cat) {
  const c = catColour(cat);
  if (!c) return null;
  const l = lift(c);
  return LIFTED_ACCENTS[l.toLowerCase()] || l;
}

/** Inline style for the card: --qq-k is the edge, --qq-kr the wash's r,g,b. */
export function questionCardStyle(cat) {
  const k = questionAccent(cat);
  if (!k) return undefined;
  const n = parseInt(k.slice(1), 16);
  return { "--qq-k": k, "--qq-kr": `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` };
}
