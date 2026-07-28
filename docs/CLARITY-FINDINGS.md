# Clarity findings

## ⚡ 2026-07-28 (later) — THE DIAGNOSIS WAS WRONG. It is not bounce, it is bimodal.

Per-page scroll depth and active time overturn the earlier read on this page:

| Page | Avg scroll | Avg active time |
|---|---|---|
| /quiz/hull-city/ | **96%** | **368s (6+ min)** |
| /play | 95% | 103s |
| /lists/serie-a-top-scorers/ | 93% | 72s |
| /lists/serie-a-champions/ | 84% | 42s |
| /quiz/sporting-cp/ | 81.5% | 80s |

**The "50% average scroll depth" was a bimodal average** — instant bouncers plus a
real cohort reading nearly the whole page. The mean described nobody.

**People do NOT find the site unappealing.** Six minutes and 96% scroll on a Hull
City quiz page is devouring, not tolerating.

### The actual problem

**Deep engagement converts to nothing.** The six-minute Hull City reader still
left without a second pageview (entry 16 = exit 16). We take someone's total
attention for minutes and ask them for nothing at the end.

### What this KILLS (do not spend time here)

- ❌ **"Add cross-links so people can browse on."** The Everton page already has
  **114 internal links to 98 unique pages.** The mesh is built. Nobody uses it.
- ❌ **"The site looks bad / needs a premium facelift to stop bounces."** The
  engaged cohort scrolls 80-96%. Aesthetics are not what is stopping them.
- ❌ **"Nobody scrolls, so move everything above the fold."** True for the
  bouncers, false for the cohort that actually matters.

### What this POINTS AT

1. **A single, well-timed ask at the point of peak engagement** — end of the
   quiz/list, where attention is proven — beats any amount of passive linking.
2. **The two populations need different treatment.** Bouncers need a reason to
   stay in the first 3 seconds; the engaged cohort needs a next step at minute
   five. One design cannot serve both, and today neither is served.
3. Segment every future metric by these two groups. Site-wide averages here are
   actively misleading — this is the second time an average sent us the wrong way
   (see the CLS/interaction-shift note below).

⚠️ **METHOD NOTE.** Three consecutive theories died to one query each: dead
buttons (synthetic-click artefact), missing cross-links (98 already exist), ugly
design (96% scroll). Query before building. Every one of those would have been
days of wasted work.

---

## 2026-07-28 (earlier) — first read

Live behavioural data from Microsoft Clarity (project `xqwevk9brq`), read via
the MCP connector. **This is the first time real user behaviour has been read
end-to-end.** Alex's brief: retention, sign-ups, time-on-site; "let no stone go
unturned".

---

## 1. THE HEADLINE — it is a conversion problem, not a bug list

**111 sessions (last 3 days) → 6 triggered "Play" → 2 signed up.**

That is a **5.4% play rate**. Everything else below is subordinate to this.

| Metric | Value | Read |
|---|---|---|
| Sessions | 111 | (11,872 **bot** sessions excluded — bots are ~99% of hits) |
| Pages / session | **1.05** | Almost nobody navigates. Land → leave. |
| Scroll depth | 50.01% | Half the page unseen |
| Active time | 1.6 min of 2.6 min | |
| New vs returning | **97.3% / 2.7%** (3 sessions) | **No retention loop is firing** |
| Smart events | Play 6 · Outbound 5 · Sign up 2 · Submit form 1 · Login 1 | |

**Nothing is technically broken:**
- **0 JavaScript errors**
- Performance **83/100**; LCP 2.2s ✅ · INP 200ms ✅ · CLS 0.017 ✅
- Rage clicks **0%** · excessive scrolling **0%** · quick backs **0%**

So the app is fast, stable and error-free — and 94.6% of visitors still never
press play. **Do not go looking for a crash. There isn't one.**

## 2. Traffic shape

- **Referrers:** google.com **60**, balliq.app 9, accounts.google.com 4,
  instagram 1, threads 1, reddit 1 → **SEO carries essentially all traffic.**
- **Browsers:** MobileSafari 35% · ChromeMobile 31.5% · Chrome 10.8% ·
  **FacebookApp 9%** · GoogleApp 4.5% · Firefox 4.5% · Edge 3.6% ·
  **InstagramApp 0.9%** → **~66% mobile, ~10% in-app webviews.**
- **Top pages:** /play 18 · / 17 · /quiz/rangers 11 · /quiz/everton 8 ·
  /quiz/newcastle 7 · /invite/… 5

