// gen-top10.mjs: build src/data/top10Lists.json from scripts/top10/specs.mjs.
//
//   node scripts/gen-top10.mjs            # write the file, print a summary
//   node scripts/gen-top10.mjs --print    # also print every list, for review
//   node scripts/gen-top10.mjs --check    # exit 1 if the file on disk is stale
//   node scripts/gen-top10.mjs --all      # include lists not yet fact-checked
//   node scripts/gen-top10.mjs --stdout   # print the JSON instead of writing it
//
// ⚠️ ONLY FACT-CHECKED LISTS REACH THE FILE. A list without a `checked` date is
// built and validated like any other, then left out, so nothing unverified can
// ship in a bundle or be opened by its id. --all is for looking at candidates
// on a development server; the build runs --check WITHOUT it, so a file written
// with --all fails the build rather than reaching production.
//
// What it guarantees, because the game cannot check these at run time:
//   - every list has exactly ten slots, no name twice
//   - a derived list's cut is clean: the tenth and eleventh names never come
//     from the same shared row, which would make "the last ten" a matter of
//     opinion
//   - every answer is in the pool the guess box offers, under ONE name, and no
//     two pool entries answer to the same spelling
//   - every scheduled list carries a `checked` date, and is scheduled for a
//     day BEFORE its `until`: the date of the next final or ceremony that
//     could change it. A list of "the last ten winners" is true until the
//     eleventh, and not a day longer.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { normaliseName } from '../src/lib/mysteryPlayer.js';
import { LISTS } from './seo/lists.mjs';
import { LEAGUES } from './seo/leagues.mjs';
import {
  TOP10_SPECS, TOP10_LOG, TOP10_ANCHOR_DAY, CLUB_CANON, CLUB_AKA, NATION_CANON, NATION_AKA, MORE_NATIONS, PLAYER_PINS,
} from './top10/specs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/top10Lists.json');
// How many days are scheduled: the one fact Home needs, in a module of its own
// so Home never has to load the lists to know whether there is one today.
const META = resolve(ROOT, 'src/data/top10Meta.js');
const args = new Set(process.argv.slice(2));

// The app's own folding, imported rather than copied, so a key built here is
// the key the game computes for the same name.
const fold = normaliseName;

const NATION_TABLES = new Set([
  'world-cup-winners', 'euro-winners', 'afcon-winners', 'copa-america-winners',
  'asian-cup-winners', 'concacaf-gold-cup-winners',
]);
const NOT_A_NAME = /^(not |no title|none$|—$|-$|tbd)/i;

// "Mohamed Salah, Sadio Mane" and "Lothar Emmerich / Gerd Müller" are shared
// awards; "Milan (2nd on the pitch)" and "Gárate (shared)" carry a note.
const cellNames = (cell) => (NOT_A_NAME.test(String(cell || '').trim()) ? '' : String(cell || ''))
  .split(/\s*\/\s*|,\s+|;\s*/)
  .map((s) => s.replace(/\s*\([^)]*\)\s*$/, '').trim())
  .filter((s) => s && !NOT_A_NAME.test(s));

const errors = [];
const warn = [];
const fail = (m) => errors.push(m);

