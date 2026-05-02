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
//   or:  npm run test:spike-2

import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import {
  resolveConfig,
  signInTestUser,
  emitSummary,
} from './lib/spike-utils.mjs';

const config = resolveConfig();

console.log('# Spike 2 — advance_question race (FOR UPDATE + expected_question gate)');
console.log(`Project:     ${config.supabaseUrl}`);
console.log(`Mode:        ${config.isCI ? 'CI' : 'local'}`);
console.log(`Iterations:  50× 2-way, 10× 3-way, 10× 4-way`);
console.log('');

const { userClient, signOut } = await signInTestUser(config);
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

await signOut();

console.log('## Final summary');
const totalIter = r2.count + r3.count + r4.count;
const totalPass = r2.passes + r3.passes + r4.passes;
const totalFlakes = r2.flakes + r3.flakes + r4.flakes;
console.log(`Total iterations:  ${totalIter}`);
console.log(`Passed:            ${totalPass}`);
console.log(`Flakes:            ${totalFlakes}`);
console.log('');

const passed = totalFlakes === 0;
if (passed) {
  console.log('PASS — FOR UPDATE + expected_question gate serializes concurrent advances correctly across all concurrencies.');
} else {
  console.log('FAIL — gate failed under concurrency. See per-iteration FLAKE logs above.');
}

emitSummary({
  spike: 2,
  status: passed ? 'pass' : 'fail',
  totals: { iterations: totalIter, passed: totalPass, flakes: totalFlakes },
  perBatch: [
    { label: r2.label, concurrency: r2.concurrency, passes: r2.passes, flakes: r2.flakes, latencyMs: { p50: Math.round(r2.latencies[Math.floor(r2.latencies.length * 0.5)]), p95: Math.round(r2.latencies[Math.floor(r2.latencies.length * 0.95)]), max: Math.round(r2.latencies[r2.latencies.length - 1]) } },
    { label: r3.label, concurrency: r3.concurrency, passes: r3.passes, flakes: r3.flakes, latencyMs: { p50: Math.round(r3.latencies[Math.floor(r3.latencies.length * 0.5)]), p95: Math.round(r3.latencies[Math.floor(r3.latencies.length * 0.95)]), max: Math.round(r3.latencies[r3.latencies.length - 1]) } },
    { label: r4.label, concurrency: r4.concurrency, passes: r4.passes, flakes: r4.flakes, latencyMs: { p50: Math.round(r4.latencies[Math.floor(r4.latencies.length * 0.5)]), p95: Math.round(r4.latencies[Math.floor(r4.latencies.length * 0.95)]), max: Math.round(r4.latencies[r4.latencies.length - 1]) } },
  ],
});

process.exit(passed ? 0 : 1);
