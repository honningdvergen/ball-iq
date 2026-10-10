// Builds src/data/draftSquads.json, the squads the Draft game spins.
//
//   node scripts/gen-draft.mjs            write the file
//   node scripts/gen-draft.mjs --print    say what would be written, write nothing
//
// ⚠️ THE SOURCE IS NOT IN THIS REPO YET. The squads are read from the working
// folder of the data project (DRAFT_SRC, default
// ~/ball-iq-audit/2026-10-09/draft): English Wikipedia's club-season articles,
// fetched through the API, parsed, and held against the league table. So this
// script runs on the machine that has that folder and its output is committed;
// CI never runs it. Moving the pipeline in here, with each article's revision
// pinned, is the step before the game is linked from anywhere.
//
// WHAT SHIPS. Only club-seasons from 1995-96 on that passed, either:
//   verified   the table's starts add up to eleven a game, its keepers' starts
//              to one a game, its goals plus own goals to the club's goals for,
//              and every scorer agrees with the article's own match list; or
//   accepted   it failed one of those, and a second reading (each player's own
//              career table, kept by different editors) either confirmed every
//              row or named the row that was wrong (08-accept.mjs; corrections
//              are applied here and counted in the output).
// Nothing is estimated and nothing is typed in by hand.
//
// It also fits the two constants of the season model (src/lib/draftModel.js)
// and refuses to write if a club's own first eleven no longer lands near that
// club's real season.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POS, HOME, AWAY, prepare, strength, chances, firstEleven } from '../src/lib/draftModel.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.DRAFT_SRC || join(homedir(), 'ball-iq-audit/2026-10-09/draft');
const OUT = join(ROOT, 'src/data/draftSquads.json');
const FROM = 1995;
const fail = (m) => { console.error(`gen-draft: ${m}`); process.exit(1); };
const read = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
if (!existsSync(join(SRC, 'all-parsed.json'))) fail(`no source at ${SRC} (set DRAFT_SRC)`);

const all = read('all-parsed.json');
const table = read('club-seasons.json').filter((r) => r.seasonStart >= FROM);
const accepted = existsSync(join(SRC, 'accepted.json')) ? read('accepted.json') : [];
const acc = new Map(accepted.map((a) => [a.season + '|' + a.club, a]));
const pool = new Map(JSON.parse(readFileSync(join(ROOT, 'src/data/mysteryPool.json'), 'utf8')).map((p) => [p.id, p.name]));
const cs = new Map(table.map((r) => [r.season + '|' + r.club, r]));

// The name the player sees: the app's own name for him where it has one,
// otherwise his article's title without the bracket Wikipedia adds to tell
// namesakes apart ("David James (footballer, born 1970)").
const shown = (p) => pool.get(p.qid) || (p.article || p.name).replace(/\s*\([^)]*\)\s*$/, '').trim();

const clubs = [], clubIdx = new Map();
const idx = (c) => { if (!clubIdx.has(c)) { clubIdx.set(c, clubs.length); clubs.push(c); } return clubIdx.get(c); };
const squads = [], skipped = [];
let fixed = 0, viaSecond = 0, totalsOnly = 0;

