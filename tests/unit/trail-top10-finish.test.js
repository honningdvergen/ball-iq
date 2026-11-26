// Transfer Trail and Top 10 finish on the layout Footle and the Daily 7 ended on (25 Nov 2026).
//
// Until now both ended on the old one: the board above, a second green card saying the result
// again, a big outlined panel with a streak box, a solid green share button, a framed "Next up",
// outlined chips and a full-width outlined "Back to Home". Alex wants the whole app on one kit and,
// shown both finishes drawn in the new layout, said "Yes, both". Only the picture on the card is
// new: Transfer Trail's clubs as rows, Top 10's ten in ONE column. Everything else is the finish
// Footle has (components/DailyDone.jsx, layout "one"), which tests/unit/footle-finish.test.js pins.
//
// The drawings show a win at 393 wide. The states they do not show are here too: a loss, a perfect
// ten, one of ten, a hint used, an old puzzle, a list from the library, the static page, a
// Stitch-up, a waiting challenge.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';

const S = vi.hoisted(() => ({ top10: null }));
// Top 10 loads its lists with an import() in an effect, which a static render never runs: its one
// `useState({ data: null, failed: false })` is handed the test's data instead (as i18n-games.test.js does).
vi.mock('react', async (orig) => {
  const R = await orig();
  const isTop10Init = (v) => v && typeof v === 'object' && !Array.isArray(v) && v.data === null && v.failed === false && Object.keys(v).length === 2;
  const useState = (init) => R.useState(isTop10Init(init) ? { data: S.top10, failed: false } : init);
  return { ...R, default: { ...R.default, useState }, useState };
});

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const TransferTrail = (await import('../../src/screens/TransferTrail.jsx')).default;
const Top10 = (await import('../../src/screens/Top10.jsx')).default;
const { dateToYMD } = await import('../../src/lib/date.js');
const { getTop10Number } = await import('../../src/lib/top10.js');
const { getTrailNumber } = await import('../../src/lib/trail.js');
const { getTrailXP, getTop10XP } = await import('../../src/lib/dailyXp.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const rule = (css, sel) => { const i = css.indexOf(`${sel}{`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const el = React.createElement;
const noop = () => {};

const NOW = new Date();
const YESTERDAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1, 12);
let store;
beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } });
});
afterEach(() => { vi.unstubAllGlobals(); });

// What the app hands a finished daily: it pays XP, and it has the one streak, the day and the other dailies.
const APP = (extra = {}) => ({
  paysXp: true,
  dailyDone: {
    streak: { count: 4, label: 'daily streak', keepsOnLoss: true },
    day: { keys: ['footle', 'daily7', 'trail', 'top10'] },
    nextUp: [{ key: 'footle', name: "Today's Footle", short: 'Footle', onTap: noop }, { key: 'daily7', name: "Today's Daily 7", short: 'Daily 7', onTap: noop }],
    ...extra,
  },
});

// ── Transfer Trail ───────────────────────────────────────────────────────────
const ZIDANE = { key: 'test-zidane', display: ['Zinedine', 'Zidane'], clubs: ['Cannes', 'Bordeaux', 'Juventus', 'Real Madrid'] };
const guess = (t) => ({ text: t, skipped: false });
const skip = { text: '', skipped: true };
const trailDay = (date, rec) => store.set(`biq_trail_${dateToYMD(date)}`, JSON.stringify(rec));
const trail = (props = {}) => renderToStaticMarkup(el(TransferTrail, { player: ZIDANE, date: NOW, onBack: noop, onReport: noop, services: APP(), ...props }));
const WON_ON_3 = { status: 'won', attempts: [guess('Thierry Henry'), guess('Zinedine Zidane')] };
const LOST = { status: 'lost', attempts: [skip, skip, skip, skip, skip] };

