// Per-club result ladders for the club quiz pages.
//
// Six rungs, matching the six percentage bands in the quiz component
// (0 / 25 / 45 / 65 / 85 / 100%). Rung 0 is for someone who got almost nothing
// and must stay warm rather than mocking — people share these screenshots.
//
// RULES, learned the hard way:
//  • Only vocabulary a fan of THAT club would actually use. A generic ladder is
//    better than a wrong one — "Gers" is right for Rangers, inventing an
//    equivalent for a club you know less well is how you end up on r/soccer.
//  • Grounds, terraces, eras and unambiguous club legends only. No current
//    players (they transfer), no managers (they get sacked), no honours counts
//    (they change every May).
//  • Keep each rung under ~18 characters or it wraps in the result pill.
//
// Clubs without an entry fall back to DEFAULT_TIERS, which is deliberately
// club-neutral and reads fine anywhere. That is a complete, shippable state —
// not a stub. Fill more in as they are checked, one wave at a time.

export const DEFAULT_TIERS = [
  'Day Tripper',
  'Casual Fan',
  'Season Ticket',
  'Home & Away',
  'Club Historian',
  'Club Legend',
];

export const CLUB_TIERS = {
  // ── England ──────────────────────────────────────────────────────────────
  liverpool:            ['Day Tripper', 'New On The Kop', 'Kop Regular', 'Boot Room', 'Anfield Historian', 'Istanbul Legend'],
  arsenal:              ['Day Tripper', 'New Gooner', 'Highbury Regular', 'North Bank', 'Gunners Historian', 'Invincible'],
  'manchester-united':  ['Day Tripper', 'New Red', 'Stretford Ender', 'Old Trafford Regular', 'United Historian', 'Treble Winner'],
  'manchester-city':    ['Day Tripper', 'New Blue', 'Kippax Regular', 'Maine Road Faithful', 'City Historian', 'Aguerooo'],
  chelsea:              ['Day Tripper', 'New Blue', 'Shed End Regular', 'Bridge Faithful', 'Chelsea Historian', 'Munich 2012'],
  tottenham:            ['Day Tripper', 'New Spur', 'Park Lane Regular', 'Lane Faithful', 'Spurs Historian', 'Double Winner'],
  'newcastle-united':   ['Day Tripper', 'New Geordie', 'Gallowgate Regular', 'Toon Army', 'Magpies Historian', 'Entertainer'],
  everton:              ['Day Tripper', 'New Toffee', 'Gwladys Street', 'Goodison Regular', 'Everton Historian', 'School of Science'],
  'aston-villa':        ['Day Tripper', 'New Villan', 'Holte Ender', 'Villa Park Regular', 'Villa Historian', 'European Champion'],
  'leeds-united':       ['Day Tripper', 'New Peacock', 'Kop Regular', 'Elland Road Faithful', 'Leeds Historian', 'Revie Era'],
  'west-ham-united':    ['Day Tripper', 'New Iron', 'Chicken Run', 'Boleyn Regular', 'Hammers Historian', 'Academy Graduate'],
  'nottingham-forest':  ['Day Tripper', 'New Red', 'Trent Ender', 'City Ground Regular', 'Forest Historian', 'Back-to-Back'],
  wolves:               ['Day Tripper', 'New Wolf', 'South Bank', 'Molineux Regular', 'Wolves Historian', 'Floodlit Legend'],
  sunderland:           ['Day Tripper', 'New Mackem', 'Fulwell Ender', 'Roker Regular', 'Sunderland Historian', 'Wembley 1973'],
  'sheffield-wednesday':['Day Tripper', 'New Owl', 'Kop Regular', 'Hillsborough Faithful', 'Owls Historian', 'Wednesday Legend'],

  // ── Scotland ─────────────────────────────────────────────────────────────
  celtic:               ['Day Tripper', 'New Bhoy', 'Jungle Regular', 'Paradise Faithful', 'Celtic Historian', 'Lisbon Lion'],
  rangers:              ['Day Tripper', 'New Ger', 'Broomloan Regular', 'Ibrox Faithful', 'Rangers Historian', 'Barcelona 1972'],

  // ── Spain ────────────────────────────────────────────────────────────────
  'real-madrid':        ['Día de Turista', 'Nuevo Madridista', 'Socio', 'Bernabéu Regular', 'Madrid Historian', 'La Decimosexta'],
  barcelona:            ['Día de Turista', 'Nou Culer', 'Soci', 'Camp Nou Regular', 'Barça Historian', 'La Masia Legend'],
  'atletico-madrid':    ['Día de Turista', 'Nuevo Colchonero', 'Fondo Sur', 'Metropolitano Regular', 'Atleti Historian', 'Cholismo'],

  // ── Italy ────────────────────────────────────────────────────────────────
  juventus:             ['Turista', 'Nuovo Bianconero', 'Curva Sud', 'Stadium Regular', 'Juve Historian', 'La Vecchia Signora'],
  'ac-milan':           ['Turista', 'Nuovo Rossonero', 'Curva Sud', 'San Siro Regular', 'Milan Historian', 'Grande Milan'],
  'inter-milan':        ['Turista', 'Nuovo Nerazzurro', 'Curva Nord', 'San Siro Regular', 'Inter Historian', 'Triplete'],
  napoli:               ['Turista', 'Nuovo Azzurro', 'Curva B', 'Maradona Regular', 'Napoli Historian', 'Terzo Scudetto'],
  roma:                 ['Turista', 'Nuovo Giallorosso', 'Curva Sud', 'Olimpico Regular', 'Roma Historian', 'Er Capitano'],

  // ── Germany ──────────────────────────────────────────────────────────────
  'bayern-munich':      ['Tagesgast', 'Neuer Bayer', 'Südkurve', 'Arena Regular', 'Bayern Historian', 'Mia San Mia'],
  'borussia-dortmund':  ['Tagesgast', 'Neuer Borusse', 'Südtribüne', 'Yellow Wall', 'BVB Historian', 'Wembley 1997'],

  // ── France, Netherlands, Portugal ────────────────────────────────────────
  'paris-saint-germain':['Touriste', 'Nouveau Parisien', 'Virage Auteuil', 'Parc Regular', 'PSG Historian', 'Ici C’est Paris'],
  ajax:                 ['Dagjesmens', 'Nieuwe Ajacied', 'Vak 410', 'Arena Regular', 'Ajax Historian', 'Totaalvoetbal'],
  benfica:              ['Turista', 'Novo Benfiquista', 'Topo Sul', 'Luz Regular', 'Benfica Historian', 'Eusébio’s Heir'],
  porto:                ['Turista', 'Novo Portista', 'Super Dragões', 'Dragão Regular', 'Porto Historian', 'Dragon Legend'],

  // ── Turkey, Croatia, Argentina, Brazil ───────────────────────────────────
  galatasaray:          ['Misafir', 'Yeni Aslan', 'Tribün Regular', 'Ali Sami Yen', 'Gala Historian', 'Cimbom Legend'],
  fenerbahce:           ['Misafir', 'Yeni Kanarya', 'Tribün Regular', 'Kadıköy Faithful', 'Fener Historian', 'Sarı Kanarya'],
  'hajduk-split':       ['Turist', 'Novi Bili', 'Sjeverna Tribina', 'Poljud Regular', 'Hajduk Historian', 'Torcida Legend'],
  'boca-juniors':       ['Turista', 'Nuevo Xeneize', 'La Doce', 'Bombonera Regular', 'Boca Historian', 'Leyenda Xeneize'],
  'river-plate':        ['Turista', 'Nuevo Millonario', 'Los Borrachos', 'Monumental Regular', 'River Historian', 'Leyenda Millonaria'],
  flamengo:             ['Turista', 'Novo Rubro-Negro', 'Arquibancada', 'Maracanã Regular', 'Fla Historian', 'Nação Rubro-Negra'],
};

/** Ladder for a club slug — always returns six rungs. */
export function tiersFor(slug) {
  const t = Object.prototype.hasOwnProperty.call(CLUB_TIERS, slug) ? CLUB_TIERS[slug] : null;
  return t && t.length === 6 ? t : DEFAULT_TIERS;
}
