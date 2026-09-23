// Daily growth read for Shithousery HQ — which posts actually GROW each account.
//
//   node social/insights.mjs              # last 72h of posts, all platforms → report on stdout
//   node social/insights.mjs --hours 24   # a shorter window
//   node social/insights.mjs --no-rivals  # skip the competitor sweep
//
// Writes social/state/insights/<date>.json (raw) and <date>.md (the report), and appends one row
// per platform per day to social/state/insights/followers.csv (so growth is measured, not guessed).
//
// Why: views never told us what converts (the 33-wins Threads post: 2.26M views, ~a normal day of
// follows). Instagram gives per-post FOLLOWS for photos and carousels (not reels — Meta doesn't
// expose it); Threads and the Page give per-post / per-day reach and engagement. Rank by what grows.
//
// READ-ONLY BY CONSTRUCTION. Tokens live in the macOS Keychain (set up 09-23 via the SHQ Insights
// Meta app); every request goes through get(), which only ever issues GET. The Threads token carries
// publish scopes because Meta's generator ignored the unticked boxes — this file must never POST.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'state', 'insights');
fs.mkdirSync(OUT, { recursive: true });
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const HOURS = Number(arg('hours', 72));
const SINCE = Date.now() - HOURS * 3600e3;
const TODAY = new Date().toISOString().slice(0, 10);

const IG = '17841445120874725', PAGE = '543612208834002';
const FB = 'https://graph.facebook.com/v26.0', TH = 'https://graph.threads.net/v1.0';
// Reference accounts (reference_carousel_sweep_accounts). Business Discovery only sees Business/Creator profiles.
const RIVALS = ['itsfootybants', 'trollol_epl', 'ftblmemeshub', 'rivalsbanter', 'nonoffsideguy', 'thatguysjokes', 'simptv', 'midnitefootball', 'hesaballer', 'oddsbible', 'footy.rn'];

const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w']).toString().trim(); } catch { return null; } };
let THREADS = key('shq-threads-token');
const PAGE_TOKEN = key('shq-fb-page-token');

async function get(url, params = {}) {                 // the ONLY network call in this file
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u, { method: 'GET' });
  const j = await r.json().catch(() => ({}));
  if (j.error) throw new Error(j.error.message);
  return j;
}
// Some metrics are type-specific or renamed between API versions: drop the rejected ones and retry.
async function insights(url, metrics, token, extra = {}) {
  let m = [...metrics];
  for (let i = 0; i < metrics.length && m.length; i++) {
    try {
      const j = await get(url, { metric: m.join(','), access_token: token, ...extra });
      return Object.fromEntries(j.data.map((d) => [d.name, d.total_value ? d.total_value.value : (d.values?.at(-1)?.value ?? null)]));
    } catch (e) {
      const bad = m.find((x) => e.message.includes(x));
      if (!bad) return { _error: e.message.slice(0, 120) };
      m = m.filter((x) => x !== bad);
    }
  }
  return {};
}
const short = (t = '') => t.replace(/\s+/g, ' ').trim().slice(0, 60);
const per1k = (n, v) => (v ? +(1000 * (n || 0) / v).toFixed(2) : null);

async function refreshThreads() {
  if (!THREADS) return;
  try {
    const d = (await get(`${TH}/debug_token`, { input_token: THREADS, access_token: THREADS })).data || {};
    if (d.expires_at && d.expires_at * 1000 - Date.now() < 10 * 86400e3) {
      const j = await get('https://graph.threads.net/refresh_access_token', { grant_type: 'th_refresh_token', access_token: THREADS });
      execFileSync('security', ['add-generic-password', '-U', '-a', 'shithouseryhq', '-s', 'shq-threads-token', '-w', j.access_token]);
      THREADS = j.access_token;
      console.error('threads token refreshed');
    }
  } catch (e) { console.error('threads token check failed:', e.message); }
}

async function threads() {
  if (!THREADS) return { error: 'no Threads token in Keychain (shq-threads-token)' };
  const acct = await insights(`${TH}/me/threads_insights`, ['followers_count'], THREADS);
  const posts = [];
  let url = `${TH}/me/threads`, params = { fields: 'id,text,timestamp,permalink,media_type,is_quote_post', limit: 50, access_token: THREADS };
  for (let page = 0; page < 6 && url; page++) {
    const j = await get(url, params);
    for (const p of j.data) {
      if (Date.parse(p.timestamp) < SINCE) { url = null; break; }
      if (p.media_type === 'REPOST_FACADE') continue;
      const m = await insights(`${TH}/${p.id}/insights`, ['views', 'likes', 'replies', 'reposts', 'quotes', 'shares'], THREADS);
      posts.push({ id: p.id, at: p.timestamp, text: short(p.text), url: p.permalink, ...m });
    }
    if (url) { url = j.paging?.next || null; params = {}; }
  }
  return { followers: acct.followers_count ?? null, posts };
}

