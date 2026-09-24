// bsky — post to Bluesky directly through the AT Protocol, for what Postiz can't do.
//
//   node social/bsky.mjs post --text "line" [--image card.png --alt "what the image shows"] [--dry]
//   node social/bsky.mjs whoami
//
// Why: 2026-09-24 Postiz posted our Bluesky TEXT fine but every IMAGE post came back ERROR.
// Direct posting also lets us add alt text (a strong Bluesky norm) and costs no Postiz quota.
//
// Credentials: an app password Alex created ("Claude") lives ONLY in the macOS Keychain
// (account shithouseryhq, service shq-bsky-app-password). It is read at runtime, never printed,
// never written to disk. Identifier is the full handle.
//
// Guardrails: runs the same pre-publish gate as pz (repeats, betting brands, empty text) with
// platform 'bluesky', and records the image fingerprint on success so nothing posts twice.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HANDLE = 'shithouseryhq.bsky.social';
const PDS = 'https://bsky.social';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];

const secret = () => {
  try { return execFileSync('security', ['find-generic-password', '-a', 'shithouseryhq', '-s', 'shq-bsky-app-password', '-w']).toString().trim(); }
  catch { console.error('No Bluesky app password in the Keychain (service shq-bsky-app-password). Alex adds it with:\n  security add-generic-password -a shithouseryhq -s shq-bsky-app-password -w'); process.exit(2); }
};
const xrpc = async (method, body, jwt, headers = {}) => {
  const r = await fetch(`${PDS}/xrpc/${method}`, { method: 'POST', headers: { ...(jwt ? { authorization: `Bearer ${jwt}` } : {}), ...(Buffer.isBuffer(body) ? {} : { 'content-type': 'application/json' }), ...headers }, body: Buffer.isBuffer(body) ? body : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${r.status}: ${j.error || ''} ${j.message || ''}`);
  return j;
};
const session = () => xrpc('com.atproto.server.createSession', { identifier: HANDLE, password: secret() });

if (cmd === 'whoami') { const s = await session(); console.log(`ok: ${s.handle} (${s.did})`); process.exit(0); }
if (cmd !== 'post') { console.error('usage: bsky.mjs post --text "…" [--image f --alt "…"] [--dry] | whoami'); process.exit(1); }

const text = arg('text', '');
const image = arg('image');
if (!text.trim()) { console.error('empty text'); process.exit(1); }
if ([...text].length > 300) { console.error(`text is ${[...text].length} chars; Bluesky max is 300`); process.exit(1); }
if (image && !arg('alt')) { console.error('--alt is required with --image (Bluesky culture: always describe images)'); process.exit(1); }

const gate = await import('./gate.mjs');
const verdict = gate.check({ platform: 'bluesky', caption: text, media: image ? [image] : [] });
if (verdict.block.length) { console.error('BLOCKED by the gate:\n' + verdict.block.join('\n')); process.exit(3); }
if (process.argv.includes('--dry')) { console.log('dry run ok'); process.exit(0); }

const s = await session();
const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), langs: ['en'] };
if (image) {
  // Bluesky rejects blobs over ~1 MB: re-encode to JPEG and shrink until it fits.
  let file = image, q = 3, w = 1600;
  const tmp = path.join(HERE, '.bsky-upload.jpg');
  for (;;) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', image, '-vf', `scale='min(${w},iw)':-2`, '-q:v', String(q), tmp]);
    if (fs.statSync(tmp).size < 950_000 || w < 700) { file = tmp; break; }
    q += 2; w -= 200;
  }
  const dims = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim().split(',').map(Number);
  const up = await xrpc('com.atproto.repo.uploadBlob', fs.readFileSync(file), s.accessJwt, { 'content-type': 'image/jpeg' });
  record.embed = { $type: 'app.bsky.embed.images', images: [{ alt: arg('alt'), image: up.blob, aspectRatio: { width: dims[0], height: dims[1] } }] };
  fs.rmSync(tmp, { force: true });
}
const res = await xrpc('com.atproto.repo.createRecord', { repo: s.did, collection: 'app.bsky.feed.post', record }, s.accessJwt);
if (image) gate.record?.({ platform: 'bluesky', media: [image], post: res.uri });
console.log(`✅ posted ${res.uri}`);
