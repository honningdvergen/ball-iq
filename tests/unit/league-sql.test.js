import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * MATES' LEAGUES, RUN AS REAL SQL (v3_0_mates_leagues.sql).
 *
 * The points, the week, the order and the banter labels all live in SQL by
 * design (the client never sends points), so the only honest test of them is
 * to run the migration. This loads it into PGlite (Postgres compiled to WASM)
 * over a minimal stand-in for Supabase's `auth` schema, then plays fixture
 * weeks through it: a tie, a 3-member league with no "Bottled it", a late
 * joiner, a result after the whistle, and the grants.
 *
 * ⚠️ PGlite is NOT a dependency of this repo (it is ~23 MB and nothing ships
 * with it). The block below runs when it can be imported, from
 * node_modules or from the path in BIQ_PGLITE, and is skipped otherwise.
 * Adding `@electric-sql/pglite` to devDependencies makes it run on every build.
 */
let PGlite = null;
try {
  ({ PGlite } = await import(/* @vite-ignore */ process.env.BIQ_PGLITE || '@electric-sql/pglite'));
} catch { PGlite = null; }

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const MIG = read('../../supabase/migrations/v3_0_mates_leagues.sql');
const SNAP = read('../../supabase/prod-snapshot/functions.sql');
const PROFANE = SNAP.slice(SNAP.indexOf('CREATE OR REPLACE FUNCTION public.is_profane_username'));
const PROFANE_FN = PROFANE.slice(0, PROFANE.indexOf('$function$\n;') + '$function$\n;'.length);

// Supabase's pieces the migration leans on, at their smallest.
const STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, is_anonymous boolean not null default false);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('test.uid', true), '')::uuid $$;
  create schema storage;
  create table storage.objects (bucket_id text, name text);
  ${PROFANE_FN}
