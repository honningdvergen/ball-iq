#!/usr/bin/env node
/**
 * THE INSTRUMENT REGISTER — one row per analytics writer in this repo.
 *
 * ⚠️ WHY THIS EXISTS. An analytics audit found 24 confirmed defects, and every
 * one of them would have been caught on the day it shipped by a register with
 * these columns. Two classes recur, and both are invisible to a linter:
 *
 * (a) A GUARD APPLIED TO ONE WRITER AND NOT ITS SIBLING IN THE SAME FILE.
 *     `bqSynthetic()` was defined at scripts/seo/club-quiz-engine.js:140 and
 *     called from exactly ONE place — `bqev()` at :161 — while `logRound()`,
 *     invoked from the same finish() a few lines later, wrote club_quiz_results
 *     ungated for three weeks. On 2026-08-29 one visitor put 46 rows on Arsenal
 *     in 92 seconds. The front door orders its club list by those counts.
 *     A register that prints `gate` beside every writer makes the odd one out
 *     a one-line diff instead of an archaeology exercise.
 *
 * (b) TWO COUNTERS COMPARED AS IF THEY HAD THE SAME BIRTHDAY. club_quiz_results
 *     first wrote 2026-08-14 (commit 02336c6); the club-page funnel row first
 *     wrote 2026-08-22 (commit 3a589eb). A 30-day window straddling that gap
 *     produced a 130-row "discrepancy" that meant nothing at all and cost real
 *     analysis time. `firstWrite` is the column nothing in this repo has today,
 *     and it is the reason this script exists rather than a grep.
 *
 * WHAT COUNTS AS A WRITER. A call site that records an event. Two kinds:
 *
 *   TRANSPORT  — the call site that performs the network write itself
 *                (a fetch to /rest/v1/rpc/<sink>, a supabase.rpc("<sink>"),
 *                or a window.clarity('event', …)).
 *   EMIT       — a call to a function that contains a transport
 *                (loopEvent("first-game-started"), bqev('clubq-play'), …),
 *                including a local alias that provably forwards to one.
 *
 * Both are rows. A transport usually has a dynamic event name (it takes the
 * name as an argument) and an emit site usually has a literal one, so the two
 * kinds answer different questions: the transport says WHERE the sink is wired
 * and when that wiring was born; the emit site says WHICH event and when THAT
 * was born. The 130-row phantom is exactly a disagreement between those two
 * dates, so the summary flags every event older than the sink it now writes to.
 *
 * USAGE
 *   node scripts/audit-instruments.mjs              regenerate .audit/instruments.json
 *   node scripts/audit-instruments.mjs --quiet      manifest + failures only
 *   node scripts/audit-instruments.mjs --refresh-dates
 *       recompute every firstWrite from git rather than reusing the cached
 *       ones. Dates are immutable history, so the normal run reuses them and
 *       only asks git about needles it has never seen. A cold run is under a
 *       minute (the git lookups run eight at a time); a warm one is ~10s.
 *   node scripts/audit-instruments.mjs --out <path>
 *       write elsewhere — how the unit test regenerates without dirtying the
 *       tracked manifest.
 *
 * EXIT CODE. Non-zero if any writer has `gate: NONE`, listing them. That is
 * the loud signal and it is deliberately not softened. It is why this script is
 * NOT in the `npm run build` chain: tests/unit/instrument-register.test.js is
 * the build gate, and it ratchets — a KNOWN ungated writer recorded in the
 * manifest's `ungatedBaseline` is tolerated, a NEW one fails the suite.
 * The baseline may shrink. It must never grow.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMMITTED = join(ROOT, '.audit', 'instruments.json');
// ⚠️ --out lets the unit test regenerate into a temp file instead of over the
// committed one. A test that rewrites a tracked file to check it is current
// leaves the working tree dirty on every `npm run build`, and the next person
// to run `git status` cannot tell a real change from the test's own footprint.
// The cache is always read from the COMMITTED file, so the temp run still
// reuses the birthdays rather than spending 2.5 minutes in git.
const outFlag = process.argv.indexOf('--out');
const OUT = outFlag > -1 && process.argv[outFlag + 1] ? process.argv[outFlag + 1] : COMMITTED;

// ─── what to scan ───────────────────────────────────────────────────────────
// Tracked source only. Everything under ios/ and android/ is a Capacitor COPY
// of dist/ — 300+ generated pages, each carrying the same emitters, which would
// bury the source rows under thousands of duplicates and make the manifest
// churn on every `cap sync`. The generated pages under public/ are not tracked
// at all (only 38 hand-written files there are). docs/ and .audit/ quote the
// emitters in prose; tests/ assert on them. None of those write anything.
const SKIP_PREFIX = [
  'ios/', 'android/', 'dist/', 'node_modules/', 'docs/', 'tests/', '.audit/',
  '.claude/', '.agents/', '.github/', 'screenshots/', 'store-assets/',
  'store-screenshots/', 'supabase/prod-snapshot/', 'design-system/',
];
const SCAN_EXT = /\.(js|jsx|mjs|html)$/;

/**
 * Which sinks are ANALYTICS. `upsert_daily_score` and friends are game state,
 * not measurement — they are the product's memory, and putting them here would
 * dilute the register into "every RPC in the repo".
 *
 * The value is the durable thing a reader has to reason about later: the table
 * or service the row lands in. That is what two counters get compared across.
 */
const SINKS = {
  record_funnel_event: 'funnel_events',
  log_club_quiz: 'club_quiz_results',
  record_challenge_event: 'challenge_events',
  record_daily_result: 'daily_results',
  clarity: 'microsoft-clarity',
};

/**
 * Which surface a file's writers actually run on. Derived from the path
 * because the path IS the surface in this repo — but stated explicitly,
 * because "the React app" and "generated /quiz/ pages" have different consent
 * regimes, different gates and different birthdays, and a reader comparing two
 * numbers needs to know they are not the same population.
 */
