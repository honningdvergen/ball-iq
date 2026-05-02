# Bundle splitting analysis — V1.1 / V2 decision

Captured 2026-05-02. Decision-ready analysis for whether to invest in code-splitting for V1.1 or push to V2. Pure analysis — no code changes.

**TL;DR recommendation:** Do `questions.js` lazy-load + prefetch as a single V1.1 chunk (~6-10h, ~150 KB gzip savings, low risk). Defer component-level splits to V2 unless Lighthouse pressure forces them sooner.

---

## 1. Current bundle composition

Measured from a clean `npm run build` against commit `7efd438` (post-1F.6 launch).

### Generated chunks

| Chunk | Raw | Gzipped | Notes |
|---|---|---|---|
| `index.html` | 22.15 kB | 6.88 kB | Includes inlined splash CSS + service worker registration |
| `react-DghaKJPf.js` | 140.86 kB | 45.26 kB | React + ReactDOM (already split via `manualChunks`) |
| `supabase-CxJ6U0-I.js` | 194.44 kB | 51.53 kB | `@supabase/supabase-js` (already split via `manualChunks`) |
| `index-CSiA7KAO.js` | **1343.68 kB** | **385.87 kB** | **Everything else — the splittable chunk** |
| **Total raw transferred** | **~1701 kB** | **~490 kB** | First paint cost on cold cache |

The `react` and `supabase` chunks are ALREADY split (`vite.config.js:16-22`). They're stable cacheable units — code-only changes don't invalidate them. No further wins available there.

### What's in the 1343 kB index chunk

Source-file contributions (raw bytes, before minification):

| File | Raw bytes | % of source | Note |
|---|---|---|---|
| `src/questions.js` | 1,012,083 | 60.4% | Question bank — mostly structured data |
| `src/App.jsx` | 597,175 | 35.6% | Everything else (~50 components + hooks + CSS string) |
| `src/useAuth.jsx` | 28,047 | 1.7% | Auth provider |
| `src/ReviewScreen.jsx` | 18,997 | 1.1% | Internal reviewer tool |
| `src/useMultiplayerRoom.js` | 11,238 | 0.7% | Stage 1 hook |
| `src/Login.jsx` | 11,210 | 0.7% | Login screen |
| Other (DesktopNav, safeStorage, supabase, main) | ~5,500 | 0.3% | Minor |
| **Total source** | **~1,684 kB** | 100% | |
| **After Vite processing** | **1,344 kB** | — | ~20% reduction (minification + tree-shake) |

`questions.js` and `App.jsx` together are 96% of the source weight. **They're the only places worth splitting.** Everything else is rounding error.

### Why `questions.js` minifies so weakly

Question bank contents are mostly string literals (question text, answer options, category names, hints). Minifiers can't shorten arbitrary string content. They only remove whitespace / shorten variable names — neither helps with data.

Estimated `questions.js` contribution to the index chunk:
- Raw: 988 kB (95% of source weight × tree-shake)
- Minified: ~800 kB (whitespace + a tiny bit of dead-code removal)
- **Gzipped: ~150 kB** (heavily compresses — repetitive object key shapes, common string patterns)

`App.jsx`'s share of the gzip (~385 kB total - ~150 kB questions = ~235 kB).

### No "missing" vendor splits

Quick check of `package.json`:

```json
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.39.0"
}
```

Three runtime deps. All already in their own chunks (or as part of the React chunk). **No recharts, no lucide-react, no chart libraries, no UI kits** — common bundle-bloat suspects don't exist here.

---

## 2. Lighthouse's 724 KiB unused JS finding

Lighthouse's "Reduce unused JavaScript" measures bytes that the V8 instrumenter never executed during the trace. It's a proxy for "how much of the chunk is dead weight on first paint of the audited route."

### What's in the 724 KiB on the Home route

Cross-referenced against the file map and the `screen === ...` routing in `AppInner`:

