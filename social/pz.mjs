// pz — the only way this project talks to Postiz. Same arguments as `postiz`.
//
//   social/pz upload reel.mp4
//   social/pz posts:create -c "$(cat cap.txt)" -m "$URL" -i <integration> -s 2026-09-24T10:00:00Z --settings '{…}'
//   social/pz posts:list --startDate … --endDate …
//
// What it adds (the .claude/hooks/postiz-guard.mjs hook refuses bare `postiz` so nothing skips this):
//   1. QUOTA. Postiz allows ~30 API calls an hour; going over locked us out for 30+ minutes on 09-21.
//      Every call is logged to state/postiz_calls.log; at 25 in the trailing hour pz WAITS for a slot
//      (PZ_NOWAIT=1 → exit 75 instead). A 429 is retried after 5 minutes, up to 3 times, never hammered.
//   2. UPLOAD MAP. `upload` records url ⇄ local file in state/uploads.tsv, so a later posts:create
//      can fingerprint the real files behind the URLs.
//   3. GATE. `posts:create` runs social/gate.mjs (Facebook, 10-slide IG limit, Kalshi/Stake, repeats,
//      double audio, empty caption) and refuses on any block. On success the media are recorded so the
//      same picture can never go to the same platform twice.
//   PZ_DRY=1 runs quota+gate checks for posts:create without calling Postiz.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, record, PLATFORMS } from './gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(HERE, 'state');
const CALLS = path.join(STATE, 'postiz_calls.log');
const UPLOADS = path.join(STATE, 'uploads.tsv');
const LIMIT = 25, HOUR = 3600e3;
fs.mkdirSync(STATE, { recursive: true });
const POSTIZ = (() => { try { return execSync('command -v postiz', { shell: '/bin/zsh' }).toString().trim(); } catch { return 'postiz'; } })();
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const args = process.argv.slice(2);
const sub = args[0] || '';

function recent() {
  const now = Date.now();
  const ts = (fs.existsSync(CALLS) ? fs.readFileSync(CALLS, 'utf8').split('\n') : []).map((l) => Number(l.split(' ')[0])).filter((t) => t && now - t < HOUR);
  return ts.sort((a, b) => a - b);
}
function waitForSlot() {
  for (;;) {
    const r = recent();
    if (r.length < LIMIT) return;
    const ms = r[0] + HOUR - Date.now() + 2000;
    if (process.env.PZ_NOWAIT === '1') { console.error(`pz: ${r.length} Postiz calls in the last hour (limit ${LIMIT}). Next slot in ${Math.ceil(ms / 60000)} min.`); process.exit(75); }
    console.error(`pz: quota ${r.length}/${LIMIT} per hour — waiting ${Math.ceil(ms / 60000)} min for a slot…`);
    sleep(Math.min(ms, 300e3));
  }
}
function call(a) {
  for (let attempt = 1; ; attempt++) {
    waitForSlot();
    fs.appendFileSync(CALLS, `${Date.now()} ${a.slice(0, 2).join(' ')}\n`);
    const r = spawnSync(POSTIZ, a, { encoding: 'utf8', maxBuffer: 64 << 20 });
    const out = (r.stdout || '') + (r.stderr || '');
    if (/429|Throttler/i.test(out) && attempt < 3) { console.error('pz: 429 from Postiz — waiting 5 min (not retrying faster; failed tries count too)'); sleep(300e3); continue; }
    return { code: r.status ?? 1, out };
  }
}
const loadMap = () => new Map((fs.existsSync(UPLOADS) ? fs.readFileSync(UPLOADS, 'utf8').split('\n') : []).filter(Boolean).map((l) => l.split('\t')));
const flag = (names) => { const out = []; for (let i = 1; i < args.length; i++) if (names.includes(args[i])) out.push(args[i + 1]); return out; };

if (sub === 'upload') {
  const file = path.resolve(args[1] || '');
  const { code, out } = call(args);
  process.stdout.write(out);
  const url = (out.match(/"path":\s*"([^"]+)"/) || [])[1];
  if (code === 0 && url) fs.appendFileSync(UPLOADS, `${url}\t${file}\n`);
  process.exit(code);
}

if (sub === 'posts:create') {
  if (args.includes('--json')) { console.error('pz: --json posts bypass the gate; build the post with -c/-m/-i flags instead.'); process.exit(2); }
  const ids = flag(['-i', '--integrations']).join(',').split(',').filter(Boolean);
  const caption = flag(['-c', '--content'])[0] || '';
  const settings = (() => { try { return JSON.parse(flag(['--settings'])[0] || '{}'); } catch { return {}; } })();
  const urls = flag(['-m', '--media']).slice(0, 1).join(',').split(',').filter(Boolean);   // main post's media
  const map = loadMap();
  const media = urls.map((u) => map.get(u)).filter(Boolean);
  const unmapped = urls.length - media.length;
  let blocked = false;
  const perPlatform = ids.map((id) => [id, PLATFORMS[id] || 'unknown']);
  for (const [, platform] of perPlatform) {
    const r = check({ platform, caption, settings, media, unmapped });
    r.warn.forEach((w) => console.error(`⚠️  [${platform}] ${w}`));
    r.block.forEach((b) => console.error(`⛔ [${platform}] ${b}`));
    if (r.block.length) blocked = true;
  }
  if (blocked) { console.error('pz: BLOCKED by the pre-publish gate — nothing was sent to Postiz.'); process.exit(2); }
  if (process.env.PZ_DRY === '1') { console.log('pz: gate PASS (dry run, nothing sent)'); process.exit(0); }
  const { code, out } = call(args);
  process.stdout.write(out);
  const postId = (out.match(/postId"?:\s*"([^"]+)"/) || [])[1];
  if (code === 0 && postId) for (const [, platform] of perPlatform) record({ platform, post: postId, media });
  process.exit(code);
}

const { code, out } = call(args);
process.stdout.write(out);
process.exit(code);
