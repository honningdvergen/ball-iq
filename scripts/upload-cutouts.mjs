// upload-cutouts.mjs — push every cutout PNG to the player-cutouts bucket.
//
//   node scripts/upload-cutouts.mjs        # resumable; run during an open
//                                          # INSERT policy window ONLY
//
// Uses the PUBLIC anon key (it ships in the client bundle by design); writes
// are possible only while the temporary "cutout-upload-window" policy exists,
// and that policy is dropped immediately after this completes. Skips files the
// bucket already has (HEAD via public URL), so re-runs only send what's new.
import { readFileSync, readdirSync } from 'fs';

// Read ONLY the anon key's line — the service-role key lives in the same file
// and must never be loaded, logged, or sent anywhere by tooling.
const KEY = (readFileSync('.env.local','utf8').split('\n')
  .find(l => l.startsWith('VITE_SUPABASE_KEY=')) || '').slice('VITE_SUPABASE_KEY='.length).trim();
const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
if (!URL_ || !KEY) { console.error('missing supabase env'); process.exit(1); }

const DIR = 'public/lineup/cutouts';
const files = readdirSync(DIR).filter(f => f.endsWith('.png'));
console.log(`${files.length} cutouts to sync`);
let up = 0, skip = 0, fail = 0, done = 0;
for (const f of files) {
  done++;
  const pub = `${URL_}/storage/v1/object/public/player-cutouts/${f}`;
  try {
    const head = await fetch(pub, { method: 'HEAD' });
    if (head.ok) { skip++; continue; }
    const body = readFileSync(`${DIR}/${f}`);
    const r = await fetch(`${URL_}/storage/v1/object/player-cutouts/${f}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'image/png', 'x-upsert': 'false' },
      body,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0,80)}`);
    up++;
  } catch (e) { fail++; if (fail <= 3) console.error(`  ! ${f}: ${e.message}`); }
  if (done % 25 === 0) process.stdout.write(`${done}/${files.length} · up ${up} · skip ${skip} · fail ${fail}\r`);
}
console.log(`\nuploaded ${up} · already present ${skip} · failed ${fail}`);
process.exit(fail > 20 ? 1 : 0);
