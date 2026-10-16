-- v3_0_mates_leagues — mates' leagues, phase 1 (web MVP).
--
-- Spec: ball-iq-audit/2026-10-16/leagues/spec.md (sections 3 to 6).
-- NOT APPLIED. Written 2026-10-16; applying it needs Alex's yes. After it is
-- applied: anon must still hold zero table grants, no new anon function grant,
-- one version of each function, and supabase/prod-snapshot/ gets refreshed.
--
-- A league is a name and an invite code. Points come from the four dailies on
-- a fixed scale (1 to 10 for any played daily, 0 for a missed one), Monday to
-- Sunday, and the week goes final at Monday 00:00 in the league's own time zone.
--
-- WHERE THE POINTS COME FROM, AND WHERE THEY DO NOT.
--   * Not daily_results: it is anon-writable and posted with the anon key, so
--     auth.uid() is always null there and no row can be tied to a person.
--   * Not user_game_state: its owner can rewrite any day through RLS.
--   * Here, league_results: written only by record_league_result(), bound to
--     auth.uid(), first write wins per puzzle, accepted only while the puzzle's
--     date is still "today" somewhere on Earth, and the POINTS ARE COMPUTED IN
--     SQL from the game's own result (guesses, clubs or score). The client never
--     sends points.
--   * Stated plainly: the answers are public, so a determined cheat can still
--     send a perfect result by hand. In a private league the group chat referees.
--
-- EDITION -> DAY. Every daily's edition comes from the player's LOCAL date
-- (src/lib/date.js dayIndexForDate: UTC midnight of the local date / one day):
--   footle  edition = day - 20577 + 1   (src/lib/footleNumber.js WORDLE_ANCHOR_DAY)
--   trail   edition = day - 20668 + 1   (src/lib/trail.js TRAIL_ANCHOR_DAY)
--   top10   edition = day - 20738 + 1   (src/data/top10Meta.js TOP10_ANCHOR_DAY)
--   daily7  edition = day
-- tests/unit/league-sql-parity.test.js parses _league_day_index and
-- _league_points below and compares them with the JS anchors and scale.
--
-- Access: all six tables have RLS on, NO policies, and every grant revoked from
-- anon, authenticated and public. Clients touch rows only through the security
-- definer functions at the bottom, granted to authenticated and revoked from
-- public. Helpers (leading underscore) carry no grants at all. anon gains nothing.
--
-- Two additions to the spec's data model, both small:
--   * league_join_tries: join_league's "30 tries per hour" needs somewhere to
--     count; a failed try must persist, so join_league returns an error object
--     instead of raising (a raise would roll the counted try back).
--   * league_members.seen_week: "Final table is in" on the Home card holds until
--     the final is opened, on any device.

-- ── TABLES ──────────────────────────────────────────────────────────────────

create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$'),
  name        text not null check (char_length(name) between 1 and 32),
  tz          text not null,
  owner_id    uuid references auth.users (id) on delete set null,
  seed        text not null default 'manual'
              check (seed in ('manual','h2h_footle','h2h_trail','h2h_top10','h2h_daily7')),
  created_at  timestamptz not null default now()
);
create index leagues_owner_id_idx on public.leagues (owner_id);
comment on table public.leagues is
  'Mates'' leagues. Read and written only through the league RPCs (v3_0). tz is an IANA name from the creator''s device; the week goes final at Monday 00:00 there.';

create table public.league_members (
  league_id     uuid not null references public.leagues (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 22),
  joined_at     timestamptz not null default now(),
  joined_day    integer not null,
  left_at       timestamptz,
  seen_week     integer,
  primary key (league_id, user_id)
);
create index league_members_user_id_idx on public.league_members (user_id);
create index league_members_active_user_idx on public.league_members (user_id) where left_at is null;
comment on column public.league_members.joined_day is
  'Day index (days since 1970-01-01) in the league''s zone when the member joined. Points count from this day, in full.';

create table public.league_results (
  user_id      uuid not null references auth.users (id) on delete cascade,
  game         text not null check (game in ('footle','daily7','trail','top10')),
  edition      integer not null check (edition >= 0),
  day_index    integer not null,
  bucket       smallint not null check (bucket between 0 and 30),
  won          boolean not null,
  points       smallint not null check (points between 1 and 10),
  recorded_at  timestamptz not null default now(),
  primary key (user_id, game, edition)
);
create index league_results_user_day_idx on public.league_results (user_id, day_index);
create index league_results_recorded_at_idx on public.league_results (recorded_at);
comment on table public.league_results is
  'One result per player per daily puzzle, first write wins. Written only by record_league_result(); points computed in SQL by _league_points(). Counts in every league the player is in.';

