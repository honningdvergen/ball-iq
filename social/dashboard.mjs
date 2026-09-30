#!/usr/bin/env node
// Morning dashboard — "stop going blind" (Alex 09-29). One ≤40-line file: social/state/pm/DASHBOARD.md
//   node social/dashboard.mjs            → prints + writes the dashboard, appends a snapshot to dashboard_history.jsonl
// Sources (all read-only): Instagram + Facebook Graph API (Page token), Threads API, manual_metrics.json (X/TikTok/Snapchat,
// which have no API we may use — Alex pastes screenshots, the Editor updates the file). Judge everything on follows per 10K
// views, hit rate and IG non-follower reach (social/state/A_GRADE_PLAN.md), not on post counts.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'state', 'pm', 'DASHBOARD.md'), HIST = path.join(HERE, 'state', 'dashboard_history.jsonl');
const MANUAL = path.join(HERE, 'state', 'manual_metrics.json');
const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w'], { encoding: 'utf8' }).trim(); } catch { return ''; } };
const j = async (u) => { try { return await (await fetch(u, { signal: AbortSignal.timeout(30000) })).json(); } catch (e) { return { error: String(e) }; } };
const FB = key('shq-fb-page-token'), TH = key('shq-threads-token');
const G = 'https://graph.facebook.com/v26.0', IG = '17841445120874725', T = 'https://graph.threads.net/v1.0';
const day = (d) => new Date(d).toISOString().slice(0, 10);
const now = Date.now(), since = Math.floor((now - 24 * 3600e3) / 1000), since2 = Math.floor((now - 48 * 3600e3) / 1000), until = Math.floor(now / 1000);
const f0 = (n) => (n == null ? 'n/a' : Number(n).toLocaleString('en-GB'));
const per10k = (f, v) => (v > 0 && f != null ? (10000 * f / v).toFixed(1) : 'n/a');
const D = { at: new Date().toISOString() }, L = [];

// ---------- Instagram ----------
try {
  const u = await j(`${G}/${IG}?fields=followers_count&access_token=${FB}`);
  const m = (await j(`${G}/${IG}/media?fields=id,timestamp,media_product_type,caption,permalink&limit=30&access_token=${FB}`)).data || [];
  const recent = m.filter((x) => now - Date.parse(x.timestamp) < 24 * 3600e3);
  const rows = [];
  for (const x of recent.filter((x) => x.media_product_type === 'FEED')) {
    const i = await j(`${G}/${x.id}/insights?metric=reach,follows&access_token=${FB}`);
    const o = Object.fromEntries((i.data || []).map((d) => [d.name, d.values[0].value]));
    rows.push({ ...x, reach: o.reach || 0, follows: o.follows ?? null });
  }
  const reach24 = rows.reduce((a, r) => a + r.reach, 0), fol24 = rows.reduce((a, r) => a + (r.follows || 0), 0);
  const split = await j(`${G}/${IG}/insights?metric=reach&period=day&metric_type=total_value&breakdown=follow_type&since=${since2}&until=${until}&access_token=${FB}`);
  const br = (split.data?.[0]?.total_value?.breakdowns?.[0]?.results || []).map((r) => `${r.dimension_values[0]} ${f0(r.value)}`).join(' · ');
  const best = [...rows].sort((a, b) => b.follows - a.follows)[0];
  D.ig = { followers: u.followers_count, feed24: rows.length, reach24, fol24, split: br };
  L.push(`**Instagram** ${f0(u.followers_count)} followers · feed posts 24h ${rows.length} (cap 4; 8 on match days) · reach ${f0(reach24)} · follows ${fol24} (${per10k(fol24, reach24)}/10K) · reach split (48h) ${br || 'n/a'}`,
    best ? `  best: ${best.follows} follows / ${f0(best.reach)} reach — ${(best.caption || '').replace(/\n/g, ' ').slice(0, 60)}` : '  no feed posts in 24h');
} catch (e) { L.push('**Instagram** error ' + e.message); }

