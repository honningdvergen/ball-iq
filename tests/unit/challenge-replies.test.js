// The sender hears back (12 Nov 2026): src/lib/challengeReplies.js, the reply
// id on the link, and supabase/migrations/v3_3_challenge_replies.sql.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');

let store;
let calls;
let replyRows;
let recordAnswer;
beforeEach(() => {
  store = new Map();
  calls = [];
  replyRows = [];
  recordAnswer = true;
  vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  });
  vi.stubGlobal('navigator', { webdriver: false });
  vi.stubGlobal('location', { hostname: 'balliq.app', protocol: 'https:' });
  vi.stubGlobal('window', {});
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    const name = String(url).split('/rpc/')[1];
    calls.push({ name, body: JSON.parse(init.body) });
    return { ok: true, text: async () => (name === 'get_challenge_replies' ? JSON.stringify(replyRows) : JSON.stringify(recordAnswer)) };
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

const load = async () => {
  vi.resetModules();
  return import('../../src/lib/challengeReplies.js');
};

describe('the id on the link', () => {
  it('is 12 characters of A-Z and 2-7, and the same id for the same puzzle', async () => {
    const m = await load();
    const a = m.replyIdFor('footle', 193, 4);
    expect(a).toMatch(/^[A-Z2-7]{12}$/);
    expect(m.replyIdFor('footle', 193, 4)).toBe(a);
    expect(m.replyIdFor('trail', 102, 2)).not.toBe(a);
    expect(m.sentChallenges().map((c) => c.game).sort()).toEqual(['footle', 'trail']);
  });
  it('is not made for Daily 7 or a bad puzzle number', async () => {
    const m = await load();
    expect(m.replyIdFor('daily7', 20770, 5)).toBe(null);
    expect(m.replyIdFor('footle', 1.5, 3)).toBe(null);
  });
  it('forgets what was sent after three days', async () => {
    const m = await load();
    m.replyIdFor('footle', 193, 4);
    expect(m.sentChallenges(Date.now() + 4 * 86400000)).toEqual([]);
  });
});