create table public.league_weeks (
  league_id   uuid not null references public.leagues (id) on delete cascade,
  week_start  integer not null,
  final_at    timestamptz not null default now(),
  standings   jsonb not null,
  primary key (league_id, week_start)
);
comment on table public.league_weeks is
  'Final tables, written on the first read after the whistle (or the early final). Keeps the final card stable if members later leave or rename. Holds user ids: never returned to clients as stored.';

create table public.league_claims (
  token_hash  text primary key,
  from_user   uuid not null references auth.users (id) on delete cascade,
  expires_at  timestamptz not null
);
create index league_claims_from_user_idx on public.league_claims (from_user);

create table public.league_join_tries (
  user_id   uuid not null references auth.users (id) on delete cascade,
  tried_at  timestamptz not null default now()
);
create index league_join_tries_user_idx on public.league_join_tries (user_id, tried_at);

alter table public.leagues           enable row level security;
alter table public.league_members    enable row level security;
alter table public.league_results    enable row level security;
alter table public.league_weeks      enable row level security;
alter table public.league_claims     enable row level security;
alter table public.league_join_tries enable row level security;
-- No policies. Defaults grant client roles privileges on a new public table,
-- so revoke explicitly (standing rule).
revoke all on table public.leagues           from anon, authenticated, public;
revoke all on table public.league_members    from anon, authenticated, public;
revoke all on table public.league_results    from anon, authenticated, public;
revoke all on table public.league_weeks      from anon, authenticated, public;
revoke all on table public.league_claims     from anon, authenticated, public;
revoke all on table public.league_join_tries from anon, authenticated, public;

-- ── HELPERS (no grants) ─────────────────────────────────────────────────────

-- Edition -> the puzzle's day index. Anchors in step with the JS (see header).
create or replace function public._league_day_index(p_game text, p_edition integer)
returns integer
language sql immutable set search_path to 'public'
as $function$
  select case p_game
    when 'footle' then p_edition + 20576
    when 'trail'  then p_edition + 20667
    when 'top10'  then p_edition + 20737
    when 'daily7' then p_edition
    else null
  end;
$function$;

-- The fixed scale. Every played daily is worth 1 to 10.
--   footle  bucket = guesses when won: 1->10 ... 6->5; missed -> 1
--   trail   bucket = clubs used when won: 1->10 ... 6 or more -> 5; missed -> 1
--   daily7  bucket = score 0..7: 0 -> 1, otherwise score + 3
--   top10   bucket = names found 0..10: the number found, minimum 1
create or replace function public._league_points(p_game text, p_bucket integer, p_won boolean)
returns smallint
language sql immutable set search_path to 'public'
as $function$
  select (case
    when p_game in ('footle','trail') then
      case when p_won is not true or p_bucket is null or p_bucket < 1 then 1
           else greatest(5, 11 - p_bucket) end
    when p_game = 'daily7' then
      case when coalesce(p_bucket, 0) <= 0 then 1 else least(7, p_bucket) + 3 end
    when p_game = 'top10' then greatest(1, least(10, coalesce(p_bucket, 0)))
    else null
  end)::smallint;
$function$;

-- Monday of the week containing a day. Day 0 (1970-01-01) was a Thursday.
create or replace function public._league_week_start(p_day integer)
returns integer
language sql immutable set search_path to 'public'
as $function$
  select p_day - ((p_day + 3) % 7);
$function$;

-- Today, as a day index, in a zone.
create or replace function public._league_today(p_tz text)
returns integer
language sql stable set search_path to 'public'
as $function$
  select ((now() at time zone p_tz)::date - date '1970-01-01');
$function$;

-- Monday 00:00 after the week, in the league's zone, as an instant.
create or replace function public._league_whistle(p_league_id uuid, p_week_start integer)
returns timestamptz
language sql stable set search_path to 'public'
as $function$
  select ((date '1970-01-01' + (p_week_start + 7))::timestamp at time zone l.tz)
  from public.leagues l where l.id = p_league_id;
$function$;