| Code path | Approx contribution to Home-route unused | Splittable? |
|---|---|---|
| `questions.js` | ~700 kB raw / ~140 kB gzip | **Yes** — referenced at use time, not load time |
| Game engines (`QuizEngine` + `HotStreakEngine` + `TrueFalseEngine`) | ~80 kB raw / ~25 kB gzip | Yes, but requires extracting from App.jsx |
| Results screens family (`Results`, `BallIQResults`, `HotStreakResults`, `TrueFalseResults`, `LocalResults`, `Confetti`, `HardRightBurst`) | ~70 kB raw / ~22 kB gzip | Yes, but requires extracting |
| Multiplayer flow (`OnlineEntry`, `MultiplayerLobby`, `LobbyView`, `MultiplayerGameplay`, `QuestionView`, `ScoreBar`, `HostAdvanceControls`, `useMultiplayerRoom`) | ~60 kB raw / ~18 kB gzip | Yes, but requires extracting + first-impression UX cost |
| `LocalGameScreen` + `LocalSetup` + `LocalResults` | ~30 kB raw / ~10 kB gzip | Yes, but requires extracting |
| `FootballWordle` + helpers | ~30 kB raw / ~10 kB gzip | Yes, but requires extracting |
| `ReviewScreen.jsx` | ~13 kB raw / ~4 kB gzip | Yes — already in own file, trivial split |
| `CropModal` + the cropperjs CDN loader code | ~20 kB raw / ~6 kB gzip | Yes, but requires extracting |
| Modal overlays (level-up, IQ recap, rate prompt, how-to-play, ball-iq-intro, friends picker, league picker, diff picker) | ~25 kB raw / ~8 kB gzip | Yes, but requires extracting + each is small |
| `DailyReviewScreen` + `PuzzleReviewScreen` + `ReviewQuestionCard` + `Mini7Strip` | ~15 kB raw / ~5 kB gzip | Yes, but requires extracting |
| `OnboardingScreen` | ~12 kB raw / ~4 kB gzip | Yes, but only loaded on first-ever launch — speculative win |
| `Help` + `Privacy` screens (long copy) | ~8 kB raw / ~3 kB gzip | Yes, but small |
| Other small components / modals / utilities | ~50 kB raw / ~15 kB gzip | Yes, but small + scattered |

**Sum:** ~1100 kB raw / ~270 kB gzip of "splittable but extractable" code, plus ~700 kB raw / ~140 kB gzip from `questions.js` already in its own file.

Lighthouse's 724 KiB roughly matches the upper-bound case (everything that COULD theoretically be lazy on the Home route). The actually achievable savings are lower because:

1. **Some routes share code.** Splitting `Results` won't help if the user lands on Home then plays a quiz — they still need `Results` within seconds.
2. **Splits have overhead.** Each chunk adds ~1-2 kB of runtime + a network round-trip. ~10 small splits cost ~15-20 kB just in chunk overhead.
3. **`questions.js` dominates.** ~140 kB gzip is bigger than every other split combined.

### Realistic gzip savings ceiling

If we do EVERY split listed above:
- Home-route first-paint gzip: 385 kB → ~135-160 kB (potential ~60% reduction)
- BUT: every other route adds back its splits as it's visited
- Net browse-the-whole-app cost: roughly the same (~385 kB total over the session, just spread out)

The win is **time-to-first-paint on a cold cache**, not total bytes downloaded over a session.

---

## 3. Lazy-loading strategy — candidates ranked

Each candidate evaluated on: gzip savings on Home first-paint, implementation cost, user-facing UX impact.

### Tier 1 — DO (high ROI)

#### **`questions.js` lazy-load + prefetch on idle** ⭐ recommended

- **Savings:** ~140 kB gzip on first paint. Single biggest win in the entire splitting analysis.
- **Cost:** 6-10h. Touches every getter function (`getQs`, `getDailyQs`, `pickMultiplayerQuestions`, `applySeenFilter`, `getBallIQQuestions`, etc.) — needs to await the module's first load. After that, cached for the session.
- **UX impact:** **Zero if implemented with prefetch.** Trigger `import('./questions.js')` in a `useEffect([])` at app mount. By the time the user taps Play (typically 5-30+ seconds after first paint), the module has long since loaded. Without the prefetch, first quiz start would have a 200-500ms delay on slow connections — would need a brief loading spinner. With prefetch, no spinner needed.
- **Risk:** Low. Pure data deferral; no behavior change. Question bank contents identical.
- **Pattern:**
  ```js
  // Module-scoped cache + loader
  let qbCache = null;
  let qbPromise = null;
  function loadQB() {
    if (qbCache) return Promise.resolve(qbCache);
    if (!qbPromise) qbPromise = import('./questions.js').then(m => { qbCache = m; return m; });
    return qbPromise;
  }

  // Existing call sites become async
  async function getQs(...) {
    const { QB } = await loadQB();
    // ...
  }

  // Trigger prefetch on app mount (one line in AppInner)
  useEffect(() => { loadQB(); }, []);
  ```

