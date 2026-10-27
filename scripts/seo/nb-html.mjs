// nb-html.mjs: a question's text as HTML, with scores and seasons kept on one
// line by STYLE, never by special characters.
//
// ⚠️ WHY NOT noBreakScores (src/lib/noBreakScore.js) ON STATIC PAGES. From 16 Oct
// 2026 the static pages drew "6-1" as 6‑1 (U+2011) and "7–1" with U+2060 WORD
// JOINERs around the dash: 8,794 and 1,818 of them across 406 of 471 pages,
// none before. Four days later Google traffic fell ~93% site-wide (26 Oct
// diagnosis). Invisible zero-width characters inside indexed text are a classic
// hidden-text pattern, and a non-breaking hyphen makes "1988-89" a different
// string from what people search. Static pages are what Google reads, so they
// keep the plain characters and wrap the run in a nowrap span instead. The app's
// question card (React) may keep noBreakScores: it is not what Google indexes.
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// A digit run joined by hyphens or en dashes: 6-1, 4-4-2, 1988-89, 7–1.
const SCORE_RUN = /\d+(?:[-–]\d+)+/g;

export function nbHtml(text) {
  return esc(text).replace(SCORE_RUN, (m) => `<span style="white-space:nowrap">${m}</span>`);
}
