#!/usr/bin/env node
/**
 * asc.mjs — READ App Store Connect for Ball IQ with our own API key.
 *
 * ⚠️ READ-ONLY BY DESIGN. This script only ever sends GET. Uploading a build
 * (xcodebuild -exportArchive) and submitting for review are separate, manual
 * steps that need Alex's go-ahead for that specific build; nothing here can do
 * either by accident.
 *
 * WHY. Until 2026-10-07 every question about the store ("did the build finish
 * processing?", "what state is 1.7.6 in?", "how many ratings?") meant Alex
 * opening App Store Connect and reading it out. He created two team keys that
 * day; their ids (not secret) and file paths live in ~/.config/balliq/asc.json,
 * the .p8 files in ~/.appstoreconnect/private_keys (mode 600, never printed).
 * This uses the App Manager key ("release"); the Admin key is only for signing
 * an upload.
 *
 * Usage:
 *   node scripts/asc.mjs builds [--limit 5]     newest builds and their processing state
 *   node scripts/asc.mjs versions               App Store versions and their review state
 *   node scripts/asc.mjs reviews [--limit 10]   newest customer reviews
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';

const BUNDLE_ID = 'app.balliq';
const tilde = (p) => p.replace(/^~/, homedir());
let cfg;
try {
  cfg = JSON.parse(readFileSync(tilde('~/.config/balliq/asc.json'), 'utf8'));
} catch {
  console.error('No ~/.config/balliq/asc.json. It holds the issuer id, key ids and key paths (ids are not secret).');
  process.exit(3);
}
const key = cfg.keys.release || cfg.keys.admin;
const pem = readFileSync(tilde(key.keyPath), 'utf8');

const b64u = (s) => Buffer.from(s).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: key.keyId, typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: cfg.issuerId, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' }));
  // Apple wants the raw r||s signature, not DER.
  const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key: pem, dsaEncoding: 'ieee-p1363' }, 'base64url');
  return `${head}.${body}.${sig}`;
}
const auth = { authorization: `Bearer ${token()}` };
async function get(path) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${path}`, { headers: auth });
  const j = await r.json();
  if (!r.ok) { console.error(`App Store Connect ${r.status}: ${j.errors?.[0]?.detail || JSON.stringify(j).slice(0, 300)}`); process.exit(1); }
  return j;
}

const args = process.argv.slice(2);
const mode = args[0] || 'builds';
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };

const apps = await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=name,bundleId`);
const app = apps.data[0];
if (!app) { console.error(`No app with bundle id ${BUNDLE_ID} visible to this key.`); process.exit(1); }

if (mode === 'builds') {
  const j = await get(`/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=${opt('limit', 5)}&fields[builds]=version,uploadedDate,processingState,expired&include=preReleaseVersion&fields[preReleaseVersions]=version`);
  const pre = new Map((j.included || []).map((x) => [x.id, x.attributes.version]));
  console.log(`${app.attributes.name} · newest builds`);
  for (const b of j.data) {
    const v = pre.get(b.relationships?.preReleaseVersion?.data?.id) || '?';
    console.log(`  ${v} (${b.attributes.version})  ${b.attributes.processingState.padEnd(10)}  uploaded ${b.attributes.uploadedDate}${b.attributes.expired ? '  expired' : ''}`);
  }
} else if (mode === 'versions') {
  const j = await get(`/v1/apps/${app.id}/appStoreVersions?limit=6&fields[appStoreVersions]=versionString,appStoreState,platform,createdDate,releaseType`);
  console.log(`${app.attributes.name} · App Store versions`);
  for (const v of j.data) console.log(`  ${v.attributes.versionString.padEnd(7)} ${v.attributes.platform.padEnd(5)} ${String(v.attributes.appStoreState).padEnd(28)} release: ${v.attributes.releaseType || '-'}`);
} else if (mode === 'reviews') {
  const j = await get(`/v1/apps/${app.id}/customerReviews?sort=-createdDate&limit=${opt('limit', 10)}&fields[customerReviews]=rating,title,body,territory,createdDate`);
  console.log(`${app.attributes.name} · newest reviews`);
  for (const r of j.data) console.log(`  ${'★'.repeat(r.attributes.rating)} ${r.attributes.territory} ${r.attributes.createdDate.slice(0, 10)} · ${r.attributes.title}: ${String(r.attributes.body).replace(/\s+/g, ' ').slice(0, 160)}`);
} else {
  console.error('Use: builds | versions | reviews');
  process.exit(2);
}
