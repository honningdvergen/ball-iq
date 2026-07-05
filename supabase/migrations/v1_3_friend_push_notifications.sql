-- 1.3 Friend-request / friend-accept PUSH notifications.
--
-- The in-app inbox intentionally reads incoming friend requests LIVE from the
-- friendships table (see v1_3_notifications.sql header) — that stays unchanged.
-- Native push, however, is driven by the Database Webhook on INSERTs into
-- public.notifications (→ send-push edge fn). So friendship events need a
-- notifications row purely as a push vehicle.
--
-- Trick: the trigger inserts the row with read = TRUE. The webhook fires on
-- INSERT regardless (banner delivered), but the inbox's unread-only query
-- (read = false) skips it — no duplicate next to the live friendships entry,
-- and nothing piles up unread.
--
-- Deploy together with v1_3_push_tokens.sql + the send-push edge fn
-- (docs/PUSH_DEPLOY.md); the edge fn already builds alerts for both types.

-- ── widen the type check ──────────────────────────────────────────────────────
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('play_invite', 'friend_request', 'friend_accept'));

-- ── trigger function ──────────────────────────────────────────────────────────
-- SECURITY DEFINER: the acting user is `authenticated`, which deliberately has
-- no INSERT grant on notifications — the definer (postgres) does.
create or replace function public.notify_friendship_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    -- "X sent you a friend request" → addressee
    insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload, read)
    select new.addressee_id, 'friend_request', new.requester_id, p.username, p.avatar_id,
           jsonb_build_object('friendship_id', new.id), true
    from public.profiles p where p.id = new.requester_id;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    -- "X accepted your friend request" → requester
    insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload, read)
    select new.requester_id, 'friend_accept', new.addressee_id, p.username, p.avatar_id,
           jsonb_build_object('friendship_id', new.id), true
    from public.profiles p where p.id = new.addressee_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_friendship_event() from public;

drop trigger if exists friendships_notify_request on public.friendships;
create trigger friendships_notify_request
  after insert on public.friendships
  for each row execute function public.notify_friendship_event();

drop trigger if exists friendships_notify_accept on public.friendships;
create trigger friendships_notify_accept
  after update of status on public.friendships
  for each row execute function public.notify_friendship_event();
