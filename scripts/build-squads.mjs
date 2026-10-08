// build-squads.mjs — src/data/squads.json from Wikipedia's first-team sections.
//
//   node scripts/fetch-squads-wiki.mjs      staging: first team, loans, reserves
//   node scripts/build-squads.mjs           report only, writes nothing
//   node scripts/build-squads.mjs --write   replace src/data/squads.json
//   (--refresh refetches the per-player evidence instead of reading the cache)
//
// ⚠️ WHY THIS EXISTS. fetch-squads.mjs asks Wikidata who has an open spell at a
// club, and an open spell on Wikidata mostly means nobody closed it. Checked
// row by row on 2026-10-08: 820 of the 1,541 players it had written were not
// at the club (Axel Tuanzebe still at Manchester United, eighteen of eighteen
// wrong at Hajduk Split), and 1,117 who were in a first team were missing,
// Courtois, Camavinga and Neuer among them. fetch-squads-wiki.mjs had been
// reading the right source into a staging file since August. Nothing applied it.
//
// THE RULE, in the order it is applied to each club:
//   1. Wikipedia's first-team section decides who is in the first team.
//   2. A row the old file holds that is NOT in that section (a reserve or an
//      academy player, which is the one thing the Wikidata fetch had and the
//      first-team section does not) stays only where Wikipedia still shows him
//      at the club: in the club's own reserve or academy section, or with a
//      reserve side of the club as `currentclub` in his own infobox, or with
//      the club itself there if he is young enough to be an academy player.
//   3. Everyone else leaves: out on loan, in another club's squad, another
//      club in his infobox, no club in his infobox, a coaching job, a senior
//      player the first-team section does not list, or no article to check.
// Step 3 is deliberately the strict reading. A current squad that shows a
// player who left is the error a user cannot detect, so a row that cannot be
// confirmed is not kept on the strength of the open spell that put it here.
//
// ⚠️ JOINED BY WIKIDATA ID, NEVER BY NAME, same as the staging fetch. A player
// with no Wikipedia article has no id and cannot be a row; the report counts
// them per club so the gap is visible.
//
// ⚠️ A ROW THAT SURVIVES IS NOT REWRITTEN. Position, nationality and dates
// stay exactly as they were, so the diff shows who joined and who left and
// little else. Two exceptions:
//   · a missing slot is filled from the squad template (70 rows had none, and
//     a player with no slot is invisible to the builder's pre-fill);
//   · the NAME is the title of the player's Wikipedia article, for old rows
//     and new. The old names were Wikidata labels, which anyone can edit and
//     which nothing here reviewed: on 2026-10-08 the file held "Αrda Güler"
//     with a Greek capital alpha (typing "Arda" found nobody), "Andrcu Onana"
//     and "Marc Hagit Cucurella", and a legal name where a fan types the short
//     one ("Domilson Cordeiro dos Santos" is Dodô). 30 surviving rows changed.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { NOT_IN_SQUAD, NEVER_AT_CLUB } from './_name-overrides.mjs';

const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const OUT = 'src/data/squads.json';
const EVIDENCE = 'scripts/_squads-evidence.json';

const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const FIRST = JSON.parse(readFileSync('scripts/_squads-wiki.json', 'utf8'));
const OTHER = JSON.parse(readFileSync('scripts/_squads-wiki-other.json', 'utf8'));
const OLD = JSON.parse(readFileSync(OUT, 'utf8'));
const CLUBS = Object.entries(QIDS).map(([club, v]) => ({ club, qid: v.qid }));
const clubOfQid = new Map(CLUBS.map((c) => [c.qid, c.club]));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url, label) {
  for (let a = 1; a <= 5; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      // A failed batch must stop the run. Returning nothing here would read
      // as "no evidence", and no evidence is what removes a player.
      if (a === 5) throw new Error(`${label}: ${e.message}`);
      await sleep(4000 * a);
    }
  }
}
const chunks = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// ── who we need evidence about ──────────────────────────────────────────────
// Every first-team player of a pack club, and every row the old file holds.
const firstTeamOf = new Map();            // player qid -> [club, ...] across ALL fetched clubs
for (const [club, list] of Object.entries(FIRST))
  for (const p of list) if (p.qid) firstTeamOf.set(p.qid, [...(firstTeamOf.get(p.qid) || []), club]);