-- The week's table as jsonb rows, ordered, with banter labels computed. Holds
-- each row's user id under "uid": callers strip it before anything leaves.
--   order:  points, then 10-point results, then days played; equal on all three
--           shares a rank ("=2"); earliest join only orders the display.
--   crown:  rank 1 (with points). Shared rank 1 -> joint winners.
--   spoon:  lowest total among members who scored; needs 3+ who scored, and a
--           table where not everyone is level.
--   bottled: the OUTRIGHT leader on Monday to Thursday points who finished worse
--           than third; needs 4+ who scored.
--   ghost:  no results all week, for a member who joined by Thursday.
create or replace function public._league_standings(p_league_id uuid, p_week_start integer)
returns jsonb
language plpgsql stable set search_path to 'public'
as $function$
declare
  v_whistle timestamptz := public._league_whistle(p_league_id, p_week_start);
  v_out jsonb;
begin
  if v_whistle is null then return '[]'::jsonb; end if;
  with m as (
    select lm.user_id, lm.display_name, lm.joined_at, lm.joined_day
    from public.league_members lm
    where lm.league_id = p_league_id
      and lm.joined_at < v_whistle
      and lm.joined_day <= p_week_start + 6
      and (lm.left_at is null or lm.left_at >= v_whistle)
  ),
  r as (
    select m.user_id, lr.day_index, lr.points
    from m
    join public.league_results lr on lr.user_id = m.user_id
    where lr.day_index between p_week_start and p_week_start + 6
      and lr.day_index >= m.joined_day
      and lr.recorded_at < v_whistle
  ),
  d as (
    select r.user_id, r.day_index, sum(r.points)::int as pts
    from r group by r.user_id, r.day_index
  ),
  agg as (
    select m.user_id, m.display_name, m.joined_at, m.joined_day,
      coalesce((select sum(d.pts) from d where d.user_id = m.user_id), 0)::int as points,
      (select count(*) from r where r.user_id = m.user_id and r.points = 10)::int as tens,
      (select count(*) from d where d.user_id = m.user_id)::int as days,
      coalesce((select sum(d.pts) from d where d.user_id = m.user_id and d.day_index <= p_week_start + 3), 0)::int as early,
      (select jsonb_agg((select d.pts from d where d.user_id = m.user_id and d.day_index = p_week_start + g.i) order by g.i)
         from generate_series(0, 6) as g(i)) as per_day
    from m
  ),
  ranked as (
    select agg.*,
      rank() over (order by agg.points desc, agg.tens desc, agg.days desc) as rnk
    from agg
  ),
  te as (
    select max(ranked.early) as top_early from ranked
  ),
  s as (
    select
      count(*) filter (where ranked.points > 0) as scorers,
      min(ranked.points) filter (where ranked.points > 0) as low,
      max(ranked.points) as high,
      max(te.top_early) as top_early,
      count(*) filter (where ranked.early = te.top_early) as top_early_n
    from ranked cross join te
  )
  select jsonb_agg(jsonb_build_object(
      'uid', ranked.user_id,
      'rank', ranked.rnk,
      'tied', (select count(*) from ranked t where t.rnk = ranked.rnk) > 1,
      'name', ranked.display_name,
      'points', ranked.points,
      'tens', ranked.tens,
      'days', ranked.days,
      'per_day', ranked.per_day,
      'joined_day', ranked.joined_day,
      'labels', to_jsonb(array_remove(array[
        case when ranked.rnk = 1 and ranked.points > 0 then 'crown' end,
        case when s.scorers >= 3 and ranked.points > 0 and ranked.points = s.low and s.low < s.high then 'spoon' end,
        case when s.scorers >= 4 and ranked.rnk > 3 and s.top_early > 0 and s.top_early_n = 1
              and ranked.early = s.top_early then 'bottled' end,
        case when ranked.days = 0 and ranked.joined_day <= p_week_start + 3 then 'ghost' end
      ]::text[], null))
    ) order by ranked.rnk, ranked.joined_at)
  into v_out
  from ranked cross join s;
  return coalesce(v_out, '[]'::jsonb);
end;
$function$;

-- Is the week final? At the whistle, or earlier from Sunday once every member
-- who joined by Sunday has a result for all four games on Sunday's day.
create or replace function public._league_is_final(p_league_id uuid, p_week_start integer)
returns boolean
language plpgsql stable set search_path to 'public'
as $function$
declare
  v_tz text;
  v_whistle timestamptz;
  v_sunday integer := p_week_start + 6;
