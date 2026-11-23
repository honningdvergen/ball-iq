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
    expect(rule('.rc')).toContain('repeating-linear-gradient(90deg,#0E4429 0 46px,#114E2F 46px 92px)');
    expect(css).not.toMatch(/radial-gradient|::before|::after/);
  });
  it('a wrong answer is an empty ring, not a cross', () => {
    expect(rule('.rc-k i')).toContain('border:2px solid rgba(255,255,255,0.24)');
    const src = readFileSync(new URL('../../src/components/ResultCard.jsx', import.meta.url), 'utf8');
    expect(src.slice(src.indexOf('export function ResultCard'))).not.toMatch(/✓|✗|✕|<svg|lucide/);
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
  it('puts the card above the panel, the XP on the streak line, and drops the crowd row and an empty footer', async () => {
    const DailyDone = await load();
    const html = renderToStaticMarkup(React.createElement(DailyDone, { game: 'daily7', edition: 20779, won: true, bucket: 5, streak: { count: 4, label: 'daily streak' }, card }));
    expect(html.indexOf('<section class="rc"')).toBeGreaterThanOrEqual(0);
    expect(html.indexOf('<section class="rc"')).toBeLessThan(html.indexOf('<section class="dd"'));
    expect(html).toMatch(/<div class="dd-trow"><div class="dd-title">.*?<\/div><span class="dd-xp dd-num">\+50 XP<\/span><\/div>/);
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
    // Before any crowd is known the card says what the host gave it.
    expect(html).toContain('<div class="rc-v">Solid challenge.</div><div class="rc-sub">Some tough ones in there today.</div>');
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
  it('a win: the guess count out of six, the verdict, the answer pinned under it', () => {
    expect(src).toContain('score: won ? state.guesses.length : null, outOf: 6,');
    expect(src).toContain('sub: won ? t("footle.answerWas", { name: full }) : t("rc.footleLost"),');
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
    expect(src).toMatch(/\{footleCard && onReport && <div className="wd-report-row"><FootleReportButton/);
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
