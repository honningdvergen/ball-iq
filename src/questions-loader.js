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
//   loadQuestions()    → returns { QB, TF_STATEMENTS, QB_CHAOS }
//                        async; resolves immediately if already cached
//   prefetchQuestions() → fire-and-forget alias for AppInner mount
//
// Architectural notes:
//   - The chaos default-difficulty normalization that USED to live at
//     App.jsx module load (the for loop on QB) is performed once here
//     when the cache is first populated. Cached object's QB has the
//     normalized values.
//   - The QB_CHAOS slice that USED to be computed at App.jsx module load
//     is also computed once here on first cache miss. (The former QB_WC2026
//     slice was retired with the World Cup event mode.)
//     Same constant-after-load semantics, just deferred.
//   - In-flight promise deduplication ensures concurrent loadQuestions()
//     calls share a single network request.
//   - Errors propagate to the awaiting caller; prefetchQuestions swallows
//     them with a console.warn (non-blocking — caller will retry on next
//     real loadQuestions invocation).

// ── The INDEX door (2026-07-29) ──────────────────────────────────────────────
//
// Browsing and playing want different data. The club and league pickers used to
// call loadQuestions() on mount purely to render a count next to each tile —
// paying the full ~700ms bank parse so someone could read "52" next to Arsenal,
// before they had chosen anything. src/questions-index.js is the same rows with
// the text stripped: 13× smaller gzipped, ~50ms to parse.
//
// Use loadQuestionIndex() for ANYTHING that only filters on id/type/cat/club/
// diff — counts, availability, pool sizing. Use loadQuestions() when the text,
// options or answer key are actually going to be rendered.
//
// The index preserves QB's row ORDER, so an index position maps to the same
// question. Do not sort it: the Daily 7 shuffles by array position.
let idxCache = null;
let idxInFlight = null;

export function loadQuestionIndex() {
  if (idxCache) return Promise.resolve(idxCache);
  if (idxInFlight) return idxInFlight;
  idxInFlight = import('./questions-index.js').then((mod) => {
    idxCache = mod.QB_INDEX;
    idxInFlight = null;
    return idxCache;
  }).catch((err) => {
    idxInFlight = null;
    throw err;
  });
  return idxInFlight;
}

export function prefetchQuestionIndex() {
  loadQuestionIndex().catch((err) => {
    console.warn('[questions-loader] index prefetch failed', err?.message || err);
  });
}

let cache = null;
let inFlight = null;

export function loadQuestions() {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;
  // ⚠️ THE LEAK TABLE RIDES WITH THE BANK, and that is the whole point.
  // questionConflicts.js is 81 KB of generated data (2,745 questions, 3,762
  // strong leaks) that App.jsx used to import STATICALLY — so it sat in the
  // eager Home chunk, second-largest module there, to serve three draws that
  // cannot run until the bank has loaded anyway. Exactly the defect D14 found
  // with the question index, in a file the static-import ban's regex did not
  // name.
  //
  // Loaded HERE rather than at the three call sites so the guard cannot be
  // used without it: every caller of pickAvoidingConflicts already awaits this
  // loader for QB, so taking `conflictsWith` off the same resolved object
  // makes "I have questions but no leak table" unrepresentable. A sync
  // accessor that degraded to () => [] until a fetch landed would silently
  // reinstate the 26.9%-of-sessions answer leak this table exists to prevent —
  // no error, no log, just easy points.
  inFlight = Promise.all([import('./questions.js'), import('./questionConflicts.js')]).then(([mod, conflicts]) => {
    const QB = mod.QB;
    const TF_STATEMENTS = mod.TF_STATEMENTS;
    const conflictsWith = conflicts.conflictsWith;

    // Chaos default-difficulty normalization. Previously at App.jsx:77.
    // Mutates QB rows in place — same behavior as before, just deferred.
    for (const q of QB) {
      if (q && q.cat === "chaos" && !q.diff) q.diff = "medium";
    }

    // Pre-bucketed QB slices. Previously at App.jsx:86-87. Computed once
    // here so subsequent reads are O(1).
    // (The former QB_WC2026 slice was retired with the World Cup event mode —
    // those questions keep their cat and surface via the general pool.)
    const QB_CHAOS  = QB.filter(q => q && (q.cat === "chaos" || q.tag === "chaos"));

    cache = { QB, TF_STATEMENTS, QB_CHAOS, conflictsWith };
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
