import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  STITCH_TAUNTS, makeStitchToken, parseStitchToken, stitchHash, stitchHeadline, stitchScore,
} from '../../src/lib/stitchToken.js';
import { stitchPlayers, findStitchPlayer, stitchHashOf, stitchShownRange, searchStitchPlayers, dailyAnswerNames } from '../../src/lib/stitch.js';
import { buildMysteryStitchRows } from '../../src/lib/stitchCareerRows.js';
import { careerOf, withCareerFixes } from '../../src/lib/mysteryCareer.js';
import { TRAIL_PLAYERS, cluesShown } from '../../src/lib/trail.js';
import { StitchBuilder, StitchShare, StitchPlay, StitchBroken, h2hLine } from '../../src/screens/StitchUp.jsx';
import sHandler from '../../api/s.js';

/**
 * Stitch-up (16 Oct 2026): build a Trail for a mate from VERIFIED careers
 * only, send a link that never names him, play it in the Trail's engine
 * without touching the daily. The no-daily-writes half lives in
 * stitch-no-daily-writes.test.js (it has to mock React's effects).
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const json = (p) => JSON.parse(read(p));
const h = React.createElement;
const solids = (html) => (html.match(/class="st-solid"/g) || []).length;
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const SCHEDULE = json('../../src/data/mysterySchedule.json');
const POOL = json('../../src/data/mysteryPool.json');
const CAREERS = json('../../src/data/mysteryCareers.json');
const FIXES = json('../../src/data/mysteryCareerFixes.json');
const ROWS = json('../../src/data/stitchCareers.json');

describe('the stitch-up link', () => {
  it('round-trips: player hash, clubs shown, taunt, tally and name', () => {
    const cases = [
      { hash: '1x9k2qa', shown: 2, taunt: 0, tally: [0, 0], name: 'Alex' },
      { hash: 'abc', shown: 5, taunt: 11, tally: [3, 12], name: 'Jean-Luc' },
      { hash: 'z', shown: 12, taunt: 6, tally: [99, 0], name: '' },
      { hash: '0000000', shown: 3, taunt: 4, tally: [1, 1], name: 'Søren Ødegård' },
    ];
    for (const c of cases) {
      const t = makeStitchToken(c);
      expect(t).toMatch(/^[0-9a-z]+\.\d+\.\d+\.\d+-\d+/);
      expect(parseStitchToken(t)).toEqual(c);
      // As a URL carries it: encoded once more, then decoded by the browser.
      expect(parseStitchToken(decodeURIComponent(encodeURIComponent(t)))).toEqual(c);
    }
  });

  it('a name with dots or junk comes back clean, and never breaks the token apart', () => {
    const t = makeStitchToken({ hash: 'abc', shown: 3, taunt: 1, name: 'J.D. <b>' });
    expect(parseStitchToken(t)).toMatchObject({ hash: 'abc', shown: 3, taunt: 1, name: 'J D b' });
  });

  it('refuses what it cannot honour', () => {
    expect(makeStitchToken({ hash: 'abc', shown: 1, taunt: 0 })).toBeNull();      // fewer than two clubs
    expect(makeStitchToken({ hash: 'abc', shown: 3, taunt: 12 })).toBeNull();     // no 13th taunt
    expect(makeStitchToken({ hash: 'ABC!', shown: 3, taunt: 0 })).toBeNull();
    for (const bad of ['', 'abc', 'abc.1.0.0-0', 'abc.3.12.0-0', 'abc.3.0', 'abc.3.0.0', 'abc.3.0.100-0', '../x.3.0.0-0']) {
      expect(parseStitchToken(bad), bad).toBeNull();
    }
  });

  it('twelve taunts: banter, sentence case, nothing that is not football', () => {
    expect(STITCH_TAUNTS).toHaveLength(12);
    expect(new Set(STITCH_TAUNTS).size).toBe(12);
    for (const t of STITCH_TAUNTS) {
      expect(t[0]).toBe(t[0].toUpperCase());
      expect(t).not.toMatch(/[A-Z]{2,}/);                          // no shouting
      expect(t).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);              // no emoji
      expect(t.length).toBeLessThanOrEqual(40);
    }
    expect(STITCH_TAUNTS).toContain("Bet you can't, you plastic");
    expect(STITCH_TAUNTS).toContain('My nan got this one');
    expect(STITCH_TAUNTS).toContain('Easy if you actually watch football');
  });

  it('the headline and the head-to-head', () => {
    expect(stitchHeadline('Alex')).toBe('Alex stitched you up: whose career is this?');
    expect(stitchHeadline('')).toBe('A mate stitched you up: whose career is this?');
    expect(stitchScore([0, 0], true)).toEqual({ me: 1, them: 0, backTally: [1, 0] });
    expect(stitchScore([2, 1], false)).toEqual({ me: 1, them: 3, backTally: [1, 3] });
    expect(h2hLine([0, 0], true, 'Alex').score).toBe('You 1, Alex 0');
  });
});

describe('only verified careers can be picked', () => {
  const list = stitchPlayers(new Date(2026, 9, 16, 12));
  const fixed = withCareerFixes(CAREERS, FIXES);
  const byId = new Map(POOL.map((p) => [p.id, p]));
  const scheduled = new Set(SCHEDULE);
  const trailByKey = new Map(TRAIL_PLAYERS.map((p) => [p.key, p]));

  it('every pickable career is a Trail career or a scheduled Mystery answer, clubs as checked', () => {
    expect(list.length).toBeGreaterThan(300);
    for (const p of list) {
      if (p.src === 't') {
        expect(trailByKey.get(p.key)?.clubs, p.name).toEqual(p.clubs);
      } else {
        const id = p.id.slice(2);
        expect(scheduled.has(id), `${p.name} is not a scheduled Mystery answer`).toBe(true);
        const clubs = careerOf(byId.get(id), fixed).map((s) => s.club).filter((c, i, a) => c !== a[i - 1]);
        expect(p.clubs, p.name).toEqual(clubs);
      }
      expect(p.clubs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('the committed careers file matches its sources (node scripts/gen-stitch-careers.mjs)', () => {
    expect(ROWS).toEqual(buildMysteryStitchRows({ schedule: SCHEDULE, pool: POOL, careers: CAREERS, fixes: FIXES }));
  });

  it('a player only in the raw careers file is not offered and does not open', () => {
    // Alex Ferguson: in the 9,000-player file with a six-club raw career
    // (one of them the "Scottish Football League XI", a representative side,
    // which is why raw careers are never shown), but neither a Trail career
    // nor a scheduled Mystery answer.
    expect(byId.get('Q44980')?.name).toBe('Alex Ferguson');
    expect(careerOf(byId.get('Q44980'), fixed).length).toBeGreaterThanOrEqual(3);
    expect(scheduled.has('Q44980')).toBe(false);
    expect(TRAIL_PLAYERS.some((p) => /ferguson/i.test((p.display || []).join(' ')))).toBe(false);
    expect(searchStitchPlayers(list, 'Ferguson')).toEqual([]);
    expect(findStitchPlayer(stitchHash('m:Q44980'))).toBeNull();
  });

  it('a Trail career wins over the same player\'s Mystery career', () => {
    const zidane = list.filter((p) => /Zidane/.test(p.name));
    expect(zidane.length).toBeLessThanOrEqual(1);
    if (zidane.length) expect(zidane[0].src).toBe('t');
  });

  it('every verified career has its own hash', () => {
    const all = [...TRAIL_PLAYERS.map((p) => `t:${p.key}`), ...ROWS.map((r) => `m:${r.id}`)];
    expect(new Set(all.map(stitchHash)).size).toBe(all.length);
    for (const p of list.slice(0, 50)) expect(findStitchPlayer(stitchHashOf(p))?.id).toBe(p.id);
  });

  it('today\'s daily answers (a day either side) are held back', () => {
    const now = new Date(2026, 9, 16, 12);
    const skip = dailyAnswerNames(now);
    expect(skip.size).toBeGreaterThan(0);
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    for (const p of list) expect(skip.has(norm(p.name)), p.name).toBe(false);
  });

  it('the sender shows two clubs at least, and always keeps one back', () => {
    const p = findStitchPlayer(stitchHash('t:ZIDANE'));
    expect(stitchShownRange(p)).toEqual({ min: 2, max: 3 });
    expect(cluesShown(0, 4, 3)).toBe(3);
    expect(cluesShown(1, 4, 3)).toBe(4);
    expect(cluesShown(0, 4)).toBe(2); // the daily is unchanged
  });
});

describe('the receiver never sees the answer before solving', () => {
  const zidane = findStitchPlayer(stitchHash('t:ZIDANE'));
  const token = makeStitchToken({ hash: stitchHashOf(zidane), shown: 2, taunt: 0, name: 'Alex' });
  const parsed = parseStitchToken(token);

  it('the link and the edge page carry no name and no club', async () => {
    expect(token).not.toMatch(/zidane|zinedine|cannes|bordeaux|juventus|madrid/i);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    const res = await sHandler(new Request(`https://balliq.app/api/s?t=${encodeURIComponent(token)}`, { headers: { 'user-agent': 'WhatsApp/2.23' } }));
    const html = await res.text();
    expect(html).not.toMatch(/zidane|zinedine|cannes|bordeaux|juventus|madrid/i);
    expect(html).toContain('Alex stitched you up: whose career is this?');
    vi.unstubAllGlobals();
  });

  it('the board shows the clubs the sender chose and nothing else, and no name', () => {
    const html = renderToStaticMarkup(h(StitchPlay, { token, parsed, player: zidane, onBack: () => {}, track: () => {} }));
    const t = text(html);
    expect(t).toContain('Cannes');
    expect(t).toContain('Bordeaux');
    expect(t).not.toMatch(/Juventus|Real Madrid/);
    expect(t).not.toMatch(/Zidane|Zinedine/);
    expect(t).toContain("Bet you can't, you plastic");
    expect(t).toContain('Alex stitched you up');
    // A stitch-up is not a daily: no puzzle number, no return-loop panel.
    expect(t).not.toMatch(/No\. \d+/);
    expect(html).not.toContain('class="dd"');
  });

  it('a three-club start shows three', () => {
    const t3 = makeStitchToken({ hash: stitchHashOf(zidane), shown: 3, taunt: 2, name: 'Alex' });
    const t = text(renderToStaticMarkup(h(StitchPlay, { token: t3, parsed: parseStitchToken(t3), player: zidane, onBack: () => {} })));
    expect(t).toContain('Juventus');
    expect(t).not.toContain('Real Madrid');
  });
});

describe('the screens', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('the builder: one solid button once a player is picked; lucide icons; sentence case', () => {
    const zidane = findStitchPlayer(stitchHash('t:ZIDANE'));
    const pick = renderToStaticMarkup(h(StitchBuilder, { onBack: () => {}, rnd: () => 0.5 }));
    expect(solids(pick)).toBe(0);
    expect(text(pick)).toContain('Stitch up a mate');
    const build = renderToStaticMarkup(h(StitchBuilder, { onBack: () => {}, initial: { player: zidane, shown: 2, taunt: 3 } }));
    expect(solids(build)).toBe(1);
    expect(text(build)).toContain('Get the link');
    expect((build.match(/role="radio"/g) || []).length).toBe(12);
    expect(build).toMatch(/aria-checked="true"[^>]*>(<svg[^]*?<\/svg>)?Thought you knew ball/);
    expect(text(build)).toContain('Hidden at the start');
    expect(build).not.toMatch(/text-transform:\s*uppercase/);
  });

  it('the share view and the broken link: one solid button each', () => {
    const zidane = findStitchPlayer(stitchHash('t:ZIDANE'));
    const made = { token: makeStitchToken({ hash: stitchHashOf(zidane), shown: 2, taunt: 1, name: 'Alex' }), player: zidane, shown: 2, taunt: 1, name: 'Alex' };
    const share = renderToStaticMarkup(h(StitchShare, { made, onAnother: () => {}, onBack: () => {} }));
    expect(solids(share)).toBe(1);
    expect(text(share)).toContain(`https://balliq.app/s/${made.token}`);
    expect(text(share)).not.toMatch(/Zidane/);
    expect(solids(renderToStaticMarkup(h(StitchBroken, { onBack: () => {}, onBuild: () => {} })))).toBe(1);
  });

  it('stitch.css transforms nothing to capitals, and the screen imports only lucide icons', () => {
    expect(read('../../src/screens/stitch.css')).not.toMatch(/uppercase/);
    const src = read('../../src/screens/StitchUp.jsx');
    expect(src).toMatch(/from "lucide-react"/);
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it('web only: the route, the finish-panel link and the boot are gated off native', () => {
    const app = read('../../src/App.jsx');
    expect(app).toMatch(/screen === "stitch" && LEAGUES_WEB/);
    expect(app).toMatch(/stitch: LEAGUES_WEB \?/);
    expect(app).toMatch(/import\('\.\/screens\/StitchUp\.jsx'\)/);
    expect(app).not.toMatch(/import [^;]*from ['"]\.\/screens\/StitchUp/); // lazy, never static
    expect(app).not.toMatch(/from ['"]\.\/lib\/stitch(Token)?\.js['"]/);   // nothing on Home's eager graph
    expect(read('../../src/screens/StitchUp.jsx')).toMatch(/if \(native\) return null/);
    const aasa = read('../../public/.well-known/apple-app-site-association');
    expect(aasa).not.toContain('/s/');
  });

  it('vercel routes /s/ to the edge page, ahead of the catch-all', () => {
    const v = JSON.parse(read('../../vercel.json'));
    const rw = v.rewrites || [];
    const i = rw.findIndex((r) => r.source === '/s/:token');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(rw[i].destination).toBe('/api/s?t=:token');
    const catchAll = rw.findIndex((r) => /^\/\(\.\*\)$|^\/:path\*$/.test(r.source));
    if (catchAll >= 0) expect(i).toBeLessThan(catchAll);
  });
});

describe('the stitch-up landing (api/s.js)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const meta = (html, prop) => (new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`).exec(html) || [])[1];
  const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  it('unfurls as the taunt card and sends a person to /play?stitch= with the token intact', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
    const token = makeStitchToken({ hash: 'abc12', shown: 3, taunt: 1, tally: [1, 2], name: 'Alex' });
    const res = await sHandler(new Request(`https://balliq.app/api/s?t=${encodeURIComponent(token)}`, { headers: { 'user-agent': 'WhatsApp/2.23' } }));
    const html = await res.text();
    expect(unesc(meta(html, 'og:title'))).toBe('Alex stitched you up: whose career is this?');
    expect(unesc(meta(html, 'og:description'))).toContain('My nan got this one');
    const img = new URL(unesc(meta(html, 'og:image')));
    expect(Object.fromEntries(img.searchParams)).toEqual({ t: 'stitch', k: '1', c: '3', n: 'Alex' });
    expect(meta(html, 'googlebot')).toBe('noindex');
    const go = new URL(JSON.parse(/location\.replace\(("[^"]+")\)/.exec(html)[1]));
    expect(go.pathname).toBe('/play');
    expect(parseStitchToken(go.searchParams.get('stitch'))).toEqual(parseStitchToken(token));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ p_event: 'loop-hit', p_meta: { loop: 's', bot: true } });
  });

  it('a bad token opens the builder, not a dead page; local runs write nothing', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_SUPABASE_KEY', 'anon-key');
    const res = await sHandler(new Request('http://localhost:3000/api/s?t=not-a-token'));
    const html = await res.text();
    const go = new URL(JSON.parse(/location\.replace\(("[^"]+")\)/.exec(html)[1]));
    expect(go.search).toBe('?stitch=new');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
