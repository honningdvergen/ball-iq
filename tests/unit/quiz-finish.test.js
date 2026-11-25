// The ordinary quiz's finish, on the result card (25 Nov 2026).
//
// Classic, Speed, Legends, Chaos, a club or league quiz and Survival ended on the old layout: "Final
// score" over an 88px number, an outlined rating box with a spaced BALL IQ label, a solid green
// button, two outlined ghost buttons and an underlined exit. Alex wants the whole app on one kit. Of
// the drawn rounds he chose variant B ("B but even better i think"), corrected it six times, and
// said "Yeah go ahead". These pin what was agreed, and the states the drawings did not show.
//
// The phone layout is everything before .rd-desktop: the wide-screen card after it is not part of
// this change.
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ResultCard } from '../../src/components/ResultCard.jsx';
import en from '../../src/i18n/en.js';
import enHome from '../../src/i18n/en.home.js';
import es from '../../src/i18n/es.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const rule = (css, sel) => { const i = css.indexOf(`${sel}{`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const el = React.createElement;

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
const load = async (store) => { vi.resetModules(); vi.stubGlobal('localStorage', mem(store)); return (await import('../../src/screens/ResultsScreen.jsx')).Results; };

// The dailies still open, in the order the app lists them (Footle, the Daily 7, Transfer Trail, Top 10).
const OPEN = {
  footle: { key: 'footle', name: "Today's Footle", short: 'Footle', onTap() {} },
  daily7: { key: 'daily7', name: "Today's Daily 7", short: 'Daily 7', onTap() {} },
  trail: { key: 'trail', name: "Today's Transfer Trail", short: 'Transfer Trail', onTap() {} },
  top10: { key: 'top10', name: "Today's Top 10", short: 'Top 10', onTap() {} },
};
const services = (keys) => ({ streak: { count: 3, label: 'daily streak' }, nextUp: keys.map((k) => OPEN[k]), day: { keys: ['footle', 'daily7', 'trail', 'top10'] }, track() {} });
const WRONG = [
  { id: 'q1', q: 'AC Milan and Inter Milan share which famous stadium?', user: 'Stadio Olimpico', correct: 'San Siro' },
  { id: 'q2', q: 'Who scored the 2014 World Cup final winner?', user: null, correct: 'Götze' },
];
// Right and wrong in a mixed order: the marks are in question order.
const MISS7 = [2, 6, 8];
const answers = (total, miss) => Array.from({ length: total }, (_, i) => ({ isCorrect: !miss.includes(i), diff: 'medium' }));
const props = (extra = {}) => ({ mode: 'classic', onHome() {}, onRetry() {}, onShare() {}, onPlayFootle() {}, onPlayDaily() {}, onReport() {},
  dailyDone: services(['footle', 'daily7', 'trail', 'top10']), dailyOpen: true,
  result: { score: 7, total: 10, bestStreak: 2, allAnswers: answers(10, MISS7) }, wrongAnswers: WRONG, ...extra });
const phone = (html) => { const i = html.indexOf('<div class="rd-desktop">'); expect(i).toBeGreaterThan(0); return html.slice(0, i); };
const render = async (extra, store) => phone(renderToStaticMarkup(el(await load(store), props(extra))));

