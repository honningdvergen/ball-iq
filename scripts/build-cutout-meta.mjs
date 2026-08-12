// build-cutout-meta.mjs — face box per finished cutout, so the page can render
// every cutout through the SAME face-anchored crop model as photos. Fixes the
// head-size lottery (Mainoo tiny next to Bruno) caused by facecut's crop clamp
// letting the face share balloon on tight sources. Local + fast: no network.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

// ⚠️ FAIL FAST IF THE TOOL IS MISSING. /tmp/facebox is a build artifact and
// /tmp gets cleared — on 2026-08-12 it was gone, every lookup threw, every
// entry was written as null, and 974 GOOD FACE BOXES WERE DESTROYED in one
// run. The page then falls back to cover-fit, which is exactly the
// "head-size lottery" this file exists to prevent, and nothing failed loudly.
// Rebuild with: swiftc -O scripts/facebox/main.swift -o /tmp/facebox
import { existsSync } from 'fs';
if (!existsSync('/tmp/facebox')) {
  console.error('✗ /tmp/facebox is missing. Rebuild it before running:');
  console.error('    swiftc -O scripts/facebox/main.swift -o /tmp/facebox');
  console.error('  Refusing to run — a pass without it silently nulls every face box.');
  process.exit(1);
}

const DIR = 'public/lineup/cutouts';
const ids = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
const meta = {};
let ok = 0, noface = 0;
for (const id of ids) {
  try {
    const out = JSON.parse(execFileSync('/tmp/facebox', [`${DIR}/${id}.png`], { encoding: 'utf8', timeout: 30000 }));
    if (out.ok && out.faces >= 1) { meta[id] = { x: +out.x.toFixed(4), y: +out.y.toFixed(4), w: +out.w.toFixed(4), h: +out.h.toFixed(4), n: out.faces }; ok++; }
    else { meta[id] = null; noface++; }
  } catch { meta[id] = null; noface++; }
  if ((ok + noface) % 100 === 0) process.stdout.write(`${ok + noface}/${ids.length}\r`);
}
writeFileSync(`${DIR}/meta.json`, JSON.stringify(meta));
console.log(`\nmeta for ${ok} cutouts · ${noface} without a detectable face (kept null — page falls back to cover-fit)`);
const multi = Object.entries(meta).filter(([,m]) => m && m.n > 1);
console.log(`⚠️ cutouts with >1 face (stowaway check): ${multi.length}`);
if (multi.length) console.log(multi.map(([q]) => q).join(' '));
