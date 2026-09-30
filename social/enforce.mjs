#!/usr/bin/env node
// Rule enforcer — the always-on watcher for social/state/A_GRADE_PLAN.md (Alex 09-29: "a specialized
// agent that is awake the entire day that makes sure we enforce these new rules").
//
//   node social/enforce.mjs [--every 600] [--once]
//
// No tokens while it sleeps. It reads what was ACTUALLY published (Instagram + Threads Graph APIs, token in
// Keychain) plus posts_log.jsonl (scheduled/queued rows), checks the plan's hard rules, appends every
// finding to social/state/pm/ENFORCEMENT_LOG.md, and EXITS with the list when there is a NEW violation —
// the exit wakes the Claude session (same pattern as coverage.mjs / matchwatch.mjs). It never posts or edits.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findMissed } from './verify.mjs';   // 09-29: "scheduled" is not "published" — check the platforms themselves

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(HERE, 'state', 'posts_log.jsonl');
const OUT = path.join(HERE, 'state', 'pm', 'ENFORCEMENT_LOG.md');
const MATCHDAYS = path.join(HERE, 'state', 'matchdays.txt');   // one YYYY-MM-DD per line (Oslo): big-match days allow more feed posts (Alex 09-29: post-match carousels are the best performers)
const STATE = path.join(HERE, 'state', 'enforce.json');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const EVERY = Number(arg('every', 600)) * 1000, ONCE = process.argv.includes('--once');
const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w'], { encoding: 'utf8' }).trim(); } catch { return ''; } };
const j = async (u) => { try { return await (await fetch(u)).json(); } catch (e) { return { error: String(e) }; } };
const oslo = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T');   // 2026-09-29T13:10:00
const osloHour = (d) => Number(oslo(d).slice(11, 13)) + Number(oslo(d).slice(14, 16)) / 60;
const day = (d) => oslo(d).slice(0, 10);

