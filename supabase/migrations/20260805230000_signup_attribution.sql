-- Signup attribution: where did this account actually come from?
--
-- WHY. Measured 2026-08-05: activation is fixed (33% -> 82%) and retention is
-- healthy (72% return on 2+ days), so the constraint is now raw signup volume.
-- But nothing records where a signup CAME FROM — a repo-wide grep for
-- utm_/document.referrer/signup_source finds one commented-out line, and none
-- of the ~180 generated SEO pages tag their CTA into /play.
--
-- The arithmetic says we are guessing: site-wide search is ~11 clicks/day while
-- signups run 3.5/day, which would require a ~32% cold-visitor-to-account rate
-- on pages whose own hero says "no sign-up required". Something other than
-- organic search is producing accounts and we cannot see what. Every
-- distribution decision downstream is unguided until this exists.
--
-- ⚠️ WHY A SEPARATE TABLE AND NOT COLUMNS ON `profiles`.
-- public.profiles carries `SELECT ... USING (true)` for role public — every
-- profile row is readable by ANYONE holding the anon key. RLS filters ROWS, not
-- COLUMNS, so an attribution column on profiles would publish every user's
-- referrer, UTM tags and landing path to the world. Referrer URLs in particular
-- can carry personal context (a search query, a private forum, a DM link).
-- This repo has already been bitten by exactly that reasoning once, which is
-- why multiplayer picks live in their own deny-all table rather than on a
-- readable one. Same shape here.
--
-- READ MODEL: nobody reads this through the API. There is deliberately NO
-- select policy, so anon and authenticated get nothing back even for their own
-- row. Analysis happens over SQL as service_role. Write-only from the client.

create table if not exists public.signup_attribution (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  -- First touch, not last: overwritten never (see the insert policy + the
  -- primary key). A user who lands via a club page, leaves, and returns direct
  -- a week later was acquired by the club page.
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  landing_path  text,
  -- 'web' | 'ios' | 'android'. Provider != platform: Apple Sign In is offered
  -- on the web too, so auth.identities cannot answer "which platform".
  platform      text,
  created_at    timestamptz not null default now()
);

-- ⚠️ supabase_admin's default grants hand `anon` full DML on any new table in
-- public. Revoke first, then grant back only what is needed. Skipping this is
-- the single most repeated mistake in this project's migration history.
revoke all on public.signup_attribution from public;
revoke all on public.signup_attribution from anon;
revoke all on public.signup_attribution from authenticated;

alter table public.signup_attribution enable row level security;

-- Insert only, only your own row, only once (the primary key enforces "once",
-- which is what makes this FIRST-touch rather than last-touch).
grant insert on public.signup_attribution to authenticated;

create policy "insert own attribution once"
  on public.signup_attribution
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No SELECT, UPDATE or DELETE policy, and no grants for them, ON PURPOSE.
-- With RLS enabled and no policy, those operations return nothing / are denied
-- for anon and authenticated. service_role bypasses RLS for analysis.

comment on table public.signup_attribution is
  'First-touch acquisition data per account. WRITE-ONLY from the client: no select policy exists, deliberately. Kept off public.profiles because that table is world-readable (SELECT USING (true)) and RLS cannot filter columns.';