describe('the score is on the result card', () => {
  it('the card names the game once: "Quiz" on its top line, with the site; the back arrow above it stands alone', async () => {
    const html = await render();
    expect(html).toMatch(/<div class="rd-mobile"><div class="dd-hd"><button type="button" class="back-btn" aria-label="Back to Home">←<\/button><\/div><section class="rc" aria-label="Quiz: 7 out of 10"><div class="rc-eye"><span>Quiz<\/span><span class="rc-site">balliq\.app<\/span><\/div>/);
    // no second title beside the arrow, and none of the old header
    expect(html).not.toMatch(/dd-hd-t|dd-stk|ds-eyebrow|Final score|position:absolute;top:8px/);
    expect((html.match(/class="rc"/g) || []).length).toBe(1);
  });
  it('the number, the verdict and the XP in yellow under it, standing against the foot of the number', async () => {
    const html = await render();
    expect(html).toMatch(/<div class="rc-hero is-foot"><div class="rc-num"><b>.*?<\/b><span>\/10<\/span><\/div><div class="rc-say"><div class="rc-v">Strong showing\.<\/div><div class="rc-xp">\+\d+ XP<\/div><\/div><\/div>/);
    expect(html).not.toMatch(/font-size:88px|XP earned/);
  });
  it('ten marks in question order, in the Daily 7 colours, sharing the row', async () => {
    const html = await render();
    const strip = html.slice(html.indexOf('<div class="rc-kicks'), html.indexOf('</div>', html.indexOf('<div class="rc-kicks')));
    expect(strip).toContain('<div class="rc-kicks is-many" role="img" aria-label="7 of 10 right">');
    const marks = strip.split('<span class="rc-k').slice(1).map((m) => m.startsWith(' is-in'));
    expect(marks).toEqual([true, true, false, true, true, true, false, true, false, true]);
    expect(strip).not.toMatch(/is-star|<em>/);                              // no rings and no labels on ten marks
    const css = read('src/components/resultCard.css');
    expect(rule(css, '.rc-kicks.is-many')).toBe('.rc-kicks.is-many{gap:4px;');
    expect(rule(css, '.rc-kicks.is-many .rc-k')).toBe('.rc-kicks.is-many .rc-k{flex:1 1 0;width:auto;max-width:26px;');
    expect(rule(css, '.rc-kicks.is-many .rc-k i')).toBe('.rc-kicks.is-many .rc-k i{width:100%;height:auto;aspect-ratio:1;');
    // the colours are the card's own: green for right, the deeper red for wrong
    expect(rule(css, '.rc-k.is-in i')).toContain('background:#58CC02');
    expect(rule(css, '.rc-k i')).toContain('background:#C23B33');
    // and the Daily 7's seven keep their fixed size
    const seven = renderToStaticMarkup(el(ResultCard, { title: 'Daily 7', score: 5, outOf: 7, verdict: 'x', marks: [true, true, true, true, true, false, false] }));
    expect(seven).not.toContain('is-many');
  });
  it('ONE quiet Share button on the card: "Share my 7/10"; at 30 percent or under, "Share my result"', async () => {
    const html = await render();
    expect(html).toMatch(/<button type="button" class="rc-act"><svg[^>]*class="lucide lucide-share"[^>]*>.*?<\/svg>Share my 7\/10<\/button><\/section>/);
    expect((html.match(/class="rc-act"/g) || []).length).toBe(1);
    expect(html).not.toContain('Share score');
    const low = await render({ result: { score: 3, total: 10, allAnswers: answers(10, [1, 2, 4, 5, 7, 8, 9]) } });
    expect(low).toContain('<div class="rc-v">Tough round.</div>');
    expect(low).toMatch(/<\/svg>Share my result<\/button>/);
    const four = await render({ result: { score: 4, total: 10, allAnswers: answers(10, [1, 2, 4, 5, 7, 8]) } });
    expect(four).toMatch(/<\/svg>Share my 4\/10<\/button>/);
    // it shares exactly what Share shared: the host's own handler, nothing new
    const src = read('src/screens/ResultsScreen.jsx');
    expect(src).toContain('<button type="button" className="rc-act" onClick={onShare}>');
    expect(read('src/App.jsx')).toContain(': shareScore(result?.score, result?.total, mode, { streak: result?.bestStreak, club: activeClub, league: activeLeague }))}');
  });
  it('a personal best and the best run are the line under the marks, the best in gold', async () => {
    const html = await render({ classicBest: 5, result: { score: 7, total: 10, bestStreak: 4, allAnswers: answers(10, MISS7) } });
    expect(html).toContain('<p class="rc-note"><strong>Personal best — was 5</strong> · Best run 4 in a row</p>');
    expect(rule(read('src/components/resultCard.css'), '.rc-note strong')).toContain('color:#FFD34D');
    // neither: no line
    expect(await render({ classicBest: 9 })).not.toContain('rc-note');
  });
  it('a club or league quiz says whose it was on the top line, with its own badge', async () => {
    const html = await render({ mode: 'speed', label: 'Liverpool', badge: { abbr: 'LIV', color: '#C8102E', fg: '#FFFFFF' } });
    expect(html).toContain('<div class="rc-eye"><span><span class="rc-badge" aria-hidden="true" style="background:#C8102E;color:#FFFFFF;-webkit-text-fill-color:#FFFFFF">LIV</span>Quiz · Liverpool</span><span class="rc-site">balliq.app</span></div>');
    expect(html).toContain('aria-label="Quiz: 7 out of 10"');
    // Legends and Chaos keep their own names
    expect(await render({ mode: 'legends' })).toContain('<div class="rc-eye"><span>Legends</span>');
    expect(await render({ mode: 'chaos' })).toContain('<div class="rc-eye"><span>Chaos</span>');
  });
  it('a result with no answers on hand draws no marks (never ten red ones for a 5)', async () => {
    const html = await render({ result: { score: 5, total: 10 } });
    expect(html).not.toContain('rc-kicks');
    expect(html).toContain('Share my 5/10');
  });
});

