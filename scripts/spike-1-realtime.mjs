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
// user session for fec364dd-...@hotmail.no, so auth.uid() resolves
// inside the SECURITY DEFINER functions.
//
// Usage: node scripts/spike-1-realtime.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
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

const startedAt = Date.now();
const ts = () => `${(Date.now() - startedAt).toString().padStart(5, ' ')}ms`;

console.log(`# Spike 1 — Realtime: two postgres_changes filters on one channel`);
console.log(`Project:     ${SUPABASE_URL}`);
console.log(`Tables:      _spike_room, _spike_player`);
console.log('');

// Authenticate as the user via admin-generated magiclink OTP
console.log(`[${ts()}] auth:         generating magiclink OTP via admin API`);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: USER_EMAIL,
});
if (linkErr) {
  console.error(`generateLink failed: ${linkErr.message}`);
  process.exit(1);
}
const otp = linkData?.properties?.email_otp;
if (!otp) {
  console.error('generateLink did not return email_otp');
  process.exit(1);
}

const userClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});
const { data: sessionData, error: verifyErr } = await userClient.auth.verifyOtp({
  email: USER_EMAIL,
  token: otp,
  type: 'magiclink',
});
if (verifyErr) {
  console.error(`verifyOtp failed: ${verifyErr.message}`);
  process.exit(1);
}
const USER_ID = sessionData.user.id;
console.log(`[${ts()}] auth:         signed in as ${USER_ID.slice(0, 8)}…`);

// Subscribe — one channel, TWO postgres_changes filters
const events = []; // { t, table, eventType, row }

const channel = userClient
  .channel('spike-1-dual-filter')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '_spike_room' },
    (payload) => {
      events.push({
        t: Date.now() - startedAt,
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
        t: Date.now() - startedAt,
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
  const tWrite = Date.now() - startedAt;
  const { error } = await userClient.rpc('_spike_write', {
    p_op: op,
    p_target: target,
    p_payload: payload,
  });
  if (error) {
    console.error(`_spike_write failed for "${label}": ${error.message}`);
    await cleanup();
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
for (const w of writeTimestamps) {
  const matched = events.find(e =>
    e.table === `_spike_${w.target}` &&
    e.eventType === w.op.toUpperCase() &&
    e.t >= w.t
  );
  if (matched) {
    console.log(`  ${w.label.padEnd(28)} → event in ${matched.t - w.t}ms`);
  } else {
    console.log(`  ${w.label.padEnd(28)} → NO MATCHING EVENT`);
  }
}

// Pass/fail
const roomOk = JSON.stringify(roomCounts) === JSON.stringify(expectRoomCounts);
const playerOk = JSON.stringify(playerCounts) === JSON.stringify(expectPlayerCounts);
console.log('');
if (roomOk && playerOk) {
  console.log('PASS — both filters delivered all expected events on a single channel.');
  process.exit(0);
} else {
  console.log('FAIL — event count mismatch on at least one filter.');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────
async function cleanup() {
  console.log(`[${ts()}] cleanup:      removing channel + signing out`);
  try { await userClient.removeChannel(channel); } catch {}
  try { await userClient.auth.signOut(); } catch {}
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function describeRoom(p) {
  const r = p.new || p.old || {};
  return `q=${r.current_question ?? '?'} state=${r.state ?? '?'}`;
}
function describePlayer(p) {
  const r = p.new || p.old || {};
  return `uid=${(r.user_id || '').slice(0, 8)}… score=${r.score ?? '?'} aq=${r.answered_question ?? '?'}`;
}
