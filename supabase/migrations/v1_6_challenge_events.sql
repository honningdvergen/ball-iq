-- Challenge-token events: makes the /c/ "beat my Daily 7" loop measurable.
-- (scouting panel, Social 6/C; k-factor.sql calls this loop out as a blind
-- spot — challenge links leave no server-side trace, so the measured k is a
-- floor.)
--
-- Shape: two events per token lifecycle. 'open' = a /c/ link was captured
-- from the URL (fires once per link-open, at the same spot the client parses
-- the token — restores from localStorage do NOT re-fire). 'played' = the
-- recipient finished the Daily 7 with that challenge pending (the head-to-
-- head settled). open→played conversion is the loop's health number.
--
-- Access model: /c/ links are opened by ANONYMOUS visitors, so recording
-- must be reachable by anon — but the anon-REVOKE discipline stands: the
-- TABLE has zero client grants and RLS with no policies; the only door is
-- the SECURITY DEFINER RPC below, which validates everything, silently
-- swallows garbage, and carries report_question's global hourly throttle.

create table public.challenge_events (
  id             uuid primary key default gen_random_uuid(),
  event          text not null check (event in ('open','played')),
  challenge_date date not null,
  sender_score   int  check (sender_score between 0 and 7),
  sender_name    text check (char_length(sender_name) <= 24),
  visitor_id     uuid,               -- auth.uid() at event time; null = signed-out visitor
  my_score       int  check (my_score between 0 and 7),  -- 'played' only
  created_at     timestamptz not null default now()
);

comment on table public.challenge_events is
  'Insert-only measurement log for /c/ Daily-7 challenge links. Written solely via record_challenge_event(); read via service tooling only.';

alter table public.challenge_events enable row level security;
-- No policies on purpose: PostgREST can neither read nor write this table.
revoke all on table public.challenge_events from public;
revoke all on table public.challenge_events from anon;
revoke all on table public.challenge_events from authenticated;

create index challenge_events_created_at_idx on public.challenge_events (created_at);
create index challenge_events_date_event_idx on public.challenge_events (challenge_date, event);

create or replace function public.record_challenge_event(
  p_event    text,
  p_date     text,               -- token date, YYYYMMDD (as the client parses it)
  p_score    int  default null,  -- sender's score from the token
  p_name     text default null,  -- sender's display name from the token
  p_my_score int  default null   -- recipient's score ('played' only)
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_date date;
begin
  -- Measurement must never throw at a visitor: every invalid input is a
  -- silent return, mirroring report_question's throttle philosophy.
  if p_event is null or p_event not in ('open','played') then return; end if;

  begin
    v_date := to_date(p_date, 'YYYYMMDD');
  exception when others then
    return;
  end;
  -- Tokens older than the app itself or from the future are garbage/abuse.
  if v_date < date '2026-01-01' or v_date > current_date + 2 then return; end if;

  -- Global hourly backstop (same shape as report_question): an abuser can
  -- at worst write 500 tiny rows an hour, and honest traffic is nowhere near.
  if (select count(*) from public.challenge_events
        where created_at > now() - interval '1 hour') >= 500 then
    return;
  end if;

  insert into public.challenge_events
    (event, challenge_date, sender_score, sender_name, visitor_id, my_score)
  values (
    p_event,
    v_date,
    case when p_score between 0 and 7 then p_score end,
    left(nullif(trim(p_name), ''), 24),
    auth.uid(),
    case when p_my_score between 0 and 7 then p_my_score end
  );
end;
$$;

grant execute on function public.record_challenge_event(text, text, int, text, int) to anon;
grant execute on function public.record_challenge_event(text, text, int, text, int) to authenticated;
revoke execute on function public.record_challenge_event(text, text, int, text, int) from public;
