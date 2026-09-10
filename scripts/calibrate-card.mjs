// Ball IQ card calibration — turns a measured population into the rating scale.
//
// WHY THIS EXISTS. Until 2026-09-09 the card mapped accuracy to 40-99 with a
// straight line (40 + 59·acc). Against the real population — 104 rated
// accounts — that put the MEDIAN player at 74 and a third of everyone in gold,
// with 80% of players squeezed between 64 and 82. The number could not tell
// good from great, which is the complaint "it doesn't reflect my level" seen
// from the other side. A rating only means something against other players,
// so the scale is anchored to measured percentiles and regenerated from data,
// never typed by hand.
//
// HOW TO REFRESH (quarterly, or when the rated population doubles):
//   1. Run the SQL below against prod (read-only) and save the percentiles as
//      scripts/data/card-calibration-<date>.json (see the 2026-09-09 file).
//   2. node scripts/calibrate-card.mjs scripts/data/card-calibration-<date>.json
//   3. Commit both. tests/unit/card-calibration.test.js pins the invariants.
//
// THE SQL (weighted c/a per account, exactly what computeCard consumes):
//   with p as (select id, stats->'catStats' cs from public.profiles where stats ? 'catStats'),
//   agg as (select id, sum((v->>'c')::float) c, sum((v->>'a')::float) a
//           from p, jsonb_each(cs) e(k,v) group by id),
//   lvl as (select c/a acc from agg where a >= 10)
//   select count(*) n,
//     percentile_cont(0.10) within group (order by acc) p10,
//     percentile_cont(0.25) within group (order by acc) p25,
//     percentile_cont(0.50) within group (order by acc) p50,
//     percentile_cont(0.75) within group (order by acc) p75,
//     percentile_cont(0.90) within group (order by acc) p90,
//     percentile_cont(0.05) within group (order by acc) p5,
//     percentile_cont(0.95) within group (order by acc) p95
//   from lvl;
import { readFileSync, writeFileSync } from 'fs';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/calibrate-card.mjs <calibration.json>'); process.exit(1); }
const cal = JSON.parse(readFileSync(src, 'utf8'));
const p = cal.percentiles;
for (const k of ['5', '10', '25', '50', '75', '90', '95']) {
  if (typeof p[k] !== 'number' || p[k] <= 0 || p[k] >= 1) { console.error(`[calibrate-card] percentile ${k} missing or out of (0,1)`); process.exit(1); }
}
const NEEDED = ['5','10','25','50','75','90','95'];
for (const k of NEEDED) {
  if (typeof p[k] !== 'number') {
    console.error(`[calibrate-card] missing percentile p${k} — the anchor curve needs ${NEEDED.join(', ')}`); process.exit(1);
  }
}
if (!NEEDED.every((k, i) => i === 0 || p[NEEDED[i - 1]] < p[k])) {
  console.error('[calibrate-card] percentiles are not strictly increasing'); process.exit(1);
}
if (!(cal.n >= 50)) { console.error(`[calibrate-card] n=${cal.n} — too few rated accounts to anchor a scale`); process.exit(1); }

// The scale. Rating targets per percentile — THIS is the product decision.
//
// ⚠️ THESE ARE NOW APPLIED, NOT DECORATIVE. Until 2026-09-11 the anchors were
// generated, written into the calibration file, documented as "ratingFromScore
// interpolates between them" — and never read by anything. The rating was a
// straight `mean * 100`, so the SHAPE of the population landed wherever the
// multipliers happened to put it: half of all cards below 70 and the weakest
// reading 44. Alex: "i would like to push the median of overall card ratings
// higher up, and most cards between 70 to 90."
//
//   p5  → 60   nobody reads a number that looks like failure
//   p10 → 67
//   p25 → 72
//   p50 → 77   the median player is a comfortable silver
//   p75 → 83
//   p90 → 88
//   p95 → 93
//   1.0 → 99   perfect on hard, nobody
//
// The measured spread is WIDE — p5 30% accuracy, p95 80% — so a linear map
// stretches it across the whole 40-99 scale. This compresses it: ~79% of cards
// land in 70-90 and the gap between a 45%- and a 65%-accurate player is 13
// points rather than 26. That is the trade, made deliberately: still clearly
// separated, far less punishing at the bottom.
//
// ⚠️ THE COST IS VERIFIABILITY, AND IT WAS A REAL PROPERTY WE GAVE UP. The
// rating used to BE your difficulty-weighted accuracy x 100, checkable against
// the Accuracy tile sitting beside it on the same card. It is not any more.
// The multipliers still decide where you sit relative to everyone else; they no
// longer produce the printed number directly. Any copy that says otherwise is
// now wrong — see the recalibration note in ProfileScreen.
//
// Tiers move with it: bronze <70 / silver 70-84 / gold 85+, so gold is roughly
// the top 15%. Leaving gold at 75 would have made a median player gold.
const anchors = [
  [0, 52],
  [p['5'], 60], [p['10'], 67], [p['25'], 72], [p['50'], 77],
  [p['75'], 83], [p['90'], 88], [p['95'], 93],
  [1, 99],
];

