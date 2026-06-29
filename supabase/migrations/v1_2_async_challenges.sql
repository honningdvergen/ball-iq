-- 1.2 Async Challenges — challenge a friend to your EXACT question set.
--
-- A finished quiz can become a shareable balliq.app/c/<token> link: the
-- challenger's exact set (by question id) + their score are stored; a friend who
-- opens the link plays the SAME set and their result is recorded back, so both
-- sides can see who won. Works for ANY mode (club:Arsenal, classic, …), not just
-- the Daily 7. The token is DOT-FREE so the client can tell it apart from the
-- legacy "SCORE.YYYYMMDD.Name" Daily-7 challenge string (which the /c/ parser
-- still handles).
--
-- Access is RPC-only: RLS denies all direct table access; the SECURITY DEFINER
-- RPCs are the sole path. create_challenge needs auth; get/submit are open to
-- anon too (a shared challenge is playable by guests). NOT YET DEPLOYED — deploy
-- with the client wiring + a round of testing.

-- ── table ─────────────────────────────────────────────────────────────────────
create table if not exists public.challenge_invites (
  id               text primary key,
  challenger_id    uuid not null,
  challenger_name  text not null default 'A friend',
  mode             text not null,
  question_ids     jsonb not null,
  challenger_score int  not null,
  challenger_total int  not null,
  created_at       timestamptz not null default now(),
  accepted_id      uuid,
  accepted_name    text,
  accepted_score   int,
  accepted_total   int,
  accepted_at      timestamptz
);

create index if not exists challenge_invites_challenger_idx
  on public.challenge_invites (challenger_id, created_at desc);

-- RLS on; deny direct access (RPCs are SECURITY DEFINER and bypass it).
alter table public.challenge_invites enable row level security;

-- supabase_admin grants anon/authenticated full DML on new public tables by
-- default — revoke it so the only access path is the RPCs below.
revoke all on public.challenge_invites from anon, authenticated;

-- ── create (challenger; auth required) ─────────────────────────────────────────
create or replace function public.create_challenge(
  p_mode text, p_question_ids jsonb, p_score int, p_total int, p_name text default null
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_id  text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_question_ids is null
     or jsonb_typeof(p_question_ids) <> 'array'
     or jsonb_array_length(p_question_ids) = 0
     or jsonb_array_length(p_question_ids) > 30 then
    raise exception 'invalid question set' using errcode = '22023';
  end if;
  -- 10-char dot-free token (no '-'); ~40 bits, fine at this scale.
  v_id := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  insert into public.challenge_invites
    (id, challenger_id, challenger_name, mode, question_ids, challenger_score, challenger_total)
  values
    (v_id, v_uid, coalesce(nullif(trim(p_name), ''), 'A friend'),
     p_mode, p_question_ids, greatest(p_score, 0), greatest(p_total, 1));
  return v_id;
end;
$function$;

-- ── read (anyone with the token; user ids stripped) ────────────────────────────
create or replace function public.get_challenge(p_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v jsonb;
begin
  select to_jsonb(c) - 'challenger_id' - 'accepted_id'
    into v
  from public.challenge_invites c
  where c.id = p_id;
  return v; -- null if not found
end;
$function$;

-- ── record the friend's result (only the FIRST finisher takes the slot) ────────
create or replace function public.submit_challenge_result(
  p_id text, p_score int, p_total int, p_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v jsonb;
begin
  update public.challenge_invites c
     set accepted_id    = auth.uid(),
         accepted_name  = coalesce(nullif(trim(p_name), ''), c.accepted_name, 'A friend'),
         accepted_score = greatest(p_score, 0),
         accepted_total = greatest(p_total, 1),
         accepted_at    = now()
   where c.id = p_id
     and c.accepted_at is null;
  select to_jsonb(c) - 'challenger_id' - 'accepted_id'
    into v
  from public.challenge_invites c
  where c.id = p_id;
  return v;
end;
$function$;

-- ── grants (RPC-only; revoke execute from public per house rule) ───────────────
grant execute on function public.create_challenge(text, jsonb, int, int, text) to authenticated;
revoke execute on function public.create_challenge(text, jsonb, int, int, text) from public;

grant execute on function public.get_challenge(text) to anon, authenticated;
revoke execute on function public.get_challenge(text) from public;

grant execute on function public.submit_challenge_result(text, int, int, text) to anon, authenticated;
revoke execute on function public.submit_challenge_result(text, int, int, text) from public;