const sectionOf = (club, kind) => new Set(((OTHER[club] || {})[kind] || []).map((p) => p.qid).filter(Boolean));
const elsewhereOther = new Map();          // player qid -> [club, ...] loan or reserve sections
for (const [club, o] of Object.entries(OTHER))
  for (const p of o.loan.concat(o.reserve)) if (p.qid) elsewhereOther.set(p.qid, [...(elsewhereOther.get(p.qid) || []), club]);

const articleOf = new Map();               // player qid -> enwiki title as the squad template links it
for (const list of Object.values(FIRST)) for (const p of list) if (p.qid && p.article) articleOf.set(p.qid, p.article);
const need = new Set();
for (const { club } of CLUBS) {
  for (const p of FIRST[club] || []) if (p.qid) need.add(p.qid);
  for (const p of OLD[club] || []) need.add(p.id);
}

// ── evidence: Wikidata facts, the player's infobox, the team it names ───────
let EV = !REFRESH && existsSync(EVIDENCE) ? JSON.parse(readFileSync(EVIDENCE, 'utf8')) : { players: {}, teams: {}, nations: {} };
const todo = [...need].filter((id) => !EV.players[id]);
if (todo.length) {
  console.log(`evidence to fetch: ${todo.length} players`);
  // 1. Wikidata: the article title (for rows the staging file has no link
  //    for), the birth date, and when the spell at each club started.
  for (const batch of chunks(todo, 50)) {
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
      + '&props=sitelinks|claims&sitefilter=enwiki&ids=' + batch.join('|'), 'wikidata entities');
    for (const id of batch) {
      const ent = j.entities?.[id] || {};
      const time = (c) => c?.mainsnak?.datavalue?.value?.time || null;
      const dobRaw = (ent.claims?.P569 || []).map(time).find(Boolean);
      const spells = (ent.claims?.P54 || []).map((c) => ({
        team: c.mainsnak?.datavalue?.value?.id || null,
        start: c.qualifiers?.P580?.[0]?.datavalue?.value?.time?.slice(1, 11) || null,
        open: !c.qualifiers?.P582,
      })).filter((s) => s.team && clubOfQid.has(s.team) && s.start);
      EV.players[id] = {
        title: ent.sitelinks?.enwiki?.title || articleOf.get(id) || null,
        // Wikidata pads an unknown month or day with 00; that is not a date.
        wdDob: dobRaw && !/-00/.test(dobRaw) ? dobRaw.slice(1, 11) : null,
        wdBorn: dobRaw ? Number(dobRaw.slice(1, 5)) : null,
        spells,
      };
    }
    if (process.stdout.isTTY) process.stdout.write(`  wikidata ${Object.keys(EV.players).length}\r`);
    await sleep(200);
  }
  // 2. The infobox: section 0 of each player's own article.
  const byTitle = new Map(todo.filter((id) => EV.players[id].title).map((id) => [EV.players[id].title, id]));
  let done = 0;
  for (const batch of chunks([...byTitle.keys()], 25)) {
    let cont = '';
    const seen = {};
    do {
      const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2'
        + '&prop=revisions&rvprop=content&rvslots=main&rvsection=0&redirects=1&titles='
        + encodeURIComponent(batch.join('|')) + cont, 'infobox');
      const back = {};                     // final title -> the title we asked for
      for (const n of j.query?.normalized || []) back[n.to] = n.from;
      for (const r of j.query?.redirects || []) back[r.to] = back[r.from] || r.from;
      for (const pg of j.query?.pages || []) {
        const text = pg.revisions?.[0]?.slots?.main?.content;
        if (text != null) seen[back[pg.title] || pg.title] = text;
      }
      cont = j.continue ? '&' + new URLSearchParams(j.continue).toString() : '';
    } while (cont);
    for (const t of batch) {
      const ev = EV.players[byTitle.get(t)];
      Object.assign(ev, readInfobox(seen[t]));
      done++;
    }
    if (process.stdout.isTTY) process.stdout.write(`  infobox ${done}/${byTitle.size}        \r`);
    await sleep(200);
  }
  writeFileSync(EVIDENCE, JSON.stringify(EV));
}

