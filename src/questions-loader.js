// src/questions-loader.js
//
// V1.1 lazy-load shim for the question bank. The raw questions.js module
// is ~1 MB raw / ~150 kB gzipped — split it out of the main chunk so
// first paint doesn't pay for it. Prefetch on app mount means the chunk
// is almost certainly already in the cache by the time the user taps
// Play (typically 5-30+ seconds after first paint), so the lazy-load
// is invisible to users on normal connections.
//
// Pattern:
//   loadQuestions()    → returns { QB, TF_STATEMENTS, CHAOS_QB, QB_WC2026, QB_CHAOS }
//                        async; resolves immediately if already cached
//   prefetchQuestions() → fire-and-forget alias for AppInner mount
//
// Architectural notes:
//   - The chaos default-difficulty normalization that USED to live at
//     App.jsx module load (the for loop on QB) is performed once here
//     when the cache is first populated. Cached object's QB has the
//     normalized values.
//   - QB_WC2026 / QB_CHAOS slices that USED to be computed at App.jsx
//     module load are also computed once here on first cache miss.
//     Same constant-after-load semantics, just deferred.
//   - In-flight promise deduplication ensures concurrent loadQuestions()
//     calls share a single network request.
//   - Errors propagate to the awaiting caller; prefetchQuestions swallows
//     them with a console.warn (non-blocking — caller will retry on next
//     real loadQuestions invocation).

let cache = null;
let inFlight = null;

export function loadQuestions() {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;
  inFlight = import('./questions.js').then((mod) => {
    const QB = mod.QB;
    const TF_STATEMENTS = mod.TF_STATEMENTS;
    const CHAOS_QB = mod.CHAOS_QB;

    // Chaos default-difficulty normalization. Previously at App.jsx:77.
    // Mutates QB rows in place — same behavior as before, just deferred.
    for (const q of QB) {
      if (q && q.cat === "chaos" && !q.diff) q.diff = "medium";
    }

    // Pre-bucketed QB slices. Previously at App.jsx:86-87. Computed once
    // here so subsequent reads are O(1).
    const QB_WC2026 = QB.filter(q => q && q.tag === "wc2026");
    const QB_CHAOS  = QB.filter(q => q && (q.cat === "chaos" || q.tag === "chaos"));

    cache = { QB, TF_STATEMENTS, CHAOS_QB, QB_WC2026, QB_CHAOS };
    inFlight = null;  // free the promise reference once resolved
    return cache;
  }).catch((err) => {
    inFlight = null;  // allow retry on next call
    throw err;
  });
  return inFlight;
}

export function prefetchQuestions() {
  loadQuestions().catch((err) => {
    console.warn('[questions-loader] prefetch failed', err?.message || err);
  });
}
