# Reading the funnel

`public.funnel_events` is the product's first-party instrument. It exists
because `loopEvent()` used to fire into Microsoft Clarity and nowhere else,
and Clarity's export API returns only its own auto-detected smart events — so
`onboard-done-answered`, `first-game-started` and `clubq-play` were
**write-only**, and every recommendation about those features in scouting
report #2 was reasoning rather than measurement.

---

## ⚠️ THE CONTAMINATION CUTOFF — read this before any query

**Ignore every row created before `2026-08-21 22:10:00+00`.**

```sql
-- The standing filter. Put it in every funnel query.
where created_at > timestamptz '2026-08-21 22:10:00+00'
```

The table went live at 19:08 UTC on 2026-08-21. By 22:10 UTC it held **1,021
rows, of which 867 were `first-game-started`** — arriving at ~250/hour, exactly
one per visitor, in precisely the hours the Playwright suite was running. Real
DAU at the time was **13–17**. One row was literally named `probe-e2e`.

None of it was real.

**Cause — a seam, not a bug in anything.** The e2e suite runs against
`localhost:4173`; localhost reads `.env.local`; `.env.local` points at
**production** Supabase, because there is no staging project. So every local
run and every CI run wrote test events into the table the product's decisions
come from, at roughly 50 synthetic rows per real one.

That is worse than having no data, because it looks like data. Left alone it
would have made the activation funnel read as a triumph.

**Why the rows were not deleted.** Deleting is irreversible, it is production
data, and it is unnecessary — a documented cutoff achieves the same thing at
zero risk. If they are ever purged, do it deliberately and say so here.

---

## The gate that stops it recurring

Both emitters now refuse synthetic traffic:

| where | function |
|---|---|
| the app | `loopEvent()` → `isSyntheticTraffic()` in `src/App.jsx` |
| club pages | `bqev()` → `bqSynthetic()` in `scripts/gen-seo-pages.mjs` |

Two signals, both deliberately conservative — when in doubt, do **not** record:

- **`navigator.webdriver === true`** — set by Playwright, Selenium and
  Puppeteer, and by nothing else.
- **hostname is `localhost` / `127.0.0.1` / `.local`** — Alex's own dev
  browsing, which was never a user journey either.

Native builds have neither signal, so real app traffic is untouched.

⚠️ **A consequence worth knowing:** any browser-automation check *you* run
(including the in-app browser tools) is now correctly invisible to the funnel.
Do not "verify the funnel works" by driving a browser and expecting a row —
you will get zero, and that is the gate doing its job. Verify a real path by
querying for rows from real traffic instead.

`tests/e2e/funnel-synthetic-gate.spec.js` guards this. It enters a game (the
event fires on the PLAYING state, not on page load — the first version of that
test loaded `/play`, asserted zero writes, and passed *with the gate disabled*,
proving nothing) and was verified by disabling the gate and watching it fail.

---

## What writes to it

`loopEvent(name, meta)` in `src/App.jsx` fans out to Clarity **and**
`record_funnel_event`. Current events include `first-game-started`,
`onboard-done-answered` / `onboard-done-skipped`, `share-daily`, `share-p`,
`share-get`, `share-join`, `share-card-*`, `join-token-consumed`,
`challenge-arrived`, `stadiums-abandon`.

The club pages call `bqev(name)` (`clubq-start`, `clubq-play`, `clubq-finish`,
`list-play-start`, `list-play-giveup`). **Until 2026-08-21 these went only to
Clarity** — which stopped being acceptable the moment Clarity became
consent-gated in Europe, because the club pages carry ~39% of all play and
would have gone dark for every visitor who declines. `funnel_events` is
first-party and consent-exempt, so it keeps working regardless of the answer.
Gate the third party; own the number.

**The visitor id is shared on purpose.** Both emitters use the same
`biq_vid` localStorage key, so a visitor who plays a club page and then opens
the app is **one journey**, not two strangers. That crossing — club page →
app — is a question nobody has been able to answer, and Clarity actively
obscured it by starting a new session on the navigation.

---

## Useful queries

```sql
-- Event volume since the cutoff
select event, count(*) as events, count(distinct visitor_id) as visitors
from public.funnel_events
where created_at > timestamptz '2026-08-21 22:10:00+00'
group by event order by events desc;

-- The club-page → app crossing (the reason the vid is shared)
select count(distinct visitor_id) as crossed
from public.funnel_events
where created_at > timestamptz '2026-08-21 22:10:00+00'
group by visitor_id
having bool_or(meta->>'surface' = 'club-page') and bool_or(event = 'first-game-started');
```

Retention: rows are pruned after 180 days by `cleanup_funnel_events()`
(pg_cron, 04:23 daily).
