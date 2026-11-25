// WHAT A SHARED LINK TELLS THE PICTURE (25 Nov 2026, src/lib/shareDetail.js).
//
// The picture a /c/ link shows is the puzzle itself (api/og.js). These strings
// let it show what the sender's own finish shows: Footle's grid with no
// letters, the Top 10 places named, the Daily 7 answers in order, the Trail's
// number of clubs. Pinned here: the exact strings, that nothing but colours
// and counts can be in them, that the picture really draws from them (the
// real api/og.js, with the fonts and the schedule from this checkout), and
// that every game's link carries them.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { footleDetail, top10Detail, trailDetail, setDailyMarks, dailyDetail, withDetail } from '../../src/lib/shareDetail.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('the strings', () => {
  it('Footle: letters, then each row of tiles as base 3 in base 36', () => {
    expect(footleDetail('⬛🟨⬛⬛⬛🟨⬛\n⬛⬛🟩⬛🟩⬛⬛\n🟩🟩🟩🟩🟩🟩🟩')).toBe(`p=7.${parseInt('0100010', 3).toString(36)}.${parseInt('0020200', 3).toString(36)}.${parseInt('2222222', 3).toString(36)}`);
    // the colour-blind squares are the same tiles
    expect(footleDetail('⬛🟦⬛⬛⬛🟦⬛\n🟧🟧🟧🟧🟧🟧🟧')).toBe(footleDetail('⬛🟨⬛⬛⬛🟨⬛\n🟩🟩🟩🟩🟩🟩🟩'));
    expect(footleDetail('🟩🟩🟩🟩🟩')).toBe('p=5.6q');
  });
  it('Footle: anything that is not a clean grid says nothing', () => {
    for (const bad of ['', null, 'HURST', '🟩🟩🟩\n🟩🟩', '🟩🟩', '🟩'.repeat(13), Array(7).fill('🟩🟩🟩🟩🟩').join('\n'), '🟩🟩A🟩🟩']) expect(footleDetail(bad), String(bad)).toBe('');
  });
  it('never a letter: only digits, lower-case letters of a number, and dots', () => {
    expect(footleDetail('⬛🟨⬛⬛⬛🟨⬛\n🟩🟩🟩🟩🟩🟩🟩')).toMatch(/^p=\d{1,2}(\.[0-9a-z]{1,5}){1,6}$/);
    expect(top10Detail([true, true, true, true, false, true, true, false, true, false])).toMatch(/^m=[0-9a-z]{1,2}$/);
  });
  it('Top 10: the places named, first place the lowest bit', () => {
    expect(top10Detail([true, false, false, false, false, false, false, false, false, false])).toBe('m=1');
    expect(top10Detail(Array(10).fill(true))).toBe(`m=${(1023).toString(36)}`);
    expect(top10Detail(Array(10).fill(false))).toBe('m=0');
    expect(top10Detail([true, true])).toBe('');
    expect(top10Detail(null)).toBe('');
  });
  it('Transfer Trail: the clubs in the career', () => {
    expect(trailDetail(5)).toBe('k=5');
    for (const bad of [0, 13, 2.5, '5', null]) expect(trailDetail(bad)).toBe('');
  });
  it('Daily 7: the marks the finish left, only while they add up to the score', () => {
    setDailyMarks(null);
    expect(dailyDetail(5)).toBe('');
    setDailyMarks([true, true, false, true, true, false, true]);
    expect(dailyDetail(5)).toBe(`m=${(0b1011011).toString(36)}`);
    expect(dailyDetail(4)).toBe('');                  // another day's marks never ride on today's score
    setDailyMarks([true, true]);
    expect(dailyDetail(2)).toBe('');
    setDailyMarks(null);
  });
  it('joined to whatever the link already carries', () => {
    expect(withDetail('https://balliq.app/c/x.45.7', 'm=ab')).toBe('https://balliq.app/c/x.45.7?m=ab');
    expect(withDetail('https://balliq.app/c/x.45.7?r=LMSKUWFNMRNK', 'm=ab')).toBe('https://balliq.app/c/x.45.7?r=LMSKUWFNMRNK&m=ab');
    expect(withDetail('https://balliq.app/c/x.45.7?r=LMSKUWFNMRNK', '')).toBe('https://balliq.app/c/x.45.7?r=LMSKUWFNMRNK');
  });
});

