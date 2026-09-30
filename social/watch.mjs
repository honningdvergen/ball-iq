#!/usr/bin/env node
// Background watcher — runs from launchd every 10 minutes (com.shq.watch), independent of any Claude session.
// 09-30 audit (ops + say-do): the whole watch layer lived inside Claude sessions on the laptop with no push to Alex;
// the floor manager stalled ~95% of a day on approval prompts. This job has NO permission surface and NO tokens:
// it runs verify.mjs's platform-truth check and, on a MISSED slot or a BLIND read, writes pm/ALERTS.md and pops a
// macOS notification. It also writes a heartbeat so a dead watcher is detectable (session crons read it).
//   node social/watch.mjs          (one cycle)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findMissed } from './verify.mjs';
import { load as loadPromises, save as savePromises, slot } from './promise.mjs';
import { CHECKS } from './promise_checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PM = path.join(HERE, 'state', 'pm'), HB = path.join(PM, 'WATCH_HEARTBEAT.json'), ALERTS = path.join(PM, 'ALERTS.md'), SEEN = path.join(HERE, 'state', 'watch_alerted.json');
const oslo = (t) => new Date(t).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T').slice(0, 16).replace('T', ' ');
fs.mkdirSync(PM, { recursive: true });
const CHAT = path.join(HERE, 'state', 'alert_chat.json');
const tgToken = () => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', 'shq-telegram-bot-token', '-w'], { encoding: 'utf8' }).trim(); } catch { return ''; } };
async function push(text) {   // phone push through our own Telegram bot to Alex's PRIVATE chat (set up once with --link-chat)
  try { const c = JSON.parse(fs.readFileSync(CHAT, 'utf8')), t = tgToken(); if (!c.chat_id || !t) return false;
    const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: c.chat_id, text: '⚠️ SHQ: ' + text.slice(0, 900) }), signal: AbortSignal.timeout(15000) });
    return r.ok; } catch { return false; }
}
if (process.argv.includes('--link-chat')) {   // Alex presses Start on the bot once; this stores his private chat id
  const t = tgToken(); const u = await (await fetch(`https://api.telegram.org/bot${t}/getUpdates?limit=50`)).json();
  const m = (u.result || []).map((x) => x.message).filter((x) => x && x.chat && x.chat.type === 'private').pop();
  if (!m) { console.log('no private message to the bot yet — open the bot in Telegram and press Start'); process.exit(1); }
  fs.writeFileSync(CHAT, JSON.stringify({ chat_id: m.chat.id, linked: new Date().toISOString() }));
  console.log('linked private chat; sending test push:', await push('phone push is linked — you will get missed-post and overdue-promise alerts here.')); process.exit(0);
}
const now = Date.now();
let m, err = '';
try { m = await findMissed(now); } catch (e) { m = Object.assign([], { unreadable: ['watcher-crashed'], checked: 0 }); err = String(e).slice(0, 200); }
fs.writeFileSync(HB, JSON.stringify({ at: new Date(now).toISOString(), oslo: oslo(now), checked: m.checked, missed: m.length, unreadable: m.unreadable, err }));

const seen = fs.existsSync(SEEN) ? JSON.parse(fs.readFileSync(SEEN, 'utf8')) : {};
const items = [];
for (const x of m) items.push({ key: 'missed:' + x.logId, text: `${x.platform} slot ${x.slot} Oslo never published (${x.via}): "${x.text}"` });
if (m.unreadable.length) items.push({ key: 'blind:' + m.unreadable.join(',') + ':' + new Date(now).toISOString().slice(0, 13), text: `publish verifier is BLIND (cannot read ${m.unreadable.join(', ')}); nothing is being verified${err ? ' — ' + err : ''}` });
// ---- promise ledger: every overdue open row is checked; failures alert ----
const promises = loadPromises(); let changed = false;
for (const r of promises.filter((x) => x.status === 'open' && slot(x.due) < now - 10 * 60e3)) {
  let res; try { res = await (CHECKS[r.check] || CHECKS.manual)(); } catch (e) { res = { ok: false, detail: 'check crashed: ' + String(e).slice(0, 100) }; }
  if (res.ok) { r.status = 'done'; r.result = 'auto: ' + res.detail; r.closed = new Date(now).toISOString(); changed = true; }
  else items.push({ key: 'promise:' + r.id, text: `OVERDUE promise ${r.id} (due ${r.due} Oslo): ${r.text} — ${res.detail}` });
}
if (changed) savePromises(promises);
const fresh = items.filter((i) => !seen[i.key] || now - seen[i.key] > 3 * 3600e3);
if (fresh.length) {
  for (const i of fresh) seen[i.key] = now;
  fs.writeFileSync(SEEN, JSON.stringify(seen));
  fs.appendFileSync(ALERTS, `\n## ${oslo(now)} Oslo\n` + fresh.map((i) => '- ' + i.text).join('\n') + '\n');
  await push(fresh.map((i) => i.text).join(' | '));
  try { execFileSync('osascript', ['-e', `display notification ${JSON.stringify(fresh.map((i) => i.text).join(' | ').slice(0, 220))} with title "SHQ — post did not publish"`]); } catch { /* notification is best-effort; ALERTS.md is the record */ }
}
console.log(`${oslo(now)} checked=${m.checked} missed=${m.length} unreadable=${m.unreadable.join(',') || '-'} alerts=${fresh.length}`);
