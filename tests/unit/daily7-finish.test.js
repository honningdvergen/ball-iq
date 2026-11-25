// The Daily 7 finish, on the layout Footle's has (24 Nov 2026, round two).
//
// Alex scored the Footle finish 4 to 5 and then chose one drawing for both
// games ("best so far"). The Daily 7 still had the older panel under its card:
// a streak row, a big solid green "Share result", a framed "Next up" card and
// two chips. It moved onto the same "one" layout as Footle (DailyDone.jsx); no
// third layout was made. These pin what the drawing shows for the Daily 7, and
// that everything the old panel carried still has a place.
//
// The phone layout is everything before .rd-desktop: the wide-screen card
// after it keeps the classic panel and is not part of this change.
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import en from '../../src/i18n/en.js';
import es from '../../src/i18n/es.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const rule = (css, sel) => { const i = css.indexOf(`${sel}{`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const el = React.createElement;

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
const load = async (store) => { vi.resetModules(); vi.stubGlobal('localStorage', mem(store)); return (await import('../../src/screens/ResultsScreen.jsx')).Results; };

const NEXT = [{ key: 'footle', name: "Today's Footle", short: 'Footle' }, { key: 'trail', name: "Today's Transfer Trail", short: 'Transfer Trail' }, { key: 'top10', name: "Today's Top 10", short: 'Top 10', open: true }];
const SERVICES = { streak: { count: 1, label: 'daily streak', keepsOnLoss: true }, nextUp: NEXT, day: { keys: ['footle', 'daily7', 'trail', 'top10'] }, save: { onSave() {}, line: '50 XP' }, track() {}, promoted: null };
const WRONG = [
  { id: 'q1', q: 'AC Milan and Inter Milan share which famous stadium?', user: 'Stadio Olimpico', correct: 'San Siro' },
  { id: 'q2', q: 'Who scored the 2014 World Cup final winner?', user: null, correct: 'Götze' },
];
// 23 Nov 2026 is day 20780. Number 3 is the day's one hard question.
const answers = (right) => Array.from({ length: 7 }, (_, i) => ({ isCorrect: i < right, diff: i === 2 ? 'hard' : 'medium' }));
const props = (score, extra = {}) => ({ mode: 'daily', onHome() {}, onRetry() {}, onShare: async () => {}, onReport() {}, dailyDone: SERVICES,
  result: { score, total: 7, bestStreak: score, allAnswers: answers(score), dailyEdition: 20780, ...(extra.result || {}) }, wrongAnswers: score < 7 ? WRONG : [], ...extra, ...(extra.result ? { result: { score, total: 7, allAnswers: answers(score), dailyEdition: 20780, ...extra.result } } : {}) });
const phone = (html) => { const i = html.indexOf('<div class="rd-desktop">'); expect(i).toBeGreaterThan(0); return html.slice(0, i); };
const render = async (score, extra, store) => phone(renderToStaticMarkup(el(await load(store), props(score, extra))));

