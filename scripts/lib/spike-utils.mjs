// scripts/lib/spike-utils.mjs
//
// Shared utilities for the Stage 1 spike test suite. Consolidates the
// patterns that spike-1 and spike-2 had duplicated (env loading, config
// resolution, test-user sign-in via admin.generateLink + verifyOtp,
// timestamp formatting). New spikes should import from here.
//
// Env-var resolution order for each value (highest precedence first):
//   1. process.env.<NAME>           (CI secrets / shell exports at startup)
//   2. .env.spike file at repo root (spike-only staging credentials)
//   3. .env.local file at repo root (local dev convenience)
//
// No hardcoded fallbacks. All five SPIKE_* env vars are required in every
// environment (local + CI) — missing values throw at config-resolve time
// with the variable name in the error. This refuses to silently fall back
// to production credentials that happen to live under legacy names in
// .env.local (VITE_SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY).
//
// .env.spike is loaded AFTER .env.local so SPIKE_* values there win over
// any same-named keys in .env.local. Local contributors must populate
// .env.spike (gitignored, staging-only) before running any spike script.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ─── env loader ──────────────────────────────────────────────────────
// Reads .env.local then .env.spike (both gitignored) into process.env.
// Files are loaded in increasing precedence: .env.spike overrides
// .env.local, but neither overrides keys already set in the runtime env
// at script start (so CI secrets / shell exports always win).
export function loadDotEnv() {
  // Snapshot keys set by CI/shell BEFORE loading any file, so neither
  // file can override them (CI secrets take precedence over file content).
  const startupKeys = new Set(Object.keys(process.env));
  loadEnvFile('.env.local', startupKeys);
  loadEnvFile('.env.spike', startupKeys);
}

function loadEnvFile(filename, protectedKeys) {
  const file = path.join(REPO_ROOT, filename);
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
    if (protectedKeys.has(m[1])) continue;
    process.env[m[1]] = value;
  }
}

// ─── config resolution ───────────────────────────────────────────────
// Resolves the spike test configuration. Reads ONLY the five SPIKE_* env
// vars — no legacy or fallback names — and throws if any are missing.
// Logs the resolved target URL + project_ref to stdout BEFORE returning
// so any future misconfig is visible on the first line of script output,
// ahead of any auth or write operation.
export function resolveConfig() {
  loadDotEnv();
  const isCI = !!process.env.CI;

  const supabaseUrl = process.env.SPIKE_SUPABASE_URL;
  const anonKey = process.env.SPIKE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SPIKE_SUPABASE_SERVICE_ROLE_KEY;
  const testUserEmail = process.env.SPIKE_TEST_USER_EMAIL;
  const testUserPassword = process.env.SPIKE_TEST_USER_PASSWORD;

  const missing = [];
  if (!supabaseUrl) missing.push('SPIKE_SUPABASE_URL');
  if (!anonKey) missing.push('SPIKE_SUPABASE_ANON_KEY');
  if (!serviceKey) missing.push('SPIKE_SUPABASE_SERVICE_ROLE_KEY');
  if (!testUserEmail) missing.push('SPIKE_TEST_USER_EMAIL');
  if (!testUserPassword) missing.push('SPIKE_TEST_USER_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `[spike-utils] missing required env vars (no fallbacks):\n  - ${missing.join('\n  - ')}\n` +
      `Set these in .env.spike (local), shell exports, or CI secrets and re-run.`
    );
  }

  const projectRef = extractProjectRef(supabaseUrl);
  console.log(`[spike] Target: ${supabaseUrl} (project_ref=${projectRef})`);

  return { supabaseUrl, anonKey, serviceKey, testUserEmail, testUserPassword, isCI };
}

function extractProjectRef(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.split('.')[0] || 'unknown';
  } catch {
    return 'unknown';
  }
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
