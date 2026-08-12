// wiki-career.mjs — read a footballer's club career out of their Wikipedia
// infobox, in house style.
//
// ⚠️ EXTRACTED SO IT CANNOT DRIFT. This parser carries four fixes that each
// shipped a wrong trail before they were found — read-to-end-of-line, merge a
// loan into the permanent spell that follows it, permanent-wins on that merge,
// and reserve sides wearing a bare letter. A second copy of it in the verifier
// would quietly diverge from the generator, and the two would then disagree
// about what a career IS — which is exactly the drift the verifier exists to
// detect. One parser, two callers.
//
// ⚠️ WIKIDATA CANNOT DO THIS JOB. Its P54 statements carry no loan qualifier
// (checked against Bacary Sagna: eight statements, none marked), so a career
// built from it presents loan spells as permanent transfers. Wikipedia's
// infobox marks them — "→ AC Milan (loan)" — which is why this reads wikitext.
export const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; hello@balliq.app) trail-careers' };

// ⚠️ HOUSE STYLE, NOT WIKIPEDIA STYLE. The existing 44 read "Man Utd",
// "Tottenham", "Atletico Madrid" — short, unaccented, how a fan says it out
// loud. Wikipedia gives "Manchester United F.C.", "Tottenham Hotspur",
// "Atlético Madrid". A trail mixing both looks like two different games.
const NAME = {
  'Manchester United': 'Man Utd', 'Manchester City': 'Man City',
  'Tottenham Hotspur': 'Tottenham', 'Atlético Madrid': 'Atletico Madrid',
  'Paris Saint-Germain': 'PSG', 'Borussia Mönchengladbach': 'Borussia M.gladbach',
  'Bayer Leverkusen': 'Leverkusen', 'Internazionale': 'Inter Milan',
  'Los Angeles FC': 'LAFC', 'Brighton & Hove Albion': 'Brighton',
  'Red Bull Salzburg': 'RB Salzburg', 'TSG Hoffenheim': 'Hoffenheim',
  'PSV Eindhoven': 'PSV', 'Olympique Lyonnais': 'Lyon', 'Olympique de Marseille': 'Marseille',
  'Sheffield United': 'Sheffield Utd', 'Deportivo La Coruña': 'Deportivo',
  'Bayern Munich': 'Bayern Munich', 'FC Bayern Munich': 'Bayern Munich',
};
export const house = (c) => NAME[c] || c.replace(/\s+(F\.?C\.?|C\.?F\.?|S\.?K\.?|A\.?F\.?C\.?)$/i, '').trim();


// Reserve and B sides are not a career step. ⚠️ Note the word-boundary on II —
// a bare /II/ also matches WILLEM II, a first-division Eredivisie club, which
// the careers fetcher documents as a real trap it nearly fell into.
// ⚠️ RESERVE SIDES ALSO WEAR A BARE LETTER. "FC Barcelona C" and "Valencia CF
// Mestalla" both slipped the first version and appeared as career steps for
// Messi and Ferran Torres. Trailing single letters and the named reserve sides
// are matched explicitly — anchored at the END so a club whose real name ends
// in a word is untouched.
// ⚠️ AND SOME WEAR THE PARENT'S SECOND NAME. Sergio Ramos's first row is
// "[[Sevilla Atlético]]" — Sevilla's B team — which sailed past every pattern
// above and presented as a senior club, making his trail six rungs of which the
// first was fictional. It CANNOT be matched as a bare word: "Atlético Madrid"
// is one of the biggest clubs in the game and starts with it. Anchored at the
// END, where the reserve-side usage always sits.
const RESERVE = /\b(?:II|Reserves?|Youth|Academy|Juvenil|Atlètic|Atletic|Castilla|Mestalla)\b|\s+Atl[éeè]tico$|\s+[BC]$|\s+U-?\d+s?$|\s+Under-?\d+s?$/i;

