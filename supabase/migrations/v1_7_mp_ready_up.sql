-- ────────────────────────────────────────────────────────────────────────────
-- MULTIPLAYER: STAY IN THE ROOM AND READY UP FOR THE NEXT ROUND
--
-- ⚠️ WHY. Measured in prod 2026-08-24: 136 rooms, ALL of them in state 'ended',
-- and `rematch_code` null on every single one. Not one rematch has ever
-- completed. Meanwhile multiplayer is genuinely being played — 90 rooms with
-- 2+ real players in the preceding 10 days, averaging 2.6 players this week.
-- Every one of those games dead-ended.
--
-- The reason is the shape of the existing flow. `claim_rematch` does not keep
-- anyone together: it mints a BRAND NEW room with a new 6-character code, moves
-- the tapper into it ALONE, and leaves the others behind to be retrieved by a
-- push notification or a shared link. The first tapper stands in an empty lobby
-- hoping somebody follows. Alex, 2026-08-24: *"we need some type of logic where
-- people do not automatically leave the lobby when game ends."*
--
-- So the room stops dissolving. Players stay in `room_players` after the final
-- whistle, mark themselves ready, and the SAME room resets for another round.
-- No new code, no notification, no link.
--
-- `claim_rematch` is deliberately NOT removed — it remains the fallback for a
-- room somebody has actually left.
--
-- ⚠️ TWO DEFECTS IN THE FIRST DRAFT, both found by running it against a real
-- room before any UI existed. Applied as v1_7_mp_ready_up_fixes; this file is
-- the final state.
--
--   1. `answered_question` is NOT NULL DEFAULT -1 — "has not answered" is -1,
--      not null. The draft set null and threw 23502 on EVERY start. The
--      feature would have been dead on arrival in production.
--
--   2. "ALL players ready" DEADLOCKS on anyone who closed the app: they stay
--      in room_players, never ready up, and the room can never start again —
--      the exact dead end this work removes, reintroduced somewhere new. The
--      gate is now >= 2 READY and non-ready players are DROPPED at start,
--      which is the party-game model Alex asked for. Leaving them in a
--      'playing' room would be worse than removing them: they would sit at
--      score 0 answering nothing, and Survival's elimination logic would wait
--      on a player who is not there.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. READY FLAG ───────────────────────────────────────────────────────────
-- Defaults false so an in-flight room is unaffected by this migration: nobody
-- is ready until they say so, which is also the correct state mid-game.
alter table public.room_players
  add column if not exists ready boolean not null default false;

