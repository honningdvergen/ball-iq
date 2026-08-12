# Guess the XI — daily mode spec (approved by Alex 2026-08-11)

The third daily. Reuses the lineup builder's pitch renderer, photo bank and
cutout pipeline; adds a guessing loop with a Wordle-class share artifact.
Scan provenance: gamemodes lens ("Missing-11-style daily, proven demand"),
approved by Alex over the builder's competitor-parity bar as a *different,
smaller promise on the same assets*.

## The mechanic

- One **famous real XI** per day: a specific match's starting eleven
  (Istanbul 2005 Liverpool, 2011 Clásico Barça, Invincibles opening day,
  1999 CL-final United, 2014 WC-final Germany…).
- The pitch renders the true formation with **monogram discs + shirt numbers
  + positions revealed**; the header states the match ("Champions League
  final, 25 May 2005 — name Liverpool's XI").
- Player types names into one input. Accent/case-insensitive surname match
  (the Footle normalizer). A correct guess **flips the disc to the player's
  photo/cutout** — the photo bank is the reward loop.
- **8 misses allowed** (a miss = a name not in the XI; typos that match no
  known player don't count — same leniency rule as Footle probes).
- End states: all 11 found, or misses exhausted → full XI revealed.
- **Share artifact**: the pitch image (revealed discs + monograms for missed)
  plus a text grid `⚽ Guess the XI #12 — 9/11, 3 misses` with green/grey
  dots. Uses the existing canvas export + credits pipeline unchanged.

## Data — ZERO ERROR applies; this is bank-grade content

- Source of truth: the **match's Wikipedia article lineup section** (the
  structured XI in the match infobox/lineups). Fetch → parse → resolve each
  player to a Q-id via pageprops (never by name — the standing rule).
- Each XI is verified by a second route (the club-season article or
  UEFA/RSSSF list) before it enters the pool. Mismatch → drop the match.
- Curated pool file `src/data/xiPool.json`:
  `{ id, match, date, club, formation, players: [{ qid, name, surname, no, slot }] }`.
- **Frozen schedule log** (`XI_ANSWER_LOG`), day #1 = launch day — the Footle
  lesson: append-only, never modulo over a growing list; the archive must
  never rewrite itself.
- Launch pool target: 30 XIs (a month of runway), heavy on famous-club famous
  matches 1990–2020 (the era rule), across leagues/eras so streaks vary.
- ⚠️ Formation truth: use the formation as RECORDED for that match, not the
  club's stereotype. The pitch renderer already takes arbitrary rows.

## Surfaces

1. `/xi/` — static page, same skeleton as /lineup/ (self-contained HTML, no
   SPA bundle). Playable with zero sign-up. Result panel links Daily 7 +
   Footle (the daily-hub cross-mesh).
2. OG: `/api/xi-card` later; launch with a static OG image — the share TEXT
   grid carries virality first.
3. Sitemap + directory links + a home-screen "Today's games" slot once live.
4. Native: web-first at launch; ships in the shell automatically (static
   page rides dist/), no store cycle needed.

## Explicitly NOT in v1

- No hints/clue economy (watch completion rates first).
- No user-submitted XIs. No login gate anywhere.
- No archive page at launch (the frozen log makes it safe to add later).

## Build order

1. `scripts/build-xi-pool.mjs` — fetch + dual-verify the launch XIs → xiPool.json
2. `public/xi/index.html` — game page (pitch renderer lifted from /lineup/)
3. Schedule log + day resolver (shared date lib)
4. Canvas share + text grid
5. Verifier script (boot, guess flow, share, determinism across TZ)
6. Alex device-test → sitemap + links → live
