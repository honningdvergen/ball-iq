-- XP DEFLATION — run in the Supabase SQL editor (Alex only).
--
-- WHY. getMpXP was `score * 10 + 50`, correct for the solo modes where
-- `score` is the number correct (0-15), wrong for MP where `score` is POINTS
-- (thousands). A 5,274-point win paid 52,790 XP. The ENTIRE league ladder is
-- 3,000 XP (Sunday League -> Legend), so one match was worth 17 ladders --
-- which is exactly why Alex "skipped through way too many divisions".
-- Formula fixed in 81210ef; this repairs the two profiles it inflated.
--
-- HOW THE TARGETS WERE DERIVED. Not by subtracting the overpayment -- that
-- underflows past zero for Alex (MP "paid" him 210,950 against a 207,600
-- balance, so some awards never persisted). Instead the totals are rebuilt
-- from actual play in `scores`, using each mode's real XP formula, plus the
-- CORRECTED MP value:
--
--   Alex      solo 1,230 (classic 710 + daily 230 + footle 220 + club 50
--                        + survival 20)  + MP 776  = 2,006
--   Johannes  solo 2,020 (daily 910 + footle 530 + wc2026 200 + classic 190
--                        + survival 140 + chaos 50) + MP 426 = 2,446
--
-- CROSS-CHECK: for Johannes the naive subtraction (152,455 - 150,044) gives
-- 2,411 against the reconstruction's 2,446 -- two independent methods within
-- 35 XP. That agreement is the reason to trust these numbers.
--
-- Both land in Champions League, one tier below Legend. BarberMUFC is
-- deliberately untouched: MP "paid" 20,550 but the balance is 203, so the
-- inflation never persisted there.

UPDATE profiles SET xp = 2006 WHERE id = '4ccc461b-5e63-4453-83c8-27a8a9a09e36'; -- Alex
UPDATE profiles SET xp = 2446 WHERE id = 'b52c5fe8-2895-403b-b6f6-d4b4bf43a6cc'; -- Johannes

SELECT username, xp,
       CASE WHEN xp>=3000 THEN 'Legend' WHEN xp>=1500 THEN 'Champions League'
            WHEN xp>=700 THEN 'Premier League' WHEN xp>=300 THEN 'Championship'
            WHEN xp>=100 THEN 'Non-League' ELSE 'Sunday League' END AS league
FROM profiles
WHERE id IN ('4ccc461b-5e63-4453-83c8-27a8a9a09e36','b52c5fe8-2895-403b-b6f6-d4b4bf43a6cc');
