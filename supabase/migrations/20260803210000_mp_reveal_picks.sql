-- v1_3_mp_reveal_picks — show who picked what at the multiplayer reveal.
--
-- The CLIENT HALF ALREADY EXISTED, built inert and waiting for exactly this
-- migration by name: OnlineMultiplayer.jsx holds `revealPicks` state, a
-- `picksByOption` memo that groups opponents by the option they chose, and
-- the full avatar row (22px circles, capped at 4 with a "+N" overflow, an
-- aria-label naming who picked it, your own pick excluded because it is
-- already highlighted). It reads `picks` off reveal_question's response and
-- renders nothing while that field is absent. So this migration is four
-- lines of SQL, not a feature.
--
-- ⚠️ The first attempt at this added a SEPARATE get_reveal_answers() RPC and
-- a matching client wrapper, because I designed the server half without
-- checking whether the client half existed. Both were dropped. Search for the
-- BEHAVIOUR before building it — things here are frequently already built
-- under a name you would not have guessed.
--
-- WHY A SEPARATE TABLE, NOT A COLUMN ON room_players
-- The obvious shape is `alter table room_players add last_answer_idx`. It
-- leaks: room_players rows are streamed to every client in the room, and RLS
-- filters ROWS, not COLUMNS, so a pick would be readable in every opponent's
-- realtime payload the instant it was written — before they had answered.
-- Rendering it "only at the reveal" would be a client-side promise, and
-- reading the payload to copy the best player's answer is trivial. Alex's
-- constraint was explicit: post-reveal only, or it becomes answer-copying.
-- A promise is not a mechanism.
--
-- So picks live in a table nobody can select from. Deny-all RLS, every grant
-- revoked, not in the realtime publication. The only reader is
-- reveal_question(), which is SECURITY DEFINER and already refuses until the
-- question is closed — reusing that gate rather than re-deriving it, which
-- matters because its version is better than the one I wrote: a 19.5s margin
-- to absorb clock drift under the 20s question duration, and a survival-mode
-- clause that ignores eliminated players when deciding whether everyone has
-- answered.

create table if not exists public.room_answers (
  room_id      uuid    not null references public.game_rooms(id) on delete cascade,
  user_id      uuid    not null references auth.users(id) on delete cascade,
  question_idx integer not null,
  answer_idx   integer not null,
  primary key (room_id, user_id, question_idx)
);

-- ⚠️ supabase_admin's defaults grant anon full DML on new public tables, so a
-- new table must revoke explicitly rather than be assumed closed.
revoke all on public.room_answers from public, anon, authenticated;
alter table public.room_answers enable row level security;
-- No policies, on purpose: deny-all. SECURITY DEFINER functions bypass RLS,
-- and that is the only access this table should ever have.

-- submit_answer additionally records the pick. `on conflict do nothing`
-- because the already_answered guard earlier in that function is the real
-- gate — this must never let a repeat call overwrite a locked-in answer.
--
-- reveal_question additionally returns `picks` as { user_id: answer_idx },
-- the shape picksByOption already expects, and only past its existing
-- closed-question gate.
--
-- Both function bodies were applied to prod in full; see the deployed
-- definitions via pg_get_functiondef. They are not repeated here because
-- create-or-replace needs the whole body and prod is the source of truth
-- for what that body currently is.
