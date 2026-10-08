// fetch-squads-wiki.mjs — current squads from Wikipedia's own squad templates.
//
//   node scripts/fetch-squads-wiki.mjs
//
// WHY WIKIPEDIA AND NOT WIKIDATA FOR SQUADS. Measured on 2026-08-10: Wikidata
// has NO P54 club membership at all for Leny Yoro or Andrey Santos, records no
// open spell for Luke Shaw, and still lists Tuanzebe and Borthwick-Jackson at
// Manchester United. Wikipedia's club articles carry a fan-maintained
// "First-team squad" section in structured {{football squad player}} templates
// — updated within hours of a transfer, and it already uses OUR slot
// vocabulary (GK/DF/MF/FW), so there is no position-word mapping to get wrong.
// Squad facts are facts; the CC BY-SA licence covers the prose, not the roster.
//
// ⚠️ PLAYERS ARE JOINED BY WIKIDATA Q-ID RESOLVED FROM THE ARTICLE TITLE, NEVER
// BY NAME. The short-name/long-name trap has fired five separate times in this
// repo ("West Ham" vs "West Ham United" twice in one session). The enwiki API
// returns each linked article's wikibase_item in batches of 50 — exact ids,
// zero name matching.
//
// ⚠️ WRITES STAGING FILES ONLY: scripts/_squads-wiki.json (first teams) and
// scripts/_squads-wiki-other.json (loans, reserves, academies). The step that
// turns them into src/data/squads.json is scripts/build-squads.mjs, which
// prints every player joining and leaving before it writes. From August to
// 2026-10-08 that step did not exist and this file's output was applied to
// nothing, while squads.json went on listing players who had left years before.
//
// ⚠️ "Out on loan" sections use THE SAME template as the first-team squad. A
// parser that grabs every template on the page files every loanee as a current
// squad member. Sections are therefore classified by their own heading: the
// first-team sections go to one file, loan and reserve sections to the other.
import { readFileSync, writeFileSync } from 'fs';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const OUT = 'scripts/_squads-wiki.json';
// Loan and reserve sections, same row shape. build-squads.mjs reads both.
const OUT_OTHER = 'scripts/_squads-wiki-other.json';

async function getJSON(url, label) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 10000 * a)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 3000 * a));
    }
  }
  return null;
}

// ── 1. exact enwiki article per club ───────────────────────────────────────
// Via wbgetentities, NOT the query service: WDQS was measured ignoring VALUES
// clauses on 2026-08-10 (a two-id query returned 95MB of unrelated entities).
// The entity API reads sitelinks directly, batched, no query planner involved.
const clubIds = Object.entries(QIDS).map(([club, v]) => ({ club, qid: v.qid }));

// League-coverage clubs (resolve-league-clubs.mjs) join the run with their
// articles already known; dedupe by qid so pack clubs keep their pack names.
let LEAGUE = {};
try { LEAGUE = JSON.parse(readFileSync('scripts/_league-clubs.json', 'utf8')); } catch {}
const haveQ = new Set(clubIds.map((c) => c.qid));
const tidy = (t) => t.replace(/\s+(F\.?C\.?|A\.?F\.?C\.?|S\.?C\.?|C\.?F\.?|B\.?C\.?|A\.?C\.?|Calcio(?: \d{4})?|\d{4}|1913|1909)$/g, '').trim();
for (const clubs of Object.values(LEAGUE))
  for (const c of clubs)
    if (!haveQ.has(c.qid)) { haveQ.add(c.qid); clubIds.push({ club: tidy(c.article), qid: c.qid, article: c.article }); }

const articleOf = {};
const packQids = clubIds.filter((c) => !c.article).map((c) => c.qid);
for (let i = 0; i < packQids.length; i += 50) {
  const batch = packQids.slice(i, i + 50);
  const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities'
    + '&props=sitelinks&sitefilter=enwiki&format=json&ids=' + batch.join('|'), `sitelinks ${i}`);
  for (const [id, ent] of Object.entries(j?.entities || {}))
    if (ent?.sitelinks?.enwiki?.title) articleOf[id] = ent.sitelinks.enwiki.title;
  await new Promise((s2) => setTimeout(s2, 250));
}
console.log(`clubs in the run: ${clubIds.length} (packs ${packQids.length} + league coverage ${clubIds.length - packQids.length})`);