// ── CLUBS AND NATIONS: one registry each ─────────────────────────────────────
function registry(canonMap, akaMap) {
  const byKey = new Map(); // folded canonical name -> { name, aka:Set, w }
  const canon = (raw) => canonMap[fold(raw)] || raw;
  const add = (raw) => {
    const name = canon(raw);
    const key = fold(name);
    const cur = byKey.get(key);
    if (!cur) byKey.set(key, { name, aka: new Set(), w: 0 });
    // Prefer the spelling with its accents: "Atlético Madrid" over "Atletico Madrid".
    else if (name !== cur.name && name.normalize('NFD').length > cur.name.normalize('NFD').length) cur.name = name;
    // Every appearance in a table of winners and finalists counts once. It is
    // the only "how big is this club" we hold, and it is enough to put
    // Liverpool above Livorno when someone types "liv" (seen in the simulator
    // on 2026-10-09 the other way round).
    byKey.get(key).w += 1;
    return byKey.get(key).name;
  };
  const finish = () => {
    for (const [name, akas] of Object.entries(akaMap)) {
      const e = byKey.get(fold(name));
      if (!e) continue;
      for (const a of akas) e.aka.add(a);
    }
    // A raw spelling that was folded into a canonical name stays typeable.
    for (const [rawKey, name] of Object.entries(canonMap)) {
      const e = byKey.get(fold(name));
      if (e && rawKey !== fold(e.name)) e.aka.add(rawKey);
    }
    const out = [...byKey.values()].map((e) => {
      const key = fold(e.name);
      // One entry per spelling once folded: "Koln" and "koln" are the same key.
      const akaSeen = new Set([key]);
      const aka = [...e.aka].filter((a) => !akaSeen.has(fold(a)) && akaSeen.add(fold(a)));
      return { key, name: e.name, ...(aka.length ? { aka } : {}), ...(e.w > 1 ? { w: e.w } : {}) };
    }).sort((a, b) => a.name.localeCompare(b.name));
    // No spelling may lead to two entries.
    const seen = new Map();
    for (const e of out) for (const k of [e.key, ...(e.aka || []).map(fold)]) {
      if (seen.has(k) && seen.get(k) !== e.name) fail(`"${k}" answers to both ${seen.get(k)} and ${e.name}`);
      seen.set(k, e.name);
    }
    return out;
  };
  return { add, canon: (raw) => byKey.get(fold(canon(raw)))?.name || canon(raw), finish };
}

const clubs = registry(CLUB_CANON, CLUB_AKA);
const nations = registry(NATION_CANON, NATION_AKA);

for (const l of LISTS) {
  const reg = NATION_TABLES.has(l.slug) ? nations : clubs;
  l.columns.forEach((col, i) => {
    if (!/^(Winner|Runner-up|Champions|Club|Club\(s\))$/.test(col)) return;
    if (col === 'Winner' && /ballon/.test(l.slug)) return; // players
    for (const r of l.rows) for (const n of cellNames(r[i])) reg.add(n);
  });
}
for (const lg of LEAGUES) for (const c of lg.clubs) clubs.add(c.name);
for (const n of MORE_NATIONS) nations.add(n);

// ── PLAYERS: resolve against the pool the guess box already uses ─────────────
const pool = JSON.parse(readFileSync(resolve(ROOT, 'src/data/mysteryPool.json'), 'utf8'));
const poolByKey = new Map();
for (const p of pool) {
  const k = fold(p.name);
  if (!poolByKey.has(k)) poolByKey.set(k, []);
  poolByKey.get(k).push(p);
}
const extras = new Map(); // key -> { key, name }
function player(raw, ownPin) {
  const k = fold(raw);
  const pin = ownPin || PLAYER_PINS[k];
  const hits = poolByKey.get(k) || [];
  if (pin) {
    const p = pool.find((x) => x.id === pin);
    if (!p) fail(`pin ${pin} for "${raw}" is not in the pool`);
    return p ? { key: p.id, name: p.name } : { key: `x:${k}`, name: raw };
  }
  if (hits.length === 1) return { key: hits[0].id, name: hits[0].name };
  if (hits.length > 1) {
    // Two footballers, one name. Fame separates them nine times in ten, but a
    // wrong guess here credits the wrong man, so it has to be pinned by hand.
    fail(`"${raw}" is ${hits.length} players in the pool (${hits.map((h) => `${h.id} b.${h.born}`).join(', ')}): add a pin`);
    return { key: hits[0].id, name: hits[0].name };
  }
  const key = `x:${k}`;
  if (!extras.has(key)) extras.set(key, { key, name: raw });
  return { key, name: extras.get(key).name };
}

// ── DERIVE ───────────────────────────────────────────────────────────────────
const season = (s) => String(s).replace(/^(\d{4})-(\d{2,4})$/, '$1–$2');
const tables = new Map(LISTS.map((l) => [l.slug, l]));

