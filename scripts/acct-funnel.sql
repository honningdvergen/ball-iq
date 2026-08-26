-- ────────────────────────────────────────────────────────────────────────────
-- SIGNUP → FIRST PLAY
--
-- Run this a week after 1.7.0 reaches players. Before then the acct-* events
-- do not exist and section 2 will be empty — that is expected, not a bug.
--
-- ⚠️ WHY THIS IS THE QUESTION. Measured 2026-08-24:
--     · 36.2% of accounts (79 of 218) have NEVER played a single game, and it
--       is not improving — 33.9% of the last 30 days' signups are the same
--     · of the 131 who did play, only 15.3% played once and vanished; the rest
--       average 9.7 plays, one is at 77
--   So retention is not the problem. It is good. A third of the water never
--   reaches the bucket. Every person converted past their first game is worth
--   ~9.7 plays at 85% return odds — no other lever on the board has that.
--
-- ⚠️ AND: Google sign-ups convert 2.3× worse than Apple (53.2% vs 23.1% never
--   play, n=79 and n=104). Real, sizeable, and UNEXPLAINED — the obvious
--   username-space theory does not hold (only 6 of the 42 have a space, and 8
--   Apple users with spaces played fine). Section 3 is the standing check.
--
-- ⚠️ NATIVE IS ANONYMOUS BY DESIGN. loopEvent strips the account id and all
--   meta on native (privacy §4 + the store declarations), so section 2 sees WEB
--   accounts only. Native shows up as counts in section 4 and cannot be joined
--   to a person. Do not read a low native number as a low native conversion.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. THE GROUND TRUTH, no instrumentation required ────────────────────────
-- This works today and always has. Section 2 explains WHERE people stop; this
-- says HOW MANY, and the two must agree.
with played as (
  select p.id, p.created_at,
    (exists (select 1 from scores s where s.user_id = p.id)
     -- ⚠️ A REAL GUESS, NOT AN OPEN. wordle_state writes a date key the instant
     -- Footle is opened — {"status":"playing","guesses":[]} — so `<> '{}'`
     -- counted anyone who looked at the board and left as having played, and
     -- flattered activation. daily_scores is safe: its values are finished
     -- scores (plain integers), so any key there is a genuine play.
     or exists (select 1 from user_game_state u,
                       lateral jsonb_each(coalesce(u.wordle_state, '{}'::jsonb)) e
                 where u.user_id = p.id
                   and jsonb_array_length(coalesce(e.value -> 'guesses', '[]'::jsonb)) > 0)
     or exists (select 1 from user_game_state u
                 where u.user_id = p.id
                   and jsonb_typeof(u.daily_scores) = 'object'
                   and u.daily_scores <> '{}'::jsonb)
    ) as ever_played
  from profiles p
)
select '1. activation' as section,
       count(*)                                                        as accounts,
       count(*) filter (where not ever_played)                         as never_played,
       round(100.0 * count(*) filter (where not ever_played) / count(*), 1) as pct_never_played,
       count(*) filter (where created_at > now() - interval '30 days') as new_30d,
       round(100.0 * count(*) filter (where created_at > now() - interval '30 days' and not ever_played)
             / nullif(count(*) filter (where created_at > now() - interval '30 days'), 0), 1) as pct_new_never_played
from played;

-- ── 2. WHERE THEY STOP (web accounts) ───────────────────────────────────────
-- The drop between two adjacent steps is the thing to act on:
--   session → username : blocked at the mandatory username wall
--   username → home    : blocked after it (onboarding, a crash, a dead tap)
--   home → first-play  : NOT blocked — they saw the app and did not start
--   first-play → finish: started and abandoned mid-game
-- The first two are bugs. The third is a product problem. The fourth is either.
with steps as (
  select unnest(array['acct-session','acct-username','acct-home','acct-first-play','acct-first-finish']) as event,
         generate_series(1, 5) as ord
), reached as (
  select s.ord, s.event, count(distinct f.user_id) as accounts
  from steps s
  left join funnel_events f on f.event = s.event and f.user_id is not null
  group by s.ord, s.event
)
select '2. where they stop' as section, ord, event, accounts,
       lag(accounts) over (order by ord) - accounts as lost_here,
       round(100.0 * accounts / nullif(max(accounts) over (), 0), 1) as pct_of_top
from reached order by ord;

