# Frozen baseline — 2026-09-06

Measured against prod (`blcisypmngimqkwxrrdm`), read-only, over the 30 days
`created_at >= 2026-08-07` to `< 2026-09-07`.

Written down BEFORE any navigation change, because Ball IQ has no tab-view
analytics by design (the native privacy label promises none). There is no
before-and-after on the thing being changed. These downstream counts are the
only honest instrument, and they are worthless unless frozen first.

**Read again: 2026-10-06.**

## The numbers

| # | Measure | Value | Notes |
|---|---|---|---|
| 1 | In-app club-pack completions | **80** | `scores.game_mode LIKE 'club:%'`. 38 distinct players, 26 of 30 days. A floor, not a ceiling — see the save-drop caveat. |
| 2 | Distinct in-app packs played | **15 of 95** | 80 of 95 packs (84%) have never once been finished in the app. |
| 3 | Web club-page completions | **719** across **53 of 95** | Club-only, after removing a 46-row robot burst. See the two caveats. |
| 4 | Day-1 to day-2 return | **15.3% – 21.4%** | n = 98 real accounts created 30–8 days ago. |
| 5 | Real accounts that never played | **40.0% – 48.2%** | n = 110 real signups. Guests (`is_anon`) excluded — a different population. |

App-vs-web ratio for club packs, like for like: **719 web vs 80 app, about 9 to 1.**

## Three earlier figures this replaces

- **"18 of 95 distinct packs"** was wrong. It is 15 in this window, and 17 all-time.
- **"893 club completions across 66 packs"** was not club-only. That figure counted
  every `/quiz/<slug>/` page, including player pages (ronaldo, messi) and category
  pages (premier-league, world-cup). All-slug is 900 across 67; club-only is 719
  across 53. The conflated number had been used to argue for a navigation change.
- **"~7% day-1 to day-2 return"** does not hold. Two independent routes put it at
  15–21%, two to three times higher. The origin of 7% could not be located, so it
  may predate the scoring fixes of 2026-07-15 and 2026-08-24.

Confirmed as quoted: in-app completions (79 → 80) and the never-played share.

## Caveats that change how these are read

**1. Numbers 1 and 3 are floors for the first half of the window.** A save-drop bug
meant roughly 20% of finished games sitewide were never recorded until it was
fixed on 2026-08-24 (`969cecc`). About 17 of these 30 days sit inside that period.
Club packs have no fallback signal — unlike Footle, they do not also write to
`wordle_state` — so the loss is unrecoverable.

**2. `club_quiz_results` has no robot defence at all.** Its writer, `logRound()` in
`scripts/seo/club-quiz-engine.js`, calls `log_club_quiz` with no synthetic-traffic
check, while `bqev()` a few lines away in the same file IS gated by `bqSynthetic()`.
One visitor produced 46 rows on 2026-08-29 at an exact 2.000-second cadence with an
identical 1/10 score, then ~30 more inside one second with round numbers out of
order. Those 46 are removed above. Anything similar and slower is still in there.

**3. Two counters that fire from the same code path disagree by 20–30%.**
`club_quiz_results` says 719; `funnel_events` with `event='clubq-finish'` and
`meta->>'surface'='club-page'` says 589 over the identical window, and both are
written by the same `finish()` function, back to back. Unconfirmed candidates: a
bug before 2026-08-23 that wrote every funnel row's slug as null, and ad-blockers
filtering an endpoint named `record_funnel_event` more readily than one named
`log_club_quiz`. **Treat 589–719 as the honest range**, not a point estimate.

**4. The `club` column is really a page slug.** It cannot distinguish a club page
from a player or category page without joining against the slug lists in
`scripts/seo/`. Any future query must do that join or it repeats the error above.

## What a later read must not do

Do not compare a future number against these without applying caveat 1 — the
baseline half-period is undercounted, so a real improvement will look larger than
it is, and a flat result may be a genuine decline. Do not quote number 3 as a
single value. Do not re-derive any of these from memory; the SQL is in the session
transcript for 2026-09-06 and every query above is reproducible.
