// The Footle finish as ONE object (24 Nov 2026).
//
// Alex on the finish he had: "thrown together … a divorced couple". The result
// was on screen twice (the board, then a green card) and a framed panel sat
// under it with a solid button, a note, a link, a framed "Next up" card and two
// chips. He steered eight drawn rounds and then said "Yes, build Footle". These
// pin what was agreed, and that only Footle changed: the picture and action
// slots on ResultCard and the "one" layout on DailyDone are things a host asks
// for, and no other host does.
//
// ROUND TWO, THE SAME DAY. Alex scored that build 4 to 5 and chose a second
// drawing ("best so far"): the header names the game once and carries the
// streak, the card starts at the score and carries the XP, the caption says
// when the next puzzles come, every row ends in the same soft Play, and Back to
// Home is a quiet filled pill. The tests below say which rule each one pins.
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ResultCard } from '../../src/components/ResultCard.jsx';
import { ShareSheet } from '../../src/components/ShareSheet.jsx';
import { StreakChip } from '../../src/components/StreakChip.jsx';
import ResultFoot from '../../src/components/ResultFoot.jsx';
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
    for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/Top10.jsx', 'src/screens/MysteryPlayer.jsx']) {
      const src = read(f);
      expect(src, f).not.toMatch(/layout="one"/);
      expect(src, f).not.toMatch(/\bpicture[:=]/);
    }
    expect(read('src/games/FootballWordle.jsx')).toContain('layout="one"');
    // The Daily 7 joined the layout in round two (tests/unit/daily7-finish.test.js); its card has the
    // seven marks, not a picture of its own.
    const d7 = read('src/screens/ResultsScreen.jsx');
    expect(d7).toContain('layout="one"');
    expect(d7).not.toMatch(/\bpicture[:=]/);
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
  it('the list is one filled block with no outline; Play is the soft pill of Home\'s daily rows, never solid green', () => {
    const list = rule(dd, '.dd-list');
    expect(list).toContain('background:var(--s1)');
    expect(list).toContain('border-radius:20px');
    expect(list).not.toMatch(/border:|box-shadow|outline/);
    expect(rule(dd, '.dd-li')).toContain('min-height:60px');
    expect(rule(dd, '.dd-li')).toContain('border:0');
    // Round two: a 16% tint of the row's own colour, its ring at 45%, its text in the colour.
    // The same values as Home's pill (app.css, .todays-seven-secondary.is-mode .t7s-cta).
    const go = rule(dd, '.dd-li-go');
    for (const s of ['height:34px', 'padding:0 16px', 'border-radius:999px', 'background:rgba(var(--dd-rgb,88,204,2),0.16)', 'box-shadow:inset 0 0 0 1px rgba(var(--dd-rgb,88,204,2),0.45)', 'color:var(--dd-c,var(--accent))', 'font-size:13.5px', 'font-weight:800']) expect(go, s).toContain(s);
    expect(go).not.toMatch(/background:var\(--accent\)|--grn-ink/);
    const home = read('src/app.css');
    expect(home).toContain('.todays-seven-secondary.is-mode .t7s-cta{padding:9px 16px;font-size:13.5px;background:rgba(var(--mode-rgb),0.16);color:var(--mode);-webkit-text-fill-color:var(--mode);border:1px solid rgba(var(--mode-rgb),0.45);}');
    // no chevron rows any more: no row is bigger than another
    expect(dd).not.toContain('.dd-li-chev');
    // and nothing in the layout's own rules is solid green
    const mine = dd.slice(dd.indexOf('THE FINISH AS ONE OBJECT'), dd.indexOf('THE SHARE SHEET'));
    expect(mine).not.toMatch(/background:var\(--accent\)/);
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
  // What the Footle screen hands over (FootballWordle.jsx, footleCard): a win says who it was
  // as the card's line, a loss says "Out of guesses" under the name.
  const card = { title: 'Footle', tag: 'No. 204', score: 3, outOf: 6, verdict: 'Brilliant', sub: null, note: 'The answer was Joe Bennett', pinSub: true, xp: 48, picture: el('div', { className: 'wd-cg' }) };
  const lost = { ...card, score: null, verdict: 'Wesley Sneijder', sub: 'Out of guesses', note: null, xp: 10 };
  const props = { game: 'footle', edition: 204, won: true, bucket: 3, streak: { count: 1, label: 'daily streak', keepsOnLoss: true }, nextUp: NEXT, day: DAY, card, layout: 'one', onShare: async () => {} };
  const render = (D, p) => renderToStaticMarkup(el(D, { ...props, ...p }));

  it('a win: the picture and "Share my 3/6" on the card; no panel, no crossed swords, no second button', async () => {
    const html = render(await load());
    expect(html).toMatch(/<div class="rc-pic"><div class="wd-cg"><\/div><\/div><p class="rc-note">The answer was Joe Bennett<\/p><button type="button" class="rc-act" aria-haspopup="dialog" aria-expanded="false"><svg[^>]*lucide-share[^>]*>.*?<\/svg>Share my 3\/6<\/button><\/section>/);
    expect(html).not.toContain('<section class="dd"');
    expect(html).not.toMatch(/lucide-swords|class="dd-share"|dd-share-note|dd-share-alts|class="dd-up[ "]|dd-chip|dd-hr|dd-well/);
    expect(html).toContain('<section class="dd-one"');
    expect((html.match(/<button/g) || []).length).toBe(1 + NEXT.length);     // Share, and the list's rows
  });
  it('a loss: "Share my result", the name as the headline, "Out of guesses" and then the XP under it', async () => {
    const html = render(await load(), { won: false, bucket: 0, card: lost });
    expect(html).toContain('Share my result</button>');
    expect(html).toContain('<div class="rc-hero is-name"><div class="rc-say"><div class="rc-v">Wesley Sneijder</div><div class="rc-sub">Out of guesses</div><div class="rc-xp">+10 XP</div></div></div>');
    expect(html).not.toContain('rc-note');
    expect(text(html)).not.toContain('Win the day back');                    // Alex, 24 Nov: "just scrap win today back so it is one line"
  });
  it('round two: the card has no top line here (the header names the game), and carries the XP', async () => {
    const html = render(await load());
    expect(html.startsWith('<section class="rc is-bare" aria-label="Footle: 3 out of 6"><div class="rc-hero is-foot"><div class="rc-num"><b>3</b><span>/6</span></div><div class="rc-say"><div class="rc-v">Brilliant</div><div class="rc-xp">+48 XP</div></div></div>')).toBe(true);
    expect(html).not.toContain('rc-eye');
    expect(html).not.toContain('balliq.app');
    // the XP is said once on the screen: on the card, and not in the caption
    expect(html.match(/\+48 XP/g).length).toBe(1);
    expect(html).not.toMatch(/dd-cap-xp|dd-xp/);
    // a card with nothing earned says nothing
    expect(render(await load(), { card: { ...card, xp: 0 } })).not.toContain('XP');
  });
  it('the caption: "Today 1 of 4" on the left, when the next puzzles come on the right; no streak, no XP', async () => {
    const html = render(await load());
    expect(html).toMatch(/<div class="dd-cap"><span class="dd-cap-day"><b>Today<\/b> 1 of 4<\/span><span class="dd-cap-r">New puzzles in <b class="dd-num">(?:\d+h )?\d+m<\/b><\/span><\/div>/);
    expect(html).not.toMatch(/dd-cap-st|lucide-flame|Day 1 streak|Tomorrow makes it/);
    // a lost puzzle that kept the streak still says so, in the same place
    const safe = render(await load(), { won: false, bucket: 0, card: lost, streak: { count: 3, label: 'daily streak', keepsOnLoss: true } });
    expect(safe).toMatch(/<span class="dd-cap-r"><b>Streak safe<\/b> · new puzzles in <b class="dd-num">(?:\d+h )?\d+m<\/b><\/span>/);
    // a page with no day to count (the static Footle page) has the countdown alone
    expect(render(await load(), { day: undefined, nextUp: [] })).toMatch(/<div class="dd-cap"><span class="dd-cap-r">New puzzles in /);
    expect(rule(read('src/components/dailyDone.css'), '.dd-cap-r:only-child')).toContain('margin-left:0');
  });
  it('the list: Play on EVERY row, the same pill; a started game says Continue; no chevrons', async () => {
    const D = await load();
    const html = render(D);
    const rows = html.match(/<button class="dd-li"[\s\S]*?<\/button>/g);
    expect(rows.length).toBe(3);
    // One short line a row: no minutes, and nothing about winning the day back.
    expect(text(rows[0])).toBe("Today's Daily 7 7 questions Play");
    expect(rows[0]).toContain('<span class="dd-li-h">7 questions</span>');
    expect(text(rows[1])).toBe('Transfer Trail Whose career? Play');
    expect(text(rows[2])).toBe('Top 10 Name all ten Continue');              // NEXT's Top 10 is started
    for (const r of rows) {
      expect((r.match(/<span class="dd-li-go">/g) || []).length).toBe(1);
      expect(r.endsWith('</span></button>')).toBe(true);
      expect(r).not.toMatch(/chevron/);
    }
    // each in its own game's colour, from the row
    expect(rows[0]).toContain('--dd-rgb:255,170,0;--dd-c:#FFC107');
    expect(rows[1]).toContain('--dd-rgb:78,168,222;--dd-c:#7CC3F0');
    expect(rows[2]).toContain('--dd-rgb:255,138,101;--dd-c:#FF9B7A');
    const cont = render(D, { nextUp: NEXT.slice(2) });
    expect(text(cont.match(/<button class="dd-li"[\s\S]*?<\/button>/)[0])).toBe("Today's Top 10 Name all ten Continue");
    // a link on the static pages stays a link
    const web = render(D, { nextUp: [{ key: 'trail', name: 'Transfer Trail', href: '/transfer-trail/' }] });
    expect(web).toMatch(/<a class="dd-li"[^>]*href="\/transfer-trail\/"/);
    expect(read('src/components/DailyDone.jsx')).not.toMatch(/ChevronRight|dd-li-chev/);
  });
  it('the reminder has one place, under the list: in words at first, then words with the bell, then the hour it is set for', async () => {
    // 25 Nov 2026: the ask in words is a quiet line, the save line's twin (the words at the left, a
    // small filled pill at the right), not the wide yellow bar it was for four days. It is still a
    // labelled control with the same handler: the pill says what the tap does.
    const first = render(await load(), { remind: { state: 'off', onRemind() {} } });
    expect(first).toMatch(/<\/div><\/div><div class="dd-g"[^>]*><div class="dd-line is-ask"><span>Remind me each day at [^<]+<\/span><button type="button" class="dd-pill" aria-label="Turn on a daily reminder at [^"]+" title="One nudge a day, only if you haven&#x27;t played\. Off any time\.">Turn on<\/button><\/div>/);
    expect(first).not.toContain('class="dd-bell"');
    expect(first).not.toContain('class="dd-remind"');
    {
      const dd = read('src/components/dailyDone.css');
      // no yellow under the card: the bar's rule for this layout is gone, and the pill is the Save pill
      expect(dd).not.toContain('.dd-one .dd-remind');
      expect(rule(dd, '.dd-one .dd-pill')).toBe('.dd-one .dd-pill{min-height:34px;padding:0 15px;border:0;font-size:13.5px;font-weight:700;letter-spacing:0;');
      expect(rule(dd, '.dd-pill')).toContain('background:var(--s2);color:var(--t1)');
      // the same tap as before: the handler that sends dd-remind, and the effect that sends dd-remind-offer
      const src = read('src/components/DailyDone.jsx');
      expect(src).toContain('<button type="button" className="dd-pill" disabled={busy} onClick={doRemind} aria-label={t("dd.remindAria", { h: reminderHourLabel() })} title={t("dd.remindTitle")}>{t("dd.remindOn")}</button>');
      expect(src).toContain('setBusy(true); track?.("dd-remind", { game });');
      expect(src).toContain('if (askInWords) noteOfferShown({ seen: offerDays, game, edition, track });');
      expect(en['dd.remindOn']).toBe('Turn on');
      expect(es['dd.remindOn']).toBe('Activar');
    }
    // after five days of offers: the same words, quiet, with the bell beside them
    const later = render(await load({ biq_remind_offer: '9:1' }), { remind: { state: 'off', onRemind() {} } });
    expect(later).toMatch(/<div class="dd-line"><span>Remind me each day at [^<]+<\/span><button type="button" class="dd-bell" aria-label="Turn on a daily reminder at [^"]+" title="[^"]+"><svg[^>]*lucide-bell/);
    expect(later).not.toMatch(/dd-remind|is-ask/);
    // once set: the hour, said
    const on = render(await load(), { remind: { state: 'on', onRemind() {} } });
    expect(on).toMatch(/<div class="dd-line is-set"><span><svg[^>]*lucide-bell[^>]*>.*?<\/svg>Reminder set for [^<]+<\/span><\/div>/);
    expect(on).not.toMatch(/dd-bell|dd-remind|is-ask/);
    // an old puzzle, or a host with no reminder at all, has no reminder line
    expect(render(await load(), { isArchive: true, remind: { state: 'off', onRemind() {} } })).not.toMatch(/dd-bell|dd-remind|is-ask/);
    expect(render(await load())).not.toMatch(/lucide-bell/);
    // none of it is in the caption
    for (const h of [first, later, on]) expect(h.match(/<div class="dd-cap">[\s\S]*?<\/div>/)[0]).not.toMatch(/bell|Remind/);
  });
  it('nothing under the card is a solid green button', async () => {
    const D = await load();
    for (const p of [{}, { won: false, bucket: 0, card: lost }, { remind: { state: 'off', onRemind() {} }, save: { onSave() {}, line: '48 XP' }, promoted: { game: 'footle', name: 'Non-League' } }, { nextUp: [] }]) {
      const html = render(D, p);
      const under = html.slice(html.indexOf('<section class="dd-one"'));
      expect(under).not.toMatch(/class="dd-share"|btn-3d|dd-up-go|dd-next-go|t7s-cta/);
      // every button under the card is a list row, the reminder (a small pill, or the bell), or the small Save
      for (const b of under.match(/<button[^>]*class="([^"]+)"/g) || []) expect(b).toMatch(/class="(dd-li|dd-bell|dd-pill|dd-league is-flat|dd-share-alt)"/);
    }
  });
  it('a promotion, a guest, the app badge: each keeps its line', async () => {
    const html = render(await load(), { promoted: { game: 'footle', name: 'Non-League' }, save: { onSave() {}, line: '48 XP' }, GetAppCTA: () => el('b', null, 'badge') });
    expect(html).toMatch(/<div class="dd-cap">.*?<\/div><div class="dd-promo" role="status"><span>Promoted to <strong>Non-League<\/strong><\/span><\/div><div class="dd-list">/);
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
    // An old Footle pays nothing, so the screen hands the card no XP (the card says what it is given).
    expect(read('src/games/FootballWordle.jsx')).toContain('xp: isArchive || !paysXp ? 0 : getFootleXP(won, state.guesses.length),');
    // The app says it pays; the static page passes no such thing, so its card claims no XP.
    expect(read('src/App.jsx')).toMatch(/const FOOTLE_SERVICES = \{\n[^\n]*\n\s*paysXp: true,/);
    expect(read('src/islands/footle.jsx')).not.toContain('paysXp');
    const html = render(await load(), { isArchive: true, card: { ...card, xp: 0 } });
    expect(html).toMatch(/<button type="button" class="rc-act"><svg/);       // no sheet: there is no link to send
    expect(html).not.toContain('dd-list');
    expect(html).not.toContain('XP');
    expect(html).not.toContain('<b>Today</b>');
    expect(html).toContain('<div class="dd-cap"><span class="dd-cap-r">An old puzzle — it doesn’t count toward tomorrow.</span></div>');
    // the card of an old puzzle: no XP, the verdict beside the score as it was, the answer under the rows
    expect(html).toContain('<div class="rc-hero"><div class="rc-num"><b>3</b><span>/6</span></div><div class="rc-say"><div class="rc-v">Brilliant</div></div></div>');
    expect(html).toContain('<p class="rc-note">The answer was Joe Bennett</p>');
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
    expect(src).toMatch(/const picture = \(\s*<div className=\{`wd-cg\$\{state\.guesses\.length >= 5 \? " is-tall" : ""\}`\} style=\{\{ "--wd-cols": answer\.length \}\}>\s*\{state\.guesses\.map\(\(gs, r\) => \{\s*const grades = gradeWordleGuess\(gs, answer\);/);
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
  // ── round two ──
  it('once the result is up the header carries the streak chip where "?" sits during play', () => {
    expect(src).toContain('const over = state.status !== "playing" && revealed;');
    expect(src).toMatch(/\{over \? <StreakChip streak=\{finishStreak\} won=\{state\.status === "won"\} isArchive=\{isArchive\} \/>\s*: onHowToPlay && \(\s*<button className="icon-btn" onClick=\{onHowToPlay\}/);
    // the chip and the panel are handed the one streak
    expect(src).toContain('streak={finishStreak}');
    expect((src.match(/computeFootleStreak\(date\)/g) || []).length).toBe(2);   // the chip's fallback, and the share card's
    // the game is still named once, by the header that was always there
    expect(src).toContain('<GameTitle no={getFootleNumber(date)}>Footle</GameTitle>');
  });
  it('the rules stay one tap away for a finished player: a quiet link at the foot, beside the report link', () => {
    expect(src).toMatch(/\{footleCard && \(onReport \|\| onHowToPlay\) && \(\s*<div className="wd-report-row">\s*\{onReport && <FootleReportButton[^>]*\/>\}\s*\{onHowToPlay && \(\s*<button type="button" className="wd-howto" onClick=\{onHowToPlay\} aria-label=\{t\("footle\.howTo"\)\}>\s*<CircleHelp[^>]*\/> \{t\("game\.howTo"\)\}/);
    const css = read('src/games/footle.css');
    const how = rule(css, '.wd-howto');
    for (const d of ['border:0', 'background:none', 'font-size:12px', 'color:var(--t3)', 'text-decoration:underline']) expect(how, d).toContain(d);
    expect(en['game.howTo']).toBe('How to play');
    expect(typeof es['game.howTo']).toBe('string');
  });
  it('the foot, in order: the install nudge, Back to Home as the pill, then the two quiet links', () => {
    const foot = src.slice(src.indexOf('layout="one"'), src.indexOf('{state.status === "playing" && (\n        <div className="wd-keyboard">'));
    const at = (x) => foot.indexOf(x);
    expect(at('{InstallBanner && <InstallBanner />}')).toBeGreaterThan(-1);
    expect(at('{InstallBanner && <InstallBanner />}')).toBeLessThan(at('<ResultFoot onHome={onBack} pill />'));
    expect(at('<ResultFoot onHome={onBack} pill />')).toBeLessThan(at('<div className="wd-report-row">'));
  });
  it('the finished header sits 6px closer to the card, and never during play or on a short phone', () => {
    const css = read('src/games/footle.css');
    expect(src).toContain('<div className={`wd-header${over ? " is-over" : ""}`}>');
    expect(rule(css, '.wd-header.is-over')).toContain('margin-bottom:-6px');
    expect(css).toContain('@media (max-height:700px){.wd-header.is-over{margin-bottom:0;}}');
    expect(rule(css, '.wd-header')).toBe('.wd-header{display:flex;align-items:center;gap:12px;');
  });
});

// ROUND TWO: the streak in the header.
describe('the streak chip (components/StreakChip.jsx)', () => {
  const dd = read('src/components/dailyDone.css');
  const chip = (p) => renderToStaticMarkup(el(StreakChip, p));
  it('a flame and "Day N streak", filled, with which streak it is as its title', () => {
    const html = chip({ streak: { count: 1, label: 'daily streak' } });
    expect(html).toMatch(/^<span class="dd-stk-slot"><span class="dd-stk" title="Day 1 of a daily streak"><svg[^>]*lucide-flame[^>]*>.*?<\/svg><span class="dd-stk-w">Day 1 streak<\/span><span class="dd-stk-n" aria-hidden="true">1<\/span><\/span><\/span>$/);
    expect(chip({ streak: { count: 12, label: 'Footle streak' } })).toContain('title="12-day Footle streak"');
    const css = rule(dd, '.dd-stk');
    for (const d of ['height:40px', 'padding:0 12px', 'border-radius:12px', 'background:var(--s1)', 'font-size:13.5px', 'font-weight:700', 'white-space:nowrap', 'font-variant-numeric:tabular-nums']) expect(css, d).toContain(d);
    expect(css).not.toMatch(/border:|outline|box-shadow/);                   // filled, never outlined
    expect(rule(dd, '.dd-stk > svg')).toContain('color:var(--gold)');
  });
  it('no streak, no chip', () => {
    for (const s of [undefined, null, { count: 0, label: 'daily streak' }, {}]) expect(chip({ streak: s })).toBe('');
  });
  it('the chip is the flame and the number unless its slot has room for the words; the words stay for a screen reader', () => {
    // The card no longer names the game, so the header must never lose "No. 204": the chip sits in a slot that
    // takes what the title leaves, is short by default, and shows its words only where the slot is wide enough.
    expect(rule(dd, '.dd-stk-slot')).toContain('flex:1 1 0;min-width:0;display:flex;justify-content:flex-end;container:stk / inline-size');
    expect(rule(dd, '.dd-stk-w')).toContain('position:absolute;width:1px;height:1px;overflow:hidden');
    expect(dd).toContain('@container stk (min-width:150px){.dd-stk:not(.has-sh){padding:0 14px;}.dd-stk:not(.has-sh) .dd-stk-w{position:static;');
    expect(dd).toContain('@container stk (min-width:186px){.dd-stk.has-sh{padding:0 14px;}.dd-stk.has-sh .dd-stk-w{position:static;');
    expect(dd).not.toContain('@media (max-width:359px){.dd-stk');
    expect(rule(dd, '.dd-hd-t')).toContain('flex:0 1 auto');
    expect(read('src/games/footle.css')).toContain('.wd-header.is-over .wd-header-text{flex:0 1 auto;}');
    expect(rule(dd, '.dd-stk-n')).toContain('display:inline');
    expect(rule(dd, '.dd-stk')).toContain('position:relative');
  });
  // 25 Nov 2026. For a day the flame became a shield on a lost puzzle that kept the streak, so with a
  // shield banked the chip read: shield, number, shield. The chip's first icon is the flame, always;
  // "Streak safe" is said in the caption under the card, and the banked shields keep their own place.
  it('the first icon is always the flame: a lost puzzle that kept the streak does not turn it into a shield', () => {
    const lostKept = chip({ streak: { count: 3, label: 'daily streak', keepsOnLoss: true }, won: false });
    expect(lostKept).toMatch(/^<span class="dd-stk-slot"><span class="dd-stk" title="3-day daily streak"><svg[^>]*lucide-flame[^>]*>.*?<\/svg><span class="dd-stk-w">Day 3 streak<\/span><span class="dd-stk-n" aria-hidden="true">3<\/span><\/span><\/span>$/);
    expect(lostKept).not.toContain('lucide-shield-check');
    // the state Alex saw: lost, streak kept, a shield banked. Flame, number, then the one banked shield.
    const withShield = chip({ streak: { count: 5, label: 'daily streak', keepsOnLoss: true, shields: 1 }, won: false });
    const icons = (withShield.match(/lucide-(flame|shield-check)/g) || []);
    expect(icons).toEqual(['lucide-flame', 'lucide-shield-check']);
    expect(withShield).toMatch(/<svg[^>]*lucide-flame[^>]*>.*?<\/svg><span class="dd-stk-w">Day 5 streak<\/span><span class="dd-stk-n" aria-hidden="true">5<\/span><span class="dd-shields"/);
    for (const p of [{ streak: { count: 1, label: 'daily streak', keepsOnLoss: true }, won: false }, { streak: { count: 3, label: 'Footle streak' }, won: false }, { streak: { count: 3, label: 'daily streak', keepsOnLoss: true }, won: true }, { streak: { count: 3, label: 'daily streak', keepsOnLoss: true }, won: false, isArchive: true }]) {
      const h = chip(p);
      expect(h).toContain('lucide-flame');
      expect(h).not.toContain('lucide-shield-check');
    }
    // the words that say the streak survived a loss are the caption's (DailyDone.jsx), not an icon here
    expect(read('src/components/StreakChip.jsx').replace(/^\s*\/\/.*$/gm, '')).not.toMatch(/keepsOnLoss|\bwon\b/);
    expect(read('src/components/DailyDone.jsx')).toContain('streakSafe ? rich(t("dd.safe"), { safe: <b>{t("dd.safeWord")}</b>, ko: koEl })');
  });
  it('banked shields ride the chip, counted from two up, and never on an old puzzle', () => {
    const one = chip({ streak: { count: 5, label: 'daily streak', shields: 1 } });
    expect(one).toMatch(/<span class="dd-shields" role="img" aria-label="1 streak shield banked: each covers one missed day" title="Each shield covers one missed day"><svg[^>]*lucide-shield-check[^>]*>.*?<\/svg><\/span><\/span><\/span>$/);
    expect(one).toContain('class="dd-stk has-sh"');
    const three = chip({ streak: { count: 5, label: 'daily streak', shields: 3 } });
    expect(three).toMatch(/aria-label="3 streak shields banked: each covers one missed day"[^>]*><svg[^>]*>.*?<\/svg>3<\/span><\/span><\/span>$/);
    expect((three.match(/lucide-shield-check/g) || []).length).toBe(1);
    expect(chip({ streak: { count: 5, label: 'daily streak', shields: 3 }, isArchive: true })).not.toContain('dd-shields');
    expect(chip({ streak: { count: 5, label: 'daily streak', shields: 0 } })).not.toContain('dd-shields');
  });
  it('speaks Spanish through the same keys, and adds no string of its own', () => {
    const src = read('src/components/StreakChip.jsx').replace(/^\s*\/\/.*$/gm, '');
    expect(src.match(/t\("([^"]+)"/g).map((x) => x.slice(3, -1)).sort()).toEqual(['dd.capStreak', 'dd.l.none', 'dd.shieldTitle', 'dd.shieldsAria', 'dd.streak1', 'dd.streakN']);
    for (const k of ['dd.capStreak', 'dd.streak1', 'dd.streakN', 'dd.shieldTitle']) { expect(typeof en[k], k).toBe('string'); expect(typeof es[k], k).toBe('string'); }
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);          // lucide only
  });
});

// ROUND TWO: the way out.
describe('Back to Home as a quiet filled pill (components/ResultFoot.jsx, `pill`)', () => {
  it('centred, filled, 40 tall, no outline; not the full-width outlined bar and not a bare link', () => {
    const html = renderToStaticMarkup(el(ResultFoot, { onHome() {}, pill: true }));
    expect(html).toBe('<div style="margin-top:18px;display:flex;justify-content:center"><button type="button" style="height:40px;padding:0 22px;border-radius:999px;border:0;background:var(--s2);color:var(--t1);-webkit-text-fill-color:var(--t1);font-weight:700;font-size:14px;line-height:1;font-family:inherit;cursor:pointer">Back to Home</button></div>');
    expect(html).not.toMatch(/width:100%|1px solid|underline|background:(none|transparent)/);
  });
  it('with no way out there is no pill, and it never draws the report link itself', () => {
    expect(renderToStaticMarkup(el(ResultFoot, { pill: true }))).toBe('');
    expect(renderToStaticMarkup(el(ResultFoot, { pill: true, onHome() {}, thing: 'Answer', info: { id: 1 }, onReport() {} }))).not.toContain('Tell us');
  });
  it('every other host keeps the bar it had', () => {
    const html = renderToStaticMarkup(el(ResultFoot, { onHome() {} }));
    expect(html).toContain('width:100%;min-height:46px');
    expect(html).toContain('border:1px solid var(--border)');
    for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/Top10.jsx']) expect(read(f), f).not.toMatch(/<ResultFoot[^>]*\bpill\b/);
  });
});

// 24 Nov 2026, after six real plays on production in English and four in Spanish.
describe('what the live plays and Alex\'s first look changed', () => {
  const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
  it('the card says the number in the player\'s language, as the header does', () => {
    expect(src('games/FootballWordle.jsx')).toContain('title: "Footle", tag: t("game.no", { n: getFootleNumber(date) }),');
    expect(src('games/FootballWordle.jsx')).not.toMatch(/tag: `No\. /);
  });
  it('five or six rows on a short phone: the tiles step down to 40px so the list stays on the first screen', () => {
    const css = src('games/footle.css');
    expect(css).toMatch(/@media \(max-height:700px\)\{\.wd-cg\.is-tall \.wd-cg-row\{grid-template-columns:repeat\(var\(--wd-cols\),minmax\(0,40px\)\);\}/);
  });
  it('a list row is one short line: the hook without its minutes, and no "Win the day back" after a loss', () => {
    const dd = src('components/DailyDone.jsx');
    expect(dd).toContain('<span className="dd-li-h">{HOOK[m] ? t(`dd.hook.${m}`).split("·")[0].trim() : ""}</span>');
    expect(src('components/dailyDone.css')).not.toContain('.dd-seg');
    // Every hook is "what it is · how long", so the part before the dot stands alone.
    const en = src('i18n/en.js'); const es = src('i18n/es.js');
    for (const lang of [en, es]) for (const m of ['footle', 'daily7', 'trail', 'top10']) {
      const line = lang.match(new RegExp(`'dd\\.hook\\.${m}': '([^']*)'`))[1];
      expect(line.split('·').length, line).toBe(2);
      expect(line.split('·')[0].trim().length, line).toBeGreaterThan(3);
    }
  });
});