describe('the mate reports back', () => {
  it('sends the result once per link, with a key made for that link and no visitor id', async () => {
    const m = await load();
    store.set('biq_vid', '11111111-1111-4111-8111-111111111111');
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas' })).toBe(true);
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas' })).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('record_challenge_reply');
    expect(calls[0].body).toMatchObject({ p_cid: 'ABCDEFGHJKLM', p_game: 'footle', p_edition: 193, p_score: 5, p_name: 'Jonas' });
    expect(calls[0].body.p_replier).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[0].body.p_replier).not.toBe('11111111-1111-4111-8111-111111111111');
    // A reload: the stored flag stops a second send.
    const again = await load();
    expect(await again.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 })).toBe(true);
    expect(calls).toHaveLength(1);
  });
  it('a reply the server turned away is not marked done: the next finish tries again', async () => {
    const m = await load();
    recordAnswer = false;
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 })).toBe(false);
    recordAnswer = true;
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 })).toBe(true);
    expect(calls).toHaveLength(2);
    // The same reply key both times: one device, one row.
    expect(calls[1].body.p_replier).toBe(calls[0].body.p_replier);
  });
  it('a name carries nothing a challenge link could not', async () => {
    const m = await load();
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jørgen <b> http://x.y/z\u202E' });
    expect(calls[0].body.p_name).toBe('Jørgen b httpx.yz');
  });
  it('an installed app sends the score and no name', async () => {
    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } });
    vi.stubGlobal('location', { hostname: 'localhost', protocol: 'capacitor:' });
    const m = await load();
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'trail', edition: 102, score: 2, name: 'Jonas' })).toBe(true);
    expect(calls[0].body).toMatchObject({ p_game: 'trail', p_score: 2, p_name: '' });
  });
  it('a name typed afterwards goes on the same key, once, and is remembered as confirmed', async () => {
    const m = await load();
    expect(m.sendsNameUnasked()).toBe(true);
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 });
    expect(calls[0].body.p_name).toBe('');
    expect(m.replyNamed('ABCDEFGHJKLM')).toBe('');
    // The player types "Jonas" and taps Tell Alex: sent although the result is already marked done.
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas', explicit: true })).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1].body.p_name).toBe('Jonas');
    expect(calls[1].body.p_replier).toBe(calls[0].body.p_replier);
    expect(m.replyNamed('ABCDEFGHJKLM')).toBe('Jonas');
    // The same name again says nothing new: no call. A reload does not resend either.
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas', explicit: true })).toBe(true);
    const again = await load();
    expect(await again.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas' })).toBe(true);
    expect(calls).toHaveLength(2);
  });
  it('a name that failed to send is not claimed as told, and the result stays reported', async () => {
    const m = await load();
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 });
    recordAnswer = false;
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas', explicit: true })).toBe(false);
    expect(m.replyNamed('ABCDEFGHJKLM')).toBe('');
    recordAnswer = true;
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 })).toBe(true);
    expect(calls).toHaveLength(2);
  });
  it('where storage cannot be written, a second send still uses the same key', async () => {
    const m = await load();
    const real = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('quota'); };
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5 });
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas', explicit: true });
    localStorage.setItem = real;
    expect(calls).toHaveLength(2);
    expect(calls[1].body.p_replier).toBe(calls[0].body.p_replier);
  });
  it('an installed app sends no name on its own, and its ask is off', async () => {
    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } });
    vi.stubGlobal('location', { hostname: 'localhost', protocol: 'capacitor:' });
    const m = await load();
    expect(m.sendsNameUnasked()).toBe(false);
    store.set('biq_reply_name', 'Jonas');
    await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 5, name: 'Jonas' });
    expect(calls[0].body.p_name).toBe('');
    expect(read('src/components/MateNameAsk.jsx')).toMatch(/if \(!lib \|\| !lib\.sendsNameUnasked\(\) \|\| lib\.isOwnLink\(rid\)\) return null;/);
  });
  it('a reply seen without a name is shown again once it has one', async () => {
    const m = await load();
    const rid = m.replyIdFor('footle', 193, 4);
    replyRows = [{ cid: rid, game: 'footle', edition: 193, score: 6, name: null, at: '2026-11-12T12:00:00Z' }];
    const first = await m.fetchNewReplies();
    m.markReplySeen(first[0]);
    expect(await m.fetchNewReplies({ force: true })).toEqual([]);
    replyRows = [{ cid: rid, game: 'footle', edition: 193, score: 6, name: 'Jonas', at: '2026-11-12T12:00:00Z' }];
    expect((await m.fetchNewReplies({ force: true })).map((r) => r.name)).toEqual(['Jonas']);
  });
  it('the typed name is kept on the device, cleaned', async () => {
    vi.resetModules();
    const g = await import('../../src/lib/gameChallenge.js');
    expect(g.replyName()).toBe('');
    expect(g.saveReplyName('  Jørgen <3 ')).toBe('Jørgen 3');
    expect(g.replyName()).toBe('Jørgen 3');
    expect(g.saveReplyName('<>')).toBe('');
    expect(g.replyName()).toBe('Jørgen 3');
  });
  it('never reports on a link this device sent itself', async () => {
    const m = await load();
    const rid = m.replyIdFor('footle', 193, 4);
    expect(await m.recordChallengeReply({ rid, game: 'footle', edition: 193, score: 4 })).toBe(false);
    expect(calls).toHaveLength(0);
  });
  it('sends nothing for a bad id, from a dev host, or from an automated browser', async () => {
    const m = await load();
    expect(await m.recordChallengeReply({ rid: 'short', game: 'footle', edition: 193, score: 4 })).toBe(false);
    vi.stubGlobal('location', { hostname: 'localhost', protocol: 'http:' });
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 4 })).toBe(false);
    vi.stubGlobal('location', { hostname: 'balliq.app', protocol: 'https:' });
    vi.stubGlobal('navigator', { webdriver: true });
    expect(await m.recordChallengeReply({ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 193, score: 4 })).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

