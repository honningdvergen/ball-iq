// scripts/spike-2-advance-race.mjs
//
// Stage 1 Spike 2: validate the FOR UPDATE + expected_question gating
// pattern against concurrent advance_question calls. Stage 1's host
// "Next question" button + per-player auto-advance handlers can race;
// the gate must let exactly ONE caller advance and force the rest to
// idempotent no-ops.
//
// Method:
//   1. Insert one _spike_room with current_question=0 via _spike_write.
//   2. Fire N concurrent _spike_advance(room_id, expected=0) calls.
//   3. Verify exactly one returns advanced=true; the rest return
//      advanced=false with reason='expected_mismatch' and current=1.
//   4. Repeat (50× for 2-way, 10× for 3-way, 10× for 4-way).
//
// _spike_advance includes pg_sleep(0.05) BEFORE the gate check so
// concurrent callers reliably race observably. The function holds the
// FOR UPDATE row lock during the sleep, so all callers serialize on
// the row lock; only the first caller to acquire it sees current=0.
//
// Auth: same admin.generateLink + verifyOtp pattern as Spike 1.
//
// Usage: node scripts/spike-2-advance-race.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadDotEnv();

const SUPABASE_URL = 'https://blcisypmngimqkwxrrdm.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_EMAIL = 'alexbo99@hotmail.no';

if (!ANON_KEY || !SERVICE_KEY) {
  console.error('ABORT: missing VITE_SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

console.log('# Spike 2 — advance_question race (FOR UPDATE + expected_question gate)');
console.log(`Project:     ${SUPABASE_URL}`);
console.log(`Iterations:  50× 2-way, 10× 3-way, 10× 4-way`);
console.log('');

// Auth
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: USER_EMAIL });
if (linkErr) { console.error(`generateLink: ${linkErr.message}`); process.exit(1); }
const otp = linkData?.properties?.email_otp;
if (!otp) { console.error('no email_otp in generateLink response'); process.exit(1); }

const userClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { error: verifyErr } = await userClient.auth.verifyOtp({ email: USER_EMAIL, token: otp, type: 'magiclink' });
if (verifyErr) { console.error(`verifyOtp: ${verifyErr.message}`); process.exit(1); }
console.log('auth: signed in OK');
console.log('');

// ─── Race iteration ──────────────────────────────────────────────────
async function runRace(concurrency) {
  const room_id = crypto.randomUUID();
  // Insert room
  const { error: insErr } = await userClient.rpc('_spike_write', {
    p_op: 'insert', p_target: 'room',
    p_payload: { id: room_id, current_question: 0, state: 'playing' },
  });
  if (insErr) throw new Error(`insert room: ${insErr.message}`);

  // Fire concurrent advance calls
  const tStart = performance.now();
  const settled = await Promise.all(
    Array.from({ length: concurrency }, () =>
      userClient.rpc('_spike_advance', { p_room_id: room_id, p_expected_question: 0 })
        .then(({ data, error }) => ({ data, error, t: performance.now() - tStart }))
    )
  );
  const totalMs = performance.now() - tStart;

  // Cleanup
  await userClient.rpc('_spike_write', { p_op: 'delete', p_target: 'room', p_payload: { id: room_id } });

  // Tally
  const winners = settled.filter(s => s.data?.advanced === true);
  const losers = settled.filter(s => s.data?.advanced === false);
  const errors = settled.filter(s => s.error);

  return {
    concurrency,
    totalMs,
    winners: winners.length,
    losers: losers.length,
    errors: errors.length,
    pass: winners.length === 1 && losers.length === concurrency - 1 && errors.length === 0,
    losersValid: losers.every(s => s.data?.reason === 'expected_mismatch' && s.data?.current_question === 1),
    settled: settled.map(s => ({ data: s.data, error: s.error?.message, t: s.t })),
  };
}

async function runBatch(label, concurrency, count) {
  console.log(`## ${label}`);
  const results = [];
  for (let i = 0; i < count; i++) {
    const r = await runRace(concurrency);
    results.push(r);
    const status = r.pass && r.losersValid ? 'OK' : 'FLAKE';
    if (status === 'FLAKE') {
      console.log(`  iter ${String(i + 1).padStart(2)}: FLAKE — winners=${r.winners} losers=${r.losers} errors=${r.errors} losersValid=${r.losersValid} totalMs=${r.totalMs.toFixed(1)}`);
      console.log(`    settled: ${JSON.stringify(r.settled)}`);
    }
  }
  // Summary
  const passes = results.filter(r => r.pass && r.losersValid).length;
  const flakes = results.length - passes;
  const latencies = results.map(r => r.totalMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const max = latencies[latencies.length - 1];
  console.log(`  Summary: ${passes}/${results.length} passed, ${flakes} flakes`);
  console.log(`  Latency (Promise.all wall time): p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max.toFixed(1)}ms`);
  console.log('');
  return { label, concurrency, count, passes, flakes, latencies, results };
}

const r2 = await runBatch('50× 2-way concurrent', 2, 50);
const r3 = await runBatch('10× 3-way concurrent', 3, 10);
const r4 = await runBatch('10× 4-way concurrent', 4, 10);

await userClient.auth.signOut();

console.log('## Final summary');
const totalIter = r2.count + r3.count + r4.count;
const totalPass = r2.passes + r3.passes + r4.passes;
const totalFlakes = r2.flakes + r3.flakes + r4.flakes;
console.log(`Total iterations:  ${totalIter}`);
console.log(`Passed:            ${totalPass}`);
console.log(`Flakes:            ${totalFlakes}`);
console.log('');
if (totalFlakes === 0) {
  console.log('PASS — FOR UPDATE + expected_question gate serializes concurrent advances correctly across all concurrencies.');
  process.exit(0);
} else {
  console.log('FAIL — gate failed under concurrency. See per-iteration FLAKE logs above.');
  process.exit(1);
}
