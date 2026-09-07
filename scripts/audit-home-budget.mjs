// audit-home-budget.mjs — the Home screen's JavaScript, measured after `vite build`.
//
//   node scripts/audit-home-budget.mjs            # exit 1 over budget
//
// WHY. The senior review of 2026-09-06 (.audit/senior-review-2026-09-06,
// D14) measured ~1.7 MB of JS to paint Home, 562 KB of it the question INDEX —
// pulled statically by HomeScreen so a retired tile could count its questions.
// Nothing in the gate would have noticed it growing back. Two checks:
//
//   1. STATIC-IMPORT BAN. The chunks that paint Home (the entry, GameRoot and
//      HomeScreen if split) may not import the bank, the index or the Mystery
//      pools statically. Those are play-time data; Home decides, it does not
//      play. A static `import"./questions-index-…"` at the top of a chunk is
//      the exact shape of the regression this guards.
//   2. EAGER BUDGET. Sum of the entry scripts + modulepreloads + GameRoot.
//      ⚠️ Measured 2026-09-06: 831 KB, of which GameRoot (App.jsx in one chunk)
//      is 561 KB. Supabase, the index, Profile and Online are IDLE PREFETCHES
//      (dynamic, after paint) — the review's "1.7 MB on Home" counted those.
//      ✅ The ≤600 KB target was MET on 2026-09-07 at 593 KB, and WITHOUT the
//      App.jsx services split this comment assumed it would need. It came from
//      taking play-time weight off the boot path instead: the generated leak
//      table, the frozen daily log, and four screens nobody sees on arrival.
//      ⚠️ Several of those are DEFERRED, NOT ELIMINATED — the History and
//      Online panes still render (hidden) whenever Home is up, so their chunks
//      arrive shortly after paint. This budget measures what Home BLOCKS on,
//      which is the number that decides how fast it paints; it is not a claim
//      about total bytes transferred.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const ASSETS = resolve(DIST, 'assets');
const BUDGET_KB = 600; // ⚠️ THIS IS NOW THE REVIEW'S TARGET, NOT A CEILING WITH ROOM. 593 KB measured 2026-09-07 (831 -> 772 -> 697 -> 666 -> 633 -> 608 -> 593). Raising it means giving the target up — say why.
// ⚠️ questionConflicts JOINED THIS LIST 2026-09-07 — it was the SECOND-LARGEST
// module in the eager Home chunk (81 KB of generated leak-pair data) and the
// ban did not catch it purely because the regex did not name it. The lesson is
// that this list is an allow-list of known offenders, not a definition: any
// generated play-time data table belongs here the day it is created.
const HEAVY = /^(questions|questions-index|questionConflicts|mysteryPool|mysteryCareers)-[A-Za-z0-9_-]+\.js$/;
const HOME_CHUNKS = /^(main|GameRoot|HomeScreen)-[A-Za-z0-9_-]+\.js$/;

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const eager = new Set();
for (const m of html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)) eager.add(m[1]);
const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'));
for (const f of files) if (/^GameRoot-/.test(f)) eager.add(f);

let bad = 0;
for (const f of files) {
  if (!HOME_CHUNKS.test(f)) continue;
  const src = readFileSync(resolve(ASSETS, f), 'utf8');
  // Static imports are `import"./x.js"` / `import{a}from"./x.js"`; dynamic ones
  // are `import("./x.js")` and the vite preload helper. Only the former counts.
  for (const m of src.matchAll(/import(?:\{[^}]*\}from|[A-Za-z_$][\w$]*from)?"\.\/([^"]+\.js)"/g)) {
    const dep = basename(m[1]);
    if (HEAVY.test(dep)) { console.error(`✗ ${f} imports ${dep} STATICALLY — Home must not carry play-time data`); bad++; }
  }
}
let total = 0;
const rows = [];
for (const f of eager) { const b = statSync(resolve(ASSETS, f)).size; total += b; rows.push([f, b]); }
rows.sort((a, b) => b[1] - a[1]);
for (const [f, b] of rows) console.log(`  ${String(Math.round(b / 1024)).padStart(5)} KB  ${f}`);
const kb = Math.round(total / 1024);
if (kb > BUDGET_KB) { console.error(`✗ Home eager JS ${kb} KB > budget ${BUDGET_KB} KB`); bad++; }
else console.log(`✓ Home eager JS ${kb} KB ≤ ${BUDGET_KB} KB budget; no static heavy imports in ${files.filter((f) => HOME_CHUNKS.test(f)).length} Home chunk(s)${bad ? '' : ''}`);
process.exit(bad ? 1 : 0);
