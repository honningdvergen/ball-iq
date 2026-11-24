// The Footle finish as ONE object (24 Nov 2026).
//
// Alex on the finish he had: "thrown together … a divorced couple". The result
// was on screen twice (the board, then a green card) and a framed panel sat
// under it with a solid button, a note, a link, a framed "Next up" card and two
// chips. He steered eight drawn rounds and then said "Yes, build Footle". These
// pin what was agreed, and that only Footle changed: the picture and action
// slots on ResultCard and the "one" layout on DailyDone are things a host asks
// for, and no other host does.
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ResultCard } from '../../src/components/ResultCard.jsx';
import { ShareSheet } from '../../src/components/ShareSheet.jsx';
import en from '../../src/i18n/en.js';
import es from '../../src/i18n/es.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const rule = (css, sel) => { const i = css.indexOf(`${sel}{`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const el = React.createElement;

describe('the card takes a picture and one action, when a host asks', () => {
  const base = { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant', sub: 'The answer was Joe Bennett' };
  it('the picture sits between the headline and the line, the action last', () => {
    const html = renderToStaticMarkup(el(ResultCard, { ...base, note: 'a line', picture: el('i', { id: 'pic' }), action: el('button', { id: 'act' }) }));
    const at = (s) => html.indexOf(s);
    expect(at('rc-hero')).toBeGreaterThan(-1);
    expect(at('rc-hero')).toBeLessThan(at('<div class="rc-pic"><i id="pic">'));
    expect(at('id="pic"')).toBeLessThan(at('rc-note'));
    expect(at('rc-note')).toBeLessThan(at('id="act"'));
    expect(html.endsWith('<button id="act"></button></section>')).toBe(true);
  });
  it('a host that passes neither gets the card it had', () => {
    const html = renderToStaticMarkup(el(ResultCard, base));
    expect(html).not.toContain('rc-pic');
    expect(html).not.toContain('rc-act');
    expect(html.endsWith('</div></div></section>')).toBe(true);
  });
  it('the other dailies pass nothing new', () => {
    for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/Top10.jsx', 'src/screens/ResultsScreen.jsx', 'src/screens/MysteryPlayer.jsx']) {
      const src = read(f);
      expect(src, f).not.toMatch(/layout="one"/);
      expect(src, f).not.toMatch(/\bpicture[:=]/);
    }
    expect(read('src/games/FootballWordle.jsx')).toContain('layout="one"');
  });
});

