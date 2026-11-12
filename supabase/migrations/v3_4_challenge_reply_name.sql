-- Challenge replies: a name can follow the result (12 Nov 2026).
--
-- v3_3 stores a mate's result the moment they finish, usually with no name:
-- the installed apps send none unasked, and most web players have never set
-- one, so the sender's card said "A mate played your Footle". The finish
-- screen now asks the mate, in one line, to say who they are. By then the row
-- exists, so record_challenge_reply learns one thing: called again with the
-- SAME reply key and a name, it puts the name on the stored row.
--
-- Only the holder of that row's reply key can do it (a random uuid made on
-- the replying device for that one link), the name passes the same checks as
-- before, and nothing else about the function changes: same signature, same
-- grants (restated below so this file stands alone), same caps. (One more
-- line: the insert's conflict clause keeps a name too, for the case where the
-- result and the typed name arrive together.)

create or replace function public.record_challenge_reply(
  p_cid     text,
  p_game    text,
  p_edition integer,
  p_score   integer,   -- guesses or clubs used (0 = missed), or the Top 10 score
  p_name    text,      -- the mate's display name, may be empty
  p_replier uuid       -- a random key the replying device made for THIS link (see below)
)
returns boolean      -- true: the reply is stored (now or already). false: turned away, try again later.
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_day   integer;
  v_today integer := ((now() at time zone 'utc')::date - date '1970-01-01');
  v_max   integer;
  v_name  text;
begin
  -- Garbage is refused for good (false, and the client's own checks mean an
  -- honest device never sends it).
  if p_cid is null or p_cid !~ '^[A-Z2-7]{12}$' then return false; end if;
  if p_replier is null then return false; end if;
  if p_game is null or p_game not in ('footle', 'trail', 'top10') then return false; end if;
  if p_edition is null or p_edition < 1 or p_edition > 99999 then return false; end if;

  v_max := case p_game when 'footle' then 6 when 'trail' then 12 else 10 end;
  if p_score is null or p_score < 0 or p_score > v_max then return false; end if;

  -- Only a puzzle that is live somewhere on Earth today.
  v_day := public._league_day_index(p_game, p_edition);
  if v_day is null or v_day < v_today - 1 or v_day > v_today + 1 then return false; end if;

  -- Already stored for this key: a replay is a success, and costs no row.
  -- A name that arrives afterwards lands on that row (v3_4): the mate is asked
  -- "say it was you?" on the finish screen, after the result has already gone.
  if exists (select 1 from public.challenge_replies where cid = p_cid and replier = p_replier) then
    v_name := case when p_name !~ '[/:@<>&"\\\u200B-\u200F\u202A-\u202E\u2060-\u206F[:cntrl:]]'
                   then public._league_clean_name(p_name, 22) end;
    if v_name is not null then
      update public.challenge_replies set name = v_name
       where cid = p_cid and replier = p_replier and name is distinct from v_name;
    end if;
    return true;
  end if;

  -- Housekeeping rides along: reads look back three days, nothing needs a
  -- row after seven.
  delete from public.challenge_replies where created_at < now() - interval '7 days';

  if (select count(*) from public.challenge_replies
        where created_at > now() - interval '1 hour') >= 2000 then
    return false;
  end if;

  -- One writer per link at a time, so the count below cannot be raced past 8.
  perform pg_advisory_xact_lock(hashtext(p_cid));
  if (select count(*) from public.challenge_replies where cid = p_cid) >= 8 then
    return false;
  end if;

  -- No link, address, markup or invisible direction character in a name. (A
  -- deny-list, not "letters only": the database's letter classes are ASCII
  -- under the C locale, and Jørgen is a name.)
  v_name := case when p_name !~ '[/:@<>&"\\\u200B-\u200F\u202A-\u202E\u2060-\u206F[:cntrl:]]'
                 then public._league_clean_name(p_name, 22) end;

  insert into public.challenge_replies as cr (cid, game, edition, score, name, replier)
  values (p_cid, p_game, p_edition, p_score::smallint, v_name, p_replier)
  -- Two calls on one key can both miss the check above (the result and a
  -- typed name sent at once): the second must not lose its name.
  on conflict (cid, replier) do update
    set name = coalesce(excluded.name, cr.name);
  return true;
end;
$$;

grant execute on function public.record_challenge_reply(text, text, integer, integer, text, uuid) to anon, authenticated;
revoke all on function public.record_challenge_reply(text, text, integer, integer, text, uuid) from public;