// ── 2. per club: wikitext -> first-team section -> squad templates ─────────
// ⚠️ THE HEADING IS NOT ALWAYS "First-team squad". Until 2026-10-08 three clubs
// parsed to nothing and nobody noticed, because an empty squad is only a ⚠️ in
// a log: Red Star Belgrade's section is "First team", Real Betis's is
// "First-team", and Corinthians's "First-team squad" sits under "Players and
// staff", which the staff exclusion below threw out as an ancestor.
const INCLUDE = /^first.?team$|first.?team squad|current squad|^squad$/i;
// frauen/féminin matter: several clubs (Basel, Lyon) carry their women's side
// on the SAME article, with an identically-titled "Current squad" subsection.
const EXCLUDE = /loan|reserve|academy|youth|under-\d|u\d\d|women|frauen|f[ée]minin|femenino|former|notable|retired|staff|management/i;
// An ANCESTOR is excluded for what it says about the team, not about who else
// is listed beside the players: "Players and staff" is the parent of the squad
// on several articles, "Women" is another team.
const ANCESTOR_EXCLUDE = /loan|reserve|academy|youth|under-\d|u\d\d|women|frauen|f[ée]minin|femenino|former|notable|retired/i;
// The other sections that use the same templates. They are not the first team,
// but they are evidence about a player squads.json already holds: "out on
// loan" says he is contracted here and playing somewhere else, a reserve or
// academy section says he is still at the club.
const LOAN = /\bloan/i;
const RESERVE = /reserve|academy|youth|under-\d|u-?\d\d|\bB team\b|second team|development squad/i;
const NOT_OURS = /women|frauen|f[ée]minin|femenino|former|notable|retired|staff|management|record/i;

// ⚠️ ANCESTOR-AWARE. Measured on FC Basel: the article contains TWO "Current
// squad" sections (28 + 31 templates) — the second belongs to another team
// under a parent heading a flat slicer never reads. A section counts only if
// its OWN title matches INCLUDE and neither it nor ANY ancestor heading
// matches EXCLUDE. Chelsea's 45, by contrast, is genuine contract-hoarding —
// all 45 sit in the real first-team section — so no count-based cap is
// applied; caps would "fix" true data.
function squadSections(wikitext) {
  const heads = [...wikitext.matchAll(/^(={2,4})\s*(.+?)\s*\1\s*$/gm)]
    .map((m) => ({ at: m.index, lvl: m[1].length, title: m[2].replace(/\[\[|\]\]/g, '') }));
  const parts = [], loan = [], reserve = [];
  const included = [];
  const stack = [];
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    while (stack.length && stack[stack.length - 1].lvl >= h.lvl) stack.pop();
    const ancestorExcluded = stack.some((a) => ANCESTOR_EXCLUDE.test(a.title));
    // Up to the next heading of ANY level, so a parent never swallows the
    // templates of its own sub-sections.
    const body = wikitext.slice(h.at, heads[i + 1] ? heads[i + 1].at : undefined);
    const lineage = stack.map((a) => a.title).concat(h.title).join(' > ');
    if (!ancestorExcluded && INCLUDE.test(h.title) && !EXCLUDE.test(h.title)) {
      parts.push(body);
      included.push(lineage);
    } else if (!NOT_OURS.test(lineage)) {
      if (LOAN.test(lineage)) loan.push(body);
      else if (RESERVE.test(lineage)) reserve.push(body);
    }
    stack.push(h);
  }
  if (included.length > 1) console.log(`    (multiple squad sections kept: ${included.join(' | ')})`);
  return { first: parts.join('\n'), loan: loan.join('\n'), reserve: reserve.join('\n') };
}