const SURFACES = [
  ['src/islands/', 'the daily island pages (/football-wordle/, /transfer-trail/, /mystery-player/)'],
  ['src/marketing/', 'the / front door (web only — never rendered on native)'],
  ['src/lib/marketingEvent.js', 'the / front door and the daily island pages'],
  ['src/lib/dailyResults.js', 'the results panel, in the app and on the island pages'],
  ['src/lib/', 'the React app'],
  ['src/screens/', 'the React app (web + native shells)'],
  ['src/components/', 'the React app (web + native shells)'],
  ['src/hooks/', 'the React app (web + native shells)'],
  ['src/App.jsx', 'the React app (web + native shells)'],
  ['src/', 'the React app'],
  ['scripts/seo/club-quiz-engine.js', 'generated /quiz/ pages and the served /daily-football-quiz/ page'],
  ['scripts/seo/shell.mjs', 'every page carrying the site shell — generated pages AND the served answer pages'],
  ['scripts/seo/xiGame.mjs', 'the generated XI game page'],
  ['scripts/seo/trailBoard.mjs', 'the generated /transfer-trail/ board (hero + #practice)'],
  ['scripts/seo/mysteryBoard.mjs', 'the generated /mystery-player/ board'],
  ['scripts/seo/', 'a generated static page'],
  ['scripts/gen-seo-pages.mjs', 'generated static pages (playable boards, /lists/, question tasters)'],
  ['api/c.js', 'the /c/ challenge share landing (Vercel edge function, server-side)'],
  ['api/p.js', 'the /p/ Ball IQ card share landing (Vercel edge function)'],
  ['api/', 'a Vercel edge function'],
];
const surfaceOf = (file) => (SURFACES.find(([p]) => file.startsWith(p)) || [, 'unknown'])[1];

/**
 * ⚠️ CROSS-FILE BRIDGES — declared, not inferred.
 *
 * Three emitters reach their call sites through a React prop or a factory, and
 * no amount of regex follows that honestly. Rather than pretend to do dataflow
 * (a scanner that returns zero here would look like a clean bill of health —
 * and a zero is the most suspicious number an auditor can produce), each bridge
 * is written down with the exact source text that proves the binding. The unit
 * test asserts that text still exists, so a rename breaks the suite instead of
 * silently dropping a dozen writers out of the register.
 */
const BRIDGES = [
  {
    // dailyIsland.jsx builds a per-surface wrapper around marketingEvent; the
    // three island entry points each hold one as `funnel`.
    alias: 'funnel',
    files: ['src/islands/footle.jsx', 'src/islands/trail.jsx', 'src/islands/mystery.jsx', 'src/islands/dailyIsland.jsx'],
    emitter: 'marketingEvent',
    proof: ['src/islands/dailyIsland.jsx', 'export const makeFunnel = (surface) => (event, meta) => marketingEvent(event'],
  },
  {
    // DailyDone's `track` prop. TWO bindings, and they matter: in the app it is
    // loopEvent (gate isSyntheticTraffic), on the island pages it is the island
    // funnel (gate synthetic in marketingEvent.js). Both gated — but by
    // different functions, so a fix to one does not cover the other.
    alias: 'track',
    files: ['src/components/DailyDone.jsx'],
    emitter: 'loopEvent',
    alsoEmitter: 'marketingEvent',
    proof: ['src/App.jsx', 'track: (n, m) => loopEvent(n, m)'],
    proof2: ['src/islands/dailyIsland.jsx', 'track: (n, m) => funnel(n, m)'],
  },
  {
    // The mandatory-username wall reports through an onEvent prop, bound to
    // loopEvent at the single render site.
    alias: 'emit',
    files: ['src/components/UsernameSetupModal.jsx'],
    emitter: 'loopEvent',
    proof: ['src/App.jsx', 'onEvent={loopEvent}'],
  },
];

// ─── source helpers ─────────────────────────────────────────────────────────

const sh = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function sourceFiles() {
  return sh(['ls-files'])
    .split('\n')
    .filter((f) => f && SCAN_EXT.test(f) && !SKIP_PREFIX.some((p) => f.startsWith(p)));
}

/**
 * One tokenizer, two views of a file.
 *
 *   noComments  comments blanked, code AND string contents intact.
 *               Everything is matched against this. Matching raw text found
 *               `bqev()` inside the very comment that explains bqev, and
 *               `record_funnel_event` inside index.html's prose about consent —
 *               three phantom writers on the first run.
 *   braceSafe   comments AND quoted-string contents blanked.
 *               Used only for brace balancing, so that a lone '{' in a string
 *               cannot desync the function boundaries.
 *
 * ⚠️ TEMPLATE LITERALS ARE TRANSPARENT — their contents are treated as code.
 * That is not a shortcut, it is the requirement: scripts/gen-seo-pages.mjs
 * ships whole JavaScript programs from inside template literals, and blanking
 * them would hide gev(), qev(), and every event name they emit. The ${…} holes
 * balance naturally once the backtick itself is ignored.
 *
 * ⚠️ REGEX LITERALS MUST BE RECOGNISED. `String(t).replace(/[&<>"]/g, …)` in
 * scripts/seo/club-quiz-engine.js carries a bare double quote; read as a string
 * opener it swallowed the rest of the file and the club engine's own gate,
 * bqSynthetic(), went undetected — the register reported the best-documented
 * gate in the repo as absent. A false NEGATIVE from a broken tokenizer is the
 * worst outcome this script has, because it reads as a clean bill of health.
 */
/**
 * ⚠️ `<` AND `>` ARE DELIBERATELY NOT HERE, though both can legally precede a
 * regex. This repo writes HTML inside template literals, and `${label}</a>` put
 * a `/` straight after a `<`: read as a regex opener it ran to the `/` in the
 * NEXT closing tag and swallowed the `}` between them. One brace, and every
 * function boundary in scripts/gen-seo-pages.mjs stretched to end-of-file — so
 * two ungated Clarity writes 1,800 lines from any guard were reported as gated.
 * `a < /re/.test(b)` is not a thing anyone writes; `</div>` is on every page.
 */
