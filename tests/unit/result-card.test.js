// The result card (22 Nov 2026): the daily's finish as one object. Alex steered
// four drawn rounds; these pin what round four decided and the honesty rules
// under it (nothing about other players is drawn until a server sends it).
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ResultCard, starIndex } from '../../src/components/ResultCard.jsx';

const h = (props) => renderToStaticMarkup(React.createElement(ResultCard, { title: 'Daily 7', tag: '22 Nov', outOf: 7, verdict: 'Keep going.', ...props }));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const marks5 = [true, true, false, true, true, true, false];

describe('the card', () => {
  it('says the game and its day, the site by name, the score with the verdict beside it', () => {
    const html = h({ score: 5, marks: marks5, sub: 'Average 3.7' });
    expect(html).toContain('<span>Daily 7 · 22 Nov</span><span class="rc-site">balliq.app</span>');
    expect(html).toContain('<div class="rc-num"><b>5</b><span>/7</span></div><div class="rc-say"><div class="rc-v">Keep going.</div><div class="rc-sub">Average 3.7</div></div>');
    expect(html).toContain('aria-label="Daily 7: 5 out of 7"');
  });
  it('carries the brand as a name, never as a small mark (Alex: it "looks like the zoom button")', () => {
    const html = h({ score: 5, marks: marks5 });
    expect(html).not.toMatch(/<img|<svg/);
  });
  it('draws the seven as discs, in order, and says the count to a screen reader', () => {
    const html = h({ score: 5, marks: marks5 });
    const ks = [...html.matchAll(/<span class="rc-k( is-in)?( is-star)?">/g)].map((m) => !!m[1]);
    expect(ks).toEqual(marks5);
    expect(html).toContain('role="img" aria-label="5 of 7 right"');
  });
  it('draws nothing about other players until it is given their numbers', () => {
    const html = h({ score: 5, marks: marks5 });
    expect(html).not.toContain('%');
    expect(html).not.toContain('rc-note');
    expect(html).not.toContain('is-star');
    // A partial or malformed list is no list.
    for (const shares of [[88, 71, 34], [88, 71, 34, 63, 52, null, 41], 'x']) {
      const bad = h({ score: 5, marks: marks5, shares });
      expect(bad).not.toContain('%');
      expect(bad).not.toContain('rc-note');
    }
  });
  it('with the numbers: each disc has its share, the hardest one got is gold and is named', () => {
    const html = h({ score: 5, marks: marks5, shares: [88, 71, 34, 63, 52, 12, 41] });
    expect([...html.matchAll(/<em>(\d+)%<\/em>/g)].map((m) => +m[1])).toEqual([88, 71, 34, 63, 52, 12, 41]);
    expect(html.match(/is-star/g).length).toBe(1);
    expect(html).toContain('<span class="rc-k is-in is-star"><i></i><em>12%</em></span>');
    expect(text(html)).toContain('You got number 6. Only 12% did.');
  });
  it('on a bad day it still finds the best true thing', () => {
    const html = h({ score: 1, marks: [false, false, true, false, false, false, false], shares: [88, 71, 34, 63, 52, 12, 41] });
    expect(text(html)).toContain('You got number 3. 66% missed it.');
  });
  it('but never dresses up an easy one, and never a miss', () => {
    // Got only the ones most players got: no gold, no line.
    const easy = h({ score: 2, marks: [true, true, false, false, false, false, false], shares: [88, 71, 34, 63, 52, 12, 41] });
    expect(easy).not.toContain('is-star');
    expect(easy).not.toContain('rc-note');
    expect(starIndex([false, false, false], [5, 5, 5])).toBe(-1);
    expect(starIndex([true, true], [40, 40])).toBe(0);
    expect(starIndex([true], [51])).toBe(-1);
    expect(starIndex(null, null)).toBe(-1);
  });
  it('until then it marks the hard ones from the bank\'s own difficulty, and only those', () => {
    const levels = ['easy', 'medium', 'hard', 'medium', 'easy', 'hard', 'medium'];
    const html = h({ score: 5, marks: marks5, levels });
    const labels = [...html.matchAll(/<em>([^<]*)<\/em>/g)].map((m) => m[1].replace(/\u00a0/g, ''));
    expect(labels).toEqual(['', '', 'Hard', '', '', 'Hard', '']);
    // Number 6 was hard and right: gold. Number 3 was hard and wrong: marked, not gold.
    expect(html).toContain('<span class="rc-k is-in is-star"><i></i><em>Hard</em></span>');
    expect(html).toContain('<span class="rc-k"><i></i><em>Hard</em></span>');
    expect(html.match(/is-star/g).length).toBe(1);
    expect(text(html)).toContain("You got number 6. One of today's hard ones.");
    expect(html).not.toContain('%');
  });
  it('several hard ones, all of them, or none got', () => {
    const levels = ['hard', 'hard', 'hard', 'easy', 'easy', 'easy', 'easy'];
    expect(text(h({ score: 5, marks: marks5, levels }))).toContain("You got 2 of today's 3 hard ones.");
    expect(text(h({ score: 7, marks: Array(7).fill(true), levels }))).toContain('You got every hard one today.');
    const none = h({ score: 1, marks: [false, false, false, true, false, false, false], levels });
    expect(none).not.toContain('rc-note');
    expect(none).not.toContain('is-star');
    expect(none).toContain('<em>Hard</em>');
  });
  it('a day with no hard question has no labels and no line; a list of the wrong length is no list', () => {
    const plain = h({ score: 5, marks: marks5, levels: Array(7).fill('medium') });
    expect(plain).not.toContain('<em>');
    expect(plain).not.toContain('rc-note');
    expect(h({ score: 5, marks: marks5, levels: ['hard'] })).not.toContain('<em>');
  });
  it('real shares, when they come, replace the difficulty labels', () => {
    const html = h({ score: 5, marks: marks5, levels: Array(7).fill('hard'), shares: [88, 71, 34, 63, 52, 12, 41] });
    expect(html).not.toContain('Hard');
    expect(html.match(/is-star/g).length).toBe(1);
  });
  it('without marks it is the score and the verdict alone', () => {
    const html = h({ score: 7, marks: null });
    expect(html).not.toContain('rc-kicks');
  });
});