for (const r of all) {
  if (r.seasonStart < FROM || !r.parsed) continue;
  const k = r.season + '|' + r.club, a = acc.get(k);
  if (r.level !== 'verified' && !a) continue;
  const t = cs.get(k);
  if (t.played !== 38) fail(`${k}: ${t.played} games in a season after 1995`);
  const split = r.level === 'verified' ? true : a.split;
  const fix = new Map((a?.fixes || []).map((f) => [f.id, f]));
  const rows = [];
  for (const p of r.players) {
    if (!(p.apps > 0)) continue;
    if (!p.qid) { skipped.push(`${k}: ${p.name} has no article, left out (${p.apps} games)`); continue; }
    const f = fix.get(p.qid);
    let st = split ? p.starts : p.apps, su = split ? p.subs : 0, g = p.goals || 0;
    if (f?.starts != null) { st = f.starts; fixed++; }
    if (f?.goals != null) { g = f.goals; fixed++; }
    const pos = POS.indexOf(p.pos);
    if (pos < 0) fail(`${k}: ${p.name} has no position`);
    rows.push([+p.qid.slice(1), shown(p), pos, st, su, g]);
  }
  // A squad the wheel can always use: at least one man for every line.
  const count = [0, 0, 0, 0]; for (const row of rows) count[row[2]]++;
  if (count.some((c) => c < 1)) { skipped.push(`${k}: nobody at ${POS.filter((p, i) => count[i] < 1).join(", ")}`); continue; }
  if (new Set(rows.map((x) => x[0])).size !== rows.length) { skipped.push(`${k}: one player appears twice`); continue; }
  // ⚠️ The rules in the header are checked HERE, on the rows as they will be
  // written (after a man with no article is dropped and a correction applied),
  // and not taken on trust from the label the data project gave the squad.
  const sum = (i, only) => rows.reduce((a2, row) => a2 + (only == null || row[2] === only ? row[i] : 0), 0);
  if (split && (sum(3) !== 11 * 38 || sum(3, 0) !== 38)) { skipped.push(`${k}: starts come to ${sum(3)} (keepers ${sum(3, 0)}) as written, not 418 and 38`); continue; }
  if (!split) { const apps = sum(3), gk = sum(3, 0); if (apps < 11 * 38 || apps > 16 * 38 || gk < 38 || gk > 44) { skipped.push(`${k}: appearance totals ${apps} (keepers ${gk}) are not possible for 38 games`); continue; } }
  const og = r.matchList?.trusted ? r.matchList.ogFor : (r.hasOgRow ? r.check?.og : null);
  const gap = t.gf - sum(5);
  if (og != null ? gap !== og : (gap < 0 || gap > 5)) { skipped.push(`${k}: goals come to ${sum(5)} of the club's ${t.gf}${og != null ? ` with ${og} own goals` : ''}`); continue; }
  if (r.level !== 'verified') viaSecond++;
  if (!split) totalsOnly++;
  rows.sort((x, y) => x[2] - y[2] || (y[3] + y[4]) - (x[3] + x[4]) || x[1].localeCompare(y[1]));
  squads.push([r.seasonStart, idx(r.club), t.pos, t.pts, t.won, t.drawn, t.lost, t.gf, t.ga, split ? 1 : 0, rows]);
}
squads.sort((a, b) => a[0] - b[0] || a[2] - b[2]);

// ── The league as a backdrop ────────────────────────────────────────────────
// Average goals for and against per game by finishing place, every club-season
// since 1995-96 (all 620, not only the ones that ship): who the eleven plays.
const place = Array.from({ length: 20 }, () => [0, 0, 0]);
const points = {};
for (const r of table) {
  const b = place[r.pos - 1]; b[0] += r.gf / r.played; b[1] += r.ga / r.played; b[2]++;
  (points[r.seasonStart] ||= [])[r.pos - 1] = r.pts;
}
const round = (x, n = 4) => +x.toFixed(n);
const places = place.map(([gf, ga, n]) => [round(gf / n), round(ga / n)]);
const avg = round(places.reduce((a, p) => a + p[0], 0) / 20);
const repl = [18, 19, 20].reduce((a, k) => [a[0] + places[k - 1][0] / 3, a[1] + places[k - 1][1] / 3], [0, 0]).map((x) => round(x));
const goals = [0, 0, 0, 0]; for (const s of squads) for (const row of s[10]) goals[row[2]] += row[5];
const allGoals = goals.reduce((a, b) => a + b, 0);
const league = { place: places, avg, repl, share: goals.map((g) => round(g / allGoals)) };

