#!/usr/bin/env node
// Telegram channel poster — replaces Postiz for Telegram (free Bot API). Built 2026-09-29.
//
//   node social/tg.mjs send  --text "caption" [--photo file.png] [--video file.mp4] [--album a.png,b.png,c.png] [--html] [--dry]
//   node social/tg.mjs send  --poll "question" --options "A|B|C|D" --correct 0 [--explain "shown after voting"] [--dry]
//     --html   text/caption is Telegram HTML, e.g. "#151 was <tg-spoiler>GATTUSO</tg-spoiler>" (escape & < > yourself)
//     --poll   a native QUIZ poll (anonymous, as channels require); --correct is the 0-based index into --options
//   node social/tg.mjs queue --at 2026-09-30T13:30 --text "…" [--photo …|--video …|--album …]   (Oslo time unless a Z/offset is given)
//   node social/tg.mjs run   [--every 30]    → posts due queue items (background task)
//   node social/tg.mjs list  |  node social/tg.mjs whoami
//
// Setup (once, by Alex — it involves a credential): 1) Telegram → @BotFather → /newbot → copy the token;
// 2) put it in the Keychain:  security add-generic-password -a shithouseryhq -s shq-telegram-bot-token -w '<TOKEN>'
// 3) add the bot as an ADMIN of the channel with "Post messages" (channel settings → Administrators);
// 4) optional: security add-generic-password -a shithouseryhq -s shq-telegram-chat -w '@shithouseryhq' (default below).
// The critic gate applies exactly like Postiz: no banger-critic PASS on the caption → no post (node social/review.mjs check --platform telegram).
// What the gate checks: the caption with any --html tags stripped (draft it without tags), or for a poll the question alone.
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

// The text the critic gate sees: tags stripped for --html (so the draft is written plain), the question for a poll.
const plain = (t) => String(t).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const gateText = (o) => (o.poll ? String(o.poll) : o.html ? plain(o.text || '') : (o.text || ''));
function pollBody(o) {   // Bot API limits: question ≤300, 2–10 options ≤100 each, explanation ≤200
  const options = String(o.options || '').split('|').map((x) => x.trim()).filter(Boolean), correct = Number(o.correct);
  if (String(o.poll).length > 300) throw new Error('poll question is over 300 chars');
  if (options.length < 2 || options.length > 10 || options.some((x) => x.length > 100)) throw new Error('--options needs 2–10 "|"-separated options of ≤100 chars');
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw new Error('--correct must be a 0-based index into --options');
  if (o.explain && String(o.explain).length > 200) throw new Error('--explain is over 200 chars');
  return { chat_id: CHAT, question: String(o.poll), options: options.map((t) => ({ text: t })), type: 'quiz', correct_option_id: correct, is_anonymous: true, ...(o.explain ? { explanation: String(o.explain) } : {}) };
}

async function send({ text = '', photo, video, album, html, poll, options, correct, explain }, { skipGate = false } = {}) {   // queued items were gated when QUEUED (like Postiz), so a critic PASS that ages past 36 h before send time doesn't strand them
  if (!TOKEN) throw new Error('no bot token in Keychain (shq-telegram-bot-token) — see the setup note at the top of this file');
  const g = gateText({ text, html, poll });
  if (g && !skipGate && !gate(g)) throw new Error('gate');
  if (poll) return call('sendPoll', pollBody({ poll, options, correct, explain }));
  const pm = html ? { parse_mode: 'HTML' } : {};
  if (album) {   // 2–10 photos as one album, caption on the first
    const files = String(album).split(',').filter(Boolean), fd = new FormData();
    fd.append('chat_id', CHAT); fd.append('media', JSON.stringify(files.map((f, i) => ({ type: 'photo', media: `attach://f${i}`, ...(i === 0 && text ? { caption: text, ...pm } : {}) }))));
    files.forEach((f, i) => fd.append(`f${i}`, file(f), path.basename(f))); return call('sendMediaGroup', fd, true);
  }
  const fd = new FormData(); fd.append('chat_id', CHAT); if (html && (video || photo) && text) fd.append('parse_mode', 'HTML');
  if (video) { fd.append('video', file(video), path.basename(video)); if (text) fd.append('caption', text); fd.append('supports_streaming', 'true'); return call('sendVideo', fd, true); }
  if (photo) { fd.append('photo', file(photo), path.basename(photo)); if (text) fd.append('caption', text); return call('sendPhoto', fd, true); }
  return call('sendMessage', { chat_id: CHAT, text, ...pm });
}
const logIt = (o, res) => { try { execFileSync('node', [path.join(HERE, 'postlog.mjs'), 'add', '--platform', 'telegram', '--text', gateText(o), '--via', 'tg-bot', ...(res?.message_id ? ['--url', `https://t.me/${String(CHAT).replace('@', '')}/${res.message_id}`] : [])], { stdio: 'ignore' }); } catch { /* logging is best effort */ } };
// --html is a bare flag; poll fields stay undefined unless --poll is given, so old queue rows read the same.
const readPost = () => ({ text: arg('text', ''), photo: arg('photo'), video: arg('video'), album: arg('album'), ...(process.argv.includes('--html') ? { html: true } : {}), ...(arg('poll') ? { poll: arg('poll'), options: arg('options'), correct: arg('correct'), explain: arg('explain') } : {}) });
const oslo2iso = (s) => (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : new Date(new Date(s + 'Z').getTime() - (Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Oslo', timeZoneName: 'shortOffset' }).formatToParts(new Date(s + 'Z')).find((p) => p.type === 'timeZoneName').value.replace('GMT', '') || 0)) * 3600e3).toISOString());

if (cmd === 'send') {
  const o = readPost();
  if (process.argv.includes('--dry')) { if (o.poll) pollBody(o); console.log('DRY', JSON.stringify(o), 'gate:', gateText(o) ? gate(gateText(o)) : 'n/a', 'token:', TOKEN ? 'present' : 'MISSING'); process.exit(0); }
  const res = await send(o); logIt(o, Array.isArray(res) ? res[0] : res); console.log('sent', JSON.stringify(res).slice(0, 120));
} else if (cmd === 'queue') {
  const at = oslo2iso(arg('at')); const o = { at, ...readPost(), done: false };
  if (o.poll) pollBody(o);   // fail at queue time, not at send time
  if (gateText(o) && !gate(gateText(o))) { console.error('not queued: no critic PASS'); process.exit(1); }
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
  for (const l of (fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, 'utf8').split('\n').filter(Boolean) : [])) { const r = JSON.parse(l); console.log(r.done ? '✓' : '·', r.at, (r.poll ? '[poll] ' : '') + gateText(r).slice(0, 60)); }
} else if (cmd === 'selftest') {   // diagnostic only: fixed text, deleted immediately, never takes user content (so it cannot bypass the critic gate for real posts)
  const m = await call('sendMessage', { chat_id: CHAT, text: '🔧 bot check', disable_notification: true });
  await call('deleteMessage', { chat_id: CHAT, message_id: m.message_id }); console.log('selftest ok: sent and deleted message', m.message_id);
} else if (cmd === 'whoami') { console.log(JSON.stringify(await (await fetch(API('getMe'))).json())); }
else console.error('usage: tg.mjs send|queue|run|list|whoami (see the header)');
