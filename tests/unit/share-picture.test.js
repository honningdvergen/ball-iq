// THE CHALLENGE PICTURES (25 Nov 2026): what a mate sees when a /c/ link lands
// in a chat. Alex gave the earlier pictures "max a 6 out of 10" and said "Yes,
// all four" to these: the picture is the puzzle on a pitch seen from above, and
// the sender's score is the dare (api/og.js says the rest).
//
// Two things are pinned here. The link page (api/c.js) hands the picture only
// detail of the right shape for its game. And the picture itself (api/og.js,
// really drawn here, with the fonts and the Top 10 schedule read from this
// checkout) lights up that detail only when it agrees with the score: a claim
// the link does not carry is never drawn.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';

const local = (p) => readFileSync(new URL(`../../public${p}`, import.meta.url));
const enc = (cols, rows) => `${cols}.${rows.map((r) => parseInt(r, 3).toString(36)).join('.')}`;
const mask = (places) => places.reduce((v, r) => v | (1 << (r - 1)), 0).toString(36);

describe('the link page passes the detail on (api/c.js)', () => {
  let page;
  beforeAll(async () => { page = (await import('../../api/c.js')).default; });
  const image = async (token, q = '') => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await page(new Request(`http://localhost/api/c?t=${token}${q}`));
    spy.mockRestore();
    const html = await res.text();
    return new URL(((html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '').replace(/&amp;/g, '&')).searchParams;
  };
  it('Footle takes the grid, Top 10 the places, Trail the club count, Daily 7 the answers', async () => {
    const p = enc(7, ['0100010', '0020200', '2222222']);
    expect((await image('f.206.3', `&r=LMSKUWFNMRNK&p=${p}`)).get('p')).toBe(p);
    expect((await image('x.45.7', `&m=${mask([1, 2, 3, 4, 6, 7, 9])}`)).get('m')).toBe(mask([1, 2, 3, 4, 6, 7, 9]));
    expect((await image('t.115.3', '&k=5')).get('k')).toBe('5');
    expect((await image('5.20261125', `&m=${mask([1, 2, 4, 5, 7])}`)).get('m')).toBe(mask([1, 2, 4, 5, 7]));
  });
  it('and nothing of the wrong shape, or meant for another game', async () => {
    expect((await image('f.206.3', '&p=<script>')).get('p')).toBeNull();
    expect((await image('f.206.3', '&p=7.9.1r.xx.yy.zz.aa.bb')).get('p')).toBeNull();   // more than six rows
    expect((await image('f.206.3', '&m=1f&k=5')).get('m')).toBeNull();
    expect((await image('f.206.3', '&m=1f&k=5')).get('k')).toBeNull();
    expect((await image('x.45.7', '&m=ABCD')).get('m')).toBeNull();
    expect((await image('t.115.3', '&k=five')).get('k')).toBeNull();
    expect((await image('5.20261125', '&m=zzz')).get('m')).toBeNull();
  });
  it('a link with none of it is the address it always was', async () => {
    const q = await image('x.45.7.Alex');
    expect([...q.keys()].sort()).toEqual(['g', 'n', 'no', 's', 't']);
  });
});

describe('the picture is drawn, and only claims what the link says (api/og.js)', () => {
  let draw;
  beforeAll(async () => {
    vi.stubGlobal('fetch', async (input) => {
      const u = new URL(typeof input === 'string' ? input : input.url);
      const file = u.pathname.startsWith('/og-fonts/') || u.pathname === '/data/top10.json' || u.pathname === '/icon-192.png' ? u.pathname : null;
      if (!file) return new Response('', { status: 404 });
      return new Response(local(file), { status: 200 });
    });
    draw = (await import('../../api/og.js')).default;
  });
  afterAll(() => vi.unstubAllGlobals());
  const png = async (q) => {
    const res = await draw(new Request(`https://balliq.app/api/og?${q}`));
    const buf = Buffer.from(await res.arrayBuffer());
    expect(res.status).toBe(200);
    expect(buf.subarray(1, 4).toString()).toBe('PNG');
    return buf;
  };
  it('all four games draw, with and without the detail', async () => {
    for (const q of ['t=gch&g=f&s=3&no=206', `t=gch&g=f&s=0&no=206&p=${enc(6, ['200100', '100200', '001000', '100000', '100000', '202000'])}`, 't=gch&g=x&s=7&no=45&n=Jo', 't=gch&g=x&s=0&no=99999', 't=gch&g=t&s=3&no=115&k=5', 't=gch&g=t&s=0&no=115', 't=challenge&s=5&d=25 Nov', 't=challenge&s=7&n=Alexander the Great']) {
      expect((await png(q)).length, q).toBeGreaterThan(20000);
    }
  }, 60000);
  it('detail that agrees with the score changes the picture; detail that does not is ignored', async () => {
    const plain = { f: await png('t=gch&g=f&s=3&no=206'), x: await png('t=gch&g=x&s=7&no=45'), t: await png('t=gch&g=t&s=3&no=115'), d: await png('t=challenge&s=5&d=25 Nov') };
    // agrees: the grid, the places, the dim clubs, the numbered answers
    expect((await png(`t=gch&g=f&s=3&no=206&p=${enc(7, ['0100010', '0020200', '2222222'])}`)).equals(plain.f)).toBe(false);
    expect((await png(`t=gch&g=x&s=7&no=45&m=${mask([1, 2, 3, 4, 6, 7, 9])}`)).equals(plain.x)).toBe(false);
    expect((await png('t=gch&g=t&s=3&no=115&k=5')).equals(plain.t)).toBe(false);
    expect((await png(`t=challenge&s=5&d=25 Nov&m=${mask([1, 2, 4, 5, 7])}`)).equals(plain.d)).toBe(false);
    // does not: two rows for a 3, a last row that is not solved, six places lit for a 7, fewer clubs than it took
    expect((await png(`t=gch&g=f&s=3&no=206&p=${enc(7, ['0100010', '2222222'])}`)).equals(plain.f)).toBe(true);
    expect((await png(`t=gch&g=f&s=3&no=206&p=${enc(7, ['0100010', '0020200', '2222221'])}`)).equals(plain.f)).toBe(true);
    expect((await png(`t=gch&g=x&s=7&no=45&m=${mask([1, 2, 3, 4, 6, 7])}`)).equals(plain.x)).toBe(true);
    expect((await png('t=gch&g=t&s=3&no=115&k=2')).equals(plain.t)).toBe(true);
    expect((await png(`t=challenge&s=5&d=25 Nov&m=${mask([1, 2, 4])}`)).equals(plain.d)).toBe(true);
    expect((await png('t=challenge&s=5&d=25 Nov&m=zz')).equals(plain.d)).toBe(true);
  }, 120000);
});