const FB0 = key('shq-fb-page-token');
// event tier for a day: 1 normal, 2 big (CL night, big derby, verdict), 3 mega (finals, World Cup final). File lines: 'YYYY-MM-DD [big|mega]'.
const eventTier = (d) => { if (!fs.existsSync(MATCHDAYS)) return 1; const l = fs.readFileSync(MATCHDAYS, 'utf8').split('\n').map((x) => x.trim().split(/\s+/)).find((x) => x[0] === d); return !l ? 1 : l[1] === 'mega' ? 3 : 2; };
async function check() {
  const v = [];   // {id, rule, msg}
  const now = Date.now(), today = day(now);
  // ---- Facebook (published): video only (photo/album posts reach ~nobody: median 21–27 views) ----
  if (FB0) {
    const d = await j(`https://graph.facebook.com/v26.0/me/posts?fields=created_time,permalink_url,attachments{media_type}&limit=25&access_token=${FB0}`);
    for (const x of (d.data || []).filter((x) => now - Date.parse(x.created_time) < 24 * 3600e3)) {
      const ty = x.attachments?.data?.[0]?.media_type;
      if (ty === 'photo' || ty === 'album') v.push({ id: `fb-photo-${x.created_time}`, rule: 'Facebook video only', msg: `Facebook ${ty} post ${oslo(x.created_time)} Oslo (photo/album median 21–27 views, 3% of Page views) ${x.permalink_url}` });
    }
  }
  // ---- Instagram (published) ----
  const FB = key('shq-fb-page-token');
  if (FB) {
    const d = await j(`https://graph.facebook.com/v26.0/17841445120874725/media?fields=timestamp,media_product_type,media_type,is_shared_to_feed,permalink&limit=40&access_token=${FB}`);
    const m = (d.data || []).filter((x) => now - Date.parse(x.timestamp) < 48 * 3600e3);
    const feedToday = m.filter((x) => x.media_product_type === 'FEED' && day(x.timestamp) === today);
    const tier = eventTier(today), matchDay = tier > 1, cap = 6 * tier;
    if (feedToday.length > cap) v.push({ id: `ig-feed-${today}-${feedToday.length}`, rule: `IG soft ceiling ${cap} feed posts/day${matchDay ? ' (big-event day)' : ''} — quality first; review, not automatic fail`, msg: `Instagram feed posts today: ${feedToday.length} (max ${cap})` });
    for (const x of m.filter((x) => x.media_product_type === 'REELS')) {
      const h = osloHour(x.timestamp);
      if (h >= 0.5 && h < 9) v.push({ id: `ig-night-${x.timestamp}`, rule: 'No overnight IG reels', msg: `IG reel published ${oslo(x.timestamp)} Oslo (00:30–09:00 banned) ${x.permalink}` });
    }
  }
  // ---- Threads (published) ----
  const TH = key('shq-threads-token');
  if (TH) {
    const d = await j(`https://graph.threads.net/v1.0/me/threads?fields=timestamp,media_type,permalink&limit=60&access_token=${TH}`);
    const t = (d.data || []).filter((x) => now - Date.parse(x.timestamp) < 24 * 3600e3).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    for (const x of t) {
      if (x.media_type === 'TEXT_POST' || x.media_type === 'VIDEO') v.push({ id: `th-type-${x.timestamp}`, rule: 'Threads: images/carousels only', msg: `Threads ${x.media_type} at ${oslo(x.timestamp)} Oslo ${x.permalink} (text-only 4% hit / video 5%)` });
      const h = osloHour(x.timestamp);
      if ((h >= (eventTier(day(x.timestamp)) > 1 ? 24 : 22) || h < 8) && !(eventTier(day(x.timestamp)) > 1 && h < 1)) v.push({ id: `th-night-${x.timestamp}`, rule: 'Threads window 08:00–22:00 Oslo (to 24:00 on big-event days)', msg: `Threads post at ${oslo(x.timestamp)} Oslo, outside the window (unless a live match) ${x.permalink}` });
    }
    for (let i = 0; i < t.length; i++) {
      const inHour = t.filter((y) => Date.parse(y.timestamp) > Date.parse(t[i].timestamp) - 3600e3 && Date.parse(y.timestamp) <= Date.parse(t[i].timestamp)).length;
      if (inHour > 2) v.push({ id: `th-dens-${t[i].timestamp}`, rule: 'Threads ≤2 posts/hour', msg: `Threads: ${inHour} posts in the hour up to ${oslo(t[i].timestamp)} Oslo (≥4/hour cuts median views ~45%)` });
    }
    if (osloHour(now) >= 18) {
      const imgs = t.filter((x) => day(x.timestamp) === today && /IMAGE|CAROUSEL/.test(x.media_type)).length;
      if (imgs < 5) v.push({ id: `th-quota-${today}`, rule: 'Threads ≥7 image posts/day', msg: `Threads image/carousel posts today: ${imgs} at ${oslo(now).slice(11, 16)} Oslo (target 7)` });
    }
  }
  // ---- posts_log (scheduled + logged) ----
  const rows = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
  const recent = rows.filter((r) => { const s = Date.parse(r.scheduledFor || r.at); return s > now - 24 * 3600e3 && s < now + 48 * 3600e3; });
  for (const r of recent) {
    const p = String(r.platform || '').toLowerCase(), s = r.scheduledFor || r.at, h = osloHour(s), txt = r.text || '';
    if (['instagram', 'threads', 'x', 'facebook'].includes(p) && (!r.critic || r.critic === '-') && r.alex !== 'yes') v.push({ id: `nocritic-${r.logId}`, rule: 'Every post needs a critic PASS', msg: `${p} ${oslo(s)} Oslo has no critic score: "${txt.slice(0, 50)}"` });
    if (p === 'instagram' && h >= 0.5 && h < 9 && Date.parse(s) > now) v.push({ id: `sched-night-${r.logId}`, rule: 'No overnight IG', msg: `Scheduled IG post at ${oslo(s)} Oslo (overnight banned): "${txt.slice(0, 40)}"` });
    if ((p === 'x' || p === 'threads') && /#[A-Za-z]/.test(txt)) v.push({ id: `hash-${r.logId}`, rule: 'No hashtags on X/Threads', msg: `${p} post has a hashtag: "${txt.slice(0, 50)}"` });
  }
  const last = rows.filter((r) => ['instagram', 'tiktok', 'facebook'].includes(String(r.platform).toLowerCase())).slice(-12);
  if (last.length >= 9) { const cry = last.filter((r) => /😭/.test(r.text || '')).length; if (cry > last.length / 3) v.push({ id: `cry-${last.at(-1).logId}`, rule: '😭 on ≤1 of 3', msg: `😭 on ${cry} of the last ${last.length} IG/TikTok/FB captions` }); }
  // ---- did every scheduled IG/FB/Threads slot actually publish? (Metricool cap failure 09-29 went unseen for 30 min) ----
  const missedNow = await findMissed(now);
  if (missedNow.unreadable.length) v.push({ id: `verify-blind-${day(now)}-${Math.floor(osloHour(now))}`, rule: 'Publish verifier is BLIND', msg: `verify.mjs could not read ${missedNow.unreadable.join(', ')} this cycle (Keychain token or API). Publishing is NOT being verified.` });
  for (const m of missedNow) v.push({ id: `missed-${m.logId}`, rule: 'Scheduled post never appeared on the platform', msg: `${m.platform} slot ${m.slot} Oslo (${m.via}) has no published item: "${m.text}" — check Metricool/Postiz status (Metricool "account limit"?), re-route, and mark dead rows with: node social/verify.mjs cancel <logId>` });
  return v;
}

const PLAN = { threads: ['7–12 image posts', 14], instagram: ['quality first: ~6–8, up to 16 on big-event days', 8], facebook: ['videos only, ~6–9 (more on big days)', 9], x: ['4–6 by Alex (8–10+ on big nights)', 14], tiktok: ['1 native + 1 auto', 3], youtube: ['1–2 mirror', 2], bluesky: ['≤3 image mirror', 3], snapchat: ['4 Spotlights + 1–2 Stories', 6], telegram: ['mirror', 15], whatsapp: ['parked', 0] };   // SOFT ceilings: quality first (Alex 09-29); doubled on big-event days (matchdays.txt)
function ledger(v) {
  const rows = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
  const now = Date.now(), today = day(now), c = {};
  const mult = eventTier(today), seenTxt = new Set();
  for (const r of rows) { const t = Date.parse(r.scheduledFor || r.at); if (day(t) !== today) continue; const p = String(r.platform || '').toLowerCase().replace('tiktok-business', 'tiktok'); const dk = p + '|' + String(r.text || '').trim().toLowerCase().slice(0, 80); if (r.text && seenTxt.has(dk)) continue; seenTxt.add(dk); c[p] = c[p] || { done: 0, queued: 0 }; c[p][t <= now ? 'done' : 'queued']++; }   // one post = one row: a carousel is ONE post; rows logged at creation AND at publish are de-duplicated by caption
  const out = ['| platform | posted today | still queued | plan | status |', '|---|---|---|---|---|'];
  for (const [p, [plan, max]] of Object.entries(PLAN)) { const x = c[p] || { done: 0, queued: 0 }, tot = x.done + x.queued; out.push(`| ${p} | ${x.done} | ${x.queued} | ${plan} | ${tot > max * mult ? '⚠️ over soft ceiling (' + max * mult + ') — review quality'  : tot === 0 && max > 0 ? '⚠️ nothing logged' : 'ok'} |`); if (tot > max * mult) v.push({ id: `cap-${p}-${today}-${tot}`, rule: `${p} soft ceiling`, msg: `${p}: ${tot} posts today (plan: ${plan}; soft ceiling ${max * mult}) — fine if every one is 10/10, otherwise trim` }); }
  fs.writeFileSync(path.join(HERE, 'state', 'pm', 'POSTING_LEDGER.md'), `# POSTING LEDGER ${oslo(now).replace('T', ' ').slice(0, 16)} Oslo (from posts_log.jsonl — Chrome/phone posts (X by Alex, Snapchat by OneUp, Alex's IG-app posts) only count if logged with social/postlog.mjs)\n` + out.join('\n') + '\n');
}
const seen = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
for (;;) {
  const v = await check(); ledger(v); const now = Date.now(), fresh = v.filter((x) => !seen[x.id]);
  const stamp = oslo(now).replace('T', ' ').slice(0, 16);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.appendFileSync(OUT, `\n## ${stamp} Oslo — ${v.length ? v.length + ' open violation(s), ' + fresh.length + ' new' : 'clean'}\n` + v.map((x) => `- ${seen[x.id] ? '' : '**NEW** '}[${x.rule}] ${x.msg}`).join('\n') + (v.length ? '\n' : ''));
  for (const x of v) seen[x.id] = seen[x.id] || now;
  fs.writeFileSync(STATE, JSON.stringify(seen));
  if (fresh.length) { console.log(`ENFORCEMENT ${stamp} Oslo — ${fresh.length} NEW violation(s):`); for (const x of fresh) console.log(`  ✗ [${x.rule}] ${x.msg}`); process.exit(0); }
  if (ONCE) { console.log(`enforce: ${v.length ? v.length + ' known open violation(s) (already alerted), see pm/ENFORCEMENT_LOG.md' : 'clean'}`); process.exit(0); }
  await new Promise((r) => setTimeout(r, EVERY));
}