describe('every game hands its detail to the link', () => {
  it('Footle from the squares it shares; Top 10 and the Trail as shareDetail; the Daily 7 from its marks', () => {
    const done = read('src/components/DailyDone.jsx');
    expect(done).toContain('withDetail(`https://balliq.app/c/${token}${rid ? `?r=${rid}` : ""}`, game === "footle" ? footleDetail(challengeGrid) : shareDetail)');
    expect(read('src/screens/Top10.jsx')).toContain('shareDetail={top10Detail(g.found)}');
    expect(read('src/screens/TransferTrail.jsx')).toContain('shareDetail={trailDetail(career.length)}');
    expect(read('src/hooks/useShare.js')).toContain('const challengeUrl = withDetail(plainUrl, dailyDetail(score));');
    expect(read('src/screens/ResultsScreen.jsx')).toContain('if (mode === "daily" && !result.dailyArchive) setDailyMarks(rdDots);');
  });
});

describe('the page and the picture take exactly these strings', () => {
  let page, draw;
  beforeAll(async () => {
    vi.stubGlobal('fetch', async (input) => {
      const u = new URL(typeof input === 'string' ? input : input.url);
      const ok = u.pathname.startsWith('/og-fonts/') || u.pathname === '/data/top10.json' || u.pathname === '/icon-192.png';
      return ok ? new Response(readFileSync(new URL(`../../public${u.pathname}`, import.meta.url)), { status: 200 }) : new Response('', { status: 404 });
    });
    page = (await import('../../api/c.js')).default;
    draw = (await import('../../api/og.js')).default;
  });
  afterAll(() => vi.unstubAllGlobals());
  const pictureOf = async (link) => {
    const u = new URL(link);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const html = await (await page(new Request(`http://localhost/api/c?t=${u.pathname.slice(3)}&${u.searchParams.toString()}`))).text();
    spy.mockRestore();
    const image = ((html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '').replace(/&amp;/g, '&');
    const res = await draw(new Request(image.replace('http://localhost', 'https://balliq.app')));
    expect(res.status).toBe(200);
    return { query: new URL(image).searchParams, png: Buffer.from(await res.arrayBuffer()) };
  };
  it('a link with its detail draws a different picture from the plain link, for all four', async () => {
    setDailyMarks([true, true, false, true, true, false, true]);
    const cases = [
      ['https://balliq.app/c/f.206.3?r=LMSKUWFNMRNK', footleDetail('⬛🟨⬛⬛⬛🟨⬛\n⬛⬛🟩⬛🟩⬛⬛\n🟩🟩🟩🟩🟩🟩🟩'), 'p'],
      ['https://balliq.app/c/x.45.7?r=LMSKUWFNMRNK', top10Detail([true, true, true, true, false, true, true, false, true, false]), 'm'],
      ['https://balliq.app/c/t.115.3', trailDetail(5), 'k'],
      ['https://balliq.app/c/5.20261125', dailyDetail(5), 'm'],
    ];
    setDailyMarks(null);
    for (const [link, detail, key] of cases) {
      expect(detail, link).not.toBe('');
      const plain = await pictureOf(link);
      const rich = await pictureOf(withDetail(link, detail));
      expect(rich.query.get(key), link).toBe(detail.slice(2));
      expect(plain.query.get(key), link).toBeNull();
      expect(rich.png.equals(plain.png), link).toBe(false);
    }
  }, 120000);
});
