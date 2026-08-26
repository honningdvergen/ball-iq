-- ────────────────────────────────────────────────────────────────────────────
-- THE PULSE — six numbers, one paste, every week.
--
-- ⚠️ THIS EXISTS BECAUSE SHIPPING IS NOT MOVING NUMBERS. 1.7.0 closed thirteen
-- items in 48 hours and WAU did not move. The habit that fixes that is not more
-- dashboards, it is looking at the SAME six numbers on a schedule and asking
-- which change was supposed to move each one.
--
-- Run it against prod. Compare against the baseline below. If a number has not
-- moved and something shipped that was supposed to move it, the change did not
-- work — say so and undo or rethink it, rather than shipping the next thing.
--
-- ── BASELINE, 2026-08-26 (the evening 1.7.0 went to review) ─────────────────
--   1. accounts                  236
--   2. activated (real play)     138  = 58.5%
--   3. never played, 3+ days old ~35%   (FLAT across every cohort)
--   4. WAU                       ~46   (FLAT since 27 July)
--   5. 7-day Footle habit        36    = 15%
--   6. club finishers -> app     16 of 107 = 15%; to store 0 of 107
--
-- ⚠️ DEFINITIONS MATTER MORE THAN THE NUMBERS. Two different people measured
-- "activation" this month and got 31%, 50.7% and 58.5% — all correct, all
-- different definitions. A play here means A REAL GUESS or a score row.
-- wordle_state writes a date key the moment Footle is OPENED, so `<> '{}'` is
-- not a play. See [[feedback]] in acct-funnel.sql.
-- ────────────────────────────────────────────────────────────────────────────

with real_play as (
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
),
-- Everyone who did something real on a given day, Footle and scores together.
-- ⚠️ `scores` alone is NOT activity: it records survival/daily/classic/wc2026/
-- chaos/legends and nothing else. Footle — the most-played mode — writes only
-- to user_game_state. Measuring DAU from `scores` undercounts badly.
active_days as (
  select u.user_id, e.key::date as d
    from user_game_state u, lateral jsonb_each(coalesce(u.wordle_state, '{}'::jsonb)) e
   where jsonb_array_length(coalesce(e.value -> 'guesses', '[]'::jsonb)) > 0
     and e.key ~ '^\d{4}-\d{2}-\d{2}$'
  union
  select user_id, created_at::date from scores
),
club as (
  select
    count(distinct visitor_id) filter (where event = 'clubq-finish')   as finishers,
    count(distinct visitor_id) filter (where event = 'clubq-out-play') as to_web_app,
    count(distinct visitor_id) filter (where event = 'clubq-out-store')as to_store,
    count(distinct visitor_id) filter (where event = 'clubq-more')     as kept_going
  from funnel_events where created_at > now() - interval '30 days'
)
select
  (select count(*) from real_play)                                          as "1_accounts",
  (select count(*) filter (where ever_played) from real_play)               as "2_activated",
  (select round(100.0 * count(*) filter (where ever_played) / count(*), 1)
     from real_play)                                                        as "2_activation_pct",
  -- ⚠️ 3+ days old ONLY. Including fresh signups makes a good acquisition week
  -- look like an activation collapse; on 2026-08-26 that gap was 44% vs ~35%.
  (select round(100.0 * count(*) filter (where not ever_played) / nullif(count(*),0), 1)
     from real_play where created_at < now() - interval '3 days')           as "3_never_played_pct_settled",
  (select count(distinct user_id) from active_days
    where d > current_date - interval '7 days')                             as "4_wau",
  (select count(*) from (
      select user_id from active_days group by user_id having count(*) >= 7
   ) t)                                                                     as "5_habit_7day",
  (select finishers   from club)                                            as "6_club_finishers_30d",
  (select to_web_app  from club)                                            as "6_club_to_web_app",
  (select to_store    from club)                                            as "6_club_to_store",
  (select kept_going  from club)                                            as "6_club_kept_going";
