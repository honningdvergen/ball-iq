// build-player-faces.mjs — a standardised head-shot crop for every player photo.
//
//   swiftc -O -o /tmp/facebox scripts/facebox/main.swift
//   node scripts/build-player-faces.mjs
//
// Commons portraits are framed arbitrarily: tight head shots, half-body match
// photos, and players at the far end of a pitch all sit in the same set. A
// lineup builder needs them to read as one deck of cards.
//
// ⚠️ THE OUTPUT IS A CROP RECTANGLE, NOT AN IMAGE. Cropping to disk would mean
// self-hosting thousands of derivative files — bundle weight on a native app
// that already ships everything in dist/, plus a derivative of a CC BY-SA work
// carrying its own attribution chain. Six numbers per player re-frame for free,
// and the browser does the crop with object-fit + object-position.
//
// ⚠️ AND IT RECORDS THE SOURCE WIDTH TO REQUEST. Measured on the first sample:
// face widths range from 46% of the frame (David Raya, a portrait) down to
// 7.7% (Cristhian Mosquera, shot from distance). Cropping both from the same
// 320px thumbnail gives one sharp card and one smear. Since the zoom factor is
// known once the face box is known, so is the source width needed to land a
// sharp card — so it is computed here rather than left to the renderer to
// discover at display time.
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';

const PHOTOS = JSON.parse(readFileSync('src/data/mysteryPhotos.json', 'utf8'));
const P18 = JSON.parse(readFileSync('scripts/_mystery-p18.json', 'utf8'));
const OUT = 'src/data/playerFaces.json';
const TMP = '/tmp/facebox-work';
const UA = 'BallIQ/1.0 (https://balliq.app; portrait framing)';

if (!existsSync('/tmp/facebox')) {
  console.error('build the detector first:\n  swiftc -O -o /tmp/facebox scripts/facebox/main.swift');
  process.exit(1);
}

// The card is a square showing head and shoulders. TARGET_FACE is the fraction
// of that square the FACE ITSELF should occupy — 0.42 leaves room for hair,
// chin and a little shoulder without the crop feeling like a passport photo.
const TARGET_FACE = 0.42;
const CARD_PX = 320;               // rendered card size the source must satisfy

const faces = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const todo = Object.keys(PHOTOS).filter((id) => PHOTOS[id] && P18[id] && !(id in faces));
console.log(`${Object.keys(faces).length} already done · ${todo.length} to detect`);

mkdirSync(TMP, { recursive: true });
const BATCH = 60;
let ok = 0, none = 0, failed = 0, tiny = 0, throttled = 0;

for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  const paths = new Map();

  for (const id of batch) {
    // 600px is enough for Vision to find a face even in a wide match shot,
    // while staying small enough to fetch 3,700 of them politely.
    const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
      + encodeURIComponent(P18[id]) + '?width=600';
    let saved = false;
    for (let a = 1; a <= 4 && !saved; a++) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
        // ⚠️ 429 IS THE COMMON CASE, NOT AN EDGE CASE. Commons rate-limits a
        // few-thousand-image sweep and answers with a 2,167-byte HTML page.
        // Fetched blind, that lands on the detector as "unreadable" and got
        // filed as "this player has no face" — permanently, because the null
        // was cached. The detection rate visibly sagged from 62% to 51% as the
        // throttling bit, and it read like a property of the photos.
        if (r.status === 429) { await new Promise((s) => setTimeout(s, 15000 * a)); throttled++; continue; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        // ⚠️ VERIFY IT IS AN IMAGE, don't trust the status. Magic bytes are the
        // only honest test: JPEG starts FF D8, PNG 89 50 4E 47.
        const jpg = buf[0] === 0xFF && buf[1] === 0xD8;
        const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
        if (!jpg && !png) throw new Error('not an image (' + buf.length + ' bytes)');
        const p = `${TMP}/${id}.jpg`;
        writeFileSync(p, buf);
        paths.set(p, id);
        saved = true;
      } catch (e) {
        if (a === 4) {
          // ⚠️ DO NOT RECORD ANYTHING. A transient failure that gets written as
          // a result is a result nobody ever re-checks. Leaving the key absent
          // means the next run retries it; that is the whole difference between
          // a gap and a wrong answer.
          failed++;
        } else {
          await new Promise((s) => setTimeout(s, 5000 * a));
        }
      }
    }
    await new Promise((s) => setTimeout(s, 500));   // polite, and 429s below this
  }

  if (paths.size) {
    let out = '';
    try {
      out = execFileSync('/tmp/facebox', [...paths.keys()], { encoding: 'utf8', maxBuffer: 64 << 20 });
    } catch (e) {
      console.error(`  ! detector failed on batch ${i}: ${e.message}`);
    }
    for (const line of out.split('\n').filter(Boolean)) {
      let r; try { r = JSON.parse(line); } catch { continue; }
      const id = paths.get(r.file);
      if (!id) continue;
      if (!r.ok) { if (r.err === 'unreadable') { failed++; continue; } faces[id] = false; none++; continue; }

      // Expand the face box to a square head-and-shoulders frame, then clamp it
      // inside the image. Clamping matters: a face near an edge would otherwise
      // produce a crop rectangle partly outside the picture, which renders as a
      // band of empty space rather than an error.
      const side = Math.min(1, r.w / TARGET_FACE);
      const cx = r.x + r.w / 2;
      // Sit the face slightly above centre — eyes near the upper third is what
      // makes a crop read as a portrait rather than a mugshot.
      const cy = r.y + r.h * 0.42;
      const x = Math.max(0, Math.min(1 - side, cx - side / 2));
      const y = Math.max(0, Math.min(1 - side, cy - side / 2));
      const srcW = Math.min(2400, Math.ceil(CARD_PX / side / 50) * 50);
      if (r.w < 0.12) tiny++;
      faces[id] = { x: +x.toFixed(4), y: +y.toFixed(4), s: +side.toFixed(4),
        conf: +r.conf.toFixed(2), faces: r.faces, srcW };
      ok++;
    }
  }
  // Anything still unaccounted for was NOT reached this run. Leave the key
  // absent so the next run retries it, rather than recording a verdict.

  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  writeFileSync(OUT, JSON.stringify(faces));
  process.stdout.write(`  ${Math.min(i + BATCH, todo.length)}/${todo.length} · ok ${ok} · no face ${none} · fetch failed ${failed}\r`);
}
rmSync(TMP, { recursive: true, force: true });
console.log('');

const got = Object.values(faces).filter(Boolean);
console.log(`\nFACE BOXES: ${got.length} / ${Object.keys(faces).length}`);
console.log(`  no face found: ${none} (recorded, will not be retried)`);
console.log(`  could not fetch: ${failed} (NOT recorded — next run retries them)`);
console.log(`  rate-limited responses backed off: ${throttled}`);
console.log(`  shot from distance (face < 12% of frame): ${tiny} — these need a bigger source`);
const multi = got.filter((f) => f.faces > 1).length;
console.log(`  more than one face in shot: ${multi} (largest was taken)`);
const lowConf = got.filter((f) => f.conf < 0.5).length;
console.log(`  low confidence (<0.50): ${lowConf} — worth eyeballing`);
const widths = {};
for (const f of got) { const k = f.srcW >= 1200 ? '1200+' : f.srcW >= 800 ? '800-1150' : '<800'; widths[k] = (widths[k] || 0) + 1; }
console.log(`  source width needed: ${JSON.stringify(widths)}`);