#### **`ReviewScreen.jsx` route-level lazy**

- **Savings:** ~4 kB gzip across all non-reviewer users (i.e., every user except one).
- **Cost:** 30-60 minutes. Already in its own file — just `const ReviewScreen = lazy(() => import('./ReviewScreen.jsx'))` and wrap in `<Suspense>`.
- **UX impact:** Zero for non-reviewer users (never loaded). Reviewer sees a brief load on Settings → Review (acceptable — internal tool).
- **Risk:** Trivially low.

### Tier 2 — MAYBE (medium ROI, requires extracting from App.jsx)

#### **Multiplayer flow extract + lazy**

- **Savings:** ~18 kB gzip on Home.
- **Cost:** 8-12h. Needs to extract `OnlineEntry`, `MultiplayerLobby`, `LobbyView`, sub-views, `MultiplayerGameplay`, `QuestionView`, `ScoreBar`, `HostAdvanceControls`, `QuestionTimer`, `pickMultiplayerQuestions`, plus the inline CSS rules they use. Either move to `src/multiplayer/*.jsx` or keep colocated in App.jsx but use `lazy()` boundaries (won't actually split the chunk if everything's still in one file — extraction is required).
- **UX impact:** **Real first-impression cost.** Multiplayer is the headline feature; users tap "Online Multiplayer" and expect immediate response. A 100-300ms chunk-load delay would feel like the app is slow at the worst possible moment.
- **Mitigation:** Prefetch the multiplayer chunk after first paint (same idle-prefetch pattern as `questions.js`). With prefetch, UX cost approaches zero.
- **Risk:** Medium. Stage 1 just shipped; extracting risks regression in code we just stabilized. Worth waiting at least 2 weeks of stable production before refactoring.
- **Recommendation:** Defer to V1.1+ unless first-paint Lighthouse score is a launch blocker.

#### **Game engines extract + lazy** (`QuizEngine` + `HotStreakEngine` + `TrueFalseEngine`)

