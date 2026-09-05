-- v1_9_daily_results — the honest "how everyone did" behind the results panel.
--
-- The old DailySocialProof printed a FAKE percentile from a seeded curve and was
-- removed for App Store 2.3 (Accurate Metadata). This is the real one: one row
-- per (game, edition, visitor), written only through a security-definer RPC
-- (same shape as record_funnel_event), read back as an aggregate the client
-- shows only once a puzzle has 20+ results — nothing is shown before that.
--
-- bucket: guesses (Footle), clubs used (Trail), guesses (Mystery) when won;
--         0 = did not solve (X). Daily 7: bucket = score 0..7, won = true.
-- visitor_id is the browser's biq_vid; guests have one too, so dedupe works for
-- everyone. user_id rides along for future per-account reads; it is not needed
-- for the aggregate.
create table if not exists public.daily_results (
  id          bigserial primary key,
  game        text        not null check (game in ('footle','daily7','trail','mystery')),
  edition     integer     not null check (edition >= 0),
  bucket      smallint    not null check (bucket >= 0 and bucket <= 30),
  won         boolean     not null default true,
  visitor_id  uuid,
  user_id     uuid,
  created_at  timestamptz not null default now()
);
create unique index if not exists daily_results_one_per_visitor
  on public.daily_results (game, edition, visitor_id) where visitor_id is not null;
create index if not exists daily_results_game_edition on public.daily_results (game, edition);
comment on table public.daily_results is
  'One result per (game, edition, visitor). Written only via record_daily_result(); read via get_daily_distribution(). Feeds the "How everyone did" bars on the results panel (shown only at n>=20).';

alter table public.daily_results enable row level security;
-- No policies: nobody reads or writes the rows directly. Defaults grant anon
-- full DML on a new table, so revoke explicitly (standing rule).
revoke all on table public.daily_results from anon, authenticated, public;

create or replace function public.record_daily_result(
  p_game text, p_edition integer, p_bucket integer, p_won boolean, p_visitor uuid default null
) returns void
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if p_game is null or p_game not in ('footle','daily7','trail','mystery') then return; end if;
  if p_edition is null or p_edition < 0 or p_edition > 100000 then return; end if;
  if p_bucket is null or p_bucket < 0 or p_bucket > 30 then return; end if;
  if p_visitor is null then return; end if;
  -- Rate limit, same posture as record_funnel_event: a runaway client cannot
  -- fill the table.
  if (select count(*) from public.daily_results where created_at > now() - interval '1 hour') >= 5000 then
    return;
  end if;
  insert into public.daily_results (game, edition, bucket, won, visitor_id, user_id)
  values (p_game, p_edition, p_bucket, coalesce(p_won, true), p_visitor, auth.uid())
  on conflict (game, edition, visitor_id) where visitor_id is not null do nothing;
end;
$function$;

create or replace function public.get_daily_distribution(p_game text, p_edition integer)
returns jsonb
language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
    'n',   count(*),
    'won', count(*) filter (where won),
    'buckets', coalesce(
      (select jsonb_object_agg(b.bucket::text, b.c)
         from (select bucket, count(*) as c
                 from public.daily_results
                where game = p_game and edition = p_edition
                group by bucket) b),
      '{}'::jsonb)
  )
  from public.daily_results
  where game = p_game and edition = p_edition;
$function$;

grant execute on function public.record_daily_result(text, integer, integer, boolean, uuid) to anon, authenticated;
grant execute on function public.get_daily_distribution(text, integer) to anon, authenticated;
revoke all on function public.record_daily_result(text, integer, integer, boolean, uuid) from public;
revoke all on function public.get_daily_distribution(text, integer) from public;
