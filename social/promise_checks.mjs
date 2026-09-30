// Named checks the watcher may run for promise rows. Each returns {ok, detail}. Add a check here BEFORE promising something that needs one.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const key = (s) => { try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', s, '-w'], { encoding: 'utf8' }).trim(); } catch { return ''; } };
const j = async (u) => { try { return await (await fetch(u, { signal: AbortSignal.timeout(20000) })).json(); } catch (e) { return { error: String(e) }; } };
const oslo = (t) => new Date(t).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T');
import { findMissed } from './verify.mjs';
export const CHECKS = {
  'telegram-linked': async () => ({ ok: fs.existsSync(path.join(HERE, 'state/alert_chat.json')), detail: 'Alex has not pressed Start on @shq_poster_bot yet (or --link-chat was not run)' }),
  // scheduled IG/FB/Threads slots in the last 4h: at least one was due AND nothing missed AND platforms readable
  'verify-slots-published': async () => { const m = await findMissed(); if (m.unreadable.length) return { ok: false, detail: 'verifier BLIND: ' + m.unreadable.join(',') }; if (m.length) return { ok: false, detail: m.length + ' slot(s) never published: ' + m.map((x) => x.platform + ' ' + x.slot).join('; ') }; return { ok: m.checked >= 1, detail: m.checked + ' slot(s) checked, all published' }; },
  manual: async () => ({ ok: false, detail: 'manual item: nobody marked it done' }),
  'always-fail': async () => ({ ok: false, detail: 'deliberate test failure of the alert path' }),
  'heartbeat-fresh': async () => { const f = path.join(HERE, 'state/pm/WATCH_HEARTBEAT.json'); const a = fs.existsSync(f) ? Date.now() - Date.parse(JSON.parse(fs.readFileSync(f, 'utf8')).at) : 1e12; return { ok: a < 25 * 60e3, detail: `heartbeat age ${Math.round(a / 60e3)} min` }; },
  // an Instagram carousel published today (Oslo) after 12:00 Oslo
  'ig-carousel-today': async () => { const T = key('shq-fb-page-token'); if (!T) return { ok: false, detail: 'cannot read token (BLIND)' }; const d = await j(`https://graph.facebook.com/v26.0/17841445120874725/media?fields=timestamp,media_type&limit=15&access_token=${T}`); if (!d.data) return { ok: false, detail: 'IG API unreadable (BLIND)' }; const today = oslo(Date.now()).slice(0, 10); const hit = d.data.find((x) => x.media_type === 'CAROUSEL_ALBUM' && oslo(Date.parse(x.timestamp)).slice(0, 10) === today && Number(oslo(Date.parse(x.timestamp)).slice(11, 13)) >= 12); return { ok: !!hit, detail: hit ? `carousel at ${oslo(Date.parse(hit.timestamp))}` : 'no IG carousel published today after 12:00 Oslo' }; },
  // at least N Threads posts today (Oslo)
  'threads-today-10': async () => { const T = key('shq-threads-token'); if (!T) return { ok: false, detail: 'cannot read token (BLIND)' }; const d = await j(`https://graph.threads.net/v1.0/me/threads?fields=timestamp&limit=40&access_token=${T}`); if (!d.data) return { ok: false, detail: 'Threads API unreadable (BLIND)' }; const today = oslo(Date.now()).slice(0, 10); const n = d.data.filter((x) => oslo(Date.parse(x.timestamp)).slice(0, 10) === today).length; return { ok: n >= 10, detail: `${n} Threads posts today (target 10-14)` }; },
};