begin
  select l.tz into v_tz from public.leagues l where l.id = p_league_id;
  if v_tz is null then return false; end if;
  v_whistle := public._league_whistle(p_league_id, p_week_start);
  if now() >= v_whistle then return true; end if;
  if public._league_today(v_tz) < v_sunday then return false; end if;
  return exists (
      select 1 from public.league_members lm
      where lm.league_id = p_league_id and lm.left_at is null and lm.joined_day <= v_sunday
    )
    and not exists (
      select 1 from public.league_members lm
      where lm.league_id = p_league_id and lm.left_at is null and lm.joined_day <= v_sunday
        and (select count(distinct lr.game) from public.league_results lr
             where lr.user_id = lm.user_id and lr.day_index = v_sunday and lr.recorded_at < v_whistle) < 4
    );
end;
$function$;

-- The stored final for a week, written on first read once the week is final.
-- Returns null while the week is still live.
create or replace function public._league_final_rows(p_league_id uuid, p_week_start integer)
returns jsonb
language plpgsql volatile set search_path to 'public'
as $function$
declare
  v_rows jsonb;
begin
  select w.standings into v_rows from public.league_weeks w
  where w.league_id = p_league_id and w.week_start = p_week_start;
  if found then return v_rows; end if;
  if not public._league_is_final(p_league_id, p_week_start) then return null; end if;
  v_rows := public._league_standings(p_league_id, p_week_start);
  insert into public.league_weeks (league_id, week_start, standings)
  values (p_league_id, p_week_start, v_rows)
  on conflict (league_id, week_start) do nothing;
  select w.standings into v_rows from public.league_weeks w
  where w.league_id = p_league_id and w.week_start = p_week_start;
  return v_rows;
end;
$function$;

-- Rows as a client may see them: no user ids, "is_me" instead, and labels
-- only on a final table.
create or replace function public._league_public_rows(p_rows jsonb, p_me uuid, p_final boolean)
returns jsonb
language sql immutable set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
      (e - 'uid' - 'labels')
      || jsonb_build_object('is_me', (e ->> 'uid') = p_me::text)
      || jsonb_build_object('labels', case when p_final then coalesce(e -> 'labels', '[]'::jsonb) else '[]'::jsonb end)
      order by o), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) with ordinality as x(e, o);
$function$;

-- A display name, cleaned: trimmed, inner whitespace collapsed. Null if empty,
-- too long or profane.
create or replace function public._league_clean_name(p_name text, p_max integer)
returns text
language plpgsql immutable set search_path to 'public'
as $function$
declare
  v text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if v = '' or char_length(v) > p_max then return null; end if;
  if public.is_profane_username(v) then return null; end if;
  return v;
end;
$function$;

-- ── CLIENT FUNCTIONS ────────────────────────────────────────────────────────

