-- ============================================================================
-- v1.3 — user_reports alerting (App Store 1.2 backstop)
-- ============================================================================
--
-- PROBLEM. `user_reports` is a write-only black hole. sprint84_aaa3 shipped the
-- table with "we read reports manually via the dashboard" — but nothing tells
-- anyone a report exists, so "manually" means "never". The report button
-- currently satisfies review and nothing else: a real abuse report lands in a
-- table no human is subscribed to.
--
-- APPROACH. Do NOT build a channel. Reuse the one that already works in prod:
--
--   notifications INSERT → send_push_on_notification trigger → send-push edge
--   function → APNs → Alex's phone
--
-- Two properties of that pipeline (both verified against the deployed code, not
-- assumed) are what make this cheap:
--
--   1. send-push's buildAlert() has a `default` branch:
--        body: p.body || "You have a new notification"
--      so a NEW notification type with `payload.body` set renders custom copy.
--      => NO edge-function change, NO redeploy.
--
--   2. notify_friendship_event() already inserts notifications rows with
--      read = TRUE on purpose: the push trigger is AFTER INSERT (unconditional),
--      while the in-app bell queries `.eq("read", false)` (App.jsx, loadNotifs).
--      read=true therefore fires the push and stays OUT of the bell.
--      => NO client change. A moderation alert cannot render as a bogus
--         play-invite in the notification list.
--
-- So this migration is DB-only and self-contained.
--
-- ── DECISION REQUIRED FROM ALEX (this is why it lands inert) ────────────────
-- Alerting needs to know WHO to alert. Rather than hardcode a UUID (unknowable
-- from the repo, and a landmine if the account changes), this adds a
-- `public.moderators` table that is EMPTY on apply.
--
--   Empty moderators  =>  the trigger fans out to zero rows  =>  it inserts
--   nothing, pushes nothing, and changes no existing behaviour. INERT.
--
-- To turn alerting ON, Alex runs ONE statement (service_role / SQL editor):
--
--   insert into public.moderators (user_id, note)
--   select id, 'Alex — primary' from auth.users where email = '<his address>';
--
-- From that moment every user report pushes to his phone. To turn it off:
-- `delete from public.moderators;`. No redeploy either way.
--
-- CAVEAT ON THE PUSH LEG: a push only lands if that account has a row in
-- device_tokens (iOS only today — register_device_token defaults platform
-- 'ios'). If Alex has no device token, the notifications row is still written
-- and is still readable via list_user_reports() below; only the phone buzz is
-- missing. Alerting degrades to a read surface rather than breaking.
--
-- DELIBERATELY NOT IN SCOPE: email/Slack alerting (needs a new edge function +
-- a provider secret), and an in-app moderation UI (needs client work owned
-- elsewhere). The read surface here is an RPC, callable from the SQL editor or
-- any signed-in moderator client, which is strictly more than exists today.
--
-- Reverse DDL (if rollback needed):
--   drop trigger if exists user_reports_notify_moderators on public.user_reports;
--   drop function if exists public.notify_user_report();
--   drop function if exists public.list_user_reports(int);
--   drop policy if exists "Moderators can read reports" on public.user_reports;
--   revoke select on public.user_reports from authenticated;
--   drop function if exists public.is_moderator();
--   drop table if exists public.moderators;
--   alter table public.notifications drop constraint if exists notifications_type_check;
--   alter table public.notifications add constraint notifications_type_check
--     check (type in ('play_invite','friend_request','friend_accept'));
-- ============================================================================


-- ─── moderators ─────────────────────────────────────────────────────────────
-- Deliberately NOT client-writable and not client-readable: membership is a
-- privilege boundary, so it is service_role-only (RLS on, zero policies, zero
-- grants). is_moderator() below is the only way a client-side check can see it,
-- and it is SECURITY DEFINER precisely so the RLS here can stay absolute.
create table if not exists public.moderators (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- House rule: supabase_admin's defaults grant anon/authenticated full DML on
-- new public tables. Revoke before anything else; grant nothing back.
revoke all on public.moderators from public, anon, authenticated;

alter table public.moderators enable row level security;

-- No policies on purpose. service_role bypasses RLS; nobody else reads or
-- writes this table, ever.


-- ─── is_moderator() ─────────────────────────────────────────────────────────
-- SECURITY DEFINER so the caller can be gated on membership WITHOUT being able
-- to read the moderators table (a plain `exists (select 1 from moderators ...)`
-- inside a policy would be evaluated as the calling user, hit the RLS above,
-- and silently return false forever — a trap worth naming). Same shape as the
-- existing is_room_member() helper.
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.moderators where user_id = auth.uid());
$$;

grant execute on function public.is_moderator() to authenticated;
revoke execute on function public.is_moderator() from public;


-- ─── read surface: moderator-gated SELECT on user_reports ───────────────────
-- sprint84_aaa3 left user_reports with INSERT only and no SELECT policy. Give
-- moderators a real read path. Inert while moderators is empty: is_moderator()
-- returns false for every caller, so the policy denies everyone exactly as
-- today.
grant select on public.user_reports to authenticated;