// ⚠️ A TEMPLATE IS NOT A REGEX. The first parser matched `{{fs player|[^}]*}}`
// and split the inside on every "|". A piped link has a "|" of its own, so
// `name=[[Ben White (footballer)|Ben White]]` was cut in half, the half that
// was left had no closing brackets, and the player came out with no article
// and therefore no Wikidata id. Measured on 2026-10-08: 521 of 3,426 players,
// and by construction every one whose article title needs a disambiguator —
// Ben White, Raúl Asencio, Lewis Cook, Evanilson. They are exactly the players
// a name match gets wrong, lost by the step that exists to avoid name matching.
// So: walk to the matching close, and split only at depth zero.
function templates(text, names) {
  const out = [];
  const open = new RegExp('\\{\\{\\s*(?:' + names + ')[^\\S\\n]*\\d?\\s*\\|', 'gi');
  let m;
  while ((m = open.exec(text))) {
    let depth = 1, i = open.lastIndex;
    for (; i < text.length && depth; i++) {
      if (text.startsWith('{{', i)) { depth++; i++; }
      else if (text.startsWith('}}', i)) { depth--; i++; }
    }
    if (!depth) out.push(text.slice(open.lastIndex, i - 2));
  }
  return out;
}
function splitTop(body) {
  const parts = [];
  let cur = '', curly = 0, square = 0;
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{') { curly++; cur += two; i++; continue; }
    if (two === '}}') { curly--; cur += two; i++; continue; }
    if (two === '[[') { square++; cur += two; i++; continue; }
    if (two === ']]') { square--; cur += two; i++; continue; }
    if (body[i] === '|' && !curly && !square) { parts.push(cur); cur = ''; continue; }
    cur += body[i];
  }
  parts.push(cur);
  return parts;
}

// ⚠️ A SECTION HEADING IS NOT THE ONLY PLACE A LOAN IS RECORDED. The English
// club pages have no "Out on loan" section at all: the player stays in the
// first-team table with a note, "on loan to Borussia Dortmund until 30 June
// 2027" or just "at Everton until 30 June 2027". Read by heading alone, Jack
// Grealish was a Manchester City player and an Everton player on the same day.
// "on loan FROM" is the opposite case, a player who has arrived, and stays.
const OUT_ON_LOAN = /^(?:on loan (?:to|at)\b|at\s+\S)/i;

function parsePlayers(sectionText) {
  const out = [];
  // Comments can hold a whole commented-out player (a departed one, usually).
  const text = sectionText.replace(/<!--[\s\S]*?-->/g, '');
  for (const body of templates(text, 'football squad player|fs player')) {
    const fields = {};
    for (const f of splitTop(body)) {
      const eq = f.indexOf('=');
      if (eq > -1) fields[f.slice(0, eq).trim().toLowerCase()] = f.slice(eq + 1).trim();
    }
    const nameField = fields.name || '';
    const other = (fields.other || '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').trim();
    // The FIRST link in the name is the player; a second one is "(captain)".
    const link = nameField.match(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
    const bare = nameField.replace(/\{\{[^}]*\}\}/g, '').replace(/<[^>]*>/g, '')
      .replace(/\[\[|\]\]/g, '').replace(/\s*\(.*$/, '').trim();
    if (!link && !bare) continue;
    out.push({
      article: link ? link[1].replace(/_/g, ' ').trim() : null, // exact enwiki title, for the Q-id join
      display: link ? (link[2] || link[1]).trim() : bare,
      no: fields.no ? parseInt(fields.no, 10) || null : null,
      pos: (fields.pos || '').toUpperCase() || null, // GK/DF/MF/FW — Wikipedia's own vocabulary
      nat: fields.nat || null,
      away: OUT_ON_LOAN.test(other) ? other : null,
    });
  }
  return out;
}

const staging = {};
const other = {};                 // club -> { loan: [...], reserve: [...] }
const report = [];
for (const { club, qid, article } of clubIds) {
  const title = article || articleOf[qid];
  if (!title) { report.push(`  ✗ ${club}: no enwiki article`); continue; }
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext'
    + '&format=json&formatversion=2&redirects=1&page=' + encodeURIComponent(title), club);
  const wikitext = j?.parse?.wikitext;
  if (!wikitext) { report.push(`  ✗ ${club}: no wikitext`); continue; }
  const sections = squadSections(wikitext);
  const listed = parsePlayers(sections.first);
  const players = listed.filter((p) => !p.away);
  staging[club] = players;
  other[club] = { loan: parsePlayers(sections.loan).concat(listed.filter((p) => p.away)), reserve: parsePlayers(sections.reserve) };
  report.push(`  ${players.length >= 18 && players.length <= 40 ? '✓' : '⚠️'} ${club.padEnd(20)} ${String(players.length).padStart(2)} players  ← ${j.parse.title}`);
  await new Promise((s) => setTimeout(s, 300));
}