-- The only write of a result. Records for any session holder, member or not,
-- so the join day counts for a signed-in player who joins later that day.
-- Returns the stored points (the first write's, on a replay), or null.
create or replace function public.record_league_result(
  p_game text, p_edition integer, p_bucket integer, p_won boolean
) returns smallint
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_day integer;
  v_now double precision := extract(epoch from now());
  v_pts smallint;
begin
  if v_uid is null then return null; end if;
  if p_game is null or p_game not in ('footle','daily7','trail','top10') then return null; end if;
  if p_edition is null or p_edition < 0 or p_edition > 100000 then return null; end if;
  if p_bucket is null or p_bucket < 0 then return null; end if;
  if (p_game = 'footle' and p_bucket > 6) or (p_game = 'trail' and p_bucket > 30)
     or (p_game = 'daily7' and p_bucket > 7) or (p_game = 'top10' and p_bucket > 10) then
    return null;
  end if;
  v_day := public._league_day_index(p_game, p_edition);
  if v_day is null then return null; end if;
  -- Live somewhere on Earth: from UTC+14's midnight to UTC-12's end of the day.
  if v_now < v_day::double precision * 86400 - 14 * 3600
     or v_now > (v_day + 1)::double precision * 86400 + 12 * 3600 then
    return null;
  end if;
  select lr.points into v_pts from public.league_results lr
  where lr.user_id = v_uid and lr.game = p_game and lr.edition = p_edition;
  if found then return v_pts; end if;
  -- Global throttle, same posture as record_daily_result.
  if (select count(*) from public.league_results where recorded_at > now() - interval '1 hour') >= 5000 then
    return null;
  end if;
  insert into public.league_results (user_id, game, edition, day_index, bucket, won, points)
  values (v_uid, p_game, p_edition, v_day, p_bucket, coalesce(p_won, true),
          public._league_points(p_game, p_bucket, coalesce(p_won, true)))
  on conflict (user_id, game, edition) do nothing;
  select lr.points into v_pts from public.league_results lr
  where lr.user_id = v_uid and lr.game = p_game and lr.edition = p_edition;
  return v_pts;
end;
$function$;

-- Create a league; the caller is its owner and first member.
-- Returns {id, code, name} or {error: bad_name | bad_display_name | rate_limited | too_many}.
create or replace function public.create_league(
  p_name text, p_tz text, p_display_name text, p_seed text default 'manual'
) returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_member text;
  v_tz text := 'UTC';
  v_seed text := 'manual';
  v_alpha constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
  v_id uuid;
  v_try integer := 0;
  v_idx integer[] := array[0,1,2,3,4,5,7,9];  -- uuid v4 bytes with no fixed bits
  i integer;
begin
  if v_uid is null then return null; end if;
  v_name := public._league_clean_name(p_name, 32);
  if v_name is null then return jsonb_build_object('error', 'bad_name'); end if;
  v_member := public._league_clean_name(p_display_name, 22);
  if v_member is null then return jsonb_build_object('error', 'bad_display_name'); end if;
  if p_tz is not null and char_length(p_tz) <= 64
     and exists (select 1 from pg_timezone_names where name = p_tz) then
    v_tz := p_tz;
  end if;
  if p_seed in ('manual','h2h_footle','h2h_trail','h2h_top10','h2h_daily7') then v_seed := p_seed; end if;
  if (select count(*) from public.leagues l where l.owner_id = v_uid and l.created_at > now() - interval '24 hours') >= 10 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  if (select count(*) from public.league_members lm where lm.user_id = v_uid and lm.left_at is null) >= 10 then
    return jsonb_build_object('error', 'too_many');
  end if;
  loop
    v_try := v_try + 1;
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    foreach i in array v_idx loop
      v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 31) + 1, 1);
    end loop;
    begin
      insert into public.leagues (code, name, tz, owner_id, seed)
      values (v_code, v_name, v_tz, v_uid, v_seed)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_try >= 8 then raise; end if;
    end;
  end loop;
  insert into public.league_members (league_id, user_id, display_name, joined_day)
  values (v_id, v_uid, v_member, public._league_today(v_tz));
  return jsonb_build_object('id', v_id, 'code', v_code, 'name', v_name);
end;
$function$;

