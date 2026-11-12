-- Challenge replies: the sender hears back (12 Nov 2026).
--
-- "Send it to a mate" (Footle, Transfer Trail, Top 10) sends a link that
-- carries the sender's score and name. The mate plays the same puzzle and
-- sees the head-to-head; the SENDER was told nothing unless the mate chose to
-- send one back. This table is the way back: one row per mate who finished a
-- puzzle they were sent, read by the sender's own device.
--
-- HOW A REPLY FINDS ITS SENDER, WITH NO ACCOUNT ON EITHER SIDE
--   The sender's phone makes a random 12-character id (60 bits) and puts it
--   on the link (?r=…). It is a capability: whoever holds the id can write a
--   reply to it and read the replies to it, and nobody else can find it. The
--   sender keeps their ids on their own device; the mate gets one from the
--   link. Nothing here is tied to a user id, and the stakes are a score and a
--   first name on a football puzzle.
--
-- ACCESS MODEL (the standing rules)
--   * The TABLE has zero client grants and RLS with no policies: PostgREST can
--     neither read nor write it.
--   * The only doors are the two SECURITY DEFINER functions below. Both
--     validate everything and return silently on garbage: a visitor is never
--     shown an error for a measurement.
--   * anon must be able to call both (links are opened and sent by signed-out
--     visitors), so each function ends with the explicit revoke from public.
--
-- WHAT STOPS ABUSE
--   * a reply only lands for a puzzle that is live (its day index is today,
--     yesterday or tomorrow in UTC), so old or invented puzzle numbers drop;
--   * one reply per (id, reply key), and at most 8 replies per id. The reply
--     key is a random uuid the replying device makes for that one link and
--     keeps locally. It is NOT the visitor id: the installed apps send no
--     device identifier anywhere (the store listings promise none), and a key
--     that exists for one link identifies nobody;
--   * a global backstop of 2000 rows an hour, the same shape as
--     record_challenge_event and report_question. It is a backstop, not a
--     fence: nothing identifies a caller (by design, see the reply key), so
--     someone determined could fill it and mute replies for the rest of that
--     hour. The function says whether the row was stored (true/false), so a
--     mate's device that was turned away tries again later instead of
--     believing it reported;
--   * rows older than seven days are deleted by the function itself as it
--     runs (reads only look back three days), so junk cannot pile up;
--   * the name: the client sends letters, digits, space and ' . _ - only (the
--     set the link's own name allows); the server refuses anything with a
--     link, address, markup or invisible direction character, then runs
--     _league_clean_name (length, whitespace, the profanity list). A name that
--     fails is stored as null and shown as "A mate".

create table public.challenge_replies (
  id         bigint generated always as identity primary key,
  cid        text        not null check (cid ~ '^[A-Z2-7]{12}$'),
  game       text        not null check (game in ('footle', 'trail', 'top10')),
  edition    integer     not null check (edition between 1 and 99999),
  score      smallint    not null check (score between 0 and 12),
  name       text        check (char_length(name) <= 22),
  replier    uuid        not null,
  created_at timestamptz not null default now(),
  unique (cid, replier)
);

comment on table public.challenge_replies is
  'One row per mate who finished a puzzle they were sent (Footle, Trail, Top 10). Written only by record_challenge_reply(); read only by get_challenge_replies(), by the unguessable id on the link.';

alter table public.challenge_replies enable row level security;
-- No policies on purpose. Defaults grant anon full DML on a new public table,
-- so revoke explicitly (standing rule).
revoke all on table public.challenge_replies from anon, authenticated, public;

create index challenge_replies_created_at_idx on public.challenge_replies (created_at);

-- ── The mate's phone, on finishing the puzzle ───────────────────────────────
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
  if exists (select 1 from public.challenge_replies where cid = p_cid and replier = p_replier) then
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

  insert into public.challenge_replies (cid, game, edition, score, name, replier)
  values (p_cid, p_game, p_edition, p_score::smallint, v_name, p_replier)
  on conflict (cid, replier) do nothing;
  return true;
end;
$$;

-- ── The sender's phone, on opening Home ─────────────────────────────────────
-- Up to 12 ids at a time, replies from the last three days: the newest 96
-- (12 links of 8), handed back oldest first.
create or replace function public.get_challenge_replies(p_cids text[])
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'cid', r.cid, 'game', r.game, 'edition', r.edition,
           'score', r.score, 'name', r.name, 'at', r.created_at
         ) order by r.created_at), '[]'::jsonb)
  from (
    select cr.cid, cr.game, cr.edition, cr.score, cr.name, cr.created_at
    from public.challenge_replies cr
    where cr.cid = any (
            select c from unnest((coalesce(p_cids, '{}'::text[]))[1:12]) as c
            where c ~ '^[A-Z2-7]{12}$')
      and cr.created_at > now() - interval '3 days'
    order by cr.created_at desc
    limit 96
  ) r;
$$;

grant execute on function public.record_challenge_reply(text, text, integer, integer, text, uuid) to anon, authenticated;
grant execute on function public.get_challenge_replies(text[]) to anon, authenticated;
revoke all on function public.record_challenge_reply(text, text, integer, integer, text, uuid) from public;
revoke all on function public.get_challenge_replies(text[]) from public;
