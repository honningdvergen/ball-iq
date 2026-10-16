/**
 * THE FAME BAR for a Mystery Player answer — one definition, used by the
 * schedule generator (gen-mystery-schedule.mjs), the build audit
 * (audit-mystery-schedule.mjs) and the unit test that holds future days to it.
 *
 * WHY (14 Oct 2026). A play-tester's answer that day was Joachim Löw as a
 * player: fame 80, higher than Pirlo's, because the fame score measures
 * Wikipedia coverage and Löw's comes from managing Germany. As a player he was
 * a second-division journeyman nobody can name a club of. Fun was rated 3/10,
 * the worst in the app; the owner's ruling was famous answers only.
 *
 * Fame alone cannot draw that line (it is how Löw, Rafa Benítez and Niels Bohr
 * got in), so an answer must clear ALL of these:
 *
 *   1. fame >= FAME_MIN. Measured 14 Oct 2026 with every other rule applied
 *      and the 73 days already served taken out: 235 players clear 60, 334
 *      clear 55, 436 clear 52. The 327 days still to come need 327 distinct
 *      answers, so 55 is the highest bar that fills them; the generator puts
 *      the most famous first, so the thinner end of the list sits in 2027.
 *   2. A PLAYING career a fan knows: ELITE_YEARS or more at one of the clubs
 *      below (the clubs a casual fan watches), unless fame >= STAR, the
 *      handful so famous that their club does not matter (Pelé, Yashin).
 *      This is the test Löw fails, and what keeps out the career J-League
 *      players whose Japanese Wikipedia coverage inflates the score.
 *   3. Known first as a footballer: not on the manager or not-a-footballer
 *      lists, and not on the rationed coaching list either.
 *   4. A career record we can SHOW. The reveal now prints the career and the
 *      second clue names a club, so the careers file has to be whole for him:
 *      every senior spell dated, a first senior club by 20, no hole longer
 *      than MAX_GAP years, a record that runs to 28 or is still running,
 *      and none that runs past 42 (Maldini: playing and directing merged).
 *      Measured, this is what catches Henry (Arsenal 1999-2007 missing),
 *      Buffon (Juventus missing), Kaká (Milan missing), Torres and Götze
 *      (Atlético and Dortmund, their first clubs, missing), Piqué (nothing
 *      after 2008) and Scholes (one season on record). The careers file has
 *      these holes for dozens of the biggest names; filling them is what
 *      would let them back in.
 *   5. A position the first clue can print (hintPosition; see mysteryRoles).
 *   6. A name that can be printed and typed: none damaged upstream, and no
 *      namesake in the pool nearly as famous (pass `pool` to check this).
 *
 * The rationed list (people now better known as coaches) used to allow 5% of
 * days. A famous-answers-only schedule takes none of them; Hansi Flick was
 * added to it on 14 Oct 2026 when the bar first produced him.
 */
import { careerOf, clubsOf, mainClub } from '../src/lib/mysteryCareer.js';
import { hintPosition } from '../src/lib/mysteryPlayer.js';

/** Index 73 = Mystery Player No. 74, 15 Oct 2026: the first famous-only day.
 *  Days before it are public record and keep whatever they served. */
export const FIRST_FAMOUS_DAY = 73;

export const FAME_MIN = 55;
export const STAR = 95;
export const ELITE_YEARS = 3;
export const MAX_GAP = 2;
export const FIRST_CLUB_BY = 20;
export const LAST_SEEN_BY = 28;
// 45, not 42 (16 Oct 2026): restoring second spells gave Rivaldo his Mogi
// Mirim return (played to 43) and Buffon his Parma one (to 45), both true.
// Maldini's merged director years still read 51.
export const PLAYED_UNTIL_MAX = 45;

/* Found by reading the careers of the first answers the bar produced. The
   rules above cannot see a record that is WRONG rather than missing. */
const KNOWN_BAD = {
  Q192671: 'careers file has him at Universidad de Chile 2007-11, his Leverkusen years',
  Q151838: 'position contested: the pool says centre-back, he is known as a midfielder',
};