describe('Transfer Trail: the career is on the card', () => {
  it('a win: the club count, the win word and the XP; no ladder above the card, no second card', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    expect(html).not.toContain('tt-club');                                  // the ladder is not drawn
    expect((html.match(/<section class="rc/g) || []).length).toBe(1);
    expect(html).toContain('<section class="rc is-bare" aria-label="Transfer Trail: 3 out of 4">');   // the header names the game
    expect(html).toContain('<div class="rc-hero is-foot"><div class="rc-num"><b>3</b><span>/4</span></div>');
    expect(html).toContain('<div class="rc-v">World class</div><div class="rc-xp">+40 XP</div>');
    expect(html).not.toContain('rc-eye');
  });
  it('every club is a row: the one he was got on is green, the ones never needed are dimmed', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    const rows = html.slice(html.indexOf('<ol class="rc-clubs">'), html.indexOf('</ol>')).split('<li').slice(1);
    expect(rows.length).toBe(4);
    expect(rows[0]).toMatch(/^><i aria-hidden="true"[^>]*>[A-Z]{2,4}<\/i><b>Cannes<\/b><\/li>$/);
    expect(rows[1]).toMatch(/^><i aria-hidden="true"[^>]*>[A-Z]{2,4}<\/i><b>Bordeaux<\/b><\/li>$/);
    expect(rows[2]).toMatch(/^ class="is-got"><i aria-hidden="true"[^>]*>JUV<\/i><b>Juventus<\/b><em>Got him here<\/em><\/li>$/);
    expect(rows[3]).toMatch(/^ class="is-off"><i aria-hidden="true"[^>]*>RMA<\/i><b>Real Madrid<\/b><em>Not needed<\/em><\/li>/);
    // the badge is the app's own: the club's paint from lib/clubColour.js, as on the ladder
    expect(rows[2]).toMatch(/style="background:#[0-9A-Fa-f]{3,6};color:#[0-9A-Fa-f]{3,6};-webkit-text-fill-color:#[0-9A-Fa-f]{3,6}"/);
    const src = read('src/screens/TransferTrail.jsx');
    expect(src).toContain('const col = clubColour(club, CLUB_PACK_COLOURS);');
    expect(src).toContain('const paint = col ? crestPaint(col) : null;');
    expect(src).toContain('{clubAbbr(club, CLUB_PACK_ABBR)}');
  });
  it('then "It was <Player>" as one quiet line, and ONE quiet Share button that says "Share my result"', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    expect(html).toMatch(/<\/ol><\/div><p class="rc-note">It was Zinedine Zidane<\/p><button type="button" class="rc-act"><svg[^>]*class="lucide lucide-share"[^>]*>.*?<\/svg>Share my result<\/button><\/section>/);
    // "3/4" counts clubs and fewer is better: it is not printed on the button
    expect(html).not.toContain('Share my 3/4');
    expect(read('src/screens/TransferTrail.jsx')).toContain('plainShare: true,');
    // and nothing under the card is the old panel
    expect(html).not.toMatch(/<section class="dd"|dd-share"|dd-up|dd-chip|dd-well/);
    expect(html).toContain('<section class="dd-one"');
  });
  it('the header carries the streak as a chip, where the guesses left sat during play', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    const head = html.slice(0, html.indexOf('<section class="rc'));
    expect(head).toContain('>Transfer Trail</span>');
    expect(head).toContain(`>No. ${getTrailNumber(NOW)}</span>`);
    expect(head).toContain('>Solved<');
    expect(head).toMatch(/<span class="dd-stk-slot has-floor" style="--stk-min:48px;--stk-min-sh:56px"><span class="dd-stk" title="4-day daily streak">/);
    expect(head).not.toContain('guesses left');
    // while playing the corner is the guesses left, and there is no chip
    store.clear();
    const playing = trail();
    expect(playing).not.toContain('dd-stk');
    expect(playing).toContain('5 guesses left');
    expect(playing).toContain('tt-club');
  });
  it('the caption and the other dailies as one list, each with the soft Play', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    expect(html).toContain('<span class="dd-cap-day"><b>Today</b> 2 of 4</span>');
    expect((html.match(/class="dd-li-go">Play</g) || []).length).toBe(2);
    expect(text(html)).toContain("Today's Footle Six guesses Play");
  });
  it('the foot: Back to Home as the quiet filled pill, then "Career looks wrong? Tell us"', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail();
    const at = (x) => { const i = html.indexOf(x); expect(i, x).toBeGreaterThan(-1); return i; };
    expect(at('</section>')).toBeLessThan(at('border-radius:999px;border:0;background:var(--s2)'));
    expect(at('>Back to Home</button>')).toBeLessThan(at('Career looks wrong? Tell us'));
    expect(html).not.toContain('width:100%;min-height:46px');              // not the outlined bar
    expect(html).not.toContain('1px solid var(--border)');
  });
  it('a loss: the name is the headline, "Out of guesses" and the XP under it, every club plain', () => {
    trailDay(NOW, LOST);
    const html = trail();
    expect(html).toContain('<section class="rc is-bare" aria-label="Transfer Trail">');
    expect(html).toContain('<div class="rc-hero is-name"><div class="rc-say"><div class="rc-v">Zinedine Zidane</div><div class="rc-sub">Out of guesses</div><div class="rc-xp">+10 XP</div></div></div>');
    expect(html).not.toContain('rc-num');
    expect((html.match(/<li>/g) || []).length).toBe(4);
    expect(html).not.toMatch(/is-got|is-off|Got him here|Not needed|rc-note/);
    expect(html).toContain('>Not this time<');
    expect(html).toContain('Share my result');
    // a lost puzzle keeps the app's streak: the caption says so
    expect(text(html)).toMatch(/Streak safe/);
  });
  it('got on the first two clubs: the second is green and the rest were not needed', () => {
    trailDay(NOW, { status: 'won', attempts: [guess('Zidane')] });
    const html = trail();
    expect(html).toContain('<b>2</b><span>/4</span>');
    expect(html).toMatch(/<li><i[^>]*>[A-Z]+<\/i><b>Cannes<\/b><\/li><li class="is-got"><i[^>]*>[A-Z]+<\/i><b>Bordeaux<\/b><em>Got him here<\/em><\/li><li class="is-off">/);
    expect((html.match(/class="is-off"/g) || []).length).toBe(2);
  });
  it('a loan and a second spell are still said, on the card', () => {
    const ALONSO = { key: 'test-alonso', display: ['Xabi', 'Alonso'], clubs: ['Real Sociedad', 'Eibar', 'Real Sociedad', 'Liverpool'], loans: { 1: true } };
    trailDay(NOW, { status: 'won', attempts: [guess('Xabi Alonso')] });
    const html = trail({ player: ALONSO });
    expect(html).toMatch(/<b>Eibar<\/b><small class="is-loan">loan<\/small><em>Got him here<\/em>/);
    expect(html).toMatch(/<b>Real Sociedad<\/b><small>↩ return<\/small><em>Not needed<\/em>/);
  });
  it('an old Trail pays nothing, so its card claims none, and it says it does not count', () => {
    trailDay(YESTERDAY, { ...WON_ON_3, arc: 1 });
    const html = trail({ date: YESTERDAY });
    expect(html).not.toContain('rc-xp');
    expect(html).toContain('<div class="rc-hero"><div class="rc-num"><b>3</b><span>/4</span></div>');   // no XP, so the hero is not footed
    expect(html).toContain('It was Zinedine Zidane');
    expect(text(html)).toContain('An old puzzle');
    expect(html).not.toContain('dd-list');
  });
  it('the static page pays no XP and has the Trail\'s own streak; with nowhere to go back to there is no pill', () => {
    trailDay(NOW, WON_ON_3);
    const html = trail({ embedded: true, onBack: undefined, services: { dailyDone: { nextUp: [{ key: 'footle', name: "Today's Footle", href: '/football-wordle/' }], stitch: noop } } });
    expect(html).not.toContain('rc-xp');
    expect(html).toMatch(/<b style="color:var\(--t1\);font-weight:800">Trail #\d+<\/b> · Solved<\/div><span class="dd-stk-slot has-floor" style="--stk-min:48px;--stk-min-sh:56px"><span class="dd-stk" title="Day 1 of a Trail streak">/);
    expect(html).toContain('<ol class="rc-clubs">');
    expect(html).toContain('<a class="dd-li"');
    expect(html).not.toContain('Back to Home');
    expect(html).toContain('Career looks wrong? Tell us');
    // "Stitch up a mate" (web only) keeps its quiet link under the list
    expect(html).toMatch(/<button type="button" class="dd-share-alt">Stitch up a mate<\/button>/);
    expect(read('src/games/dailyServices.js')).toMatch(/paysXp: false,/);
  });
  it('a mate sent the puzzle: the head-to-head sits under the card, and the card\'s one button sends it back', () => {
    trailDay(NOW, WON_ON_3);
    store.set('biq_game_challenge', JSON.stringify({ game: 'trail', edition: getTrailNumber(NOW), score: 4, name: 'Jo', at: Date.now() }));
    const html = trail();
    expect(html).toMatch(/<\/section><section class="dd-one"[^>]*><div class="dd-g dd-vs"[^>]*><div class="dd-h2h is-win" role="status">/);
    expect(text(html)).toContain('You beat Jo');
    expect((html.match(/class="rc-act"/g) || []).length).toBe(1);
    expect(html).not.toContain('dd-share"');
    // the one tap is the one message with the puzzle's link, for a waiting challenge too
    const dd = read('src/components/DailyDone.jsx');
    expect(dd).toContain('const shareTap = canChallenge ? doChallenge : doShare;');
    expect(dd).toContain('track?.("dd-challenge", { game, rival: !!rival });');
  });
  it('a Stitch-up is not a daily: it keeps its ladder and its own finish, and draws no card', () => {
    const html = trail({ stitch: { opening: 2, load: () => WON_ON_3, save: noop, Done: () => el('i', { id: 'stitch-done' }) } });
    expect(html).toContain('tt-club');
    expect(html).toContain('<i id="stitch-done"></i>');
    expect(html).not.toMatch(/class="rc|dd-one|dd-stk/);
    expect(html).toContain('>It was</div>');
  });
});

