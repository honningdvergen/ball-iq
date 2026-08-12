// reconcile-cutouts.mjs — re-cut every player whose PHOTO CHANGED after their
// cutout was made.
//
//   node scripts/reconcile-cutouts.mjs        # run only when no batch is running
//
// WHY. batch-cutouts caches originals under /tmp/cutout-orig/<qid> and keys the
// manifest by qid, not by source file. The repick pipeline then upgraded 824
// players' photos — so a manifest entry can be a perfectly clean cutout OF THE
// OLD, WORSE PHOTO, and a resumed batch would "skip (done)" right past the
// upgrade. This pass records which FILE each cutout came from, invalidates
// mismatches, and re-cuts from the current photo.
//
// ⚠️ NEVER run concurrently with batch-cutouts.mjs — both rewrite manifest.json
// from an in-memory copy; the later writer silently clobbers the earlier one.
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const LINEUP = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const OUTDIR = 'public/lineup/cutouts';
const MANIFEST = OUTDIR + '/manifest.json';
const SOURCES = OUTDIR + '/sources.json';   // qid -> file the cutout was made from
const CACHE = '/tmp/cutout-orig';
const MIN_CROP_PX = 320;

const byId = new Map(LINEUP.players.map((p) => [p.i, p]));
const manifest = new Set(JSON.parse(readFileSync(MANIFEST, 'utf8')));
let sources = existsSync(SOURCES) ? JSON.parse(readFileSync(SOURCES, 'utf8')) : {};

// First run has no sources ledger: seed it by TRUSTING nothing — every manifest
// entry whose player has a repick (the only way a photo changes mid-day) is
// treated as suspect and re-cut from the current file.
const suspects = [...manifest].filter((id) => {
  const p = byId.get(id);
  if (!p || !p.f) return true;               // photo now null/override → cutout must go
  if (sources[id]) return sources[id] !== p.f;
  return true;                               // unknown provenance → re-cut to be sure
});
console.log(`${manifest.size} cutouts · ${suspects.length} need reconciling`);

function cdnUrl(file) {
  const f = file.replace(/ /g, '_');
  const h = createHash('md5').update(f).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(f)}`;
}

let recut = 0, dropped = 0, kept = 0, fail = 0;
for (const id of suspects) {
  const p = byId.get(id);
  if (!p || !p.f) {
    manifest.delete(id); delete sources[id];
    rmSync(`${OUTDIR}/${id}.png`, { force: true });
    dropped++; continue;
  }
  try {
    const orig = `${CACHE}/${id}.reconcile`;
    const r = await fetch(cdnUrl(p.f), {
      headers: { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; cutout reconcile)' },
      signal: AbortSignal.timeout(60000),
    });
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 45000)); throw new Error('429'); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const okImg = (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50);
    if (!okImg) throw new Error('not an image');
    writeFileSync(orig, buf);
    const out = execFileSync('/tmp/facecut', [orig, `${OUTDIR}/${id}.png`, '640'],
      { encoding: 'utf8', timeout: 120000 }).trim();
    const faces = +(out.match(/faces in cutout: (\d+)/)?.[1] ?? 99);
    const crop = +(out.match(/ok (\d+)px crop/)?.[1] ?? 0);
    if (faces === 1 && crop >= MIN_CROP_PX) { sources[id] = p.f; recut++; }
    else {
      // New photo cuts worse than the floor → no cutout at all; the page falls
      // back to the (better) photo-crop rather than shipping mush.
      manifest.delete(id); delete sources[id];
      rmSync(`${OUTDIR}/${id}.png`, { force: true });
      dropped++;
    }
    rmSync(orig, { force: true });
    await new Promise((s) => setTimeout(s, 2200));
  } catch (e) {
    // Unreachable right now — keep the OLD cutout (clean, just of an older
    // photo) rather than deleting; rerun reconciles it later.
    fail++;
  }
  if ((recut + dropped + fail) % 10 === 0) {
    writeFileSync(MANIFEST, JSON.stringify([...manifest]));
    writeFileSync(SOURCES, JSON.stringify(sources));
    process.stdout.write(`${recut + dropped + fail}/${suspects.length} · recut ${recut} · dropped ${dropped} · fail ${fail}\r`);
  }
}
kept = manifest.size;
writeFileSync(MANIFEST, JSON.stringify([...manifest]));
writeFileSync(SOURCES, JSON.stringify(sources));
console.log(`\nmanifest now ${kept} · recut ${recut} · dropped ${dropped} · unreachable (old kept) ${fail}`);