// ── DIFFICULTY MULTIPLIERS (Alex, 2026-09-09) ────────────────────────────────
// "61% accuracy on easy questions equals 61; 61% at medium should be 10% more
// rewarding, hard 20% more." A correct answer is worth MULT[diff]; a miss is
// worth 0; the rating is 100 × the mean, shrunk toward the population baseline.
// It replaced a percentile-calibrated "score above expectation" model the same
// day — that one was statistically right and impossible to explain on a card.
// A player can verify this one with a calculator.
// ⚠️ 1.15 / 1.25 since 2026-09-10 (Alex): "the 10 and 20% number i am not even
// sure is right, maybe it should be 15% and 25%". Every one of the 7,078 bank
// questions carries a difficulty grade — zero ungraded — so the weight is
// applied from the ANSWER's own difficulty, not guessed.
// ⚠️ THE PREMIUM ALSO SETS WHERE THE WHOLE POPULATION SITS, and that is the
// reason it is 1.25/1.50 rather than something milder. Every rating is
// 100 x (s + BASELINE*W)/(n + W) and BASELINE is itself p50 x AVG_MULT, so
// raising these scales the ENTIRE scale by one factor: nobody's ranking moves,
// only the level everyone reads.
//
// Measured on all 112 rated cards at 1.15/1.25: median 64, best card in the
// game 90, gold (75+) reached by 13%. Three things were wrong with that.
// The top NINE POINTS OF THE SCALE WERE UNREACHABLE — a ceiling no player can
// touch reads as harsh grading, not as headroom. Alex had specified gold to
// mean the top quarter and it had drifted to an eighth. And a card needs 10
// answers to rate at all, so those 112 are the COMMITTED CORE: every casual
// player is invisible in that measurement and lands below it, which means the
// real median is lower still than the number being calibrated against.
//
// At 1.25/1.50: median 70, p90 84, gold 33%, bronze 30% -> 14%. That is a
// FIFA-shaped distribution, which is the model the card already invokes — in
// FUT gold is 75+ and gold is COMMON, the tier any decent player wears, not a
// rare prize. Alex, 2026-09-10: "75 and up should be gold just to make it
// easy, it also follows the fifa logic which people are already familiar with."
//
// ⚠️ A HARD QUESTION AT 1.50 IS A CLAIM ABOUT DIFFICULTY, NOT A FUDGE FACTOR.
// The alternative way to move the population — a presentation curve mapping
// percentiles onto a nicer range — buys the same distribution by making the
// printed number mean nothing. This keeps it exactly what it says: your
// difficulty-weighted accuracy, times 100, checkable against your own answers.
// If the premium ever stops being defensible as difficulty, move the TIERS
// instead; do not stretch these further.
//
// Known and accepted: at 1.50 the strongest card in the game lands ON 99. The
// ceiling is reachable on purpose. Re-measure quarterly (that is what this
// script is for) and expect the top to need separating as the game grows.
const MULT = { easy: 1.0, medium: 1.25, hard: 1.50 };
// Bank mix, re-counted 2026-09-10 across all 7,078 questions: easy 24.9% /
// medium 48.1% / hard 27.0%. This is the multiplier of an average question and
// the ONLY weight a record without per-answer difficulty can be given.
const AVG_MULT = +(0.249 * MULT.easy + 0.481 * MULT.medium + 0.270 * MULT.hard).toFixed(4);
// Where a card with no evidence starts: the measured median player's rating.
// ⚠️ RE-MEASURED FROM REAL ANSWERS 2026-09-10. The previous median (0.58) came
// from the DECAYED c/a totals, which overstated both level and spread: against
// 4,180 actual per-question records the median player is 0.5306, p25 0.486 and
// p90 0.660, not 0.51-0.72. Calibrating a scale on a quantity nobody can verify
// is how the card ended up disagreeing with the answer log.
const BASELINE = +(p['50'] * AVG_MULT).toFixed(4);

const body = `// GENERATED by scripts/calibrate-card.mjs — do not edit.
// Measured ${cal.measured} from ${cal.n} rated accounts (${cal.source}).
// Refresh: see the header of scripts/calibrate-card.mjs.
//
// ANCHORS: [weighted accuracy, rating]. ratingFromAccuracy() interpolates
// linearly between them. MEDIAN is the population's median accuracy and is the
// prior every new player's overall starts from (weight PRIOR_WEIGHT answers).
export const CALIBRATION = {
  measured: ${JSON.stringify(cal.measured)},
  n: ${cal.n},
  median: ${p['50']},
  anchors: ${JSON.stringify(anchors)},
  // The model (Alex, 2026-09-09): rating = 100 × mean(correct ? MULT[diff] : 0),
  // shrunk toward BASELINE. The anchors above are the measured population in
  // plain accuracy, kept for reference and for the calibration tests.
  mult: ${JSON.stringify(MULT)},
  avgMult: ${AVG_MULT},
  baseline: ${BASELINE},
};
`;
const OUT = 'src/data/cardCalibration.js';
writeFileSync(OUT, body);
console.log(`[calibrate-card] wrote ${OUT}: n=${cal.n}, median acc=${p['50']} → baseline ${BASELINE} (${Math.round(BASELINE * 100)}), avgMult=${AVG_MULT}`);
