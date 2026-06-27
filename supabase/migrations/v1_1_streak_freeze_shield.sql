-- 1.1 Streak freeze — tick_login_streak() honours streak shields.
--
-- A SINGLE missed day (lastDay == today-2) with an available shield now
-- preserves the login streak instead of resetting it, consuming one shield.
-- Shields earned = floor(profiles.xp / 200); the used-count lives inside the
-- existing login_streak jsonb under a new `shieldsUsed` key (default 0), so no
-- schema change is needed. Today still continues the (preserved) streak.
--
-- Backward-compatible: a user with no available shield (earned - used <= 0)
-- falls through to the original reset branch, behaving exactly as before. The
-- new jsonb key defaults via coalesce for existing rows. Mirrors the guest
-- client logic in src/App.jsx tickLoginStreak().

create or replace function public.tick_login_streak()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid       uuid := auth.uid();
  v_today     int  := (current_date - date '1970-01-01');
  v_streak    jsonb;
  v_last_day  int;
  v_count     int;
  v_best      int;
  v_used      int;
  v_xp        int;
  v_earned    int;
  v_ticked    boolean := false;
  v_shielded  boolean := false;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
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

  if v_last_day = v_today then
    v_ticked := false;
  elsif v_last_day = v_today - 1 then
    v_count    := v_count + 1;
    v_best     := greatest(v_best, v_count);
    v_last_day := v_today;
    v_ticked   := true;
  elsif v_last_day = v_today - 2 and v_count > 0 and (v_earned - v_used) > 0 then
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

grant execute on function public.tick_login_streak() to authenticated;
revoke execute on function public.tick_login_streak() from public;