-- ── 2. SET READY ────────────────────────────────────────────────────────────
-- Returns the tally so the caller can render "2 / 3 ready" without a second
-- round trip, and so a client whose realtime subscription is asleep still gets
-- a truthful count from its own action.
create or replace function public.set_player_ready(p_code text, p_ready boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid    uuid := auth.uid();
  v_room   public.game_rooms%rowtype;
  v_total  int;
  v_ready  int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_room from public.game_rooms where code = upper(p_code);
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  update public.room_players
     set ready = p_ready
   where room_id = v_room.id and user_id = v_uid;

  if not found then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;

  select count(*), count(*) filter (where ready)
    into v_total, v_ready
    from public.room_players
   where room_id = v_room.id;

  return jsonb_build_object(
    'room_id',     v_room.id,
    'ready_count', v_ready,
    'total',       v_total,
    'all_ready',   (v_total > 1 and v_ready = v_total),
    'can_start',   (v_ready >= 2)   -- what the host's button keys off
  );
end;
$$;

-- ── 3. START THE NEXT ROUND IN THE SAME ROOM ────────────────────────────────
-- Mirrors start_game (client supplies the questions, server dual-writes the
-- answer key) but resets an ENDED room in place rather than moving anyone.
--
-- ⚠️ HOST-ONLY, WITH ONE ESCAPE HATCH. Letting any player start would widen a
-- real cheat vector: whoever supplies p_questions knows the answers before the
-- round begins. That power sits with the host today and this keeps it there.
-- But host-only alone would dead-end every room whose host closed the app —
-- the exact class of dead end this migration exists to remove — so if the host
-- is no longer in room_players, any remaining player may start.
create or replace function public.start_next_round(p_code text, p_questions jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid          uuid := auth.uid();
  v_room         public.game_rooms%rowtype;
  v_ready        int;
  v_dropped      int;
  v_host_present boolean;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- for update: two players tapping at the same moment must serialise, the
  -- same way claim_rematch had to after both players landed in rival rooms.
  select * into v_room from public.game_rooms where code = upper(p_code) for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_uid) then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;

  -- Idempotent: the loser of the race gets a truthful "already going" rather
  -- than an error or a second reset that would wipe the round just started.
  if v_room.state = 'playing' then
    return jsonb_build_object('started', true, 'already', true, 'room_id', v_room.id);
  end if;

  if v_room.state <> 'ended' then
    return jsonb_build_object('started', false, 'reason', 'not_ended', 'state', v_room.state);
  end if;

  select exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_room.host_id)
    into v_host_present;
  if v_host_present and v_room.host_id <> v_uid then
    return jsonb_build_object('started', false, 'reason', 'not_host');
  end if;

  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'questions must be a non-empty array' using errcode = '22023';
  end if;

  -- The starter must themselves be ready, or a host tap alone could start a
  -- round the host is not in.
  if not exists (select 1 from public.room_players
                  where room_id = v_room.id and user_id = v_uid and ready) then
    return jsonb_build_object('started', false, 'reason', 'starter_not_ready');
  end if;

  select count(*) filter (where ready) into v_ready
    from public.room_players where room_id = v_room.id;
  if v_ready < 2 then
    return jsonb_build_object('started', false, 'reason', 'need_two_ready', 'ready_count', v_ready);
  end if;

  -- Whoever did not ready up is not in this round.
  delete from public.room_players where room_id = v_room.id and not ready;
  get diagnostics v_dropped = row_count;

  -- ⚠️ room_answers is keyed (room_id, user_id, question_idx) with no round
  -- number, so last round's rows would collide with this one's and the first
  -- answer of round 2 would silently be treated as already-answered. Clear
  -- them. If rounds ever need to be replayable, this is the line that has to
  -- become a round column instead.
  delete from public.room_answers where room_id = v_room.id;

  update public.room_players
     set score = 0,
         answered_question = -1,   -- NOT NULL DEFAULT -1; null throws 23502
         streak = 0,
         best_streak = 0,
         eliminated_at_q = null,
         ready = false
   where room_id = v_room.id;

  update public.game_rooms
     set state = 'playing',
         current_question = 0,
         questions = p_questions,
         capacity = v_ready,
         started_at = now(),
         current_question_started_at = now(),
         ended_at = null
   where id = v_room.id;

  insert into public.room_answer_keys (room_id, keys)
  select v_room.id,
         coalesce(jsonb_agg((q.value ->> 'correct')::int order by q.ordinality), '[]'::jsonb)
  from jsonb_array_elements(p_questions) with ordinality q
  on conflict (room_id) do update set keys = excluded.keys;

  return jsonb_build_object(
    'started', true, 'room_id', v_room.id,
    'players', v_ready, 'dropped', v_dropped,
    'question_count', jsonb_array_length(p_questions)
  );
end;
$$;

-- ── GRANTS ──────────────────────────────────────────────────────────────────
-- REVOKE FROM PUBLIC IS ALWAYS LAST. Without it PUBLIC (which includes anon)
-- keeps execute, and the failure is silent — nothing errors, the function is
-- just callable by everyone.
grant execute on function public.set_player_ready(text, boolean) to authenticated;
revoke execute on function public.set_player_ready(text, boolean) from public;

grant execute on function public.start_next_round(text, jsonb) to authenticated;
revoke execute on function public.start_next_round(text, jsonb) from public;
