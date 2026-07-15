// scripts/publish-review.mjs
//
// Phase 4: apply review decisions from the Supabase question_review table
// back to src/questions.js.
//
// Usage:
//   npm run publish-review:dry        # dry run — print summary, no writes
//   npm run publish-review            # apply changes to src/questions.js
//
// Env vars (loaded from .env.local at the project root):
//   SUPABASE_SERVICE_ROLE_KEY  — required. The service_role key from Supabase
//                                 → Settings → API. Bypasses RLS so the
//                                 script can read decisions server-side. Do
//                                 NOT commit this. .env.local is gitignored.
//
// Workflow:
//   1. Run --dry-run to see what would change.
//   2. If correct, run without --dry-run to write to src/questions.js.
//   3. git diff src/questions.js — review the actual changes.
//   4. git commit -am 'Apply review decisions' && git push  (if good)
//      OR  git checkout src/questions.js                    (if not)

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QFILE = path.join(ROOT, 'src', 'questions.js');
const SUMMARY_FILE = path.join(__dirname, '.last-publish-summary.json');

const DRY_RUN = process.argv.includes('--dry-run');

// Hardcoded — same Supabase project as src/supabase.js. The reviewer email
// gates which user's decisions we publish, since the service-role key
// bypasses RLS and would otherwise see every reviewer's rows.
const SUPABASE_URL = 'https://blcisypmngimqkwxrrdm.supabase.co';
const REVIEWER_EMAIL = 'alexbo99@hotmail.no';

