-- ── WHY ──────────────────────────────────────────────────────────────────────
-- Two defects in one table, both invisible from the read side.
--
-- (1) `club` is really "page slug". logRound sends location.pathname segment 1,
--     and five builders write into /quiz/<slug>/: clubs, players, nations,
--     categories and listicles. A headline of "893 club completions across 66
--     packs" was every /quiz/ slug; the club-only figure is 719 across 53. That
--     number was used to argue for a navigation change.
--
-- (2) The localised layer is structurally absent. logRound returns unless
--     pathname segment 0 is literally 'quiz', so /es/quiz/river-plate/ has
--     never written a row — while the funnel row for the same finish is tagged
--     surface:'club-page'. /es/ River Plate is measured at 134 clicks against 8
--     for its English twin, so this is not a rounding error going forward.
--
-- ⚠️ FIXING (2) WITHOUT (1)'s LANGUAGE DIMENSION WOULD BE WORSE THAN THE BUG.
-- Localised slugs are identical to their English twins, so simply dropping the
-- /quiz/ gate would merge Spanish River Plate rounds into the English
-- `river-plate` row under one label — turning a visible absence into an
-- invisible corruption of the exact per-club read the front door's club
-- ordering depends on. The language column has to exist first.
--
-- STILL NO PERSONAL DATA. Both columns describe the PAGE, not the visitor. The
-- table's founding invariant (v1_5:20-23) — no user id, no session id, rows not
-- joinable to a person — is unchanged. A per-visitor key would reverse that; it
-- is a separate product decision and is NOT taken here.

alter table public.club_quiz_results
  add column if not exists kind text not null default 'unknown'
    check (kind in ('club','player','nation','category','list','unknown')),
  add column if not exists lang text not null default 'en'
    check (lang ~ '^[a-z]{2}$');

-- Existing rows keep kind='unknown', NOT 'club'. They are genuinely unknown at
-- the row level: the class has to be recovered by joining `club` against
-- scripts/seo/clubs.mjs. Defaulting them to 'club' would bake in the exact
-- error this migration exists to end. lang='en' IS correct for every existing
-- row, because logRound has never accepted a non-/quiz/ path.

comment on column public.club_quiz_results.club is
  'Page slug, NOT necessarily a club. Join with kind. Rows before v2_0 are kind=unknown.';

-- ── the only way in ──────────────────────────────────────────────────────────
create or replace function public.log_club_quiz(
  p_club    text,
  p_total   smallint,
  p_correct smallint,
  p_rounds  smallint default 1,
  p_easy_c  smallint default 0,
  p_easy_t  smallint default 0,
  p_med_c   smallint default 0,
  p_med_t   smallint default 0,
  p_hard_c  smallint default 0,
  p_hard_t  smallint default 0,
  p_kind    text     default 'unknown',
  p_lang    text     default 'en'
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_club text := nullif(trim(lower(p_club)), '');
  v_kind text := lower(coalesce(nullif(trim(p_kind), ''), 'unknown'));
  v_lang text := lower(coalesce(nullif(trim(p_lang), ''), 'en'));
begin
  -- Shape gate. Silent return, never raise: this is fire-and-forget telemetry
  -- from a static page, and a caller that can tell "rejected" from "accepted"
  -- is a caller that can probe the table.
  if v_club is null or length(v_club) > 64 then return; end if;
  if p_total   is null or p_total < 1 or p_total > 60 then return; end if;
  if p_correct is null or p_correct < 0 or p_correct > p_total then return; end if;

  -- An unrecognised class or language is normalised, never rejected: losing
  -- the round is worse than filing it as unknown.
  if v_kind not in ('club','player','nation','category','list') then v_kind := 'unknown'; end if;
  if v_lang !~ '^[a-z]{2}$' then v_lang := 'en'; end if;

  -- Silent throttles, unchanged in size. The per-slug cap is now also per-lang,
  -- so a busy English page cannot throttle its Spanish twin.
  if (select count(*) from public.club_quiz_results
        where created_at > now() - interval '1 hour') >= 3000 then
    return;
  end if;
  if (select count(*) from public.club_quiz_results
        where club = v_club and lang = v_lang
          and created_at > now() - interval '1 hour') >= 300 then
    return;
  end if;

  insert into public.club_quiz_results
    (club, kind, lang, total, correct, rounds,
     easy_c, easy_t, med_c, med_t, hard_c, hard_t)
  values
    (v_club, v_kind, v_lang,
     p_total, p_correct,
     greatest(1, least(coalesce(p_rounds, 1), 50)),
     greatest(0, least(coalesce(p_easy_c, 0), 60)),
     greatest(0, least(coalesce(p_easy_t, 0), 60)),
     greatest(0, least(coalesce(p_med_c,  0), 60)),
     greatest(0, least(coalesce(p_med_t,  0), 60)),
     greatest(0, least(coalesce(p_hard_c, 0), 60)),
     greatest(0, least(coalesce(p_hard_t, 0), 60)));
end;
$function$;

-- ⚠️ THE OLD 10-ARG OVERLOAD IS DROPPED, AND THE REASONING THAT SAID TO KEEP IT
-- WAS BACKWARDS. The plan this migration came from argued for a delegating
-- 10-arg overload so cached pages would not lose rows during rollover. Applied
-- to prod, that immediately broke every existing call:
--
--   ERROR 42725: function public.log_club_quiz(...) is not unique
--
-- Because the NEW function defaults p_kind and p_lang, a 10-argument call
-- matches BOTH candidates and Postgres refuses to choose. Every club page still
-- serving the old JS would have stopped writing — silently, since this is
-- fire-and-forget telemetry that swallows its own failures. A total, invisible
-- data loss shipped in the name of preventing one.
--
-- Dropping it is safe for exactly the reason the delegator was thought to be
-- needed: those same defaults already accept a 10-argument call, so a cached
-- page resolves to the new function and files as kind='unknown', lang='en',
-- which is true of it. Verified against prod inside a rolled-back transaction:
-- a 10-arg call lands kind=unknown/lang=en, a 12-arg call with 'ES' lands
-- lang='es', and a garbage kind/lang normalises rather than rejecting.
drop function if exists public.log_club_quiz(
  text, smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint);

grant execute on function public.log_club_quiz(
  text, smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint, text, text) to anon, authenticated;

-- ALWAYS LAST. Without these PUBLIC keeps execute (house rule: every function
-- migration ends with a revoke after its grants).
revoke execute on function public.log_club_quiz(
  text, smallint, smallint, smallint, smallint, smallint,
  smallint, smallint, smallint, smallint, text, text) from public;