-- Join by code. Throttled per user: 30 tries an hour, counted here.
-- Returns {id, code, name, seed} or {error: rate_limited | not_found | bad_display_name | full | too_many}.
create or replace function public.join_league(p_code text, p_display_name text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_member text;
  v_league public.leagues%rowtype;
  v_existing public.league_members%rowtype;
  v_had boolean;
begin
  if v_uid is null then return null; end if;
  delete from public.league_join_tries where user_id = v_uid and tried_at < now() - interval '1 hour';
  if (select count(*) from public.league_join_tries where user_id = v_uid) >= 30 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  insert into public.league_join_tries (user_id) values (v_uid);
  if v_code !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$' then
    return jsonb_build_object('error', 'not_found');
  end if;
  select * into v_league from public.leagues where code = v_code;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  v_member := public._league_clean_name(p_display_name, 22);
  if v_member is null then return jsonb_build_object('error', 'bad_display_name'); end if;
  select * into v_existing from public.league_members
  where league_id = v_league.id and user_id = v_uid;
  v_had := found;
  if v_had and v_existing.left_at is null then
    return jsonb_build_object('id', v_league.id, 'code', v_league.code, 'name', v_league.name, 'seed', v_league.seed);
  end if;
  if (select count(*) from public.league_members lm where lm.league_id = v_league.id and lm.left_at is null) >= 20 then
    return jsonb_build_object('error', 'full');
  end if;
  if (select count(*) from public.league_members lm where lm.user_id = v_uid and lm.left_at is null) >= 10 then
    return jsonb_build_object('error', 'too_many');
  end if;
  if v_had then
    -- Rejoining clears left_at; the original join day stands.
    update public.league_members set left_at = null, display_name = v_member
    where league_id = v_league.id and user_id = v_uid;
  else
    insert into public.league_members (league_id, user_id, display_name, joined_day)
    values (v_league.id, v_uid, v_member, public._league_today(v_league.tz));
  end if;
  return jsonb_build_object('id', v_league.id, 'code', v_league.code, 'name', v_league.name, 'seed', v_league.seed);
end;
$function$;

create or replace function public.leave_league(p_league_id uuid)
returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return null; end if;
  update public.league_members set left_at = now()
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  return found;
end;
$function$;

create or replace function public.set_league_display_name(p_league_id uuid, p_name text)
returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then return null; end if;
  v_name := public._league_clean_name(p_name, 22);
  if v_name is null then return false; end if;
  update public.league_members set display_name = v_name
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  return found;
end;
$function$;

-- One line per active league, latest activity first: rank, points, gap to the
-- leader, the leader's name, this week's seven day totals, whether the week is
-- final and whether last week's final is still unseen.
create or replace function public.get_my_leagues()
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_out jsonb := '[]'::jsonb;
  rec record;
  v_today integer;
  v_week integer;
  v_rows jsonb;
  v_final boolean;
  v_me jsonb;
  v_lead jsonb;
  v_prev_unseen boolean;
  v_activity timestamptz;
begin
  if v_uid is null then return null; end if;
  for rec in
    select l.id, l.code, l.name, l.tz, l.created_at, lm.joined_at, lm.seen_week
    from public.league_members lm
    join public.leagues l on l.id = lm.league_id
    where lm.user_id = v_uid and lm.left_at is null
  loop
    v_today := public._league_today(rec.tz);
    v_week := public._league_week_start(v_today);
    v_final := public._league_is_final(rec.id, v_week);
    v_rows := case when v_final then public._league_final_rows(rec.id, v_week)
                   else public._league_standings(rec.id, v_week) end;
    select e into v_me from jsonb_array_elements(v_rows) e where e ->> 'uid' = v_uid::text limit 1;
    select e into v_lead from jsonb_array_elements(v_rows) e order by (e ->> 'points')::int desc limit 1;
    -- Last week had a table for this member if they were in before its whistle.
    v_prev_unseen := rec.joined_at < public._league_whistle(rec.id, v_week - 7)
      and coalesce(rec.seen_week, -1) < v_week - 7;
    select max(lr.recorded_at) into v_activity
    from public.league_members m2
    join public.league_results lr on lr.user_id = m2.user_id
    where m2.league_id = rec.id and m2.left_at is null
      and lr.day_index between v_week and v_week + 6;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'code', rec.code,
      'name', rec.name,
      'tz', rec.tz,
      'week_start', v_week,
      'today', v_today,
      'is_final', v_final,
      'members', jsonb_array_length(v_rows),
      'my_rank', v_me -> 'rank',
      'my_tied', v_me -> 'tied',
      'my_points', coalesce((v_me ->> 'points')::int, 0),
      'my_days', coalesce(v_me -> 'per_day', '[]'::jsonb),
      'leader_name', case when (v_lead ->> 'uid') = v_uid::text then null else v_lead ->> 'name' end,
      'leader_points', coalesce((v_lead ->> 'points')::int, 0),
      'gap', greatest(0, coalesce((v_lead ->> 'points')::int, 0) - coalesce((v_me ->> 'points')::int, 0)),
      'last_final_unseen', coalesce(v_prev_unseen, false),
      'activity', greatest(coalesce(v_activity, rec.joined_at), rec.joined_at)
    ));
  end loop;
  select coalesce(jsonb_agg(e order by (e ->> 'activity') desc), '[]'::jsonb) into v_out
  from jsonb_array_elements(v_out) e;
  return v_out;
end;
$function$;

-- The table for one week (default: this week). Members only. Never returns
-- another member's user id. Writes the final snapshot on the first read after
-- the whistle or the early final, and marks the final as seen.
create or replace function public.get_league_table(p_league_id uuid, p_week_start integer default null)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_league public.leagues%rowtype;
  v_member public.league_members%rowtype;
  v_today integer;
  v_current integer;
  v_week integer;
  v_final boolean;
  v_rows jsonb;
  v_prev jsonb;
  v_last jsonb := null;
  v_winners text[];
  v_top integer;
