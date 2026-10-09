#!/usr/bin/env node
// audit-pool-birthdates.mjs — compare the Mystery pool's birth dates with
// Wikipedia, which a Wikidata edit does not touch.
//
//   node scripts/audit-pool-birthdates.mjs            the 300 most famous
//   node scripts/audit-pool-birthdates.mjs --top 1000
//   node scripts/audit-pool-birthdates.mjs --all      the whole pool
//   node scripts/audit-pool-birthdates.mjs --json out.json
//
// ⚠️ WHY THIS EXISTS. `born` and `dob` in src/data/mysteryPool.json are a
// SNAPSHOT of Wikidata, and the snapshot is sticky: fetch-mystery-dob.mjs only
// asks for ids it has never seen, so a date that was wrong on the day of the
// fetch stays in scripts/_mystery-dob.json after Wikidata is repaired.
//
// Found 2026-10-09: Michael Owen was in the pool as born 14 December 1976. An
// anonymous edit set that on Wikidata on 24 July 2026 and it stood until 27
// August; both caches were fetched on 12-15 August, inside those five weeks.
// Wikidata has said 1979 again for six weeks and our files still said 1976.
// He is an eligible answer, and the reveal and the era hint both print the year.
//
// The comparison is with the English Wikipedia INFOBOX, read as wikitext. A
// footballer's infobox date is typed into the article, not drawn from Wikidata,
// so it is a second source and not the same one read twice. For every
// disagreement the script then reads the opening sentence of the article in up
// to five other languages, and Wikidata as it stands today.
//
// It reports. It changes nothing: a confirmed date goes into BIRTH_FIXES in
// scripts/_name-overrides.mjs by hand, with a line of why.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { BIRTH_FIXES, BIRTH_DISPUTED } from './_name-overrides.mjs';

const UA = 'BallIQ/1.0 (https://balliq.app; hello@balliq.app) birthdate-audit';
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const ALL = args.includes('--all');
const TOP = Number(flag('--top')) || 300;
const OUT = flag('--json');
const CACHE_DIR = join(tmpdir(), 'balliq-birthdate-audit');
mkdirSync(CACHE_DIR, { recursive: true });
const OTHER = ['de', 'fr', 'es', 'it', 'pt'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const cacheFile = (name) => join(CACHE_DIR, `${name}.json`);
const load = (name) => (existsSync(cacheFile(name)) ? JSON.parse(readFileSync(cacheFile(name), 'utf8')) : {});
const save = (name, data) => writeFileSync(cacheFile(name), JSON.stringify(data));

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const body = await res.text();
      if (body.startsWith('{')) {
        const json = JSON.parse(body);
        if (json.error) throw new Error(`${host}: ${json.error.code} ${json.error.info}`);
        return json;
      }
      await sleep(15000);                       // throttled: an HTML page, not JSON
    } catch (e) {
      if (/^[\w.]+: /.test(e.message)) throw e; // an API error, not a network one
      await sleep(5000);
    }
  }
  throw new Error(`${host}: no answer after six tries`);
}

// ── dates ───────────────────────────────────────────────────────────────────
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  januar: 1, februar: 2, märz: 3, mai: 5, juni: 6, juli: 7, oktober: 10, dezember: 12, jänner: 1,
  janvier: 1, février: 2, mars: 3, avril: 4, juin: 6, juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  gennaio: 1, febbraio: 2, aprile: 4, maggio: 5, giugno: 6, luglio: 7, settembre: 9, ottobre: 10, dicembre: 12,
  janeiro: 1, fevereiro: 2, março: 3, maio: 5, junho: 6, julho: 7, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};