describe('the sender is told', () => {
  it('asks for nothing when nothing was sent, and drops a stale list so Home stops loading the card', async () => {
    const m = await load();
    store.set('biq_sent_challenges', JSON.stringify([{ rid: 'ABCDEFGHJKLM', game: 'footle', edition: 100, score: 3, at: Date.now() - 5 * 86400000 }]));
    expect(await m.fetchNewReplies()).toEqual([]);
    expect(calls).toHaveLength(0);
    expect(store.has('biq_sent_challenges')).toBe(false);
  });
  it('pairs a reply with what was sent, and shows it once', async () => {
    const m = await load();
    const rid = m.replyIdFor('footle', 193, 4);
    replyRows = [
      { cid: rid, game: 'footle', edition: 193, score: 6, name: 'Jonas', at: '2026-11-12T12:00:00Z' },
      { cid: rid, game: 'trail', edition: 193, score: 2, name: 'Wrong game', at: '2026-11-12T12:01:00Z' },
      { cid: 'ZZZZZZZZZZZZ', game: 'footle', edition: 193, score: 1, name: 'Not ours', at: '2026-11-12T12:02:00Z' },
    ];
    const got = await m.fetchNewReplies();
    expect(calls[0]).toEqual({ name: 'get_challenge_replies', body: { p_cids: [rid] } });
    expect(got).toEqual([{ rid, game: 'footle', edition: 193, mine: 4, theirs: 6, name: 'Jonas', at: '2026-11-12T12:00:00Z' }]);
    // Within the minute: no second call, same answer.
    expect(await m.fetchNewReplies()).toEqual(got);
    expect(calls).toHaveLength(1);
    m.markReplySeen(got[0]);
    expect(await m.fetchNewReplies()).toEqual([]);
    expect(await m.fetchNewReplies({ force: true })).toEqual([]);
  });
  it('a failed call shows nothing', async () => {
    const m = await load();
    m.replyIdFor('footle', 193, 4);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, text: async () => '' })));
    expect(await m.fetchNewReplies()).toEqual([]);
  });
});

