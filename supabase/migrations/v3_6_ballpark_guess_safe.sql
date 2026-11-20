-- v3_6_ballpark_guess_safe — v3_5's function could be broken for everyone by
-- one request (20 Nov 2026, found in review the same afternoon, before any
-- client that calls it had shipped; the table was empty).
--
-- What was wrong in v3_5:
--   1. The guards only asked for "> 0", so a caller could store a guess of
--      1e-310. From then on every honest call for that question divided a
--      real answer by it, overflowed float8, and errored: the comparison was
--      gone for that question until the row was deleted. One request each.
--   2. The hourly cap was counted on every call, by a scan with no index, even
--      for a device that already had its row.
--   3. One flooded question could use up the whole table's hourly cap and
--      starve the others.
--
-- What changes:
--   - A guess (and the answer a caller sends) must be a number the game's own
--     keypad can type: 0.001 to 1e12. The table's CHECK says the same.
--   - Distances are compared in log space, |ln(guess) - ln(answer)|, which
--     cannot overflow for any number in that range. Two guesses the same
--     factor out (double and half) are a tie, with a hair of tolerance so
--     float rounding cannot turn a tie into a win.
--   - The caps are only counted when there is a row to store, through an index
--     on created_at, and a single question may take at most 1,000 new rows an
--     hour of the table's 5,000.
--   - search_path names pg_temp last, explicitly.
--
-- Still true, and to be closed before the game is public (not by this file):
-- device ids are free, so a determined caller can add made-up guesses up to
-- the caps and skew a question's comparison, and can use made-up question
-- names. The fix is server-side: the question ids and answers in a table, and
-- a rate limit that sees more than a device id.
--
-- Checked against production before writing (20 Nov 2026): 0 rows, so nothing
-- to clean; the constraint is named ballpark_guesses_guess_check.

alter table public.ballpark_guesses drop constraint ballpark_guesses_guess_check;
alter table public.ballpark_guesses add constraint ballpark_guesses_guess_check
  check (guess >= 0.001 and guess <= 1e12);

create index if not exists ballpark_guesses_created_at
  on public.ballpark_guesses (created_at);

create or replace function public.ballpark_guess(
  p_question text,
  p_guess    double precision,
  p_answer   double precision,
  p_visitor  uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  my_dist  double precision;
  n_others integer;
  n_beaten integer;
begin
  if p_question is null or p_question !~ '^[a-z0-9][a-z0-9-]{1,62}$' then return null; end if;
  -- NaN sorts above every number in Postgres, so "<= 1e12" turns it away too.
  if p_guess is null or not (p_guess >= 0.001 and p_guess <= 1e12) then return null; end if;
  if p_answer is null or not (p_answer >= 0.001 and p_answer <= 1e12) then return null; end if;
  if p_visitor is null then return null; end if;

  -- Store the first guess this device locked for the question. The caps are
  -- only counted when there is something to store. Past a cap the guess is not
  -- stored but is still answered.
  if not exists (select 1 from public.ballpark_guesses
                  where question = p_question and visitor_id = p_visitor) then
    if (select count(*) from public.ballpark_guesses
         where created_at > now() - interval '1 hour') < 5000
       and (select count(*) from public.ballpark_guesses
             where question = p_question and created_at > now() - interval '1 hour') < 1000 then
      insert into public.ballpark_guesses (question, guess, visitor_id)
      values (p_question, p_guess, p_visitor)
      on conflict (question, visitor_id) do nothing;
    end if;
  end if;

  my_dist := abs(ln(p_guess) - ln(p_answer));
  select count(*),
         count(*) filter (where abs(ln(guess) - ln(p_answer)) > my_dist + 1e-9)
    into n_others, n_beaten
    from public.ballpark_guesses
   where question = p_question and visitor_id <> p_visitor;

  return jsonb_build_object('n', n_others, 'beat', n_beaten);
end;
$function$;

-- Same signature, so v3_5's grants carry over; restated so this file stands
-- on its own.
grant execute on function public.ballpark_guess(text, double precision, double precision, uuid) to anon, authenticated;
revoke all on function public.ballpark_guess(text, double precision, double precision, uuid) from public;