// ── Top 10 ───────────────────────────────────────────────────────────────────
const NAMES = ['Wesley Sneijder', 'Edwin van der Sar', 'Frank de Boer', 'Memphis Depay', 'Rafael van der Vaart', 'Daley Blind', 'Giovanni van Bronckhorst', 'Dirk Kuyt', 'Robin van Persie', 'Phillip Cocu'];
const CAPS = [134, 130, 112, 112, 109, 108, 106, 104, 102, 101];
const LIST = {
  id: 't-caps', kind: 'player', title: 'Most Netherlands caps (men)', asOf: '2026-07-19', clueLabel: 'Caps',
  note: 'Netherlands caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
  slots: NAMES.map((name, i) => ({ key: `s${i}`, name, clue: `${CAPS[i]} caps` })),
  near: [{ key: 'n1', name: 'Dennis Bergkamp', note: '11th, 79 caps' }],
};
const DATA = { log: Array.from({ length: getTop10Number(NOW) + 1 }, () => LIST.id), lists: { [LIST.id]: LIST }, pools: {}, extras: [] };
const picks = (ks) => ks.map((k) => ({ k, n: k }));
const t10Day = (rec) => store.set(`biq_top10_${dateToYMD(NOW)}`, JSON.stringify({ id: LIST.id, status: 'done', ...rec }));
const top10 = (props = {}) => { S.top10 = DATA; return renderToStaticMarkup(el(Top10, { date: NOW, onBack: noop, onReport: noop, services: APP(), ...props })); };
const FIRST = (n) => picks(Array.from({ length: n }, (_, i) => `s${i}`));

