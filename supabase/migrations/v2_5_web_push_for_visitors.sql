-- ── WHY ──────────────────────────────────────────────────────────────────────
-- Reach is the retention leak: 44 of 308 accounts hold a push token, and the
-- one surface where the players actually are — the static daily pages — has
-- never been able to ask. Since 2026-09-06 the results panel mounted 42 times;
-- 22 of those were on the web pages, all signed out, where the island host
-- hard-codes "no reminder" because every piece of the web-push pipeline is
-- keyed by user_id: the table, the cron, the inbox row, the edge function.
--
-- This lets a signed-out browser subscribe. The subscription is keyed by the
-- visitor id the page already writes to daily_results (biq_vid), the cron
-- checks "played today" against daily_results.visitor_id, and delivery goes
-- through a small outbox whose insert trigger is the notifications trigger
-- cloned (v1_5's trick — the definition is rewritten inside the database, so
-- no secret is ever printed).
--
-- STILL NO PERSONAL DATA. A visitor row holds a push endpoint, a timezone
-- offset and an hour. Nothing joins it to a person; unsubscribing deletes it.

-- ── the table learns about visitors ──────────────────────────────────────────
alter table public.web_push_subscriptions
  alter column user_id drop not null,
  add column if not exists visitor_id uuid;
alter table public.web_push_subscriptions
  drop constraint if exists web_push_subscriptions_owner_check,
  add constraint web_push_subscriptions_owner_check check (user_id is not null or visitor_id is not null);
create index if not exists web_push_subscriptions_visitor_idx on public.web_push_subscriptions (visitor_id) where visitor_id is not null;
-- The endpoint is the browser's identity; the existing upsert conflicts on it.
create unique index if not exists web_push_subscriptions_endpoint_key on public.web_push_subscriptions (endpoint);

