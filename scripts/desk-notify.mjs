// Posts to "Ball IQ Desk", the Telegram group where the app session tells Alex
// what happened: what went live, what needs his eyes, builds, numbers.
// (Alex, 9 Oct 2026: "let us start a ball iq news bot channel like SHQ".)
//
//   node scripts/desk-notify.mjs "text" --topic shipped|needs|builds|numbers|alerts
//        [--photo file | --doc file] [--dry]
//
// Nothing secret lives in this repo, which is public:
//   - the group and topic ids are read from a file OUTSIDE it
//     (~/ball-iq-audit/tg_desk_balliq.json, written by the social session,
//     which made the group): { chat_id, topics: { shipped, needs, builds,
//     numbers, alerts: null } }. A null topic is the group's General topic.
//   - the bot token is read from the macOS Keychain at send time and is never
//     printed, logged or put in an error message.
//
// ⚠️ SEND ONLY. The bot is shared with the social desk, whose launchd job polls
// getUpdates to read Alex's replies, and Telegram gives each update to one
// poller. A single getUpdates call from here would steal them. The METHODS
// list below is the whole of what this script may call.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename } from 'node:path';

const DESK_FILE = process.env.BIQ_DESK_FILE || `${homedir()}/ball-iq-audit/tg_desk_balliq.json`;
const KEYCHAIN = { account: 'shithouseryhq', service: 'shq-telegram-bot-token' };
const METHODS = ['sendMessage', 'sendPhoto', 'sendDocument'];
const TEXT_MAX = 4096, CAPTION_MAX = 1024;

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const dry = args.includes('--dry');
const topic = flag('--topic') || 'alerts';
const photo = flag('--photo');
const doc = flag('--doc');
const valued = new Set(['--topic', '--photo', '--doc']);
const text = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])).join(' ').trim();

const stop = (code, msg) => { console.error(`desk-notify: ${msg}`); process.exit(code); };
const clip = (s, max) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

if (!text && !photo && !doc) stop(1, 'nothing to send (give a text, --photo or --doc)');
if (photo && doc) stop(1, 'one attachment at a time');
for (const f of [photo, doc]) if (f && !existsSync(f)) stop(1, `no such file: ${f}`);

// Exit 2, not 1: "the desk does not exist yet" is a state a caller may want to
// tell apart from a mistake in the call.
if (!existsSync(DESK_FILE)) stop(2, `the desk is not set up yet (no ${DESK_FILE})`);
let desk;
try { desk = JSON.parse(readFileSync(DESK_FILE, 'utf8')); } catch { stop(2, `cannot read ${DESK_FILE}`); }
if (!desk?.chat_id || !desk.topics || !(topic in desk.topics)) {
  stop(1, `unknown topic "${topic}" (have: ${Object.keys(desk?.topics || {}).join(', ') || 'none'})`);
}
const thread = desk.topics[topic];
const method = photo ? 'sendPhoto' : doc ? 'sendDocument' : 'sendMessage';
if (!METHODS.includes(method)) stop(1, 'refused: not a send method');

if (dry) {
  console.log(`desk-notify (dry): ${method} to "${topic}"${thread ? '' : ' (General)'}, ${text.length} characters${photo || doc ? `, ${basename(photo || doc)}` : ''}`);
  process.exit(0);
}

let token;
try {
  token = execFileSync('security', ['find-generic-password', '-a', KEYCHAIN.account, '-s', KEYCHAIN.service, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch { stop(3, 'could not read the bot token from the Keychain'); }
if (!token) stop(3, 'the Keychain item is empty');

let body, headers;
if (method === 'sendMessage') {
  headers = { 'content-type': 'application/json' };
  body = JSON.stringify({ chat_id: desk.chat_id, text: clip(text, TEXT_MAX), disable_web_page_preview: true, ...(thread ? { message_thread_id: thread } : {}) });
} else {
  const file = photo || doc;
  body = new FormData();
  body.set('chat_id', String(desk.chat_id));
  if (thread) body.set('message_thread_id', String(thread));
  if (text) body.set('caption', clip(text, CAPTION_MAX));
  body.set(photo ? 'photo' : 'document', new Blob([readFileSync(file)]), basename(file));
}

try {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers, body });
  const out = await res.json().catch(() => ({}));
  if (!out.ok) stop(4, `Telegram refused it: ${out.description || res.status}`);
  console.log(`desk-notify: sent to "${topic}" (message ${out.result?.message_id})`);
} catch (e) {
  // The URL carries the token, so never print the error object itself.
  stop(4, `could not reach Telegram (${e?.name || 'error'})`);
}