// ── The fit ─────────────────────────────────────────────────────────────────
// Least squares, in logs, of each club's real goals per game on what its own
// first eleven gives before the fit. Only squads whose starts are known.
const raw = { v: 1, clubs, squads, league, fit: { fc: 0, fk: 1, ac: 0, ak: 1 }, table: points };
const firstXI = firstEleven;
const ols = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); const kk = sxy / sxx; return [my - kk * mx, kk]; };
{
  const D = prepare(raw);
  const base = D.squads.filter((s) => s.split).map((sq) => ({ sq, st: strength(firstXI(sq), D).raw }));
  const [fc, fk] = ols(base.map((b) => Math.log(b.st.lf)), base.map((b) => Math.log(b.sq.gf / 38)));
  const [ac, ak] = ols(base.map((b) => Math.log(b.st.la)), base.map((b) => Math.log(b.sq.ga / 38)));
  raw.fit = { fc: round(fc), fk: round(fk), ac: round(ac), ak: round(ak) };
}
// How well it lands, on every squad including the totals-only ones. Expected
// points from the chances of each of the 38 matches, no luck in it.
const D = prepare(raw);
const xPts = (st) => { let x = 0; for (const home of [1, 0]) for (let k = 2; k <= 20; k++) { const [ogf, oga] = league.place[k - 1]; const c = chances(st.lf * (oga / avg) * (home ? HOME : AWAY), st.la * (ogf / avg) * (home ? AWAY : HOME)); x += 3 * c.w + c.d; } return x; };
let ePts = 0, eGf = 0, eGa = 0;
const worst = [];
for (const sq of D.squads) {
  const st = strength(firstXI(sq), D), x = xPts(st);
  ePts += Math.abs(x - sq.pts); eGf += Math.abs(st.lf * 38 - sq.gf); eGa += Math.abs(st.la * 38 - sq.ga);
  worst.push([Math.abs(x - sq.pts), `${sq.season} ${sq.club} ${Math.round(x)} v ${sq.pts}`]);
}
const n = D.squads.length;
raw.check = { squads: n, points: round(ePts / n, 1), goalsFor: round(eGf / n, 1), goalsAgainst: round(eGa / n, 1) };
// Written as "not within", so a NaN anywhere in the fit fails too.
if (!(raw.check.points <= 5.5) || !Object.values(raw.fit).every(Number.isFinite)) fail(`a club's own first eleven is ${raw.check.points} points from its real season on average (fit ${JSON.stringify(raw.fit)}): the model has drifted`);
// A source folder that has lost squads must not quietly shrink the game.
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).squads.length : 0;
if (n < before && !process.argv.includes('--allow-fewer')) fail(`${n} club-seasons, but the file on disk has ${before}. Pass --allow-fewer if squads were removed on purpose.`);

raw.built = new Date().toISOString().slice(0, 10);
raw.source = 'English Wikipedia club-season articles, by Wikipedia contributors, CC BY-SA 4.0; extracted and checked by Ball IQ';
const json = JSON.stringify(raw);
const tiers = [0, 0, 0]; for (const s of squads) tiers[s[2] <= 4 ? 0 : s[2] <= 12 ? 1 : 2]++;
console.log(`gen-draft: ${n} club-seasons (${tiers[0]} top four, ${tiers[1]} from 5th to 12th, ${tiers[2]} lower), ${squads.reduce((a, s) => a + s[10].length, 0)} player-seasons, ${clubs.length} clubs, ${(json.length / 1024).toFixed(0)} KB`);
console.log(`  ${viaSecond} came through the second reading, ${fixed} rows corrected by it, ${totalsOnly} give one appearance total`);
console.log(`  first eleven v real season, average miss: ${raw.check.points} points, ${raw.check.goalsFor} goals for, ${raw.check.goalsAgainst} against; furthest: ${worst.sort((a, b) => b[0] - a[0]).slice(0, 4).map((w) => w[1]).join('; ')}`);
console.log(`  fit ${JSON.stringify(raw.fit)}`);
if (skipped.length) console.log(`  left out (${skipped.length}):\n    ${skipped.join('\n    ')}`);
if (process.argv.includes('--print')) process.exit(0);
writeFileSync(OUT, json);
console.log(`  wrote ${OUT.replace(ROOT + '/', '')}`);