describe('under the card: one caption line', () => {
  const css = read('src/app.css');
  it('the rating strip has no outline and no spaced BALL IQ label', async () => {
    const html = await render({ cardDelta: { ratedAfter: true, ratedBefore: false, after: 65, faces: [] } });
    expect(html).toMatch(/<\/section><section class="dd-one"><div class="results-card-delta" role="status"><span class="rd-body">Rated <span class="rd-num" style="color:var\(--grn-soft\)">65<\/span> — your card is live<\/span><\/div>/);
    expect(html).not.toContain('rd-label');
    const box = rule(css, '.results-card-delta');
    expect(box).not.toMatch(/border|background|padding|max-width/);
    for (const s of ['margin:22px 6px 10px', 'font-size:13.5px', 'font-weight:600', 'color:var(--t2)', 'font-variant-numeric:tabular-nums']) expect(box, s).toContain(s);
    expect(css).not.toContain('.rd-label');
    expect(css).not.toMatch(/letter-spacing:0\.12em;text-transform:uppercase;color:var\(--t3\);flex-shrink:0/);
  });
  it('answers left to be rated', async () => {
    const one = await render({ cardDelta: { ratedAfter: false, toRated: 1 } });
    expect(text(one)).toContain('1 more answer to get rated');
    const three = await render({ cardDelta: { ratedAfter: false, toRated: 3 } });
    expect(text(three)).toContain('3 more answers to get rated');
  });
  it('a rating that moved: "Ball IQ" in plain words, the numbers, then the faces that moved on the same line', async () => {
    const html = await render({ cardDelta: { ratedAfter: true, ratedBefore: true, before: 58, after: 62, faces: [{ abbr: 'EPL', color: '#3D195B', before: 56, after: 68 }, { abbr: 'UCL', color: '#0E1E5B', before: 60, after: 61 }, { abbr: 'WC', color: '#111', before: 1, after: 2 }] } });
    const line = html.slice(html.indexOf('<div class="results-card-delta"'), html.indexOf('</div>', html.indexOf('<div class="results-card-delta"')) + 6);
    expect(line).toContain('aria-label="Ball IQ 58 to 62"');
    expect(text(line)).toBe('Ball IQ 58 → 62 EPL 56 → 68 UCL 60 → 61');           // two faces at most, as before
    expect(line).toContain('<span class="rd-name">Ball IQ</span>');
    expect(line).not.toMatch(/rd-faces|border-top/);
    // a rating that held is printed once, never "58 → 58"
    const held = await render({ cardDelta: { ratedAfter: true, ratedBefore: true, before: 58, after: 58, faces: [] } });
    expect(text(held.slice(held.indexOf('results-card-delta') - 12, held.indexOf('dd-list')))).toContain('Ball IQ 58');
    expect(held).not.toContain('58 <span aria-hidden="true">→</span> 58');
  });
  it('no rating to speak of: no line, and the list keeps the caption\'s distance from the card', async () => {
    const html = await render();
    expect(html).not.toContain('results-card-delta');
    expect(html).toContain('<section class="dd-one"><div class="dd-list rs-list">');
    expect(read('src/components/dailyDone.css')).toContain('.dd-one > .dd-list:first-child{margin-top:22px;}');
  });
});

