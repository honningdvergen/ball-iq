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
// ⚠️ WRITES A STAGING FILE ONLY (scripts/_squads-wiki.json). squads.json is
// consumed by the photo pipeline's final rebuild; this file replaces it only
// after the diff is reviewed and the pipeline is idle.
//
// ⚠️ "Out on loan" sections use THE SAME template as the first-team squad. A
// parser that grabs every template on the page files every loanee as a current
// squad member. Sections are therefore classified by their own heading, and
// only first-team/current-squad sections are read.
import { readFileSync, writeFileSync } from 'fs';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const OUT = 'scripts/_squads-wiki.json';

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
const INCLUDE = /first.?team squad|current squad|^squad$/i;
// frauen/féminin matter: several clubs (Basel, Lyon) carry their women's side
// on the SAME article, with an identically-titled "Current squad" subsection.
const EXCLUDE = /loan|reserve|academy|youth|under-\d|u\d\d|women|frauen|f[ée]minin|femenino|former|notable|retired|staff|management/i;

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
  const parts = [];
  const included = [];
  const stack = [];
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    while (stack.length && stack[stack.length - 1].lvl >= h.lvl) stack.pop();
    const ancestorExcluded = stack.some((a) => EXCLUDE.test(a.title));
    const body = wikitext.slice(h.at, heads[i + 1] ? heads[i + 1].at : undefined);
    if (!ancestorExcluded && INCLUDE.test(h.title) && !EXCLUDE.test(h.title)) {
      parts.push(body);
      included.push(stack.map((a) => a.title).concat(h.title).join(' > '));
    }
    stack.push(h);
  }
  if (included.length > 1) console.log(`    (multiple squad sections kept: ${included.join(' | ')})`);
  return parts.join('\n');
}

function parsePlayers(sectionText) {
  const out = [];
  for (const m of sectionText.matchAll(/\{\{\s*(?:football squad player|fs player)[^\S\n]*\d?\s*\|([^}]*)\}\}/gi)) {
    const fields = {};
    for (const f of m[1].split('|')) {
      const eq = f.indexOf('=');
      if (eq > -1) fields[f.slice(0, eq).trim().toLowerCase()] = f.slice(eq + 1).trim();
    }
    const nameField = fields.name || '';
    const link = nameField.match(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
    out.push({
      article: link ? link[1].trim() : null,        // exact enwiki title, for the Q-id join
      display: link ? (link[2] || link[1]).trim() : nameField.replace(/\{\{[^}]*\}\}/g, '').trim(),
      no: fields.no ? parseInt(fields.no, 10) || null : null,
      pos: (fields.pos || '').toUpperCase() || null, // GK/DF/MF/FW — Wikipedia's own vocabulary
      nat: fields.nat || null,
    });
  }
  return out;
}

const staging = {};
const report = [];
for (const { club, qid, article } of clubIds) {
  const title = article || articleOf[qid];
  if (!title) { report.push(`  ✗ ${club}: no enwiki article`); continue; }
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext'
    + '&format=json&formatversion=2&redirects=1&page=' + encodeURIComponent(title), club);
  const wikitext = j?.parse?.wikitext;
  if (!wikitext) { report.push(`  ✗ ${club}: no wikitext`); continue; }
  const players = parsePlayers(squadSections(wikitext));
  staging[club] = players;
  report.push(`  ${players.length >= 18 && players.length <= 40 ? '✓' : '⚠️'} ${club.padEnd(20)} ${players.length} players`);
  await new Promise((s) => setTimeout(s, 300));
}

// ── 3. resolve Q-ids from article titles, 50 per call ──────────────────────
const titles = [...new Set(Object.values(staging).flat().map((p) => p.article).filter(Boolean))];
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

writeFileSync(OUT, JSON.stringify(staging, null, 1));
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
