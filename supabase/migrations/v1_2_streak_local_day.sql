-- 1.2 Streak integrity — LOCAL-day boundary + shield cap for tick_login_streak.
--
-- The streak day was the server's UTC date (current_date), so a user west of
-- UTC playing in the evening on consecutive LOCAL days straddled 00:00 UTC and
-- read as having skipped a day — streak reset. Mid-World-Cup, with the US as
-- the main growth market, that punishes the exact habit the streak exists to
-- build.
--
-- Fix: the client now passes its LOCAL calendar day (days since epoch of the
-- local date). The server trusts it only within ±2 days of its own UTC day
-- (covers UTC-12..+14 with slack); an absent param (old clients) or a wildly
-- wrong device clock falls back to the UTC day — the previous behaviour.
--
-- Also:
--   • lastDay AHEAD of today (legacy UTC ticks banked a later day, or a
--     device further east ticked first) no longer RESETS the streak — it's
--     treated as already-ticked. This makes the UTC→local transition safe.
--   • Usable shield bank capped at 3, mirroring the client-side cap: an
--     uncapped pile let a high-XP player run an infinite every-other-day
--     "streak", killing the loss aversion streaks run on.
--
-- The old zero-arg overload is DROPPED (not left beside the new default-arg
-- version) — otherwise a bare rpc('tick_login_streak') call would be
-- ambiguous between the two and PostgREST would reject it.

drop function if exists public.tick_login_streak();

create or replace function public.tick_login_streak(p_local_day int default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid       uuid := auth.uid();
  v_utc_day   int  := (current_date - date '1970-01-01');
  v_today     int;
  v_streak    jsonb;
  v_last_day  int;
  v_count     int;
  v_best      int;
  v_used      int;
  v_xp        int;
  v_earned    int;
  v_avail     int;
  v_ticked    boolean := false;
  v_shielded  boolean := false;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_local_day is not null and abs(p_local_day - v_utc_day) <= 2 then
    v_today := p_local_day;
  else
    v_today := v_utc_day;
  end if;

  select login_streak into v_streak
  from public.user_game_state
  where user_id = v_uid;

  v_last_day := coalesce((v_streak->>'lastDay')::int, 0);
  v_count    := coalesce((v_streak->>'streak')::int,  0);
  v_best     := coalesce((v_streak->>'best')::int,    0);
  v_used     := coalesce((v_streak->>'shieldsUsed')::int, 0);

  select coalesce(xp, 0) into v_xp from public.profiles where id = v_uid;
  v_earned := floor(coalesce(v_xp, 0) / 200);
  v_avail  := least(3, greatest(0, v_earned - v_used));

  if v_last_day = v_today then
    v_ticked := false;
  elsif v_last_day > v_today then
    -- Already banked a LATER day (legacy UTC tick / device further east).
    -- Never reset for that — leave state untouched.
    v_ticked := false;
  elsif v_last_day = v_today - 1 then
    v_count    := v_count + 1;
    v_best     := greatest(v_best, v_count);
    v_last_day := v_today;
    v_ticked   := true;
  elsif v_last_day = v_today - 2 and v_count > 0 and v_avail > 0 then
    -- Streak freeze: exactly one missed day, covered by an available shield.
    v_used     := v_used + 1;
    v_count    := v_count + 1;
    v_best     := greatest(v_best, v_count);
    v_last_day := v_today;
    v_ticked   := true;
    v_shielded := true;
  else
    v_count    := 1;
    v_best     := greatest(v_best, 1);
    v_last_day := v_today;
    v_ticked   := true;
  end if;

  v_streak := jsonb_build_object(
    'lastDay',     v_last_day,
    'streak',      v_count,
    'best',        v_best,
    'shieldsUsed', v_used
  );

  if v_ticked then
    update public.user_game_state
    set login_streak = v_streak
    where user_id = v_uid;
  end if;

  return v_streak || jsonb_build_object('ticked', v_ticked, 'shieldSaved', v_shielded);
end;
$function$;

grant execute on function public.tick_login_streak(int) to authenticated;
revoke execute on function public.tick_login_streak(int) from public;
