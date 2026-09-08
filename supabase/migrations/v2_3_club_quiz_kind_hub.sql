-- The localised hubs (/id/quiz/, /es/quiz/, …) and the partners page embed the
-- quiz widget with no data-kind, so since v2_0 they filed as kind='unknown' and
-- — through the funnel's surface fallback — as club pages: 24 rows across 3 hub
-- slugs in the first day (bloodhound 2026-09-08). The pages now declare
-- kind='hub'; this lets the table keep it instead of normalising it away.
alter table public.club_quiz_results drop constraint if exists club_quiz_results_kind_check;
alter table public.club_quiz_results add constraint club_quiz_results_kind_check
  check (kind in ('club','player','nation','category','list','hub','unknown'));

-- log_club_quiz, verbatim from v2_0 except that 'hub' survives normalisation.
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
  p_hard_t  smallint default 0,
  p_kind    text     default 'unknown',
  p_lang    text     default 'en'
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_club text := nullif(trim(lower(p_club)), '');
  v_kind text := lower(coalesce(nullif(trim(p_kind), ''), 'unknown'));
  v_lang text := lower(coalesce(nullif(trim(p_lang), ''), 'en'));
begin
  -- Shape gate. Silent return, never raise: this is fire-and-forget telemetry
  -- from a static page, and a caller that can tell "rejected" from "accepted"
  -- is a caller that can probe the table.
  if v_club is null or length(v_club) > 64 then return; end if;
  if p_total   is null or p_total < 1 or p_total > 60 then return; end if;
  if p_correct is null or p_correct < 0 or p_correct > p_total then return; end if;

  -- An unrecognised class or language is normalised, never rejected: losing
  -- the round is worse than filing it as unknown.
  if v_kind not in ('club','player','nation','category','list','hub') then v_kind := 'unknown'; end if;
  if v_lang !~ '^[a-z]{2}$' then v_lang := 'en'; end if;

  -- Silent throttles, unchanged in size. The per-slug cap is now also per-lang,
  -- so a busy English page cannot throttle its Spanish twin.
  if (select count(*) from public.club_quiz_results
        where created_at > now() - interval '1 hour') >= 3000 then
    return;
  end if;
  if (select count(*) from public.club_quiz_results
        where club = v_club and lang = v_lang
          and created_at > now() - interval '1 hour') >= 300 then
    return;
  end if;

  insert into public.club_quiz_results
    (club, kind, lang, total, correct, rounds,
     easy_c, easy_t, med_c, med_t, hard_c, hard_t)
  values
    (v_club, v_kind, v_lang,
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

grant execute on function public.log_club_quiz(text, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, text, text) to anon, authenticated;
revoke execute on function public.log_club_quiz(text, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, smallint, text, text) from public;
