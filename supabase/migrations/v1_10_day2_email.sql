-- v1_10: the day-2 email channel — reach the slice push can never touch.
--
-- email_events is the at-most-once ledger AND the opt-out register: a
-- (user_id,'day2') row means the one win-back email was sent; a
-- (user_id,'unsub') row excludes the user from every future selection.
-- The unique constraint is what makes the sender's record-first insert an
-- honest dedupe.
--
-- select_day2_email_candidates reads auth.users (email) as definer; execute
-- is granted to service_role ONLY (the edge function's admin client) —
-- postgres keeps it for cron/ops. Explicit revoke per the house rule.
--
-- The pg_cron entry that invokes the edge function hourly is applied at
-- wire-up time (it embeds the x-cron-secret, which must exist first):
--   select cron.schedule('day2-email-hourly', '15 * * * *', $$
--     select net.http_post(
--       'https://blcisypmngimqkwxrrdm.supabase.co/functions/v1/send-day2-email',
--       '{}'::jsonb,
--       '{}'::jsonb,
--       jsonb_build_object('x-cron-secret', '<EMAIL_CRON_SECRET>',
--                          'Content-Type', 'application/json')
--     ) $$);

create table if not exists public.email_events (
  user_id uuid not null,
  kind text not null check (kind in ('day2', 'unsub')),
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_events enable row level security;
revoke all on table public.email_events from public, anon, authenticated;

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
    -- unreachable by push, on any platform
    and not exists (select 1 from public.web_push_subscriptions w where w.user_id = u.id)
    and not exists (select 1 from public.device_tokens d where d.user_id = u.id)
    -- never emailed, never opted out
    and not exists (select 1 from public.email_events e where e.user_id = u.id)
    -- actually PLAYED on day 1 (a score row, or any Footle day with guesses)
    and (
      exists (select 1 from public.scores s where s.user_id = u.id)
      or exists (
        select 1 from public.user_game_state g,
                      jsonb_each(coalesce(g.wordle_state, '{}'::jsonb)) kv
        where g.user_id = u.id
          and jsonb_array_length(coalesce(kv.value -> 'guesses', '[]'::jsonb)) > 0
      )
    )
    -- hasn't already come back today on their own
    and not exists (
      select 1 from public.scores s2
      where s2.user_id = u.id and s2.created_at >= current_date::timestamptz
    )
  limit 40
$$;

grant execute on function public.select_day2_email_candidates() to service_role;
revoke execute on function public.select_day2_email_candidates() from public, anon, authenticated;
