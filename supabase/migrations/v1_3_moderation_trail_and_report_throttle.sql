-- Two security-backend lows from the 2026-07 medical exam.
-- APPLIED TO PROD 2026-07-13 via connector (v1_3_moderation_trail_and_report_throttle)
-- and verified: reported_id FK dropped, reporter_id FK retained, throttle live.
--
-- 1. user_reports: reported_id was ON DELETE CASCADE, so a reported user
--    deleting their account erased every report ABOUT them — defeating the
--    "retain moderation trail" intent that delete_user_account documents.
--    Drop that FK (column stays NOT NULL; the orphaned uuid maps to no
--    account, exactly as the deletion routine's comment describes).
--    reporter_id's cascade is KEPT deliberately: your own submitted reports
--    dying with your account is the GDPR-correct behavior.
alter table public.user_reports drop constraint user_reports_reported_id_fkey;

-- 2. report_question: anon-callable with no rate limiting or dedup. Silent
--    throttles (spammers learn nothing; legit UX unchanged): per-question
--    20/hour, global 200/hour backstop, signed-in one-report-per-question.
create or replace function public.report_question(
  p_question_id text,
  p_question_text text,
  p_picked text default null::text,
  p_correct text default null::text,
  p_mode text default null::text,
  p_reason text default null::text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_qid text := nullif(trim(p_question_id), '');
begin
  if p_question_text is null or length(trim(p_question_text)) = 0 then
    raise exception 'question text required' using errcode = '22023';
  end if;

  -- Silent throttles (return without inserting; callers can't distinguish).
  if (select count(*) from public.question_reports
        where created_at > now() - interval '1 hour') >= 200 then
    return; -- global hourly backstop
  end if;
  if v_qid is not null and
     (select count(*) from public.question_reports
        where question_id = v_qid
          and created_at > now() - interval '1 hour') >= 20 then
    return; -- per-question hourly cap
  end if;
  if auth.uid() is not null and v_qid is not null and
     exists (select 1 from public.question_reports
               where reporter_id = auth.uid() and question_id = v_qid) then
    return; -- signed-in dedup: one report per user per question
  end if;

  insert into public.question_reports
    (question_id, question_text, picked, correct_answer, mode, reason, reporter_id)
  values
    (v_qid,
     left(p_question_text, 600),
     left(p_picked, 300),
     left(p_correct, 300),
     left(p_mode, 60),
     left(p_reason, 600),
     auth.uid());
end;
$function$;
