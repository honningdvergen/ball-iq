// The post log: one line per published post, on every platform, with WHAT it was (format family,
// story, critic score, Alex's taste) and — filled in later — HOW it did. This is the feedback loop:
// "tools don't get you to 1M, the feedback loop does" (Claude-chat review, 09-28). Without it the PM
// can only guess which formats win.
//
// Written automatically by social/pz (Postiz) and .claude/hooks/postlog-metricool.mjs (Metricool).
// Chrome posts (X quote-posts, replies are not logged) are added by hand:
//   node social/postlog.mjs add --platform x --text "…" --url https://x.com/… [--via chrome]
//   node social/postlog.mjs metrics --id <logId> --views 1234 --likes 56 --follows 3 [--shares 7]
//   node social/postlog.mjs list [--days 7]
//   node social/postlog.mjs portfolio [--days 14]     → win rate per format family per platform
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keyOf } from './review.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(HERE, 'state', 'posts_log.jsonl');
const DRAFTS = path.join(HERE, 'state', 'review', 'drafts');
const TASTE = path.join(HERE, 'state', 'review', 'taste.jsonl');
const read = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

function draftFor(text) {
  const k = keyOf(text);
  if (!fs.existsSync(DRAFTS)) return null;
  const ds = fs.readdirSync(DRAFTS).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(DRAFTS, f))))
    .filter((d) => d.key === k).sort((a, b) => (a.at < b.at ? 1 : -1));
  return ds[0] || null;
}

export function logPost({ platform, text = '', id = '', url = '', via = '', scheduledFor = '' }) {
  const d = draftFor(text), taste = d ? read(TASTE).filter((t) => t.id === d.id).pop() : null;
  const row = { logId: `${Date.now().toString(36)}_${platform}`, at: new Date().toISOString(), scheduledFor, platform, via, id, url,
    text: text.slice(0, 300), draft: d?.id || null, format: d?.format || null, story: d?.story || null, broke: d?.broke || null,
    critic: d?.score ?? null, alex: taste?.alex ?? null, metrics: null };
  fs.appendFileSync(LOG, JSON.stringify(row) + '\n');
  return row;
}

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const cmd = MAIN ? process.argv[2] : null;
if (cmd === 'add') {
  const r = logPost({ platform: arg('platform'), text: arg('text') || '', url: arg('url') || '', id: arg('id') || '', via: arg('via') || 'manual' });
  console.log(`logged ${r.logId}${r.draft ? ` (draft ${r.draft}, critic ${r.critic})` : ' (no reviewed draft found for this text)'}`);
} else if (cmd === 'metrics') {
  const rows = read(LOG), r = rows.find((x) => x.logId === arg('id'));
  if (!r) { console.error('no such logId'); process.exit(1); }
  r.metrics = { ...(r.metrics || {}), at: new Date().toISOString(), ...Object.fromEntries(['views', 'likes', 'shares', 'comments', 'follows', 'reposts'].filter((k) => arg(k) != null).map((k) => [k, Number(arg(k))])) };
  fs.writeFileSync(LOG, rows.map((x) => JSON.stringify(x)).join('\n') + '\n');
  console.log('updated', r.logId, JSON.stringify(r.metrics));
} else if (cmd === 'list') {
  const since = Date.now() - Number(arg('days') || 7) * 864e5;
  for (const r of read(LOG).filter((r) => Date.parse(r.at) > since))
    console.log(`${r.at.slice(5, 16)} ${r.platform.padEnd(9)} ${String(r.format || '-').padEnd(18)} critic ${r.critic ?? '-'} alex ${r.alex ?? '-'} views ${r.metrics?.views ?? '?'} follows ${r.metrics?.follows ?? '?'} | ${r.text.slice(0, 60).replace(/\n/g, ' ')}`);
} else if (cmd === 'portfolio') {
  const since = Date.now() - Number(arg('days') || 14) * 864e5, rows = read(LOG).filter((r) => Date.parse(r.at) > since && r.metrics?.views != null);
  const med = {}; for (const p of new Set(rows.map((r) => r.platform))) { const v = rows.filter((r) => r.platform === p).map((r) => r.metrics.views).sort((a, b) => a - b); med[p] = v[Math.floor(v.length / 2)] || 1; }
  const g = {}; for (const r of rows) { const k = `${r.platform} · ${r.format || 'untagged'}`; (g[k] ||= []).push(r); }
  for (const [k, rs] of Object.entries(g).sort()) {
    const hits = rs.filter((r) => r.metrics.views >= 5 * med[r.platform]).length, f = rs.reduce((s, r) => s + (r.metrics.follows || 0), 0), v = rs.reduce((s, r) => s + r.metrics.views, 0);
    console.log(`${k.padEnd(40)} posts ${rs.length}  hits(≥5×median) ${hits}  follows/10K views ${v ? (f / v * 1e4).toFixed(2) : '-'}`);
  }
} else if (cmd) { console.error('usage: postlog.mjs add|metrics|list|portfolio'); process.exit(1); }