const iso = (y, m, d) => {
  y = Number(y); m = Number(m); d = Number(d);
  if (!(y > 1800 && y < 2020 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
const W = '[A-Za-zÀ-ÿ]+';
// The first written date in a piece of text, in any of the six languages:
// "14 December 1979", "December 14, 1979", "14. Dezember 1979", "14 de
// diciembre de 1979", "1er janvier 1980", "1º de janeiro de 1980".
function firstDate(text) {
  const t = text.replace(/&nbsp;| /g, ' ');
  const hits = [];
  for (const m of t.matchAll(new RegExp(`(\\d{1,2})(?:er|º|°|\\.)?\\s+(?:de\\s+|del\\s+)?(${W})\\.?,?\\s+(?:de\\s+|del\\s+)?(\\d{4})`, 'g')))
    if (MONTHS[m[2].toLowerCase()]) hits.push([m.index, iso(m[3], MONTHS[m[2].toLowerCase()], m[1])]);
  for (const m of t.matchAll(new RegExp(`(${W})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'g')))
    if (MONTHS[m[1].toLowerCase()]) hits.push([m.index, iso(m[3], MONTHS[m[1].toLowerCase()], m[2])]);
  for (const m of t.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) hits.push([m.index, iso(m[1], m[2], m[3])]);
  hits.sort((a, b) => a[0] - b[0]);
  return hits.find((h) => h[1])?.[1] || null;
}
// The birth_date parameter of an infobox. Nearly always a template with the
// year, month and day as its first three bare numbers, in that order whatever
// df= or mf= says; otherwise a written date.
function infoboxDate(wikitext) {
  const m = wikitext.match(/\|\s*(?:birth_date|birthdate|date_of_birth|dateofbirth)\s*=\s*([^\n]*)/i);
  if (!m) return { raw: null, date: null };
  const raw = m[1].replace(/<ref[^>]*\/>/gi, '').replace(/<ref[\s\S]*?<\/ref>/gi, '').replace(/<ref[\s\S]*$/i, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const tpl = raw.match(/\{\{([^{}]*)\}\}/);
  if (tpl) {
    const nums = tpl[1].split('|').slice(1).map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    if (nums.length >= 3 && nums[0].length === 4) return { raw, date: iso(nums[0], nums[1], nums[2]) };
    return { raw, date: firstDate(tpl[1].split('|').slice(1).join(' ')) };
  }
  return { raw, date: firstDate(raw) };
}

// ── who ─────────────────────────────────────────────────────────────────────
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const ranked = [...pool].sort((a, b) => (b.fame || 0) - (a.fame || 0));
// "The 300 most famous" keeps everyone level with the 300th, so the cut never
// falls between two players of the same fame.
const floor = ALL ? -Infinity : (ranked[Math.min(TOP, ranked.length) - 1].fame || 0);
const who = ranked.filter((p) => (p.fame || 0) >= floor);
console.log(`${pool.length} in the pool · auditing ${who.length}${ALL ? '' : ` (fame ${floor} and above)`}`);

// ── 1. Wikidata today: the article titles, and the date as it stands now ────
const wd = load('wikidata');
for (const batch of chunk(who.filter((p) => !(p.id in wd)), 50)) {
  const json = await api('www.wikidata.org', {
    action: 'wbgetentities', ids: batch.map((p) => p.id).join('|'), props: 'claims|sitelinks',
    sitefilter: ['en', ...OTHER].map((l) => `${l}wiki`).join('|'),
  });
  for (const p of batch) {
    const ent = json.entities?.[p.id];
    // A redirected id comes back under its new id; say so, because the pool is keyed by the old one.
    const dates = (ent?.claims?.P569 || []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue?.value?.precision >= 11)
      .sort((a, b) => (b.rank === 'preferred') - (a.rank === 'preferred'))
      .map((c) => c.mainsnak.datavalue.value.time.replace(/^\+/, '').slice(0, 10));
    wd[p.id] = { missing: !ent || 'missing' in ent, dates: [...new Set(dates)],
      titles: Object.fromEntries(Object.values(ent?.sitelinks || {}).map((s) => [s.site.replace(/wiki$/, ''), s.title])) };
  }
  save('wikidata', wd);
  await sleep(250);
}

// ── 2. English Wikipedia: the infobox as typed, and the opening sentence ────
async function pages(lang, titles, params) {
  const out = {};
  let cont = {};
  for (;;) {
    const json = await api(`${lang}.wikipedia.org`, { action: 'query', titles: titles.join('|'), redirects: '1', ...params, ...cont });
    const alias = new Map();
    for (const n of json.query?.normalized || []) alias.set(n.to, n.from);
    for (const r of json.query?.redirects || []) alias.set(r.to, alias.get(r.from) || r.from);
    for (const pg of json.query?.pages || []) {
      const asked = alias.get(pg.title) || pg.title;
      const text = pg.revisions?.[0]?.slots?.main?.content ?? pg.extract;
      if (text != null) out[asked] = text;
    }
    if (!json.continue) return out;
    cont = json.continue;
  }
}
const box = load('enwiki-infobox');
const need = who.filter((p) => wd[p.id].titles.en && !(p.id in box));
for (const batch of chunk(need, 40)) {
  const got = await pages('en', batch.map((p) => wd[p.id].titles.en), { prop: 'revisions', rvprop: 'content', rvslots: 'main', rvsection: '0' });
  for (const p of batch) {
    const text = got[wd[p.id].titles.en];
    if (text == null) continue;
    const ib = infoboxDate(text);
    // The opening sentence, from the same wikitext: everything after the last
    // line of the infobox, templates and links stripped down to their words.
    const prose = text.slice(text.lastIndexOf('\n}}') + 3).replace(/\{\{[^{}]*\}\}/g, ' ').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/'{2,}/g, '');
    box[p.id] = { infobox: ib.date, raw: ib.raw, lead: firstDate(prose.slice(0, 600)) };
  }
  save('enwiki-infobox', box);
  await sleep(250);
}

// ── 3. compare ──────────────────────────────────────────────────────────────
const rows = who.map((p) => {
  const w = wd[p.id], b = box[p.id] || {};
  const wiki = b.infobox || b.lead || null;
  const ours = p.dob || null;
  let verdict;
  if (!w.titles.en) verdict = 'no-article';
  else if (!wiki) verdict = 'unread';
  else if (ours) verdict = ours === wiki ? 'match' : 'MISMATCH';
  else verdict = Number(wiki.slice(0, 4)) === p.born ? 'match-year' : 'MISMATCH';
  if (ours && Number(ours.slice(0, 4)) !== p.born) verdict = 'MISMATCH';     // the row disagrees with itself
  return { id: p.id, name: p.name, fame: p.fame, born: p.born, dob: ours, infobox: b.infobox || null, lead: b.lead || null,
    raw: b.raw || null, wikidataToday: w.dates, title: w.titles.en || null, verdict };
});

// ── 4. a second language for everything that is not a clean match ───────────
const open = rows.filter((r) => r.verdict !== 'match' && r.verdict !== 'match-year');
const second = load('other-leads');
for (const lang of OTHER) {
  const todo = open.filter((r) => wd[r.id].titles[lang] && !(`${lang}:${r.id}` in second));
  for (const batch of chunk(todo, 20)) {
    const got = await pages(lang, batch.map((r) => wd[r.id].titles[lang]), { prop: 'extracts', exintro: '1', explaintext: '1', exlimit: '20' });
    for (const r of batch) {
      const text = got[wd[r.id].titles[lang]];
      second[`${lang}:${r.id}`] = text == null ? null : firstDate(text.slice(0, 500));
    }
    save('other-leads', second);
    await sleep(250);
  }
}
for (const r of open) {
  r.others = Object.fromEntries(OTHER.map((l) => [l, second[`${l}:${r.id}`]]).filter(([, d]) => d));
  // Confirmed: the English infobox, the English opening sentence and at least
  // one other language all give the same day, and it is not ours.
  const votes = Object.values(r.others);
  r.confirmed = r.infobox && r.infobox === r.lead && votes.includes(r.infobox) && votes.every((d) => d === r.infobox) ? r.infobox : null;
  r.fixed = BIRTH_FIXES[r.id]?.dob || null;
}

// ── 5. report ───────────────────────────────────────────────────────────────
const count = (v) => rows.filter((r) => r.verdict === v).length;
console.log(`\nagree with Wikipedia to the day: ${count('match')}`);
console.log(`agree on the year (the pool holds no day): ${count('match-year')}`);
console.log(`DISAGREE: ${count('MISMATCH')}`);
console.log(`no date read from the article: ${count('unread')} · no English article: ${count('no-article')}\n`);
for (const r of open) {
  const others = Object.entries(r.others).map(([l, d]) => `${l} ${d}`).join(', ') || 'none';
  const state = r.fixed ? (r.fixed === (r.confirmed || r.infobox) ? 'in BIRTH_FIXES' : `BIRTH_FIXES says ${r.fixed}`)
    : BIRTH_DISPUTED[r.id] ? 'listed as disputed' : (r.confirmed ? 'CONFIRMED, not fixed' : 'unconfirmed');
  console.log(`${r.verdict.padEnd(10)} ${r.id.padEnd(11)} ${r.name} (fame ${r.fame})`);
  console.log(`           pool ${r.dob || `born ${r.born}`}${r.dob && Number(r.dob.slice(0, 4)) !== r.born ? ` but born ${r.born}` : ''} · infobox ${r.infobox} · lead ${r.lead} · others ${others} · Wikidata today ${r.wikidataToday.join(' / ') || 'no day'} · ${state}`);
}
if (OUT) { writeFileSync(OUT, JSON.stringify(rows, null, 1)); console.log(`\nwrote ${OUT}`); }