describe('the look that was agreed', () => {
  const css = readFileSync(new URL('../../src/components/resultCard.css', import.meta.url), 'utf8');
  const rule = (sel) => css.slice(css.indexOf(sel + '{'), css.indexOf('}', css.indexOf(sel + '{')));
  it('the hero keeps its height when the day\'s numbers replace the first words', () => {
    expect(rule('.rc-hero')).toContain('min-height:72px');
  });
  it('the score is about 72px, not the 92 to 112 of the first rounds', () => {
    expect(rule('.rc-num b')).toContain('font-size:72px');
  });
  it('nothing decorative: stripes only, no extra shapes or glows on the card', () => {
    // The darker pitch (24 Nov 2026, Alex's choice on the drawn finish), on every game's card:
    // it is the card's own background, so no host can ask for the old one.
    expect(rule('.rc')).toContain('repeating-linear-gradient(90deg,#092B1B 0 46px,#0B3421 46px 92px)');
    expect(css).not.toMatch(/#0E4429|#114E2F/i);
    expect((css.match(/repeating-linear-gradient/g) || []).length).toBe(1);
    expect(css).not.toMatch(/radial-gradient|::before|::after/);
  });
  it('a wrong answer is a filled red dot, not a cross', () => {
    expect(rule('.rc-k i')).toContain('background:#C23B33');
    expect(rule('.rc-k i')).not.toContain('border:');
    const src = readFileSync(new URL('../../src/components/ResultCard.jsx', import.meta.url), 'utf8');
    expect(src.slice(src.indexOf('export function ResultCard'))).not.toMatch(/✓|✗|✕|<svg|lucide/);
  });
});

// 24 Nov 2026, agreed with Alex on the drawn rounds 18 to 20: green for right,
// red for wrong, a gold ring (not a gold dot) round a hard one got, and the XP
// in yellow under the verdict.
describe('the marks and the XP (24 Nov 2026)', () => {
  const css = readFileSync(new URL('../../src/components/resultCard.css', import.meta.url), 'utf8');
  const rule = (sel) => css.slice(css.indexOf(sel + '{'), css.indexOf('}', css.indexOf(sel + '{')));
  const levels = ['easy', 'medium', 'hard', 'medium', 'easy', 'hard', 'medium'];
  // Number 3 is hard and missed, number 6 is hard and got.
  const mixed = { score: 5, marks: marks5, levels, sub: 'Some tough ones in there today.', xp: 50 };
  it('right is a filled green dot, wrong a filled red one', () => {
    expect(rule('.rc-k.is-in i')).toContain('background:#58CC02');
    expect(rule('.rc-k i')).toContain('background:#C23B33');
    // filled, never outlined: neither has a border of its own
    expect(rule('.rc-k i')).not.toContain('border:');
    expect(rule('.rc-k.is-in i')).not.toContain('border');
    expect(css).not.toMatch(/\.rc-k[^{]*i\{[^}]*background:#fff/);
  });
  it('a hard one got is the same green dot with a gold ring 2.5px wide, 2.5px clear of it', () => {
    const html = h(mixed);
    expect(html).toContain('<span class="rc-k is-in is-star"><i></i><em>Hard</em></span>');
    const star = rule('.rc-k.is-star i');
    expect(star).toContain('border:2.5px solid #FFD34D');
    expect(star).toContain('padding:2.5px');
    expect(star).toContain('background-clip:content-box');
    // the ring takes no room: the dot stays where its neighbours are
    expect(star).toContain('margin:-5px');
    // and the dot under it is still green, not gold
    expect(star).not.toMatch(/background(-color)?:#/);
    // An outline is square in Safari before 16.4 whatever the radius.
    expect(star).not.toContain('outline');
  });
  it('a hard one missed is red like any miss, with the quiet label under it', () => {
    const html = h(mixed);
    expect(html).toContain('<span class="rc-k"><i></i><em>Hard</em></span>');
    expect(rule('.rc-k em')).toContain('color:rgba(255,255,255,0.5)');
    // the gold label and the gold words in the line are as they were
    expect(rule('.rc-k.is-star em')).toContain('color:#FFD34D');
    expect(rule('.rc-note strong')).toContain('color:#FFD34D');
    expect(text(html)).toContain("You got number 6. One of today's hard ones.");
  });
  it('the XP is under the verdict in yellow, where the sentence was', () => {
    const html = h(mixed);
    expect(html).toContain('<div class="rc-hero is-foot"><div class="rc-num"><b>5</b><span>/7</span></div><div class="rc-say"><div class="rc-v">Keep going.</div><div class="rc-xp">+50 XP</div></div></div>');
    expect(html).not.toContain('rc-sub');
    const xp = rule('.rc-xp');
    for (const d of ['font-size:13.5px', 'font-weight:700', 'color:#FFD34D', '-webkit-text-fill-color:#FFD34D', 'font-variant-numeric:tabular-nums']) expect(xp).toContain(d);
    // no second face: the card's own Inter
    expect(xp).not.toContain('font-family');
  });
  it('with the XP, the verdict stands against the foot of the number; without it the hero is as it was', () => {
    expect(rule('.rc-hero.is-foot')).toBe('.rc-hero.is-foot{align-items:flex-end;gap:18px;');
    expect(rule('.rc-hero.is-foot .rc-say')).toContain('padding-bottom:5px');
    expect(rule('.rc-hero')).toContain('align-items:center;gap:16px');
    expect(rule('.rc-say')).not.toContain('padding');
    // Footle, Transfer Trail and Top 10 pass no XP to the card
    const other = renderToStaticMarkup(React.createElement(ResultCard, { title: 'Transfer Trail', tag: 'No. 113', score: 3, outOf: 4, verdict: 'Brilliant', sub: 'It was Zinedine Zidane' }));
    expect(other).toContain('<div class="rc-hero"><div class="rc-num">');
    expect(other).toContain('<div class="rc-sub">It was Zinedine Zidane</div>');
    expect(other).not.toContain('is-foot');
    expect(other).not.toContain('rc-xp');
  });
  it('on a day with no line under the marks, the displaced sentence is that line', () => {
    const html = h({ score: 5, marks: marks5, levels: Array(7).fill('medium'), sub: 'Some tough ones in there today.', xp: 50 });
    expect(html).toContain('<p class="rc-note">Some tough ones in there today.</p>');
    expect(html.match(/Some tough ones in there today\./g).length).toBe(1);
    // with a line of its own (a hard one got), that line stays and the sentence is not drawn
    expect(h(mixed)).not.toContain('Some tough ones');
    // a hard one missed and none got: no hard line, so the sentence again
    const missed = h({ score: 1, marks: [true, false, false, false, false, false, false], levels, sub: "Tomorrow's seven are brand new.", xp: 10 });
    expect(text(missed)).toContain("+10 XP Hard Hard Tomorrow's seven are brand new.");
    // and a card with no XP never moves its sentence
    const plain = h({ score: 5, marks: marks5, levels: Array(7).fill('medium'), sub: 'Some tough ones in there today.' });
    expect(plain).toContain('<div class="rc-sub">Some tough ones in there today.</div>');
    expect(plain).not.toContain('rc-note');
  });
  it('nothing earned is not announced: no "+0 XP", and the card is the one it was', () => {
    for (const xp of [0, null, undefined, NaN]) {
      const html = h({ score: 0, marks: Array(7).fill(false), sub: "Tomorrow's seven are brand new.", xp });
      expect(html).not.toContain('XP');
      expect(html).not.toContain('is-foot');
      expect(html).toContain('<div class="rc-sub">Tomorrow&#x27;s seven are brand new.</div>');
    }
  });
  it('two ringed marks side by side: the row says so, and steps down a size on a narrow phone so the rings do not touch', () => {
    const side = h({ score: 7, marks: Array(7).fill(true), levels: ['medium', 'hard', 'medium', 'hard', 'hard', 'hard', 'medium'], xp: 120 });
    expect(side).toContain('<div class="rc-kicks is-close" role="img"');
    // apart, or one of the pair missed: the row is as drawn
    expect(h(mixed)).toContain('<div class="rc-kicks" role="img"');
    expect(h({ score: 6, marks: [true, true, true, true, false, true, true], levels: ['easy', 'easy', 'easy', 'hard', 'hard', 'easy', 'easy'], xp: 60 })).toContain('<div class="rc-kicks" role="img"');
    // 390px and wider have the room (the rings are 2px apart at 390): nothing changes there
    expect(css).toContain('@media (max-width: 389px){.rc-kicks.is-close .rc-k{width:34px;}.rc-kicks.is-close .rc-k i{width:30px;height:30px;}}');
    expect(css).toContain('.rc-kicks.is-close .rc-k{width:28px;}.rc-kicks.is-close .rc-k i{width:24px;height:24px;}}');
  });
  it('with the crowd\'s numbers the colours and the ring are the same', () => {
    const html = h({ score: 5, marks: marks5, shares: [88, 71, 34, 63, 52, 12, 41], xp: 50 });
    expect(html).toContain('<span class="rc-k is-in is-star"><i></i><em>12%</em></span>');
    expect(html).toContain('<span class="rc-k"><i></i><em>34%</em></span>');
    expect(html).toContain('<div class="rc-xp">+50 XP</div>');
  });
});

describe('what the card says about everyone else', () => {
  const card = { verdict: 'A tough set today.', sub: "Tomorrow's seven are brand new." };
  const tr = (k, p = {}) => ({ 'dd.cmp.better': `Better than ${p.p}%`, 'dd.played': `${p.n} played`, 'rc.played': `${p.n} played today`, 'rc.avgPlayed': `Average ${p.avg} · ${p.n} played`, 'rc.avg': `Average ${p.avg}` }[k] ?? k);
  let cardWords;
  it('loads', async () => { ({ cardWords } = await import('../../src/components/DailyDone.jsx')); expect(typeof cardWords).toBe('function'); });
  it('before there is a crowd: the host\'s own words', () => {
    expect(cardWords(null, card, tr)).toEqual({ verdict: 'A tough set today.', sub: "Tomorrow's seven are brand new." });
  });
  it('a good day: the standing is the headline, the average under it while the room is small', () => {
    expect(cardWords({ n: 40, outOf: 7, avg: 3.72, beatPct: 71, line: 'Better than 71%' }, card, tr)).toEqual({ verdict: 'Better than 71%', sub: 'Average 3.7' });
    expect(cardWords({ n: 40, outOf: 7, avg: 3.72, beatPct: 60, line: 'Top 12%' }, card, tr).verdict).toBe('Top 12%');
  });
  it('a bad day: "Better than 4%" is never the headline', () => {
    expect(cardWords({ n: 40, outOf: 7, avg: 3.72, beatPct: 4, line: 'Better than 4%' }, card, tr)).toEqual({ verdict: 'A tough set today.', sub: 'Average 3.7' });
    // A tie with the biggest group is not a rub, even below the average.
    expect(cardWords({ n: 40, outOf: 7, avg: 3.72, beatPct: 10, line: 'Same as 41% of players' }, card, tr).verdict).toBe('Same as 41% of players');
  });
  it('headcounts only once the room is big', () => {
    expect(cardWords({ n: 299, outOf: 7, avg: 3.7, beatPct: 71, line: 'Better than 71%' }, card, tr).sub).toBe('Average 3.7');
    expect(cardWords({ n: 300, outOf: 7, avg: 3.7, beatPct: 71, line: 'Better than 71%' }, card, tr).sub).toBe('300 played today');
    expect(cardWords({ n: 1432, outOf: 7, avg: 3.7, beatPct: 4, line: 'Better than 4%' }, card, tr).sub).toMatch(/^Average 3\.7 · 1.432 played$/);
  });
  it('"Better than 0%" (one player in 400 below you) is never the headline either', () => {
    expect(cardWords({ n: 400, outOf: 7, avg: 3.7, beatPct: 0, line: 'Better than 0%' }, card, tr).verdict).toBe('A tough set today.');
  });
  it('an old day from the archive was not played today', () => {
    expect(cardWords({ n: 1204, outOf: 7, avg: 3.7, beatPct: 71, line: 'Better than 71%' }, card, tr, true).sub).toMatch(/^1.204 played$/);
    expect(cardWords({ n: 1204, outOf: 7, avg: 3.7, beatPct: 71, line: 'Better than 71%' }, card, tr, false).sub).toMatch(/^1.204 played today$/);
  });
  it('no comparison to make (a zero, or nobody worse): the host\'s verdict with the average', () => {
    expect(cardWords({ n: 40, outOf: 7, avg: 3.7, beatPct: 0, line: null }, card, tr)).toEqual({ verdict: 'A tough set today.', sub: 'Average 3.7' });
  });
});

describe('the finish panel with the card', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
  const load = async () => { vi.resetModules(); vi.stubGlobal('localStorage', mem()); return (await import('../../src/components/DailyDone.jsx')).default; };
  const card = { title: 'Daily 7', tag: '22 Nov', score: 5, outOf: 7, marks: marks5, verdict: 'Solid challenge.', sub: 'Some tough ones in there today.', xp: 50 };
  it('puts the card above the panel, the XP on the card and not a second time under it, and drops the crowd row and an empty footer', async () => {
    const DailyDone = await load();
    const html = renderToStaticMarkup(React.createElement(DailyDone, { game: 'daily7', edition: 20779, won: true, bucket: 5, streak: { count: 4, label: 'daily streak' }, card }));
    expect(html.indexOf('<section class="rc"')).toBeGreaterThanOrEqual(0);
    expect(html.indexOf('<section class="rc"')).toBeLessThan(html.indexOf('<section class="dd"'));
    // The Daily 7's XP is on the card (24 Nov 2026); the streak row does not repeat it.
    expect(html).toContain('<div class="rc-xp">+50 XP</div>');
    expect(html.match(/\+50 XP/g).length).toBe(1);
    expect(html).not.toContain('dd-xp');
    expect(html).not.toContain('dd-trow');
    expect(html).not.toContain('dd-dist');
    // The footer (a hairline and its group) is not drawn when it would be empty.
    const plain = renderToStaticMarkup(React.createElement(DailyDone, { game: 'daily7', edition: 20779, won: true, bucket: 5, streak: { count: 4, label: 'daily streak' } }));
    const hairlines = (x) => (x.match(/class="dd-hr"/g) || []).length;
    expect(hairlines(html)).toBe(hairlines(plain) - 1);
    expect(html.endsWith('</div></section>')).toBe(true);
    // With something to put in it (a save row), the footer is back.
    const withSave = renderToStaticMarkup(React.createElement(DailyDone, { game: 'daily7', edition: 20779, won: true, bucket: 5, streak: { count: 4, label: 'daily streak' }, card, save: { onSave: () => {}, line: '50 XP' } }));
    expect(hairlines(withSave)).toBe(hairlines(plain));
    expect(withSave).not.toContain('dd-dist');
    // Before any crowd is known the card says what the host gave it: the verdict
    // beside the score, and its sentence as the line under the marks.
    expect(html).toContain('<div class="rc-v">Solid challenge.</div><div class="rc-xp">+50 XP</div>');
    expect(html).toContain('<p class="rc-note">Some tough ones in there today.</p>');
  });
  it('another game\'s card keeps its XP on the streak line and its sentence under the verdict', async () => {
    const DailyDone = await load();
    const trail = { title: 'Transfer Trail', tag: 'No. 113', score: 3, outOf: 4, verdict: 'Brilliant', sub: 'It was Zinedine Zidane', pinSub: true, xp: 40 };
    const html = renderToStaticMarkup(React.createElement(DailyDone, { game: 'trail', edition: 113, won: true, bucket: 3, streak: { count: 4, label: 'daily streak' }, card: trail }));
    expect(html).toMatch(/<div class="dd-trow"><div class="dd-title">.*?<\/div><span class="dd-xp dd-num">\+40 XP<\/span><\/div>/);
    expect(html).toContain('<div class="rc-hero"><div class="rc-num">');
    expect(html).toContain('<div class="rc-sub">It was Zinedine Zidane</div>');
    expect(html).not.toContain('rc-xp');
    expect(html).not.toContain('is-foot');
  });
  it('without a card the panel is exactly what it was', async () => {
    const DailyDone = await load();
    const html = renderToStaticMarkup(React.createElement(DailyDone, { game: 'footle', edition: 203, won: true, bucket: 3, streak: { count: 4, label: 'Footle streak' } }));
    expect(html.startsWith('<section class="dd"')).toBe(true);
    expect(html).not.toContain('class="rc"');
    expect(html).not.toContain('dd-trow');
    expect(html).toContain('dd-dist');
  });
});

describe('Footle ends on the card too', () => {
  const src = readFileSync(new URL('../../src/games/FootballWordle.jsx', import.meta.url), 'utf8');
  it('a win: the guess count out of six, the verdict, the answer as the line under the played rows', () => {
    expect(src).toContain('score: won ? state.guesses.length : null, outOf: 6,');
    // Round two (24 Nov 2026): the XP has the place under the verdict, so a win says who it
    // was under the grid; after a loss "Out of guesses" stays under the name.
    expect(src).toContain('sub: won ? null : t("rc.footleLost"),');
    expect(src).toContain('note: won ? t("footle.answerWas", { name: full }) : null,');
    expect(src).toContain('pinSub: true,');
    expect(src).toContain('card={footleCard}');
  });
  it('a loss has no score, and the name is the headline at the number\'s size', () => {
    const html = renderToStaticMarkup(React.createElement(ResultCard, { title: 'Footle', tag: 'No. 203', score: null, outOf: 6, verdict: 'Didier Drogba', sub: 'Out of guesses' }));
    expect(html).not.toContain('rc-num');
    expect(html).toContain('<div class="rc-hero is-name">');
    expect(html).toContain('aria-label="Footle"');
    const css = readFileSync(new URL('../../src/components/resultCard.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.rc-hero\.is-name \.rc-v\{font-size:30px;/);
  });
  it('the report link stays, under the panel', () => {
    expect(src).toMatch(/<div className="wd-report-row">\s*\{onReport && <FootleReportButton answer=\{answer\} status=\{state\.status\} onReport=\{onReport\} \/>\}/);
  });
});

// ROUND TWO OF THE FINISH (24 Nov 2026). Alex scored the Footle finish 4 to 5 and chose a
// drawing where the screen's header names the game once and the card starts at the score.
describe('a host may leave the card\'s top line out (24 Nov 2026, round two)', () => {
  const css = readFileSync(new URL('../../src/components/resultCard.css', import.meta.url), 'utf8');
  const rule = (sel) => css.slice(css.indexOf(sel + '{'), css.indexOf('}', css.indexOf(sel + '{')));
  const footle = { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant' };
  const el = React.createElement;
  it('head={false}: no game, no day, no balliq.app; the card starts at the score and is still named to a screen reader', () => {
    const html = renderToStaticMarkup(el(ResultCard, { ...footle, head: false }));
    expect(html).not.toContain('rc-eye');
    expect(html).not.toContain('balliq.app');
    expect(html).not.toContain('No. 204');
    expect(html.startsWith('<section class="rc is-bare" aria-label="Footle: 3 out of 6"><div class="rc-hero">')).toBe(true);
    expect(rule('.rc.is-bare .rc-hero')).toContain('margin-top:4px');
  });
  it('every other host keeps the line: it is on unless a host turns it off', () => {
    for (const p of [{}, { head: true }, { head: undefined }]) {
      const html = renderToStaticMarkup(el(ResultCard, { ...footle, ...p }));
      expect(html.startsWith('<section class="rc" aria-label="Footle: 3 out of 6"><div class="rc-eye"><span>Footle · No. 204</span><span class="rc-site">balliq.app</span></div>')).toBe(true);
      expect(html).not.toContain('is-bare');
    }
    // and only the finish panel's "one" layout asks: no screen passes it itself
    for (const f of ['src/games/FootballWordle.jsx', 'src/screens/TransferTrail.jsx', 'src/screens/Top10.jsx', 'src/screens/ResultsScreen.jsx', 'src/screens/MysteryPlayer.jsx']) {
      expect(readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8'), f).not.toMatch(/\bhead=\{false\}/);
    }
    const dd = readFileSync(new URL('../../src/components/DailyDone.jsx', import.meta.url), 'utf8');
    expect((dd.match(/head=\{false\}/g) || []).length).toBe(1);
    expect(dd.slice(dd.indexOf('const cardEl = card ? ('))).not.toContain('head=');
  });
});

describe('the XP on a Footle card (24 Nov 2026, round two)', () => {
  const css = readFileSync(new URL('../../src/components/resultCard.css', import.meta.url), 'utf8');
  const rule = (sel) => css.slice(css.indexOf(sel + '{'), css.indexOf('}', css.indexOf(sel + '{')));
  const el = React.createElement;
  const pic = el('div', { className: 'wd-cg' });
  it('a win: the XP in yellow under the verdict, the answer as one quiet centred line under the grid', () => {
    const html = renderToStaticMarkup(el(ResultCard, { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant', xp: 48, note: 'The answer was Joe Bennett', picture: pic, head: false }));
    expect(html).toContain('<div class="rc-hero is-foot"><div class="rc-num"><b>3</b><span>/6</span></div><div class="rc-say"><div class="rc-v">Brilliant</div><div class="rc-xp">+48 XP</div></div></div>');
    expect(html).toContain('<div class="rc-pic"><div class="wd-cg"></div></div><p class="rc-note">The answer was Joe Bennett</p>');
    expect(html.match(/The answer was Joe Bennett/g).length).toBe(1);
    expect(html).not.toContain('rc-sub');
    const line = rule('.rc-pic + .rc-note');
    for (const d of ['margin-top:14px', 'text-align:center', 'font-size:13px', 'color:rgba(255,255,255,0.72)']) expect(line, d).toContain(d);
  });
  it('a loss: the full name is still the headline, "Out of guesses" stays under it, then the XP', () => {
    const html = renderToStaticMarkup(el(ResultCard, { title: 'Footle', tag: 'No. 202', score: null, outOf: 6, verdict: 'Aleksandar Mitrović', sub: 'Out of guesses', xp: 10, picture: pic, head: false }));
    expect(html).toContain('<div class="rc-hero is-name"><div class="rc-say"><div class="rc-v">Aleksandar Mitrović</div><div class="rc-sub">Out of guesses</div><div class="rc-xp">+10 XP</div></div></div>');
    // the sentence is said once: it does not also become the line under the grid
    expect(html.match(/Out of guesses/g).length).toBe(1);
    expect(html).not.toContain('rc-note');
    expect(html).not.toContain('is-foot');
    expect(css).toMatch(/\.rc-hero\.is-name \.rc-v\{font-size:30px;/);
  });
  it('an old puzzle pays nothing, so its card says no XP and keeps the answer under the grid', () => {
    const html = renderToStaticMarkup(el(ResultCard, { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant', xp: null, note: 'The answer was Joe Bennett', picture: pic, head: false }));
    expect(html).not.toContain('XP');
    expect(html).toContain('<div class="rc-hero"><div class="rc-num">');
    expect(html).toContain('</div><p class="rc-note">The answer was Joe Bennett</p>');
  });
  it('Share sits 16px under whatever is above it on a card with no top line', () => {
    expect(rule('.rc.is-bare .rc-act')).toContain('margin-top:16px');
    expect(rule('.rc-act')).toContain('margin:20px 0 0');
  });
});

describe('Transfer Trail and Top 10 end on the card (23 Nov 2026)', () => {
  const trail = readFileSync(new URL('../../src/screens/TransferTrail.jsx', import.meta.url), 'utf8');
  const top10 = readFileSync(new URL('../../src/screens/Top10.jsx', import.meta.url), 'utf8');
  it('Trail: the club it took out of the career, a win word, the name pinned under it; a loss has no score', () => {
    expect(trail).toContain('score: won ? clubsUsed : null, outOf: career.length,');
    expect(trail).toContain('verdict: won ? t(`footle.win${misses >= TRAIL_MAX_ATTEMPTS - 1 ? 6 : Math.min(misses + 1, 4)}`) : name,');
    expect(trail).toContain('sub: won ? `${t("trail.itWas")} ${name}` : t("rc.footleLost"),');
    expect(trail).toContain('card={trailCard}');
    // not on the stitch variant, which has its own finish
    expect(trail).toContain('const trailCard = (!done || stitch) ? null : (() => {');
    // and the old three lines are only drawn where there is no card
    expect(trail).toMatch(/\{!trailCard && <>\s*<div style=\{\{ fontSize: 13, color: "var\(--t2\)" \}\}>\{t\("trail\.itWas"\)\}<\/div>/);
  });
  it("Trail's own streak is the card's line, in words, with no emoji", () => {
    // the number says what it counts, in words, because lower is better here
    expect(trail).toContain('note: won ? [t("trail.gotIt", { count: clubsUsed }), !isArchive && !embedded && streak > 1 ? t("rc.trailStreak", { n: streak }) : null].filter(Boolean).join(" · ") : null,');
    const html = renderToStaticMarkup(React.createElement(ResultCard, { title: 'Transfer Trail', tag: 'No. 113', score: 3, outOf: 4, verdict: 'Brilliant', sub: 'It was Zinedine Zidane', note: '4-day Trail streak' }));
    expect(html).toContain('<p class="rc-note">4-day Trail streak</p>');
    expect(html).toContain('<b>3</b><span>/4</span>');
    expect(html).not.toContain('rc-kicks');   // no strip: the career above is the picture
  });
  it('Top 10: the score out of the list, short words beside it, the list title under it', () => {
    expect(top10).toContain('score: g.score, outOf: total,');
    expect(top10).toContain('sub: g.perfect ? (g.lives === TOP10_LIVES ? t("rc.t10Clean") : t("rc.t10Spare", { count: g.lives })) : list.title,');
    expect(top10).toContain('card={top10Card}');
    // the large figure and the sentence that said the score a second time are gone
    expect(top10).not.toContain('className={`t10-score');
    expect(top10).not.toContain('className="t10-verdict"');
  });
  it('the words for each Top 10 outcome', () => {
    const pick = (g) => (g.perfect ? 'All' : g.score === 0 ? 'Hard' : g.out && g.score < 5 ? 'Out' : g.score >= 8 ? 'Near' : g.score >= 6 ? 'Past' : g.score === 5 ? 'Half' : 'Tough');
    // the same ladder the screen uses, pinned so a change is deliberate
    expect(top10).toMatch(/g\.perfect \? t\("rc\.t10All"\)\s*: g\.score === 0 \? t\("rc\.t10Hard"\)\s*: g\.out && g\.score < 5 \? t\("rc\.t10Out"\)\s*: g\.score >= 8 \? t\("rc\.t10Near"\) : g\.score >= 6 \? t\("rc\.t10Past"\) : g\.score === 5 \? t\("rc\.t10Half"\) : t\("rc\.t10Tough"\)/);
    expect([pick({ perfect: true, score: 10 }), pick({ score: 0 }), pick({ out: true, score: 2 }), pick({ out: true, score: 7 }), pick({ score: 9 }), pick({ score: 5 }), pick({ score: 3 })]).toEqual(['All', 'Hard', 'Out', 'Past', 'Near', 'Half', 'Tough']);
  });
});
