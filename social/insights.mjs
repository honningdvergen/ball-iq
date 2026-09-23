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
// Meta app, and the "shq-insights" Google Cloud project for YouTube); every Meta/Threads request goes
// through get(), which only ever issues GET. The Threads token carries publish scopes because Meta's
// generator ignored the unticked boxes — so nothing here may POST to Meta. The single POST is Google's
// OAuth refresh-token exchange (read-only YouTube scopes).

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
  // Account level, per day: follows vs unfollows (09-23 first read: +355 / −157 over 8 days — the
  // leak matters as much as the tap). Meta fills the last ~2 days late, so they read 0 at first.
  const daily = [];
  for (let i = 8; i >= 1; i--) {
    const since = Math.floor(new Date(TODAY).getTime() / 1000) - i * 86400;
    try {
      const j = await get(`${FB}/${IG}/insights`, { metric: 'follows_and_unfollows', period: 'day', metric_type: 'total_value', breakdown: 'follow_type', since, until: since + 86400, access_token: PAGE_TOKEN });
      const r = j.data[0]?.total_value?.breakdowns?.[0]?.results || [];
      const v = (k) => r.find((x) => x.dimension_values[0] === k)?.value ?? 0;
      daily.push({ day: new Date(since * 1000).toISOString().slice(0, 10), follows: v('FOLLOWER'), unfollows: v('NON_FOLLOWER') });
    } catch (e) { daily.push({ day: new Date(since * 1000).toISOString().slice(0, 10), error: e.message.slice(0, 60) }); }
  }
  return { followers: acct.followers_count, media: acct.media_count, posts, daily };
}

async function facebook() {
  if (!PAGE_TOKEN) return { error: 'no Page token' };
  const acct = await get(`${FB}/${PAGE}`, { fields: 'followers_count', access_token: PAGE_TOKEN });
  const j = await get(`${FB}/${PAGE}/insights`, {
    metric: 'page_media_view,page_total_media_view_unique,page_daily_follows_unique,page_post_engagements,page_video_views,page_views_total',
    period: 'day', access_token: PAGE_TOKEN });
  const days = {};
  for (const m of j.data) for (const v of m.values) (days[v.end_time.slice(0, 10)] ||= {})[m.name] = v.value;
  // Earnings must be asked for on its own — combined with the other metrics Meta returns error 2.
  try {
    const e = await get(`${FB}/${PAGE}/insights`, { metric: 'monetization_approximate_earnings', period: 'day', access_token: PAGE_TOKEN });
    for (const m of e.data) for (const v of m.values) (days[v.end_time.slice(0, 10)] ||= {})[m.name] = v.value;
  } catch (e) { /* earnings are admin-only extras; the rest of the report stands */ }
  return { followers: acct.followers_count, days };
}