function derive(spec) {
  const t = tables.get(spec.derive.list);
  if (!t) { fail(`${spec.id}: no table "${spec.derive.list}"`); return null; }
  const idx = spec.derive.cols.map((c) => t.columns.indexOf(c));
  if (idx.includes(-1)) { fail(`${spec.id}: table ${t.slug} has no column ${spec.derive.cols}`); return null; }
  const name = (raw) => {
    if (spec.kind === 'player') return player(raw, spec.pins?.[fold(raw)]);
    const reg = spec.kind === 'nation' ? nations : clubs;
    const n = reg.canon(raw);
    return { key: fold(n), name: n };
  };
  const out = [];
  const seen = new Set();
  for (let r = t.rows.length - 1; r >= 0; r--) {
    const fresh = [];
    for (const i of idx) for (const raw of cellNames(t.rows[r][i])) {
      const e = name(raw);
      if (seen.has(e.key) || fresh.some((f) => f.key === e.key)) continue;
      fresh.push(e);
    }
    if (!fresh.length) continue;
    if (out.length < 10 && out.length + fresh.length > 10) {
      fail(`${spec.id}: the cut at ten falls inside ${t.rows[r][0]} (${fresh.map((f) => f.name).join(', ')})`);
      return null;
    }
    for (const e of fresh) { seen.add(e.key); out.push({ ...e, clue: `${spec.cluePrefix || ''}${season(t.rows[r][0])}` }); }
    if (spec.derive.mode === 'last-different' && out.length >= 13) break;
  }
  if (spec.derive.mode === 'all-winners' && out.length !== 10) {
    fail(`${spec.id}: "every" list has ${out.length} names, not ten`);
    return null;
  }
  if (out.length < 10) { fail(`${spec.id}: only ${out.length} names`); return null; }
  return {
    slots: out.slice(0, 10),
    near: out.slice(10, 10 + (spec.nearMax ?? 3)).map((e, i) => ({ key: e.key, name: e.name, note: `${11 + i}th, last in ${e.clue}` })),
    asOf: t.updated,
    source: `lists:${t.slug}`,
  };
}

function explicit(spec) {
  const name = (s) => {
    if (spec.kind === 'player') return player(s.name, s.pin);
    const reg = spec.kind === 'nation' ? nations : clubs;
    const n = reg.add(s.name);
    return { key: fold(n), name: n };
  };
  if (!spec.asOf || !spec.source) fail(`${spec.id}: an explicit list needs asOf and source`);
  return {
    slots: (spec.slots || []).map((s) => ({ ...name(s), clue: String(s.clue ?? '') })),
    near: (spec.near || []).map((s) => ({ ...name(s), note: s.note })),
    asOf: spec.asOf,
    source: spec.source,
  };
}

const lists = {};
const untilOf = {};
for (const spec of TOP10_SPECS) {
  if (lists[spec.id]) { fail(`duplicate id ${spec.id}`); continue; }
  if (!['player', 'club', 'nation'].includes(spec.kind)) { fail(`${spec.id}: kind ${spec.kind}`); continue; }
  const body = spec.derive ? derive(spec) : explicit(spec);
  if (!body) continue;
  if (body.slots.length !== 10) fail(`${spec.id}: ${body.slots.length} slots`);
  const keys = body.slots.map((s) => s.key);
  if (new Set(keys).size !== keys.length) fail(`${spec.id}: a name appears twice`);
  for (const n of body.near) if (keys.includes(n.key)) fail(`${spec.id}: ${n.name} is both in the ten and just outside it`);
  // Names that are a fair answer to this list only (see slotIndexFor).
  for (const [name, others] of Object.entries(spec.also || {})) {
    const reg = spec.kind === 'nation' ? nations : clubs;
    const slot = body.slots.find((s) => s.name === (spec.kind === 'player' ? name : reg.canon(name)));
    if (!slot) { fail(`${spec.id}: also names "${name}", which is not one of the ten`); continue; }
    slot.also = others.map((o) => {
      const e = spec.kind === 'player' ? player(o) : { key: fold(reg.add(o)) };
      if (keys.includes(e.key) || body.near.some((n) => n.key === e.key)) fail(`${spec.id}: "${o}" is already on the list in its own right`);
      return e.key;
    });
  }
  if (spec.checked && !/^\d{4}-\d{2}-\d{2}$/.test(spec.until || '')) fail(`${spec.id}: a checked list needs an until date`);
  lists[spec.id] = {
    id: spec.id, kind: spec.kind, title: spec.title, clueLabel: spec.clueLabel || '',
    asOf: body.asOf, source: body.source, checked: spec.checked || null,
    slots: body.slots, ...(body.near.length ? { near: body.near } : {}),
  };
  untilOf[spec.id] = spec.until || null;
}