// ─── env loader ──────────────────────────────────────────────────────────────
// Tiny .env.local parser to avoid pulling a dotenv dep just for this one
// script. Skips comments / blank lines, strips surrounding quotes, and
// doesn't override pre-set process.env values.
function loadDotEnv() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  const txt = fs.readFileSync(file, 'utf8');
  for (const line of txt.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadDotEnv();

// ─── header banner ───────────────────────────────────────────────────────────
console.log(`# publish-review${DRY_RUN ? '  (DRY RUN — no writes)' : ''}`);
console.log(`Supabase URL:  ${SUPABASE_URL}`);

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('');
  console.error('ABORT: SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('Add it to .env.local at the repo root:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<service_role key>');
  console.error('Get the key from Supabase dashboard → Settings → API → service_role.');
  process.exit(1);
}
console.log(`Auth key:      SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)`);
console.log(`Reviewer:      ${REVIEWER_EMAIL}`);
console.log('');

// ─── git status guard ────────────────────────────────────────────────────────
// Refuse to write over uncommitted changes — user might have hand-edits in
// flight. Dry-run skips this check since it doesn't write anything.
function gitStatusClean() {
  try {
    const out = execSync('git status --porcelain src/questions.js', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out.trim() === '';
  } catch (e) {
    console.error('Could not run git status:', e.message);
    return false;
  }
}
if (!DRY_RUN && !gitStatusClean()) {
  console.error('ABORT: src/questions.js has uncommitted changes.');
  console.error('Commit or stash them first so we don\'t accidentally clobber manual edits.');
  console.error('Or use `npm run publish-review:dry` to see what would happen without writing.');
  process.exit(1);
}

// ─── load current questions ──────────────────────────────────────────────────
// Cache-bust the import URL so re-runs of the script in the same process pick
// up filesystem changes (relevant only during testing).
const importUrl = pathToFileURL(QFILE).href + `?cache=${Date.now()}`;
const mod = await import(importUrl);
const QB_orig = mod.QB;
const TF_orig = mod.TF_STATEMENTS;
console.log(`Loaded questions.js: QB=${QB_orig.length}, TF_STATEMENTS=${TF_orig.length}`);

// ─── connect to Supabase + fetch decisions ───────────────────────────────────
console.log('Connecting to Supabase…');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Resolve reviewer email → uuid via admin API. Service-role key required.
// Paginate: listUsers() with no params sends an empty per_page, so gotrue
// applies its default of 50 and returns newest-first. The reviewer is one of
// the oldest accounts, so once the project passed 50 users it fell off page 1
// and this script aborted with "No Supabase user found". Same 1000-row trap
// as the question_review fetch below (Sprint #89) — drain the pages instead.
const USER_PAGE_SIZE = 1000;
let reviewer = null;
for (let page = 1; ; page++) {
  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers({
    page,
    perPage: USER_PAGE_SIZE,
  });
  if (userErr) {
    console.error('Could not list users:', userErr.message);
    console.error('Make sure SUPABASE_SERVICE_ROLE_KEY is the service_role secret, not the anon key.');
    process.exit(1);
  }
  reviewer = usersData.users.find(u => u.email === REVIEWER_EMAIL);
  if (reviewer) break;
  if (usersData.users.length < USER_PAGE_SIZE) break;
}
if (!reviewer) {
  console.error(`No Supabase user found with email ${REVIEWER_EMAIL}`);
  process.exit(1);
}
console.log(`Reviewer uid:  ${reviewer.id.slice(0, 8)}…`);

// Sprint #89: paginate. Supabase REST defaults to 1000-row cap, so a single
// fetch silently truncated and earlier publish runs missed 142 rejected rows.
// Loop in 1000-row pages until a short page tells us we've drained the table.
const PAGE_SIZE = 1000;
const decisions = [];
for (let from = 0; ; from += PAGE_SIZE) {
  const { data: page, error: decErr } = await supabase
    .from('question_review')
    .select('question_id, source, status, edits, notes, updated_at')
    .eq('reviewed_by', reviewer.id)
    .order('updated_at', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (decErr) {
    console.error('Could not fetch question_review:', decErr.message);
    process.exit(1);
  }
  decisions.push(...page);
  if (page.length < PAGE_SIZE) break;
}
console.log(`Fetched ${decisions.length} decisions from question_review`);
console.log('');

// ─── apply decisions ─────────────────────────────────────────────────────────
const byId = new Map();
for (const d of decisions) byId.set(d.question_id, d);

const summary = {
  qb: { approved: 0, edited: 0, rejected: 0, flagged: 0, cleared: 0, removedIds: [], editedIds: [], flaggedIds: [], clearedIds: [] },
  tf: { approved: 0, edited: 0, rejected: 0, flagged: 0, cleared: 0, removedIds: [], editedIds: [], flaggedIds: [], clearedIds: [] },
  pending: 0,
  ignoredEditKeys: {},
};

// The edits jsonb is reviewer-authored free-form JSON, so it is NOT safe to
// merge wholesale: in practice it carries triage bookkeeping
// ({action, triage, applied, verdict}) rather than question fields, and
// serializeEntry writes any unknown key straight into the shipped bank — which
// would put "verdict":"flawed" in the client bundle. Only these content fields
// may be patched. `id` is excluded on purpose (it is the review/deep-link key)
// and `flag` is owned by the status branches above, not by an edit.
const PATCHABLE = {
  qb: new Set(['q', 'o', 'a', 'cat', 'tag', 'type', 'diff', 'hint', 'v', 'typed_a', 'aliases', 'league', 'club']),
  tf: new Set(['s', 'a', 'cat', 'tag', 'type', 'diff', 'hint', 'v']),
};

// Split an edits payload into the fields we will apply and the keys we won't.
function sanitizeEdits(edits, kind) {
  const allowed = PATCHABLE[kind];
  const patch = {};
  const ignored = [];
  for (const [k, v] of Object.entries(edits)) {
    if (allowed.has(k)) patch[k] = v;
    else ignored.push(k);
  }
  return { patch, ignored };
}

function applyDecision(item, kind /* 'qb' | 'tf' */) {
  const id = item.id;
  const dec = byId.get(id);
  if (!dec || dec.status === 'pending') {
    summary.pending++;
    return item; // unchanged
  }
  const bucket = summary[kind];
  switch (dec.status) {
    case 'approved': {
      // The flag marker is two-way: 'flagged' adds it below, and an approved
      // question is a resolved one, so clear it here. Without this the marker
      // is write-only — a flag→approved transition leaves flag:true in the
      // bank forever and the next triage re-opens questions already cleared.
      const { flag, ...resolved } = item;
      if (flag !== undefined) {
        bucket.cleared++;
        bucket.clearedIds.push(id);
      }
      const edits = dec.edits;
      if (edits && typeof edits === 'object' && Object.keys(edits).length > 0) {
        const { patch, ignored } = sanitizeEdits(edits, kind);
        for (const k of ignored) {
          summary.ignoredEditKeys[k] = (summary.ignoredEditKeys[k] || 0) + 1;
        }
        if (Object.keys(patch).length > 0) {
          bucket.edited++;
          bucket.editedIds.push(id);
          // Shallow merge — the question shape is flat (id, q, o, a, cat, ...).
          // The sanitized patch is a partial-field update.
          return { ...resolved, ...patch };
        }
        // Edits held nothing patchable (pure triage metadata) — a plain approval.
      }
      bucket.approved++;
      return resolved;
    }
    case 'rejected':
      // Removed outright, so any flag goes with it — nothing to clear.
      bucket.rejected++;
      bucket.removedIds.push(id);
      return null;
    case 'flagged':
      bucket.flagged++;
      bucket.flaggedIds.push(id);
      // Add a flag:true marker so the question is visually distinctive in
      // the diff during code review. Doesn't change runtime behaviour.
      return { ...item, flag: true };
    default:
      // Unknown status — be conservative, leave alone.
      summary.pending++;
      return item;
  }
}

const newQB = QB_orig.map(it => applyDecision(it, 'qb')).filter(Boolean);
const newTF = TF_orig.map(it => applyDecision(it, 'tf')).filter(Boolean);

// ─── safety checks ───────────────────────────────────────────────────────────
function abortIf(condition, msg) {
  if (condition) {
    console.error(`ABORT: ${msg}`);
    process.exit(1);
  }
}
// 90% size floor against corrupt parse / runaway delete
abortIf(newQB.length < QB_orig.length * 0.9,
  `QB dropped from ${QB_orig.length} to ${newQB.length} (>10% loss). Sanity floor.`);
abortIf(newTF.length < TF_orig.length * 0.9,
  `TF_STATEMENTS dropped from ${TF_orig.length} to ${newTF.length} (>10% loss). Sanity floor.`);

// Duplicate-id check after merging (an edit could in theory re-write an id
// to one that collides with another question)
function findDupe(items) {
  const seen = new Set();
  for (const it of items) {
    if (seen.has(it.id)) return it.id;
    seen.add(it.id);
  }
  return null;
}
const dQB = findDupe(newQB);
abortIf(dQB, `duplicate id ${dQB} in QB after merging edits.`);
const dTF = findDupe(newTF);
abortIf(dTF, `duplicate id ${dTF} in TF_STATEMENTS after merging edits.`);

// ─── re-serialise arrays ─────────────────────────────────────────────────────
// Canonical field order matches the format used by scripts/phase1-migrate.mjs.
// Any field not in the canonical list still gets serialised at the end so
// nothing is silently lost.
const QB_ORDER = ['id', 'q', 'o', 'a', 'cat', 'tag', 'type', 'diff', 'hint', 'v', 'typed_a', 'aliases', 'league', 'flag'];
const TF_ORDER = ['id', 's', 'a', 'cat', 'tag', 'type', 'diff', 'hint', 'v', 'flag'];

function serializeEntry(o, order) {
  const parts = [];
  for (const k of order) {
    if (o[k] === undefined) continue;
    parts.push(`${k}:${JSON.stringify(o[k])}`);
  }
  for (const k of Object.keys(o)) {
    if (order.includes(k)) continue;
    parts.push(`${k}:${JSON.stringify(o[k])}`);
  }
  return `  { ${parts.join(', ')} },`;
}

function serializeArray(items, order) {
  return items.map(o => serializeEntry(o, order)).join('\n');
}

// Surgical replacement: locate `export const NAME = [\n` … `\n];` and swap
// just the array body. Keeps surrounding comments / file structure intact.
function replaceArrayBody(src, name, items, order) {
  const re = new RegExp(`(export const ${name} = \\[\\n)([\\s\\S]*?)(\\n\\];)`);
  if (!re.test(src)) {
    console.error(`Could not locate \`export const ${name}\` block in source.`);
    process.exit(1);
  }
  return src.replace(re, `$1${serializeArray(items, order)}$3`);
}

const currentSrc = fs.readFileSync(QFILE, 'utf8');
let newSrc = currentSrc;
newSrc = replaceArrayBody(newSrc, 'QB', newQB, QB_ORDER);
newSrc = replaceArrayBody(newSrc, 'TF_STATEMENTS', newTF, TF_ORDER);
// CHAOS_QB was removed in the 2026-05-05 audit — chaos questions live
// in QB only, so the QB body replacement above already handles them.

// ─── summary output ──────────────────────────────────────────────────────────
console.log('## Decisions applied');
console.log(`QB                approved=${summary.qb.approved}  edited=${summary.qb.edited}  rejected=${summary.qb.rejected}  flagged=${summary.qb.flagged}  flags-cleared=${summary.qb.cleared}`);
console.log(`TF_STATEMENTS     approved=${summary.tf.approved}  edited=${summary.tf.edited}  rejected=${summary.tf.rejected}  flagged=${summary.tf.flagged}  flags-cleared=${summary.tf.cleared}`);
console.log(`Pending           ${summary.pending}`);
const ignoredKeys = Object.entries(summary.ignoredEditKeys);
if (ignoredKeys.length > 0) {
  console.log('');
  console.log('## Non-question keys in `edits` — NOT written to the bank');
  for (const [k, n] of ignoredKeys.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(18)} ignored on ${n} question(s)`);
  }
  console.log('  (reviewer bookkeeping stays in question_review; only content fields publish)');
}
console.log('');
console.log('## Net change');
console.log(`QB:             ${QB_orig.length} → ${newQB.length}  (Δ ${newQB.length - QB_orig.length})`);
console.log(`TF_STATEMENTS:  ${TF_orig.length} → ${newTF.length}  (Δ ${newTF.length - TF_orig.length})`);

// ─── write or report ─────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('');
  console.log('## DRY RUN — no files written.');
  console.log('');
  console.log('Next:');
  console.log('  1. Review the summary above.');
  console.log('  2. If correct, run:  npm run publish-review');
  console.log('  3. Then:             git diff src/questions.js');
  console.log('  4. If still good:    git commit -am "Apply review decisions" && git push');
  console.log('  5. If not:           git checkout src/questions.js   (reverts the file)');
} else {
  fs.writeFileSync(QFILE, newSrc);
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify({
    timestamp: new Date().toISOString(),
    reviewer: REVIEWER_EMAIL,
    counts: {
      qb_approved: summary.qb.approved,
      qb_edited: summary.qb.edited,
      qb_rejected: summary.qb.rejected,
      qb_flagged: summary.qb.flagged,
      qb_flags_cleared: summary.qb.cleared,
      tf_approved: summary.tf.approved,
      tf_edited: summary.tf.edited,
      tf_rejected: summary.tf.rejected,
      tf_flagged: summary.tf.flagged,
      tf_flags_cleared: summary.tf.cleared,
      pending: summary.pending,
    },
    ignored_edit_keys: summary.ignoredEditKeys,
    qb_total: { before: QB_orig.length, after: newQB.length },
    tf_total: { before: TF_orig.length, after: newTF.length },
    qb_removed_ids: summary.qb.removedIds,
    tf_removed_ids: summary.tf.removedIds,
    qb_edited_ids: summary.qb.editedIds,
    tf_edited_ids: summary.tf.editedIds,
    qb_flagged_ids: summary.qb.flaggedIds,
    tf_flagged_ids: summary.tf.flaggedIds,
    qb_flags_cleared_ids: summary.qb.clearedIds,
    tf_flags_cleared_ids: summary.tf.clearedIds,
  }, null, 2));
  console.log('');
  console.log(`Wrote ${path.relative(ROOT, QFILE)}`);
  console.log(`Wrote ${path.relative(ROOT, SUMMARY_FILE)}`);
  console.log('');
  console.log('Next:');
  console.log('  1. Review:  git diff src/questions.js');
  console.log('  2. If good: git commit -am "Apply review decisions" && git push');
  console.log('  3. If not:  git checkout src/questions.js   (reverts the file)');
}