describe('the link, the redirect and the boot agree on the id', () => {
  it('the finish panel puts ?r= on the link it sends', () => {
    const DD = read('src/components/DailyDone.jsx');
    expect(DD).toMatch(/const rid = repliesLib \? repliesLib\.replyIdFor\(game, edition, myScore\) : null;/);
    // Never a static import: that has landed in Home's eager chunk before.
    expect(DD).not.toMatch(/^import [^\n]*challengeReplies/m);
    expect(DD).toContain('`https://balliq.app/c/${token}${rid ? `?r=${rid}` : ""}`');
    expect(DD).toMatch(/if \(!m \|\| !rival\?\.rid\) return;/);
  });
  it('api/c.js passes it on as gr, and the app keeps it with the stored challenge', () => {
    expect(read('api/c.js')).toContain("${/^[A-Z2-7]{12}$/.test(rid) ? `&gr=${rid}` : ''}");
    const APP = read('src/App.jsx');
    expect(APP).toContain('storeChallenge(/^[A-Z2-7]{12}$/.test(gr) ? { ...gc, rid: gr } : gc);');
    expect(APP).toContain('u.searchParams.delete("gr"); u.searchParams.delete("r");');
  });
  it('Home loads the card only for a device that has sent a challenge', () => {
    const HOME = read('src/screens/HomeScreen.jsx');
    expect(HOME).toMatch(/const MateReplyCard = React\.lazy\(\(\) => import\("\.\.\/components\/MateReplyCard\.jsx"\)\);/);
    expect(HOME).toMatch(/\{hasSentChallenge\(\) && \(/);
    expect(HOME).not.toMatch(/from ["']\.\.\/lib\/challengeReplies\.js["']/);
  });
  it('the website shows it too: a browser never sees the app Home, so the front door mounts the same card', () => {
    const FD = read('src/marketing/FrontDoor.jsx');
    expect(FD).toMatch(/const MateReplyCard = React\.lazy\(\(\) => import\('\.\.\/components\/MateReplyCard\.jsx'\)\);/);
    expect(FD).toMatch(/\{hasSentChallenge\(\) && \(/);
    expect(FD).not.toMatch(/from ['"]\.\.\/lib\/challengeReplies\.js['"]/);
    // Every colour in the card's stylesheet has a fallback: the front door names its tokens differently.
    const CSS = read('src/components/mateReply.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(CSS.match(/var\(--[a-z0-9]+\)/g)).toBe(null);
  });
  it('a reply with no name has its own words, never "Level with A mate"', () => {
    const CARD = read('src/components/MateReplyCard.jsx');
    expect(CARD).toMatch(/: t\(r > 0 \? "mr\.beatAnon" : r < 0 \? "mr\.lostAnon" : "mr\.levelAnon"\)/);
    expect(CARD).toMatch(/t\(reply\.name \? "dd\.h2h" : "mr\.h2hAnon"\)/);
  });
  it('the card has no solid button', () => {
    expect(read('src/components/MateReplyCard.jsx')).not.toMatch(/dd-share|lg-solid|t7s-cta/);
  });
});

describe('say it was you (the name ask)', () => {
  const DD = read('src/components/DailyDone.jsx');
  const ASK = read('src/components/MateNameAsk.jsx');
  it('sits under the head-to-head only for a link that can be answered, never on a practice replay', () => {
    expect(DD).toMatch(/\{rival\.rid && !isArchive && \(\s*<MateNameAsk /);
    expect(DD.indexOf('className={`dd-h2h')).toBeLessThan(DD.indexOf('<MateNameAsk '));
  });
  it('keeps its state out of DailyDone, and loads the library with import()', () => {
    expect(ASK).toMatch(/const loadLib = \(\) => import\("\.\.\/lib\/challengeReplies\.js"\)/);
    expect(ASK).not.toMatch(/^import [^\n]*challengeReplies/m);
    expect((ASK.match(/useState\(/g) || []).length).toBe(4);
    // It says a name was told only when the library has it confirmed for this link.
    expect(ASK).toMatch(/setTold\(m\.replyNamed\(rid\)\)/);
    expect(ASK).not.toMatch(/useState\(\(\) => replyName\(\)\);\s*\/\/ told/);
  });
  it('is one line: a field and one quiet button, no sheet and no solid fill', () => {
    expect(ASK).toMatch(/<form className="dd-name" onSubmit=\{submit\}>/);
    expect(ASK).not.toMatch(/role="dialog"|dd-share|lg-solid/);
    const CSS = read('src/components/dailyDone.css');
    expect(CSS).toMatch(/\.dd-h2h:has\(\+ \.dd-name\)\{border-radius:12px 12px 0 0;\}/);
    // 16px in the field: anything smaller makes iOS zoom the page on focus.
    expect(CSS).toMatch(/\.dd-name-in\{[^}]*font-size:16px/);
  });
  it('a typed name is sent as the player\'s choice, and goes on the links they send', () => {
    expect(ASK).toMatch(/recordChallengeReply\(\{ rid, game, edition, score, name: clean, explicit: true \}\)/);
    // Only the ask sends a name as typed here: the panel's own report never does.
    expect(DD).not.toMatch(/explicit/);
    expect(DD).toMatch(/\|\| replyName\(\);/);
  });
  const SQL4 = read('supabase/migrations/v3_4_challenge_reply_name.sql');
  it('the follow-up migration only teaches the stored row a name, by the same key', () => {
    expect(SQL4).toMatch(/update public\.challenge_replies set name = v_name\s+where cid = p_cid and replier = p_replier and name is distinct from v_name;/);
    expect(SQL4).not.toMatch(/create table|drop |alter table|create policy/i);
    expect((SQL4.match(/create or replace function/g) || []).length).toBe(1);
    expect(SQL4).toMatch(/security definer\s+set search_path to 'public'/);
    expect(SQL4.trimEnd().endsWith('revoke all on function public.record_challenge_reply(text, text, integer, integer, text, uuid) from public;')).toBe(true);
    // Everything v3_3 checked is still in the function.
    for (const needle of ['>= 2000', '>= 8', 'pg_advisory_xact_lock(hashtext(p_cid))', 'v_day < v_today - 1 or v_day > v_today + 1', 'on conflict (cid, replier) do update', 'set name = coalesce(excluded.name, cr.name)', 'returns boolean']) expect(SQL4, needle).toContain(needle);
  });
});

describe('the migration keeps the standing rules', () => {
  const SQL = read('supabase/migrations/v3_3_challenge_replies.sql');
  it('the table has RLS, no policy and no client grant', () => {
    expect(SQL).toMatch(/alter table public\.challenge_replies enable row level security;/);
    expect(SQL).toMatch(/revoke all on table public\.challenge_replies from anon, authenticated, public;/);
    expect(SQL).not.toMatch(/create policy/i);
    expect(SQL).not.toMatch(/grant [a-z, ]+ on table/i);
  });
  it('both functions are security definer with a pinned search_path, and end revoked from public', () => {
    expect((SQL.match(/security definer/g) || []).length).toBe(2);
    expect((SQL.match(/set search_path to 'public'/g) || []).length).toBe(2);
    expect(SQL.trimEnd().endsWith('revoke all on function public.get_challenge_replies(text[]) from public;')).toBe(true);
    expect(SQL).toMatch(/revoke all on function public\.record_challenge_reply\(text, text, integer, integer, text, uuid\) from public;/);
  });
  it('the id pattern is the client\'s', () => {
    expect((SQL.match(/\^\[A-Z2-7\]\{12\}\$/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(read('src/lib/challengeReplies.js')).toContain('const RID = /^[A-Z2-7]{12}$/;');
  });
  it('a reply only lands for a live puzzle, once per key, eight per link, 500 an hour', () => {
    expect(SQL).toMatch(/v_day < v_today - 1 or v_day > v_today \+ 1/);
    expect(SQL).toMatch(/on conflict \(cid, replier\) do nothing/);
    expect(SQL).toMatch(/where cid = p_cid\) >= 8/);
    expect(SQL).toMatch(/interval '1 hour'\) >= 2000/);
    expect(SQL).toMatch(/pg_advisory_xact_lock\(hashtext\(p_cid\)\)/);
    expect(SQL).toMatch(/delete from public\.challenge_replies where created_at < now\(\) - interval '7 days';/);
    expect(SQL).toMatch(/returns boolean/);
    // A subscript on a function call must be parenthesised, or the file does not apply.
    expect(SQL).toContain("unnest((coalesce(p_cids, '{}'::text[]))[1:12])");
    expect(SQL).not.toMatch(/text\[\]\)\[1:12\]/);
    expect(SQL).toMatch(/public\._league_clean_name\(p_name, 22\)/);
  });
});

describe('the privacy text says so', () => {
  it('both copies cover the reply and the optional first name', () => {
    for (const p of ['public/privacy.html', 'src/screens/PrivacyScreen.jsx']) {
      const src = read(p);
      expect(src, p).toContain('If a friend sends you a puzzle and you finish it, your result is sent back');
      expect(src, p).toContain('on the website you can add a first name to it if you choose');
      expect(src, p).toContain('deleted after seven days');
      expect(src, p).not.toContain('We do not collect your real name,');
    }
  });
});