function field(text, name) {
  const m = text.match(new RegExp('^\\s*\\|\\s*' + name + '\\s*=[^\\S\\n]*([^\\n]*)', 'mi'));
  return m ? m[1].replace(/<ref[^>]*>[\s\S]*?<\/ref>|<ref[^>]*\/>|<!--[\s\S]*?-->/g, '').trim() : null;
}
function readInfobox(text) {
  if (text == null) return { infobox: false };
  const cc = field(text, 'currentclub');
  const link = cc && cc.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/);
  const pos = field(text, 'position');
  const bd = (field(text, 'birth_date') || '').replace(/\|\s*[a-z]+\s*=[^|}]*/gi, '');
  const d = bd.match(/\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/);
  return {
    infobox: /\{\{\s*infobox football biography/i.test(text),
    cc: cc || null,
    ccTitle: link ? link[1].replace(/_/g, ' ').trim() : null,
    pos: pos ? pos.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/\{\{[^}]*\}\}/g, ' ').replace(/<[^>]*>/g, ', ').trim() : null,
    dob: d ? `${d[1]}-${d[2].padStart(2, '0')}-${d[3].padStart(2, '0')}` : null,
  };
}

// 3. The team each infobox names, by Wikidata id, and whose team it is. A
//    reserve side is its own entity ("Real Madrid Castilla", "Jong Ajax"); its
//    parent club is a claim on that entity, not something to guess from a name.
{
  const teamTitles = [...new Set(Object.values(EV.players).map((p) => p.ccTitle).filter(Boolean))].filter((t) => !EV.teams[t]);
  for (const batch of chunks(teamTitles, 50)) {
    const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item'
      + '&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(batch.join('|')), 'team ids');
    const fwd = {};
    for (const n of j.query?.normalized || []) fwd[n.from] = n.to;
    const red = {};
    for (const r of j.query?.redirects || []) red[r.from] = r.to;
    const item = {};
    for (const pg of j.query?.pages || []) item[pg.title] = pg.pageprops?.wikibase_item || null;
    for (const t of batch) {
      const n = fwd[t] || t;
      const final = red[n] || n;
      EV.teams[t] = { final, qid: item[final] || null, parents: [] };
    }
    await sleep(200);
  }
  const teamQids = [...new Set(teamTitles.map((t) => EV.teams[t].qid).filter(Boolean))];
  const parentsOf = {};
  for (const batch of chunks(teamQids, 50)) {
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids='
      + batch.join('|'), 'team parents');
    for (const id of batch) {
      const cl = j.entities?.[id]?.claims || {};
      // P831 parent club, P749 parent organisation, P361 part of, P127 owned by.
      parentsOf[id] = ['P831', 'P749', 'P361', 'P127'].flatMap((p) => (cl[p] || [])
        .map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean));
    }
    await sleep(200);
  }
  for (const t of teamTitles) if (EV.teams[t].qid) EV.teams[t].parents = parentsOf[EV.teams[t].qid] || [];

  // 4. Nationality: the squad template carries a FIFA code ("CIV"). Wikipedia
  //    resolves the code itself, through the redirect on "Template:Country
  //    data CIV", so the name is read from there and not from a table of ours.
  const codes = [...new Set(CLUBS.flatMap(({ club }) => (FIRST[club] || []).map((p) => p.nat)).filter(Boolean))].filter((c) => !(c in EV.nations));
  for (const batch of chunks(codes, 50)) {
    const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&titles='
      + encodeURIComponent(batch.map((c) => 'Template:Country data ' + c).join('|')), 'nation codes');
    const fwd = {};
    for (const n of j.query?.normalized || []) fwd[n.from] = n.to;
    const red = {};
    for (const r of j.query?.redirects || []) red[r.from] = r.to;
    const missing = new Set((j.query?.pages || []).filter((pg) => pg.missing).map((pg) => pg.title));
    for (const c of batch) {
      const n = fwd['Template:Country data ' + c] || 'Template:Country data ' + c;
      const final = red[n] || n;
      EV.nations[c] = missing.has(final) ? null : final.replace(/^Template:Country data /, '');
    }
    await sleep(200);
  }
  if (teamTitles.length || codes.length) writeFileSync(EVIDENCE, JSON.stringify(EV));
}