describe('then one filled list: the most played daily not played today, then Play again', () => {
  const rows = (html) => html.slice(html.indexOf('<div class="dd-list rs-list">'), html.indexOf('</section>', html.indexOf('<div class="dd-list rs-list">'))).split('<button').slice(1).map((r) => text('<button' + r));
  it('the order is by real play counts: Transfer Trail, Top 10, Footle, the Daily 7', async () => {
    expect(rows(await render())).toEqual(["Today's Transfer Trail Whose career? Play", 'Play again 10 more questions Play']);
    expect(rows(await render({ dailyDone: services(['footle', 'daily7', 'top10']) }))[0]).toBe("Today's Top 10 Name all ten Play");
    expect(rows(await render({ dailyDone: services(['footle', 'daily7']) }))[0]).toBe("F Today's Footle Six guesses Play");
    expect(rows(await render({ dailyDone: services(['daily7']) }))[0]).toBe("Today's Daily 7 7 questions Play");
    expect(read('src/screens/ResultsScreen.jsx')).toContain('const DAILY_ORDER = ["trail", "top10", "footle", "daily7", "mystery", "ballpark"];');
  });
  it('all four played: "Play again" alone', async () => {
    expect(rows(await render({ dailyDone: services([]), dailyOpen: false }))).toEqual(['Play again 10 more questions Play']);
  });
  it('a daily already started says Continue', async () => {
    const s = services(['footle']); s.nextUp[0] = { ...s.nextUp[0], name: "Continue today's Footle", open: true };
    expect(rows(await render({ dailyDone: s, dailyOpen: false }))[0]).toBe("F Continue today's Footle Six guesses Continue");
  });
  it('the daily\'s Play is the soft pill in that game\'s colour; Play again is quiet; nothing under the card is solid green', async () => {
    const html = await render();
    expect(html).toMatch(/<button type="button" class="dd-li" style="--dd-rgb:[\d,]+;--dd-c:#7CC3F0">/);                // Transfer Trail's own colour
    expect(html).toMatch(/<button type="button" class="dd-li is-quiet"><span class="dd-li-ic" aria-hidden="true"><svg[^>]*class="lucide lucide-rotate-ccw"/);
    const dd = read('src/components/dailyDone.css');
    expect(rule(dd, '.dd-li.is-quiet .dd-li-go')).toContain('background:var(--s2);box-shadow:none;color:var(--t1)');
    expect(rule(dd, '.dd-li-go')).toContain('background:rgba(var(--dd-rgb,88,204,2),0.16)');
    const under = html.slice(html.indexOf('</section>'));
    expect(under).not.toMatch(/btn-3d|results-actions|results-row|results-exit|class="dd-share"/);
  });
  it('the two dailies this screen has always opened keep their handlers; the others use the app\'s own', () => {
    const src = read('src/screens/ResultsScreen.jsx');
    expect(src).toContain('modeOf(nextDaily.key) === "daily7" && onPlayDaily ? onPlayDaily');
    expect(src).toContain('modeOf(nextDaily.key) === "footle" && onPlayFootle ? onPlayFootle');
    expect(src).toContain(': nextDaily.onTap;');
    expect(src).toContain('<button key="again" type="button" className="dd-li is-quiet" onClick={onRetry}>');
  });
  it('a host with no daily services gets the two dailies this screen can see for itself', async () => {
    const html = await render({ dailyDone: undefined, dailyOpen: true });
    expect(rows(html)).toEqual(["F Today's Footle Six guesses Play", 'Play again 10 more questions Play']);
    const footleDone = await render({ dailyDone: undefined, dailyOpen: true }, { [`biq_wordle_${(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}`]: JSON.stringify({ guesses: ['KANE'], status: 'won' }) });
    expect(rows(footleDone)[0]).toBe("Today's Daily 7 7 questions Play");
  });
  it('the smallest phones: the wells and the pills step down in this list only', () => {
    expect(read('src/components/dailyDone.css')).toContain('@media (max-width: 359px){.rs-list{padding:4px 12px;}.rs-list .dd-li{gap:10px;}.rs-list .dd-li-ic{width:38px;height:38px;border-radius:11px;}.rs-list .dd-li-go{padding:0 14px;}}');
  });
});

