-- 1.2 Question reports — let players flag a question they believe is wrong.
--
-- Accuracy IS the product: a fan who's certain we got an answer wrong currently
-- has no outlet except a 1-star review. A one-tap "Report this question" on the
-- answer reveal captures {question id, their pick, our answer, mode} so we can
-- (a) defuse that frustration in-app and (b) feed the question-bank health audit
-- a real signal of which items to re-check.
--
-- Access is RPC-only: RLS denies all direct table access; the SECURITY DEFINER
-- report_question RPC is the sole write path and is open to anon too (guests play
-- and can report). Reads are admin-only (no read RPC; query via service_role /
-- dashboard). DEPLOYED with the client wiring.

-- ── table ─────────────────────────────────────────────────────────────────────
create table if not exists public.question_reports (
  id              uuid primary key default gen_random_uuid(),
  question_id     text,
  question_text   text not null,
  picked          text,
  correct_answer  text,
  mode            text,
  reason          text,
  reporter_id     uuid,
  created_at      timestamptz not null default now()
);

create index if not exists question_reports_qid_idx
  on public.question_reports (question_id, created_at desc);

-- RLS on; deny direct access (the RPC is SECURITY DEFINER and bypasses it).
alter table public.question_reports enable row level security;

-- supabase_admin grants anon/authenticated full DML on new public tables by
-- default — revoke it so the only write path is report_question() below.
revoke all on public.question_reports from anon, authenticated;

-- ── report (anyone, incl. guests) ──────────────────────────────────────────────
create or replace function public.report_question(
  p_question_id text,
  p_question_text text,
  p_picked text default null,
  p_correct text default null,
  p_mode text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- A flagged item must carry its text so we can review it without a bank lookup.
  if p_question_text is null or length(trim(p_question_text)) = 0 then
    raise exception 'question text required' using errcode = '22023';
  end if;
  insert into public.question_reports
    (question_id, question_text, picked, correct_answer, mode, reason, reporter_id)
  values
    (nullif(trim(p_question_id), ''),
     left(p_question_text, 600),
     left(p_picked, 300),
     left(p_correct, 300),
     left(p_mode, 60),
     left(p_reason, 600),
     auth.uid());
end;
$function$;

-- ── grants (RPC-only; revoke execute from public per house rule) ───────────────
grant execute on function public.report_question(text, text, text, text, text, text) to anon, authenticated;
revoke execute on function public.report_question(text, text, text, text, text, text) from public;
