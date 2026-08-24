-- Covering indexes for foreign keys the Supabase performance advisor flagged.
--
-- ⚠️ HONEST FRAMING: at today's sizes (scores 1,614 rows, funnel_events 1,955,
-- room_answers 2,238) a missing index costs microseconds. This is preventative
-- hygiene, not a fix for a slowdown anyone can feel. It is worth doing anyway
-- because all three are queried by user_id on paths that grow with every user:
--
--   scores.user_id        every profile read, and every retention/activation
--                         query — including the ones that produced today's
--                         "36.2% never played" finding
--   funnel_events.user_id the acct-* funnel added today joins on exactly this
--                         column, and it is the column the whole instrument
--                         exists to make joinable
--   room_answers.user_id  read per player per question during a live round
--
-- Deliberately NOT indexing notifications.actor_id, which the advisor also
-- flags: the table holds 12 rows and is queried by user_id (the RLS policy),
-- never by actor_id — actor_id exists to render "who did this". An index there
-- would go straight onto the advisor's OTHER list, unused_index, which already
-- has three entries. Adding noise to silence noise is not a fix.
create index if not exists scores_user_id_idx        on public.scores (user_id);
create index if not exists funnel_events_user_id_idx on public.funnel_events (user_id);
create index if not exists room_answers_user_id_idx  on public.room_answers (user_id);