describe('the way out and the missed questions', () => {
  it('"Back to Home" is the small filled pill, then the missed list as cards with no outline round it, then the pill again', async () => {
    const html = await render();
    const PILL = '<div style="margin-top:18px;display:flex;justify-content:center"><button type="button" style="height:40px;padding:0 22px;border-radius:999px;border:0;background:var(--s2);color:var(--t1);-webkit-text-fill-color:var(--t1);font-weight:700;font-size:14px;line-height:1;font-family:inherit;cursor:pointer">Back to Home</button></div>';
    expect(html.split(PILL).length).toBe(3);
    const at = (x) => { const i = html.indexOf(x); expect(i, x).toBeGreaterThan(-1); return i; };
    expect(at('class="dd-list rs-list"')).toBeLessThan(html.indexOf(PILL));
    expect(html.indexOf(PILL)).toBeLessThan(at('class="wr-head"'));
    expect(html.lastIndexOf(PILL)).toBeGreaterThan(at('class="wm-list"'));
    expect(html.endsWith(PILL + '</div>')).toBe(true);
    expect(text(html)).toContain('2 you missed');
    expect(html).toContain('class="wm-card"');
    expect(html).not.toContain('class="wrong-review"');
    const wm = read('src/app.css');
    expect(rule(wm, '.wm-list')).not.toMatch(/border|outline/);
    expect(rule(wm, '.wm-card')).not.toMatch(/border:|outline/);
    // nothing missed: one pill, and it is the last thing
    const all = await render({ result: { score: 10, total: 10, bestStreak: 10, allAnswers: answers(10, []) }, wrongAnswers: [] });
    expect((all.match(/>Back to Home<\/button>/g) || []).length).toBe(1);
    expect(all).not.toContain('wr-head');
  });
  it('the profile-picture nudge comes after the list, with the other quiet asks', async () => {
    const html = await render({ photoNudge: el('i', { id: 'nudge' }) });
    expect(html.indexOf('class="dd-list rs-list"')).toBeLessThan(html.indexOf('<i id="nudge">'));
    expect(html.indexOf('<i id="nudge">')).toBeLessThan(html.indexOf('>Back to Home</button>'));
  });
  it('a winner (pass-and-play) keeps its line, under the card', async () => {
    const html = await render({ mode: 'speed', result: { score: 4, total: 10, winner: 'Alex' } });
    expect(html.indexOf('</section>')).toBeLessThan(html.indexOf('Alex wins!'));
    expect(html.indexOf('Alex wins!')).toBeLessThan(html.indexOf('class="dd-list rs-list"'));
  });
});

describe('Survival uses the same screen with other words', () => {
  const surv = (score, extra = {}) => render({ mode: 'survival', result: { score, total: score + 1, bestStreak: score }, survivalBest: 0, wrongAnswers: WRONG.slice(1), ...extra });
  it('a run has no denominator and no marks: the number, then "in a row", then the XP', async () => {
    const html = await surv(12);
    expect(html).toContain('<section class="rc" aria-label="Survival: 12"><div class="rc-eye"><span>Survival</span>');
    expect(html).toMatch(/<div class="rc-num"><b>.*?<\/b><\/div><div class="rc-say"><div class="rc-v">in a row<\/div><div class="rc-xp">\+\d+ XP<\/div>/);
    expect(html).not.toMatch(/<span>\/13<\/span>|rc-kicks/);
    expect(html).toMatch(/<\/svg>Share my result<\/button>/);
  });
  it('a new best is the gold line', async () => {
    expect(await surv(12, { survivalBest: 8 })).toContain('<p class="rc-note"><strong>Personal best — was 8</strong></p>');
    expect(await surv(2)).not.toContain('rc-note');                         // under three is not a best worth a line
  });
  it('the list says "Go again" and the rule of the run', async () => {
    const html = await surv(4);
    expect(text(html)).toContain('Go again One miss ends the run Play');
    expect(html.indexOf('Transfer Trail')).toBeGreaterThan(-1);
    expect(html.indexOf('Transfer Trail')).toBeLessThan(html.indexOf('Go again'));
  });
  it('out on the first question: "Run over", no "+0 XP", the kind line, and Go again FIRST', async () => {
    const html = await surv(0);
    expect(html).toContain('<div class="rc-v">Run over</div>');
    expect(html).not.toContain('rc-xp');
    expect(html).toContain('<p class="rc-note">One wrong answer ends a run. The next one starts clean.</p>');
    expect(html.indexOf('Go again')).toBeGreaterThan(-1);
    expect(html.indexOf('Go again')).toBeLessThan(html.indexOf('Transfer Trail'));
    expect(html).not.toContain('is-foot');
  });
});