describe('the look that was agreed', () => {
  const footle = read('src/games/footle.css');
  const rc = read('src/components/resultCard.css');
  const dd = read('src/components/dailyDone.css');
  it('tiles: at most 48 square, gap 5, radius 9, Inter 800 at 18, always centred', () => {
    const row = rule(footle, '.wd-cg-row');
    expect(row).toContain('grid-template-columns:repeat(var(--wd-cols),minmax(0,48px))');
    expect(row).toContain('gap:5px');
    expect(row).toContain('justify-content:center');
    expect(rule(footle, '.wd-cg')).toContain('gap:5px');
    const tile = rule(footle, '.wd-ct');
    for (const s of ['aspect-ratio:1/1', 'border-radius:9px', 'font-size:18px', 'line-height:1', 'font-weight:800']) expect(tile, s).toContain(s);
    expect(tile).not.toMatch(/font-family/);            // the app font, never the mono face
  });
  it("the game's own three colours, not the card's white and gold", () => {
    expect(rule(footle, '.wd-ct')).toContain('background:rgba(0,0,0,0.26);color:rgba(255,255,255,0.78)');
    expect(rule(footle, '.wd-ct.is-green')).toContain('background:var(--accent);color:var(--grn-ink)');
    expect(rule(footle, '.wd-ct.is-yellow')).toContain('background:var(--gold);color:#3A2A00');
    // and the colour-blind palette follows the board's
    expect(rule(footle, 'html.biq-cb .wd-ct.is-green')).toContain('#F5793A');
    expect(rule(footle, 'html.biq-cb .wd-ct.is-yellow')).toContain('#85C0F9');
  });
  it('Share is one quiet button: full width, 50 tall, a white wash, 800 at 16', () => {
    const act = rule(rc, '.rc-act');
    for (const s of ['width:100%', 'height:50px', 'border:0', 'border-radius:999px', 'background:rgba(255,255,255,0.14)', 'font-size:16px', 'font-weight:800']) expect(act, s).toContain(s);
  });
  it('the list is one filled block with no outline; the only green is a small Play', () => {
    const list = rule(dd, '.dd-list');
    expect(list).toContain('background:var(--s1)');
    expect(list).toContain('border-radius:20px');
    expect(list).not.toMatch(/border:|box-shadow|outline/);
    expect(rule(dd, '.dd-li')).toContain('min-height:66px');
    expect(rule(dd, '.dd-li')).toContain('border:0');
    const go = rule(dd, '.dd-li-go');
    for (const s of ['height:38px', 'border-radius:999px', 'background:var(--accent)', 'color:var(--grn-ink)']) expect(go, s).toContain(s);
    // nothing under the card is drawn with an outline in this layout
    const one = dd.slice(dd.indexOf('THE FINISH AS ONE OBJECT'), dd.indexOf('THE SHARE SHEET'));
    expect(one.replace(/border(-top)?:(0|1px solid rgba\(255,255,255,0\.07\))/g, '')).not.toMatch(/border(-top|-bottom)?:/);
  });
  it('old phones: no colour-mix, no :has(), no inset shorthand, no dvh in the new rules', () => {
    const fresh = [footle.slice(footle.indexOf('THE PLAYED ROWS, ON THE RESULT CARD')), rc.slice(rc.indexOf("A host's own picture")), dd.slice(dd.indexOf('THE FINISH AS ONE OBJECT'))].join('\n');
    expect(fresh.length).toBeGreaterThan(2000);
    expect(fresh).not.toMatch(/color-mix|:has\(|[;{]inset:|dvh|backdrop-filter/);
    expect(fresh).not.toMatch(/font-family:\s*'?Inter|JetBrains Mono/);
  });
  it('the sheet honours reduced motion and designs none of its own', () => {
    expect(dd).toContain('@media (prefers-reduced-motion: reduce){.dd-scrim,.dd-sheet{animation:none;}}');
    expect(rule(dd, '.dd-scrim')).toContain('touch-action:none');
    expect(rule(dd, '.dd-sheet')).toContain('touch-action:none');
  });
});

describe('the words', () => {
  const NEW = ['dd.shareMy', 'dd.shareMine', 'dd.sheetTitle', 'dd.sheetClose', 'dd.sendBackNote', 'dd.shareOnlyNote', 'dd.capToday', 'dd.capStreak'];
  it('every new line is in both tables, with the same placeholders', () => {
    for (const k of NEW) {
      expect(typeof en[k], k).toBe('string');
      expect(typeof es[k], k).toBe('string');
      for (const ph of en[k].match(/\{\w+\}/g) || []) expect(es[k], `${k} keeps ${ph}`).toContain(ph);
    }
    expect(en['dd.shareMy'].replace('{score}', '3/6')).toBe('Share my 3/6');
    expect(en['dd.shareMine']).toBe('Share my result');
  });
  it('the two actions keep the names they had', () => {
    expect([en['dd.sendMate'], en['dd.sendBack'], en['dd.shareOnly']]).toEqual(['Send it to a mate', 'Send it back', 'Just share my result']);
  });
});

describe('the share sheet', () => {
  const rows = [
    { key: 'mate', Icon: (p) => el('svg', { 'data-i': 'send', ...p }), title: 'Send it to a mate', note: 'They get the same puzzle and try to beat you.', onClick() {} },
    { key: 'mine', Icon: (p) => el('svg', { 'data-i': 'share', ...p }), title: 'Just share my result', note: 'Your result, with no answers on it.', onClick() {}, disabled: true },
  ];
  const html = renderToStaticMarkup(el(ShareSheet, { title: 'Share', closeLabel: 'Close', rows, onClose() {} }));
  it('is a named dialog with a close button and two rows, each with its grey line', () => {
    expect(html).toContain('role="dialog" aria-modal="true" aria-label="Share"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-label="Close"');
    expect((html.match(/class="dd-act"/g) || []).length).toBe(2);
    expect(text(html)).toBe('Share Send it to a mate They get the same puzzle and try to beat you. Just share my result Your result, with no answers on it.');
    expect(html).toMatch(/<button type="button" class="dd-act" disabled="">.*Just share my result/);
  });
  it('uses the hook every other sheet uses, and closes on a tap outside', () => {
    const src = read('src/components/ShareSheet.jsx').replace(/^\s*\/\/.*$/gm, '');
    expect(src).toMatch(/useModalA11y\(\{ isOpen: true, onClose, ref, focusContainer: true \}\)/);
    expect(src).toMatch(/className="dd-scrim" onClick=\{onClose\}/);
    expect(src).toMatch(/onClick=\{\(e\) => e\.stopPropagation\(\)\}/);
    expect(src).toMatch(/touchstart[\s\S]*touchmove[\s\S]*touchend/);       // the drag down
    expect(src).not.toMatch(/preventDefault/);                               // a tap is never swallowed
  });
});

describe('the finish panel in the "one" layout', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
  const load = async (store) => { vi.resetModules(); vi.stubGlobal('localStorage', mem(store)); return (await import('../../src/components/DailyDone.jsx')).default; };
  const NEXT = [{ key: 'daily7', name: "Today's Daily 7", short: 'Daily 7' }, { key: 'trail', name: "Today's Transfer Trail", short: 'Transfer Trail' }, { key: 'top10', name: "Today's Top 10", short: 'Top 10', open: true }];
  const DAY = { keys: ['footle', 'daily7', 'trail', 'top10'] };
  const card = { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant', sub: 'The answer was Joe Bennett', pinSub: true, xp: 48, picture: el('div', { className: 'wd-cg' }) };
  const lost = { ...card, score: null, verdict: 'Wesley Sneijder', sub: 'Out of guesses', xp: 10 };
  const props = { game: 'footle', edition: 204, won: true, bucket: 3, streak: { count: 1, label: 'daily streak', keepsOnLoss: true }, nextUp: NEXT, day: DAY, card, layout: 'one', onShare: async () => {} };
  const render = (D, p) => renderToStaticMarkup(el(D, { ...props, ...p }));

  it('a win: the picture and "Share my 3/6" on the card; no panel, no crossed swords, no second button', async () => {
    const html = render(await load());
    expect(html).toMatch(/<div class="rc-pic"><div class="wd-cg"><\/div><\/div><button type="button" class="rc-act" aria-haspopup="dialog" aria-expanded="false"><svg[^>]*lucide-share[^>]*>.*?<\/svg>Share my 3\/6<\/button><\/section>/);
    expect(html).not.toContain('<section class="dd"');
    expect(html).not.toMatch(/lucide-swords|class="dd-share"|dd-share-note|dd-share-alts|class="dd-up[ "]|dd-chip|dd-hr|dd-well/);
    expect(html).toContain('<section class="dd-one"');
    expect((html.match(/<button/g) || []).length).toBe(1 + NEXT.length);     // Share, and the list's rows
  });
  it('a loss: "Share my result", the name as the headline', async () => {
    const html = render(await load(), { won: false, bucket: 0, card: lost });
    expect(html).toContain('Share my result</button>');
    expect(html).toContain('<div class="rc-hero is-name">');
    expect(text(html)).toContain('Win the day back');                        // the first row still says it
  });
  it('the caption: "Today 1 of 4" on the left; the flame, the streak and the XP on the right', async () => {
    const html = render(await load());
    expect(html).toMatch(/<div class="dd-cap"><span class="dd-cap-day"><b>Today<\/b> 1 of 4<\/span><span class="dd-cap-r"><span class="dd-cap-st" title="Day 1 of a daily streak"><svg[^>]*lucide-flame[^>]*>.*?<\/svg>Day 1 streak<\/span><span class="dd-cap-xp">\+48 XP<\/span><\/span><\/div>/);
  });
  it('the list: the first row ends in Play, the rest in a chevron; a started one says Continue when it leads', async () => {
    const D = await load();
    const html = render(D);
    const rows = html.match(/<button class="dd-li"[\s\S]*?<\/button>/g);
    expect(rows.length).toBe(3);
    expect(text(rows[0])).toBe("Today's Daily 7 7 questions · 3 min Play");
    expect(rows[0]).toContain('class="dd-li-go"');
    expect(text(rows[1])).toBe('Transfer Trail Whose career? · 2 min');
    expect(text(rows[2])).toBe('Top 10 Name all ten · 4 min');
    for (const r of rows.slice(1)) { expect(r).toContain('lucide-chevron-right'); expect(r).not.toContain('dd-li-go'); }
    const cont = render(D, { nextUp: NEXT.slice(2) });
    expect(text(cont.match(/<button class="dd-li"[\s\S]*?<\/button>/)[0])).toBe("Today's Top 10 Name all ten · 4 min Continue");
    // a link on the static pages stays a link
    const web = render(D, { nextUp: [{ key: 'trail', name: 'Transfer Trail', href: '/transfer-trail/' }] });
    expect(web).toMatch(/<a class="dd-li"[^>]*href="\/transfer-trail\/"/);
  });
  it('the countdown stays, as one quiet line, with the reminder beside it', async () => {
    const D = await load();
    expect(render(D)).toMatch(/<div class="dd-line"><span>Tomorrow makes it <strong class="dd-num">2<\/strong> · new puzzles in <strong class="dd-num">\d+h \d+m<\/strong><\/span><\/div>/);
    // streak safe on a loss, where the host's streak counts any finish
    expect(text(render(D, { won: false, bucket: 0, card: lost, streak: { count: 3, label: 'daily streak', keepsOnLoss: true } }))).toMatch(/Streak safe · new puzzles in \d+h \d+m/);
    // the hour pill once the reminder is set
    expect(render(D, { remind: { state: 'on', onRemind() {} } })).toMatch(/<span class="dd-pill is-set" aria-label="Reminder set for [^"]+">/);
  });
  it("a player's first days get the reminder in words; after five days of offers, the bell", async () => {
    const first = render(await load(), { remind: { state: 'off', onRemind() {} } });
    expect(first).toContain('class="dd-remind"');
    expect(first).toContain('Remind me each day at ');
    expect(first).not.toContain('class="dd-bell"');
    const later = render(await load({ biq_remind_offer: '9:1' }), { remind: { state: 'off', onRemind() {} } });
    expect(later).toMatch(/<div class="dd-line"><span>.*?<\/span><button type="button" class="dd-bell"/);
    expect(later).not.toContain('class="dd-remind"');
  });
  it('a promotion, a guest, the app badge: each keeps its line', async () => {
    const html = render(await load(), { promoted: { game: 'footle', name: 'Non-League' }, save: { onSave() {}, line: '48 XP' }, GetAppCTA: () => el('b', null, 'badge') });
    expect(html).toMatch(/<div class="dd-promo" role="status"><span>Promoted to <strong>Non-League<\/strong><\/span><\/div><div class="dd-list">/);
    expect(html).toContain('<div class="dd-getapp"><b>badge</b></div>');
    expect(html).toMatch(/<div class="dd-line"><span>Your <strong class="dd-num">48 XP<\/strong> live on this phone only\.<\/span><button type="button" class="dd-pill">Save<\/button><\/div><\/div><\/section>$/);
    // a signed-in player has no save line
    expect(render(await load())).not.toContain('dd-pill');
  });
  it('all four done: the sweep, in the same filled block, with no row to tap', async () => {
    const html = render(await load(), { nextUp: [], streak: { count: 12, label: 'daily streak' } });
    expect(html).toContain('<b>Today</b> 4 of 4');
    expect(html).toMatch(/<div class="dd-list"><div class="dd-li is-sweep">/);
    expect(text(html)).toContain('All 4 done today Clean sweep');
    expect(html).not.toContain('dd-li-go');
  });
  it('a mate sent the puzzle: the head-to-head under the card, "Make it a league?", and no sheet words until it opens', async () => {
    const html = render(await load({ biq_game_challenge: JSON.stringify({ game: 'footle', edition: 204, score: 4, name: 'Jo', at: 1 }) }));
    expect(html).toMatch(/<section class="dd-one"[^>]*><div class="dd-g dd-vs"[^>]*><div class="dd-h2h is-win" role="status">/);
    expect(text(html)).toContain('You 3/6 · Jo 4/6 You beat Jo');
    expect(html).toMatch(/class="dd-league is-flat"><svg[^>]*>.*?<\/svg> Make it a league\?<\/button>/);
    expect(html).toContain('Share my 3/6</button>');
    expect(html).not.toContain('Send it back');
  });
  it('the sheet carries the two actions that existed, unchanged, and keeps "send it back" for a waiting challenge', () => {
    const src = read('src/components/DailyDone.jsx');
    const one = src.slice(src.indexOf('if (layout === "one" && card) {'), src.indexOf('const cardEl = card ? ('));
    expect(one).toMatch(/key: "mate", Icon: challengeState \? Check : Send, onClick: doChallenge,/);
    expect(one).toMatch(/rival \? "dd\.sendBack" : "dd\.sendMate"/);
    expect(one).toMatch(/key: "mine", Icon: shared \? Check : Share, onClick: doShare, disabled: busy,/);
    expect(one).not.toMatch(/Swords/);
    // what they send is the classic panel's code, untouched by this layout
    expect(src).toContain('const url = `https://balliq.app/c/${token}${rid ? `?r=${rid}` : ""}`;');
    expect(src).toContain('try { const ok = await onShare?.(); if (ok !== false) { setShared(true); setTimeout(() => setShared(false), 2200); } }');
  });
  it('an old puzzle from the archive: one tap shares, no list, no XP claimed, and it says so', async () => {
    const html = render(await load(), { isArchive: true });
    expect(html).toMatch(/<button type="button" class="rc-act"><svg/);       // no sheet: there is no link to send
    expect(html).not.toContain('dd-list');
    expect(html).not.toContain('XP');
    expect(html).not.toContain('<b>Today</b>');
    expect(text(html)).toContain('An old puzzle — it doesn’t count toward tomorrow.');
  });
  it('without the switch the panel is exactly the classic one, with or without a picture on the card', async () => {
    const D = await load();
    const classic = renderToStaticMarkup(el(D, { ...props, layout: undefined }));
    expect(classic).toContain('<section class="dd"');
    expect(classic).toContain('lucide-swords');
    expect(classic).not.toMatch(/dd-one|rc-act|rc-pic|dd-list/);
    expect(renderToStaticMarkup(el(D, { ...props, layout: 'one', card: null }))).toMatch(/^<section class="dd"/);
  });
});

describe('the Footle screen', () => {
  const src = read('src/games/FootballWordle.jsx');
  it('hands the played rows to the card, graded by the one grader', () => {
    expect(src).toMatch(/const picture = \(\s*<div className="wd-cg" style=\{\{ "--wd-cols": answer\.length \}\}>\s*\{state\.guesses\.map\(\(gs, r\) => \{\s*const grades = gradeWordleGuess\(gs, answer\);/);
    expect(src).toContain('layout="one"');
  });
  it('does not draw the board once the result is up, and keeps it while the last row turns', () => {
    expect(src).toMatch(/\{!\(state\.status !== "playing" && revealed\) && \(\s*<div className=\{`wd-grid\$\{state\.status !== "playing" \? " wd-grid--ended" : ""\}`\}/);
  });
  it('a finished board gives Enter back to the page (Share, the list, Back to Home)', () => {
    expect(src).toMatch(/const onKeyDown = \(e\) => \{\s*if \(!playingRef\.current\) return;/);
    expect(src).toContain('playingRef.current = state.status === "playing";');
  });
  it("the header's countdown box and its one-second clock are gone", () => {
    expect(src).not.toMatch(/wd-countdown|setCountdown|setInterval\(tick, 1000\)/);
  });
});
