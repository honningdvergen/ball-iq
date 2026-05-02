// scripts/spike-1-realtime.mjs
//
// Stage 1 Spike 1: validate that a single Supabase Realtime channel can
// carry TWO postgres_changes filters (one per table) and reliably deliver
// both event streams to the same subscriber. Stage 1 needs this so the
// client subscribes to one channel and receives both room state changes
// (host advances question) and player state changes (others' answers,
// joins, leaves) without managing two channels.
//
// Tables: _spike_room and _spike_player (created by spike-prep SQL).
// Writes flow through the SECURITY DEFINER _spike_write RPC.
//
// Auth: admin.generateLink (no email sent) + verifyOtp creates a real
// user session for the configured test user, so auth.uid() resolves
// inside the SECURITY DEFINER functions.
//
// Usage: node scripts/spike-1-realtime.mjs
//   or:  npm run test:spike-1
//
// Required env (see scripts/README.md):
//   SPIKE_SUPABASE_URL, SPIKE_SUPABASE_ANON_KEY,
//   SPIKE_SUPABASE_SERVICE_ROLE_KEY, SPIKE_TEST_USER_EMAIL
// Local dev fall back to .env.local + hardcoded production project
// (see scripts/lib/spike-utils.mjs).

import crypto from 'node:crypto';
import {
  resolveConfig,
  signInTestUser,
  check,
  makeTimer,
  sleep,
  emitSummary,
} from './lib/spike-utils.mjs';

const config = resolveConfig();
const timer = makeTimer();
const ts = () => timer.ts();

console.log(`# Spike 1 — Realtime: two postgres_changes filters on one channel`);
console.log(`Project:     ${config.supabaseUrl}`);
console.log(`Tables:      _spike_room, _spike_player`);
console.log(`Mode:        ${config.isCI ? 'CI' : 'local'}`);
console.log('');

console.log(`[${ts()}] auth:         signing in test user`);
const { userClient, userId, signOut } = await signInTestUser(config, {
  realtime: { params: { eventsPerSecond: 10 } },
});
console.log(`[${ts()}] auth:         signed in as ${userId.slice(0, 8)}…`);

// Subscribe — one channel, TWO postgres_changes filters
const events = []; // { t, table, eventType, row }

const channel = userClient
  .channel('spike-1-dual-filter')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '_spike_room' },
    (payload) => {
      events.push({
        t: timer.elapsed(),
        table: '_spike_room',
        eventType: payload.eventType,
        row: payload.new || payload.old,
      });
      console.log(`[${ts()}] event:        _spike_room    ${payload.eventType.padEnd(6)} ${describeRoom(payload)}`);
    }
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '_spike_player' },
    (payload) => {
      events.push({
        t: timer.elapsed(),
        table: '_spike_player',
        eventType: payload.eventType,
        row: payload.new || payload.old,
      });
      console.log(`[${ts()}] event:        _spike_player  ${payload.eventType.padEnd(6)} ${describePlayer(payload)}`);
    }
  );

await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('subscribe timeout (12s)')), 12000);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      clearTimeout(t);
      console.log(`[${ts()}] subscribed:   channel ready (two filters active)`);
      resolve();
    } else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
      clearTimeout(t);
      reject(new Error(`subscribe failed: ${status}`));
    }
  });
});

await sleep(300);

const ROOM_ID = crypto.randomUUID();
const P2_ID = crypto.randomUUID();

const writes = [
  ['INSERT room',           'insert', 'room',   { id: ROOM_ID, current_question: 0, state: 'lobby' }],
  ['INSERT player P1',      'insert', 'player', { room_id: ROOM_ID }],
  ['UPDATE player P1 score','update', 'player', { room_id: ROOM_ID, score: 100, answered_question: 0 }],
  ['UPDATE room q=1',       'update', 'room',   { id: ROOM_ID, current_question: 1 }],
  ['INSERT player P2',      'insert', 'player', { room_id: ROOM_ID, user_id: P2_ID }],
  ['UPDATE player P2 score','update', 'player', { room_id: ROOM_ID, user_id: P2_ID, score: 50, answered_question: 1 }],
  ['DELETE player P1',      'delete', 'player', { room_id: ROOM_ID }],
  ['DELETE room (cascades P2)', 'delete', 'room', { id: ROOM_ID }],
];