begin
  if v_uid is null then return null; end if;
  select * into v_member from public.league_members
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  if not found then return null; end if;
  select * into v_league from public.leagues where id = p_league_id;
  if not found then return null; end if;
  v_today := public._league_today(v_league.tz);
  v_current := public._league_week_start(v_today);
  v_week := coalesce(p_week_start, v_current);
  if v_week > v_current or v_week <> public._league_week_start(v_week) then return null; end if;
  v_final := public._league_is_final(p_league_id, v_week);
  if v_final then
    v_rows := public._league_final_rows(p_league_id, v_week);
    update public.league_members set seen_week = greatest(coalesce(seen_week, -1), v_week)
    where league_id = p_league_id and user_id = v_uid;
  else
    v_rows := public._league_standings(p_league_id, v_week);
  end if;
  -- Last week's one line, from its stored final.
  if v_league.created_at < public._league_whistle(p_league_id, v_week - 7) then
    v_prev := public._league_final_rows(p_league_id, v_week - 7);
    if v_prev is not null and jsonb_array_length(v_prev) > 0 then
      select max((e ->> 'points')::int) into v_top from jsonb_array_elements(v_prev) e;
      if v_top > 0 then
        select array_agg(e ->> 'name' order by o) into v_winners
        from jsonb_array_elements(v_prev) with ordinality as x(e, o)
        where (e ->> 'points')::int = v_top and (e ->> 'rank')::int = 1;
        v_last := jsonb_build_object('winners', to_jsonb(v_winners), 'points', v_top, 'week_start', v_week - 7);
      end if;
    end if;
  end if;
  return jsonb_build_object(
    'meta', jsonb_build_object(
      'id', v_league.id,
      'name', v_league.name,
      'code', v_league.code,
      'tz', v_league.tz,
      'seed', v_league.seed,
      'week_start', v_week,
      'today', v_today,
      'whistle', public._league_whistle(p_league_id, v_week),
      'is_final', v_final,
      'is_owner', v_league.owner_id = v_uid,
      'my_joined_day', v_member.joined_day,
      'my_name', v_member.display_name
    ),
    'rows', public._league_public_rows(v_rows, v_uid, v_final),
    'last_week', v_last
  );
end;
$function$;

-- Before an anonymous player signs in to an existing account: a single-use
-- token (stored hashed, 30 minutes) that league_claim redeems from the account.
create or replace function public.league_issue_claim()
returns text
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then return null; end if;
  if not exists (select 1 from auth.users u where u.id = v_uid and u.is_anonymous is true) then
    return null;
  end if;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  delete from public.league_claims where from_user = v_uid or expires_at < now();
  insert into public.league_claims (token_hash, from_user, expires_at)
  values (encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_uid, now() + interval '30 minutes');
  return v_token;
end;
$function$;

-- Redeem a claim: moves the anonymous source's memberships and results onto
-- the caller. The account's own rows win where both exist. Only ever moves
-- FROM an account that is still anonymous. Returns the number of rows moved.
create or replace function public.league_claim(p_token text)
returns integer
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_from uuid;
  v_n1 integer := 0;
  v_n2 integer := 0;
begin
  if v_uid is null or p_token is null or char_length(p_token) <> 64 then return 0; end if;
  delete from public.league_claims
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and expires_at > now()
  returning from_user into v_from;
  if v_from is null or v_from = v_uid then return 0; end if;
  if not exists (select 1 from auth.users u where u.id = v_from and u.is_anonymous is true) then
    return 0;
  end if;
  insert into public.league_members (league_id, user_id, display_name, joined_at, joined_day, left_at, seen_week)
  select lm.league_id, v_uid, lm.display_name, lm.joined_at, lm.joined_day, lm.left_at, lm.seen_week
  from public.league_members lm where lm.user_id = v_from
  on conflict (league_id, user_id) do nothing;
  get diagnostics v_n1 = row_count;
  delete from public.league_members where user_id = v_from;
  insert into public.league_results (user_id, game, edition, day_index, bucket, won, points, recorded_at)
  select v_uid, lr.game, lr.edition, lr.day_index, lr.bucket, lr.won, lr.points, lr.recorded_at
  from public.league_results lr where lr.user_id = v_from
  on conflict (user_id, game, edition) do nothing;
  get diagnostics v_n2 = row_count;
  delete from public.league_results where user_id = v_from;
  update public.leagues set owner_id = v_uid where owner_id = v_from;
  -- Stored finals name members by uid; keep "is_me" true for the mover.
  update public.league_weeks
     set standings = replace(standings::text, v_from::text, v_uid::text)::jsonb
   where standings::text like '%' || v_from::text || '%';
  return v_n1 + v_n2;
end;
$function$;