drop policy if exists "Moderators can read reports" on public.user_reports;
create policy "Moderators can read reports"
  on public.user_reports
  for select
  to authenticated
  using (public.is_moderator());

-- Still no UPDATE / DELETE policy: the moderation trail is append-only by
-- design (v1_3_moderation_trail_and_report_throttle dropped the reported_id FK
-- specifically so reports survive the reported account's deletion).


-- ─── list_user_reports() ────────────────────────────────────────────────────
-- Joins the reporter/reported usernames on, which a raw SELECT cannot do
-- usefully (reported_id has no FK by design). Returns nothing for non-
-- moderators rather than raising — a permission error here would be a
-- membership oracle.
create or replace function public.list_user_reports(
  p_limit int default 100
)
returns table (
  id            uuid,
  reporter_id   uuid,
  reporter_name text,
  reported_id   uuid,
  reported_name text,
  reason        text,
  message       text,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
         r.reporter_id,
         rp.username,
         r.reported_id,
         tp.username,
         r.reason,
         r.message,
         r.created_at
  from public.user_reports r
  left join public.profiles rp on rp.id = r.reporter_id
  left join public.profiles tp on tp.id = r.reported_id
  where public.is_moderator()
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

grant execute on function public.list_user_reports(int) to authenticated;
revoke execute on function public.list_user_reports(int) from public;


-- ─── widen the notifications type check ─────────────────────────────────────
-- Same pattern as v1_3_friend_push_notifications. Prod currently allows
-- (play_invite | friend_request | friend_accept) — verified against
-- prod-snapshot/schema.md.
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('play_invite', 'friend_request', 'friend_accept', 'moderation_report'));


-- ─── notify_user_report() ───────────────────────────────────────────────────
-- SECURITY DEFINER: clients have no INSERT grant on notifications (by design —
-- inserts flow through definer functions only).
create or replace function public.notify_user_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The moderation trail matters more than the alert. If anything in here
  -- fails (notifications gone, CHECK drift, webhook trigger erroring), the
  -- user's report MUST still be recorded — so swallow rather than propagate.
  -- An alert that fails loudly by discarding the evidence is worse than the
  -- silence this migration exists to fix.
  begin
    insert into public.notifications
      (user_id, type, actor_id, actor_name, actor_avatar, payload, read)
    select m.user_id,
           'moderation_report',
           new.reporter_id,
           coalesce(rp.username, 'Someone'),
           rp.avatar_id,
           jsonb_build_object(
             'report_id',   new.id,
             'reported_id', new.reported_id,
             'reason',      new.reason,
             -- send-push's default branch renders payload.body verbatim. Keep
             -- it neutral: the reported username is itself the alleged abuse
             -- (reason 'offensive_username'), so it must never be pushed to a
             -- lock screen. Identities are in the payload; read them via
             -- list_user_reports().
             'body',        'New user report (' || new.reason || ') — review in Ball IQ admin.'
           ),
           -- read=true: fires the push trigger, stays out of the in-app bell
           -- (which filters read=false). Same trick as notify_friendship_event.
           true
    from public.moderators m
    left join public.profiles rp on rp.id = new.reporter_id;
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- Trigger functions are invoked by the table owner, not called directly.
revoke execute on function public.notify_user_report() from public;

drop trigger if exists user_reports_notify_moderators on public.user_reports;
create trigger user_reports_notify_moderators
  after insert on public.user_reports
  for each row execute function public.notify_user_report();


-- ============================================================================
-- Verification (run after applying, as service_role):
--
--   -- 1. INERT until a moderator exists: report inserts, zero notifications.
--   select count(*) from public.moderators;                      -- expect 0
--   insert into public.user_reports (reporter_id, reported_id, reason)
--     values ('<user-a>', '<user-b>', 'spam');
--   select count(*) from public.notifications
--     where type = 'moderation_report';                          -- expect 0
--
--   -- 2. Arm it, then report again: one notification per moderator, read=true.
--   insert into public.moderators (user_id, note) values ('<alex-uuid>', 'Alex');
--   insert into public.user_reports (reporter_id, reported_id, reason)
--     values ('<user-a>', '<user-b>', 'harassment');
--   select user_id, type, read, payload->>'body' from public.notifications
--     where type = 'moderation_report';       -- 1 row, read=t, neutral body
--
--   -- 3. The bell is unaffected (this is the client's exact query shape):
--   select count(*) from public.notifications
--     where user_id = '<alex-uuid>' and read = false;            -- unchanged
--
--   -- 4. Read surface gated: as a NON-moderator client, both return empty.
--   select public.is_moderator();                                -- expect f
--   select * from public.list_user_reports();                    -- expect 0 rows
--
--   -- 5. anon holds no grant on the new table (house rule):
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'moderators';                            -- expect 0 rows
--
--   -- 6. Report survives a broken alert path (trail > alert):
--   alter table public.notifications drop constraint notifications_type_check;
--   alter table public.notifications add constraint notifications_type_check
--     check (type in ('play_invite'));   -- simulate CHECK drift
--   insert into public.user_reports (reporter_id, reported_id, reason)
--     values ('<user-a>', '<user-b>', 'other');                  -- must SUCCEED
--   -- (then restore the 4-value constraint from the widen block above)
-- ============================================================================
