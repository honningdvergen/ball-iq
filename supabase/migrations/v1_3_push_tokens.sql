-- 1.3 Notifications Phase 2 — device tokens for native remote push (APNs).
--
-- Stores each signed-in device's APNs token so the send-push edge function can
-- target a user's devices. Registration flows through a SECURITY DEFINER RPC
-- (register_device_token) rather than a raw upsert, so re-homing a device to a
-- new account is handled correctly (the RPC clears any prior owner of that token
-- before inserting) without needing a cross-user UPDATE policy.
--
-- NOT DEPLOYED until the client wiring (registerPush after sign-in) + the
-- send-push edge function ship alongside.

-- ── table ─────────────────────────────────────────────────────────────────────
create table if not exists public.device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,  -- owner
  token      text not null unique,                                        -- APNs device token
  platform   text not null default 'ios',
  updated_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

-- Owner can see + delete their own tokens (delete = sign-out cleanup). Inserts
-- go through the RPC below (SECURITY DEFINER), so no client INSERT/UPDATE policy.
create policy device_tokens_select_own on public.device_tokens
  for select using (auth.uid() = user_id);
create policy device_tokens_delete_own on public.device_tokens
  for delete using (auth.uid() = user_id);

-- supabase_admin defaults grant anon/authenticated full DML on new public tables
-- — revoke, then re-grant only what the client needs (select + delete). The
-- send-push edge function reads with the service_role key, which bypasses RLS.
revoke all on public.device_tokens from anon, authenticated;
grant select, delete on public.device_tokens to authenticated;

create index if not exists device_tokens_user_idx on public.device_tokens (user_id);

-- ── register_device_token: upsert this device's token for the caller ──────────
-- SECURITY DEFINER: clears any prior owner of the token (device re-homed to a
-- new account) then inserts a fresh row owned by the caller. Auth required.
create or replace function public.register_device_token(p_token text, p_platform text default 'ios')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid token';
  end if;
  delete from public.device_tokens where token = p_token;
  insert into public.device_tokens (user_id, token, platform)
  values (auth.uid(), p_token, coalesce(p_platform, 'ios'));
end;
$$;

revoke execute on function public.register_device_token(text, text) from public;
grant execute on function public.register_device_token(text, text) to authenticated;
