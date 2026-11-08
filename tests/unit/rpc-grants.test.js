import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// The grants lock (7-8 Nov 2026). Who may execute which database function is
// decided in prod, by GRANT and REVOKE, and nothing in the repo saw it: a new
// RPC called from the client but never granted fails only for real players,
// and a function quietly opened to anon (the logged-out role) widens what any
// visitor can do. supabase/prod-snapshot/rpc-grants.json is the record, read
// from prod with:
//
//   select p.proname as name, pg_get_function_identity_arguments(p.oid) as args,
//          p.prosecdef as security_definer,
//          has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
//          has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated
//   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
//   where n.nspname = 'public' and p.prokind = 'f' order by 1, 2;
//
// Refresh that file whenever a migration adds, drops or re-grants a function.

const ROOT = join(import.meta.dirname, '..', '..');
const SNAP = JSON.parse(readFileSync(join(ROOT, 'supabase/prod-snapshot/rpc-grants.json'), 'utf8'));
const FN = new Map(SNAP.functions.map((f) => [f.name, f]));

// Where the client and the serverless functions call RPCs. scripts/seo holds
// the engines baked into the static pages, which call PostgREST directly.
const DIRS = ['src', 'api', 'scripts/seo'];
const EXT = /\.(js|jsx|mjs|ts)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

// Every way the code names an RPC today:
//   supabase.rpc('x')          the client
//   rpc('x')                   local wrappers (dailyResults, webpushVisitor)
//   withRetry('x')             multiplayerRpc.js
//   call('x')                  leagues.js
//   /rest/v1/rpc/x             fetch() from api/ and the static pages
// If a new wrapper appears, add its pattern here: the floor check below fails
// first if the scan stops finding calls.
const PATTERNS = [
  /\.?\brpc\(\s*['"`]([a-z_][a-z0-9_]*)['"`]/g,
  /\bwithRetry\(\s*['"`]([a-z_][a-z0-9_]*)['"`]/g,
  /\bcall\(\s*['"`]([a-z_][a-z0-9_]*)['"`]/g,
  /\/rpc\/([a-z_][a-z0-9_]*)\b/g,
];
// Words the patterns can catch that are not function names.
const NOT_NAMES = new Set(['from']);

const calls = new Map(); // name -> [file, ...]
for (const dir of DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, 'utf8');
    for (const re of PATTERNS) {
      for (const m of src.matchAll(re)) {
        const name = m[1];
        if (NOT_NAMES.has(name)) continue;
        // call('x') is only an RPC inside leagues.js.
        if (re === PATTERNS[2] && !file.endsWith('leagues.js')) continue;
        if (!calls.has(name)) calls.set(name, new Set());
        calls.get(name).add(relative(ROOT, file));
      }
    }
  }
}

// The functions anon may execute, by decision. Widening this is a security
// decision taken in a migration and then here, never one that slips in.
const ANON_CALLABLE = [
  'get_daily_distribution',
  'is_profane_username',
  'log_club_quiz',
  'record_challenge_event',
  'record_daily_result',
  'record_funnel_event',
  'report_question',
  'room_lookup',
  'subscribe_web_push',
  'unsubscribe_web_push',
];
// Trigger functions keep Postgres' default PUBLIC execute grant. They cannot
// be called as an RPC (Postgres refuses to run a trigger function outside a
// trigger), so they are listed apart rather than counted as anon-callable.
const ANON_TRIGGERS = ['profiles_check_profanity', 'set_updated_at'];

describe('RPC grants match what the code calls', () => {
  it('the scan still finds the RPC calls (guards the patterns)', () => {
    expect(calls.size).toBeGreaterThanOrEqual(40);
  });

  it('every RPC the code calls exists in prod', () => {
    const missing = [...calls.keys()].filter((n) => !FN.has(n))
      .map((n) => `${n} (${[...calls.get(n)].join(', ')})`);
    expect(missing, 'called but not in supabase/prod-snapshot/rpc-grants.json').toEqual([]);
  });

  it('every RPC the code calls is executable by anon or authenticated', () => {
    const locked = [...calls.keys()].filter((n) => FN.has(n) && !FN.get(n).anon && !FN.get(n).authenticated);
    expect(locked).toEqual([]);
  });

  it('anon may execute exactly the agreed functions, nothing more', () => {
    const anon = SNAP.functions.filter((f) => f.anon && f.returns !== 'trigger').map((f) => f.name).sort();
    expect(anon).toEqual([...ANON_CALLABLE].sort());
  });

  it('the anon-executable trigger functions are the two known ones', () => {
    const trig = SNAP.functions.filter((f) => f.anon && f.returns === 'trigger').map((f) => f.name).sort();
    expect(trig).toEqual([...ANON_TRIGGERS].sort());
  });

  it('granted to authenticated, not yet called by the client: kept on purpose', () => {
    // is_room_member is an RLS helper (policies call it, the client never
    // does). set_league_display_name belongs to the leagues feature: a rename
    // in the league table may use it (Ball IQ HQ, 8 Nov 2026: keep the grant).
    // When the client starts calling one, take it off this list.
    const GRANTED_NOT_CALLED = ['is_room_member', 'set_league_display_name'];
    for (const name of GRANTED_NOT_CALLED) {
      const f = FN.get(name);
      expect(f, name).toBeTruthy();
      expect([f.anon, f.authenticated], name).toEqual([false, true]);
      expect(calls.has(name), `${name} is now called: remove it from GRANTED_NOT_CALLED`).toBe(false);
    }
  });

  it('server-only functions stay closed to both client roles', () => {
    // Cron jobs, cleanup and the email selectors run as the service role.
    for (const name of ['cleanup_funnel_events', 'cleanup_stale_anon_users', 'enqueue_web_daily_reminders',
      'reap_stale_rooms', 'select_activate_candidates', 'select_day2_email_candidates', 'select_winback_candidates', 'played_on']) {
      const f = FN.get(name);
      expect(f, name).toBeTruthy();
      expect([f.anon, f.authenticated], name).toEqual([false, false]);
    }
  });
});
