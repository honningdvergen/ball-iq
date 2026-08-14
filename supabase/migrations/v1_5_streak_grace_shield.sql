-- v1.5 — one grace shield for everyone mid-streak when the streak changed meaning.
--
-- WHY. Until 2026-08-14 the streak ticked on app OPEN. It now ticks on puzzle
-- COMPLETION (any of Footle / Daily 7 / Trail / Mystery), because the measured
-- split is stark: modes with a daily reset retain 62-70% of the people who try
-- them, modes without retain 21-26%. The appointment is the mechanic, so the
-- streak has to count the appointment being kept.
--
-- That makes every existing streak a number earned under an easier rule. We are
-- NOT recomputing them — visibly cutting someone's streak overnight is the most
-- complained-about event in daily games, and these are real users. Instead the
-- numbers stand and everyone mid-streak gets one shield, so the first day they
-- open-but-don't-play is absorbed rather than fatal. One soft landing, once.
--
-- HOW. Shields are derived, not stored: the RPC computes
--     earned := floor(xp / 200)
--     available := least(3, greatest(0, earned - shieldsUsed))
-- so the only lever is shieldsUsed. Decrementing it by one grants exactly one
-- extra shield, and a NEGATIVE shieldsUsed is meaningful and safe here — it
-- reads as "credited one beyond what XP earned", greatest(0, ...) floors the
-- result and least(3, ...) still caps it. No RPC change needed.
--
-- Scoped to streak >= 3 on purpose: someone on day 1 or 2 has nothing much to
-- lose and does not need spending down. Idempotent via the shieldsUsed > -1
-- guard, so re-running cannot stack grants.

update public.user_game_state
set login_streak = jsonb_set(
      login_streak,
      '{shieldsUsed}',
      to_jsonb(coalesce((login_streak->>'shieldsUsed')::int, 0) - 1)
    )
where login_streak is not null
  and coalesce((login_streak->>'streak')::int, 0) >= 3
  and coalesce((login_streak->>'shieldsUsed')::int, 0) > -1;

-- No grants, policies or functions touched — this is a one-off data migration
-- against a table that already has RLS on and zero anon grants.
