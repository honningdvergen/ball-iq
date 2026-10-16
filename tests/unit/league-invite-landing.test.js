import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import handler, { parseInvite } from '../../api/l.js';
import { parseLeagueInviteToken, leagueInviteToken } from '../../src/lib/leagues.js';

/**
 * balliq.app/l/CODE.Name.Inviter — the league invite landing (api/l.js).
 *
 * It must unfurl as an invite (inviter, league name, format), carry NOTHING
 * about the league's size, read no database, send a person to the join screen
 * with the token intact, and fall back to /play on a bad token. The real
 * card render is in og-cards-render.test.js (t=league).
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const meta = (html, prop) => (new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`).exec(html) || [])[1];
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function land(token, host = 'https://balliq.app') {
  const res = await handler(new Request(`${host}/api/l?t=${encodeURIComponent(token)}`, { headers: { 'user-agent': 'WhatsApp/2.23' } }));
  return { status: res.status, html: await res.text() };
}

describe('the league invite landing', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('unfurls as an invite and sends a person to the join screen with the token intact', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
    // The rewrite hands the token over decoded; a hand-typed one may be encoded.
    for (const t of ['K7QM2XPA.The Lads.Alex', 'K7QM2XPA.The%20Lads.Alex']) {
      const { status, html } = await land(t);
      expect(status).toBe(200);
      expect(unesc(meta(html, 'og:title'))).toBe('Alex invited you to The Lads on Ball IQ');
      expect(unesc(meta(html, 'og:description'))).toBe('Mon to Sun · Footle, Daily 7, Transfer Trail, Top 10 · Free');
      const img = new URL(unesc(meta(html, 'og:image')));
      expect(img.pathname).toBe('/api/og');
      expect(Object.fromEntries(img.searchParams)).toEqual({ t: 'league', n: 'The Lads', w: 'Alex' });
      expect(meta(html, 'googlebot')).toBe('noindex');
      // The redirect, read back the way the app's boot reads it.
      const go = new URL(JSON.parse(/location\.replace\(("[^"]+")\)/.exec(html)[1]));
      expect(go.pathname).toBe('/play');
      expect(parseLeagueInviteToken(go.searchParams.get('league'))).toEqual({ code: 'K7QM2XPA', name: 'The Lads', inviter: 'Alex' });
    }
    // loop-hit, as api/c.js: one funnel row per hit, bot flagged.
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ p_event: 'loop-hit', p_meta: { loop: 'l', bot: true } });
  });

  it('carries no crowd size and reads no database', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    const { html } = await land('K7QM2XPA.The Lads.Alex');
    expect(html).not.toMatch(/\d+\s+(members|players|mates)/i);
    const SRC = read('../../api/l.js');
    expect(SRC).not.toMatch(/get_league_table|get_my_leagues|from\('league/);
    expect(SRC.match(/rest\/v1\/rpc\/(\w+)/g)).toEqual(['rest/v1/rpc/record_funnel_event']);
  });

  it('a bad token falls back to /play with a generic card', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    for (const t of ['', 'nonsense', 'K7QM2XP0.Lads', 'f.166.3.Alex']) {
      const { html } = await land(t);
      expect(JSON.parse(/location\.replace\(("[^"]+")\)/.exec(html)[1])).toBe('https://balliq.app/play');
      expect(unesc(meta(html, 'og:title'))).toBe('Ball IQ: play the dailies against your mates');
    }
  });

  it('never writes a funnel row from a preview deployment or a local run', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
    await land('K7QM2XPA.Lads', 'https://ball-iq-git-x.vercel.app');
    await land('K7QM2XPA.Lads', 'http://localhost:3000');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('the edge parse and the app parse agree', () => {
    for (const t of ['K7QM2XPA.The%20Lads.Alex', 'k7qm2xpa', 'K7QM2XPA.%C3%98degaard%20FC', 'K7QM2XPA..Sam', 'bad', leagueInviteToken('K7QM2XPA', 'St. Pauli', 'J.Doe')]) {
      expect(parseInvite(t), t).toEqual(parseLeagueInviteToken(t));
    }
  });

  it('is wired as a rewrite beside /c/, and NOT in the deep-link files', () => {
    const v = JSON.parse(read('../../vercel.json'));
    const rw = v.rewrites.map((r) => r.source);
    expect(v.rewrites.find((r) => r.source === '/l/:token')?.destination).toBe('/api/l?t=:token');
    // Beside its sibling /c/, and nothing earlier can swallow /l/….
    expect(rw.indexOf('/l/:token')).toBe(rw.indexOf('/c/:token') + 1);
    expect(rw.slice(0, rw.indexOf('/l/:token')).filter((src) => /^\/(\(\.\*\)|:)/.test(src))).toEqual([]);
    // Old app builds would catch /l/ and land on Home (spec section 10).
    expect(read('../../public/.well-known/apple-app-site-association')).not.toMatch(/"\/l\//);
    expect(read('../../android/app/src/main/AndroidManifest.xml')).not.toMatch(/pathPrefix="\/l/);
  });
});