-- ── 3. THE PROVIDER GAP ─────────────────────────────────────────────────────
-- Standing check on the 2.3× Google/Apple difference. If it closes on its own
-- after 1.7.0, the cause was something 1.7.0 fixed — worth knowing which.
with played as (
  select p.id,
    (exists (select 1 from scores s where s.user_id = p.id)
     -- ⚠️ A REAL GUESS, NOT AN OPEN. wordle_state writes a date key the instant
     -- Footle is opened — {"status":"playing","guesses":[]} — so `<> '{}'`
     -- counted anyone who looked at the board and left as having played, and
     -- flattered activation. daily_scores is safe: its values are finished
     -- scores (plain integers), so any key there is a genuine play.
     or exists (select 1 from user_game_state u,
                       lateral jsonb_each(coalesce(u.wordle_state, '{}'::jsonb)) e
                 where u.user_id = p.id
                   and jsonb_array_length(coalesce(e.value -> 'guesses', '[]'::jsonb)) > 0)
     or exists (select 1 from user_game_state u
                 where u.user_id = p.id
                   and jsonb_typeof(u.daily_scores) = 'object'
                   and u.daily_scores <> '{}'::jsonb)
    ) as ever_played
  from profiles p
)
select '3. by provider' as section,
       coalesce(u.raw_app_meta_data ->> 'provider', '?') as provider,
       count(*) as accounts,
       count(*) filter (where not pl.ever_played) as never_played,
       round(100.0 * count(*) filter (where not pl.ever_played) / count(*), 1) as pct_never
from played pl
join auth.users u on u.id = pl.id
group by 2
order by accounts desc;

-- ── 4. IS THE INSTRUMENT ALIVE? ─────────────────────────────────────────────
-- ⚠️ RUN THIS FIRST AND BELIEVE IT BEFORE BELIEVING SECTION 2. A funnel that
-- silently stopped recording looks exactly like a funnel where everybody
-- succeeded. Two specific ways it lies:
--   · record_funnel_event DROPS every event once the table exceeds 3000 rows
--     in an hour — a burst elsewhere silently truncates this one
--   · a step firing while signed out records user_id NULL and joins to nobody,
--     which is the original defect: 907 of 908 first-game-started rows
select '4. instrument health' as section,
       count(*) filter (where event like 'acct-%')                          as acct_rows,
       count(*) filter (where event like 'acct-%' and user_id is null)      as acct_rows_unattributed,
       count(*) filter (where created_at > now() - interval '1 hour')       as rows_last_hour,
       case when count(*) filter (where created_at > now() - interval '1 hour') >= 3000
            then 'AT THE CAP — events are being dropped' else 'ok' end      as cap_status,
       max(created_at) filter (where event like 'acct-%')                   as last_acct_event
from funnel_events;


-- ── 5. NEVER-PLAYED BY COHORT AGE ───────────────────────────────────────────
-- ⚠️ RUN THIS BEFORE BELIEVING ANY HEADLINE ACTIVATION NUMBER.
--
-- Section 1's "% of the last 30 days who never played" is confounded by a
-- signup burst: people who joined yesterday have not had time to come back, so
-- a good week of acquisition makes activation look like it collapsed. On
-- 2026-08-26 the 30-day figure read 44% and the honest number was ~35% — the
-- gap was 21 accounts under three days old, of whom 81% had not played yet.
--
-- What this splits out, measured 2026-08-26:
--     0-3 days   21 accounts   81.0% never played   <- recency, not a problem
--     3-7 days   22             31.8%
--     7-14 days  32             37.5%
--     14-30 days 57             31.6%
--     30+ days  104             38.5%
--
-- The shape is the finding: once past three days it is FLAT at ~32-38% and it
-- does not improve with age. People who do not play in their first few days
-- essentially never do. So the dead end is structural, not a recent
-- regression, and the window to fix is the first session — not a re-engagement
-- campaign later.
with played as (
  select p.id, p.created_at,
    (exists (select 1 from scores s where s.user_id = p.id)
     or exists (select 1 from user_game_state u,
                       lateral jsonb_each(coalesce(u.wordle_state, '{}'::jsonb)) e
                 where u.user_id = p.id
                   and jsonb_array_length(coalesce(e.value -> 'guesses', '[]'::jsonb)) > 0)
     or exists (select 1 from user_game_state u
                 where u.user_id = p.id
                   and jsonb_typeof(u.daily_scores) = 'object'
                   and u.daily_scores <> '{}'::jsonb)
    ) as ever_played
  from profiles p
)
select '5. by cohort age' as section,
       case
         when created_at > now() - interval '3 days'  then 'a. 0-3 days'
         when created_at > now() - interval '7 days'  then 'b. 3-7 days'
         when created_at > now() - interval '14 days' then 'c. 7-14 days'
         when created_at > now() - interval '30 days' then 'd. 14-30 days'
         else 'e. 30+ days'
       end as cohort,
       count(*)                                                            as accounts,
       count(*) filter (where not ever_played)                             as never_played,
       round(100.0 * count(*) filter (where not ever_played) / count(*), 1) as pct_never_played
from played
group by 2
order by 2;