async function instagram() {
  if (!PAGE_TOKEN) return { error: 'no Page token in Keychain (shq-fb-page-token)' };
  const acct = await get(`${FB}/${IG}`, { fields: 'followers_count,media_count', access_token: PAGE_TOKEN });
  const posts = [];
  let url = `${FB}/${IG}/media`, params = { fields: 'id,caption,timestamp,permalink,media_type,media_product_type', limit: 50, access_token: PAGE_TOKEN };
  for (let page = 0; page < 6 && url; page++) {
    const j = await get(url, params);
    for (const p of j.data) {
      if (Date.parse(p.timestamp) < SINCE) { url = null; break; }
      const reel = p.media_product_type === 'REELS';
      const metrics = ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions',
        ...(reel ? ['ig_reels_avg_watch_time', 'ig_reels_video_view_total_time'] : ['follows', 'profile_visits'])];
      const m = await insights(`${FB}/${p.id}/insights`, metrics, PAGE_TOKEN);
      posts.push({ id: p.id, at: p.timestamp, type: reel ? 'REEL' : p.media_type, text: short(p.caption), url: p.permalink, ...m });
    }
    if (url) { url = j.paging?.next || null; params = {}; }
  }
  return { followers: acct.followers_count, media: acct.media_count, posts };
}

async function facebook() {
  if (!PAGE_TOKEN) return { error: 'no Page token' };
  const acct = await get(`${FB}/${PAGE}`, { fields: 'followers_count', access_token: PAGE_TOKEN });
  const j = await get(`${FB}/${PAGE}/insights`, {
    metric: 'page_media_view,page_total_media_view_unique,page_daily_follows_unique,page_post_engagements,page_video_views,page_views_total',
    period: 'day', access_token: PAGE_TOKEN });
  const days = {};
  for (const m of j.data) for (const v of m.values) (days[v.end_time.slice(0, 10)] ||= {})[m.name] = v.value;
  return { followers: acct.followers_count, days };
}

async function rivals() {
  const out = [];
  for (const u of RIVALS) {
    try {
      const j = await get(`${FB}/${IG}`, { fields: `business_discovery.username(${u}){followers_count,media_count,media.limit(12){timestamp,like_count,comments_count,media_product_type,view_count,permalink}}`, access_token: PAGE_TOKEN });
      const b = j.business_discovery; const recent = (b.media?.data || []).filter((m) => Date.parse(m.timestamp) >= SINCE);
      out.push({ user: u, followers: b.followers_count, posts_in_window: recent.length,
        best: recent.sort((a, c) => (c.like_count || 0) - (a.like_count || 0))[0] || null });
    } catch (e) { out.push({ user: u, error: e.message.slice(0, 80) }); }
  }
  return out;
}

// followers.csv: date,platform,followers — one row per platform per day (latest run of the day wins)
function logFollowers(rows) {
  const f = path.join(OUT, 'followers.csv');
  const lines = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').slice(1) : [];
  const keep = lines.filter((l) => !rows.some(([p]) => l.startsWith(`${TODAY},${p},`)));
  for (const [p, n] of rows) if (n != null) keep.push(`${TODAY},${p},${n}`);
  keep.sort();
  fs.writeFileSync(f, 'date,platform,followers\n' + keep.join('\n') + '\n');
  const prev = (p) => keep.filter((l) => l.split(',')[1] === p && l.split(',')[0] < TODAY).at(-1);
  return Object.fromEntries(rows.map(([p, n]) => { const pr = prev(p); return [p, pr ? n - Number(pr.split(',')[2]) : null]; }));
}