// ── where does a player's own article say he is ─────────────────────────────
const clubArticle = Object.fromEntries(CLUBS.map(({ club, qid }) => {
  const hit = Object.values(EV.teams).find((t) => t.qid === qid);
  return [club, hit ? hit.final : null];
}));
// Reserve sides whose Wikidata entity names no parent club, so the link has
// to be stated. Each was read off the side's own Wikipedia article.
const RESERVE_OF = {
  Q114056326: 'Q187528',   // RSCA Futures -> R.S.C. Anderlecht
  Q101625593: 'Q190916',   // Club NXT -> Club Brugge K.V.
};
// A club in the infobox is not always a playing contract: Rodrigo Caio's reads
// "Flamengo (assistant)" and Marko Vejinović's "Feyenoord Academy (coach)".
const STAFF = /\b(coach|assistant|manager|collaborator|scout|director|staff|analyst|ambassador)\b/i;
/** 'reserve' | 'here' | 'other' | 'none' | 'unknown' for player `id` against `club`. */
function infoboxSays(id, club, qid) {
  const ev = EV.players[id];
  if (!ev || !ev.title || ev.infobox === false) return 'unknown';   // no article, or not a footballer's
  if (!ev.cc || /free agent|retired|unattached|without a club/i.test(ev.cc) || STAFF.test(ev.cc)) return 'none';
  // A club written as plain text is a club too small to have an article, so
  // it is not one of ours, unless the text is this club's own name.
  if (!ev.ccTitle) return fold(ev.cc).includes(fold(club)) ? 'unknown' : 'other';
  const team = EV.teams[ev.ccTitle];
  if (!team) return 'unknown';
  if (team.qid === qid) return 'here';
  if (team.parents.includes(qid) || RESERVE_OF[team.qid] === qid) return 'reserve';
  // "Manchester United F.C. Under-21s and Academy" has no parent claim on
  // Wikidata. Its title starts with the club's own article title, which is
  // the same exact-string evidence, one step removed.
  if (clubArticle[club] && team.final.startsWith(clubArticle[club] + ' ')) return 'reserve';
  return 'other';
}
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const saysWhere = (id) => { const ev = EV.players[id] || {}; return ev.ccTitle ? (EV.teams[ev.ccTitle]?.final || ev.ccTitle) : (ev.cc || 'no club').replace(/<[^>]*>|\{\{[^}]*\}\}|[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim(); };
// Under-23 on the day this runs. An academy player the first-team section
// does not list is expected; a 29-year-old it does not list has left, and
// his own article is the page nobody updated.
const ACADEMY_BORN = new Date().getFullYear() - 23;

// ⚠️ AN INFOBOX IS ONLY AS CURRENT AS ITS LAST EDIT. That does not matter for
// leaving a squad (the club's own page decides that) but it does for saying
// where a player WENT: the independent check of the first run found Jonathan
// Marlone "at Chapecoense" from an article nobody had touched since he moved
// on. A destination is printed only from an article edited since the start of
// the current season's summer window; otherwise the club is left blank.
const SEASON_START = (() => { const d = new Date(); return `${d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1}-07-01`; })();
const fresh = (id) => (EV.players[id]?.touched || '') >= SEASON_START;
{
  const ask = CLUBS.flatMap(({ club }) => (OLD[club] || []).map((p) => p.id))
    .filter((id) => EV.players[id]?.title && EV.players[id].touched === undefined);
  const byTitle = new Map(ask.map((id) => [EV.players[id].title, id]));
  for (const batch of chunks([...byTitle.keys()], 50)) {
    const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2'
      + '&prop=revisions&rvprop=timestamp&redirects=1&titles=' + encodeURIComponent(batch.join('|')), 'last edits');
    const back = {};
    for (const n of j.query?.normalized || []) back[n.to] = n.from;
    for (const r of j.query?.redirects || []) back[r.to] = back[r.from] || r.from;
    for (const t of batch) EV.players[byTitle.get(t)].touched = null;
    for (const pg of j.query?.pages || []) {
      const id = byTitle.get(back[pg.title] || pg.title);
      if (id) EV.players[id].touched = pg.revisions?.[0]?.timestamp?.slice(0, 10) || null;
    }
    await sleep(200);
  }
  if (ask.length) writeFileSync(EVIDENCE, JSON.stringify(EV));
}

