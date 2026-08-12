// build-trail-candidates.mjs — propose new Transfer Trail careers from the
// source that actually carries the facts the editorial rules need.
//
//   node scripts/build-trail-candidates.mjs [limit]   → scripts/_trail-candidates.json
//
// ⚠️ WIKIDATA CANNOT DO THIS JOB, AND THAT IS THE WHOLE REASON THIS EXISTS.
// The locked Trail rules are: loans in and MARKED · youth out · a return to a
// former club is its own rung · max 6. Wikidata's P54 statements carry no loan
// qualifier — checked directly against Bacary Sagna, whose eight statements
// have none — so a trail generated from it would silently present loan spells
// as permanent transfers. Wikipedia's player infobox marks them ("→ AC Milan
// (loan)"), which is why the original 44 were verified against it.
//
// ⚠️ THIS EMITS PROPOSALS, NOT BANK ENTRIES. Output goes to a staging file for
// review, never straight into src/lib/trail.js. The ZERO ERROR bar applies:
// only what survives a human read gets committed.
import { readFileSync, writeFileSync } from 'fs';
import { TRAIL_PLAYERS } from '../src/lib/trail.js';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; hello@balliq.app) trail-candidates' };
const LIMIT = parseInt(process.argv[2] || '60', 10);
const MAX_RUNGS = 6;
const MIN_RUNGS = 3;

const pool = JSON.parse(readFileSync('public/data/lineup.json', 'utf8')).players;
const have = new Set(TRAIL_PLAYERS.map((p) => p.display.join(' ').toLowerCase()));

// Reserve and B sides are not a career step. ⚠️ Note the word-boundary on II —
// a bare /II/ also matches WILLEM II, a first-division Eredivisie club, which
// the careers fetcher documents as a real trap it nearly fell into.
// ⚠️ RESERVE SIDES ALSO WEAR A BARE LETTER. "FC Barcelona C" and "Valencia CF
// Mestalla" both slipped the first version and appeared as career steps for
// Messi and Ferran Torres. Trailing single letters and the named reserve sides
// are matched explicitly — anchored at the END so a club whose real name ends
// in a word is untouched.
const RESERVE = /\b(?:II|Reserves?|Youth|Academy|Juvenil|Atlètic|Atletic|Castilla|Mestalla)\b|\s+[BC]$|\s+U-?\d+s?$|\s+Under-?\d+s?$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => s.replace(/\[\[([^\]|]*)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
  .replace(/→/g, '').replace(/\(loan\)/ig, '').replace(/<[^>]*>/g, '')
  .replace(/\{\{[^}]*\}\}/g, '').replace(/\s+/g, ' ').trim();

async function careerFor(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&section=0&page=${encodeURIComponent(title)}`;
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
    .map((r) => ({ ...r, club: clean(r.raw) }))
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

// ⚠️ FAME CUT. lineup.json is emitted in fame order, so an index cap is the
// cheapest honest filter. Without one the batch offered Joao Grimaldo — a trail
// nobody can solve is worse than no trail, and the whole point of expanding the
// pool is to stop regulars seeing repeats, not to make the game unwinnable.
const FAME_CUT = 400;
const targets = pool.slice(0, FAME_CUT)
  .filter((p) => p.n && p.n.includes(' ') && !have.has(p.n.toLowerCase()));
const out = [];
const skipped = [];

for (const p of targets) {
  if (out.length >= LIMIT) break;
  let career;
  try { career = await careerFor(p.n.replace(/ /g, '_')); } catch { career = null; }
  await sleep(220);
  if (!career) { skipped.push(`${p.n} — no infobox`); continue; }
  if (career.length < MIN_RUNGS) { skipped.push(`${p.n} — only ${career.length} club(s)`); continue; }
  // ⚠️ NOT TRUNCATED. The locked rule caps a trail at six rungs; a longer
  // career is REJECTED rather than cut, because a truncated trail is a wrong
  // trail — the answer's actual first club would be missing.
  if (career.length > MAX_RUNGS) { skipped.push(`${p.n} — ${career.length} clubs, over the cap`); continue; }
  const parts = p.n.split(' ');
  out.push({
    key: parts[parts.length - 1].toUpperCase().replace(/[^A-Z]/g, ''),
    display: [parts.slice(0, -1).join(' '), parts[parts.length - 1]],
    nat: p.t || '',
    clubs: career.map((c) => c.club),
    loans: career.map((c) => !!c.loan),
    _source: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.n.replace(/ /g, '_'))}`,
  });
}

writeFileSync('scripts/_trail-candidates.json', `${JSON.stringify(out, null, 1)}\n`);
console.log(`proposed ${out.length} careers -> scripts/_trail-candidates.json`);
console.log(`skipped ${skipped.length}`);
skipped.slice(0, 12).forEach((s) => console.log(`   ${s}`));
console.log('\n⚠️ PROPOSALS ONLY. Read every one before it goes into src/lib/trail.js.');