-- ── the only way in for anon ─────────────────────────────────────────────────
create or replace function public.subscribe_web_push(
  p_visitor      uuid,
  p_subscription jsonb,
  p_endpoint     text,
  p_tz           int  default 0,
  p_hour         int  default 19
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Shape gate. Silent return, never raise: a caller that can tell "rejected"
  -- from "accepted" is a caller that can probe.
  if p_visitor is null or p_subscription is null or p_endpoint is null then return; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 2048 then return; end if;
  if length(p_subscription::text) > 4096 then return; end if;
  if p_hour is null or p_hour < 0 or p_hour > 23 then return; end if;
  if p_tz is null or p_tz < -840 or p_tz > 840 then return; end if;
  -- Silent throttle: a page cannot mint more than 500 subscriptions an hour.
  if (select count(*) from public.web_push_subscriptions where created_at > now() - interval '1 hour') >= 500 then return; end if;

  insert into public.web_push_subscriptions (user_id, visitor_id, subscription, endpoint, tz_offset_minutes, reminder_hour, last_seen_at)
  values (null, p_visitor, p_subscription, p_endpoint, p_tz, p_hour, now())
  on conflict (endpoint) do update
    set visitor_id = excluded.visitor_id,
        -- a browser that later signs in keeps its user row; a visitor cannot take it over
        subscription = excluded.subscription,
        tz_offset_minutes = excluded.tz_offset_minutes,
        reminder_hour = excluded.reminder_hour,
        last_seen_at = now()
    where public.web_push_subscriptions.user_id is null;
end;
$function$;

create or replace function public.unsubscribe_web_push(p_endpoint text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_endpoint is null then return; end if;
  -- anon may only remove visitor rows; a user's row is theirs (RLS, own_delete)
  delete from public.web_push_subscriptions where endpoint = p_endpoint and user_id is null;
end;
$function$;

grant execute on function public.subscribe_web_push(uuid, jsonb, text, int, int) to anon, authenticated;
grant execute on function public.unsubscribe_web_push(text) to anon, authenticated;
-- ALWAYS LAST (house rule): without these PUBLIC keeps execute.
revoke execute on function public.subscribe_web_push(uuid, jsonb, text, int, int) from public;
revoke execute on function public.unsubscribe_web_push(text) from public;

-- ── the outbox ───────────────────────────────────────────────────────────────
create table if not exists public.web_push_outbox (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.web_push_subscriptions(id) on delete cascade,
  type            text not null default 'daily_reminder',
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists web_push_outbox_sub_created_idx on public.web_push_outbox (subscription_id, created_at desc);
alter table public.web_push_outbox enable row level security;
-- No policies: only the cron (security definer) writes, only the trigger reads.
revoke all on table public.web_push_outbox from anon, authenticated, public;

-- ── the trigger: v1_5's clone, aimed at the outbox ───────────────────────────
do $$
declare
  src  text;
  dest text;
begin
  select pg_get_triggerdef(t.oid) into src
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal and c.relname = 'notifications' and t.tgname = 'send_web_push_on_notification';
  if src is null then
    raise exception 'send_web_push_on_notification not found — nothing to clone';
  end if;
  dest := replace(src, 'send_web_push_on_notification', 'send_web_push_on_outbox');
  dest := replace(dest, ' ON public.notifications ', ' ON public.web_push_outbox ');
  if dest = src or position('public.web_push_outbox' in dest) = 0 then
    raise exception 'substitution produced no change — the trigger shape is not what was expected';
  end if;
  drop trigger if exists send_web_push_on_outbox on public.web_push_outbox;
  execute dest;
end $$;

-- ── the cron learns about visitors (v2_4's body, verbatim, plus one branch) ──
create or replace function public.enqueue_web_daily_reminders()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inserted int := 0;
begin
  with sources as (
    -- web push: a real, browser-reported offset
    select w.user_id, w.tz_offset_minutes, w.last_seen_at, 1 as pref, w.reminder_hour, false as local_reminders
    from public.web_push_subscriptions w
    union all
    -- native: offset when the app has registered one since v1_11
    -- prod already carried coalesce(d.last_seen_at, d.updated_at) here; the repo lacked it (snapshot drift, bloodhound 2026-09-08)
    select d.user_id, d.tz_offset_minutes, coalesce(d.last_seen_at, d.updated_at), 2 as pref, d.reminder_hour, d.local_reminders
    from public.device_tokens d
  ),
  best as (
    select distinct on (s.user_id) s.user_id, s.tz_offset_minutes, s.reminder_hour, s.local_reminders
    from sources s
    order by s.user_id, s.pref, s.last_seen_at desc nulls last
  ),
  -- most frequent UTC hour of play, for rows with no offset yet
  play_hour as (
    select s.user_id, (extract(hour from s.created_at))::int as hr, count(*) as n
    from public.scores s
    group by 1, 2
  ),
  modal_hour as (
    select distinct on (p.user_id) p.user_id, p.hr
    from play_hour p
    order by p.user_id, p.n desc, p.hr
  ),
  due as (
    select b.user_id,
           coalesce(b.tz_offset_minutes, 0) as tz_offset_minutes,
           ((now() at time zone 'utc') + make_interval(mins => coalesce(b.tz_offset_minutes, 0)))::date as local_date
    from best b
    left join modal_hour m on m.user_id = b.user_id
    where
      -- ONE engine per device: a native app that schedules its own local
      -- reminders at the player's hour must not also be pushed at it.
      not coalesce(b.local_reminders, false) and
      case
        when b.tz_offset_minutes is not null
          then extract(hour from (now() at time zone 'utc') + make_interval(mins => b.tz_offset_minutes)) = coalesce(b.reminder_hour, 19)
        else extract(hour from (now() at time zone 'utc')) = coalesce(m.hr, 19)
      end
  ),
  eligible as (
    select d.user_id, d.local_date, d.tz_offset_minutes,
           (d.local_date - date '1970-01-01') as local_day_index,
           coalesce((g.login_streak->>'streak')::int, 0)  as streak,
           coalesce((g.login_streak->>'best')::int, 0)    as best,
           coalesce((g.login_streak->>'lastDay')::int, 0) as last_day
    from due d
    left join public.user_game_state g on g.user_id = d.user_id
    where
      not exists (
        select 1 from public.scores s
        where s.user_id = d.user_id
          and s.created_at >= ((d.local_date::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
          and s.created_at <  (((d.local_date + 1)::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
      and not exists (
        select 1 from public.user_game_state u
        where u.user_id = d.user_id
          and jsonb_array_length(coalesce(
                u.wordle_state -> d.local_date::text -> 'guesses', '[]'::jsonb)) > 0
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = d.user_id
          and n.type = 'daily_reminder'
          and n.created_at >= ((d.local_date::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
  )
  insert into public.notifications (user_id, type, payload)
  select e.user_id, 'daily_reminder',
         jsonb_build_object('body',
           case
             when e.last_day >= e.local_day_index - 1 and e.streak >= 2
               then '🔥 ' || e.streak || '-day streak — one puzzle tonight makes it ' || (e.streak + 1)
             when e.last_day >= e.local_day_index - 1 and e.streak = 1
               then '🔥 You lit a streak yesterday — one puzzle tonight makes it 2'
             when e.last_day = e.local_day_index - 2 and e.streak >= 2
               then 'You missed yesterday — play tonight and your ' || e.streak || '-day streak can still be saved 🛡'
             when e.best >= 3
               then 'Your best run is ' || e.best || ' days — tonight is a good night to start the climb'
             else 'Today''s puzzles are still open — keep your streak going 🔥'
           end)
  from eligible e;
  get diagnostics v_inserted = row_count;

  -- ── VISITORS (v2_5, 2026-09-09) ─────────────────────────────────────────
  -- A subscription with no user_id belongs to a signed-out browser on a
  -- static page. It cannot go through public.notifications (user_id NOT NULL,
  -- and it is the signed-in inbox), so it goes to web_push_outbox, whose
  -- insert trigger calls send-web-push with a subscription_id. "Played
  -- today" is daily_results.visitor_id — the only trace a visitor leaves.
  with due_v as (
    select w.id, w.visitor_id, w.tz_offset_minutes,
           ((now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes))::date as local_date
    from public.web_push_subscriptions w
    where w.user_id is null and w.visitor_id is not null
      and extract(hour from (now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes)) = coalesce(w.reminder_hour, 19)
  ),
  eligible_v as (
    select d.*
    from due_v d
    where not exists (
        select 1 from public.daily_results r
        where r.visitor_id = d.visitor_id
          and r.created_at >= ((d.local_date::timestamp - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
          and r.created_at <  (((d.local_date + 1)::timestamp - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
      and not exists (
        select 1 from public.web_push_outbox o
        where o.subscription_id = d.id
          and o.created_at >= ((d.local_date::timestamp - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
  ),
  ins as (
    insert into public.web_push_outbox (subscription_id, type, payload)
    select e.id, 'daily_reminder',
           jsonb_build_object('body', 'Today''s Footle, Daily 7, Trail and Mystery Player are open — five minutes, then dinner ⚽',
                              'url', '/football-wordle/')
    from eligible_v e
    returning 1
  )
  select v_inserted + count(*) into v_inserted from ins;

  -- The outbox is a queue, not a record: a week is plenty.
  delete from public.web_push_outbox where created_at < now() - interval '7 days';
  return v_inserted;
end $function$;
