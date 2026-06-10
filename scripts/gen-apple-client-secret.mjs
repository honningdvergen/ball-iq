// Generate the "Sign in with Apple" client-secret JWT for Supabase.
//
// Supabase's Apple provider "Secret Key (for OAuth)" field is NOT the raw
// .p8 — it's a JWT signed with the .p8, per Apple's OAuth spec. The JWT is
// valid up to ~6 months (Apple cap: 15777000 seconds). After that, sign-in
// breaks until a fresh JWT is generated and pasted into Supabase.
//
// Usage:
//   node scripts/gen-apple-client-secret.mjs [path-to-.p8]
//
// Default path: ~/Downloads/AuthKey_55P67V9N7S.p8
//
// Steps after running:
//   1. Copy the JWT printed below.
//   2. Supabase Dashboard → Authentication → Providers → Apple →
//      "Secret Key (for OAuth)" → paste → Save.
//   3. Note the expiry date — regenerate before then or sign-in breaks.

import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ── Apple Developer config (Ball IQ production) ────────────────────────────
const TEAM_ID     = 'A99W5L256P';
const KEY_ID      = '55P67V9N7S';
const SERVICES_ID = 'app.balliq.signin';
const AUDIENCE    = 'https://appleid.apple.com';
const VALIDITY_S  = 15_777_000; // ~6 months — Apple's hard cap.

// ── Resolve .p8 path ───────────────────────────────────────────────────────
const p8Path = process.argv[2] || join(homedir(), 'Downloads', `AuthKey_${KEY_ID}.p8`);

let p8;
try {
  p8 = readFileSync(p8Path, 'utf8');
} catch (e) {
  console.error(`Could not read .p8 at: ${p8Path}`);
  console.error(`  ${e.message}`);
  console.error(`\nPass a path: node scripts/gen-apple-client-secret.mjs /path/to/AuthKey_${KEY_ID}.p8`);
  process.exit(1);
}

if (!p8.includes('BEGIN PRIVATE KEY')) {
  console.error(`File at ${p8Path} doesn't look like a PEM-encoded private key.`);
  process.exit(1);
}

// ── Build + sign JWT ───────────────────────────────────────────────────────
const now = Math.floor(Date.now() / 1000);
const exp = now + VALIDITY_S;

const header  = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
const payload = { iss: TEAM_ID, iat: now, exp, aud: AUDIENCE, sub: SERVICES_ID };

const b64u = (obj) => Buffer.from(JSON.stringify(obj))
  .toString('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const signingInput = `${b64u(header)}.${b64u(payload)}`;

const key = createPrivateKey({ key: p8, format: 'pem' });

// dsaEncoding: 'ieee-p1363' produces the raw R||S concatenation that JWS
// expects. Without this, Node returns a DER-encoded signature and Apple
// rejects the JWT with invalid_client.
const signature = sign('sha256', Buffer.from(signingInput), {
  key,
  dsaEncoding: 'ieee-p1363',
});

const sigB64 = signature.toString('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const jwt = `${signingInput}.${sigB64}`;

// ── Output ─────────────────────────────────────────────────────────────────
console.log('');
console.log('Apple Sign in with Apple — client secret JWT');
console.log('============================================');
console.log('');
console.log(jwt);
console.log('');
console.log(`Issued at:  ${new Date(now * 1000).toISOString()}`);
console.log(`Expires:    ${new Date(exp * 1000).toISOString()}`);
console.log(`Valid for:  ~${Math.round(VALIDITY_S / 86400)} days (Apple max)`);
console.log('');
console.log('Next: Supabase Dashboard → Authentication → Providers → Apple →');
console.log('      "Secret Key (for OAuth)" → paste the JWT above → Save.');
console.log('');
console.log('Regenerate this JWT before the Expires date or Apple sign-in will break.');
