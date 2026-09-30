#!/usr/bin/env node
// Telegram channel poster — replaces Postiz for Telegram (free Bot API). Built 2026-09-29.
//
//   node social/tg.mjs send  --text "caption" [--photo file.png] [--video file.mp4] [--album a.png,b.png,c.png] [--dry]
//   node social/tg.mjs queue --at 2026-09-30T13:30 --text "…" [--photo …|--video …|--album …]   (Oslo time unless a Z/offset is given)
//   node social/tg.mjs run   [--every 30]    → posts due queue items (background task)
//   node social/tg.mjs list  |  node social/tg.mjs whoami
//
// Setup (once, by Alex — it involves a credential): 1) Telegram → @BotFather → /newbot → copy the token;
// 2) put it in the Keychain:  security add-generic-password -a shithouseryhq -s shq-telegram-bot-token -w '<TOKEN>'
// 3) add the bot as an ADMIN of the channel with "Post messages" (channel settings → Administrators);
// 4) optional: security add-generic-password -a shithouseryhq -s shq-telegram-chat -w '@shithouseryhq' (default below).
// The critic gate applies exactly like Postiz: no banger-critic PASS on the caption → no post (node social/review.mjs check --platform telegram).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(HERE, 'state', 'tg_queue.jsonl');
const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i > -1 && !process.argv[i + 1]?.startsWith('--') ? process.argv[i + 1] : (i > -1 ? true : d); };
const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const TOKEN = process.env.TG_BOT_TOKEN || key('shq-telegram-bot-token'), CHAT = process.env.TG_CHAT || key('shq-telegram-chat') || '@shithouseryhq';
const API = (m) => `https://api.telegram.org/bot${TOKEN}/${m}`;
const cmd = process.argv[2];

const gate = (text) => { try { execFileSync('node', [path.join(HERE, 'review.mjs'), 'check', '--platform', 'telegram', '--text', text], { stdio: 'pipe' }); return true; } catch (e) { console.error('BLOCKED by the critic gate: ' + String(e.stderr || '').trim()); return false; } };
async function call(method, body, isForm) { const r = await fetch(API(method), { method: 'POST', ...(isForm ? { body } : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) }); const j = await r.json(); if (!j.ok) throw new Error(`${method}: ${j.description}`); return j.result; }
const file = (p) => new Blob([fs.readFileSync(p)]);

async function send({ text = '', photo, video, album }, { skipGate = false } = {}) {   // queued items were gated when QUEUED (like Postiz), so a critic PASS that ages past 36 h before send time doesn't strand them
  if (!TOKEN) throw new Error('no bot token in Keychain (shq-telegram-bot-token) — see the setup note at the top of this file');
  if (text && !skipGate && !gate(text)) throw new Error('gate');
  if (album) {   // 2–10 photos as one album, caption on the first
    const files = String(album).split(',').filter(Boolean), fd = new FormData();
    fd.append('chat_id', CHAT); fd.append('media', JSON.stringify(files.map((f, i) => ({ type: 'photo', media: `attach://f${i}`, ...(i === 0 && text ? { caption: text } : {}) }))));
    files.forEach((f, i) => fd.append(`f${i}`, file(f), path.basename(f))); return call('sendMediaGroup', fd, true);
  }
  const fd = new FormData(); fd.append('chat_id', CHAT);
  if (video) { fd.append('video', file(video), path.basename(video)); if (text) fd.append('caption', text); fd.append('supports_streaming', 'true'); return call('sendVideo', fd, true); }
  if (photo) { fd.append('photo', file(photo), path.basename(photo)); if (text) fd.append('caption', text); return call('sendPhoto', fd, true); }
  return call('sendMessage', { chat_id: CHAT, text });
}
const logIt = (o, res) => { try { execFileSync('node', [path.join(HERE, 'postlog.mjs'), 'add', '--platform', 'telegram', '--text', o.text || '', '--via', 'tg-bot', ...(res?.message_id ? ['--url', `https://t.me/${String(CHAT).replace('@', '')}/${res.message_id}`] : [])], { stdio: 'ignore' }); } catch { /* logging is best effort */ } };
const oslo2iso = (s) => (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : new Date(new Date(s + 'Z').getTime() - (Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Oslo', timeZoneName: 'shortOffset' }).formatToParts(new Date(s + 'Z')).find((p) => p.type === 'timeZoneName').value.replace('GMT', '') || 0)) * 3600e3).toISOString());

if (cmd === 'send') {
  const o = { text: arg('text', ''), photo: arg('photo'), video: arg('video'), album: arg('album') };
  if (process.argv.includes('--dry')) { console.log('DRY', JSON.stringify(o), 'gate:', o.text ? gate(o.text) : 'n/a', 'token:', TOKEN ? 'present' : 'MISSING'); process.exit(0); }
  const res = await send(o); logIt(o, Array.isArray(res) ? res[0] : res); console.log('sent', JSON.stringify(res).slice(0, 120));
} else if (cmd === 'queue') {
  const at = oslo2iso(arg('at')); const o = { at, text: arg('text', ''), photo: arg('photo'), video: arg('video'), album: arg('album'), done: false };
  if (o.text && !gate(o.text)) { console.error('not queued: no critic PASS'); process.exit(1); }
  for (const f of [o.photo, o.video, ...(o.album ? String(o.album).split(',') : [])].filter(Boolean)) if (!fs.existsSync(f)) { console.error('missing file ' + f); process.exit(1); }
  fs.appendFileSync(QUEUE, JSON.stringify(o) + '\n'); console.log('queued for', at);
} else if (cmd === 'run') {
  const every = Number(arg('every', 30)) * 1000;
  for (;;) {
    const rows = fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    let changed = false;
    for (const r of rows) if (!r.done && Date.parse(r.at) <= Date.now()) { try { const res = await send(r, { skipGate: true }); logIt(r, Array.isArray(res) ? res[0] : res); r.done = true; r.sent = new Date().toISOString(); console.log('sent', r.at, (r.text || '').slice(0, 50)); } catch (e) { r.error = String(e.message); r.done = e.message === 'gate'; console.error('failed', r.at, e.message); } changed = true; }
    if (changed) fs.writeFileSync(QUEUE, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    await new Promise((res) => setTimeout(res, every));
  }
} else if (cmd === 'list') {
  for (const l of (fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, 'utf8').split('\n').filter(Boolean) : [])) { const r = JSON.parse(l); console.log(r.done ? '✓' : '·', r.at, (r.text || '').slice(0, 60)); }
} else if (cmd === 'selftest') {   // diagnostic only: fixed text, deleted immediately, never takes user content (so it cannot bypass the critic gate for real posts)
  const m = await call('sendMessage', { chat_id: CHAT, text: '🔧 bot check', disable_notification: true });
  await call('deleteMessage', { chat_id: CHAT, message_id: m.message_id }); console.log('selftest ok: sent and deleted message', m.message_id);
} else if (cmd === 'whoami') { console.log(JSON.stringify(await (await fetch(API('getMe'))).json())); }
else console.error('usage: tg.mjs send|queue|run|list|whoami (see the header)');