// YouTube (Google Cloud project "shq-insights", OAuth client in Keychain, consent by the Alex Olsen
// login that owns the channel, 09-23). Read-only scopes: yt-analytics.readonly + youtube.readonly.
// The one non-GET request in this file: exchanging the refresh token for an access token (OAuth).
async function youtube() {
  const [cid, cs, rt] = ['shq-google-client-id', 'shq-google-client-secret', 'shq-google-refresh-token'].map(key);
  if (!rt) return { error: 'no Google refresh token in Keychain (shq-google-refresh-token)' };
  const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
    body: new URLSearchParams({ client_id: cid, client_secret: cs, refresh_token: rt, grant_type: 'refresh_token' }) })).json();
  if (!tok.access_token) return { error: 'google token refresh failed: ' + (tok.error_description || tok.error) };
  const yt = async (url, params) => {
    const u = new URL(url); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${tok.access_token}` } })).json();
    if (j.error) throw new Error(j.error.message); return j;
  };
  const ch = (await yt('https://www.googleapis.com/youtube/v3/channels', { part: 'statistics', mine: 'true' })).items[0];
  const end = TODAY, start = new Date(Date.now() - 28 * 86400e3).toISOString().slice(0, 10);
  const rows = (j) => (j.rows || []).map((r) => Object.fromEntries(j.columnHeaders.map((h, i) => [h.name, r[i]])));
  const daily = rows(await yt('https://youtubeanalytics.googleapis.com/v2/reports', { ids: 'channel==MINE', startDate: new Date(Date.now() - 10 * 86400e3).toISOString().slice(0, 10), endDate: end,
    metrics: 'views,engagedViews,subscribersGained,subscribersLost', dimensions: 'day', sort: 'day' }));
  const vids = rows(await yt('https://youtubeanalytics.googleapis.com/v2/reports', { ids: 'channel==MINE', startDate: start, endDate: end,
    metrics: 'views,engagedViews,subscribersGained,averageViewPercentage,likes,shares', dimensions: 'video', sort: '-views', maxResults: 15 }));
  if (vids.length) {
    const meta = await yt('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet', id: vids.map((v) => v.video).join(',') });
    const title = Object.fromEntries(meta.items.map((m) => [m.id, [m.snippet.title, m.snippet.publishedAt]]));
    for (const v of vids) [v.title, v.at] = title[v.video] || ['?', ''];
  }
  return { followers: Number(ch.statistics.subscriberCount), views_total: Number(ch.statistics.viewCount), daily, videos: vids };
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
    `- Instagram: ${d.instagram.followers ?? '?'} (${sign(delta.instagram)})`, `- Facebook Page: ${d.facebook.followers ?? '?'} (${sign(delta.facebook)})`, `- YouTube: ${d.youtube?.followers ?? '?'} subscribers (${sign(delta.youtube)})`, '');

  if (d.instagram.daily) {
    L.push('## Instagram — follows vs unfollows per day', '', '| day | follows | unfollows | net |', '|---|---|---|---|');
    for (const x of d.instagram.daily) L.push(x.error ? `| ${x.day} | — | — | ${x.error} |` : `| ${x.day} | ${x.follows} | ${x.unfollows} | ${x.follows - x.unfollows} |`);
    L.push('', '_Last ~2 days fill in late (Meta). Unfollows are the leak: watch them against posting volume._', '');
  }
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

  L.push('## Facebook Page — daily', '', '| day | content views | unique viewers | new follows | engagements | video views | earnings $ | $ per 1k views |', '|---|---|---|---|---|---|---|---|');
  for (const [day, v] of Object.entries(d.facebook.days || {}).sort())
    L.push(`| ${day} | ${v.page_media_view ?? ''} | ${v.page_total_media_view_unique ?? ''} | ${v.page_daily_follows_unique ?? ''} | ${v.page_post_engagements ?? ''} | ${v.page_video_views ?? ''} | ${v.monetization_approximate_earnings != null ? '$' + Number(v.monetization_approximate_earnings).toFixed(2) : ''} | ${v.monetization_approximate_earnings != null && v.page_media_view ? '$' + (1000 * v.monetization_approximate_earnings / v.page_media_view).toFixed(4) : ''} |`);
  L.push('', '_Meta labels each day by its END time — a row is mostly the previous day (Postiz trap, same source)._', '');

  if (d.youtube && !d.youtube.error) {
    L.push('## YouTube — daily (analytics lag ~2–3 days)', '', '| day | views | engaged views | subs gained | subs lost |', '|---|---|---|---|---|');
    for (const x of d.youtube.daily) L.push(`| ${x.day} | ${x.views} | ${x.engagedViews} | ${x.subscribersGained} | ${x.subscribersLost} |`);
    L.push('', '## YouTube — top videos, last 28 days', '', '| published | views | engaged | subs gained | avg % watched | shares | title |', '|---|---|---|---|---|---|---|');
    for (const v of d.youtube.videos) L.push(`| ${(v.at || '').slice(5, 10)} | ${v.views} | ${v.engagedViews} | ${v.subscribersGained} | ${Math.round(v.averageViewPercentage)}% | ${v.shares} | [${short(v.title)}](https://youtube.com/shorts/${v.video}) |`);
    L.push('');
  } else if (d.youtube?.error) L.push(`## YouTube\n\n⚠️ ${d.youtube.error}\n`);
  if (d.rivals) {
    L.push('## Reference accounts (Business Discovery)', '', '| account | followers | posts in window | best post (likes / views) |', '|---|---|---|---|');
    for (const r of d.rivals) L.push(r.error ? `| @${r.user} | — | — | not visible (${r.error.slice(0, 50)}) |`
      : `| @${r.user} | ${r.followers} | ${r.posts_in_window} | ${r.best ? `[${r.best.like_count ?? "hidden"} likes${r.best.view_count ? ' / ' + r.best.view_count + ' views' : ''}](${r.best.permalink})` : '—'} |`);
  }
  return L.join('\n') + '\n';
}

await refreshThreads();
const safe = async (f) => { try { return await f(); } catch (e) { return { error: e.message.slice(0, 160) }; } };
const data = { at: new Date().toISOString(), hours: HOURS, threads: await safe(threads), instagram: await safe(instagram), facebook: await safe(facebook), youtube: await safe(youtube) };
if (!process.argv.includes('--no-rivals')) data.rivals = await safe(rivals);
const delta = logFollowers([['threads', data.threads.followers], ['instagram', data.instagram.followers], ['facebook', data.facebook.followers], ['youtube', data.youtube.followers]]);
fs.writeFileSync(path.join(OUT, `${TODAY}.json`), JSON.stringify(data, null, 1));
const md = report(data, delta);
fs.writeFileSync(path.join(OUT, `${TODAY}.md`), md);
for (const k of ['threads', 'instagram', 'facebook', 'youtube', 'rivals']) if (data[k]?.error) console.error(`⚠️ ${k}: ${data[k].error}`);
process.stdout.write(md);
