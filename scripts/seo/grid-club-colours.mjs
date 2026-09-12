// Club colours for grid headers that CLUB_PACK_COLOURS does not cover.
//
// WHY A SECOND MAP RATHER THAN ADDING TO THE FIRST. CLUB_PACK_COLOURS is
// GENERATED from CLUB_PACKS in src/App.jsx — it is the colour of a club we ship
// a quiz pack for, and it drives the app, the Trail ladder and the card faces.
// These 28 clubs have no pack and should not gain one; they appear only because
// the career harvest puts them in somebody's grid. So they get their own map,
// consulted only by the grid, and the generated file stays generated.
//
// HOW THESE WERE ESTABLISHED. Two independent research passes, each required to
// cite a page it actually fetched — the club's own stylesheet, its official
// crest artwork, or a declared colour field on Wikipedia. Recall was not
// accepted from either. They agreed on the colour for 25 of 28.
//
// ⚠️ THE THREE THEY DISAGREED ON WERE ALL THE SAME ARGUMENT, and it is worth
// writing down because it will come up again: VfB Stuttgart, 1. FC Köln and
// Borussia Mönchengladbach all PLAY in white while their identity colour is
// red, red and green. One pass answered "what do they wear", the other "what
// colour are they".
//
// This repo already settled that question, so the tie is broken by precedent
// and not by taste. Of 109 entries in CLUB_PACK_COLOURS exactly TWO are white
// — Real Madrid and Fulham, the two clubs whose identity IS white. Every other
// white-shirted club carries its second colour: Leeds #1D428A, Tottenham
// #132257, PSV #ED1C24, Corinthians #111111, Santos #0B0B0B, Swansea #121212,
// Derby #1B1B1B. So white shirts take the identity colour here too.
//
// That same rule then applied to three MORE clubs where both passes had said
// white — São Paulo, Bolton and Real Zaragoza. Following it leaves zero new
// white entries, which also protects the feature from itself: six identical
// white edges among 28 would tell a reader nothing, and white is already the
// page's own text colour, so it reads as "no colour on file" rather than as a
// club.
export const GRID_CLUB_COLOURS = {
  // ── both passes agreed on colour AND hex ──────────────────────────────────
  'Hertha BSC': '#0D59A1',              // brand blue, herthabsc.com stylesheet
  'SV Werder Bremen': '#1D9053',        // crest green — "Lebenslang Grün-Weiß"
  'Cruzeiro E.C.': '#2F529E',           // crest blue; single-colour club
  'Grêmio FBPA': '#0D80BF',             // statute names "azul celeste" first
  'Reading': '#004494',                 // crest blue; blue/white hoops
  'Bologna F.C. 1909': '#C52833',       // bolognafc.it brand red; "rossoblù"
  'A.C. Perugia Calcio': '#E3001A',     // acperugiacalcio.com brand red
  'Club Athletico Paranaense': '#DB132F', // athletico.com.br theme-color
  'Wigan Athletic': '#1D59AF',          // crest blue
  'Genoa CFC': '#AE1919',               // crest red; red/blue halves
  '1. FC Kaiserslautern': '#E30511',    // crest red — "die roten Teufel"
  'Empoli': '#1A5CA8',                  // it.wiki declared "Azzurro" swatch
  'Guarani Futebol Clube': '#07614A',   // guaranifc.com.br --e-global-color-primary
  'FC Girondins de Bordeaux': '#00205B', // girondins.com navy
  'Stade Rennais': '#CF0C12',           // staderennais.com theme-color
  'E.C. Vitória': '#E10600',            // logo SVG red; "Rubro-Negro"
  'CR Vasco da Gama': '#000000',        // black shirt with the white sash

  // ── same colour, different hex: the DECLARED value beats a sampled one, ────
  //    because a number someone published can be checked again later and a
  //    number read off artwork cannot.
  'Cagliari Calcio': '#DB150C',         // it.wiki declared; crest sample was #B01028
  'Villarreal': '#FFE715',              // villarrealcf.es; crest sample was #FFE667
  'U.C. Sampdoria': '#0152BC',          // it.wiki declared; the site's #002160 is
                                        // navy chrome, and the shirt is mid-blue
  'OGC Nice': '#ED1C24',                // crest; the site's #ED1C23 is one digit off
  'Figueirense Futebol Clube': '#231F20', // crest rich black, not flat #000000,
                                        // which two entries already use

  // ── the white-shirt rule, applied ─────────────────────────────────────────
  'VfB Stuttgart': '#D30029',           // "Die Roten"; white shirt, red chest ring
  '1. FC Köln': '#E20613',              // Vereinsfarben rot-weiss; crest red
  'Borussia Mönchengladbach': '#7AB929', // black-white-green; green is the one
                                        // that is not already six other clubs
  'São Paulo': '#CB0017',               // crest red; the other two São Paulo-state
                                        // giants are already near-black here
  'Bolton Wanderers': '#263C7E',        // crest navy — "white with navy and red trim"
  'Real Zaragoza': '#213E96',           // realzaragoza.com blue; white shirt, blue shorts
};