⚠️ **Test everything at mobile viewport.** Desktop is a minority case.

## 3. Dead clicks — 25.23% of sessions (28/111)

Highest-signal defect. Rage clicks are 0%, so users are not *angry* — they tap
something, get nothing, and quietly leave.

**By text:**

| Clicked text | Dead clicks | What it is |
|---|---|---|
| `Next →` | **176** | quiz advance button |
| `Pep Guardiola, Barcelona'` | 36 | an answer option |
| `التالي →` | 30 | `Next →` in Arabic |
| `••••• •••• ••••` | 28 | Clarity-masked text |
| `▫▫` | 26 | glyph |
| `The name 'Camp Nou' liter…` | 24 | an **explanation** |
| `The Brazilian Ronaldo sco…` | 24 | an **explanation** |
| `Which Brazilian, playing…` | 24 | the **question text** |
| `A` | 15 | option letter badge |

**`Next →` by URL:** `/play` **149** · /invite/… 8 · / 4 · /quiz/tottenham 4 ·
/quiz/sporting-cp 4 · /quiz/psg 4 · /quiz/hull-city 2 · /quiz/la-liga 1

→ **85% of the Next-dead-clicks are in the real app, not the SEO taster.**

### Hypotheses RULED OUT (tested live, do not re-investigate)

- ❌ *"The Classic mode card is dead"* — it works; my first click simply missed.
- ❌ *"The timer keeps running during reveal and auto-advances, yanking the
  question away"* — **the timer FREEZES on answer.** No auto-advance.
- ❌ *"The SEO taster options are dead"* — they work (tap → ✓/✗ + explanation
  + Next). A `ref`-based click failed to dispatch; a coordinate click worked.
  **Beware: a failed synthetic click looks exactly like a dead button.**
- ❌ *Code fault in the advance path* — `doAdvance` is synchronous and correct;
  `advance` fires in the same React batch as the answer, so there is no window
  where the button is missing. `App.jsx` ~2190.

### Leading hypothesis — LAYOUT SHIFT ON ANSWER (untested)

Answering **expands the card**: the explanation and the Next button appear, and
everything below moves down (measured **~115px** on the Barcelona hero taster at
desktop width; proportionally worse on a 390px viewport).

So the sequence is: user taps an option → content jumps → the user's next tap
lands where the old layout was → **dead click**.

This also explains the *explanation* and *question text* dead clicks: those
elements have just moved into the space where the option the user tapped used
to be.

⚠️ **CLS 0.017 does NOT contradict this** — Core Web Vitals CLS measures
*load* shift, not *interaction* shift. This shift is invisible to that metric.

**NEXT TEST (highest value, not yet done):**
1. Reproduce at a **390×844 viewport** (`resize_window` did not visibly apply
   in my run — verify the viewport actually changed before trusting a result).
2. Double-tap `Next →` and check whether the second tap lands on the **next
   question's option D**. If it does, that is a **scoring bug**, not cosmetic —
   it would silently answer the following question wrong.
3. Watch 2–3 Clarity recordings filtered on `deadClickPresent`. Thirty seconds
   of video settles what code reading cannot.

## 4. Design reads (not bugs — signals)

- Users tap **explanations and question text** → they expect the explanation to
  expand, or the whole card to advance. Consider: make the whole card tappable
  to advance once answered.
- Users tap **already-answered / disabled options** → after answering, the
  options go `disabled` (`gen-seo-pages.mjs`, the `p!==null?' disabled':''`
  branch). A disabled button is a guaranteed dead click. Consider making the
  answered card advance on tap anywhere instead.
- **1.05 pages/session + 50% scroll depth** → the club pages are not pulling
  people deeper. The taster is *above* the long-form content; most visitors
  likely never reach the second quiz block.

## 5. What this means for the week

Ranked by expected value:

1. **The 5.4% play rate.** 60 Google visitors/day arriving and leaving is the
   whole ballgame. Everything else is a rounding error next to this.
2. **Dead clicks (25% of sessions)** — likely one layout-shift fix.
3. **Retention: 2.7% returning.** No loop is firing. Web push is still blocked
   on `VAPID_KEYS`.
4. **In-app webviews ~10%** — Facebook/Instagram browsers, where install and
   share behave badly.

---

⚠️ **Nothing in this file is a fix. It is evidence.** Fixes must be verified by
exercising the app at a mobile viewport, not by reading the diff.
