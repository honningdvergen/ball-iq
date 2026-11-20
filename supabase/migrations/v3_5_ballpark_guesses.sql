-- v3_5_ballpark_guesses — Ballpark learns "closer than N others" (20 Nov 2026).
--
-- Ballpark (the hidden web prototype, screens/Ballpark.jsx) scores a guess by
-- how far it is from the true number. Alex, 20 Nov 2026, asked for the line
-- that makes that worth sharing: how the guess did against everyone else's.
-- That needs the guesses kept somewhere. This is the smallest thing that does it.
--
-- One row per (question, visitor): the FIRST number a device locked for a
-- question, and nothing about who they are beyond the random device id the
-- daily results already use (biq_vid). No user id is stored, so there is
-- nothing here for delete_account to clear. Web only: the native apps do not
-- have the game, and they send no device id.
--
-- Written and read only through ballpark_guess(). The function is told the
-- true answer by the caller, on purpose: the answers live in the client's data
-- file (data/ballparkQuestions.json), not in the database, and a caller who
-- lies about the answer only changes the number THEY are shown. What they can
-- do to others is add one row per question per device id, which is the same
-- exposure record_daily_result has, behind the same hourly cap.
--
-- Checked against production before writing (20 Nov 2026): no table, function
-- or sequence named ballpark_* exists.

create table if not exists public.ballpark_guesses (
  id          bigserial primary key,
  question    text             not null check (question ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  guess       double precision not null check (guess > 0 and guess < 1e13),
  visitor_id  uuid             not null,
  created_at  timestamptz      not null default now()
);
-- One guess a question a device; also the index every read goes through.
create unique index if not exists ballpark_guesses_one_per_visitor
  on public.ballpark_guesses (question, visitor_id);
comment on table public.ballpark_guesses is
  'Ballpark: the first number each device locked for a question. Written and read only via ballpark_guess(). Feeds "closer than N others" on the reveal. No user id, web only.';

alter table public.ballpark_guesses enable row level security;
-- No policies: nobody reads or writes the rows directly. Defaults grant anon
-- full DML on a new table (and usage on its sequence), so revoke explicitly
-- (standing rule).
revoke all on table public.ballpark_guesses from anon, authenticated, public;
revoke all on sequence public.ballpark_guesses_id_seq from anon, authenticated, public;

-- Stores the caller's guess if this device has none for the question yet, then
-- says how the guess SENT NOW stands against everyone else's:
--   { "n": others who have answered, "beat": how many of them were further out }
-- "Further out" is by factor, the way the game scores: double and half are the
-- same size of miss. A tie is not a win. Returns null for anything malformed.
create or replace function public.ballpark_guess(
  p_question text,
  p_guess    double precision,
  p_answer   double precision,
  p_visitor  uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  my_factor double precision;
  n_others  integer;
  n_beaten  integer;
begin
  if p_question is null or p_question !~ '^[a-z0-9][a-z0-9-]{1,62}$' then return null; end if;
  -- NaN sorts above every number in Postgres, so "< 1e13" turns it away too.
  if p_guess is null or not (p_guess > 0 and p_guess < 1e13) then return null; end if;
  if p_answer is null or not (p_answer > 0 and p_answer < 1e13) then return null; end if;
  if p_visitor is null then return null; end if;

  -- Rate limit, same posture as record_daily_result: a runaway client cannot
  -- fill the table. Past the cap the guess is not stored but is still answered.
  if (select count(*) from public.ballpark_guesses where created_at > now() - interval '1 hour') < 5000 then
    insert into public.ballpark_guesses (question, guess, visitor_id)
    values (p_question, p_guess, p_visitor)
    on conflict (question, visitor_id) do nothing;
  end if;

  my_factor := greatest(p_guess / p_answer, p_answer / p_guess);
  select count(*),
         count(*) filter (where greatest(guess / p_answer, p_answer / guess) > my_factor)
    into n_others, n_beaten
    from public.ballpark_guesses
   where question = p_question and visitor_id <> p_visitor;

  return jsonb_build_object('n', n_others, 'beat', n_beaten);
end;
$function$;

grant execute on function public.ballpark_guess(text, double precision, double precision, uuid) to anon, authenticated;
revoke all on function public.ballpark_guess(text, double precision, double precision, uuid) from public;
