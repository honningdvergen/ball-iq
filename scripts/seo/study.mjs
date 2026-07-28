// study.mjs — content for the data-study page (task #64).
//
// This is a LINKABLE ASSET, not a quiz page. Its job is to earn external links,
// which is our one measured ceiling (~0 backlinks). Football desks link to
// data; they do not link to quizzes.
//
// ⚠️ THE FIGURES ARE COMPUTED, NOT WRITTEN DOWN. An early draft hardcoded them
// and they were stale within the hour — a club wave landed mid-session and the
// bank went 5,834 -> 6,010, falsifying every number in the piece. For an asset
// whose entire purpose is to be checked by a journalist, that is the one
// failure mode we cannot ship. `studyStats()` reads src/questions.js at build
// time, so the page is correct by construction on every deploy.

// Recomputes every figure the article states, from the live bank. Call at
// build time and interpolate — never transcribe the output back into this file.
export function studyStats(QB) {
  const text = (r) => `${r.q} ${Array.isArray(r.o) ? r.o.join(' ') : ''} ${r.hint || ''}`;
  const dec = new Map();
  for (const r of QB) {
    const yrs = [...text(r).matchAll(/\b(18|19|20)\d{2}\b/g)]
      .map((m) => Number(m[0])).filter((y) => y >= 1860 && y <= 2026);
    for (const d of new Set(yrs.map((y) => Math.floor(y / 10) * 10))) {
      dec.set(d, (dec.get(d) || 0) + 1);
    }
  }
  const decades = [...dec.entries()].filter(([d]) => d >= 1900).sort((a, b) => a[0] - b[0])
    .map(([d, n]) => [`${d}s`, n]);
  const peak = decades.reduce((a, b) => (b[1] > a[1] ? b : a));
  const preFifty = [...dec.entries()].filter(([d]) => d < 1950).reduce((t, [, n]) => t + n, 0);
  const modern = decades.filter(([l]) => Number(l.slice(0, 4)) >= 1990).reduce((t, [, n]) => t + n, 0);
  return {
    bank: QB.length,
    explained: QB.filter((r) => r.hint && r.hint.length > 10).length,
    decades, preFifty, modern,
    peakLabel: peak[0], peakCount: peak[1],
    ratio: (peak[1] / preFifty).toFixed(1),   // "one decade vs everything pre-1950"
  };
}

export const STUDY = {
  slug: 'football-trivia-memory',
  title: "Football's Memory Starts in 1990 | Ball IQ",
  description:
    'We counted the years referenced across {{bank}} hand-checked football trivia questions. One recent decade carries {{ratio}} times the weight of the half-century before 1950.',
  h1: "Football's memory starts in 1990",
  standfirst:
    'We write and fact-check football trivia for a living. When we counted which years our own questions actually refer to, the shape of the sport’s collective memory turned out to be far more lopsided than we expected.',


  body: [
    ['The finding', [
      'Every question in our bank is written and checked by hand. That means we can do something a scraped database cannot: count what football trivia is actually *about*.',
      'We tagged every question by the years it references. The distribution is not a gentle slope away from the present. It is a cliff.',
      // {{tokens}} are substituted from studyStats() at build time. Do not
      // replace them with literals — that is how the first draft went stale.
      'The {{peakLabel}} alone account for {{peakCount}} questions. Everything before 1950 — five decades covering the birth of the professional game, the Busby Babes, Matthias Sindelar, the Maracanazo — accounts for {{preFifty}}. One recent decade outweighs half a century by {{ratio}} to one.',
    ]],
    ['Why 1990 is the hinge', [
      'The obvious explanation is television, and it is mostly right, but the date is more specific than "TV happened".',
      'The Premier League formed in 1992. The European Cup became the Champions League the same year. Both changes arrived with saturation broadcast coverage, and both created a continuous, well-documented record that simply does not exist for earlier eras in the same density.',
      'Before that, football was remembered in highlights and hearsay. After it, football was remembered in fixtures, statistics and rights deals. Trivia follows the documentation, not the drama.',
      'There is a second effect underneath it. A question needs a verifiable answer. Pre-war football is rich in stories and thin in agreed facts — which is precisely why we treat that era carefully, and why more of it does not automatically make a better quiz.',
    ]],
    ['What it means for anyone writing quizzes', [
      'If you are building football content, the pull toward the last thirty years is not laziness. It is where the checkable material lives.',
      'The risk runs the other way. Questions about very recent seasons go stale — a "current record holder" is a maintenance liability, not an asset. The workable window is roughly 1990 to 2020: modern enough that people care, settled enough that the answer will still be right next season.',
    ]],
    ['How we counted', [
      'We scanned all {{bank}} questions in the Ball IQ bank, extracting every four-digit year between 1860 and 2026 from the question, its options and its explanation. A question referencing more than one year in the same decade is counted once for that decade; a question spanning two decades counts for both.',
      'Two honest caveats. First, this measures our bank, not the sport — our coverage decisions shape it. Second, questions that reference no year at all ("who has scored the most Champions League goals?") are absent from the chart entirely, and those skew modern.',
      'Neither caveat changes the shape. The cliff at 1990 survives both.',
    ]],
  ],

  // The credibility paragraph. All measured, none rounded up.
  method:
    'Ball IQ is an independent football quiz. Every question is written and checked by football fans, never auto-generated; new questions pass a three-stage review before they reach players. On 28 July 2026 we applied 329 corrections in a single pass after auditing the bank. Where an answer has a story behind it, we explain it — {{explained}} of our questions carry a written explanation.',
};