/** Clubs a casual fan follows, in clubName() spelling. */
export const ELITE_CLUBS = new Set([
  'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Valencia', 'Sevilla',
  'Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Tottenham',
  'Newcastle United', 'Everton', 'Aston Villa', 'Leeds United',
  'Juventus', 'AC Milan', 'Inter Milan', 'Roma', 'Napoli', 'Lazio', 'Fiorentina', 'Parma',
  'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen',
  'Paris Saint-Germain', 'Marseille', 'Lyon', 'Monaco',
  'Ajax', 'PSV', 'Benfica', 'Porto', 'Sporting CP', 'Celtic', 'Rangers',
  'Santos', 'Boca Juniors', 'River Plate', 'Flamengo',
]);

export function eliteYears(p, careers) {
  let y = 0;
  for (const [club, { years }] of clubsOf(p, careers)) if (ELITE_CLUBS.has(club)) y += years;
  return y;
}

/**
 * @returns {{ ok: boolean, why: string[] }} `why` lists every rule failed.
 */
const PARTICLES = new Set(['van', 'von', 'de', 'da', 'das', 'do', 'dos', 'di', 'del', 'della', 'der', 'den', 'ten', 'ter', 'la', 'le', 'y', 'e', 'bin', 'al', 'el']);
const NAMES = new WeakMap();
function namesakes(pool) {
  let m = NAMES.get(pool);
  if (!m) {
    m = new Map();
    for (const q of pool) m.set(q.name, [...(m.get(q.name) || []), q]);
    NAMES.set(pool, m);
  }
  return m;
}

export function answerBar(p, { careers, roles, exclusions, pool = null }) {
  const why = [];
  if (!p) return { ok: false, why: ['not in the pool'] };
  const banned = new Set([...(exclusions.managers || []), ...(exclusions.notFootballers || []), ...(exclusions.rationed || [])]);
  if (!(p.fame >= FAME_MIN)) why.push(`fame ${p.fame} < ${FAME_MIN}`);
  if (banned.has(p.name)) why.push('known first for something other than playing');
  if (!(p.fame >= STAR) && eliteYears(p, careers) < ELITE_YEARS) why.push(`under ${ELITE_YEARS} years at a club a casual fan follows`);
  const career = careerOf(p, careers);
  if (!career.length) why.push('no senior career on record');
  else {
    if (career.some((s) => s.from == null)) why.push('an undated spell');
    const first = career.find((s) => s.from != null);
    if (first && p.born && first.from - p.born > FIRST_CLUB_BY) why.push(`first senior club at ${first.from - p.born}`);
    let reach = null, gap = 0;
    for (const s of career) {
      if (s.from == null) continue;
      if (reach != null) gap = Math.max(gap, s.from - reach);
      reach = Math.max(reach ?? s.from, s.to ?? 2026);
    }
    if (gap > MAX_GAP) why.push(`a ${gap}-year hole in the career record`);
    // A record that stops short is a hole at the END: Piqué's reads Manchester
    // United 2004-08 and nothing after, so his fourteen Barcelona years would
    // have been missing from the reveal.
    // And one that runs too LONG: Maldini's AC Milan spell reads 1985-2019,
    // his playing years and his years as a director run together.
    const last = Math.max(...career.map((s) => s.to ?? 0));
    if (p.born && last - p.born > PLAYED_UNTIL_MAX) why.push(`a spell that runs to ${last - p.born}`);
    const running = career.some((s) => s.to == null);
    if (!running && p.born && reach != null && reach - p.born < LAST_SEEN_BY) why.push(`the career record stops at ${reach - p.born}`);
  }
  if (Object.hasOwn(KNOWN_BAD, p.id)) why.push(KNOWN_BAD[p.id]);
  // A name that looks damaged upstream: "Takuma ano" (Asano), "Rafael Márquez
  // El piojo". The reveal would print it.
  const odd = String(p.name).split(/\s+/).filter((w) => /^\p{Ll}/u.test(w) && !PARTICLES.has(w));
  if (odd.length) why.push(`a damaged name ("${odd.join(' ')}")`);
  // A namesake almost as famous makes the answer ambiguous: the 1994 Brazil
  // right-back Jorginho is not the Jorginho a fan types.
  if (pool) {
    const twin = namesakes(pool).get(p.name).find((q) => q.id !== p.id && q.fame >= p.fame * 0.7);
    if (twin) why.push(`shares his name with another player born ${twin.born}`);
  }
  if (!hintPosition(p, roles)) why.push('no position the clue can print');
  if (!mainClub(p, careers)) why.push('no club for the club clue');
  return { ok: why.length === 0, why };
}
