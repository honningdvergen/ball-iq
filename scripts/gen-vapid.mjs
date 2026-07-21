// gen-vapid.mjs — one-time generator for the Web Push (1.4.0 Phase 2) VAPID keys.
//
//   node scripts/gen-vapid.mjs
//
// Prints two things:
//   1. VAPID_KEYS  — the JSON to set as a Supabase Edge-Function secret. It is
//      the { publicKey, privateKey } JWK pair that jsr:@negrel/webpush's
//      importVapidKeys() consumes in the send-web-push function.
//   2. VITE_VAPID_PUBLIC_KEY — the base64url applicationServerKey the browser
//      passes to pushManager.subscribe(). PUBLIC and safe to commit; paste it
//      to Claude to embed in the client + service worker.
//
// The PRIVATE key never leaves your machine except into the Supabase secret —
// keep it out of git and out of chat. Rotate any time by re-running this and
// re-setting the secret (subscribers just re-subscribe on the new key).
//
// Setup steps after running:
//   • Supabase → Project → Edge Functions → Secrets (or Project Settings →
//     Edge Functions): add VAPID_KEYS = <the JSON below> and
//     VAPID_SUBJECT = mailto:support@balliq.app
//   • Send Claude the VITE_VAPID_PUBLIC_KEY line.

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const { subtle } = globalThis.crypto;

const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const publicKey = await subtle.exportKey('jwk', kp.publicKey);
const privateKey = await subtle.exportKey('jwk', kp.privateKey);
const x = Buffer.from(publicKey.x.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const y = Buffer.from(publicKey.y.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const appServerKey = b64url(Buffer.concat([Buffer.from([4]), x, y]));

console.log('\n=== 1. Supabase secret — set BOTH of these ===\n');
console.log('VAPID_KEYS=' + JSON.stringify({ publicKey, privateKey }));
console.log('VAPID_SUBJECT=mailto:support@balliq.app');
console.log('\n=== 2. Send this line to Claude (public, safe) ===\n');
console.log('VITE_VAPID_PUBLIC_KEY=' + appServerKey);
console.log('');