const REGEX_OK_BEFORE = /[([{,;:!&|?+\-*%~^=]$|\b(return|typeof|case|in|of|do|else|instanceof|new|delete|void|throw)$/;

function tokenize(src, isHtml) {
  const noComments = src.split('');
  const braceSafe = src.split('');
  const blank = (i) => { if (src[i] !== '\n') { noComments[i] = ' '; braceSafe[i] = ' '; } };
  const blankStr = (i) => { if (src[i] !== '\n') braceSafe[i] = ' '; };
  let i = 0;
  const n = src.length;
  let prev = ''; // last significant code character(s), for the regex heuristic
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (isHtml && c === '<' && src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      const stop = end === -1 ? n : end + 3;
      for (let k = i; k < stop; k += 1) blank(k);
      i = stop; continue;
    }
    if (c === '/' && c2 === '/') {
      while (i < n && src[i] !== '\n') { blank(i); i += 1; }
      continue;
    }
    if (c === '/' && c2 === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (let k = i; k < stop; k += 1) blank(k);
      i = stop; continue;
    }
    if (c === "'" || c === '"') {
      // ⚠️ AN APOSTROPHE IN PROSE IS NOT A STRING OPENER. This file's templates
      // carry English sentences — "names are used to identify the quizzes'
      // subjects" in scripts/seo/shell.mjs — and treating that apostrophe as a
      // quote blanked the rest of its line, eating a brace and stretching one
      // function's boundary across 1,800 lines of scripts/gen-seo-pages.mjs.
      // Two Clarity writes then reported a gate that has never run near them.
      // So: scan first, and only commit the blanking if the quote actually
      // closes on the same line.
      const start = i;
      let j = i + 1, closed = false;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '\n') break;
        if (src[j] === c) { closed = true; break; }
        j += 1;
      }
      if (!closed) { prev = 'x'; i += 1; continue; }
      for (let k = start + 1; k < j; k += 1) blankStr(k);
      i = j + 1; prev = 'x'; continue;
    }
    if (c === '`') { i += 1; continue; } // transparent on purpose — see above
    if (c === '/' && REGEX_OK_BEFORE.test(prev)) {
      let k = i + 1, cls = false, ok = false;
      while (k < n) {
        const d = src[k];
        if (d === '\\') { k += 2; continue; }
        if (d === '\n') break;
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) { ok = true; break; }
        k += 1;
      }
      // A "regex" carrying a raw < is markup, not a pattern — same defence,
      // one layer in: `(<a href=…/>)` reaches here through the `(`.
      if (ok && !src.slice(i + 1, k).includes('<')) {
        for (let j = i + 1; j < k; j += 1) blank(j);
        i = k + 1; prev = 'x'; continue;
      }
    }
    if (!/\s/.test(c)) prev = (prev + c).slice(-12);
    i += 1;
  }
  return { noComments: noComments.join(''), braceSafe: braceSafe.join('') };
}