// ⚠️ SOME INFOBOXES PUT THREE FIELDS ON ONE LINE. Mathieu Flamini's reads
// "[[Olympique de Marseille|Marseille]]   | caps1 = 14  | goals1 = 0" — so
// end-of-line capture, which is correct for every other article, dragged his
// appearance and goal tallies into the club NAME and every rung of his trail
// came out as "Marseille | caps1 = 14 | goals1 = 0". Cut at a pipe ONLY when
// what follows is another infobox field, which is exactly the case the
// end-of-line rule was never meant to cover — a pipe inside [[a|link]] is
// untouched, so the truncation bug this replaced cannot come back.
const TRAILING_FIELD = /\s*\|\s*(?:caps|goals|years|clubs|nationalyears|nationalteam|nationalcaps|nationalgoals|totalcaps|totalgoals|pcupdate|ntupdate)\d*\s*=.*$/i;

// Both callers walk 100+ articles, so the courtesy delay belongs here too —
// Wikipedia's API is free and unauthenticated, and hammering it is how a tool
// like this earns a block for everyone.
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const clean = (s) => s.replace(/\[\[([^\]|]*)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
  .replace(/→/g, '').replace(/\(loan\)/ig, '').replace(/<[^>]*>/g, '')
  .replace(/\{\{[^}]*\}\}/g, '').replace(/\s+/g, ' ').trim();

export async function careerFor(title) {
  // ⚠️ redirects=1 IS LOAD-BEARING. action=parse does NOT follow redirects by
  // default — it returns the redirect stub's wikitext, which has no infobox, so
  // every player whose article title redirects ("Vinicius Junior", accents,
  // name changes) came back as "no infobox" and looked like a missing article.
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&redirects=1&prop=wikitext&section=0&page=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: UA });
  const j = await res.json().catch(() => null);
  const wt = j?.parse?.wikitext?.['*'];
  if (!wt) return null;
  // ⚠️ READ TO END OF LINE, NOT TO THE NEXT PIPE. The first version captured
  // [^\n|]+ and stopped at the first "|" — which in wikitext is INSIDE the
  // link, [[FC Barcelona|Barça]]. Every row came back truncated as
  // "[[FC Barcelona", and worse, the truncation swallowed the "(loan)" marker
  // that sits after the link. Rashford's two loan spells were presented as
  // permanent transfers. Infobox fields occupy their own line, so end-of-line
  // is the correct boundary and clean() handles the pipes inside links.
  const years = new Map([...wt.matchAll(/\|\s*years(\d+)\s*=\s*([^\n]+)/g)].map((m) => [m[1], m[2].trim()]));
  const clubs = new Map([...wt.matchAll(/\|\s*clubs(\d+)\s*=\s*([^\n]+)/g)].map((m) => [m[1], m[2].trim()]));
  if (!clubs.size) return null;

  const rows = [...clubs.keys()]
    .sort((a, b) => Number(a) - Number(b))
    .map((i) => ({ raw: clubs.get(i), year: years.get(i) || '', loan: /loan/i.test(clubs.get(i)) }))
    .map((r) => ({ ...r, club: clean(r.raw.replace(TRAILING_FIELD, '')) }))
    .filter((r) => r.club && !RESERVE.test(r.club));

  // ⚠️ MERGE A LOAN INTO THE PERMANENT SPELL THAT FOLLOWS IT AT THE SAME CLUB.
  // Wikipedia lists Torres as "→ AC Milan (loan)" and then "AC Milan" — two
  // rows, one club, one move. Left unmerged the trail would show Milan twice
  // in a row, which reads as a mistake rather than a return. A genuine return
  // (Torres going back to Atlético years later) is NOT adjacent, so it
  // survives as its own rung, exactly as the rules require.
  const merged = [];
  for (const r of rows) {
    const prev = merged[merged.length - 1];
    // ⚠️ PERMANENT WINS. A loan that turns into a transfer is ONE rung and it is
    // NOT a loan — Mbappé joined PSG on loan and then stayed seven years, and
    // the first version merged that into a rung marked "(loan)", which is a
    // plain falsehood about the biggest move of his career. Mark the rung a
    // loan only if EVERY spell at that club was one.
    if (prev && prev.club === r.club) { prev.loan = prev.loan && r.loan; continue; }
    merged.push({ ...r });
  }
  return merged;
}



