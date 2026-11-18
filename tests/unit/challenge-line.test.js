// 18 Nov 2026: the score a mate set is the header's second line, and with no
// challenge for this puzzle the header's usual line is drawn instead. These
// render the real component (the source pins are in footle-mate-message).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
const h = React.createElement;
const text = (html) => html.replace(/<svg.*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('the score to beat, or the usual line', () => {
  let Banner, storeChallenge;
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', mem());
    ({ storeChallenge } = await import('../../src/lib/gameChallenge.js'));
    Banner = (await import('../../src/components/ChallengeBanner.jsx')).default;
  });
  afterEach(() => { vi.unstubAllGlobals(); });
  const draw = (props) => renderToStaticMarkup(h(Banner, props, 'Name all ten. Three lives.'));

  it('no challenge stored: the usual line', () => {
    expect(draw({ game: 'top10', edition: 38, finished: false })).toBe('Name all ten. Three lives.');
  });
  it('a challenge for this puzzle: the mate, the score, "Beat it?"', () => {
    storeChallenge({ game: 'top10', edition: 38, score: 7, name: 'Jonas Berg' });
    const html = draw({ game: 'top10', edition: 38, finished: false });
    expect(text(html)).toBe('Jonas · 7/10 Beat it?');
    expect(html).toContain('class="ch-line"');
    expect(html).not.toContain('Name all ten');
  });
  it('each game reads its own score, and a miss is a miss', () => {
    storeChallenge({ game: 'footle', edition: 199, score: 5, name: 'Jonas' });
    expect(text(draw({ game: 'footle', edition: 199, finished: false }))).toBe('Jonas · 5/6 Beat it?');
    storeChallenge({ game: 'footle', edition: 199, score: 0, name: '' });
    expect(text(draw({ game: 'footle', edition: 199, finished: false }))).toBe('A mate · X/6 Beat it?');
    storeChallenge({ game: 'trail', edition: 108, score: 3, name: '  ' });
    expect(text(draw({ game: 'trail', edition: 108, finished: false }))).toBe('A mate · 3 clubs Beat it?');
    storeChallenge({ game: 'trail', edition: 108, score: 0, name: 'Sam' });
    expect(text(draw({ game: 'trail', edition: 108, finished: false }))).toBe('Sam · missed Beat it?');
  });
  it('another puzzle, another game, an archive day (-1) or a finished game: the usual line', () => {
    storeChallenge({ game: 'top10', edition: 38, score: 7, name: 'Jonas' });
    expect(draw({ game: 'top10', edition: 37, finished: false })).toBe('Name all ten. Three lives.');
    expect(draw({ game: 'trail', edition: 38, finished: false })).toBe('Name all ten. Three lives.');
    expect(draw({ game: 'top10', edition: -1, finished: false })).toBe('Name all ten. Three lives.');
    expect(draw({ game: 'top10', edition: 38, finished: true })).toBe('Name all ten. Three lives.');
  });
});
