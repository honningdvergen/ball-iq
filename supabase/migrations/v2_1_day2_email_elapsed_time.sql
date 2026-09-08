-- ── WHY ──────────────────────────────────────────────────────────────────────
-- select_day2_email_candidates() decided "signed up yesterday" and "played
-- yesterday, not today" with Postgres current_date — the server's UTC day.
-- That is the defect v1_8 documented and fixed for reminders (a player's day
-- is not UTC's day), re-shipped for email. For a player at UTC+9, "yesterday"
-- on the server is a window that straddles two of their days; for UTC-8 it is
-- the wrong day entirely. Found by the 2026-09-07 bloodhound sweep and
-- confirmed against prod: pg_get_functiondef was byte-identical to v1_12.
--
-- There is no timezone signal for this audience (no push subscription, no
-- device token — that is the whole selection), so calendar dates cannot be
-- made right. Elapsed time is timezone-free: the real condition is "a full
-- player-day has passed since signup, they played on that first day, and they
-- have not come back since". played_on() stays for the other campaigns.
create or replace function public.select_day2_email_candidates()
returns table(user_id uuid, email text)
language sql
security definer
set search_path to 'public'
as $$
  select u.id as user_id, u.email::text as email
  from auth.users u
  where u.created_at >= now() - interval '48 hours'
    and u.created_at <  now() - interval '24 hours'   -- a full day has elapsed in EVERY timezone
    and u.email is not null
    and coalesce(u.is_anonymous, false) = false
    and not exists (select 1 from public.web_push_subscriptions w where w.user_id = u.id)
    and not exists (select 1 from public.device_tokens d where d.user_id = u.id)
    and not exists (select 1 from public.email_events e where e.user_id = u.id)
    -- played within 24h of signing up (scores) or has any Footle guesses at all
    and (
      exists (select 1 from public.scores s where s.user_id = u.id and s.created_at < u.created_at + interval '24 hours')
      or exists (select 1 from public.user_game_state g, jsonb_each(coalesce(g.wordle_state, '{}'::jsonb)) k(day, st)
                 where g.user_id = u.id and jsonb_array_length(coalesce(st -> 'guesses', '[]'::jsonb)) > 0)
    )
    -- and nothing in the last 24 hours (a Footle day key can be either local date, so check both)
    and not exists (select 1 from public.scores s where s.user_id = u.id and s.created_at > now() - interval '24 hours')
    and not exists (select 1 from public.user_game_state g
                    where g.user_id = u.id
                      and (jsonb_array_length(coalesce(g.wordle_state -> to_char(now(), 'YYYY-MM-DD') -> 'guesses', '[]'::jsonb)) > 0
                        or jsonb_array_length(coalesce(g.wordle_state -> to_char(now() - interval '1 day', 'YYYY-MM-DD') -> 'guesses', '[]'::jsonb)) > 0))
  limit 40
$$;

grant execute on function public.select_day2_email_candidates() to service_role;
-- ALWAYS LAST (house rule): the grant above, then the revoke.
revoke execute on function public.select_day2_email_candidates() from public, anon, authenticated;
