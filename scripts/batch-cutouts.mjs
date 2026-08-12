// batch-cutouts.mjs — FotMob-style cutouts for every squad player with a photo.
//
//   node scripts/batch-cutouts.mjs            # squad players (q=1), resumable
//
// Downloads each player's ORIGINAL photo via the md5-prefixed
// upload.wikimedia.org CDN path (the API/Special:FilePath route 429s while the
// repick pipeline runs; the CDN cluster does not), runs /tmp/facecut, and
// keeps only clean results. The manifest is the page's source of truth —
// a player absent from it renders the photo-crop or initials card as before.
//
// ⚠️ AUTO-REJECT IS A FLOOR, NOT THE BAR. Alex's rule: one bad image kills the
// product. Survivors here still go through a contact-sheet EYEBALL pass before
// anything ships beyond the local test server — Mbeumo's cutout passed every
// mechanical check and still failed eyes (the mask swallowed a foreground
// blur band). faces!=1 → reject; crop < 320px source → reject (upscale mush);
// tool error → reject. Everything is logged so rejects are queryable.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const LINEUP = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const OUTDIR = 'public/lineup/cutouts';
const CACHE = '/tmp/cutout-orig';
const LOG = '/tmp/cutouts-batch.log';
const MANIFEST = OUTDIR + '/manifest.json';
// ⚠️ 320 WAS TOO STRICT AND BINNED GOOD WORK. 1,558 of 1,683 rejects failed on
// this number alone — cuts that succeeded (one face, one instance, clean mask)
// and were thrown away for being under an eyeballed floor. Robert Lewandowski
// was rejected at 262px; the output is sharp, well framed and renders at 512px.
//
// Re-checked by eye at three sizes before moving it:
//   262px (Lewandowski) — excellent, indistinguishable from the keepers
//   163px (Lloris)      — technically clean, but the SOURCE is a much younger
//                         Lloris in a fleece rather than kit
// That second one is the real lesson: this floor was doubling as a proxy for
// photo AGE, because small crops come from old low-resolution photos. Lowering
// it recovers the good middle band and lets a few stale photos through, which
// is why the eyeball pass below is not optional.
const MIN_CROP_PX = 240;
mkdirSync(OUTDIR, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const manifest = new Set(existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : []);
const rejects = {};
// Rejects re-run on resume — their originals are cached in /tmp so a retry
// costs a facecut call, and a better repick photo can flip a reject to a keep.
// ⚠️ WAS q===1 (squad players only), which capped the job at ~1,200 of 6,431.
// The bar is now every player: "quality standardized photos for each player".
// ⚠️ DO NOT SORT. lineup.json is ALREADY emitted in fame order by
// build-lineup-data.mjs (index 0 is Messi, then Ronaldo, Neymar, Mbappé), so
// plain array order is exactly the priority we want. A first attempt here
// sorted by (q, v, b) on the assumption that v was fame — it is not, and b
// descending just favours the youngest, so the queue opened with Adjani
// Mujangi Bia and Diego Aguado instead of Messi. A run this long WILL be
// interrupted and the manifest is resumable, so the order decides what exists
// when it stops: getting it wrong means an interrupted run leaves the famous
// names as initials.
const targets = LINEUP.players.filter((p) => p.f && !manifest.has(p.i));

console.log(`${targets.length} players to cut (${manifest.size} already done)`);

function cdnUrl(file) {
  const f = file.replace(/ /g, '_');
  const h = createHash('md5').update(f).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(f)}`;
}

let done = 0, kept = 0, rej = 0, dlFail = 0;
for (const p of targets) {
  done++;
  const orig = `${CACHE}/${p.i}`;
  try {
    if (!existsSync(orig)) {
      const r = await fetch(cdnUrl(p.f), {
        headers: { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; cutout batch)' },
        signal: AbortSignal.timeout(60000),
      });
      if (r.status === 429) {
        // Shared rate budget with the repick pipeline — back off hard rather
        // than burning the whole queue as retryable failures.
        await new Promise((s2) => setTimeout(s2, 45000));
        throw new Error('HTTP 429');
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      // Magic bytes — a 429/error page cached as an image poisons the cutter.
      const ok = (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50);
      if (!ok) throw new Error('not an image');
      writeFileSync(orig, buf);
      await new Promise((s) => setTimeout(s, 2200));
    }
    const out = execFileSync('/tmp/facecut', [orig, `${OUTDIR}/${p.i}.png`, '640'],
      { encoding: 'utf8', timeout: 120000 }).trim();
    const faces = +(out.match(/faces in cutout: (\d+)/)?.[1] ?? 99);
    const crop = +(out.match(/ok (\d+)px crop/)?.[1] ?? 0);
    if (faces === 1 && crop >= MIN_CROP_PX) {
      manifest.add(p.i); kept++;
    } else {
      rejects[p.i] = { name: p.n, why: faces !== 1 ? `faces=${faces}` : `crop=${crop}px`, out };
      rej++;
      execFileSync('rm', ['-f', `${OUTDIR}/${p.i}.png`]);
    }
  } catch (e) {
    rejects[p.i] = { name: p.n, why: e.message.slice(0, 80) };
    dlFail++;
  }
  if (done % 10 === 0) {
    writeFileSync(MANIFEST, JSON.stringify([...manifest]));
    appendFileSync(LOG, `${done}/${targets.length} kept ${kept} rej ${rej} dlfail ${dlFail}\n`);
    process.stdout.write(`${done}/${targets.length} · kept ${kept} · rejected ${rej} · dl-fail ${dlFail}\r`);
  }
}
writeFileSync(MANIFEST, JSON.stringify([...manifest]));
writeFileSync('/tmp/cutouts-rejects.json', JSON.stringify(rejects, null, 1));
console.log(`\nmanifest: ${manifest.size} cutouts · rejected ${rej} · download failures ${dlFail}`);
console.log('rejects detail: /tmp/cutouts-rejects.json — every one becomes a photo-crop/initials card, never a bad cutout');
