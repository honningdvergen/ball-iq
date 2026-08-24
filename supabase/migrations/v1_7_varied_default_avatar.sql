-- Give every new account a distinct default avatar colourway.
--
-- ⚠️ MEASURED 2026-08-24: 204 of 219 accounts (93.2%) have no uploaded photo,
-- and handle_new_user hardcoded avatar_id = 'ball' for all of them — so every
-- friends list, leaderboard and multiplayer lobby was a wall of identical
-- balls. Names were never the issue: only 5.9% carry an auto-generated
-- 'player_xxxx'; 94% have a real name from Apple or Google. The anonymity was
-- entirely the picture.
--
-- ⚠️ NOT AN EMOJI PICKER, and not a picker at all (Alex was explicit). There
-- remain exactly two avatar paths: an uploaded photo, or this auto-assigned
-- colour. Nobody chooses anything.
--
-- ⚠️ ASSIGNED HERE, NOT HASHED AT RENDER TIME, and that is the load-bearing
-- choice. Persisting it means your colour is the SAME one your friends see. A
-- client-side hash of whatever id happened to be in scope would drift between
-- surfaces, and a player whose face changes depending on which list you are
-- looking at is worse than one shared ball.
--
-- md5 rather than the JS FNV-1a: the value is STORED, so the two never need to
-- agree — the client only reads it back.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_colour text;
begin
  -- 'c01'..'c16' must stay in step with AVATAR_COLOURS in
  -- src/lib/avatarColour.js. An id with no match there still resolves
  -- (avatarColour hashes an unknown value rather than rejecting it), so drift
  -- degrades to "a colour" instead of a broken avatar — but keep them aligned.
  v_colour := 'c' || lpad(((('x' || substr(md5(new.id::text), 1, 8))::bit(32)::bigint % 16) + 1)::text, 2, '0');

  insert into public.profiles (id, username, avatar_id, is_anon)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substring(new.id::text from 1 for 8)),
    v_colour,
    coalesce(new.is_anonymous, false)
  );
  return new;
end;
$$;

-- Backfill everyone currently sharing the one ball.
--
-- ⚠️ Deliberately scoped to 'ball'. Six accounts hold a legacy emoji chosen
-- back when a picker existed — ProfilePic never rendered those, so they saw a
-- ball anyway, but overwriting a stored choice to tidy up is not mine to make.
-- avatarColour() hashes an unknown value to a stable colour, so they gain a
-- distinct look without their row being touched.
update public.profiles
   set avatar_id = 'c' || lpad(((('x' || substr(md5(id::text), 1, 8))::bit(32)::bigint % 16) + 1)::text, 2, '0')
 where avatar_id = 'ball';