const writeTimestamps = [];
for (const [label, op, target, payload] of writes) {
  console.log(`[${ts()}] write:        ${label}`);
  const tWrite = timer.elapsed();
  const { error } = await userClient.rpc('_spike_write', {
    p_op: op,
    p_target: target,
    p_payload: payload,
  });
  if (error) {
    console.error(`_spike_write failed for "${label}": ${error.message}`);
    await cleanup();
    emitSummary({ spike: 1, status: 'error', stage: 'write', label, message: error.message });
    process.exit(1);
  }
  writeTimestamps.push({ label, op, target, t: tWrite });
  await sleep(120); // small gap between writes for clean per-event log
}

// Wait for late-arriving events
await sleep(1500);

await cleanup();

// ─── Findings ────────────────────────────────────────────────────────
console.log('');
console.log('## Findings');
const roomEvents = events.filter(e => e.table === '_spike_room');
const playerEvents = events.filter(e => e.table === '_spike_player');
const expectRoomCounts = { INSERT: 1, UPDATE: 1, DELETE: 1 };
const expectPlayerCounts = { INSERT: 2, UPDATE: 2, DELETE: 2 }; // 1 explicit + 1 cascade
const got = (arr) => arr.reduce((acc, e) => ({ ...acc, [e.eventType]: (acc[e.eventType] || 0) + 1 }), {});
const roomCounts = got(roomEvents);
const playerCounts = got(playerEvents);

console.log('');
console.log(`Room events:    ${JSON.stringify(roomCounts)}`);
console.log(`  expected:     ${JSON.stringify(expectRoomCounts)}`);
console.log(`Player events:  ${JSON.stringify(playerCounts)}`);
console.log(`  expected:     ${JSON.stringify(expectPlayerCounts)}`);

// Per-event latency: time between write and event-received
console.log('');
console.log('Per-write latency:');
const latencies = [];
for (const w of writeTimestamps) {
  const matched = events.find(e =>
    e.table === `_spike_${w.target}` &&
    e.eventType === w.op.toUpperCase() &&
    e.t >= w.t
  );
  if (matched) {
    const lat = matched.t - w.t;
    latencies.push(lat);
    console.log(`  ${w.label.padEnd(28)} → event in ${lat}ms`);
  } else {
    console.log(`  ${w.label.padEnd(28)} → NO MATCHING EVENT`);
  }
}

// Pass/fail
console.log('');
const roomOk = check(
  JSON.stringify(roomCounts) === JSON.stringify(expectRoomCounts),
  '_spike_room event counts match expected',
  { got: roomCounts, expected: expectRoomCounts },
);
const playerOk = check(
  JSON.stringify(playerCounts) === JSON.stringify(expectPlayerCounts),
  '_spike_player event counts match expected',
  { got: playerCounts, expected: expectPlayerCounts },
);

const passed = roomOk && playerOk;
const p50 = latencies.length ? Math.round(latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)]) : null;
const max = latencies.length ? Math.max(...latencies) : null;

console.log('');
if (passed) {
  console.log('PASS — both filters delivered all expected events on a single channel.');
} else {
  console.log('FAIL — event count mismatch on at least one filter.');
}

emitSummary({
  spike: 1,
  status: passed ? 'pass' : 'fail',
  roomCounts,
  playerCounts,
  expectRoomCounts,
  expectPlayerCounts,
  latency: { p50, max, count: latencies.length },
});

process.exit(passed ? 0 : 1);

// ─── Helpers ─────────────────────────────────────────────────────────
async function cleanup() {
  console.log(`[${ts()}] cleanup:      removing channel + signing out`);
  try { await userClient.removeChannel(channel); } catch {}
  await signOut();
}

function describeRoom(p) {
  const r = p.new || p.old || {};
  return `q=${r.current_question ?? '?'} state=${r.state ?? '?'}`;
}
function describePlayer(p) {
  const r = p.new || p.old || {};
  return `uid=${(r.user_id || '').slice(0, 8)}… score=${r.score ?? '?'} aq=${r.answered_question ?? '?'}`;
}
