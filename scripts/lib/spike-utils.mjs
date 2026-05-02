// scripts/lib/spike-utils.mjs
//
// Shared utilities for the Stage 1 spike test suite. Consolidates the
// patterns that spike-1 and spike-2 had duplicated (env loading, config
// resolution, test-user sign-in via admin.generateLink + verifyOtp,
// timestamp formatting). New spikes should import from here.
//
// Env-var resolution order for each value:
//   1. process.env.<NAME>          (set by CI from GitHub secrets)
//   2. .env.local file at repo root (local dev convenience)
//   3. hardcoded fallback           (preserves pre-CI local behavior)
//
// In CI, env vars are required (no fallback to a hardcoded production
// URL). Locally, the fallback path keeps the existing dev workflow
// working without forcing every contributor to set up env vars.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ─── env loader ──────────────────────────────────────────────────────
// Reads .env.local (gitignored) into process.env. Skips lines that are
// already set via the runtime env (so CI secrets win over file contents).
export function loadDotEnv() {
  const file = path.join(REPO_ROOT, '.env.local');
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

// ─── config resolution ───────────────────────────────────────────────
// Resolves the spike test configuration from env vars + fallbacks.
// Throws with a clear message when CI mode is detected (CI=true) and
// a required value is missing — fail-loud beats silent-fall-to-prod.
export function resolveConfig() {
  loadDotEnv();
  const isCI = !!process.env.CI;

  // SUPABASE_URL — staging in CI, production locally (matches current dev flow).
  // Naming: SPIKE_SUPABASE_URL is preferred (explicit); SUPABASE_URL is legacy.
  const supabaseUrl =
    process.env.SPIKE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    (isCI ? null : 'https://blcisypmngimqkwxrrdm.supabase.co');

  // ANON key — VITE_SUPABASE_KEY is the legacy name from .env.local.
  const anonKey =
    process.env.SPIKE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY;

  // SERVICE ROLE — must never be in client code. CI sets via secret.
  const serviceKey =
    process.env.SPIKE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test user — fixed account on the project that the spikes sign in as.
  // Local fallback is the project owner's email (existing behavior).
  const testUserEmail =
    process.env.SPIKE_TEST_USER_EMAIL ||
    (isCI ? null : 'alexbo99@hotmail.no');

  const missing = [];
  if (!supabaseUrl) missing.push('SPIKE_SUPABASE_URL');
  if (!anonKey) missing.push('SPIKE_SUPABASE_ANON_KEY (or VITE_SUPABASE_KEY)');
  if (!serviceKey) missing.push('SPIKE_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  if (!testUserEmail) missing.push('SPIKE_TEST_USER_EMAIL');

  if (missing.length > 0) {
    const ctx = isCI ? 'CI run (no fallbacks)' : 'local run with no .env.local fallback';
    throw new Error(
      `[spike-utils] missing required env vars (${ctx}):\n  - ${missing.join('\n  - ')}\n` +
      `Set these in your env / .env.local / GitHub secrets and re-run.`
    );
  }

  return { supabaseUrl, anonKey, serviceKey, testUserEmail, isCI };
}

// ─── test user sign-in ───────────────────────────────────────────────
// Returns { userClient, userId, signOut } for the configured test user.
// Uses admin.generateLink (no email sent) + verifyOtp so a real session
// resolves with a non-null auth.uid() inside SECURITY DEFINER RPCs.
export async function signInTestUser(config, options = {}) {
  const { supabaseUrl, anonKey, serviceKey, testUserEmail } = config;
  const adminAuthOpts = { auth: { autoRefreshToken: false, persistSession: false } };
  const userAuthOpts = {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(options.realtime ? { realtime: options.realtime } : {}),
  };

  const admin = createClient(supabaseUrl, serviceKey, adminAuthOpts);
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: testUserEmail,
  });
  if (linkErr) throw new Error(`generateLink: ${linkErr.message}`);
  const otp = linkData?.properties?.email_otp;
  if (!otp) throw new Error('generateLink did not return email_otp');

  const userClient = createClient(supabaseUrl, anonKey, userAuthOpts);
  const { data: sessionData, error: verifyErr } = await userClient.auth.verifyOtp({
    email: testUserEmail,
    token: otp,
    type: 'magiclink',
  });
  if (verifyErr) throw new Error(`verifyOtp: ${verifyErr.message}`);

  return {
    userClient,
    userId: sessionData.user.id,
    signOut: async () => { try { await userClient.auth.signOut(); } catch {} },
  };
}

// ─── small assertion helpers ─────────────────────────────────────────
// Spikes can call these to surface failures with consistent formatting.
// Each spike still owns its own pass/fail summary + process.exit code;
// these are just diagnostic helpers.

export function ok(label) {
  console.log(`  ✓ ${label}`);
}

export function fail(label, detail) {
  console.log(`  ✗ ${label}`);
  if (detail !== undefined) {
    const formatted = typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2);
    console.log(`    ${formatted.split('\n').join('\n    ')}`);
  }
}

export function check(condition, label, detail) {
  if (condition) {
    ok(label);
    return true;
  }
  fail(label, detail);
  return false;
}

// ─── timing helpers ──────────────────────────────────────────────────

export function makeTimer() {
  const started = Date.now();
  return {
    elapsed: () => Date.now() - started,
    ts: () => `${(Date.now() - started).toString().padStart(5, ' ')}ms`,
  };
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── JSON summary for CI parsing ─────────────────────────────────────
// Each spike prints exactly one JSON object on the LAST line of stdout
// before exit. CI workflow can grep for this to extract structured
// pass/fail without parsing free-form log output.
export function emitSummary(summary) {
  console.log('');
  console.log('SPIKE_SUMMARY ' + JSON.stringify(summary));
}