-- ── ACCOUNT DELETION ────────────────────────────────────────────────────────
-- The cascades already cover these rows; the explicit sweep matches the rest
-- of this function. Body re-read from prod on 2026-10-16 (it matched the
-- snapshot); only the league block is new.
create or replace function public.delete_user_account()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Storage: avatar object (best-effort; never blocks the account delete)
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
      where bucket_id = 'avatars' and name = v_uid || '.jpg';
    perform set_config('storage.allow_delete_query', 'false', true);
  exception when others then
    raise warning 'delete_user_account: avatar cleanup failed for %: %', v_uid, sqlerrm;
  end;

  -- Social graph + moderation state owned by the user
  delete from public.user_blocks
    where blocker_id = v_uid or blocked_id = v_uid;
  delete from public.friendships
    where requester_id = v_uid or addressee_id = v_uid;

  -- Async challenges: remove created challenges (row + challenger_name), and
  -- anonymise acceptances of others' challenges. Guarded so pre-async-challenge
  -- environments don't error on the missing table.
  begin
    delete from public.challenge_invites where challenger_id = v_uid;
    update public.challenge_invites
       set accepted_id = null, accepted_name = null,
           accepted_score = null, accepted_total = null, accepted_at = null
     where accepted_id = v_uid;
  exception when undefined_table then
    null; -- async challenges not deployed here
  end;

  -- Mates' leagues (v3_0). Leagues the user owns stay for the other members.
  delete from public.league_members    where user_id = v_uid;
  delete from public.league_results    where user_id = v_uid;
  delete from public.league_claims     where from_user = v_uid;
  delete from public.league_join_tries where user_id = v_uid;
  update public.leagues set owner_id = null where owner_id = v_uid;

  -- Game data (scores / user_game_state also CASCADE from profiles;
  -- explicit deletes kept for clarity + cascade-independence)
  delete from public.scores          where user_id = v_uid;
  delete from public.user_game_state where user_id = v_uid;
  delete from public.room_players    where user_id = v_uid;
  delete from public.game_rooms      where host_id = v_uid;

  -- Profile row
  delete from public.profiles where id = v_uid;

  -- The account itself — LAST, after all app data is gone.
  delete from auth.users where id = v_uid;
end;
$function$;

-- ── GRANTS ──────────────────────────────────────────────────────────────────
-- Helpers: no grants at all.
revoke all on function public._league_day_index(text, integer)              from public, anon, authenticated;
revoke all on function public._league_points(text, integer, boolean)        from public, anon, authenticated;
revoke all on function public._league_week_start(integer)                   from public, anon, authenticated;
revoke all on function public._league_today(text)                           from public, anon, authenticated;
revoke all on function public._league_whistle(uuid, integer)                from public, anon, authenticated;
revoke all on function public._league_standings(uuid, integer)              from public, anon, authenticated;
revoke all on function public._league_is_final(uuid, integer)               from public, anon, authenticated;
revoke all on function public._league_final_rows(uuid, integer)             from public, anon, authenticated;
revoke all on function public._league_public_rows(jsonb, uuid, boolean)     from public, anon, authenticated;
revoke all on function public._league_clean_name(text, integer)             from public, anon, authenticated;

-- Client functions: authenticated only, and the revoke from public LAST.
revoke all on function public.record_league_result(text, integer, integer, boolean) from anon;
grant execute on function public.record_league_result(text, integer, integer, boolean) to authenticated;
revoke all on function public.record_league_result(text, integer, integer, boolean) from public;

revoke all on function public.create_league(text, text, text, text) from anon;
grant execute on function public.create_league(text, text, text, text) to authenticated;
revoke all on function public.create_league(text, text, text, text) from public;

revoke all on function public.join_league(text, text) from anon;
grant execute on function public.join_league(text, text) to authenticated;
revoke all on function public.join_league(text, text) from public;

revoke all on function public.leave_league(uuid) from anon;
grant execute on function public.leave_league(uuid) to authenticated;
revoke all on function public.leave_league(uuid) from public;

revoke all on function public.set_league_display_name(uuid, text) from anon;
grant execute on function public.set_league_display_name(uuid, text) to authenticated;
revoke all on function public.set_league_display_name(uuid, text) from public;

revoke all on function public.get_my_leagues() from anon;
grant execute on function public.get_my_leagues() to authenticated;
revoke all on function public.get_my_leagues() from public;

revoke all on function public.get_league_table(uuid, integer) from anon;
grant execute on function public.get_league_table(uuid, integer) to authenticated;
revoke all on function public.get_league_table(uuid, integer) from public;

revoke all on function public.league_issue_claim() from anon;
grant execute on function public.league_issue_claim() to authenticated;
revoke all on function public.league_issue_claim() from public;

revoke all on function public.league_claim(text) from anon;
grant execute on function public.league_claim(text) to authenticated;
revoke all on function public.league_claim(text) from public;

-- Same signature as before: restated so this file stands on its own.
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;
revoke all on function public.delete_user_account() from public;
