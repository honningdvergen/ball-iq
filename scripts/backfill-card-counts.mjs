#!/usr/bin/env node
/**
 * Backfill the Ball IQ card's RAW per-difficulty counts (`catStats[cat].d`)
 * from the per-answer log in `user_game_state.daily_all_answers`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Until 2026-09-10 the card was scored from `c`/`a` — exponentially-decayed
 * sums that are not counts, saturate at 200 answers, and printed as "26.78
 * correct". scoreOf now reads real counts from `d`, but `d` only started
 * being written on 09-09, so live cards would sit on an estimate for weeks
 * while the App Store build catches up. The per-answer log already holds
 * 4,852 real answers across 130 players — the same play, recorded properly.
 * This moves that evidence into `d`.
 *
 * ⚠️ MAX, NEVER ADD, NEVER LOWER. A bucket is only ever raised to the larger
 * count. The log and `d` describe THE SAME ANSWERS for anything played since
 * 09-09, so adding would count those twice; and a device may hold counts the
 * log never saw, so lowering would delete history. This makes the script
 * idempotent — running it twice changes nothing the second time.
 *
 * ⚠️ MOST ANSWERS HAVE NO GRADE. Daily 7 only began storing `diff` this
 * month: 441 of 4,852 rows carry one. The rest go to the `u` bucket, which
 * scoreOf weights at AVG_MULT — the honest value for an answer whose
 * difficulty we cannot look up. Do not guess a grade for them.
 *
 * Usage:
 *   node scripts/backfill-card-counts.mjs           # dry run, writes nothing
 *   node scripts/backfill-card-counts.mjs --apply   # PATCHes profiles.stats
 */
import { readFileSync } from "node:fs";
import { computeCard, rawAnswered, FACE_ALIAS, EXCLUDED_CATS } from "../src/lib/ballIqCard.js";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n")
  .map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
const URL = "https://blcisypmngimqkwxrrdm.supabase.co";
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("no SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }
const APPLY = process.argv.includes("--apply");

async function rest(path, init = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${path}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}
// PostgREST caps a page at 1000 rows and returns no error when it truncates —
// a silent short read would look like "these players have no history".
async function all(path) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const page = await rest(`${path}${path.includes("?") ? "&" : "?"}limit=1000&offset=${off}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

const BUCKET = { easy: "e", medium: "m", hard: "h" };

const states = await all("user_game_state?select=user_id,daily_all_answers");
const profiles = await all("profiles?select=id,stats");
const byId = new Map(profiles.map(p => [p.id, p]));

let players = 0, answers = 0, graded = 0, raised = 0;
const updates = [];
const deltas = [];

for (const st of states) {
  const log = st.daily_all_answers;
  if (!log || typeof log !== "object" || Array.isArray(log)) continue;
  const prof = byId.get(st.user_id);
  if (!prof) continue;

  // cat -> bucket -> [correct, total]
  const agg = {};
  let n = 0;
  for (const day of Object.values(log)) {
    if (!Array.isArray(day)) continue;
    for (const a of day) {
      if (!a || typeof a !== "object") continue;
      // `realCat` is the true category when a club or league quiz filed the
      // answer under its own name; `cat` is the fallback.
      const cat = a.realCat || a.cat;
      if (!cat || EXCLUDED_CATS.has(cat)) continue;
      const key = BUCKET[String(a.diff || "").toLowerCase()] || "u";
      if (key !== "u") graded++;
      const b = (agg[cat] ||= {})[key] ||= [0, 0];
      if (a.isCorrect === true) b[0]++;
      b[1]++;
      n++;
    }
  }
  if (!n) continue;
  answers += n;

  const stats = prof.stats && typeof prof.stats === "object" ? prof.stats : {};
  const before = stats.catStats && typeof stats.catStats === "object" ? stats.catStats : {};
  const after = JSON.parse(JSON.stringify(before));
  let touched = false;
  for (const [cat, buckets] of Object.entries(agg)) {
    const cs = (after[cat] ||= { c: 0, a: 0 });
    const d = (cs.d ||= {});
    for (const [k, [c, t]] of Object.entries(buckets)) {
      const cur = Array.isArray(d[k]) ? d[k] : null;
      if (!cur || (cur[1] || 0) < t) { d[k] = [c, t]; touched = true; raised++; }
    }
  }
  if (!touched) continue;
  players++;

  const cardB = computeCard(before), cardA = computeCard(after);
  deltas.push({
    id: st.user_id, n,
    ob: cardB.overall, oa: cardA.overall,
    known: Object.values(after).reduce((s, cs) => s + rawAnswered(cs), 0),
  });
  updates.push({ id: st.user_id, stats: { ...stats, catStats: after } });
}

console.log(`${answers} logged answers (${graded} graded, ${answers - graded} → u) · ${players} players · ${raised} buckets raised`);
const moved = deltas.filter(d => d.oa !== d.ob);
console.log(`overall rating moves: ${moved.length} of ${deltas.length}`);
if (moved.length) {
  const diffs = moved.map(d => d.oa - d.ob).sort((a, b) => a - b);
  const q = p => diffs[Math.min(diffs.length - 1, Math.floor(p * diffs.length))];
  console.log(`  change: min ${q(0)} · p25 ${q(.25)} · median ${q(.5)} · p75 ${q(.75)} · max ${diffs[diffs.length - 1]}`);
  console.log(`  up ${diffs.filter(x => x > 0).length} · down ${diffs.filter(x => x < 0).length}`);
}
console.log("\nbiggest movers (by answers logged):");
for (const d of deltas.sort((a, b) => b.n - a.n).slice(0, 12)) {
  console.log(`  ${d.id.slice(0, 8)}  ${String(d.n).padStart(4)} answers   ${String(d.ob).padStart(3)} → ${String(d.oa).padStart(3)}`);
}

if (!APPLY) { console.log(`\nDRY RUN — nothing written. ${updates.length} profiles would be updated.`); process.exit(0); }

let done = 0;
for (const u of updates) {
  await rest(`profiles?id=eq.${u.id}`, { method: "PATCH", body: JSON.stringify({ stats: u.stats }) });
  if (++done % 20 === 0) console.log(`  ${done}/${updates.length}`);
}
console.log(`applied to ${done} profiles`);
