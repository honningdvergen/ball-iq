// Shared leak classification for the question bank.
//
// WHY THIS IS A MODULE AND NOT INLINE. Two callers need the identical rule:
// scripts/forge-curate.mjs (per wave, before questions ship) and
// scripts/audit-leaks.mjs (the whole bank, after the fact). If they drift, the
// wave gate and the audit disagree about what a defect is, and the audit's
// number stops meaning anything.
//
// ⚠️ THE HEADLINE "17% OF PACKS LEAK" NUMBER WAS NEVER CLASSIFIED.
// A raw count of "this answer string appears in that stem" is close to useless
// on a club pack, because you cannot write about Santos without writing "Copa
// Libertadores", or about Liverpool without writing "Liverpool". Measured on
// Wave N: 12 raw leaks in the Santos pack, of which 9 were competition or
// big-club names that give a player nothing, and 3 were real.
//
// So the rule is a SPLIT, not a count:
//
//   STRONG — the answer is a specific, guessable fact and its appearance in
//            another stem hands it over: a ground, a person, a year, a score,
//            a manager. These must be dropped or reworded.
//   WEAK   — the answer is a name the topic cannot avoid: the club the pack is
//            about, a competition it obviously played in, an opponent named in
//            half the pack. Reporting these as defects trains people to ignore
//            the report, which is worse than not running it.

export const norm = (s) => String(s ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Competitions and honours: unavoidable vocabulary on any club page.
const COMPETITIONS = /\b(copa libertadores|libertadores|champions league|european cup|europa league|uefa cup|cup winners cup|club world cup|intercontinental cup|premier league|la liga|serie a|bundesliga|ligue 1|eredivisie|primeira liga|super lig|copa del rey|fa cup|efl cup|league cup|dfb pokal|coppa italia|coupe de france|brasileirao|campeonato paulista|recopa|supercopa|world cup|euros|european championship|ballon d or)\b/;

// A leak is WEAK when the leaked answer is:
//   a) the pack's own club, or the club name appears in the answer
//   b) a competition or honour
//   c) a very short string (initials, numbers under 4 chars) — too generic
// Everything else is STRONG until proven otherwise. Defaulting to STRONG is
// deliberate: a false strong costs one reworded stem, a false weak ships a
// question that answers another one.
export function classifyLeak({ answer, clubName }) {
  const a = norm(answer);
  if (a.length <= 4) return 'weak';
  if (COMPETITIONS.test(a)) return 'weak';
  const club = norm(clubName || '');
  if (club && (a.includes(club) || club.includes(a))) return 'weak';
  return 'strong';
}

/**
 * Find answers that appear in ANOTHER question's stem or hint, within a set.
 *
 * ⚠️ HINTS ARE SCANNED TOO, AND THEY WERE NOT BEFORE.
 * forge-curate checked stems only, so an answer sitting in another question's
 * EXPLANATION went unexamined through every wave A-N. Wave N found 27 of them
 * in two clubs. A hint is player-visible text that reveals an answer; the fact
 * that it appears after you have answered makes it weaker than a stem leak, not
 * harmless — you still read it before the other question comes up.
 */
// ⚠️ FREQUENCY IS THE REAL TEST, and the first version of this file missed it.
// Enumerating "competitions + the pack's own club" as weak was far too narrow.
// Run over the bank it reported 27.6% of questions as defective — worse than
// the unclassified figure it was meant to correct — and the top offenders were:
//
//   "Glasgow"             answer to "which city are Celtic based in?"
//   "Rangers"             their rival, named in half the pack
//   "Green and white hoops"  their own kit
//
// None of those is a leak. They are the pack's subject matter, and no amount of
// listing cities and rivals by hand would have caught the next one.
//
// A fact mentioned across a third of a pack is not a secret. So: if an answer
// appears in MORE THAN TWO other questions, it is topic vocabulary and the
// leak is weak, whatever the string is. A genuine leak — a ground, a scorer, a
// year — shows up once or twice, because only one or two questions have any
// reason to mention it.
const VOCAB_THRESHOLD = 2;

export function findLeaks(questions, { clubName } = {}) {
  const out = [];
  // Pre-count how many OTHER questions mention each answer at all.
  const mentions = questions.map((x) => {
    const answer = Array.isArray(x.o) ? x.o[x.a] : undefined;
    if (!answer) return 0;
    const a = norm(answer);
    if (a.length <= 4) return 0;
    return questions.reduce((n, y, j) => {
      if (questions[j] === x) return n;
      return n + ((norm(y.q).includes(a) || (y.hint && norm(y.hint).includes(a))) ? 1 : 0);
    }, 0);
  });

  questions.forEach((x, i) => {
    const answer = Array.isArray(x.o) ? x.o[x.a] : undefined;
    if (!answer) return;
    const a = norm(answer);
    if (a.length <= 4) return;
    const severity = mentions[i] > VOCAB_THRESHOLD ? 'weak' : classifyLeak({ answer, clubName });
    questions.forEach((y, j) => {
      if (i === j) return;
      if (norm(y.q).includes(a)) out.push({ answerOf: i, at: j, answer, where: 'stem', severity });
      else if (y.hint && norm(y.hint).includes(a)) {
        // A hint leak is one notch softer than the same leak in a stem.
        out.push({ answerOf: i, at: j, answer, where: 'hint', severity: severity === 'strong' ? 'strong' : 'weak' });
      }
    });
  });
  return out;
}