describe('the card\'s three new switches are off unless a host asks', () => {
  const base = { title: 'Quiz', score: 7, outOf: 10, verdict: 'Strong showing.' };
  it('outOf null: no "/N", and the card is still named to a screen reader', () => {
    const html = renderToStaticMarkup(el(ResultCard, { ...base, title: 'Survival', outOf: null, score: 12 }));
    expect(html).toContain('aria-label="Survival: 12"');
    expect(html).toContain('<div class="rc-num"><b>12</b></div>');
  });
  it('a badge sits before the name on the top line; without one the line is as it was', () => {
    expect(renderToStaticMarkup(el(ResultCard, base))).toContain('<div class="rc-eye"><span>Quiz</span><span class="rc-site">balliq.app</span></div>');
    expect(renderToStaticMarkup(el(ResultCard, { ...base, tag: 'Arsenal', badge: el('i', { id: 'b' }) }))).toContain('<div class="rc-eye"><span><i id="b"></i>Quiz · Arsenal</span>');
  });
  it('seven marks or fewer keep their fixed size', () => {
    expect(renderToStaticMarkup(el(ResultCard, { ...base, marks: Array(7).fill(true) }))).not.toContain('is-many');
    expect(renderToStaticMarkup(el(ResultCard, { ...base, marks: Array(8).fill(true) }))).toContain('class="rc-kicks is-many"');
  });
});

describe('the words', () => {
  it('the one new line is in both tables', () => {
    expect(en['rs.againSub']).toBe('{n} more questions');
    expect(es['rs.againSub']).toBe('Otras {n} preguntas');
  });
  it('the first-score toast (and the personal-best one, the same call) opens with no system emoji', () => {
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const k of ['ts.firstScore', 'ts.pb']) {
      expect(en[k], k).not.toMatch(EMOJI);
      expect(es[k], k).not.toMatch(EMOJI);
      expect(enHome[k], k).toBe(en[k]);
    }
    expect(en['ts.firstScore']).toBe('First score: {n}/10!');
    expect(en['ts.pb']).toBe('New personal best: {n}/10!');
    expect(read('src/App.jsx')).toContain('showToast(tl(isFirst ? "ts.firstScore" : "ts.pb", { n: res.score })), 1400)');
  });
  it('Spanish has every line this screen shows', () => {
    for (const k of ['home.quiz.title', 'home.mode.survival', 'quiz.mode.legends', 'quiz.mode.chaos', 'rs.inARow', 'rs.runOver', 'rs.survZero', 'rs.pb', 'rs.was', 'rs.bestRun', 'rs.playAgain', 'rs.goAgain', 'quiz.survRule', 'rs.againSub', 'dd.shareMy', 'dd.shareMine', 'dd.today', 'dd.contToday', 'common.play', 'home.row.continue', 'quiz.backHome', 'rs.ratedLive', 'rs.toRated_one', 'rs.toRated_other', 'tag.0', 'tag.2', 'tag.4']) {
      expect(typeof en[k], k).toBe('string'); expect(typeof es[k], k).toBe('string');
      for (const ph of en[k].match(/\{\w+\}/g) || []) expect(es[k], `${k} keeps ${ph}`).toContain(ph);
    }
  });
});

describe('what was left alone', () => {
  it('the wide-screen card is as it was', async () => {
    const R = await load();
    const html = renderToStaticMarkup(el(R, props({ cardDelta: { ratedAfter: true, ratedBefore: false, after: 65, faces: [] } })));
    const wide = html.slice(html.indexOf('<div class="rd-desktop">'));
    expect(wide).toContain('<div class="rd-eyebrow">Round complete</div>');
    expect(wide).toContain('class="rd-btn rd-btn-ghost"');
    expect(wide).not.toMatch(/class="rc"|dd-list|results-card-delta/);
  });
  it('Hot Streak and True or False do not use this screen', () => {
    expect(read('src/App.jsx')).toContain('{screen === "results" && result && mode !== "hotstreak" && mode !== "truefalse" && (');
    expect(read('src/screens/ModeResults.jsx')).not.toMatch(/ResultCard|rs-list/);
  });
  it('no analytics event was renamed, removed or added on this screen', () => {
    const src = read('src/screens/ResultsScreen.jsx');
    expect(src).not.toMatch(/loopEvent|track\?\.\(|bumpUsage/);
  });
});