describe('Top 10: the ten are on the card, in one column', () => {
  it('7 of 10: the score, the verdict and the XP; no board and no heading above the card', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10();
    expect(html).not.toMatch(/t10-board|t10-cell|t10-q"|t10-q-title|t10-wrong/);
    expect((html.match(/<section class="rc/g) || []).length).toBe(1);
    expect(html).toContain('<section class="rc is-bare" aria-label="Top 10: 7 out of 10">');
    expect(html).toContain('<div class="rc-hero is-foot"><div class="rc-num"><b>7</b><span>/10</span></div>');
    expect(html).toContain('<div class="rc-v">Past halfway</div><div class="rc-xp">+28 XP</div>');
  });
  it('the list\'s title, then all ten: the rank green if named and dim if missed, the full name, the number at the right', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10();
    expect(html).toContain('<div class="rc-pic"><p class="rc-q">Most Netherlands caps (men)</p><ol class="rc-ten" aria-label="The ten">');
    const rows = html.slice(html.indexOf('<ol class="rc-ten"'), html.indexOf('</ol>')).split('<li').slice(1);
    expect(rows.length).toBe(10);
    rows.forEach((r, i) => {
      expect(r, `rank ${i + 1}`).toBe(`${i < 7 ? '' : ' class="is-miss"'}><i>${i + 1}</i><b>${NAMES[i]}</b><em>${CAPS[i]} caps</em></li>`);
    });
    // one column: nothing in the rule sets two, and no name is cut off
    const css = read('src/components/resultCard.css');
    expect(rule(css, '.rc-ten')).toBe('.rc-ten{list-style:none;margin:0;padding:0;display:grid;gap:4px;');
    expect(rule(css, '.rc-ten li b')).not.toMatch(/ellipsis|nowrap|overflow:hidden/);
  });
  it('"Share my 7/10" on the one quiet button; on a 0 or a 1 it is "Share my result"', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    expect(top10()).toMatch(/<button type="button" class="rc-act"><svg[^>]*>.*?<\/svg>Share my 7\/10<\/button><\/section>/);
    t10Day({ picks: FIRST(1), gaveUp: true, score: 1 });
    const one = top10();
    expect(one).toContain('<b>1</b><span>/10</span>');
    expect(one).toMatch(/<\/svg>Share my result<\/button>/);
    expect(one).toContain('<div class="rc-xp">+4 XP</div>');
    expect((one.match(/class="is-miss"/g) || []).length).toBe(9);
    t10Day({ picks: FIRST(2), gaveUp: true, score: 2 });
    expect(top10()).toMatch(/<\/svg>Share my 2\/10<\/button>/);
    t10Day({ picks: [], gaveUp: true, score: 0 });
    const none = top10();
    expect(none).toMatch(/<\/svg>Share my result<\/button>/);
    expect(none).not.toContain('rc-xp');                                   // nothing earned is not announced
    expect(none).toContain('<div class="rc-v">A hard one today</div>');
  });
  it('a perfect ten: fifteen more XP, how clean it was as the line under the ten, and "Share my 10/10"', () => {
    t10Day({ picks: FIRST(10), score: 10 });
    const html = top10();
    expect(html).toContain('<div class="rc-v">All ten</div><div class="rc-xp">+55 XP</div>');
    expect(html).not.toContain('is-miss');
    expect(html).toMatch(/<\/ol><\/div><p class="rc-note">Without a single miss<\/p><button type="button" class="rc-act">/);
    expect(html).toContain('Share my 10/10');
    expect(html).toContain('>Perfect ten<');
    t10Day({ picks: [...picks(['zz']), ...FIRST(10)], score: 10, hints: [0] });
    expect(top10()).toContain('<p class="rc-note">With 2 lives to spare · One hint used.</p>');
  });
  it('out of lives: the verdict says so, and the names tried keep their struck-through chips, under the ten', () => {
    t10Day({ picks: [...FIRST(2), ...picks(['z1', 'n1', 'z2', 'z3'])], score: 2 });
    const html = top10();
    expect(html).toContain('<div class="rc-v">Out of lives</div>');
    expect(html).toMatch(/<\/ol><div class="rc-tried" aria-label="Not in the ten"><span><s>z1<\/s><\/span><span><s>z2<\/s><\/span><span><s>z3<\/s><\/span><span class="is-close">n1<em> 11th<\/em><\/span><\/div><\/div>/);
  });
  it('the header: the game named once, "The list, in full", the streak chip where the lives were', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10();
    const head = html.slice(0, html.indexOf('<div class="t10-result">'));
    expect(head).toContain('<div class="t10-head is-over">');
    expect(head).toContain('>Top 10</span>');
    expect(head).toContain('<div class="t10-head-sub">The list, in full</div>');
    expect(head).toMatch(/<span class="dd-stk-slot has-floor" style="--stk-min:48px;--stk-min-sh:56px"><span class="dd-stk" title="4-day daily streak">/);
    expect(head).not.toContain('t10-lives');
    expect(head.endsWith('</span></span></div>')).toBe(true);              // and nothing between the header and the card
  });
  it('the foot: Back to Home as the pill, what the list counts, then "List looks wrong? Tell us"', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10();
    const at = (x) => { const i = html.indexOf(x); expect(i, x).toBeGreaterThan(-1); return i; };
    expect(at('class="dd-list"')).toBeLessThan(at('>Back to Home</button>'));
    expect(at('>Back to Home</button>')).toBeLessThan(at('<p class="t10-about">'));
    expect(html).toContain('<p class="t10-about">As of 19 Jul 2026. Netherlands caps at the end of the 2026 World Cup. Ties go to whoever got there first.</p>');
    expect(at('<p class="t10-about">')).toBeLessThan(at('List looks wrong? Tell us'));
    expect(html).not.toContain('width:100%;min-height:46px');
    expect(html).not.toMatch(/<section class="dd"|dd-share"|dd-up|dd-chip/);
  });
  it('"More Top 10 lists" rides beside the way out as a second quiet pill', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10({ onMoreLists: noop });
    expect(html).toMatch(/<div style="margin-top:18px;display:flex;justify-content:center;flex-wrap:wrap;gap:8px"><button type="button" style="[^"]*background:var\(--s2\)[^"]*">More Top 10 lists<\/button><button type="button" style="[^"]*">Back to Home<\/button><\/div>/);
  });
  it('a list from the library is not the day\'s puzzle: no number, no XP, no list of dailies, and it says so', () => {
    store.set(`biq_top10_list_${LIST.id}`, JSON.stringify({ id: LIST.id, status: 'done', picks: FIRST(7), gaveUp: true, score: 7 }));
    const html = top10({ listId: LIST.id });
    expect(html).not.toContain('rc-xp');
    expect(html).not.toContain('No. ');
    expect(html).toContain('<b>7</b><span>/10</span>');
    expect(html).toContain('<ol class="rc-ten"');
    expect(text(html)).toContain('An old puzzle');
    expect(html).not.toContain('dd-list');
    expect(html).toContain('Share my 7/10');
  });
  it('a host that pays no XP says none', () => {
    t10Day({ picks: FIRST(7), gaveUp: true, score: 7 });
    const html = top10({ services: { dailyDone: APP().dailyDone } });
    expect(html).not.toContain('rc-xp');
    expect(html).toContain('<div class="rc-hero"><div class="rc-num"><b>7</b>');
  });
});