- **Savings:** ~25 kB gzip on Home.
- **Cost:** 12-16h. Three engines, each ~80-200 lines, each with their own state/timer/handler logic. Extract each to `src/engines/*.jsx`. Then `lazy()` each route mount.
- **UX impact:** Brief loading on first quiz start (Quick Play tap → spinner → engine loads). Subsequent plays are cached. Survival/Hot Streak/T/F splits are independent — could ship one at a time.
- **Mitigation:** Prefetch on Home idle (after first paint, prefetch QuizEngine since it's the most-used).
- **Risk:** Medium. These engines are mature but they're load-bearing for daily play.
- **Recommendation:** Defer to V1.1+. Higher implementation cost than savings justify.

#### **`FootballWordle` extract + lazy**

- **Savings:** ~10 kB gzip on Home.
- **Cost:** 4-6h. Self-contained component (canvas + day-rollover + cross-device sync). Extract to `src/wordle/FootballWordle.jsx`. Lazy-load on Home Daily tile tap.
- **UX impact:** Brief loading when user taps the Wordle card. Once per session.
- **Risk:** Low-medium. Wordle is its own state machine; extraction is mechanically straightforward.
- **Recommendation:** Defer to V1.1.

### Tier 3 — DON'T (low ROI / bad UX trade)

#### **Results family extract + lazy**

- **Savings:** ~22 kB gzip — but only on first-paint of Home. Moments later when the user finishes a quiz, the chunk has to load.
- **Cost:** 8-12h.
- **UX impact:** Loading spinner BETWEEN quiz end and results screen — bad. Every quiz finish would feel laggy. Could be avoided with prefetch (load Results after Quiz module loads), but adds prefetch complexity.
- **Recommendation:** Don't split. Results is essential; users hit it every quiz.

#### **`CropModal` extract + lazy**

- **Savings:** ~6 kB gzip. Cropper.js itself is loaded from CDN already (not in bundle).
- **Cost:** 3-4h.
- **UX impact:** Brief loading on Profile → tap avatar → crop. Acceptable.
- **Recommendation:** Don't split. The savings are too small to justify the extraction effort. The cropperjs CDN load is the dominant cost on the avatar-upload path anyway.

#### **Modal overlays scatter-split**

- **Savings:** ~8 kB gzip combined for all small modals.
- **Cost:** 4-6h to split a dozen tiny components.
- **Risk:** Each extraction is small but all together is non-trivial work. Each chunk also pays ~1-2 kB overhead.
- **Recommendation:** Don't split individually. If anything, group all "rarely used overlays" into a single chunk via `manualChunks` config — but the savings probably wash out against chunk overhead.

#### **`DailyReviewScreen` / `PuzzleReviewScreen`**

- **Savings:** ~5 kB gzip combined.
- **Cost:** 4-6h to extract.
- **UX impact:** Loads when user taps a past day on the calendar. Acceptable.
- **Recommendation:** Don't split. Below the noise threshold.

---

## 4. What NOT to lazy-load (anti-list)

These should stay in the main chunk regardless of bundle pressure:

- **AppGate / AppInner / Login** — required for first paint and auth flow. Lazy = blank screen.
- **Home tab content** — first thing users see. Lazy = splash holds longer than necessary.
- **DailyTabScreen / LeagueScreen / ProfileScreen** — concurrently mounted as Home tabs (per the `display: hidden` pattern at `AppInner:~L11380`). Switching tabs is instant; lazy-loading them defeats that pattern.
- **`useAuth` / `useMultiplayerRoom`** — hooks consumed across the app; lazy-loading would create fragile import graphs.
- **Service worker registration code** — needs to run on first paint to install the SW.
- **The inline `<style>{css}</style>` block in AppInner** — this is the entire app's CSS. Splitting CSS is a separate concern (Vite has `cssCodeSplit: true` already; the inline string in App.jsx is the actual bottleneck).

---

## 5. Open questions and trade-offs

### Q1: Is route-level splitting enough, or do we need component-level splitting within routes?

**A:** Route-level is enough for V1.1. Component-level adds complexity disproportionate to gain.

`questions.js` is already its own file (the highest-ROI split). The other Tier-1 candidate (`ReviewScreen`) is also its own file. Tier-2 candidates require extracting first — that extraction IS the route-level split.

True component-level splitting (e.g., lazy-loading `Confetti` within `Results`) buys ~2 kB at the cost of "wait for Confetti to load before showing celebration" UX. Bad trade.

### Q2: What's the right Suspense fallback?

Three options:

| Fallback | When it shows | Pro | Con |
|---|---|---|---|
| **`null`** | Briefly between route change and chunk load | Invisible | Looks like the app froze if load takes >100ms |
| **`<LobbyLoading />` style** | Branded spinner | Consistent with existing in-app loading | Each route would benefit from a route-shaped skeleton |
| **The `.biq-splash` markup** (reused from `AppGate`) | Full-screen branded splash | Already exists, used for cold app load | Heavyweight for "switching to Wordle" |

**Recommendation:** Per-route Suspense with appropriate fallback shape:
- `questions.js` lazy: NO suspense — module loads in background, getter functions await it. Only the first quiz tap might wait briefly (acceptable).
- `ReviewScreen` lazy: simple "Loading…" text (matches the existing reviewer-tool aesthetic).
- Multiplayer / engines (if/when split): branded mini-splash with logo + spinner. Shows for 100-500ms; not jarring.

### Q3: Concerns about Vite's chunk-strategy defaults vs custom config?

The current `manualChunks` config is minimal and correct (`react` + `supabase` only). For the recommended Tier-1 splits, no `manualChunks` change is needed — `import()` in code creates separate chunks automatically.

For Tier-2 (multiplayer, engines), if we want to bundle related lazy chunks together (e.g., all multiplayer files in one chunk rather than 8 small chunks), we'd add a function-form `manualChunks`:

```js
manualChunks(id) {
  if (id.includes('node_modules/react')) return 'react';
  if (id.includes('node_modules/@supabase')) return 'supabase';
  if (id.includes('/multiplayer/')) return 'multiplayer';
  if (id.includes('/engines/')) return 'engines';
}
```

Defer this until we have files matching those paths.

### Q4: What about HTTP/2 push or preload hints?

We have `<link rel="preconnect">` for fonts + Supabase in `index.html` (already optimal). Adding `<link rel="modulepreload">` for the lazy chunks is an option once they exist — tells the browser to fetch them in parallel with the main bundle without executing. Implementation cost: ~5 lines in index.html per chunk. Net effect: cancels out most of the lazy-load latency for users on fast connections.

---

## 6. Recommended execution path

### Phase 1 (V1.1) — Ship `questions.js` lazy-load

**Single chunk of work, ~6-10h total:**

1. Create `src/questions-loader.js` with `loadQB()` cache + Promise-deduping logic
2. Refactor every getter that reads from `questions.js` to be async (or to lazy-await the bank on first call)
3. Refactor every caller of those getters to handle the async boundary (most are inside event handlers / effects so this is mechanical)
4. Add `useEffect(() => { loadQB(); }, [])` to `AppInner` for prefetch on mount
5. Smoke test: start each game mode, verify first call doesn't lag noticeably; subsequent calls are instant
6. Lighthouse re-audit to confirm gzip savings

**Expected outcome:**
- First-paint gzip: 385 kB → ~245 kB (~140 kB savings)
- Lighthouse "Reduce unused JavaScript" finding drops by ~140 kB
- No user-visible UX change
- One new chunk (`assets/questions-XXX.js`) cached separately from app code

**Recommendation: yes for V1.1.** Single biggest splitting win in the codebase. Low risk. The prefetch pattern means there's no spinner anywhere visible.

### Phase 2 (V1.1, after Phase 1 ships clean) — Ship `ReviewScreen` lazy

**Tiny chunk of work, 30-60 min:**

1. `const ReviewScreen = lazy(() => import('./ReviewScreen.jsx'))`
2. Wrap the `<ReviewScreen />` mount in `<Suspense fallback={<div>Loading…</div>}>`
3. Verify reviewer flow still works

**Expected outcome:**
- ~4 kB gzip savings for every non-reviewer user (i.e., every user)
- Brief loading when reviewer taps Settings → Review (internal tool, acceptable)
- One new chunk (~3 kB gzip)

**Recommendation: yes for V1.1.** Free-ish win bundled with Phase 1.

### Phase 3 (V2 or skip) — Multiplayer / engines / Wordle extracts

**Defer.** Each extract is 4-12h. Combined savings: ~50 kB gzip. Not nothing, but not in proportion to the structural work + regression risk so soon after launch.

Revisit if:
- Lighthouse score becomes a marketing requirement
- Mobile slow-3G first-paint becomes a real complaint
- Bundle grows past 1.6 MB raw / 450 kB gzip (current trajectory if questions.js doesn't get split)

### Phase 4 (V2) — Modal scatter-splits + small components

**Don't.** Below the noise threshold; extraction overhead costs more than the savings.

---

## 7. Total estimated savings

| Phase | Implementation cost | First-paint gzip savings |
|---|---|---|
| Phase 1 (`questions.js` lazy + prefetch) | 6-10 h | ~140 kB |
| Phase 2 (`ReviewScreen` lazy) | 30-60 min | ~4 kB |
| **V1.1 total (recommended)** | **~7-11 h** | **~144 kB (~37% of current 385 kB gzip)** |
| Phase 3 (extracts — optional) | 24-32 h | additional ~50 kB |
| **Hypothetical maximal V2 split** | **~31-43 h** | **~194 kB (~50% of current gzip)** |

Diminishing returns are sharp. Phase 1 alone captures most of the value.

---

## 8. Quick decision recommendations

| Question | Answer |
|---|---|
| Should we split for V1.1? | **Yes — `questions.js` lazy-load + `ReviewScreen` lazy.** ~7-11h total. ~144 kB gzip savings. Low risk. |
| Should we extract multiplayer / engines for V1.1? | **No.** Code is freshly stabilized; structural extraction risks regression. ~50 kB gzip across multiple splits. Save for V2 unless Lighthouse becomes a launch metric. |
| Should we touch the Vite config? | **No.** Current `manualChunks` is minimal and correct. Phase 1 splits via `import()` create chunks automatically. |
| Should we add modulepreload hints? | **Wait until Phase 1 ships.** Then evaluate latency on staging Lighthouse. |
| Should we add a CSS code-split? | **No.** `cssCodeSplit: true` is already on. The inline `<style>{css}</style>` in App.jsx is a separate refactor (~50 kB raw / ~10 kB gzip win) — possible V2 task but not part of this bundle-splitting effort. |

---

## 9. Reference numbers for re-evaluation

If anyone re-runs this analysis later, these are the V1.0 launch baseline:

- Total raw transferred: ~1701 kB
- Total gzipped: ~490 kB
- Index chunk gzipped: 385 kB
- Lighthouse "unused JS": 724 kB (Home route)
- `questions.js` raw: 988 kB (4103 lines, 4081 entries)
- `App.jsx` raw: 583 kB (11668 lines, ~50 components)
- Vite version: 5.4.21
- Build time: ~900 ms

If `questions.js` ever exceeds 1.5 MB raw OR the index chunk gzipped exceeds 500 kB, the calculus shifts and Tier-2 splits become more attractive.
