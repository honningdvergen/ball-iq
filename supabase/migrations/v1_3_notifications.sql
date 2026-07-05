-- 1.3 Notifications — server-recorded social events for the in-app notification
-- center (and, later, native push).
--
-- Phase 1 of the notification center reads INCOMING FRIEND REQUESTS live from the
-- friendships table (no row here), so this table is for events that otherwise
-- leave no server record — starting with PLAY INVITES ("X invited you to a game",
-- with the room code so a "Join" button can deep-link straight into the lobby).
-- The `type` check is intentionally narrow now and widened as new kinds land.
--
-- Security model: recipients can SELECT / UPDATE (mark read) / DELETE (dismiss)
-- only their OWN rows. Clients CANNOT INSERT directly — inserts flow through the
-- SECURITY DEFINER send_play_invite() RPC, which verifies the two users are
-- accepted friends before writing, so nobody can spam-notify a stranger.
--
-- NOT YET DEPLOYED until the client wiring (challengeFriend -> send_play_invite,
-- inbox "Join" action) ships alongside.

-- ── table ─────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,  -- recipient
  type         text not null check (type in ('play_invite')),              -- widen as kinds are added
  actor_id     uuid references auth.users(id) on delete set null,          -- who triggered it
  actor_name   text,
  actor_avatar text,
  payload      jsonb not null default '{}'::jsonb,                          -- e.g. {"code":"ABC123"}
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Recipients own their rows: read + mark-read + dismiss. No client INSERT policy
-- (inserts happen only via the RPC below, which runs as definer).
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notifications_delete_own on public.notifications
  for delete using (auth.uid() = user_id);

-- supabase_admin's defaults grant anon/authenticated full DML on new public
-- tables — revoke, then re-grant only the recipient-facing verbs. No INSERT.
revoke all on public.notifications from anon, authenticated;
grant select, update, delete on public.notifications to authenticated;

-- Unread-first lookup for the bell/inbox.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read, created_at desc);

-- ── send_play_invite: sender creates a notification row for the RECIPIENT ──────
-- SECURITY DEFINER so the sender can insert a row they don't own (RLS otherwise
-- blocks it). Guarded: caller must be authenticated AND already an accepted
-- friend of the addressee — so invites can't be used to spam strangers.
create or replace function public.send_play_invite(p_addressee uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_friends boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_addressee is null or p_addressee = auth.uid() then
    raise exception 'invalid addressee';
  end if;
  select exists(
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = p_addressee)
        or (f.addressee_id = auth.uid() and f.requester_id = p_addressee))
  ) into v_friends;
  if not v_friends then
    raise exception 'not friends';
  end if;
  insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload)
  select p_addressee, 'play_invite', auth.uid(), p.username, p.avatar_id,
         jsonb_build_object('code', coalesce(p_code, ''))
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

revoke execute on function public.send_play_invite(uuid, text) from public;
grant execute on function public.send_play_invite(uuid, text) to authenticated;