function report(d, delta) {
  const L = [`# SHQ insights — ${TODAY} (posts from the last ${HOURS}h)`, ''];
  const sign = (x) => (x == null ? 'first reading' : (x >= 0 ? '+' : '') + x + ' since last run');
  L.push('## Followers', `- Threads: ${d.threads.followers ?? '?'} (${sign(delta.threads)})`,
    `- Instagram: ${d.instagram.followers ?? '?'} (${sign(delta.instagram)})`, `- Facebook Page: ${d.facebook.followers ?? '?'} (${sign(delta.facebook)})`, '');

  const ig = (d.instagram.posts || []).map((p) => ({ ...p, f1k: per1k(p.follows, p.views), s1k: per1k((p.saved || 0) + (p.shares || 0), p.views) }));
  L.push('## Instagram — ranked by follows per 1k views (photos/carousels), then saves+shares per 1k', '',
    '| when | type | views | reach | follows | f/1k | profile visits | saves+shares/1k | post |', '|---|---|---|---|---|---|---|---|---|');
  for (const p of ig.sort((a, b) => (b.f1k ?? -1) - (a.f1k ?? -1) || (b.s1k ?? 0) - (a.s1k ?? 0)))
    L.push(`| ${p.at.slice(5, 16)} | ${p.type} | ${p.views ?? ''} | ${p.reach ?? ''} | ${p.follows ?? '—'} | ${p.f1k ?? '—'} | ${p.profile_visits ?? '—'} | ${p.s1k ?? ''} | [${p.text || '(no caption)'}](${p.url}) |`);
  L.push('', '_Reels: Meta does not report follows per reel — judge them on views, shares and watch time._', '');

  const th = (d.threads.posts || []).map((p) => ({ ...p, e1k: per1k((p.replies || 0) + (p.reposts || 0) + (p.quotes || 0) + (p.shares || 0), p.views) }));
  L.push('## Threads — ranked by views', '', '| when | views | likes | replies | reposts+quotes | shares | spread/1k | post |', '|---|---|---|---|---|---|---|---|');
  for (const p of th.sort((a, b) => (b.views || 0) - (a.views || 0)))
    L.push(`| ${p.at.slice(5, 16)} | ${p.views ?? ''} | ${p.likes ?? ''} | ${p.replies ?? ''} | ${(p.reposts || 0) + (p.quotes || 0)} | ${p.shares ?? ''} | ${p.e1k ?? ''} | [${p.text || '(media)'}](${p.url}) |`);
  L.push('');

  L.push('## Facebook Page — daily', '', '| day | content views | unique viewers | new follows | engagements | video views |', '|---|---|---|---|---|---|');
  for (const [day, v] of Object.entries(d.facebook.days || {}).sort())
    L.push(`| ${day} | ${v.page_media_view ?? ''} | ${v.page_total_media_view_unique ?? ''} | ${v.page_daily_follows_unique ?? ''} | ${v.page_post_engagements ?? ''} | ${v.page_video_views ?? ''} |`);
  L.push('', '_Meta labels each day by its END time — a row is mostly the previous day (Postiz trap, same source)._', '');

  if (d.rivals) {
    L.push('## Reference accounts (Business Discovery)', '', '| account | followers | posts in window | best post (likes / views) |', '|---|---|---|---|');
    for (const r of d.rivals) L.push(r.error ? `| @${r.user} | — | — | not visible (${r.error.slice(0, 50)}) |`
      : `| @${r.user} | ${r.followers} | ${r.posts_in_window} | ${r.best ? `[${r.best.like_count ?? "hidden"} likes${r.best.view_count ? ' / ' + r.best.view_count + ' views' : ''}](${r.best.permalink})` : '—'} |`);
  }
  return L.join('\n') + '\n';
}

await refreshThreads();
const safe = async (f) => { try { return await f(); } catch (e) { return { error: e.message.slice(0, 160) }; } };
const data = { at: new Date().toISOString(), hours: HOURS, threads: await safe(threads), instagram: await safe(instagram), facebook: await safe(facebook) };
if (!process.argv.includes('--no-rivals')) data.rivals = await safe(rivals);
const delta = logFollowers([['threads', data.threads.followers], ['instagram', data.instagram.followers], ['facebook', data.facebook.followers]]);
fs.writeFileSync(path.join(OUT, `${TODAY}.json`), JSON.stringify(data, null, 1));
const md = report(data, delta);
fs.writeFileSync(path.join(OUT, `${TODAY}.md`), md);
for (const k of ['threads', 'instagram', 'facebook', 'rivals']) if (data[k]?.error) console.error(`⚠️ ${k}: ${data[k].error}`);
process.stdout.write(md);
