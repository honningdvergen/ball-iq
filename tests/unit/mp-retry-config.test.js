// Every withRetry('name') call MUST have a RETRY_CONFIG entry.
//
// Why this gate exists (2026-08-29): three wrappers (set_player_ready,
// start_next_round, claim_rematch) shipped without entries. withRetry threw
// at call time, the caller's busy-flag never cleared, and the ready-up board
// became a button that silently did nothing — for every player, since the
// day it shipped. Caught only by a live two-device test. withRetry now
// degrades to a single attempt instead of throwing, but a missing entry is
// still an unreviewed retry policy, so the gate fails the build either way.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(root, 'src', 'multiplayerRpc.js'), 'utf8');

describe('multiplayerRpc retry config', () => {
  const called = [...src.matchAll(/withRetry\('([a-z_]+)'/g)].map((m) => m[1]);
  const configBlock = src.slice(src.indexOf('const RETRY_CONFIG'), src.indexOf('function jittered'));
  const configured = [...configBlock.matchAll(/^  ([a-z_]+):\s*\{/gm)].map((m) => m[1]);

  it('finds the call sites and the config (self-check)', () => {
    expect(called.length).toBeGreaterThanOrEqual(11);
    expect(configured.length).toBeGreaterThanOrEqual(11);
  });

  it('every RPC called through withRetry has a RETRY_CONFIG entry', () => {
    const missing = [...new Set(called)].filter((n) => !configured.includes(n));
    expect(missing, `RPCs without retry config: ${missing.join(', ')}`).toEqual([]);
  });
});
