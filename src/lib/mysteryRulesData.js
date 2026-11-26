// The data the new Mystery rules read, loaded ON DEMAND (Job A, 26 Nov 2026).
//
// NOTHING IMPORTS THIS FILE YET, so none of it is in any bundle. Job B calls
// loadMysteryRulesData() from the same place the pool loads today: the first
// focus of the guess box (lib/usePlayerPool.js's ensure), never on Home. Each
// file becomes its own lazy chunk; flags stay pictures in public/flags/,
// fetched one by one by an <img> when a tile shows one.
//
//   const d = await loadMysteryRulesData();
//   const ctx = { careers, byId, answers, year, ...d };   // lib/mysteryRules.js
//   d.photos[id]  -> { u, w, h, x, y, s, hero, list, a, l, pg } or undefined
//                    (only reviewed ids; see scripts/build-mystery-photo-lean.mjs)
let inflight = null;
export function loadMysteryRulesData() {
  if (!inflight) {
    inflight = Promise.all([
      import('../data/mysteryNations.json'),
      import('../data/nationRegions.json'),
      import('../data/nationFlags.json'),
      import('../data/mysteryPhotoLean.json'),
      import('../data/mysteryAnswers.json'),
    ]).then(([n, r, f, ph, a]) => ({
      nations: n.default || n,
      regions: r.default || r,
      flags: f.default || f,
      photos: ph.default || ph,
      answers: a.default || a,
    })).catch((e) => { inflight = null; throw e; });
  }
  return inflight;
}