describe('the chip never lies over a long title, and the name comes before the shields', () => {
  it('with `floor` the slot is at least as wide as the short chip, so the title gives way; without it the slot is as it was', async () => {
    const { StreakChip } = await import('../../src/components/StreakChip.jsx');
    const chip = (props) => renderToStaticMarkup(el(StreakChip, props));
    const slot = (props) => chip(props).match(/^<span class="dd-stk-slot[^>]*>/)[0];
    expect(slot({ streak: { count: 4, label: 'daily streak' } })).toBe('<span class="dd-stk-slot">');
    // measured in WebKit: one digit 55.7px, "12" and three shields 94px
    expect(slot({ streak: { count: 4, label: 'daily streak' }, floor: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:48px;--stk-min-sh:56px">');
    expect(slot({ streak: { count: 12, label: 'daily streak' }, floor: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:57px;--stk-min-sh:65px">');
    expect(slot({ streak: { count: 12, label: 'daily streak', shields: 1 }, floor: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:57px;--stk-min-sh:85px">');
    expect(slot({ streak: { count: 12, label: 'daily streak', shields: 3 }, floor: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:57px;--stk-min-sh:95px">');
    expect(slot({ streak: { count: 120, label: 'daily streak', shields: 3 }, floor: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:65px;--stk-min-sh:103px">');
    // an old puzzle shows no shields, so it reserves no room for them
    expect(slot({ streak: { count: 12, label: 'daily streak', shields: 3 }, floor: true, isArchive: true })).toBe('<span class="dd-stk-slot has-floor" style="--stk-min:57px;--stk-min-sh:65px">');
    // Footle and the Daily 7 have short titles and do not ask
    expect(read('src/games/FootballWordle.jsx')).not.toMatch(/<StreakChip[^>]*\bfloor\b/);
    expect(read('src/screens/ResultsScreen.jsx')).not.toMatch(/<StreakChip[^>]*\bfloor\b/);
  });
  it('under 360pt a chip with a floor is the flame and the number: tighter, its shields kept for a screen reader only', () => {
    const dd = read('src/components/dailyDone.css');
    expect(dd).toContain('.dd-stk-slot.has-floor{min-width:var(--stk-min-sh);}');
    expect(dd).toContain('@media (max-width: 359px){.dd-stk-slot.has-floor{min-width:var(--stk-min);}.dd-stk-slot.has-floor .dd-stk{gap:5px;padding:0 9px;}.dd-stk-slot.has-floor .dd-shields{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}}');
    // "Transfer Trail" at 20px/800 is 132px; a 320pt phone leaves 212 for it, the gap and the chip
    expect(132 + 12 + 65).toBeLessThanOrEqual(212);                         // even a three-figure streak
  });
});

describe('the XP on the card is the XP the app pays', () => {
  it('Transfer Trail: 40 for the name, 10 for showing up. Top 10: four a name, fifteen more for all ten', () => {
    expect([getTrailXP(true), getTrailXP(false)]).toEqual([40, 10]);
    expect([0, 1, 7, 9].map((n) => getTop10XP(n, false))).toEqual([0, 4, 28, 36]);
    expect(getTop10XP(10, true)).toBe(55);
    expect(getTop10XP(99, false)).toBe(40);                                // never more than ten names
  });
  it('one sum, two readers: the app awards what the card prints', () => {
    const app = read('src/App.jsx');
    expect(app).toContain("awardXp(getTrailXP(e.detail.won === true), { daily: 'trail' });");
    expect(app).toContain("awardXp(getTop10XP(found, e.detail.won === true), { daily: 'top10' });");
    expect(app).toMatch(/const DAILY_SERVICES = \{ paysXp: true, /);
    expect(read('src/screens/TransferTrail.jsx')).toContain('xp: isArchive || !paysXp ? 0 : getTrailXP(won),');
    expect(read('src/screens/Top10.jsx')).toContain('xp: isArchive || !paysXp ? 0 : getTop10XP(g.score, g.perfect),');
  });
});

describe('the look that was agreed (the drawings\' measures)', () => {
  const css = read('src/components/resultCard.css');
  it('Transfer Trail\'s rows: 44 tall, 8 apart, a dark wash; the badge 32 by 28; the name 16/700', () => {
    expect(rule(css, '.rc-clubs')).toContain('display:grid;gap:8px');
    const li = rule(css, '.rc-clubs li');
    for (const s of ['display:flex', 'align-items:center', 'gap:12px', 'min-height:44px', 'border-radius:12px', 'background:rgba(0,0,0,0.42)']) expect(li, s).toContain(s);
    const badge = rule(css, '.rc-clubs li i');
    for (const s of ['width:32px', 'height:28px', 'border-radius:8px', 'font-size:11px', 'font-weight:800', 'letter-spacing:0.02em']) expect(badge, s).toContain(s);
    const name = rule(css, '.rc-clubs li b');
    for (const s of ['flex:1', 'font-size:16px', 'font-weight:700']) expect(name, s).toContain(s);
    expect(name).not.toMatch(/ellipsis|nowrap/);                            // a long name takes a second line
    expect(rule(css, '.rc-clubs li em')).toContain('font-size:12.5px');
    expect(rule(css, '.rc-clubs li em')).toContain('white-space:nowrap');
  });
  it('the club he was got on is the game\'s green with dark ink; the ones never needed are a lighter wash, dimmed', () => {
    expect(rule(css, '.rc-clubs li.is-got')).toBe('.rc-clubs li.is-got{background:#58CC02;');
    expect(rule(css, '.rc-clubs li.is-got b')).toContain('color:#06230C');
    expect(rule(css, '.rc-clubs li.is-off')).toBe('.rc-clubs li.is-off{background:rgba(0,0,0,0.26);');
    expect(rule(css, '.rc-clubs li.is-off b')).toContain('color:rgba(255,255,255,0.6)');
  });
  it('Top 10\'s rows: 34 tall, 4 apart; a 24px rank chip; the name 14.5/700; the number in tabular figures', () => {
    expect(rule(css, '.rc-q')).toContain('margin:0 0 12px;font-size:15px;line-height:1.25;font-weight:700');
    const li = rule(css, '.rc-ten li');
    for (const s of ['display:flex', 'gap:7px', 'min-height:34px', 'border-radius:10px', 'background:rgba(0,0,0,0.42)']) expect(li, s).toContain(s);
    const chip = rule(css, '.rc-ten li i');
    for (const s of ['width:24px', 'height:24px', 'border-radius:7px', 'background:#58CC02', 'color:#06230C', 'font-size:12px', 'font-weight:800', 'font-variant-numeric:tabular-nums']) expect(chip, s).toContain(s);
    for (const s of ['font-size:14.5px', 'font-weight:700']) expect(rule(css, '.rc-ten li b'), s).toContain(s);
    const num = rule(css, '.rc-ten li em');
    for (const s of ['flex:none', 'font-size:12.5px', 'white-space:nowrap', 'font-variant-numeric:tabular-nums']) expect(num, s).toContain(s);
    expect(rule(css, '.rc-ten li.is-miss')).toContain('background:rgba(0,0,0,0.26)');
    expect(rule(css, '.rc-ten li.is-miss i')).toContain('background:rgba(255,255,255,0.12)');
    expect(rule(css, '.rc-ten li.is-miss b')).toContain('color:rgba(255,255,255,0.55)');
  });
  it('nothing in the two pictures is outlined, and old phones can draw them', () => {
    const mine = css.slice(css.indexOf('TWO MORE PICTURES FOR THE CARD'));
    expect(mine.length).toBeGreaterThan(2500);
    expect(mine).not.toMatch(/border:|outline|box-shadow/);
    expect(mine).not.toMatch(/color-mix|:has\(|[;{]inset:|dvh|backdrop-filter/);
    expect(mine).not.toMatch(/font-family/);                                // the app's own face
  });
  it('the card sits 14px under the finished header on both screens (the header\'s own 8 and 6 more)', () => {
    expect(read('src/screens/TransferTrail.jsx')).toMatch(/\{done && trailCard && \([\s\S]{0,500}<div style=\{\{ marginTop: 6 \}\}>/);
    expect(read('src/screens/top10.css')).toContain('.t10-result { margin-top: 6px; text-align: left; }');
    expect(read('src/screens/top10.css')).toContain('.t10-head { display: flex; align-items: center; gap: 10px; padding: 8px 4px; }');
  });
});

describe('the words', () => {
  it('the two new lines are in both tables', () => {
    expect(en['trail.gotHere']).toBe('Got him here');
    expect(en['trail.notNeeded']).toBe('Not needed');
    expect(es['trail.gotHere']).toBe('Acertado aquí');
    expect(es['trail.notNeeded']).toBe('No hizo falta');
  });
  it('every other line on these finishes already had its Spanish', () => {
    for (const k of ['dd.shareMy', 'dd.shareMine', 'trail.itWas', 'rc.footleLost', 'rf.Career', 'rf.List', 'top10.asOf', 'top10.notIn', 'top10.more', 'top10.full', 'top10.perfect', 'top10.hintsOne', 'top10.hintsN', 'rc.t10Clean', 'quiz.backHome', 'dd.stitch', 'dd.capStreak', 'dd.capToday']) {
      expect(typeof en[k], k).toBe('string'); expect(typeof es[k], k).toBe('string');
      for (const ph of en[k].match(/\{\w+\}/g) || []) expect(es[k], `${k} keeps ${ph}`).toContain(ph);
    }
  });
});

describe('what was left alone', () => {
  it('Mystery Player\'s finish (26 Nov 2026) draws its own card and asks for no result-card picture', () => {
    const mp = read('src/screens/MysteryPlayer.jsx');
    expect(mp).not.toMatch(/\bpicture[:,]/);
    expect(mp).toMatch(/render: \(action\) => \(/);
    // XP only where the host pays it, and never on an archive day.
    expect(mp).toContain('const xp = won && paysXp && !isArchive ? mysteryXp(true, n) : 0;');
  });
  it('what is shared, and its events, are the panel\'s own and untouched', () => {
    const dd = read('src/components/DailyDone.jsx');
    expect(dd).toContain('const { text, full } = shareMessage({ game, score: myScore, grid: challengeGrid, url });');
    for (const ev of ['track?.("dd-challenge"', 'track?.("dd-share"', 'track?.("dd-next"', 'track?.("dd-stitch"', 'track("dd-shown"', 'track?.("dd-save"']) expect(dd, ev).toContain(ev);
  });
});