const viewCache = new Map();
function views(file) {
  if (!viewCache.has(file)) {
    const raw = readFileSync(join(ROOT, file), 'utf8');
    viewCache.set(file, { raw, ...tokenize(raw, file.endsWith('.html')) });
  }
  return viewCache.get(file);
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

/**
 * The innermost NAMED function containing `idx`.
 *
 * Backward scan to each candidate declaration, nearest first, then confirm by
 * balancing braces from that declaration's own opening brace. Nearest-match
 * alone is wrong: in a file where a helper is declared just above an unrelated
 * top-level statement, the statement would be attributed to the helper.
 */
const DECL = /(?:^|[^\w$.])(?:(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\*?\s*[A-Za-z_$]*\s*)?\(|([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s*)?(?:function\s*\*?\s*)?\()/g;

const unbalanced = [];
const declCache = new Map();

function enclosingFunctions(blank) {
  if (declCache.has(blank)) return declCache.get(blank);
  const decls = [];
  DECL.lastIndex = 0;
  let m;
  while ((m = DECL.exec(blank))) {
    const name = m[1] || m[2] || m[3];
    // Find the body's opening brace: the first `{` after the parameter list.
    let j = m.index + m[0].length;
    let paren = m[0].endsWith('(') ? 1 : 0;
    while (j < blank.length && (paren > 0 || (blank[j] !== '{' && blank[j] !== ';' && blank[j] !== '\n'))) {
      if (blank[j] === '(') paren += 1;
      else if (blank[j] === ')') paren -= 1;
      j += 1;
    }
    if (blank[j] !== '{') { DECL.lastIndex = m.index + 1; continue; }
    let d = 0, k = j;
    for (; k < blank.length; k += 1) {
      if (blank[k] === '{') d += 1;
      else if (blank[k] === '}') { d -= 1; if (d === 0) break; }
    }
    // ⚠️ A BODY THAT NEVER CLOSES IS A PARSE FAILURE, NOT A HUGE FUNCTION —
    // and it must be DISCARDED, not used. scripts/gen-seo-pages.mjs embeds a
    // regex written `/…\\/…\\//` inside a template literal, where the doubled
    // backslashes defeat any single-pass escape rule; storefrontScript() then
    // appeared to run to end of file. Keeping such a decl is the dangerous
    // direction: it lends its gate to every writer below it and reports
    // ungated code as protected. Dropping it costs at most one attribution and
    // the count is printed, so the loss is visible rather than silent.
    if (d !== 0) { unbalanced.push(name); DECL.lastIndex = m.index + 1; continue; }
    decls.push({ name, start: m.index, open: j, end: k });
    DECL.lastIndex = m.index + 1;
  }
  declCache.set(blank, decls);
  return decls;
}

const enclosing = (decls, idx) => {
  let best = null;
  for (const d of decls) if (idx > d.open && idx < d.end && (!best || d.open > best.open)) best = d;
  return best;
};

/**
 * Every named function containing `idx`, innermost first.
 *
 * ⚠️ THE GATE IS OFTEN NOT IN THE FUNCTION THAT WRITES. api/p.js posts from
 * `ev(n)`, which sits inside an anonymous IIFE that opens with
 * `if (navigator.webdriver) return;` — the write is protected, but a check
 * confined to ev()'s own body reported it as ungated. The brief's own rule is
 * "gated if the guard is checked in the function that performs the write, OR in
 * a helper every call passes through", and a wrapping scope is exactly that.
 */
const enclosingChain = (decls, idx) => decls
  .filter((d) => idx > d.open && idx < d.end)
  .sort((a, b) => b.open - a.open);

/**
 * The gate protecting a write at `idx`, most-local first.
 *
 * Tier 1 — THE BLOCK THAT CONTAINS THE WRITE, plus the 200 characters before
 * its opening brace so an `if (…) {` head is in view. This is how a person
 * reads it, and it is the only tier that survives a file the brace parser could
 * not fully bound: src/App.jsx is 9,000 lines of JSX and AppInner() came back
 * unbalanced, which cost all three record_challenge_event writes their gate —
 * `if (challengeEventOnce("open", …)) { supabase.rpc(…) }`, one line apart,
 * reported as ungated. Reporting a guarded write as ungated is a false alarm
 * that trains people to ignore the register.
 *
 * Tier 2 — every enclosing named function, innermost out. api/p.js posts from
 * ev(), inside an IIFE that opens `if (navigator.webdriver) return;`.
 */
function gateFor(file, idx, gateNames) {
  const { noComments, braceSafe } = views(file);
  // A SECOND, NARROWER MECHANISM — and only under api/.
  //
  // The webdriver rule below is the right definition for anything that runs in
  // a browser, and it must stay strict so a seventh client gate cannot hide.
  // But api/*.js are Vercel edge functions: there is no navigator to test, so
  // by that rule a server-side writer can never be gated, and api/c.js's
  // loop-hit stayed on the ungated list after it was genuinely fixed. A
  // permanently unfixable entry is worse than none — it is what teaches people
  // to skim the list.
  //
  // The equivalent a request handler HAS is where it was served from, so a
  // hostname test against localhost / *.vercel.app counts here, and ONLY here.
  // This is not the client rule widened: it does not apply outside api/, and it
  // requires the hostname comparison, not merely the word 'host'.
  const serverHostGate = /^api\//.test(file)
    && /hostname[\s\S]{0,200}(localhost|127\.0\.0\.1|vercel\.app)/.test(noComments);
  const hit = (text) => gateNames.find((g) => new RegExp(`\\b${g}\\s*\\(`).test(text))
    || (/navigator\s*\.\s*webdriver/.test(text) ? 'inline navigator.webdriver' : null)
    || (serverHostGate && /\bsynthetic\b/.test(text) ? 'server host check' : null);

  let depth = 0;
  for (let i = idx - 1, floor = Math.max(0, idx - 4000); i >= floor; i -= 1) {
    if (braceSafe[i] === '}') depth += 1;
    else if (braceSafe[i] === '{') {
      if (depth === 0) { const g = hit(noComments.slice(Math.max(0, i - 200), idx)); if (g) return g; break; }
      depth -= 1;
    }
  }
  for (const d of enclosingChain(enclosingFunctions(braceSafe), idx)) {
    const g = hit(noComments.slice(d.open, d.end));
    if (g) return g;
  }
  return null;
}

/** The parameter names of a declaration, so we can tell an event arg from a payload. */
function paramsOf(text, decl) {
  const head = text.slice(decl.start, decl.open);
  const open = head.indexOf('(');
  if (open === -1) return [];
  return head.slice(open + 1, head.lastIndexOf(')'))
    .split(',').map((s) => s.trim().split(/[=:\s]/)[0]).filter((s) => /^[A-Za-z_$][\w$]*$/.test(s));
}

// ─── pass 1: the synthetic-traffic gates ────────────────────────────────────
/**
 * A gate is a function whose body tests `navigator.webdriver`. That is the one
 * signal every gate in this repo shares, and deriving them beats a hardcoded
 * list: the brief named isSyntheticTraffic() and bqSynthetic() and warned the
 * list was probably incomplete. It was — gSyn(), qSyn() and two separate
 * synthetic() functions were also live.
 */
function findGates(files) {
  const gates = [];
  for (const file of files) {
    const { raw, noComments, braceSafe } = views(file);
    if (!noComments.includes('webdriver')) continue;
    const decls = enclosingFunctions(braceSafe);
    const seen = new Set();
    let i = -1;
    while ((i = noComments.indexOf('navigator.webdriver', i + 1)) !== -1) {
      const fn = enclosing(decls, i);
      // ⚠️ Not every webdriver test is a gate. src/screens/HomeScreen.jsx uses
      // one to keep the "Good ebening" easter egg out of store screenshots.
      // Candidates are collected freely here and the manifest publishes only
      // the ones a writer actually stands behind — a gate that guards nothing
      // is not part of an instrument register, and inventing a rule to exclude
      // it up front would be guessing at intent.
      if (!fn || seen.has(fn.name)) continue;
      seen.add(fn.name);
      const body = noComments.slice(fn.open, fn.end);
      gates.push({
        name: fn.name,
        file,
        line: lineOf(raw, fn.start),
        localhost: /localhost/.test(body),
      });
    }
  }
  return gates;
}

/**
 * GATE WRAPPERS. `challengeEventOnce()` in src/App.jsx contains no webdriver
 * test of its own — it opens with `if (isSyntheticTraffic()) return false;` and
 * every record_challenge_event write sits behind it. The comment above it says
 * why, in as many words: "three guards is three chances for one to be
 * forgotten, which is exactly how challenge_events came to be the one funnel
 * table with no synthetic check". A register that only recognised the leaf
 * gates would report all three of those writes as ungated and cry wolf.
 *
 * So the closure: any function that guards its own body on a known gate is
 * itself a gate for anything downstream of it. Run to a fixed point — the
 * chain is one hop deep today and nothing should have to notice when it is two.
 */
function addGateWrappers(files, gates, isEmitter) {
  let changed = true;
  while (changed) {
    changed = false;
    const names = gates.map((g) => g.name);
    for (const file of files) {
      const { raw, noComments, braceSafe } = views(file);
      if (!names.some((n) => noComments.includes(n))) continue;
      for (const d of enclosingFunctions(braceSafe)) {
        // ⚠️ An emitter is a WRITER, never a gate. loopEvent() opens with
        // `if (isSyntheticTraffic()) return;` and would otherwise qualify —
        // and then every loopEvent(…) call site would be reported as "gated by
        // loopEvent", which says nothing and hides which guard actually ran.
        if (names.includes(d.name) || isEmitter(d.name)) continue;
        const body = noComments.slice(d.open, d.end);
        const guards = names.some((n) => new RegExp(`if\\s*\\(\\s*${n}\\s*\\(\\s*\\)\\s*\\)\\s*return`).test(body));
        if (!guards) continue;
        gates.push({ name: d.name, file, line: lineOf(raw, d.start), localhost: true, wrapsGate: true });
        changed = true;
      }
    }
  }
  return gates;
}

// ─── pass 2: transports (the call sites that write) ─────────────────────────
const TRANSPORT_PATTERNS = [
  // fetch('…/rest/v1/rpc/record_funnel_event' or `${X}/rest/v1/rpc/${name}`
  { re: /rest\/v1\/rpc\/([a-z_]+|\$\{[a-zA-Z_$][\w$]*\})/g, kind: 'fetch' },
  // supabase.rpc("record_funnel_event"  /  .rpc('record_daily_result'
  { re: /\.rpc\(\s*["']([a-z_]+)["']/g, kind: 'supabase-rpc' },
  // window.clarity('event', n)
  { re: /clarity\(\s*["']event["']\s*,\s*([^)]*)\)/g, kind: 'clarity' },
];

function findTransports(files, gateNames) {
  const rows = [];
  for (const file of files) {
    const { raw, noComments, braceSafe } = views(file);
    const decls = enclosingFunctions(braceSafe);
    for (const { re, kind } of TRANSPORT_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(noComments))) {
        let sinkKey = kind === 'clarity' ? 'clarity' : m[1];
        // `${name}` — a generic rpc() helper. Resolve it from the helper's own
        // call sites rather than dropping the row: src/lib/dailyResults.js
        // posts record_daily_result AND get_daily_distribution through one.
        let dynamicSink = false;
        if (sinkKey.startsWith('${')) { dynamicSink = true; sinkKey = null; }
        if (!dynamicSink && !SINKS[sinkKey]) continue; // game state, not analytics
        const chain = enclosingChain(decls, m.index);
        const fn = chain[0] || null;
        const line = lineOf(raw, m.index);
        const gate = gateFor(file, m.index, gateNames);
        // The event name as WRITTEN at the transport. `p_event:'store-out'` is a
        // literal (scripts/seo/shell.mjs) and `p_event: name` is the emitter's
        // own parameter — telling the two apart is what decides whether this
        // function's CALL SITES are writers in their own right.
        let eventExpr = null;
        if (kind === 'clarity') eventExpr = m[1].trim();
        else {
          const body = noComments.slice(m.index, Math.min(noComments.length, m.index + 900));
          const pe = /p_event\s*:\s*([^,}]+)/.exec(body);
          if (pe) eventExpr = pe[1].trim();
        }
        rows.push({
          kind: 'transport', file, line,
          fn: fn ? fn.name : '(top level)',
          params: fn ? paramsOf(noComments, fn) : [],
          sinkKey, dynamicSink,
          gate,
          eventExpr,
          fnStart: fn ? fn.start : 0, fnOpen: fn ? fn.open : 0, fnEnd: fn ? fn.end : raw.length,
        });
      }
    }
  }
  return rows;
}

// ─── pass 3: emitters and their aliases ─────────────────────────────────────
/**
 * An EMITTER is a named function that contains a transport. Its call sites are
 * writers too, and they inherit its gate — which is exactly the propagation
 * rule the brief asks for ("gated if the guard is checked in a helper every
 * call passes through").
 */
/**
 * ⚠️ NOT EVERY FUNCTION CONTAINING A TRANSPORT IS AN EVENT EMITTER, and the
 * difference decides whether its call sites belong in the register.
 *
 * `finish(won)` in scripts/seo/xiGame.mjs pokes Clarity on the way past. So
 * does `finish()` in five other files with the same name and nothing to do
 * with each other. Expanding call sites by NAME alone produced rows in
 * src/screens/StadiumGame.jsx attributed to the XI game — eleven phantom
 * writers, each of which would have had to be argued about.
 *
 * Two rules, both cheap and both load-bearing:
 *   1. A function's call sites are writers only when the event it records IS
 *      its first parameter — `loopEvent(name)`, `bqev(n)`, `gev(n, x)`. A
 *      function that records a fixed event (`p_event:'store-out'`) or none at
 *      all (logRound) is a transport and nothing more; its callers pass no
 *      event and are not recording one.
 *   2. Call sites are matched in the emitter's OWN file, in files that import
 *      it, and across a declared bridge. Never by bare name across the tree.
 */
function buildEmitters(transports) {
  const byFn = new Map();
  for (const t of transports) {
    if (t.fn === '(top level)') continue;
    const key = `${t.file}::${t.fn}`;
    const prev = byFn.get(key);
    const sinks = new Set(prev ? prev.sinks : []);
    if (t.sinkKey) sinks.add(SINKS[t.sinkKey]);
    const firstParam = t.params[0];
    const takesEventName = !!firstParam && !!t.eventExpr
      && new RegExp(`^${firstParam}$`).test(t.eventExpr.replace(/^["']|["']$/g, '').trim());
    byFn.set(key, {
      name: t.fn,
      file: t.file,
      line: prev ? prev.line : t.line,
      sinks: [...sinks],
      gate: prev?.gate || t.gate,
      takesEventName: (prev?.takesEventName || takesEventName),
      sinkFactory: (prev?.sinkFactory || t.dynamicSink),
      start: t.fnStart, open: t.fnOpen, end: t.fnEnd,
    });
  }
  return byFn;
}

/** Files that can legitimately call `name`: its own, plus any that import it. */
function callableIn(files, emitter) {
  const out = new Set([emitter.file]);
  const imp = new RegExp(`import\\s*\\{[^}]*\\b${emitter.name}\\b[^}]*\\}\\s*from`);
  for (const f of files) if (f !== emitter.file && imp.test(views(f).noComments)) out.add(f);
  return out;
}

/**
 * Local aliases: `const f = (a, b) => EMITTER(...)`, `const f = EMITTER`,
 * `key: (n, m) => EMITTER(n, m)`. Resolved transitively within a file, because
 * dailyIsland.jsx chains makeFunnel → funnel → track in three hops.
 */
function findAliases(raw, known) {
  const found = new Map();
  let changed = true;
  const names = () => [...known, ...found.keys()];
  while (changed) {
    changed = false;
    for (const target of names()) {
      const pats = [
        new RegExp(`(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*\\([^)]*\\)\\s*=>\\s*${target}\\s*\\(`, 'g'),
        new RegExp(`(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${target}\\s*;`, 'g'),
        new RegExp(`([A-Za-z_$][\\w$]*)\\s*:\\s*\\([^)]*\\)\\s*=>\\s*${target}\\s*\\(`, 'g'),
      ];
      for (const p of pats) {
        let m;
        while ((m = p.exec(raw))) {
          const a = m[1];
          if (a === target || found.has(a) || known.includes(a)) continue;
          found.set(a, target);
          changed = true;
        }
      }
    }
  }
  return found;
}

// ─── pass 4: emit call sites ────────────────────────────────────────────────
const STR_ARG = /^\s*(["'])((?:\\.|(?!\1).)*)\1\s*(?:,|\))/;

function findEmitSites(files, emitters) {
  const rows = [];
  // Only event emitters and sink factories expand into call sites — see the
  // note on buildEmitters(). A fixed-event transport has no callers to record.
  const expandable = [...emitters.values()].filter((e) => e.takesEventName || e.sinkFactory);
  const scope = new Map(expandable.map((e) => [e, callableIn(files, e)]));
  for (const file of files) {
    const { raw, noComments } = views(file);
    const local = expandable.filter((e) => scope.get(e).has(file));
    const byName = new Map(local.map((e) => [e.name, e]));
    const aliases = findAliases(noComments, [...byName.keys()]);
    const bridged = new Map();
    for (const b of BRIDGES) if (b.files.includes(file)) bridged.set(b.alias, b);
    const targets = [
      ...[...byName.keys()].map((n) => [n, n]),
      ...[...aliases].map(([a, t]) => [a, t]),
      ...[...bridged].map(([a, b]) => [a, b.emitter]),
    ];
    for (const [callName, emitterName] of targets) {
      const em = byName.get(emitterName)
        || expandable.find((e) => e.name === emitterName); // bridged emitters cross files by declaration
      if (!em) continue;
      // ⚠️ Match `name(` and `name?.(` but never `obj.name(` or the definition
      // itself. The definition is excluded by offset, below.
      const call = new RegExp(`(?<![\\w$.])${callName}(\\?\\.)?\\(`, 'g');
      let m;
      while ((m = call.exec(noComments))) {
        const idx = m.index;
        // Skip the emitter's own definition and any line that only declares it.
        if (file === em.file && idx >= em.start && idx <= em.open) continue;
        const before = noComments.slice(Math.max(0, idx - 40), idx);
        if (/\b(function|const|let|var)\s+$/.test(before)) continue;
        const after = noComments.slice(idx + m[0].length);
        const sm = STR_ARG.exec(after);
        const bridge = bridged.get(callName);
        const alt = bridge?.alsoEmitter ? expandable.find((e) => e.name === bridge.alsoEmitter) : null;

        // ⚠️ A SINK FACTORY'S FIRST ARGUMENT IS THE RPC, NOT AN EVENT.
        // src/lib/dailyResults.js posts everything through one rpc(name, body)
        // helper — record_daily_result AND get_daily_distribution. Treating the
        // first argument as an event name filed a READ as an analytics writer
        // and reported it ungated. So a factory's call sites become transports
        // named by the sink they resolve to, and anything that is not an
        // analytics sink is dropped rather than guessed at.
        if (em.sinkFactory) {
          if (!sm || !SINKS[sm[2]]) continue;
          const gate = gateFor(file, idx, gateNames);
          rows.push({
            kind: 'transport-via-factory', file, line: lineOf(raw, idx),
            via: `${em.name}('${sm[2]}')`, sinks: [SINKS[sm[2]]], gate,
            event: '(row)', eventExpr: null,
          });
          continue;
        }

        rows.push({
          kind: 'emit', file, line: lineOf(raw, idx),
          via: callName === emitterName ? emitterName : `${callName} -> ${emitterName}`,
          sinks: em.sinks,
          gate: em.gate,
          altGate: alt?.gate || null,
          altSinks: alt?.sinks || null,
          event: sm ? sm[2] : null,
          eventExpr: sm ? null : after.slice(0, 60).split(/[,)]/)[0].trim().replace(/\s+/g, ' '),
          // The exact call text is the needle git dates the writer by. A bare
          // event name collided: `p-cta` matched an unrelated commit and dated
          // the writer three weeks before the file existed.
          needle: sm ? raw.slice(idx, idx + m[0].length + sm[0].lastIndexOf(sm[1]) + 1) : null,
        });
      }
    }
  }
  return rows;
}

// ─── firstWrite ─────────────────────────────────────────────────────────────
/**
 * ⚠️ THE COLUMN THIS SCRIPT EXISTS FOR.
 *
 * `git log -S` finds the commit where the count of a string changed — i.e.
 * where the writer was introduced. Scoped to the file first (fast, precise),
 * then repo-wide if the file scope comes back empty, because code MOVES: the
 * club engine was carved out of scripts/gen-seo-pages.mjs, and a file-scoped
 * lookup would report the move date as the birthday and reintroduce the exact
 * error this column is here to prevent.
 */
// ⚠️ NEVER SCOPE THIS TO ONE FILE. The first version did — `-S… -- <path>` —
// and dated club_quiz_results to 2026-08-23, which is the day the club engine
// was CARVED OUT of scripts/gen-seo-pages.mjs into its own file. The real first
// write is 2026-08-14, nine days earlier, and 2026-08-14 vs 2026-08-22 is the
// exact pair that produced the phantom 130-row discrepancy. A file-scoped
// birthday reports the last house move as the date of birth.
//
// The pathspec excludes prose instead: docs/ and tests/ and .audit/ quote event
// names, and a doc written before the code would date the writer to the
// documentation. Source only.
const HISTORY_SCOPE = [
  '--', '.', ':(exclude)docs', ':(exclude)tests', ':(exclude).audit',
  ':(exclude)ios', ':(exclude)android', ':(exclude).claude', ':(exclude).agents', ':(exclude).github',
];

/**
 * ⚠️ RUN THESE IN PARALLEL. Each `git log -S` walks 2,284 commits and takes
 * two to four seconds; 115 of them in series is seven minutes, and a script
 * that takes seven minutes is a script nobody runs — at which point the
 * register rots and the whole exercise is theatre. Eight at a time brings a
 * cold run under a minute. Warm runs touch git only for writers whose needle
 * is new, because the dates are immutable history.
 */
async function firstWriteAll(needles, concurrency = 8) {
  const results = new Map();
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next; next += 1;
      if (i >= needles.length) return;
      const needle = needles[i];
      results.set(needle, await new Promise((resolve) => {
        execFile('git', ['log', `-S${needle}`, '--reverse', '--format=%ad', '--date=short', ...HISTORY_SCOPE],
          { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
          (err, stdout) => {
            const d = err ? '' : (stdout.split('\n').find(Boolean) || '');
            resolve(d ? { date: d, scope: 'source' } : { date: '', scope: 'none' });
          });
      }));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, needles.length) }, worker));
  return results;
}

// ─── run ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const QUIET = argv.includes('--quiet');
const REFRESH = argv.includes('--refresh-dates');

const files = sourceFiles();

// Two rounds, because gates and emitters define each other: a wrapper is only
// a gate if it is NOT itself an emitter, and an emitter is only recognisable
// once its transports are found. Round one uses the leaf gates to name the
// emitters; round two re-resolves every transport against the full gate chain.
const leafGates = findGates(files);
const firstPass = findTransports(files, leafGates.map((g) => g.name));
// ⚠️ BARE NAMES. buildEmitters keys by "file::fn" so two `finish()` in two
// files stay apart — but the gate-wrapper check compares a DECLARATION name,
// which has no file prefix. Passing the composite keys made the comparison
// always false, so qev() (which opens `if(qSyn())return;`) was promoted to a
// gate and then "protected" two Clarity writes 1,800 lines away that it has
// never run near. A register that invents protection is worse than one that
// misses it.
const emitterNamesEarly = new Set([...buildEmitters(firstPass).values()].map((e) => e.name));
const gates = addGateWrappers(files, leafGates, (n) => emitterNamesEarly.has(n));
const gateNames = gates.map((g) => g.name);
const transports = findTransports(files, gateNames);
const emitters = buildEmitters(transports);

// ⚠️ PROVE THE SCANNER BEFORE TRUSTING THE TOTAL. A scan that returns zero is
// the most suspicious result there is, and a scan that returns 200 rows while
// silently dropping one file is worse — it looks thorough. These are the
// writers the audit named by hand; if the scanner cannot see them, the number
// it prints is meaningless and the run must fail loudly rather than publish.
const MUST_FIND = ['loopEvent', 'marketingEvent', 'bqev', 'logRound', 'gev', 'qev'];
const missing = MUST_FIND.filter((n) => !emitters.has(n) && !transports.some((t) => t.fn === n));
if (missing.length) {
  console.error(`SCANNER BROKEN — known writers not found: ${missing.join(', ')}`);
  console.error('Do not trust any total this run produced. Fix the scan, not the list.');
  process.exit(2);
}
// The gate chain has to resolve too, or the three challenge writes read as
// ungated and the register cries wolf on its first run.
if (!gateNames.includes('challengeEventOnce')) {
  console.error('SCANNER BROKEN — the challengeEventOnce gate wrapper was not resolved.');
  process.exit(2);
}
const challengeSites = transports.filter((t) => t.sinkKey === 'record_challenge_event').length;
if (challengeSites !== 3) {
  console.error(`SCANNER BROKEN — expected 3 record_challenge_event writes in src/App.jsx, found ${challengeSites}.`);
  process.exit(2);
}

const emitSites = findEmitSites(files, emitters);

// Assemble rows with a stable key order so a diff reads top to bottom.
// ⚠️ Cached by the NEEDLE, not by file:line. A writer that moves down a file
// keeps its birthday — which is the whole point of the column — and a line
// shuffle above it does not send the script back to git for 124 lookups.
const cache = existsSync(COMMITTED) ? JSON.parse(readFileSync(COMMITTED, 'utf8')) : { writers: [] };
// `(uncommitted)` is deliberately NOT cached: it is a statement about HEAD, not
// about the writer, and caching it would freeze a writer as undated forever
// once the commit that gives it a birthday lands.
const cached = new Map((cache.writers || [])
  .filter((w) => w.firstWrite && w.firstWrite !== '(uncommitted)')
  .map((w) => [w.needle || `${w.file}:${w.line}:${w.event}`, w]));

const writers = [];
for (const t of transports) {
  // A sink factory's own line is not a writer — its call sites are, and they
  // land below as transport-via-factory rows with the sink resolved.
  if (t.dynamicSink) continue;
  const literal = t.eventExpr && /^["']/.test(t.eventExpr);
  writers.push({
    event: literal ? t.eventExpr.replace(/^["']|["']$/g, '')
      : (t.eventExpr ? 'dynamic' : '(row)'),
    eventExpr: literal ? null : (t.eventExpr || null),
    sink: SINKS[t.sinkKey],
    file: t.file, line: t.line,
    gate: t.gate || 'NONE',
    kind: 'transport', via: t.fn,
    surfaces: surfaceOf(t.file),
    firstWrite: '', firstWriteScope: '', needle: null,
  });
}
for (const e of emitSites) {
  writers.push({
    event: e.event || 'dynamic',
    eventExpr: e.event ? null : (e.eventExpr || null),
    sink: [...new Set([...(e.sinks || []), ...(e.altSinks || [])])].sort().join(' + '),
    file: e.file, line: e.line,
    gate: [e.gate || 'NONE', e.altGate].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / '),
    kind: e.kind, via: e.via,
    surfaces: surfaceOf(e.file),
    firstWrite: '', firstWriteScope: '', needle: e.needle || null,
  });
}

// De-duplicate: an emitter reached through two aliases in one file is one row.
const seen = new Set();
const unique = writers.filter((w) => {
  const k = `${w.file}:${w.line}:${w.event}:${w.sink}`;
  if (seen.has(k)) return false;
  seen.add(k); return true;
});

unique.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.event.localeCompare(b.event));

// A literal event name is the ideal needle: it is what a reader would search
// for, it survives every refactor of the surrounding code, and it is what a
// second analyst comparing two counters actually has in hand. Dynamic rows fall
// back to the source line, trimmed — good enough to date the transport.
for (const w of unique) {
  if (!w.needle) w.needle = (views(w.file).raw.split('\n')[w.line - 1] || '').trim().slice(0, 72);
}
const wanted = [...new Set(unique
  .filter((w) => REFRESH || !cached.has(w.needle))
  .map((w) => w.needle))];
const dated = wanted.length ? await firstWriteAll(wanted) : new Map();
for (const w of unique) {
  const r = dated.get(w.needle) || cached.get(w.needle);
  w.firstWrite = r?.firstWrite ?? r?.date ?? '';
  w.firstWriteScope = r?.firstWriteScope ?? r?.scope ?? 'none';
}

/**
 * ⚠️ NO DATE IS TWO DIFFERENT FACTS, and only one of them is a problem.
 *
 * A writer that exists only in the working tree HAS no birthday yet — `git
 * log -S` is searching history for something history has never seen. That is
 * normal while a change is in flight, and it happened during this script's own
 * first run: a parallel session was mid-rename of first-game-started. Reporting
 * it identically to "git could not date this" would either fail the build over
 * somebody's unfinished work or teach everyone to ignore an empty column.
 *
 * So ask HEAD directly. Absent from HEAD → `(uncommitted)`, a transient state
 * that becomes a real date on the commit that lands the writer. Present in HEAD
 * and still undated → left empty, and the unit test fails, because that is the
 * genuine anomaly.
 */
const headCache = new Map();
const inHead = (file) => {
  if (!headCache.has(file)) {
    try { headCache.set(file, sh(['show', `HEAD:${file}`])); } catch { headCache.set(file, null); }
  }
  return headCache.get(file);
};
for (const w of unique) {
  if (w.firstWrite) continue;
  const head = inHead(w.file);
  if (head === null || !head.includes(w.needle)) { w.firstWrite = '(uncommitted)'; w.firstWriteScope = 'working-tree'; }
}

// Per-sink birthday = the earliest transport that wired that sink. This is the
// number the 130-row phantom needed and nobody had.
const sinkRows = {};
for (const w of unique) {
  for (const s of w.sink.split(' + ')) {
    if (!s) continue;
    const cur = sinkRows[s] || (sinkRows[s] = { sink: s, writers: 0, transports: 0, firstWrite: '', ungated: 0 });
    cur.writers += 1;
    const isTransport = w.kind !== 'emit';
    if (isTransport) cur.transports += 1;
    if (w.gate === 'NONE') cur.ungated += 1;
    if (isTransport && w.firstWrite && (!cur.firstWrite || w.firstWrite < cur.firstWrite)) cur.firstWrite = w.firstWrite;
  }
}

// ⚠️ THE BIRTHDAY REPORT. An event whose own first write PREDATES the sink it
// now lands in was measured somewhere else first — usually Clarity — so the
// two series share a name and not a population. Comparing them across a window
// that straddles the wiring date is the 130-row mistake, exactly.
// Only for the QUERYABLE sinks. Microsoft Clarity is excluded on purpose: its
// export API returns only its own auto-detected smart events, so nobody can
// compare two Clarity counters in the first place — that is the documented
// reason funnel_events exists (docs/FUNNEL.md). Flagging Clarity rows here
// would bury the handful of real risks under noise about a sink nobody reads.
const birthdayRisks = unique
  // ⚠️ String comparison, so an uncommitted writer must be excluded explicitly:
  // '(uncommitted)' sorts before every date and every one of them would be
  // flagged as predating its sink. A risk report with obvious false entries in
  // it is a risk report nobody finishes reading.
  .filter((w) => w.kind === 'emit' && /^\d/.test(w.firstWrite) && w.event !== 'dynamic')
  .map((w) => {
    const s = w.sink.split(' + ')
      .filter((k) => k !== SINKS.clarity)
      .map((k) => sinkRows[k]).filter((x) => x && x.firstWrite)
      .sort((a, b) => (a.firstWrite < b.firstWrite ? -1 : 1))[0];
    return s && w.firstWrite < s.firstWrite
      ? { event: w.event, file: w.file, line: w.line, eventFirstWrite: w.firstWrite, sink: s.sink, sinkFirstWrite: s.firstWrite }
      : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.event.localeCompare(b.event) || a.file.localeCompare(b.file));

const ungated = unique.filter((w) => w.gate === 'NONE');

// ⚠️ Publish only the gates a writer actually stands behind. Candidate gates
// are collected from every `navigator.webdriver` test in the tree, and one of
// them guards an easter egg rather than the funnel (HomeScreen.jsx). Listing it
// as an analytics gate would put a decorative check in the same table as
// isSyntheticTraffic() and quietly inflate the "we have six gates" reassurance.
const usedGates = new Set(unique.flatMap((w) => w.gate.split(' / ')));

const manifest = {
  generatedBy: 'scripts/audit-instruments.mjs',
  schema: 1,
  note: 'Generated. Do not hand-edit — re-run the script. tests/unit/instrument-register.test.js fails when this file is stale.',
  counts: {
    writers: unique.length,
    transports: unique.filter((w) => w.kind !== 'emit').length,
    emits: unique.filter((w) => w.kind === 'emit').length,
    gates: gates.filter((g) => usedGates.has(g.name)).length,
    ungated: ungated.length,
  },
  gates: gates
    .filter((g) => usedGates.has(g.name))
    .map((g) => ({ name: g.name, file: g.file, line: g.line, localhostToo: !!g.localhost, wrapsGate: !!g.wrapsGate }))
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
  sinks: Object.values(sinkRows).sort((a, b) => a.sink.localeCompare(b.sink)),
  ungatedBaseline: ungated.map((w) => `${w.file}:${w.line} ${w.event} -> ${w.sink}`).sort(),
  birthdayRisks,
  writers: unique.map((w) => ({
    event: w.event, eventExpr: w.eventExpr, sink: w.sink, file: w.file, line: w.line,
    gate: w.gate, surfaces: w.surfaces, firstWrite: w.firstWrite, firstWriteScope: w.firstWriteScope,
    kind: w.kind, via: w.via, needle: w.needle,
  })),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);

// ─── human summary ──────────────────────────────────────────────────────────
if (!QUIET) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`INSTRUMENT REGISTER  ${relative(ROOT, OUT)}`);
  console.log(`${unique.length} writers  ${manifest.counts.transports} transports  ${manifest.counts.emits} emit sites  ${manifest.counts.gates} gates`);
  if (unbalanced.length) {
    // Visible, not silent: each of these is a function the scanner could not
    // bound, so a writer inside it falls back to the next scope out.
    console.log(`${[...new Set(unbalanced)].length} declaration(s) could not be bounded and were skipped: ${[...new Set(unbalanced)].join(', ')}`);
  }
  console.log('');

  console.log('GATES');
  for (const g of manifest.gates) console.log(`  ${pad(g.name, 22)} ${g.file}:${g.line}${g.localhost ? '' : '   (webdriver only - no localhost check)'}`);

  console.log('\nSINKS - and their birthdays');
  for (const s of manifest.sinks) {
    console.log(`  ${pad(s.sink, 20)} first write ${s.firstWrite || '(unknown)'}  ${pad(s.writers + ' writers', 14)} ${s.ungated ? `${s.ungated} UNGATED` : 'all gated'}`);
  }

  console.log('\nWRITERS');
  let file = '';
  for (const w of manifest.writers) {
    if (w.file !== file) { file = w.file; console.log(`  ${file}   [${w.surfaces}]`); }
    console.log(`    ${pad(':' + w.line, 7)} ${pad(w.event, 26)} ${pad(w.sink, 22)} ${pad(w.gate, 24)} ${w.firstWrite || '?'}`);
  }

  if (birthdayRisks.length) {
    console.log('\nBIRTHDAY RISK - the event is older than the sink it writes to.');
    console.log('Comparing one of these against a sibling counter across a window that straddles');
    console.log('the wiring date produces a difference that means nothing.');
    for (const b of birthdayRisks) console.log(`  ${pad(b.event, 26)} event ${b.eventFirstWrite}  ${pad(b.sink, 20)} wired ${b.sinkFirstWrite}   ${b.file}:${b.line}`);
  }
}

if (ungated.length) {
  console.error(`\nUNGATED WRITERS: ${ungated.length}. These write to production from robots, crawlers and local dev.`);
  for (const w of ungated) console.error(`  ${w.file}:${w.line}  ${w.event} -> ${w.sink}   [${w.surfaces}]`);
  console.error('\nDo not gate them by widening an existing guard. Each needs its own decision.');
  process.exit(1);
}
console.log('\nAll writers gated.');
