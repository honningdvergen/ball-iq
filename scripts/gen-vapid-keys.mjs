#!/usr/bin/env node
/**
 * Generate a VAPID keypair for Web Push.
 *
 * WHY THIS EXISTS rather than `deno run https://raw.githubusercontent.com/...`
 * (which the plan doc suggested): VAPID keys are just an ECDSA P-256 keypair,
 * which Node's built-in crypto makes in three lines. Piping a raw GitHub URL
 * into a runtime to mint a long-lived production secret means trusting whatever
 * that file says at the moment you run it. No download, no dependency, no trust.
 *
 * ⚠️ THE PRIVATE KEY IS NEVER PRINTED. It goes to a gitignored file and nowhere
 * else — not to stdout, not into a commit, not into a chat transcript. You copy
 * it from that file into Supabase yourself, then delete the file.
 *
 * Output shape matches what @negrel/webpush's importVapidKeys() expects:
 * { publicKey: <JWK>, privateKey: <JWK> }.
 *
 * Usage:  node scripts/gen-vapid-keys.mjs
 */
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';

const OUT = new URL('../.vapid-keys.local.json', import.meta.url);

if (existsSync(OUT)) {
  console.error('❌ .vapid-keys.local.json already exists.');
  console.error('   Refusing to overwrite — rotating VAPID keys invalidates EVERY');
  console.error('   existing push subscription. Delete it by hand if that is what you want.');
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const pubJwk = publicKey.export({ format: 'jwk' });
const privJwk = privateKey.export({ format: 'jwk' });

// The browser's applicationServerKey is NOT the JWK — it is the raw uncompressed
// EC point (0x04 ‖ X ‖ Y, 65 bytes) base64url-encoded. Deriving it here means
// nobody has to convert by hand later and get it subtly wrong.
const b64uToBuf = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const applicationServerKey = Buffer.concat([
  Buffer.from([0x04]),
  b64uToBuf(pubJwk.x),
  b64uToBuf(pubJwk.y),
]).toString('base64url');

writeFileSync(OUT, JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }, null, 2) + '\n', {
  mode: 0o600,
});

console.log('✅ Keypair written to .vapid-keys.local.json (gitignored, chmod 600)\n');
console.log('PUBLIC — safe to share, ships in the client bundle:');
console.log('VITE_VAPID_PUBLIC_KEY=' + applicationServerKey + '\n');
console.log('PRIVATE — never printed here. Open .vapid-keys.local.json and copy the');
console.log('WHOLE file contents into the VAPID_KEYS Supabase secret, then delete it.\n');
console.log('Sanity: applicationServerKey is ' + applicationServerKey.length + ' chars (expect 87).');
