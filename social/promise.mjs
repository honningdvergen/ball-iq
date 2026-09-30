#!/usr/bin/env node
// Promise ledger (audit 09-30): every "I'll do X at HH:MM" gets a row here with a due time and, where possible, a
// check command. The launchd watcher (watch.mjs) evaluates overdue rows every 10 min and alerts if a check fails or a
// manual row was never marked done. Chat is not a carrier; this file is.
//   node social/promise.mjs add --due 2026-09-30T18:00 --text "IG carousel published" [--check ig-carousel-today] [--owner claude]
//   node social/promise.mjs done <id> ["result"]      node social/promise.mjs list      node social/promise.mjs drop <id> "why"
// --check is a NAME from promise_checks.mjs (or `manual`). No arbitrary shell: the watcher runs unattended.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), F = path.join(HERE, 'state', 'promises.json');
export const load = () => (fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : []);
export const save = (x) => fs.writeFileSync(F, JSON.stringify(x, null, 1));
export const slot = (s) => { const t0 = Date.parse(s.length === 16 ? s + ':00Z' : s + 'Z'); const o = (t) => Date.parse(new Date(t).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T') + 'Z'); return /Z$|[+-]\d\d:\d\d$/.test(s) ? Date.parse(s) : t0 - (o(t0) - t0); };
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, a, b] = process.argv.slice(2), all = load();
  if (cmd === 'add') {
    if (!arg('due') || !arg('text')) { console.error('need --due (Oslo time, 2026-09-30T18:00) and --text'); process.exit(1); }
    const id = 'P' + String(all.length + 1).padStart(3, '0');
    all.push({ id, due: arg('due'), text: arg('text'), check: arg('check') || 'manual', owner: arg('owner') || 'claude', status: 'open', made: new Date().toISOString() });
    save(all); console.log(`${id} due ${arg('due')} Oslo — ${arg('text')} [${arg('check') || 'manual'}]`);
  } else if (cmd === 'done' || cmd === 'drop') {
    const r = all.find((x) => x.id === a); if (!r) { console.error('no such id'); process.exit(1); }
    r.status = cmd === 'done' ? 'done' : 'dropped'; r.result = b || ''; r.closed = new Date().toISOString(); save(all); console.log(r.id, r.status);
  } else { for (const r of all) console.log(`${r.id} ${r.status.padEnd(7)} ${r.due} ${r.check.padEnd(20)} ${r.text}${r.result ? ' → ' + r.result : ''}`); }
}
