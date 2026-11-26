// The data the new Mystery rules read, loaded ON DEMAND (Job A, 26 Nov 2026).
//
// screens/MysteryPlayer.jsx (Job B) calls loadMysteryRulesData() from the same
// place the pool loads: the first focus of the guess box, or on open in the
// app (lib/usePlayerPool.js's ensure), never on Home. Each
// file becomes its own lazy chunk; flags stay pictures in public/flags/,
// fetched one by one by an <img> when a tile shows one.
//
//   const d = await loadMysteryRulesData();
//   const ctx = { careers, byId, answers, year, ...d };   // lib/mysteryRules.js
//   (`answers` is mysteryAnswers.json, which the screen already imports
//   statically for its starters; loading it here too only made Vite warn.)
//   d.photos[id]  -> { u, w, h, x, y, s, hero, list, a, l, pg } or undefined
//                    (only reviewed ids; see scripts/build-mystery-photo-lean.mjs)
let inflight = null;
let loaded = null;
/**
 * The data if it has already arrived, else null: a screen opened a second time
 * draws its tiles at once instead of a frame later (and a static render, which
 * runs no effects, can be handed it by a test).
 */
export function peekMysteryRulesData() { return loaded; }
export function loadMysteryRulesData() {
  if (!inflight) {
    inflight = Promise.all([
      import('../data/mysteryNations.json'),
      import('../data/nationRegions.json'),
      import('../data/nationFlags.json'),
      import('../data/mysteryPhotoLean.json'),
    ]).then(([n, r, f, ph]) => ({
      nations: n.default || n,
      regions: r.default || r,
      flags: f.default || f,
      photos: ph.default || ph,
    })).then((d) => { loaded = d; return d; }).catch((e) => { inflight = null; throw e; });
  }
  return inflight;
}
