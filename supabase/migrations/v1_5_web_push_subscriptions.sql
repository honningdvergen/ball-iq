-- v1.5 — Web Push subscriptions.
--
-- The native reminder engine (src/lib/notifications.js) covers iOS and Android
-- and covers them well. It cannot touch a web player, and web is where the
-- ~302 SEO pages land people — so every visitor who arrives from search and
-- never installs is currently unreachable after they close the tab.
--
-- One row per browser+device, not per user: a person with a phone PWA and a
-- desktop Chrome legitimately has two, and both should fire.

create table if not exists public.web_push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- The full PushSubscription.toJSON() — endpoint + keys{p256dh,auth}. Stored
  -- whole because the sender needs it verbatim; picking it apart buys nothing.
  subscription jsonb not null,
  -- Denormalised out of `subscription` purely to hang a UNIQUE on it. The
  -- endpoint IS the identity of a subscription, so re-subscribing the same
  -- browser must update rather than accumulate duplicates — otherwise a user
  -- who toggles permission a few times gets three copies of every push.
  endpoint    text not null unique,
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_user_id_idx
  on public.web_push_subscriptions (user_id);

-- ⚠️ REVOKE FIRST. supabase_admin's defaults grant `anon` full DML on new
-- public tables, and the failure is silent — nothing errors, the data is just
-- exposed. Prod currently holds ZERO anon table grants across all 13 tables;
-- this table must not be the one that breaks that.
alter table public.web_push_subscriptions enable row level security;
revoke all on table public.web_push_subscriptions from public;
revoke all on table public.web_push_subscriptions from anon;
revoke all on table public.web_push_subscriptions from authenticated;

-- Own rows only. A push endpoint is a capability: anyone holding it can send
-- notifications to that browser, so this table is closer to a credential store
-- than to profile data and is scoped accordingly.
grant select, insert, update, delete on table public.web_push_subscriptions to authenticated;

create policy web_push_own_select on public.web_push_subscriptions
  for select to authenticated using (auth.uid() = user_id);
create policy web_push_own_insert on public.web_push_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy web_push_own_update on public.web_push_subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy web_push_own_delete on public.web_push_subscriptions
  for delete to authenticated using (auth.uid() = user_id);

comment on table public.web_push_subscriptions is
  'Web Push endpoints, one per browser. RLS: own rows only. The sender (edge '
  'function) reads these with the service role. Prune on 404 AND 410 — 410 is '
  'Gone, 404 is a dead endpoint, and only pruning 410 leaks rows forever.';