const ymdOfDay = (day) => new Date(day * 86400000).toISOString().slice(0, 10);
TOP10_LOG.forEach((id, i) => {
  if (!lists[id]) { fail(`schedule names "${id}", which is not a list`); return; }
  if (!lists[id].checked) { fail(`schedule names "${id}", which has no checked date`); return; }
  const plays = ymdOfDay(TOP10_ANCHOR_DAY + i);
  if (plays >= untilOf[id]) fail(`Top 10 #${i + 1} (${plays}) is "${id}", which can change on ${untilOf[id]}: move it earlier`);
});
if (new Set(TOP10_LOG).size !== TOP10_LOG.length) fail('a list is scheduled twice');

const shipped = Object.fromEntries(Object.entries(lists).filter(([, l]) => args.has('--all') || l.checked));
const shippedKeys = new Set(Object.values(shipped).flatMap((l) => [...l.slots, ...(l.near || [])].map((e) => e.key)));

const data = {
  log: TOP10_LOG,
  lists: shipped,
  pools: { club: clubs.finish(), nation: nations.finish() },
  // Players in an answer who are not among the pool's nine thousand. Offered by
  // the guess box alongside the pool, for every list, so their presence says
  // nothing about today's.
  extras: [...extras.values()].filter((e) => shippedKeys.has(e.key)).sort((a, b) => a.name.localeCompare(b.name)),
};

if (args.has('--print')) {
  for (const l of Object.values(lists)) {
    console.log(`\n${l.id}  [${l.kind}]  as of ${l.asOf}  ${l.checked ? `checked ${l.checked}` : 'NOT CHECKED'}\n  ${l.title}`);
    l.slots.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s.name}  (${s.clue})${s.key.startsWith('x:') ? '  [not in pool]' : ''}`));
    for (const n of l.near || []) console.log(`   · ${n.name}  (${n.note})`);
  }
}

for (const w of warn) console.warn(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\ngen-top10: ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
  process.exit(1);
}

const json = `${JSON.stringify(data)}\n`;
const meta = `// GENERATED by scripts/gen-top10.mjs. Do not edit.\n// The Top 10 schedule's two numbers, from scripts/top10/specs.mjs: the day\n// Top 10 #1 falls on, and how many days are scheduled. The lists themselves\n// are in top10Lists.json, which only the game screen loads.\nexport const TOP10_ANCHOR_DAY = ${TOP10_ANCHOR_DAY};\nexport const TOP10_DAYS = ${TOP10_LOG.length};\n`;
if (args.has('--stdout')) {
  process.stdout.write(json);
} else if (args.has('--check')) {
  let onDisk = '';
  let metaOnDisk = '';
  try { onDisk = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  try { metaOnDisk = readFileSync(META, 'utf8'); } catch { /* missing */ }
  if (onDisk !== json || metaOnDisk !== meta) { console.error('gen-top10: src/data/top10Lists.json is stale; run node scripts/gen-top10.mjs'); process.exit(1); }
  console.log('gen-top10: up to date');
} else {
  writeFileSync(OUT, json);
  writeFileSync(META, meta);
  console.log(`gen-top10: ${Object.keys(shipped).length} of ${Object.keys(lists).length} lists written, ${TOP10_LOG.length} scheduled, ${data.pools.club.length} clubs, ${data.pools.nation.length} nations, ${data.extras.length} extra players, ${(json.length / 1024).toFixed(1)} KB`);
}
