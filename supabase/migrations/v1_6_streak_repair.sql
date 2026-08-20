-- Streak repair — the un-shielded comeback (scouting panel, Retention).
--
-- Shields already auto-bridge a one-day lapse when the player has one
-- (tick_login_streak's v_today-2 branch). The gap is the UN-shielded break:
-- the reset branch overwrote the streak with 1 and the old value was gone
-- forever. Duolingo turns exactly this moment into a comeback loop.
--
-- Design:
--   1. tick_login_streak now STASHES a meaningful fallen streak (>= 3) as
--      fell/fellDay in the same jsonb when it resets. The stash lives only
--      for the local day the break was discovered: any later tick rebuilds
--      the jsonb without the fields, so expiry is automatic — no cron, no
--      cleanup, no second write path.
--   2. repair_login_streak() restores it: called by the client after the
--      player completes one of YESTERDAY's puzzles from the back-catalogue
--      (the day whose gap killed the flame — afe7342 made those replays
--      streak-inert via the arc stamp, so this RPC is the ONE sanctioned
--      way a catch-up can touch the streak). count := fell + count, so the
--      day-of-break tick they already banked still counts.
--
-- Abuse ceiling: requires a fall stamped TODAY by the tick itself, restores
-- once (the stash is consumed), and needs an authenticated session — a
-- cheater who calls it raw skips one archive puzzle, once per real lapse.
--
-- Verified before writing: live tick_login_streak md5 6ffab2267e14... ==
-- snapshot (no drift). The function below is that definition + the stash.

CREATE OR REPLACE FUNCTION public.tick_login_streak(p_local_day integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_fell      int := 0;
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
    -- Un-shielded break. Stash a meaningful fallen streak so
    -- repair_login_streak can restore it — today only.
    if v_count >= 3 then
      v_fell := v_count;
    end if;
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
  if v_fell > 0 then
    v_streak := v_streak || jsonb_build_object('fell', v_fell, 'fellDay', v_today);
  end if;

  if v_ticked then
    update public.user_game_state
    set login_streak = v_streak
    where user_id = v_uid;
  end if;

  return v_streak || jsonb_build_object('ticked', v_ticked, 'shieldSaved', v_shielded);
end;
$function$;

grant execute on function public.tick_login_streak(integer) to authenticated;
revoke execute on function public.tick_login_streak(integer) from public;
revoke execute on function public.tick_login_streak(integer) from anon;

CREATE OR REPLACE FUNCTION public.repair_login_streak(p_local_day integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid      uuid := auth.uid();
  v_utc_day  int  := (current_date - date '1970-01-01');
  v_today    int;
  v_streak   jsonb;
  v_fell     int;
  v_fell_day int;
  v_count    int;
  v_best     int;
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

  v_fell     := coalesce((v_streak->>'fell')::int, 0);
  v_fell_day := coalesce((v_streak->>'fellDay')::int, 0);
  v_count    := coalesce((v_streak->>'streak')::int, 0);
  v_best     := coalesce((v_streak->>'best')::int, 0);

  -- Repairable only on the local day the break was discovered, and only
  -- while the stash is unconsumed. Anything else returns state untouched
  -- (repaired:false) — the client treats that as "window closed".
  if v_fell <= 0 or v_fell_day <> v_today
     or coalesce((v_streak->>'lastDay')::int, 0) <> v_today then
    return coalesce(v_streak, '{}'::jsonb) || jsonb_build_object('repaired', false);
  end if;

  v_count := v_fell + v_count;   -- fallen streak + the day(s) since the break
  v_best  := greatest(v_best, v_count);
  v_streak := (v_streak - 'fell' - 'fellDay')
    || jsonb_build_object('streak', v_count, 'best', v_best);

  update public.user_game_state
  set login_streak = v_streak
  where user_id = v_uid;

  return v_streak || jsonb_build_object('repaired', true);
end;
$function$;

grant execute on function public.repair_login_streak(integer) to authenticated;
revoke execute on function public.repair_login_streak(integer) from public;
revoke execute on function public.repair_login_streak(integer) from anon;