// ── position words ──────────────────────────────────────────────────────────
// The squad template gives the line (GK/DF/MF/FW). The WORD comes from the
// player's infobox, in the vocabulary the file already uses, and only when it
// sits in the line the squad template says. Otherwise the plain word for the
// line: the weakest claim the two sources both support.
const WORDS = [
  [/goalkeeper|keeper/, 'goalkeeper', 'GK'],
  [/wing.?back/, 'wing-back', 'DF'],
  [/(left|right|full).?back/, 'full-back', 'DF'],
  [/cent(re|er).?back|central defender|cent(re|er).?half/, 'centre-back', 'DF'],
  [/defensive mid|holding mid/, 'defensive midfielder', 'MF'],
  [/attacking mid/, 'attacking midfielder', 'MF'],
  [/central mid/, 'central midfielder', 'MF'],
  [/midfield/, 'midfielder', 'MF'],
  [/defender/, 'defender', 'DF'],
  [/winger|wide forward/, 'winger', 'FW'],
  [/second striker/, 'forward', 'FW'],
  [/striker|cent(re|er).?forward/, 'centre-forward', 'FW'],
  [/forward|attacker/, 'forward', 'FW'],
];
const PLAIN = { GK: 'goalkeeper', DF: 'defender', MF: 'midfielder', FW: 'forward' };
function positionFor(slot, infoboxPos) {
  const terms = String(infoboxPos || '').toLowerCase().split(/,|\/|;|\band\b|\bor\b/).map((t) => t.trim()).filter(Boolean);
  for (const t of terms) {
    const w = WORDS.find(([re]) => re.test(t));
    if (w && w[2] === slot) return w[1];
  }
  return PLAIN[slot] || null;
}
const slotFromWords = (infoboxPos) => {
  const t = String(infoboxPos || '').toLowerCase();
  const w = WORDS.find(([re]) => re.test(t));
  return w ? w[2] : null;
};

function sameName(name, entries) {
  const toks = (s) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
  const a = toks(name);
  return entries.find((e) => {
    const b = toks(e.display);
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    return short.length >= 2 && short.every((t) => long.includes(t));
  }) || null;
}

// ── build ───────────────────────────────────────────────────────────────────
const nameOf = (id, fallback) => (EV.players[id]?.title || fallback).replace(/\s*\([^)]*\)$/, '');
const oldRow = new Map();                  // any row the old file holds for this id
for (const list of Object.values(OLD)) for (const p of list) if (!oldRow.has(p.id)) oldRow.set(p.id, p);

