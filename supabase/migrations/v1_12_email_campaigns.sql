-- v1_12: two more email campaigns, and a fix to the one that exists.
--
-- MEASURED 2026-09-01: 201 accounts are reachable ONLY by email — no web push
-- subscription, no device token — and of those 94 signed up and never played
-- while 40 played and have been gone 8-30 days. The Resend path works and has
-- sent 4 messages, ever.
--
-- ⚠️ FIX FIRST, THEN EXTEND. select_day2_email_candidates decides "hasn't come
-- back today" from public.scores ALONE — and Footle, the most-played mode in
-- the product, writes nothing to scores (it lives in user_game_state.wordle_state
-- keyed BY DATE). So the day-2 email would mail someone who had already played
-- that morning. The reminder cron had exactly this defect and it was fixed
-- there; this ports the same pair of checks across.

-- ── the CHECK must admit the new kinds before any insert uses them ───────────
-- v1_9b's lesson: a definer function inserting a value the CHECK rejects rolls
-- back the WHOLE call, and the failure is invisible from the caller.
alter table public.email_events drop constraint if exists email_events_kind_check;
alter table public.email_events add constraint email_events_kind_check
  check (kind in ('day2', 'unsub', 'winback', 'activate'));

-- ── shared: has this user played on a given UTC date? ────────────────────────
-- Both modes, one definition, so the two selectors cannot drift apart the way
-- scores-only did.
create or replace function public.played_on(p_user uuid, p_day date)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.scores s
    where s.user_id = p_user and s.created_at >= p_day::timestamptz
      and s.created_at < (p_day + 1)::timestamptz
  ) or exists (
    select 1 from public.user_game_state g
    where g.user_id = p_user
      and jsonb_array_length(coalesce(g.wordle_state -> p_day::text -> 'guesses', '[]'::jsonb)) > 0
  );
$$;

revoke execute on function public.played_on(uuid, date) from public, anon, authenticated;
grant execute on function public.played_on(uuid, date) to service_role;

-- ── day2: same audience, but no longer blind to Footle ───────────────────────
create or replace function public.select_day2_email_candidates()
returns table(user_id uuid, email text)
language sql
security definer
set search_path to 'public'
as $$
  select u.id as user_id, u.email::text as email
  from auth.users u
  where u.created_at >= (current_date - 1)::timestamptz
    and u.created_at <  current_date::timestamptz
    and u.email is not null
    and coalesce(u.is_anonymous, false) = false
    and not exists (select 1 from public.web_push_subscriptions w where w.user_id = u.id)
    and not exists (select 1 from public.device_tokens d where d.user_id = u.id)
    and not exists (select 1 from public.email_events e where e.user_id = u.id)
    and public.played_on(u.id, (current_date - 1))
    and not public.played_on(u.id, current_date)
  limit 40
$$;

grant execute on function public.select_day2_email_candidates() to service_role;
revoke execute on function public.select_day2_email_candidates() from public, anon, authenticated;

-- ── winback: played, then went quiet for 8-30 days ───────────────────────────
-- ⚠️ EXCLUDES ONLY kind='unsub' AND THIS CAMPAIGN'S OWN ROW — not "any
-- email_events row". Excluding any row is what makes day2 unrepeatable, and
-- copying that would mean a player who once got a day-2 email can never be
-- won back. The PK (user_id, kind) already makes each campaign at-most-once.
create or replace function public.select_winback_candidates()
returns table(user_id uuid, email text, best_streak int)
language sql
security definer
set search_path to 'public'
as $$
  with last_play as (
    select u.id, u.email::text as email,
      greatest(
        coalesce((select max(s.created_at)::date from public.scores s where s.user_id = u.id), date '1970-01-01'),
        coalesce((select max(kv.key::date) from public.user_game_state g,
                    jsonb_each(coalesce(g.wordle_state, '{}'::jsonb)) kv
                  where g.user_id = u.id and kv.key ~ '^\d{4}-\d{2}-\d{2}$'
                    and jsonb_array_length(coalesce(kv.value -> 'guesses', '[]'::jsonb)) > 0),
                 date '1970-01-01')
      ) as played_last,
      coalesce((select (gs.login_streak->>'best')::int from public.user_game_state gs where gs.user_id = u.id), 0) as best_streak
    from auth.users u
    where u.email is not null
      and coalesce(u.is_anonymous, false) = false
      and not exists (select 1 from public.web_push_subscriptions w where w.user_id = u.id)
      and not exists (select 1 from public.device_tokens d where d.user_id = u.id)
      and not exists (select 1 from public.email_events e where e.user_id = u.id and e.kind in ('unsub','winback'))
  )
  select l.id, l.email, l.best_streak
  from last_play l
  where l.played_last > date '1970-01-01'
    and (current_date - l.played_last) between 8 and 30
  limit 40
$$;

grant execute on function public.select_winback_candidates() to service_role;
revoke execute on function public.select_winback_candidates() from public, anon, authenticated;

-- ── activate: made an account, never played a single game ────────────────────
create or replace function public.select_activate_candidates()
returns table(user_id uuid, email text)
language sql
security definer
set search_path to 'public'
as $$
  select u.id, u.email::text
  from auth.users u
  where u.email is not null
    and coalesce(u.is_anonymous, false) = false
    -- at least a day old: a signup mid-onboarding has not "failed to play" yet
    and u.created_at < (current_date)::timestamptz
    and not exists (select 1 from public.web_push_subscriptions w where w.user_id = u.id)
    and not exists (select 1 from public.device_tokens d where d.user_id = u.id)
    and not exists (select 1 from public.email_events e where e.user_id = u.id and e.kind in ('unsub','activate'))
    and not exists (select 1 from public.scores s where s.user_id = u.id)
    and not exists (
      select 1 from public.user_game_state g, jsonb_each(coalesce(g.wordle_state, '{}'::jsonb)) kv
      where g.user_id = u.id
        and jsonb_array_length(coalesce(kv.value -> 'guesses', '[]'::jsonb)) > 0
    )
  limit 40
$$;

grant execute on function public.select_activate_candidates() to service_role;
revoke execute on function public.select_activate_candidates() from public, anon, authenticated;
