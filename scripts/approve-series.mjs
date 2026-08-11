// approve-series.mjs — turn eyeball-passed series picks into photo overrides.
// Gates per pick (belt + braces under the binding photo bar):
//   1. full-size downloads and is a real image (magic bytes)
//   2. facebox finds a face; LARGEST face >= 180px in source
//   3. faces === 1, OR the file is a dedicated "(cropped)"/named portrait
//      (background faces behind a named portrait are fine — Burn's case)
// Passers get override entries {file, licence, author, when, box}; failures
// are logged, never written. The human already saw every thumb; these gates
// exist to catch what thumbs hide (the Janelt wrong-face case).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const picks = JSON.parse(readFileSync('/tmp/series-picks.json', 'utf8'));
const REJECT_NAMES = new Set(['Aníbal Godoy', 'Dodi Lukebakio', 'Tim Ream', 'Mohamed Salah', 'Ricardo Pereira', 'Mateus Fernandes', 'Haissem Hassan', 'Mohamed Hany', 'Ismael Saibari', 'Ayyoub Bouaddi']);
mkdirSync('/tmp/series-full', { recursive: true });
const cdn = (f) => { const u = f.replace(/ /g, '_'); const h = createHash('md5').update(u).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(u)}`; };

const approved = {}; const dropped = [];
let done = 0;
for (const r of picks) {
  done++;
  if (!r.pick) continue;
  if (REJECT_NAMES.has(r.name)) { dropped.push([r.name, 'eyeball reject']); continue; }
  const c = r.pick;
  const fp = `/tmp/series-full/${r.qid}`;
  try {
    if (!existsSync(fp)) {
      const resp = await fetch(cdn(c.file), { headers: { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; series approve)' }, signal: AbortSignal.timeout(90000) });
      if (resp.status === 429) { await new Promise((s) => setTimeout(s, 30000)); throw new Error('429'); }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = Buffer.from(await resp.arrayBuffer());
      if (!((buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50))) throw new Error('not image');
      writeFileSync(fp, buf);
      await new Promise((s) => setTimeout(s, 2200));
    }
    const fb = JSON.parse(execFileSync('/tmp/facebox', [fp], { encoding: 'utf8', timeout: 30000 }));
    if (!fb.ok || !fb.faces) { dropped.push([r.name, 'no face']); continue; }
    const facePx = fb.w * c.w;
    if (facePx < 180) { dropped.push([r.name, `face ${Math.round(facePx)}px`]); continue; }
    if (fb.faces !== 1 && !/\(cropped/.test(c.file) && !c.file.startsWith(r.name)) { dropped.push([r.name, `faces=${fb.faces} on non-dedicated file`]); continue; }
    approved[r.qid] = { file: c.file, licence: c.lic, author: c.author, when: c.when,
      why: 'series harvest 2026-08-11 (eyeball-passed)',
      box: { x: +fb.x.toFixed(4), y: +fb.y.toFixed(4), w: +fb.w.toFixed(4), h: +fb.h.toFixed(4) } };
  } catch (e) { dropped.push([r.name, e.message.slice(0, 40)]); }
  if (done % 10 === 0) {
    writeFileSync('/tmp/series-approved.json', JSON.stringify(approved));
    process.stdout.write(`${done}/${picks.length} · approved ${Object.keys(approved).length} · dropped ${dropped.length}\r`);
  }
}
writeFileSync('/tmp/series-approved.json', JSON.stringify(approved, null, 1));
writeFileSync('/tmp/series-dropped.json', JSON.stringify(dropped, null, 1));
console.log(`\napproved ${Object.keys(approved).length} · dropped ${dropped.length}`);
for (const [n, why] of dropped.slice(0, 15)) console.log('  drop:', n, '—', why);
