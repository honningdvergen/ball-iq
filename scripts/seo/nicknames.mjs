// nicknames.mjs — why football clubs are called what they are called.
//
// ⚠️ THE ORIGIN IS THE PRODUCT. "Arsenal are called the Gunners" is a fact
// anybody can get from the club crest; it earns nothing and links to nobody.
// "Arsenal are the Gunners because the club was founded in 1886 by workers at
// the Royal Arsenal armaments factory in Woolwich" is the answer to what a
// person actually typed. Any club whose origin I cannot state confidently is
// LEFT OUT rather than padded — a page of half-remembered folk etymology is
// worse than a shorter page, and this one is meant to attract links.
//
// ⚠️ SETTLED FACTS ONLY, which is also why this is the first Discover
// expansion. It is text, so it carries none of the licensing exposure that
// killed the kit-history idea, and nicknames do not go stale the way squads,
// records and transfer trails do. No maintenance schedule, no seasonal drift.
//
// `slug` must match a club page in clubs.mjs for the link to render; entries
// without one still appear, just without a quiz link.
export const NICKNAMES = [
  // ── England ────────────────────────────────────────────────────────────────
  { slug: 'arsenal', club: 'Arsenal', nick: 'The Gunners',
    origin: 'The club was founded in 1886 by workers at the Royal Arsenal armaments factory in Woolwich, south-east London. The cannon has been on the badge ever since, and it long pre-dates the move north to Highbury.' },
  { slug: 'everton', club: 'Everton', nick: 'The Toffees',
    origin: 'From the sweet shops beside the club’s early home — Ye Anciente Everton Toffee House and Mother Noblett’s. A "Toffee Lady" still throws sweets to the crowd before kick-off at Goodison.' },
  { slug: 'manchester-united', club: 'Manchester United', nick: 'The Red Devils',
    origin: 'Adopted in the early 1960s. Matt Busby liked the nickname of Salford’s rugby league side, who had toured France as "Les Diables Rouges", and pushed for United to take it on; the devil joined the badge later that decade.' },
  { slug: 'tottenham', club: 'Tottenham Hotspur', nick: 'Spurs',
    origin: 'The club is named after Sir Henry Percy — Shakespeare’s Harry Hotspur — whose family held land in the area. The fighting cock on the badge is a nod to the spurs fitted to gamecocks.' },
  { slug: 'west-ham', club: 'West Ham United', nick: 'The Hammers / The Irons',
    origin: 'The club began in 1895 as Thames Ironworks FC, the works team of a shipbuilder. The crossed rivet hammers on the badge are shipyard tools, not a pun on the name.' },
  { slug: 'newcastle', club: 'Newcastle United', nick: 'The Magpies',
    origin: 'From the black-and-white stripes adopted in 1894. Club lore has it a pair of magpies nested in the stand at St James’ Park around the same time.' },
  { slug: 'southampton', club: 'Southampton', nick: 'The Saints',
    origin: 'Founded in 1885 as St Mary’s Church of England Young Men’s Association — a church side. The club still plays at a ground called St Mary’s.' },
  { slug: 'sheffield-wednesday', club: 'Sheffield Wednesday', nick: 'The Owls',
    origin: 'From Owlerton, the district the club moved to in 1899. The name stuck so firmly that an owl was put on the badge, and the club’s original nickname — The Blades — passed to their neighbours.' },
  { slug: 'norwich', club: 'Norwich City', nick: 'The Canaries',
    origin: 'Norwich was a centre of canary breeding, brought over by Flemish weavers who settled in the city. The club switched to yellow-and-green in 1907 to match.' },
  { slug: 'burnley', club: 'Burnley', nick: 'The Clarets',
    origin: 'Straightforwardly the kit: Burnley adopted claret and blue in 1910 in imitation of Aston Villa, then the dominant force in English football.' },
  { slug: 'aston-villa', club: 'Aston Villa', nick: 'The Villans',
    origin: 'From the club’s founding in 1874 by members of the Villa Cross Wesleyan Chapel in Handsworth. Villa’s claret and blue is the kit Burnley and West Ham both borrowed.' },
  { slug: 'crystal-palace', club: 'Crystal Palace', nick: 'The Eagles',
    origin: 'They were The Glaziers for eighty years, after the Crystal Palace glasshouse the club took its name from. Manager Malcolm Allison rebranded them The Eagles in 1973, borrowing the swagger of Benfica.' },
  { slug: 'brighton', club: 'Brighton & Hove Albion', nick: 'The Seagulls',
    origin: 'A terrace invention of the 1970s: fans answered Crystal Palace’s "Eagles" chant with "Seagulls", and the seaside bird replaced the club’s old dolphin nickname.' },
  { slug: 'bournemouth', club: 'Bournemouth', nick: 'The Cherries',
    origin: 'Two explanations survive and neither is settled — the cherry-red shirts, or the cherry orchards said to have surrounded Dean Court. The club uses both.' },
  { slug: 'brentford', club: 'Brentford', nick: 'The Bees',
    origin: 'Not the stripes. A student relative of a player led a chant of "buck up Bs" at an early match, the local press heard "Bees", and it stuck.' },
  { slug: 'fulham', club: 'Fulham', nick: 'The Cottagers',
    origin: 'From Craven Cottage — a real cottage built on the site in 1780 and burnt down in 1888. The current pavilion in the corner of the ground keeps the name alive.' },
  { slug: 'leicester', club: 'Leicester City', nick: 'The Foxes',
    origin: 'Leicestershire is historic fox-hunting country, and the club adopted the fox in the 1940s. It is the rare English nickname that comes from the county rather than the kit or the trade.' },
  { slug: 'wolves', club: 'Wolverhampton Wanderers', nick: 'Wolves',
    origin: 'A contraction of Wolverhampton rather than an invention — but the club leaned in, putting a wolf’s head on the badge in 1970 in one of the earliest modern club rebrands.' },
  { slug: 'nottingham-forest', club: 'Nottingham Forest', nick: 'The Tricky Trees',
    origin: 'The tree comes from the Forest name and the city’s Sherwood associations. Forest’s red is called Garibaldi red — the club adopted it in 1865 in tribute to the Italian revolutionary, whose redshirts were then a popular cause.' },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { slug: 'barcelona', club: 'Barcelona', nick: 'Culés / Blaugrana',
    origin: 'Culés is Catalan for "backsides". At the old Camp de la Indústria, spectators sat on the top of the wall, so passers-by in the street below saw a row of behinds. Blaugrana is simply blue-and-claret.' },
  { slug: 'real-madrid', club: 'Real Madrid', nick: 'Los Blancos / Los Merengues',
    origin: 'Both from the all-white kit, worn since 1902 — merengue for the meringue-white look. The "Real" itself is a royal title granted by Alfonso XIII in 1920, which is why the crown sits on the crest.' },
  { slug: 'atletico-madrid', club: 'Atlético Madrid', nick: 'Los Colchoneros',
    origin: '"The mattress makers." Spanish mattresses were traditionally covered in red-and-white striped ticking, exactly like Atlético’s shirts, and the terraces named the club after them.' },
  { slug: 'athletic-bilbao', club: 'Athletic Bilbao', nick: 'Los Leones',
    origin: 'The Lions, after San Mamés — the stadium is named for Saint Mamas, an early Christian thrown to lions who was said to have tamed them.' },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { slug: 'juventus', club: 'Juventus', nick: 'La Vecchia Signora',
    origin: '"The Old Lady" — a pun. Juventus means "youth" in Latin, so the nickname is affectionate irony aimed at a club that had become the establishment.' },
  { slug: 'ac-milan', club: 'AC Milan', nick: 'Il Diavolo / Rossoneri',
    origin: 'Rossoneri is the red and black of the shirts; founder Herbert Kilpin said the red was for the devil in his players and the black to frighten opponents.' },
  { slug: 'inter-milan', club: 'Inter Milan', nick: 'Il Biscione / Nerazzurri',
    origin: 'The biscione is the great serpent of the Visconti family, rulers of Milan, and appears on the city’s heraldry. Nerazzurri is the black and blue of the kit.' },
  { slug: 'napoli', club: 'Napoli', nick: 'I Partenopei',
    origin: 'From Parthenope, the siren of Greek myth who founded the settlement that became Naples. It is a name for the city itself as much as the club.' },
  { slug: 'roma', club: 'Roma', nick: 'La Lupa / I Giallorossi',
    origin: 'La Lupa is the she-wolf who suckled Romulus and Remus — Rome’s founding myth, on the badge. Giallorossi is the yellow and red of the city’s own colours.' },

  // ── Germany ────────────────────────────────────────────────────────────────
  { slug: 'schalke', club: 'Schalke 04', nick: 'Die Knappen',
    origin: '"The miners." Schalke is in Gelsenkirchen, in the coal heart of the Ruhr, and the club was built by mining families — Knappe is the old German word for a young pitman.' },
  { slug: 'borussia-dortmund', club: 'Borussia Dortmund', nick: 'Die Schwarzgelben',
    origin: 'The black-and-yellows. "Borussia" is simply the Latin for Prussia, borrowed from a local brewery of that name when the club was founded in 1909.' },
  { slug: 'bayern-munich', club: 'Bayern Munich', nick: 'FC Hollywood',
    origin: 'A press nickname from the 1990s, when the dressing room produced more headlines than the football. It was an insult that the club has largely absorbed with good humour.' },

  // ── Netherlands, Portugal, Scotland ────────────────────────────────────────
  { slug: 'ajax', club: 'Ajax', nick: 'De Godenzonen',
    origin: '"The Sons of the Gods" — the club is named after Ajax, the Greek hero of the Trojan War, whose head has been on the badge since 1928 in a design of eleven lines.' },
  { slug: 'psv', club: 'PSV Eindhoven', nick: 'Boeren',
    origin: '"Farmers" — originally a jibe from fans of city clubs at rural Brabant, worn with pride since. PSV stands for Philips Sport Vereniging: it began as the electronics company’s works team.' },
  { slug: 'benfica', club: 'Benfica', nick: 'As Águias',
    origin: '"The Eagles." A live eagle, Vitória, is flown over the Estádio da Luz before matches — the bird stands for independence and nobility in the club’s founding symbolism.' },
  { slug: 'porto', club: 'Porto', nick: 'Os Dragões',
    origin: '"The Dragons", from the dragon in the coat of arms of the city of Porto, added to the club crest in 1922.' },
  { slug: 'celtic', club: 'Celtic', nick: 'The Bhoys',
    origin: 'Founded in 1887 by an Irish Marist brother to feed poor immigrants in Glasgow’s East End. The "bh" is an Irish spelling convention, used on an early club postcard and kept ever since.' },

  // ── South America ──────────────────────────────────────────────────────────
  { slug: 'boca-juniors', club: 'Boca Juniors', nick: 'Xeneizes',
    origin: '"The Genoese", in local dialect. La Boca was the dockside barrio of Buenos Aires settled by immigrants from Genoa, and the club came out of that community.' },
  { slug: 'river-plate', club: 'River Plate', nick: 'Los Millonarios',
    origin: '"The Millionaires" — from the transfer fees River paid in the 1930s, unheard-of sums at the time, starting with Bernabé Ferreyra in 1932.' },
];

// Group headings on the page, in this order. A club whose country is missing
// here simply will not render, which is the safe failure.
export const NICK_REGIONS = [
  ['England', ['arsenal', 'everton', 'manchester-united', 'tottenham', 'west-ham', 'newcastle', 'southampton', 'sheffield-wednesday', 'norwich', 'burnley', 'aston-villa', 'crystal-palace', 'brighton', 'bournemouth', 'brentford', 'fulham', 'leicester', 'wolves', 'nottingham-forest']],
  ['Spain', ['barcelona', 'real-madrid', 'atletico-madrid', 'athletic-bilbao']],
  ['Italy', ['juventus', 'ac-milan', 'inter-milan', 'napoli', 'roma']],
  ['Germany', ['schalke', 'borussia-dortmund', 'bayern-munich']],
  ['Netherlands, Portugal & Scotland', ['ajax', 'psv', 'benfica', 'porto', 'celtic']],
  ['South America', ['boca-juniors', 'river-plate']],
];