// ── 3. resolve Q-ids from article titles, 50 per call ──────────────────────
const everyone = () => Object.values(staging).flat()
  .concat(Object.values(other).flatMap((o) => o.loan.concat(o.reserve)));
const titles = [...new Set(everyone().map((p) => p.article).filter(Boolean))];
console.log(`\nresolving ${titles.length} player articles to Wikidata ids`);
const qidOfTitle = {};
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops'
    + '&ppprop=wikibase_item&format=json&formatversion=2&redirects=1&titles='
    + encodeURIComponent(batch.join('|')), `qids ${i}`);
  // redirects: map the requested title to the final page it landed on
  const redirect = {};
  for (const r of j?.query?.redirects || []) redirect[r.from] = r.to;
  const norm = {};
  for (const n of j?.query?.normalized || []) norm[n.from] = n.to;
  const byTitle = {};
  for (const pg of j?.query?.pages || []) byTitle[pg.title] = pg.pageprops?.wikibase_item || null;
  for (const t of batch) {
    let key = norm[t] || t;
    key = redirect[key] || key;
    qidOfTitle[t] = byTitle[key] || null;
  }
  await new Promise((s) => setTimeout(s, 300));
}

let withQid = 0, total = 0;
for (const players of Object.values(staging))
  for (const p of players) {
    total++;
    p.qid = p.article ? qidOfTitle[p.article] || null : null;
    if (p.qid) withQid++;
  }
for (const o of Object.values(other))
  for (const p of o.loan.concat(o.reserve)) p.qid = p.article ? qidOfTitle[p.article] || null : null;

writeFileSync(OUT, JSON.stringify(staging, null, 1));
writeFileSync(OUT_OTHER, JSON.stringify(other, null, 1));
console.log(report.join('\n'));
console.log(`\nwrote ${OUT} — ${Object.keys(staging).length} clubs, ${total} players, ${withQid} with a Wikidata id (${(100 * withQid / total).toFixed(1)}%)`);

// ── 4. the diff that motivated all of this ──────────────────────────────────
const OLD = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
console.log('\n— spot-checks against the known defects —');
const mu = staging['Manchester United'] || [];
for (const n of ['Leny Yoro', 'Ayden Heaven', 'Benjamin Šeško', 'Senne Lammens'])
  console.log(`  Man United has ${n.padEnd(16)}: ${mu.some((p) => p.display.includes(n.split(' ').pop())) ? 'YES' : 'no'}`);
for (const ghost of ['Tuanzebe', 'Borthwick-Jackson', 'Joe Riley'])
  console.log(`  ghost ${ghost.padEnd(18)} gone: ${mu.some((p) => p.display.includes(ghost)) ? 'STILL THERE' : 'yes'}`);
const ch = staging['Chelsea'] || [];
console.log(`  Chelsea has Quenda            : ${ch.some((p) => p.display.includes('Quenda')) ? 'YES' : 'no'}`);
const newCount = Object.entries(staging).map(([c, ps]) => {
  const oldIds = new Set((OLD[c] || []).map((p) => p.id));
  return ps.filter((p) => p.qid && !oldIds.has(p.qid)).length;
}).reduce((a, b) => a + b, 0);
console.log(`\nplayers in Wikipedia squads that squads.json does not have: ${newCount}`);
