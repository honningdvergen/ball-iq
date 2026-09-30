#!/usr/bin/env node
// Publish verifier — "scheduled" is not "published".
//
// 09-29 23:38 Metricool hit its account limit; the IG carousel and FB reel both failed and nothing noticed
// for 30 minutes (Alex saw it first). Scheduler status can't be trusted, so this reads what the PLATFORMS say:
// every Instagram / Facebook / Threads row in posts_log.jsonl whose slot passed >GRACE minutes ago must have a
// real published item near its scheduled time. No item → MISSED. enforce.mjs calls findMissed() every cycle,
// so a miss wakes the Editor within ~20 minutes of the slot.
//
//   node social/verify.mjs                  → print anything missed in the last 4 h (exit 1 if any)
//   node social/verify.mjs cancel <text>    → mark matching log rows as intentionally not published
//                                             (pulled to draft, deleted, replaced) so they stop alerting.
//                                             Do this EVERY time you pull, delete or replace a scheduled post.
//
// X, TikTok, YouTube, Snapchat, Telegram are not verified here (no read API in the stack); the hourly floor
// manager checks Metricool/Postiz status for those.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(HERE, 'state', 'posts_log.jsonl');
const IGNORE = path.join(HERE, 'state', 'verify_ignore.json');
const GRACE = 15 * 60e3, BEFORE = 20 * 60e3, AFTER = 45 * 60e3, LOOKBACK = 4 * 3600e3;
const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w'], { encoding: 'utf8' }).trim(); } catch { return ''; } };
const j = async (u) => { try { return await (await fetch(u)).json(); } catch (e) { return { error: String(e) }; } };
const oslo = (t) => new Date(t).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T');

// Metricool logs scheduledFor as naive Oslo local ("2026-09-29T23:38:00"), Postiz as UTC ("…Z").
export function slotMs(s) {
  if (!s) return NaN;
  if (/Z$|[+-]\d\d:\d\d$/.test(s)) return Date.parse(s);
  const t0 = Date.parse(s + 'Z');
  return t0 - (Date.parse(oslo(t0) + 'Z') - t0);
}
const readRows = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const readIgnore = () => { try { return new Set(JSON.parse(fs.readFileSync(IGNORE, 'utf8'))); } catch { return new Set(); } };

async function published() {
  const out = { instagram: [], facebook: [], threads: [] }, FB = key('shq-fb-page-token'), TH = key('shq-threads-token');
  if (FB) {
    const ig = await j(`https://graph.facebook.com/v26.0/17841445120874725/media?fields=timestamp&limit=50&access_token=${FB}`);
    out.instagram = (ig.data || []).map((x) => Date.parse(x.timestamp));
    const a = await j(`https://graph.facebook.com/v26.0/me/posts?fields=created_time&limit=50&access_token=${FB}`);
    const b = await j(`https://graph.facebook.com/v26.0/me/video_reels?fields=created_time&limit=25&access_token=${FB}`);
    out.facebook = [...(a.data || []), ...(b.data || [])].map((x) => Date.parse(x.created_time || x.updated_time)).filter(Boolean);
    out.fbOk = !!(a.data || b.data);
    out.igOk = !!ig.data;
  }
  if (TH) {
    const t = await j(`https://graph.threads.net/v1.0/me/threads?fields=timestamp&limit=50&access_token=${TH}`);
    out.threads = (t.data || []).map((x) => Date.parse(x.timestamp));
    out.thOk = !!t.data;
  }
  // A Facebook reel appears in both /posts and /video_reels a few seconds apart; count each real item once.
  for (const k of ['instagram', 'facebook', 'threads']) out[k] = out[k].sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 90e3);
  return out;
}

// Returns [{logId, platform, via, slot, text}] for slots that passed without a matching published item.
export async function findMissed(now = Date.now()) {
  const ignore = readIgnore(), pub = await published();
  const ok = { instagram: pub.igOk, facebook: pub.fbOk, threads: pub.thOk };
  const want = readRows().filter((r) => ['instagram', 'facebook', 'threads'].includes(String(r.platform).toLowerCase()) && ['metricool', 'postiz'].includes(r.via)
    && !ignore.has(r.logId) && !r.cancelled && r.scheduledFor)
    .map((r) => ({ ...r, slot: slotMs(r.scheduledFor), platform: String(r.platform).toLowerCase() }))
    .filter((r) => r.slot < now - GRACE && r.slot > now - LOOKBACK).sort((a, b) => a.slot - b.slot);
  const used = { instagram: new Set(), facebook: new Set(), threads: new Set() }, missed = [], unreadable = new Set();
  for (const [k, v] of Object.entries(ok)) if (!v) unreadable.add(k);   // blind even when no slot is due
  for (const r of want) {
    if (!ok[r.platform]) { unreadable.add(r.platform); continue; }   // platform API unreadable: do NOT cry wolf about a post, but never report success either
    const cand = pub[r.platform].map((t, i) => [i, t]).filter(([i, t]) => !used[r.platform].has(i) && t >= r.slot - BEFORE && t <= r.slot + AFTER)
      .sort((a, b) => Math.abs(a[1] - r.slot) - Math.abs(b[1] - r.slot))[0];
    if (cand) used[r.platform].add(cand[0]);
    else missed.push({ logId: r.logId, platform: r.platform, via: r.via, slot: oslo(r.slot).replace('T', ' ').slice(0, 16), text: String(r.text || '').slice(0, 60).replace(/\n/g, ' ') });
  }
  missed.checked = want.length;
  missed.unreadable = [...unreadable];   // 09-30 audit: verify printed "all published" (exit 0) when it could not read the platform at all
  return missed;
}

const MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (MAIN) {
  if (process.argv[2] === 'cancel') {
    const frag = process.argv.slice(3).join(' ').toLowerCase();
    if (!frag) { console.error('usage: verify.mjs cancel <logId or text fragment>'); process.exit(1); }
    const hit = readRows().filter((r) => r.logId === frag || String(r.logId).startsWith(frag) || String(r.text || '').toLowerCase().includes(frag));
    const ig = readIgnore(); hit.forEach((r) => ig.add(r.logId));
    fs.writeFileSync(IGNORE, JSON.stringify([...ig], null, 1));
    console.log(`marked ${hit.length} row(s) as intentionally not published`); hit.forEach((r) => console.log(`  ${r.logId} ${r.platform} ${r.scheduledFor} "${String(r.text).slice(0, 50)}"`));
  } else {
    const m = await findMissed();
    if (m.unreadable.length) { console.log(`verify: BLIND — could not read ${m.unreadable.join(', ')} (token or API). NOT verified; do not treat as OK.`); if (!m.length) process.exit(2); }
    if (!m.length) { console.log(`verify: ${m.checked} IG/FB/Threads slot(s) in the last 4h checked, all have a published item${m.checked === 0 ? ' (nothing was due — this is NOT evidence that anything published)' : ''}`); process.exit(0); }
    console.log(`MISSED ${m.length} scheduled post(s):`); m.forEach((x) => console.log(`  ✗ ${x.platform} ${x.slot} Oslo via ${x.via} (${x.logId}) "${x.text}"`));
    process.exit(1);
  }
}
