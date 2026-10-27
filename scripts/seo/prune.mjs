// prune.mjs — pages kept live and linked for people, but told to stay out of
// Google (noindex, follow) and left out of the sitemap.
//
// ⚠️ WHY (26 Oct 2026). On 20 Oct Google traffic fell from ~130 clicks a day to
// ~10, site-wide, overnight: brand searches survived, and pages that still show
// keep their old position (/quiz/arsenal/ 6.6 before, 7-8 after) but are shown
// almost never. That is a site-level quality filter, not broken pages. The
// burst before it: on 15-16 Oct ~150 templated pages reached Google in a day
// (109 /questions/ pages re-freed, ~30 new club pages, 20 Top 10 lists). The
// /questions/ half was undone on 21 Oct (b51264f0). This is the other half:
// fewer, better pages.
//
// The rule, read from Search Console for 20 Jul to 19 Oct 2026 (three months
// before the drop), for every sitemap URL:
//   1. club pages published 16 Oct (waves 1-4) and the 21 Oct calendar
//      editions: no history at all, and they ARE the burst. Re-release a few a
//      week once traffic is back, best first.
//   2. translated pages with at most 1 click in three months: machine
//      translated, and the 20 Oct review found English left in and calques.
//   3. English pages with 0 clicks and under 30 impressions in three months.
// Pages with real demand stay, even at 0-1 clicks (Benfica 331 impressions,
// Germany 388, the champions lists 1,000+): those are ranking problems, not
// dead weight.
//
// To bring a page back: delete its line. Google re-indexes it on the next crawl.
export const PRUNED_ON = '2026-10-26';

export const PRUNED = new Set([
  // 1. the 16 Oct club waves and the 21 Oct calendar editions
  '/quiz/villarreal/', '/quiz/werder-bremen/', '/quiz/vfb-stuttgart/', '/quiz/borussia-monchengladbach/',
  '/quiz/aberdeen/', '/quiz/bolton-wanderers/', '/quiz/charlton-athletic/', '/quiz/bristol-city/',
  '/quiz/lincoln-city/', '/quiz/hearts/', '/quiz/hibernian/', '/quiz/bologna/', '/quiz/genoa/',
  '/quiz/lille/', '/quiz/rc-lens/', '/quiz/fc-koln/', '/quiz/espanyol/', '/quiz/rosenborg/',
  '/quiz/bodo-glimt/', '/quiz/celta-vigo/', '/quiz/al-ittihad/', '/quiz/la-galaxy/',
  '/quiz/fc-copenhagen/', '/quiz/newells-old-boys/', '/quiz/braga/', '/quiz/union-berlin/',
  '/quiz/sc-freiburg/', '/quiz/ogc-nice/', '/quiz/rennes/',
  '/quiz/el-clasico-quiz/', '/quiz/ballon-dor-quiz/',

  // 2. translated pages, at most 1 click in three months
  '/es/quiz/real-sociedad/', '/es/quiz/cruz-azul/', '/es/quiz/tigres-uanl/',
  '/pt/quiz/flamengo/', '/pt/quiz/corinthians/', '/pt/quiz/sao-paulo/', '/pt/quiz/internacional/',
  '/pt/quiz/vasco-da-gama/', '/pt/quiz/botafogo/',
  '/tr/quiz/fenerbahce/', '/tr/quiz/trabzonspor/',
  '/id/quiz/arsenal/',
  '/it/quiz/lazio/', '/it/quiz/fiorentina/', '/it/quiz/atalanta/',
  '/de/quiz/bayern-munich/', '/de/quiz/rb-leipzig/',
  '/fr/quiz/psg/', '/fr/quiz/marseille/', '/fr/quiz/monaco/',

  // 3. English pages, 0 clicks and under 30 impressions in three months
  '/quiz/vasco-da-gama/', '/quiz/atletico-mineiro/', '/quiz/fluminense/', '/quiz/botafogo/',
  '/quiz/pumas-unam/', '/quiz/monterrey/', '/quiz/al-ahly/', '/quiz/olympiacos/',
  '/quiz/uruguay/', '/quiz/henry/', '/quiz/musiala/', '/quiz/legends/',
  '/quiz/football-trivia-questions/', '/study/football-trivia-memory/',
]);

/** Mark one built page noindex: replace its robots meta, or add one. */
export function noindexHtml(html) {
  const tag = '<meta name="robots" content="noindex, follow" />';
  return /<meta name="robots"[^>]*>/.test(html)
    ? html.replace(/<meta name="robots"[^>]*>/, tag)
    : html.replace('</head>', `${tag}\n</head>`);
}