// ---------- Threads ----------
try {
  const fc = await j(`${T}/me/threads_insights?metric=followers_count&access_token=${TH}`);
  const followers = fc.data?.[0]?.total_value?.value;
  const posts = ((await j(`${T}/me/threads?fields=id,timestamp,media_type,text,permalink&limit=50&access_token=${TH}`)).data || []).filter((x) => now - Date.parse(x.timestamp) < 24 * 3600e3);
  const ins = [];
  for (const p of posts) { const i = await j(`${T}/${p.id}/insights?metric=views,likes&access_token=${TH}`); const o = Object.fromEntries((i.data || []).map((d) => [d.name, d.values[0].value])); ins.push({ ...p, views: o.views || 0, likes: o.likes || 0 }); }
  const views = ins.reduce((a, p) => a + p.views, 0), med = ins.map((p) => p.views).sort((a, b) => a - b)[Math.floor(ins.length / 2)] || 0;
  const imgs = ins.filter((p) => /IMAGE|CAROUSEL/.test(p.media_type)).length, bad = ins.filter((p) => /TEXT|VIDEO/.test(p.media_type)).length, hits = ins.filter((p) => p.views >= 10000).length;
  const best = [...ins].sort((a, b) => b.views - a.views)[0];
  D.threads = { followers, posts24: ins.length, views24: views, median: med, hits };
  L.push(`**Threads** ${f0(followers)} followers · posts 24h ${ins.length} (image/carousel ${imgs}, text/video ${bad} — target 7+, 0) · views ${f0(views)} · median ${f0(med)} (baseline 1.2K) · hits ≥10K ${hits}`, best ? `  best: ${f0(best.views)} views — ${(best.text || '').replace(/\n/g, ' ').slice(0, 60)}` : '');
} catch (e) { L.push('**Threads** error ' + e.message); }

// ---------- Facebook ----------
try {
  const pg = await j(`${G}/me?fields=followers_count&access_token=${FB}`);
  const ser = async (mm) => { const d = await j(`${G}/me/insights?metric=${mm}&period=day&since=${since2}&until=${until}&access_token=${FB}`); return (d.data?.[0]?.values || []).map((v) => v.value); };
  const [fo, un, vw] = [await ser('page_daily_follows_unique'), await ser('page_daily_unfollows_unique'), await ser('page_media_view')];
  const last = (a) => a[a.length - 2] ?? a[a.length - 1];   // last COMPLETE day
  D.fb = { followers: pg.followers_count, follows: last(fo), unfollows: last(un), views: last(vw) };
  L.push(`**Facebook** ${f0(pg.followers_count)} followers · last full day: +${last(fo)} / −${last(un)} follows, ${f0(last(vw))} page views (${per10k(last(fo), last(vw))}/10K; target ≥7) — videos only, 3–4/day`);
} catch (e) { L.push('**Facebook** error ' + e.message); }

// ---------- Manual (X, TikTok, Snapchat, Telegram) ----------
const man = fs.existsSync(MANUAL) ? JSON.parse(fs.readFileSync(MANUAL, 'utf8')) : {};
for (const [k, v] of Object.entries(man)) L.push(`**${k}** ${Object.entries(v).map(([a, b]) => `${a} ${b}`).join(' · ')}   (manual, ${v.as_of || '?'})`);
if (!Object.keys(man).length) L.push('**X / TikTok / Snapchat** manual_metrics.json missing — ask Alex for screenshots');

const flags = [];
if (D.threads?.posts24 > 12) flags.push('Threads over-posting (>12 in 24h)');
if (D.ig?.feed24 > 4) flags.push('IG feed >4 (check match-day list)');
const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).slice(0, 16);
const md = [`# DASHBOARD ${stamp} Oslo (auto — social/dashboard.mjs)`, ...L, flags.length ? `**Flags:** ${flags.join('; ')}` : '**Flags:** none from data',
  'Kill/decision dates: Snapchat/OneUp 10-04 · TikTok native test 10-06 · IG originality + Threads test 10-06 · X reads 10-09 (OCR payout), 10-13 · YouTube 10-13 · first weekly review Fri 10-02.',
  'Judge on follows per 10K views, hit rate, IG non-follower reach — not post counts (A_GRADE_PLAN.md).'].join('\n');
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, md + '\n'); fs.appendFileSync(HIST, JSON.stringify(D) + '\n');
console.log(md);