// ⚠️ LEAVING A SQUAD MUST NOT REMOVE A PLAYER FROM THE LINEUP BUILDER. For 565
// of the players the 2026-10-08 refresh took out, the stale squad row was the
// only reason the builder knew them at all (Adama Traoré, Adrià Pedrosa): not
// famous enough for the Mystery core, so no other source carries them. They
// are kept in scripts/_squads-departed.json with the club Wikipedia names,
// build-lineup-data.mjs reads it, and each refresh adds to it.
const DEPARTED = 'scripts/_squads-departed.json';
const departed = new Map((existsSync(DEPARTED) ? JSON.parse(readFileSync(DEPARTED, 'utf8')) : []).map((p) => [p.id, p]));
const out = {};
const report = [];
const log = { kept: [], left: [], joined: [], renamed: [], disputed: [], conflict: [], byName: [], noId: [], slotDiffers: [] };
for (const { club, qid } of CLUBS) {
  const old = OLD[club] || [];
  const oldIds = new Set(old.map((p) => p.id));
  const loan = sectionOf(club, 'loan'), reserve = sectionOf(club, 'reserve');
  const rows = new Map();
  const first = (FIRST[club] || []);
  for (const p of first.filter((x) => !x.qid)) log.noId.push(`${club}: ${p.display}`);

  for (const w of first) {
    if (!w.qid || rows.has(w.qid)) continue;
    // A player in two first-team sections is at one of them. His own article
    // says which; only when it names the OTHER club does this one lose him.
    const listedAt = firstTeamOf.get(w.qid) || [];
    const says = infoboxSays(w.qid, club, qid);
    if (listedAt.length > 1 && says === 'other') {
      log.disputed.push(`${club}: ${w.display} is also in ${listedAt.filter((c) => c !== club).join(', ')}; his article says ${saysWhere(w.qid)} → not kept here`);
      continue;
    }
    if (says === 'other') log.conflict.push(`${club}: ${w.display} is in the first-team section; his article says ${saysWhere(w.qid)}`);
    const ev = EV.players[w.qid] || {};
    const slot = ['GK', 'DF', 'MF', 'FW'].includes(w.pos) ? w.pos : slotFromWords(ev.pos);
    const prev = old.find((p) => p.id === w.qid);
    if (prev) {
      if (prev.slot && slot && prev.slot !== slot) log.slotDiffers.push(`${club}: ${prev.name} is ${prev.slot} (${prev.position}) here, ${slot} in the squad template`);
      const name = nameOf(w.qid, prev.name);
      if (name !== prev.name) log.renamed.push(`${club}: "${prev.name}" → "${name}"`);
      rows.set(w.qid, prev.slot ? { ...prev, name } : { ...prev, name, position: prev.position || positionFor(slot, ev.pos), slot });
      continue;
    }
    const known = oldRow.get(w.qid);       // moved between two of our clubs
    // Wikidata writes an unknown month or day as 00; the file's dates are real ones.
    const started = (ev.spells || []).filter((s) => s.team === qid && s.open).map((s) => s.start.replace(/-00/g, '-01')).sort().pop() || null;
    const dob = known?.dob || ev.dob || ev.wdDob || null;
    rows.set(w.qid, {
      id: w.qid,
      name: nameOf(w.qid, w.article || w.display),
      position: positionFor(slot, ev.pos),
      slot,
      nat: known?.nat || (EV.nations[w.nat] || '').replace(/\s*\([^)]*\)$/, '') || null,
      born: known?.born || (dob ? Number(dob.slice(0, 4)) : ev.wdBorn || null),
      dob,
      started,
    });
    log.joined.push(`${club}: ${rows.get(w.qid).name}`);
  }

  // The rows the old file holds that the first-team section does not.
  for (const p of old) {
    if (rows.has(p.id)) continue;
    const says = infoboxSays(p.id, club, qid);
    const inFirstElsewhere = (firstTeamOf.get(p.id) || []).filter((c) => c !== club);
    const inOtherElsewhere = (elsewhereOther.get(p.id) || []).filter((c) => c !== club);
    // No article means no id in the squad template either, so the one way such
    // a row can be confirmed is its name, inside THIS club's own sections. That
    // is a far narrower match than the cross-file name joins this repo bans:
    // thirty names, one club, and every word of the shorter name must be in
    // the longer ("Sami Bircan" is "Ahmet Sami Bircan").
    const unlinked = says === 'unknown' ? sameName(p.name, first.concat((OTHER[club] || {}).reserve || []).filter((x) => !x.qid)) : null;
    let why = null;
    if ((firstTeamOf.get(p.id) || []).includes(club)) why = 'in two first-team sections and his article names the other club';
    else if (loan.has(p.id)) why = 'out on loan';
    else if (inFirstElsewhere.length) why = `in the first team at ${inFirstElsewhere.join(', ')}`;
    else if (says === 'other') why = `his article says ${saysWhere(p.id)}`;
    else if (reserve.has(p.id) || says === 'reserve') why = null;
    else if (says === 'here') why = (p.born || 0) >= ACADEMY_BORN ? null : 'a senior player the first-team section does not list';
    else if (inOtherElsewhere.length) why = `listed at ${inOtherElsewhere.join(', ')}`;
    else if (says === 'none') why = 'no current club in his article';
    else if (unlinked) why = null;
    else why = 'no article to confirm him';
    if (why) {
      log.left.push(`${club}: ${p.name} — ${why}`);
      // Where he went, for the lineup builder: he leaves the squad, not the
      // search. Only a club his own article or another squad section names.
      const at = inFirstElsewhere[0] || ((says === 'other' || says === 'reserve') && fresh(p.id) ? saysWhere(p.id) : null);
      departed.set(p.id, { id: p.id, name: nameOf(p.id, p.name), slot: p.slot || slotFromWords(EV.players[p.id]?.pos), nat: p.nat || null, born: p.born || null, club: at || null });
      continue;
    }
    const listed = unlinked || ((OTHER[club] || {}).reserve || []).find((x) => x.qid === p.id);
    const slot = p.slot || (listed && ['GK', 'DF', 'MF', 'FW'].includes(listed.pos) ? listed.pos : slotFromWords(EV.players[p.id]?.pos));
    const name = nameOf(p.id, p.name);
    if (name !== p.name) log.renamed.push(`${club}: "${p.name}" → "${name}"`);
    rows.set(p.id, p.slot ? { ...p, name } : { ...p, name, position: p.position || positionFor(slot, EV.players[p.id]?.pos), slot });
    if (unlinked) log.byName.push(`${club}: ${p.name} = "${unlinked.display}" in the club's own section`);
    log.kept.push(`${club}: ${p.name} — ${reserve.has(p.id) ? 'in the reserve or academy section' : unlinked ? 'named, unlinked, in the club\'s own section' : says === 'reserve' ? `his article says ${saysWhere(p.id)}` : 'his article names the club and he is academy age'}`);
  }

  let squad = [...rows.values()].filter((p) => {
    const why = NOT_IN_SQUAD[p.id] || (NEVER_AT_CLUB[p.id]?.squad === club && NEVER_AT_CLUB[p.id].why);
    if (why) console.log(`  ✗ ${club}: dropped ${p.name} — ${why}`);
    return !why;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Same gate as fetch-squads.mjs, for the same reason: a squad far outside a
  // real one means a section was misread, and that must not ship quietly.
  const sane = squad.length >= 14 && squad.length <= 45;
  if (sane) out[club] = squad;
  const stayed = squad.filter((p) => oldIds.has(p.id)).length;
  report.push(`  ${sane ? '✓' : '⚠️ REJECTED'} ${club.padEnd(20)} ${String(old.length).padStart(2)} → ${String(squad.length).padStart(2)}`
    + `   stayed ${String(stayed).padStart(2)} · joined ${String(squad.length - stayed).padStart(2)} · left ${String(old.length - stayed).padStart(2)}`
    + `   no slot ${squad.filter((p) => !p.slot).length}`);
}

// A player may be in ONE squad. The pool builder labels him with whichever it
// reads last and the lineup builder with whichever it reads first, so two rows
// are two different answers to the same question.
const seenAt = new Map();
for (const [club, squad] of Object.entries(out)) for (const p of squad) seenAt.set(p.id, [...(seenAt.get(p.id) || []), club]);
const twice = [...seenAt].filter(([, cs]) => cs.length > 1);

const count = (o) => Object.values(o).flat().length;
console.log(report.join('\n'));
console.log(`\n${Object.keys(OLD).length} clubs, ${count(OLD)} players  →  ${Object.keys(out).length} clubs, ${count(out)} players`);
console.log(`  joined ${log.joined.length} · left ${log.left.length} · kept outside the first-team section ${log.kept.length}`);
console.log(`  first-team players with no Wikipedia article (cannot be a row): ${log.noId.length}`);
console.log(`  listed by two clubs, settled by the player's own article: ${log.disputed.length}`);
console.log(`  in a first-team section while his own article names another club (kept, listed in the log): ${log.conflict.length}`);
console.log(`  rows with no article, confirmed by name inside the club's own section: ${log.byName.length}`);
console.log(`  surviving rows renamed to their article title: ${log.renamed.length}`);
console.log(`  existing rows whose slot differs from the squad template (left as they were): ${log.slotDiffers.length}`);
const whyCount = {};
for (const l of log.left) { const k = l.split(' — ')[1].replace(/ at .*| says .*/, ''); whyCount[k] = (whyCount[k] || 0) + 1; }
console.log('  why they left:', JSON.stringify(whyCount));
if (twice.length) {
  console.error(`\n✗ ${twice.length} player(s) are in two squads:`);
  twice.forEach(([id, cs]) => console.error(`    ${id}  ${cs.join(' / ')}`));
}
writeFileSync('/tmp/squads-build-log.json', JSON.stringify(log, null, 1));
console.log('  → every decision is listed in /tmp/squads-build-log.json');

if (twice.length) process.exit(1);
if (WRITE) {
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  for (const id of seenAt.keys()) departed.delete(id);          // back in a squad
  writeFileSync(DEPARTED, JSON.stringify([...departed.values()].sort((a, b) => a.name.localeCompare(b.name)), null, 1));
  console.log(`\nwrote ${OUT} and ${DEPARTED} (${departed.size} players who have left a squad)`);
} else console.log('\n(report only; --write replaces src/data/squads.json)');
