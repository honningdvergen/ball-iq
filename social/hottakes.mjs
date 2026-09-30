#!/usr/bin/env node
// Hot-takes finder — fresh, high-like football tweets to use as the real tweet on a hero photo (ig_hero_format_study.md).
// NEVER touches x.com: tweet IDs come from the public third-party tracker playersells.com/insights/<handle>; text/likes/media
// then come from X's public per-tweet syndication JSON (same call social/carousel.mjs uses).
//
//   node social/hottakes.mjs [--hours 48] [--min-likes 3000] [--handles a,b,c] [--top 25]
//   → prints a ranked list and writes social/state/hottakes.json + hottakes.md (id, account, likes, age, text, media, url).
// Then: node social/overlay.mjs --tweet <syndication json> --bg <face photo> --out slide1.png  (photo pool: social/state/media/hero_pool_INDEX.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const HOURS = Number(arg('hours', 48)), MIN = Number(arg('min-likes', 3000)), TOP = Number(arg('top', 25));
let handles = (arg('handles') || '').split(',').filter(Boolean);
if (!handles.length) {   // every account that appears in our two X corpora + a few staples
  const set = new Set(['TrollFootball', 'nocontextfooty', 'FootyHumour', 'FootballFunnys', 'TheHateCentral2', 'UTDTrey', 'markgoldbridge', 'TouchlineX', 'MadridXtra', 'brfootball', '433', 'tekkersfoot', 'FabrizioRomano', 'David_Ornstein', 'ESPNFC', 'OptaJoe', 'ManUtd', 'FootyAccums']);
  for (const f of ['x_extended_big_corpus.json', 'x_extended_small_corpus.json']) { try { const d = JSON.parse(fs.readFileSync(path.join(HERE, 'state', 'research', f), 'utf8')); for (const p of (Array.isArray(d) ? d : (d.posts || []))) if (p?.account) set.add(String(p.account).replace('@', '')); } catch { /* corpus missing */ } }
  handles = [...set];
}
const sf2ms = (id) => Number((BigInt(id) >> 22n) + 1288834974657n);
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': 'SHQ-research/1.0' }, signal: AbortSignal.timeout(20000) }); return r; };
const out = [];
let n = 0;
for (const h of handles) {
  try {
    const html = await (await get(`https://playersells.com/insights/${h}`)).text();
    const ids = [...new Set([...html.matchAll(/status\/(\d{15,20})/g)].map((m) => m[1]))];
    for (const id of ids) {
      const age = (Date.now() - sf2ms(id)) / 3600e3; if (age > HOURS || age < 0) continue;
      const r = await get(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=x`); if (!r.ok) continue;
      const t = await r.json(); const likes = t.favorite_count || 0; if (likes < MIN) continue;
      out.push({ id, account: t.user?.screen_name || h, name: t.user?.name, likes, replies: t.conversation_count, ageH: Math.round(age * 10) / 10, text: (t.text || '').replace(/https:\/\/t\.co\/\S+/g, '').replace(/\n+/g, ' / ').trim(), media: (t.mediaDetails || []).map((m) => m.type).join(',') || 'none', url: `https://x.com/${t.user?.screen_name || h}/status/${id}` });
    }
  } catch { /* handle without data */ }
  if (++n % 10 === 0) await new Promise((r) => setTimeout(r, 500));
}
out.sort((a, b) => b.likes - a.likes);
fs.writeFileSync(path.join(HERE, 'state', 'hottakes.json'), JSON.stringify(out, null, 1));
const md = ['# HOT TAKES (last ' + HOURS + ' h, ≥' + MIN + ' likes) — ' + new Date().toISOString().slice(0, 16), '', '| likes | age | account | media | tweet |', '|---|---|---|---|---|', ...out.slice(0, TOP).map((t) => `| ${t.likes} | ${t.ageH}h | @${t.account} | ${t.media} | ${t.text.slice(0, 140)} — ${t.url} |`)].join('\n');
fs.writeFileSync(path.join(HERE, 'state', 'hottakes.md'), md + '\n');
console.log(`${out.length} tweets from ${handles.length} handles`); console.log(md);
