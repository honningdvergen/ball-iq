-- Club-quiz result logging — owning the measurement Clarity will not surface.
--
-- WHY THIS EXISTS
-- Lever 4 of the club-page rebuild is gated on one question: are the questions
-- labelled "hard" actually hard? Eleven clubq-* signals ship on every club page
-- and fire correctly (verified live 2026-08-14: loader present, emit code
-- correct, 12 occurrences in the shipped HTML). But Clarity's reporting
-- aggregates custom API events into an unnamed "Other" bucket, so the score
-- distribution is unreadable. Rather than fight someone else's aggregation for
-- a number that gates real work, we record it ourselves.
--
-- WHAT IT RECORDS, AND WHY THAT SHAPE
-- Per finished round: correct/total per DIFFICULTY BAND, not per question.
-- The club pages render data-diff but carry no stable question id, and the
-- band-level split already answers the actual question — if hard questions are
-- answered right at roughly the medium rate, the labels are wrong. Per-question
-- calibration would need a data-qid on every rendered question; that is a
-- bigger surface for a finer answer nobody has asked for yet.
--
-- NO PERSONAL DATA. No user id, no session id, no IP, no free text. A row says
-- "someone finished a Liverpool round, 7 of 10, hard 1 of 3". Rows are not
-- joinable to a person, which is also why anon never gets read access.
--
-- SECURITY SHAPE (follows the report_question precedent exactly)
-- Prod's standing invariant is that `anon` holds ZERO table grants across every
-- table. This does not break it: the table grants nothing to anybody, RLS is on
-- with no policy, and the only way in is a SECURITY DEFINER function. Same
-- pattern the anonymous question-report path has used since launch.

create table if not exists public.club_quiz_results (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  club        text     not null,
  -- Round totals.
  total       smallint not null check (total    between 1 and 60),
  correct     smallint not null check (correct  between 0 and 60),
  -- Which round of the session this was: "Keep going" produces 2, 3, ...
  -- A rising distribution here is the staying-loop working.
  rounds      smallint not null default 1 check (rounds between 1 and 50),
  -- Per-band split. *_t is how many of that band were served this round.
  easy_c      smallint not null default 0 check (easy_c between 0 and 60),
  easy_t      smallint not null default 0 check (easy_t between 0 and 60),
  med_c       smallint not null default 0 check (med_c  between 0 and 60),
  med_t       smallint not null default 0 check (med_t  between 0 and 60),
  hard_c      smallint not null default 0 check (hard_c between 0 and 60),
  hard_t      smallint not null default 0 check (hard_t between 0 and 60),
  constraint club_quiz_correct_le_total check (correct <= total)
);

-- The read path is analytics, always "this club, recently".
create index if not exists club_quiz_results_club_created_idx
  on public.club_quiz_results (club, created_at desc);

alter table public.club_quiz_results enable row level security;

-- RLS on with NO policy = nothing reaches this table directly, by any role.
-- The revokes are belt-and-braces per the standing rule: supabase_admin
-- defaults grant anon full DML on new public tables, and a future policy
-- added without re-checking grants would silently open more than intended.
revoke all on public.club_quiz_results from public;
revoke all on public.club_quiz_results from anon;
revoke all on public.club_quiz_results from authenticated;

-- ── the only way in ──────────────────────────────────────────────────────────
create or replace function public.log_club_quiz(
  p_club    text,
  p_total   smallint,
  p_correct smallint,
  p_rounds  smallint default 1,
  p_easy_c  smallint default 0,
  p_easy_t  smallint default 0,
  p_med_c   smallint default 0,
  p_med_t   smallint default 0,
  p_hard_c  smallint default 0,
  p_hard_t  smallint default 0
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_club text := nullif(trim(p_club), '');
begin
  -- Shape gate. Anything malformed returns silently rather than raising: this
  -- is fire-and-forget telemetry from a static page, and a caller that can
  -- distinguish "rejected" from "accepted" is a caller that can probe the table.
  if v_club is null or length(v_club) > 64 then return; end if;
  if p_total is null or p_total < 1 or p_total > 60 then return; end if;
  if p_correct is null or p_correct < 0 or p_correct > p_total then return; end if;

  -- Silent throttles, same shape as report_question. Without these the table is
  -- a free write endpoint for anyone who reads our page source — and a poisoned
  -- table would corrupt the very measurement this exists to provide.
  if (select count(*) from public.club_quiz_results
        where created_at > now() - interval '1 hour') >= 3000 then
    return;  -- global hourly backstop
  end if;
  if (select count(*) from public.club_quiz_results
        where club = v_club
          and created_at > now() - interval '1 hour') >= 300 then
    return;  -- per-club hourly cap
  end if;

  insert into public.club_quiz_results
    (club, total, correct, rounds, easy_c, easy_t, med_c, med_t, hard_c, hard_t)
  values
    (v_club,
     p_total, p_correct,
     greatest(1, least(coalesce(p_rounds, 1), 50)),
     greatest(0, least(coalesce(p_easy_c, 0), 60)),
     greatest(0, least(coalesce(p_easy_t, 0), 60)),
     greatest(0, least(coalesce(p_med_c,  0), 60)),
     greatest(0, least(coalesce(p_med_t,  0), 60)),
     greatest(0, least(coalesce(p_hard_c, 0), 60)),
     greatest(0, least(coalesce(p_hard_t, 0), 60)));
end;
$function$;

-- Club pages are static and anonymous — anon is the caller that matters.
grant execute on function public.log_club_quiz(
  text, smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint) to anon, authenticated;

-- ALWAYS LAST. Without it PUBLIC keeps execute.
revoke execute on function public.log_club_quiz(
  text, smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint) from public;