describe('the Daily 7 finish is the layout Footle has', () => {
  it('asks the finish panel for the "one" layout, and no third layout exists', () => {
    const src = read('src/screens/ResultsScreen.jsx');
    expect(src).toMatch(/<DailyDone game="daily7"[^>]*\n[^>]*\n[^>]*card=\{dailyCard\} layout="one" \/>/);
    const dd = read('src/components/DailyDone.jsx');
    expect((dd.match(/layout === "/g) || []).length).toBe(1);
    expect(dd).toContain('if (layout === "one" && card) {');
  });
  it('the header: the back arrow, the game named ONCE with its day, "7 questions" under it, the streak chip on the right', async () => {
    const html = await render(5);
    expect(html).toMatch(/<div class="dd-hd"><button type="button" class="back-btn" aria-label="Back to Home">←<\/button><div class="dd-hd-t"><div style="[^"]*"><span style="[^"]*">Daily 7<\/span><span style="[^"]*">(23 Nov|Nov 23)<\/span><\/div><div class="dd-hd-sub">7 questions<\/div><\/div><span class="dd-stk-slot"><span class="dd-stk" title="Day 1 of a daily streak"><svg[^>]*lucide-flame[^>]*>.*?<\/svg><span class="dd-stk-w">Day 1 streak<\/span><span class="dd-stk-n" aria-hidden="true">1<\/span><\/span><\/span><\/div>/);
    // named once: the card under it has no top line
    expect(html).toContain('<section class="rc is-bare" aria-label="Daily 7: 5 out of 7">');
    expect(html).not.toContain('rc-eye');
    expect(html).not.toContain('balliq.app');
    expect((text(html).match(/Daily 7/g) || []).length).toBe(1);
    // the lone arrow in the corner is for the other modes
    expect(html).not.toMatch(/position:absolute;top:8px;left:0/);
    const css = read('src/components/dailyDone.css');
    // 25 Nov 2026: the card sits 14px under the header (it was 8 and nearly touched), the same as Footle's.
    expect(rule(css, '.dd-hd')).toBe('.dd-hd{display:flex;align-items:center;gap:12px;margin:0 0 14px;');
    expect(css).not.toMatch(/@media[^{]*\{[^}]*\.dd-hd\{/);                  // at every height: nothing needs the room back here
    expect(rule(css, '.dd-hd-sub')).toContain('font-size:12.5px');
  });
  it('with no streak there is no chip, and the header still names the game', async () => {
    const html = await render(5, { dailyDone: { ...SERVICES, streak: { count: 0, label: 'daily streak' } } });
    expect(html).not.toContain('dd-stk');
    expect(html).toContain('<div class="dd-hd-sub">7 questions</div></div></div>');
  });
  it('the card: the XP in yellow under the verdict, the seven marks, and Share as one quiet button ON the card', async () => {
    const html = await render(5);
    expect(html).toMatch(/<div class="rc-hero is-foot"><div class="rc-num"><b>.*?<\/b><span>\/7<\/span><\/div><div class="rc-say"><div class="rc-v">Solid challenge\.<\/div><div class="rc-xp">\+50 XP<\/div><\/div><\/div>/);
    expect((html.match(/class="rc-k[ "]/g) || []).length).toBe(7);
    expect(text(html)).toContain("You got number 3. One of today's hard ones.");
    // one tap shares (the Daily 7 has no puzzle link to send, so no sheet)
    expect(html).toMatch(/<\/p><button type="button" class="rc-act"><svg[^>]*lucide-share[^>]*>.*?<\/svg>Share my 5\/7<\/button><\/section>/);
    expect(html.match(/\+50 XP/g).length).toBe(1);
  });
  it('the big solid green "Share result" under the card is gone, and so is the whole old panel', async () => {
    const html = await render(5);
    expect(html).not.toMatch(/class="dd-share"|Share result|<section class="dd"|class="dd-up[ "]|dd-chip|dd-hr|dd-well|dd-row|lucide-swords/);
    expect(html).toContain('<section class="dd-one"');
    // nothing under the card is a solid green button: every button there is a list row or the small Save
    const under = html.slice(html.indexOf('<section class="dd-one"'), html.indexOf('wr-head'));
    for (const b of under.match(/<button[^>]*>/g) || []) expect(b).toMatch(/class="(dd-li|dd-pill)"|style="height:40px;padding:0 22px;border-radius:999px;border:0;background:var\(--s2\)/);
    expect(under).not.toMatch(/var\(--accent\)|btn-3d/);
  });
  it('one caption line: "Today 1 of 4" on the left, the countdown on the right; no streak and no XP there', async () => {
    const html = await render(5);
    expect(html).toMatch(/<div class="dd-cap"><span class="dd-cap-day"><b>Today<\/b> 1 of 4<\/span><span class="dd-cap-r">New puzzles in <b class="dd-num">(?:\d+h )?\d+m<\/b><\/span><\/div><div class="dd-list">/);
    expect(html).not.toMatch(/Tomorrow makes it|dd-cap-st|dd-cap-xp/);
  });
  it('one list of the day\'s other games: an icon well, a name, one short line, and Play on EVERY row', async () => {
    const html = await render(5);
    const rows = html.match(/<button class="dd-li"[\s\S]*?<\/button>/g);
    expect(rows.map(text)).toEqual(["F Today's Footle Six guesses Play", 'Transfer Trail Whose career? Play', 'Top 10 Name all ten Continue']);
    for (const r of rows) { expect(r).toContain('class="dd-li-ic"'); expect((r.match(/class="dd-li-go"/g) || []).length).toBe(1); expect(r).not.toMatch(/chevron|min\b/); }
    expect(rows[0]).toContain('--dd-rgb:88,204,2;--dd-c:#8AE042');           // each pill in its game's own colour
  });
  it('then the guest\'s save line, Back to Home as the quiet filled pill, and the missed list after it', async () => {
    const html = await render(5);
    const at = (x) => { const i = html.indexOf(x); expect(i, x).toBeGreaterThan(-1); return i; };
    expect(at('class="dd-list"')).toBeLessThan(at('live on this phone only.'));
    expect(at('live on this phone only.')).toBeLessThan(at('>Back to Home</button>'));
    expect(at('>Back to Home</button>')).toBeLessThan(at('class="wr-head"'));
    expect(html).toMatch(/<div class="dd-line"><span>Your <strong class="dd-num">50 XP<\/strong> live on this phone only\.<\/span><button type="button" class="dd-pill">Save<\/button><\/div><\/div><\/section><div style="margin-top:18px;display:flex;justify-content:center"><button type="button" style="height:40px;padding:0 22px;border-radius:999px;border:0;background:var\(--s2\);[^"]*">Back to Home<\/button><\/div>/);
    expect(text(html)).toContain('2 you missed');
    // 25 Nov 2026: with a missed list the page ends on the same pill again, so the bottom of a long
    // list has a way out. Two pills, the same markup, the list between them, and nothing after the second.
    const PILL = '<div style="margin-top:18px;display:flex;justify-content:center"><button type="button" style="height:40px;padding:0 22px;border-radius:999px;border:0;background:var(--s2);color:var(--t1);-webkit-text-fill-color:var(--t1);font-weight:700;font-size:14px;line-height:1;font-family:inherit;cursor:pointer">Back to Home</button></div>';
    expect(html.split(PILL).length).toBe(3);
    expect((html.match(/>Back to Home<\/button>/g) || []).length).toBe(2);
    expect(html.indexOf(PILL)).toBeLessThan(at('class="wr-head"'));
    expect(html.lastIndexOf(PILL)).toBeGreaterThan(at('class="wr-head"'));
    expect(html.endsWith(PILL + '</div>')).toBe(true);                       // then only the phone layout's own closing tag
    // both are the same exit: one handler, the host's onHome
    expect(read('src/screens/ResultsScreen.jsx')).toContain('{wrongAnswers?.length > 0 && <ResultFoot onHome={onHome} pill />}');
    expect(read('src/screens/ResultsScreen.jsx').match(/<ResultFoot onHome=\{onHome\} pill \/>/g).length).toBe(2);
    // a signed-in player has no save line
    expect(await render(5, { dailyDone: { ...SERVICES, save: null } })).not.toContain('dd-pill');
    // seven of seven: nothing missed, so there is no list and the one pill is the last thing
    const all = await render(7);
    expect(all).not.toContain('wr-head');
    expect(text(all)).toContain('Share my 7/7');
    expect((all.match(/>Back to Home<\/button>/g) || []).length).toBe(1);
    expect(all.endsWith(PILL + '</div>')).toBe(true);
    // Footle has no missed list: its screen still asks for the pill once
    expect(read('src/games/FootballWordle.jsx').match(/<ResultFoot onHome=\{onBack\} pill \/>/g).length).toBe(1);
  });
});

describe('what the drawing does not show, and still has a place', () => {
  it('a low score (0 or 1 of 7) says "Share my result"; from 2 up the button says the score', async () => {
    for (const [score, label] of [[0, 'Share my result'], [1, 'Share my result'], [2, 'Share my 2/7'], [3, 'Share my 3/7'], [6, 'Share my 6/7']]) {
      expect(text(await render(score)), `${score}`).toContain(label);
    }
    expect(read('src/screens/ResultsScreen.jsx')).toContain('plainShare: band === 4,');
    expect(en['dd.shareMine']).toBe('Share my result');
  });
  it('nothing earned is not announced: a 0 of 7 card has no "+0 XP"', async () => {
    const html = await render(0);
    if (!/\+\d+ XP/.test(html)) expect(html).not.toContain('XP</div>');
    expect(html).not.toContain('+0 XP');
  });
  it('the reminder: in words under the list on a player\'s first days, then words with the bell, then the hour it is set for', async () => {
    const first = await render(5, { dailyDone: { ...SERVICES, remind: { state: 'off', onRemind() {} } } });
    // 25 Nov 2026: a quiet line with a small filled pill, not a wide yellow bar (footle-finish.test.js pins the style).
    expect(first).toMatch(/<div class="dd-line is-ask"><span>Remind me each day at [^<]+<\/span><button type="button" class="dd-pill" aria-label="Turn on a daily reminder at [^"]+" title="[^"]+">Turn on<\/button><\/div>/);
    expect(first).not.toContain('class="dd-remind"');
    const later = await render(5, { dailyDone: { ...SERVICES, remind: { state: 'off', onRemind() {} } } }, { biq_remind_offer: '9:1' });
    expect(later).toMatch(/<div class="dd-line"><span>Remind me each day at [^<]+<\/span><button type="button" class="dd-bell"/);
    const on = await render(5, { dailyDone: { ...SERVICES, remind: { state: 'on', onRemind() {} } } });
    expect(on).toMatch(/<div class="dd-line is-set"><span><svg[^>]*lucide-bell[^>]*>.*?<\/svg>Reminder set for [^<]+<\/span><\/div>/);
    // all three sit between the list and the save line
    for (const h of [first, later, on]) { expect(h.search(/is-ask|dd-bell|is-set/)).toBeGreaterThan(-1); expect(h.indexOf('class="dd-list"')).toBeLessThan(h.search(/is-ask|dd-bell|is-set/)); expect(h.search(/is-ask|dd-bell|is-set/)).toBeLessThan(h.indexOf('live on this phone only.')); }
  });
  it('"Promoted to …" keeps its line, between the caption and the list', async () => {
    const html = await render(5, { dailyDone: { ...SERVICES, promoted: { game: 'daily7', name: 'Non-League' } } });
    expect(html).toMatch(/<\/span><\/div><div class="dd-promo" role="status"><span>Promoted to <strong>Non-League<\/strong><\/span><\/div><div class="dd-list">/);
    // another game's promotion is not this finish's
    expect(await render(5, { dailyDone: { ...SERVICES, promoted: { game: 'footle', name: 'Non-League' } } })).not.toContain('dd-promo');
  });
  it('banked shields ride the chip', async () => {
    const html = await render(5, { dailyDone: { ...SERVICES, streak: { count: 12, label: 'daily streak', keepsOnLoss: true, shields: 2 } } });
    expect(html).toMatch(/<span class="dd-stk has-sh" title="12-day daily streak">.*?Day 12 streak<\/span><span class="dd-stk-n" aria-hidden="true">12<\/span><span class="dd-shields" role="img" aria-label="2 streak shields banked: each covers one missed day"[^>]*><svg[^>]*>.*?<\/svg>2<\/span><\/span>/);
  });
  it('all four done: the sweep row in the same filled block, with nothing to tap', async () => {
    const html = await render(5, { dailyDone: { ...SERVICES, nextUp: [] } });
    expect(html).toContain('<b>Today</b> 4 of 4');
    expect(html).toMatch(/<div class="dd-list"><div class="dd-li is-sweep">/);
    expect(text(html)).toContain('All 4 done today Clean sweep');
    expect(html).not.toContain('dd-li-go');
  });
  it('an old day from the archive: its own date in the header, no list, and it says it does not count', async () => {
    const html = await render(5, { result: { dailyEdition: 20779, dailyArchive: true } });
    expect(html).toMatch(/<span style="[^"]*">(22 Nov|Nov 22)<\/span>/);
    // An old Daily 7 still pays its XP (App.jsx awards it for any day), and its card said so before this change too.
    expect(html).toContain('<div class="rc-xp">+50 XP</div>');
    expect(html).not.toContain('dd-list');
    expect(html).not.toContain('<b>Today</b>');
    expect(html).toContain('<div class="dd-cap"><span class="dd-cap-r">An old puzzle — it doesn’t count toward tomorrow.</span></div>');
    expect(text(html)).toContain('Share my 5/7');
    // the streak chip is the player's streak as it stands; shields are not shown on an old day
    expect(html).toContain('class="dd-stk');
  });
  it('the crowd comparison is still the card\'s headline when the day has numbers (the panel holds them)', () => {
    const dd = read('src/components/DailyDone.jsx');
    const one = dd.slice(dd.indexOf('if (layout === "one" && card) {'), dd.indexOf('const cardEl = card ? ('));
    expect(one).toContain('verdict={words.verdict} sub={words.sub} xp={card.xp}');
    expect(dd).toContain('const words = card ? cardWords(today, card, t, isArchive) : null;');
  });
  it('the profile-picture nudge comes after the finish, not between the header and the card', async () => {
    const html = await render(5, { photoNudge: el('div', { id: 'nudge' }) });
    expect(html.indexOf('</section>', html.indexOf('<section class="dd-one"'))).toBeLessThan(html.indexOf('id="nudge"'));
    expect(html.indexOf('id="nudge"')).toBeLessThan(html.indexOf('>Back to Home</button>'));
    expect((html.match(/id="nudge"/g) || []).length).toBe(1);
  });
});

describe('everything else keeps what it had', () => {
  it('another mode\'s results: the lone arrow, its own header, no finish header', async () => {
    const R = await load();
    const html = phone(renderToStaticMarkup(el(R, { mode: 'classic', onHome() {}, onRetry() {}, onShare() {}, onPlayFootle() {}, onPlayDaily() {}, onReport() {}, result: { score: 7, total: 10, allAnswers: [] } })));
    expect(html).toMatch(/position:absolute;top:8px;left:0/);
    expect(html).not.toMatch(/dd-hd|dd-stk|class="rc/);
  });
  it('the wide-screen card keeps the classic panel', async () => {
    const R = await load();
    const html = renderToStaticMarkup(el(R, props(5)));
    const wide = html.slice(html.indexOf('<div class="rd-desktop">'));
    expect(wide).toContain('<section class="dd"');
    expect(wide).not.toMatch(/dd-one|dd-hd|rc-act/);
  });
  // 25 Nov 2026: Transfer Trail and Top 10 took the layout too (Alex: "Yes, both";
  // tests/unit/trail-top10-finish.test.js). Mystery Player's drawing is not approved, so it has not.
  it('Mystery Player still asks for nothing new; Transfer Trail and Top 10 joined on 25 Nov', () => {
    expect(read('src/screens/MysteryPlayer.jsx')).not.toMatch(/layout="one"|StreakChip|\bpill\b \/>|head=\{false\}/);
    for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/Top10.jsx']) {
      const src = read(f);
      expect(src, f).toContain('layout="one"');
      expect(src, f).toContain('<StreakChip streak={finishStreak} isArchive={isArchive} />');
    }
  });
  it('Spanish has every line this screen shows, and the header\'s line is the list row\'s without its minutes', () => {
    for (const k of ['dd.hook.daily7', 'dd.capStreak', 'dd.capToday', 'dd.nOf', 'dd.newIn', 'dd.shareMy', 'dd.shareMine', 'quiz.backHome', 'dd.remindBtn', 'dd.remindOn', 'dd.remindAria', 'dd.remindSet', 'dd.archive', 'dd.safe', 'dd.safeWord']) {
      expect(typeof en[k], k).toBe('string'); expect(typeof es[k], k).toBe('string');
      for (const ph of en[k].match(/\{\w+\}/g) || []) expect(es[k], `${k} keeps ${ph}`).toContain(ph);
    }
    expect(en['dd.hook.daily7'].split('·')[0].trim()).toBe('7 questions');
    expect(es['dd.hook.daily7'].split('·')[0].trim().length).toBeGreaterThan(3);
    expect(read('src/screens/ResultsScreen.jsx')).toContain('<div className="dd-hd-sub">{t("dd.hook.daily7").split("·")[0].trim()}</div>');
  });
});
