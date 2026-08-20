-- K-factor measurement for the invite loop (scouting panel, Social 6/C).
-- Read-only. Run against prod via the Supabase MCP connector, or psql.
--
-- ⚠️ MEASUREMENT WINDOW IS ~7 DAYS, NOT 30. cleanup_stale_rooms prunes
-- ended rooms after 7 days (room_players cascades), so any query over
-- game_rooms/room_players only sees the last week no matter what interval
-- you ask for. Use 7-day windows for every loop metric and 7-day
-- denominators to match. Run WEEKLY (or log to a permanent table) if you
-- want a trend — the evidence evaporates otherwise.
--
-- Definition (documented so the number is comparable run-to-run):
--   k(7d) = invite-driven signups (new account whose first non-host room
--           join happened within 24h of account creation) / active users
--           (distinct users with any scores row in the window).
-- Challenge links (/c/): recorded in challenge_events since 2026-08-20
-- (query 7). Data before that date does not exist — the loop was
-- client-side only, so historical k remains a floor.
--
-- First run 2026-08-20 (window 08-13..08-20): rooms 99, with-guest 64 (65%),
-- invite signups 9 of 37 total signups (24%), active users 40 → k ≈ 0.23,
-- inviters 12. Friendships formed in 30d: 0 (friend loop is inert).

-- 1) Room funnel: how often does a created room actually receive a guest?
select
  count(*)                                                    as rooms_created_7d,
  count(*) filter (where exists (
    select 1 from room_players rp
    where rp.room_id = r.id and rp.user_id <> r.host_id))     as rooms_with_guest_7d
from game_rooms r
where r.created_at > now() - interval '7 days';

-- 2) Invite-driven signups: brand-new accounts that joined someone else's
--    room within 24h of signing up (they made the account BECAUSE of the
--    invite; the 1h backward tolerance covers clock/ordering slop).
select count(*) as invite_signups_7d
from profiles p
where p.created_at > now() - interval '7 days'
  and exists (
    select 1 from room_players rp
    join game_rooms r on r.id = rp.room_id
    where rp.user_id = p.id
      and r.host_id <> p.id
      and rp.joined_at between p.created_at - interval '1 hour'
                           and p.created_at + interval '24 hours');

-- 3) Active inviters: distinct hosts whose room actually got a guest.
select count(distinct r.host_id) as active_inviters_7d
from game_rooms r
join room_players rp on rp.room_id = r.id and rp.user_id <> r.host_id
where r.created_at > now() - interval '7 days';

-- 4) Denominators: signups + active players in the window.
select
  (select count(*) from profiles
    where created_at > now() - interval '7 days')            as signups_7d,
  (select count(distinct user_id) from scores
    where created_at > now() - interval '7 days')            as active_users_7d;

-- 5) Friend loop: friendships formed + play_invite notifications sent.
select
  (select count(*) from friendships
    where created_at > now() - interval '7 days')            as friendships_7d,
  (select count(*) from friendships where status = 'accepted'
    and created_at > now() - interval '7 days')              as friendships_accepted_7d,
  (select count(*) from notifications where type = 'play_invite'
    and created_at > now() - interval '7 days')              as play_invites_7d;

-- 6) All-time versions of the loop counts, for context while numbers are small.
select
  (select count(*) from game_rooms)                           as rooms_all_time,
  (select count(*) from (
     select distinct rp.room_id from room_players rp
     join game_rooms r on r.id = rp.room_id
     where rp.user_id <> r.host_id) t)                        as rooms_with_guest_all_time,
  (select count(*) from profiles p where exists (
     select 1 from room_players rp
     join game_rooms r on r.id = rp.room_id
     where rp.user_id = p.id and r.host_id <> p.id
       and rp.joined_at between p.created_at - interval '1 hour'
                            and p.created_at + interval '24 hours')) as invite_signups_all_time,
  (select count(*) from profiles)                             as profiles_all_time;

-- 7) Challenge loop (/c/ links) — recorded since 2026-08-20 via
--    record_challenge_event(). challenge_events is NOT pruned, so this one
--    genuinely supports any window.
select
  (select count(*) from challenge_events where event='open'
     and created_at > now() - interval '7 days')               as challenge_opens_7d,
  (select count(*) from challenge_events where event='played'
     and created_at > now() - interval '7 days')               as challenge_played_7d,
  (select count(*) from challenge_events where event='open'
     and visitor_id is null
     and created_at > now() - interval '7 days')               as challenge_opens_by_signed_out_7d;
