#!/usr/bin/env node
// Coverage watcher — wakes the session when a platform has gone quiet for longer than its plan allows.
//
//   node social/coverage.mjs [--every 1800] [--once]
//
// Why (Alex 09-28 23:20): "i can not see any post on facebook for 7 hours… we are running watchers
// continuously… maybe we should have a watcher that monitors all our socials". The match watcher kept
// the live session on four games while Facebook, WhatsApp and Snapchat got nothing all evening.
// This is the same pattern as social/matchwatch.mjs: poll, and EXIT with a message when something
// needs a human (or Claude) — the background task's exit is the wake-up.
//
// Source: social/state/posts_log.jsonl (Postiz + Metricool log themselves; Chrome/OneUp/phone posts
// only count if someone ran `node social/postlog.mjs add …`). A scheduled post counts from its
// scheduled time. Quiet hours 00:30–09:00 Oslo are never alarmed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(HERE, 'state', 'posts_log.jsonl');
const STATE = path.join(HERE, 'state', 'coverage.json');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const EVERY = Number(arg('every', 1800)) * 1000;

// Max hours between posts in waking hours — from social/state/PLATFORM_PLANS.md (09-28).
const MAX_GAP_H = { x: 3, threads: 2, telegram: 2, instagram: 5, facebook: 4, bluesky: 4, snapchat: 6, whatsapp: 6, youtube: 12, tiktok: 12 };
const REALERT_H = 2;

const osloHourMin = (d) => { const [h, m] = d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour12: false }).split(':').map(Number); return h + m / 60; };
const quiet = (d) => { const t = osloHourMin(d); return t >= 0.5 && t < 9; };

function check() {
  const now = Date.now();
  const rows = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
  const last = {};
  for (const r of rows) {
    const t = Date.parse(r.scheduledFor || r.at);
    if (!Number.isFinite(t) || t > now) continue;          // future posts don't cover the gap yet
    const p = String(r.platform || '').toLowerCase();
    if (!last[p] || t > last[p]) last[p] = t;
  }
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
  const late = [];
  for (const [p, max] of Object.entries(MAX_GAP_H)) {
    const gapH = last[p] ? (now - last[p]) / 3600e3 : Infinity;
    // Waking-hours gap only: if the last post was before 09:00 today, count from 09:00.
    const nine = new Date(); nine.setUTCHours(nine.getUTCHours() - Math.floor(osloHourMin(nine)) + 9, 0, 0, 0);
    const effH = last[p] && last[p] < nine.getTime() && now > nine.getTime() ? (now - nine.getTime()) / 3600e3 : gapH;
    if (effH > max && (!state[p] || now - state[p] > REALERT_H * 3600e3)) late.push({ p, gapH, max });
  }
  return { late, last, state };
}

const once = process.argv.includes('--once');
for (;;) {
  const now = new Date();
  if (!quiet(now)) {
    const { late, last, state } = check();
    if (late.length || once) {
      const fmt = (h) => (h === Infinity ? 'never' : `${h.toFixed(1)}h`);
      console.log(`COVERAGE ${now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour12: false }).slice(0, 5)} Oslo`);
      for (const { p, gapH, max } of late) console.log(`  ⚠️ ${p}: last post ${fmt(gapH)} ago (plan: ≤${max}h)`);
      if (once && !late.length) console.log('  all platforms within plan');
      for (const { p } of late) state[p] = Date.now();
      fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
      console.log('  last per platform: ' + Object.entries(last).map(([p, t]) => `${p} ${new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour12: false }).slice(0, 5)}`).join(' · '));
      process.exit(late.length ? 0 : 0);
    }
  } else if (once) { console.log('quiet hours (00:30–09:00 Oslo)'); process.exit(0); }
  await new Promise((r) => setTimeout(r, EVERY));
}
