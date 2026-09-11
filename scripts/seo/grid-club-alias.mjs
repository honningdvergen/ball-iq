// Club PAGE name (clubs.mjs) -> career-dictionary name (mysteryCareers.json).
//
// WHY THIS FILE EXISTS RATHER THAN A NAME MATCH — the same reason club-alias.mjs
// exists, and the same failures. Our pages use the short name a fan says
// ("Wolves", "Napoli", "West Brom"); the career harvest uses the official one
// ("Wolverhampton Wanderers F.C.", "SSC Napoli", "West Bromwich Albion F.C.").
// 64 of 96 pages match on a normalised string. The other 32 do not, and every
// automatic way of closing that gap produces confident nonsense:
//
//   BIGGEST CANDIDATE  Wolves  -> "Wollongong Wolves FC"      a different club,
//                                 and Wolverhampton is not even a candidate
//                                 because the page name shares no word with it
//   SUBSTRING          Red Star Belgrade -> "Red Star F.C."   a different club
//                      Athletic Bilbao   -> "Wydad Athletic Club"  Morocco
//   NAIVE              Ajax    -> "Jong Ajax"                 the reserve side
//                      PSV     -> "Jong PSV"                  the reserve side
//                      Bayern  -> "FC Bayern Munich Women"    a different team
//
// So every entry below was resolved by hand against the candidate list and its
// squad size. ⚠️ ONLY PAGES WHOSE NAME DIFFERS GO HERE; anything that already
// matches on a normalised string must NOT be listed, or the two ways of
// resolving a club will drift.
export const GRID_CLUB_ALIAS = {
  // ⚠️ STUB SHADOWS — these three exist because an EXACT match is wrong here.
  // The harvest contains BOTH a one-to-three-player stub and the real club:
  // "Barcelona"(3) beside "FC Barcelona"(294), "Anderlecht"(1) beside
  // "R.S.C. Anderlecht"(108), "Beşiktaş"(1) beside "Beşiktaş J.K."(111).
  // A normalised exact match takes the stub every time, so Barcelona — one of
  // our biggest pages — resolved to three players. It showed up only as "no
  // grid"; with a lower floor it would have SHIPPED a grid built from a stub.
  // findStubShadows() below exists so the next one fails loudly instead.
  'Barcelona': 'FC Barcelona',
  'Anderlecht': 'R.S.C. Anderlecht',
  'Besiktas': 'Beşiktaş J.K. (Football)',

  'Bayern Munich': 'FC Bayern Munich',
  'Ajax': 'AFC Ajax',
  'Napoli': 'SSC Napoli',
  'Galatasaray': 'Galatasaray S.K.',
  'Benfica': 'S.L. Benfica',
  'Fenerbahçe': 'Fenerbahçe Istanbul',
  'Porto': 'FC Porto',
  'Roma': 'AS Roma',
  'Marseille': 'Olympique de Marseille',
  'Feyenoord': 'Feyenoord Rotterdam',
  'PSV': 'PSV Eindhoven',
  'Club Brugge': 'Club Brugge K.V.',
  'Red Star Belgrade': 'FK Crvena zvezda',
  'Dinamo Zagreb': 'GNK Dinamo Zagreb',
  'Basel': 'FC Basel',
  'West Ham': 'West Ham United F.C.',
  'Athletic Bilbao': 'Athletic Club',
  'Real Betis': 'Real Betis Balompié',
  'Fiorentina': 'ACF Fiorentina',
  'Lazio': 'SS Lazio',
  'Saint-Étienne': 'AS Saint-Étienne',
  'Brighton': 'Brighton & Hove Albion F.C.',
  'Bournemouth': 'AFC Bournemouth',
  'Wolves': 'Wolverhampton Wanderers F.C.',
  'Bayer Leverkusen': 'Bayer 04 Leverkusen',
  'Parma': 'Parma Calcio 1913',
  'River Plate': 'Club Atlético River Plate',
  'Flamengo': 'Clube de Regatas do Flamengo',
  'Palmeiras': 'Sociedade Esportiva Palmeiras',
  'Corinthians': 'S.C. Corinthians Paulista',
  'Hajduk Split': 'HNK Hajduk Split',
  'Atalanta': 'Atalanta BC',
  'West Brom': 'West Bromwich Albion F.C.',
};

const STRIP = /\s*(F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|Club de Fútbol|\(Football\))\s*$/ig;
export const normClub = (s) => String(s).replace(STRIP, '').trim().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The career-dictionary name for a club page, or null.
 * ⚠️ Returns null rather than guessing. A page with no grid is a page without a
 * puzzle; a page with the WRONG club's grid is a page full of wrong answers.
 */
export function careerNameFor(pageClub, dictionaryNames) {
  const alias = GRID_CLUB_ALIAS[pageClub];
  if (alias) return dictionaryNames.includes(alias) ? alias : null;
  const want = normClub(pageClub);
  return dictionaryNames.find((n) => normClub(n) === want) || null;
}

/**
 * Every resolution where a BIGGER dictionary entry also carries the page's name.
 *
 * ⚠️ THIS IS A GATE, NOT A REPORT. It is the general form of the Barcelona bug:
 * whenever the harvest gains a stub that normalises to a club we already map,
 * an exact match silently prefers the stub. Callers should fail on a non-empty
 * result rather than log it.
 */
export function findStubShadows(resolutions, sizeOf, dictionaryNames) {
  const out = [];
  for (const [pageClub, resolved] of Object.entries(resolutions)) {
    if (!resolved) continue;
    const want = normClub(resolved);
    const bigger = dictionaryNames.filter((n) =>
      n !== resolved && normClub(n).includes(want) && sizeOf(n) > sizeOf(resolved) * 3);
    if (bigger.length) out.push({ pageClub, resolved, size: sizeOf(resolved),
      bigger: bigger.map((n) => `${n} (${sizeOf(n)})`) });
  }
  return out;
}
