// club-coverage.mjs — how close is one club to a complete lineup builder?
//
//   node scripts/club-coverage.mjs "Manchester United"
//   node scripts/club-coverage.mjs "Manchester United" --squad   # current squad only
//   node scripts/club-coverage.mjs --top 12                      # the marquee clubs
//
// ⚠️ COVERAGE IS FOUR GATES, NOT ONE, AND ONLY THE LAST ONE IS WHAT ALEX SEES.
// A player shows a face on the pitch only if ALL of these hold:
//   1. the pool has a photo file for him            (p.f)
//   2. he is not overridden to null                 (the excellent-or-initials bar)
//   3. a cutout has been CUT from that photo        (manifest.json)
//   4. that cutout has been UPLOADED                (the Supabase bucket)
// Gates 3 and 4 were assumed to be the same number for weeks. They were not:
// on 2026-08-12 the manifest listed 4,340 and the bucket held 975. Anything
// that reports "coverage" from the manifest alone is measuring our intentions,
// so this probes the bucket over the network and reports what a visitor gets.
import { readFileSync } from 'fs';

const BUCKET = 'https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/public/player-cutouts/';
const args = process.argv.slice(2);
const squadOnly = args.includes('--squad');
const topN = args.includes('--top') ? +args[args.indexOf('--top') + 1] : 0;
const club = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));

const pool = JSON.parse(readFileSync('public/data/lineup.json', 'utf8')).players;
const manifest = new Set(JSON.parse(readFileSync('public/lineup/cutouts/manifest.json', 'utf8')));
const overrides = JSON.parse(readFileSync('src/data/photoOverrides.json', 'utf8'));

// ⚠️ THE POOL IS EVERY PLAYER WHO EVER WORE THE SHIRT, not the current squad.
// Man Utd returns 73 rows including academy players who left a decade ago
// (James Weir, Josh Harrop). "Full coverage" of all 73 is a different and far
// larger job than a builder that can field the XI a fan actually wants.
//
// ⚠️ AND FAME ORDER IS NOT THE SQUAD — this read "top 30 by fame" first, which
// returned Anderson and Macheda while MISSING Shaw, Mbeumo, Heaven and Yoro:
// the four Alex had just built an XI with. A proxy that omits the players in
// the screenshot cannot answer "does Man Utd have full coverage". squads.json
// carries the real current squad (Man Utd: 27) and is the honest target.
const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));

async function present(ids) {
  const hits = new Set();
  let i = 0;
  async function worker() {
    while (i < ids.length) {
      const id = ids[i++];
      try { const r = await fetch(BUCKET + id + '.png', { method: 'HEAD' }); if (r.ok) hits.add(id); } catch { /* counts as absent */ }
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker));
  return hits;
}

async function report(name) {
  const all = pool.filter((p) => (p.c || '').includes(name));
  const key = Object.keys(SQUADS).find((k) => k.includes(name) || name.includes(k));
  // Squad rows carry their own ids, so resolve through the pool by id and fall
  // back to the pool row only for the name/photo fields.
  const byId = new Map(pool.map((p) => [p.i, p]));
  const squad = squadOnly && key
    ? SQUADS[key].map((r) => byId.get(r.id) || { i: r.id, n: r.name, f: null, c: key })
    : all;
  if (!squad.length) { console.log(`no players found for "${name}"`); return null; }

  const live = await present(squad.filter((p) => manifest.has(p.i)).map((p) => p.i));
  const rows = squad.map((p) => ({
    n: p.n,
    photo: !!p.f,
    nulled: overrides[p.i] === null,
    cut: manifest.has(p.i),
    live: live.has(p.i),
  }));

  const shown = rows.filter((r) => r.live).length;
  const pct = (100 * shown / rows.length).toFixed(1);
  const bar = '█'.repeat(Math.round(shown / rows.length * 28)).padEnd(28, '·');
  console.log(`\n${name}${squadOnly ? ' — CURRENT SQUAD' : ' — all-time pool'} — ${rows.length} players`);
  console.log(`  ${bar}  ${shown}/${rows.length} showing a face  (${pct}%)`);
  console.log(`  photo in pool ${rows.filter((r) => r.photo).length}  ·  cutout cut ${rows.filter((r) => r.cut).length}  ·  cutout LIVE ${shown}`);

  const gaps = rows.filter((r) => !r.live);
  if (gaps.length) {
    console.log(`  missing (${gaps.length}):`);
    for (const g of gaps.slice(0, 20)) {
      const why = g.nulled ? 'rejected by the quality bar — needs a better source'
        : !g.photo ? 'no photo in the pool — needs a harvest'
          : !g.cut ? 'photo exists, never cut'
            : 'CUT BUT NOT UPLOADED';
      console.log(`     ${g.n.padEnd(24)} ${why}`);
    }
    if (gaps.length > 20) console.log(`     …and ${gaps.length - 20} more`);
  } else {
    console.log('  ✅ FULL COVERAGE — every player in this set draws a real face.');
  }
  return { name, shown, total: rows.length };
}

const MARQUEE = ['Manchester United', 'Manchester City', 'Liverpool', 'Arsenal', 'Chelsea',
  'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern', 'Paris Saint-Germain', 'Juventus', 'Milan'];

if (topN) {
  const out = [];
  for (const c of MARQUEE.slice(0, topN)) { const r = await report(c); if (r) out.push(r); }
  console.log('\n── summary ──');
  for (const r of out.sort((a, b) => b.shown / b.total - a.shown / a.total)) {
    console.log(`  ${r.name.padEnd(20)} ${String(r.shown).padStart(3)}/${String(r.total).padEnd(3)}  ${(100 * r.shown / r.total).toFixed(0)}%`);
  }
} else {
  await report(club || 'Manchester United');
}
