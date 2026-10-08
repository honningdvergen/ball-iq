-- v2_6_daily_results_top10 — the Top 10 game joins "how everyone did".
--
-- Top 10 is scored out of ten (names found), the way Daily 7 is scored out of
-- seven: bucket = the score, won = true. The game id is hard-coded in two
-- places and BOTH must learn it: the table's CHECK, and the RPC, which returns
-- in silence for an id it does not know. A missing id therefore looks like
-- "nobody played", never like an error.
--
-- Also here: the RPC refuses a score above a scored game's total (Daily 7 over
-- 7, Top 10 over 10). The client has refused the Daily 7 case since 2026-10-04,
-- when another game's result was found leaking into it; the server did not,
-- and installed builds older than that still send what they send.
--
-- Checked against production before writing (2026-10-09): the constraint is
-- named daily_results_game_check, the function body matched v1_9 exactly, and
-- the table held 2,934 rows across the four existing games. Nothing here
-- touches a row.

alter table public.daily_results drop constraint daily_results_game_check;
alter table public.daily_results add constraint daily_results_game_check
  check (game in ('footle','daily7','trail','mystery','top10'));

comment on table public.daily_results is
  'One result per (game, edition, visitor). Written only via record_daily_result(); read via get_daily_distribution(). Feeds the "How everyone did" bars on the results panel (shown only at n>=20). bucket: guesses or clubs used when won, 0 = not solved; for daily7 and top10 it is the score.';

create or replace function public.record_daily_result(
  p_game text, p_edition integer, p_bucket integer, p_won boolean, p_visitor uuid default null
) returns void
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if p_game is null or p_game not in ('footle','daily7','trail','mystery','top10') then return; end if;
  if p_edition is null or p_edition < 0 or p_edition > 100000 then return; end if;
  if p_bucket is null or p_bucket < 0 or p_bucket > 30 then return; end if;
  -- A score above the game's total is another game's result leaking in.
  if (p_game = 'daily7' and p_bucket > 7) or (p_game = 'top10' and p_bucket > 10) then return; end if;
  -- p_visitor may be NULL: native builds send no identifier (store-listing
  -- promise). Those rows dedupe client-side only.
  -- Rate limit, same posture as record_funnel_event: a runaway client cannot
  -- fill the table.
  if (select count(*) from public.daily_results where created_at > now() - interval '1 hour') >= 5000 then
    return;
  end if;
  insert into public.daily_results (game, edition, bucket, won, visitor_id, user_id)
  values (p_game, p_edition, p_bucket, coalesce(p_won, true), p_visitor, auth.uid())
  on conflict (game, edition, visitor_id) where visitor_id is not null do nothing;
end;
$function$;

-- Same signature, so the existing grants carry over; restated so this file
-- stands on its own.
grant execute on function public.record_daily_result(text, integer, integer, boolean, uuid) to anon, authenticated;
revoke all on function public.record_daily_result(text, integer, integer, boolean, uuid) from public;