`;

const run = PGlite ? describe : describe.skip;

const U = {
  alex: '00000000-0000-4000-8000-00000000000a',
  sam:  '00000000-0000-4000-8000-00000000000b',
  jon:  '00000000-0000-4000-8000-00000000000c',
  kim:  '00000000-0000-4000-8000-00000000000d',
  lee:  '00000000-0000-4000-8000-00000000000e',
  guest: '00000000-0000-4000-8000-0000000000f1',
  stranger: '00000000-0000-4000-8000-0000000000f2',
};
// Mondays long gone, so their whistles have blown: day 20724 is Mon 28 Sep
// 2026. A player's results count in every league they are in, so each fixture
// plays a week of its own.
const WEEK = { tie: 20724, three: 20717, bottle: 20710, late: 20703 };
let W = WEEK.tie;

run('mates leagues in SQL', () => {
  let db;
  const as = async (uid) => db.query(`select set_config('test.uid', $1, false)`, [uid || '']);
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  const val = async (sql, params) => Object.values(await one(sql, params))[0];

  // A league with members joined on given days (offsets from the week's Monday) and results put straight in,
  // stamped well before the whistle unless said otherwise.
  async function league(name, members, week) {
    W = week;
    const id = await val(
      `insert into public.leagues (code, name, tz, owner_id, created_at)
       values ($1, $2, 'UTC', $3, (date '1970-01-01' + ${W - 30})::timestamptz) returning id`,
      [name.toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(8, 'Z').slice(0, 8).replace(/[IO0-1L]/g, 'Z'), name, members[0].uid]);
    for (const m of members) {
      await db.query(
        `insert into public.league_members (league_id, user_id, display_name, joined_at, joined_day)
         values ($1, $2, $3, (date '1970-01-01' + $4::int)::timestamptz + interval '1 hour', $4)`,
        [id, m.uid, m.name, W + (m.joined ?? -10)]);
    }
    return id;
  }
  // results: [[uid, game, dayOffset, points, lateBy?]]
  let ed = 1000;
  async function results(rows) {
    for (const [uid, game, off, pts, late] of rows) {
      const day = W + off;
      await db.query(
        `insert into public.league_results (user_id, game, edition, day_index, bucket, won, points, recorded_at)
         values ($1, $2, $3, $4, 1, true, $5,
           case when $6::boolean then (date '1970-01-01' + ${W + 7})::timestamptz + interval '5 minutes'
                else (date '1970-01-01' + $4::int)::timestamptz + interval '20 hours' end)
         on conflict do nothing`,
        [uid, game, ed++, day, pts, !!late]);
    }
  }
  const table = async (id) => (await db.query(`select public._league_standings($1, ${W}) as t`, [id])).rows[0].t;
  const byName = (t) => Object.fromEntries(t.map((r) => [r.name, r]));

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(STUB);
    await db.exec(MIG);
    for (const uid of Object.values(U)) {
      await db.query('insert into auth.users (id, is_anonymous) values ($1, $2)', [uid, uid === U.guest]);
    }
  }, 60000);

  it('the scale: every played daily is 1 to 10', async () => {
    const pts = async (g, b, w) => val('select public._league_points($1, $2, $3)', [g, b, w]);
    expect(await pts('footle', 1, true)).toBe(10);
    expect(await pts('footle', 6, true)).toBe(5);
    expect(await pts('footle', 0, false)).toBe(1);
    expect(await pts('trail', 2, true)).toBe(9);
    expect(await pts('trail', 9, true)).toBe(5);
    expect(await pts('daily7', 0, true)).toBe(1);
    expect(await pts('daily7', 7, true)).toBe(10);
    expect(await pts('top10', 0, true)).toBe(1);
    expect(await pts('top10', 7, true)).toBe(7);
  });

  it('a tie shares the rank and the crown; the spoon goes to the lowest scorer', async () => {
    const id = await league('Tie FC', [
      { uid: U.alex, name: 'Alex' }, { uid: U.sam, name: 'Sam' },
      { uid: U.jon, name: 'Jon' }, { uid: U.kim, name: 'Kim' },
    ], WEEK.tie);
    await results([
      [U.alex, 'footle', 0, 10], [U.alex, 'daily7', 1, 8], [U.alex, 'top10', 5, 6],
      [U.sam, 'footle', 0, 10], [U.sam, 'daily7', 2, 6], [U.sam, 'trail', 6, 8],
      [U.jon, 'footle', 4, 9], [U.jon, 'daily7', 4, 6],
      [U.kim, 'top10', 6, 3],
    ]);
    const t = await table(id);
    const r = byName(t);
    expect(r.Alex.points).toBe(24);
    expect(r.Sam.points).toBe(24);
    expect([r.Alex.rank, r.Sam.rank, r.Jon.rank, r.Kim.rank]).toEqual([1, 1, 3, 4]);
    expect(r.Alex.tied && r.Sam.tied).toBe(true);
    expect(r.Alex.labels).toContain('crown');
    expect(r.Sam.labels).toContain('crown');
    expect(r.Kim.labels).toEqual(['spoon']);
    expect(r.Jon.labels).toEqual([]);
    // Equal on points, tens and days: the earlier joiner is listed first.
    expect(t.map((x) => x.name).slice(0, 2)).toEqual(['Alex', 'Sam']);
  });

  it('a 3-member league never has a "Bottled it", even when the early leader finishes last', async () => {
    const id = await league('Three Men', [
      { uid: U.alex, name: 'Alex' }, { uid: U.sam, name: 'Sam' }, { uid: U.jon, name: 'Jon' },
    ], WEEK.three);
    await results([
      [U.jon, 'footle', 0, 10], [U.jon, 'daily7', 1, 10],          // 20 by Thursday, then nothing
      [U.alex, 'footle', 4, 10], [U.alex, 'daily7', 5, 10], [U.alex, 'top10', 6, 9],
      [U.sam, 'footle', 5, 10], [U.sam, 'daily7', 6, 10], [U.sam, 'top10', 6, 3],
    ]);
    const r = byName(await table(id));
    expect(r.Jon.rank).toBe(3);
    expect(r.Jon.labels).toEqual(['spoon']);
    expect(Object.values(r).some((x) => x.labels.includes('bottled'))).toBe(false);
  });

  it('the outright Monday-to-Thursday leader who finishes outside the top three bottled it', async () => {
    const id = await league('Bottlers', [
      { uid: U.alex, name: 'Alex' }, { uid: U.sam, name: 'Sam' }, { uid: U.jon, name: 'Jon' },
      { uid: U.kim, name: 'Kim' }, { uid: U.lee, name: 'Lee' },
    ], WEEK.bottle);
    await results([
      [U.jon, 'footle', 0, 10], [U.jon, 'daily7', 1, 10], [U.jon, 'trail', 2, 9], // 29 by Thursday
      [U.alex, 'footle', 3, 8], [U.alex, 'daily7', 4, 10], [U.alex, 'top10', 5, 9], [U.alex, 'trail', 6, 9],
      [U.sam, 'footle', 4, 10], [U.sam, 'daily7', 5, 10], [U.sam, 'top10', 6, 10],
      [U.kim, 'footle', 4, 10], [U.kim, 'daily7', 5, 10], [U.kim, 'trail', 6, 10],
      [U.lee, 'top10', 6, 2],
    ]);
    const r = byName(await table(id));
    expect(r.Jon.rank).toBe(4);
    expect(r.Jon.labels).toEqual(['bottled']);
    expect(r.Lee.labels).toEqual(['spoon']);
    expect(r.Alex.labels).toEqual(['crown']);
  });

  it('a late joiner scores from the day they joined, and only a Monday-to-Thursday joiner can be a ghost', async () => {
    const id = await league('Late Ones', [
      { uid: U.alex, name: 'Alex', joined: -3 },
      { uid: U.sam, name: 'Sam', joined: 2 },    // joined Wednesday
      { uid: U.jon, name: 'Jon', joined: 0 },       // joined Monday, never played
      { uid: U.kim, name: 'Kim', joined: 4 },   // joined Friday, never played
    ], WEEK.late);
    await results([
      [U.alex, 'footle', 0, 7],
      [U.sam, 'footle', 0, 10], [U.sam, 'daily7', 1, 10],   // before joining: blank
      [U.sam, 'top10', 2, 6], [U.sam, 'trail', 2, 8],       // join day counts in full
      [U.alex, 'daily7', 6, 9, 'late'],                     // after the whistle: never counts
    ]);
    const r = byName(await table(id));
    expect(r.Sam.points).toBe(14);
    expect(r.Sam.per_day).toEqual([null, null, 14, null, null, null, null]);
    expect(r.Alex.points).toBe(7);
    expect(r.Jon.labels).toEqual(['ghost']);
    expect(r.Kim.labels).toEqual([]);
  });

  it('record_league_result: points from SQL, first write wins, only while the puzzle is live, never for anon', async () => {
    const today = await val(`select (now() at time zone 'UTC')::date - date '1970-01-01'`);
    const footleToday = today - 20576;
    await as(U.lee);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['footle', footleToday, 3, true])).toBe(8);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['footle', footleToday, 1, true]), 'a replay cannot overwrite').toBe(8);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['footle', footleToday - 3, 1, true]), 'three days old').toBeNull();
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['footle', footleToday, 9, true]), 'bucket out of range').toBeNull();
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['daily7', today, 7, true])).toBe(10);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['mystery', 1, 1, true]), 'not a league game').toBeNull();
    await as(null);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['top10', today - 20737, 5, true])).toBeNull();
  });

  it('create, join, the table and a claim, end to end', async () => {
    await as(U.alex);
    const made = await val(`select public.create_league('The Lads', 'UTC', 'Alex')`);
    expect(made.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    expect(await val(`select public.create_league('', 'UTC', 'Alex')`)).toEqual({ error: 'bad_name' });
    // The zone is checked against pg_timezone_names; anything else is UTC.
    const oslo = await val(`select public.create_league('Oslo Lads', 'Europe/Oslo', 'Alex')`);
    expect(await val('select tz from public.leagues where id = $1', [oslo.id])).toBe('Europe/Oslo');
    const mars = await val(`select public.create_league('Mars FC', 'Mars/Base', 'Alex')`);
    expect(await val('select tz from public.leagues where id = $1', [mars.id])).toBe('UTC');

    await as(U.guest);
    expect(await val('select public.join_league($1, $2)', ['ZZZZZZZZ', 'Guest'])).toEqual({ error: 'not_found' });
    const joined = await val('select public.join_league($1, $2)', [made.code.toLowerCase(), 'Turbo Keeper 12']);
    expect(joined.id).toBe(made.id);
    const today = await val(`select (now() at time zone 'UTC')::date - date '1970-01-01'`);
    expect(await val('select public.record_league_result($1, $2, $3, $4)', ['top10', today - 20737, 7, true])).toBe(7);

    const t = await val('select public.get_league_table($1)', [made.id]);
    expect(t.rows.map((r) => r.name).sort()).toEqual(['Alex', 'Turbo Keeper 12']);
    expect(JSON.stringify(t), 'never another member\'s user id').not.toContain(U.alex);
    expect(t.rows.find((r) => r.is_me).name).toBe('Turbo Keeper 12');
    expect(t.rows.every((r) => Array.isArray(r.labels) && (t.meta.is_final || r.labels.length === 0))).toBe(true);

    await as(U.stranger);
    expect(await val('select public.get_league_table($1)', [made.id]), 'members only').toBeNull();

    // The guest signs in to an existing account: the claim moves them.
    await as(U.guest);
    const token = await val('select public.league_issue_claim()');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    await as(U.kim);
    expect(await val('select public.league_issue_claim()'), 'only an anonymous account issues one').toBeNull();
    const moved = await val('select public.league_claim($1)', [token]);
    expect(moved).toBeGreaterThanOrEqual(2);
    expect(await val('select public.league_claim($1)', [token]), 'single use').toBe(0);
    const t2 = await val('select public.get_league_table($1)', [made.id]);
    expect(t2.rows.find((r) => r.is_me).points).toBe(7);
    const mine = await val('select public.get_my_leagues()');
    expect(mine.map((l) => l.name)).toContain('The Lads');
  });

  it('anon holds nothing; helpers are granted to nobody; client functions to authenticated only', async () => {
    const tables = ['leagues', 'league_members', 'league_results', 'league_weeks', 'league_claims', 'league_join_tries'];
    for (const t of tables) {
      for (const role of ['anon', 'authenticated']) {
        for (const p of ['select', 'insert', 'update', 'delete']) {
          expect(await val(`select has_table_privilege($1, $2, $3)`, [role, `public.${t}`, p]), `${role} ${p} ${t}`).toBe(false);
        }
      }
      expect(await val(`select relrowsecurity from pg_class where oid = $1::regclass`, [`public.${t}`]), `RLS on ${t}`).toBe(true);
    }
    const fns = (await db.query(`
      select p.oid::regprocedure::text as sig, p.proname as name, p.prosecdef as definer
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and (p.proname like '%league%' or p.proname = 'delete_user_account')`)).rows;
    expect(fns.length).toBe(20);
    for (const f of fns) {
      expect(await val(`select has_function_privilege('anon', $1, 'execute')`, [f.sig]), `anon on ${f.sig}`).toBe(false);
      const helper = f.name.startsWith('_');
      expect(await val(`select has_function_privilege('authenticated', $1, 'execute')`, [f.sig]), `authenticated on ${f.sig}`).toBe(!helper);
      expect(f.definer, `${f.sig} security definer`).toBe(!helper);
    }
  });
});
