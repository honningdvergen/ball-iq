import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LeagueTableView, LeagueCreateSheet, LeagueJoinSheet } from '../../src/screens/LeagueScreen.jsx';

/**
 * Mates' leagues, the screens: one solid button per surface, the banter only
 * on a final table, nothing about crowd size before joining, Lucide icons and
 * sentence case only. Drawn from fixtures (no network).
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const solids = (html) => (html.match(/class="lg-solid"/g) || []).length;
const h = React.createElement;

const MON = 20738; // Mon 12 Oct 2026
const rows = (final) => [
  { rank: 1, tied: false, name: 'Alex', is_me: false, points: 41, tens: 2, days: 5, joined_day: MON - 9, per_day: [8, 9, null, 7, 9, 8, null], labels: final ? ['crown'] : [] },
  { rank: 2, tied: true, name: 'Sam', is_me: true, points: 30, tens: 1, days: 4, joined_day: MON - 9, per_day: [10, null, 6, 7, 7, null, null], labels: [] },
  { rank: 2, tied: true, name: 'Kim', is_me: false, points: 30, tens: 1, days: 4, joined_day: MON - 9, per_day: [null, 9, 6, 7, 8, null, null], labels: [] },
  { rank: 4, tied: false, name: 'Jon', is_me: false, points: 22, tens: 0, days: 3, joined_day: MON - 9, per_day: [9, 9, 4, null, null, null, null], labels: final ? ['bottled'] : [] },
  { rank: 5, tied: false, name: 'Lee', is_me: false, points: 6, tens: 0, days: 1, joined_day: MON + 2, per_day: [null, null, 6, null, null, null, null], labels: final ? ['spoon'] : [] },
  { rank: 6, tied: false, name: 'Max', is_me: false, points: 0, tens: 0, days: 0, joined_day: MON, per_day: [null, null, null, null, null, null, null], labels: final ? ['ghost'] : [] },
];
const table = (final) => ({
  meta: { id: 'L1', name: 'The Lads', code: 'K7QM2XPA', tz: 'Europe/Oslo', week_start: MON, today: MON + 4, is_final: final, is_owner: true, my_joined_day: MON - 9, my_name: 'Sam' },
  rows: rows(final),
  last_week: { winners: ['Alex'], points: 214, week_start: MON - 7 },
});

describe('the league table', () => {
  it('live, with dailies open: one solid button, "Play today\'s", and no banter yet', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [{ key: 'trail', name: "Today's Transfer Trail" }] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/class="lg-solid"[^>]*>Play today/);
    expect(html).toContain('Final whistle Sun midnight (Oslo)');
    expect(html).not.toMatch(/Wooden spoon|Bottled it|Didn&#x27;t turn up|Didn't turn up/);
    expect(html).toContain('=2');                       // a shared rank
    expect(html).toContain('Last week: Alex won on 214');
  });

  // 18 Nov 2026: alone in a league the solid button was "Play today's" and
  // the invite a grey link. 12 of the first 14 leagues never got a second member.
  it('a league of one: the solid button invites, playing is the quiet one, and two seats wait', () => {
    const solo = { ...table(false), rows: [{ ...rows(false)[1], rank: 1, tied: false }], last_week: null };
    const html = renderToStaticMarkup(h(LeagueTableView, { data: solo, nextUp: [{ key: 'trail', name: "Today's Transfer Trail" }] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/class="lg-solid"[^>]*>(<svg[^>]*>.*?<\/svg>)? ?Invite a mate/);
    expect(html).toMatch(/class="lg-ghost"[^>]*>Play today/);
    // Two seats that say what they are and invite on a tap; the line that said it a third time is gone.
    expect((html.match(/<button type="button" class="lg-row is-seat"/g) || []).length).toBe(2);
    expect((html.match(/class="lg-seat-name">Waiting for a mate</g) || []).length).toBe(2);
    expect(html).not.toContain('Just you so far');
    // One invite button, no second row of buttons, and nobody is "first" in a league of one.
    expect(html).not.toMatch(/class="lg-tool"/);
    expect(html).not.toMatch(/Copy invite link/);
    expect(html).not.toMatch(/lg-rank is-first/);
    // The rules are laid out from the start, each with its game's mark; Leave is last.
    expect(html).toMatch(/class="lg-rules"><h2 class="lg-rules-title">How points work<\/h2>/);
    expect((html.match(/class="lg-mark[ "]/g) || []).length).toBe(5); // Footle, Trail, Daily 7, Top 10, and the day you skip
    // One mark a row: Footle and Transfer Trail each have their own (Alex: two marks side by side "looks really bad").
    expect((html.match(/<li><span class="lg-mark[^>]*>(?:F|<svg[^>]*>.*?<\/svg>)<\/span><span class="lg-help-text">/g) || []).length).toBe(5);
    expect(html).toMatch(/<strong>Footle<\/strong>/);
    expect(html).toMatch(/<strong>Transfer Trail<\/strong><span>Scored the same as Footle\.<\/span>/);
    // A seat's name for a screen reader carries the words on it.
    expect(html).toMatch(/class="lg-row is-seat" aria-label="Waiting for a mate\. Invite a mate"/);
    expect(html).not.toContain('Footle and Transfer Trail');
    expect(html).toMatch(/class="lg-mark is-f"[^>]*>F</);
    expect(html.indexOf('lg-leave')).toBeGreaterThan(html.indexOf('lg-rules'));
    // Nothing left to play: no quiet button, the invite stays the solid one.
    const done = renderToStaticMarkup(h(LeagueTableView, { data: solo, nextUp: [] }));
    expect(solids(done)).toBe(1);
    expect(done).not.toMatch(/lg-ghost/);
  });
  it('with mates in it, or once the week is final, there are no waiting seats and no quiet button', () => {
    for (const final of [false, true]) {
      const html = renderToStaticMarkup(h(LeagueTableView, { data: table(final), nextUp: [{ key: 'trail' }] }));
      expect(html).not.toMatch(/is-seat|lg-ghost/);
      // With mates: two outlined buttons, the rules shut until asked for, the leader in gold, Leave last.
      expect((html.match(/class="lg-tool"/g) || []).length).toBe(2);
      expect(html).toMatch(/class="lg-tool"[^>]*>(<svg[^>]*>.*?<\/svg>)?Copy invite link/);
      expect(html).toMatch(/aria-expanded="false"[^>]*>How points work/);
      expect(html).not.toMatch(/lg-rules/);
      expect(html).toMatch(/lg-rank is-first/);
      expect(html).toMatch(/class="lg-link lg-leave"/);
    }
    // A week that ended with one player: no seats to fill any more, and the plain line says why.
    const soloFinal = { ...table(true), rows: [{ ...rows(true)[0] }] };
    const sf = renderToStaticMarkup(h(LeagueTableView, { data: soloFinal, nextUp: [] }));
    expect(sf).not.toMatch(/is-seat|lg-ghost/);
    expect(sf).toContain('Just you so far');
  });
  it('leaving is asked with two real buttons, staying first', () => {
    const SRC = read('../../src/screens/LeagueScreen.jsx');
    expect(SRC).toMatch(/<button type="button" className="lg-pill" onClick=\{\(\) => setConfirmLeave\(false\)\}>\{t\("lg\.stay"\)\}<\/button>\s*<button type="button" className="lg-pill is-danger" onClick=\{leave\} disabled=\{busy\}>/);
    expect(read('../../src/screens/league.css')).toMatch(/\.lg-confirm-links \.lg-pill\{flex:1;min-height:46px;/);
    // While it is asked, the rules step aside and their button says so; alone, the rules need no button.
    expect(SRC).toContain('const helpOpen = alone || help;');
    expect(SRC).toContain('const rulesShown = helpOpen && !confirmLeave;');
    expect(SRC).toMatch(/setHelp\(confirmLeave \? true : !help\); setConfirmLeave\(false\); \}\} aria-expanded=\{rulesShown\}/);
  });

  it('live, all played: the solid button invites', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/Invite mates/);
  });

  it('final: one solid button to share it, and the labels as chips', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(true), nextUp: [{ key: 'trail' }] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/Share final table/);
    expect(html).toContain('Winner');
    expect(html).toContain('Wooden spoon');
    expect(html).toContain('Bottled it');
    expect(html).toMatch(/Didn(&#x27;|')t turn up/);
    expect(html).toContain('Final table');
  });

  it('a late joiner\'s days before joining are blank, not a miss', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [] }));
    const lee = html.slice(html.indexOf('>Lee<'), html.indexOf('>Max<'));
    expect((lee.match(/lg-cell is-before/g) || []).length).toBe(2);
  });

  it('a guest is told where their points live', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), isAnon: true, onSave: () => {} }));
    expect(html).toContain('Your points live on this phone');
    expect(solids(html)).toBe(1);
  });
});

describe('the sheets', () => {
  it('create: one solid button, the head-to-head name, the one line of rules', () => {
    const html = renderToStaticMarkup(h(LeagueCreateSheet, { seed: 'h2h_footle', vs: 'Alex', displayName: 'Sam' }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/value="Sam v Alex"/);
    expect(html).toContain('Points from today, Monday to Sunday. Anyone with the link can join.');
    expect(html).toMatch(/Create league/);
  });

  it('join: one solid button, the inviter and the name, and no crowd size', () => {
    const html = renderToStaticMarkup(h(LeagueJoinSheet, { token: 'K7QM2XPA.The%20Lads.Alex', displayName: 'Turbo Keeper 12' }));
    expect(solids(html)).toBe(1);
    expect(html).toContain('Alex invited you to');
    expect(html).toContain('The Lads');
    expect(html).toMatch(/Join league/);
    expect(html).not.toMatch(/\d+\s*(members|players|mates) /i);
  });

  it('a broken invite says so, with one way out', () => {
    const html = renderToStaticMarkup(h(LeagueJoinSheet, { token: 'nonsense' }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/doesn(&#x27;|'|’)t open a league/);
  });
});

describe('drawn, not decorated', () => {
  const SRC = ['../../src/screens/LeagueScreen.jsx', '../../src/components/LeagueHomeCard.jsx'].map(read).join('\n');
  const CSS = read('../../src/screens/league.css');
  it('Lucide icons, no emoji, no capitals by CSS', () => {
    expect(SRC).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{FE0F}]/u);
    expect(SRC).toMatch(/from "lucide-react"/);
    expect(CSS).not.toMatch(/text-transform:\s*uppercase/);
    expect(SRC).not.toMatch(/textTransform/);
  });
  it('the Home card has no solid button of its own', () => {
    expect(read('../../src/components/LeagueHomeCard.jsx')).not.toMatch(/lg-solid/);
  });
});

// 17 Nov 2026, Alex's recording of build 181: the league row arrived on Home a
// second after everything else and pushed the rows under it down; the sheet
// took the keyboard as it opened and jumped; a swipe to put it away scrolled
// Home behind it instead.
describe('the league row and its sheet sit still', () => {
  const CARD = read('../../src/components/LeagueHomeCard.jsx');
  const HOME = read('../../src/screens/HomeScreen.jsx');
  const SHEET = read('../../src/screens/LeagueScreen.jsx');
  const CSS = read('../../src/screens/league.css');
  const APP_CSS = read('../../src/app.css');
  it('Home holds the row\'s place while the card loads, and the card keeps it until the answer', () => {
    expect(HOME).toMatch(/<React\.Suspense fallback=\{leagueWait\}><LeagueHomeCard[^>]*wait=\{leagueWait\}/);
    // A member's empty box is only drawn when a remembered answer will fill it.
    expect(HOME).toMatch(/const leagueWait = leagueMember \? \(leagueSeen \? <div className="lg-home-wait" aria-hidden="true" \/> : null\)\s*: onStartLeague \? <LeagueStartRow/);
    expect(HOME).toMatch(/const leagueSeen = leagueMember && [^\n]*"biq_league_home"/);
    expect(CARD).toMatch(/useState\(\(\) => cachedLeagues\(\) \?\? undefined\)/);
    expect(CARD).toMatch(/if \(list === undefined\) return wait;/);
    expect(CARD).toMatch(/if \(!Array\.isArray\(list\)\) return isLeagueMember\(\) \? null : wait;/);
    // The placeholder is styled in the eager stylesheet (league.css is lazy),
    // and every league row on Home has the one bottom margin.
    expect(APP_CSS).toMatch(/\.home-mates > \.lg-home,\.home-mates > \.lg-solo,\.home-mates > \.lg-home-wait\{margin-bottom:8px;\}/);
    expect(APP_CSS).toMatch(/\.lg-home-wait\{min-height:72px;/);
    // ...and every form of the row is as tall as the Start row it can replace.
    expect(APP_CSS).toMatch(/\.home-mates > \.lg-home,\.home-mates > \.lg-solo,\.home-mates > \.lg-home-wait\{min-height:76px;\}/);
    expect(CSS).toMatch(/\.lg-home\{[^}]*min-height:72px/);
    expect(CSS).toMatch(/\.lg-solo\{[^}]*min-height:72px/);
    // On a phone the Start row is 68 (the plain card, 24 Nov 2026), so the league rows are 68 there too.
    expect(APP_CSS).toMatch(/\.home-mates > \.mp-row,\.home-mates > \.mp-row:last-child\{[^}]*min-height:68px;\}/);
    expect(APP_CSS).toMatch(/@media \(max-width: 1023px\)\{[^@]*\.home-mates > \.lg-home,\.home-mates > \.lg-solo,\.home-mates > \.lg-home-wait\{min-height:68px;\}/);
  });
  it('the create sheet opens at rest: no field takes the focus', () => {
    expect(SHEET).toMatch(/onClose=\{close\} calm=\{!made\}>/);
    expect(SHEET).toMatch(/useModalA11y\(\{ isOpen: true, onClose, ref, focusContainer: calm \}\)/);
    expect(SHEET).not.toMatch(/autoFocus/);
  });
  it('a drag on the sheet or the dimmed page pans nothing, and a sheet that overflows pans itself', () => {
    expect(CSS).toMatch(/\.lg-scrim\{[^}]*touch-action:none;\}/);
    expect(CSS).toMatch(/\.lg-sheet\{[^}]*touch-action:none;overscroll-behavior:contain;\}/);
    expect(CSS).toMatch(/\.lg-sheet\.can-scroll,\.lg-scrim\.is-full \.lg-sheet\{touch-action:pan-y;\}/);
  });
  it('a bottom sheet slides up solid: the scrim dims by colour, never by opacity', () => {
    expect(CSS).toMatch(/\.lg-scrim\{[^}]*animation:lg-dim /);
    expect(CSS).toMatch(/@keyframes lg-dim\{from\{background-color:rgba\(0,0,0,0\);\}\}/);
    expect(CSS).toMatch(/@keyframes lg-up\{from\{transform:translateY\(100%\);\}\}/);
    expect(CSS).toMatch(/\.lg-scrim\.is-full\{animation-name:lg-fade;\}/);
  });
  it('the swipe never cancels a touch, so a tap on a button always lands', () => {
    const sheet = SHEET.slice(SHEET.indexOf('function Sheet('), SHEET.indexOf('// ── CREATE AND INVITE'));
    expect(sheet).toMatch(/const swipe = !full && !scrolls;/);
    expect(sheet).not.toMatch(/\.preventDefault\(/);
    expect(sheet).toMatch(/closest\?\.\("input, textarea, select"\)/);
  });
});

// 17 Nov 2026, the emulator walk of build 66: with the keyboard up the "Start
// a league" sheet was a 149 px strip and Create was out of view. Android had
// already taken the keyboard off the window (915 to 527) and the sheet took it
// off again (336).
describe('the sheet lifts by what the keyboard still covers, not by its height', () => {
  it('the numbers from the walk, and the platforms that do not resize', async () => {
    const { keyboardCover, keyboardLine } = await import('../../src/lib/useKeyboardAwareInput.js');
    // Android, window already resized: the line is the window's own bottom, nothing left to lift by.
    expect(keyboardCover(527, keyboardLine(527, 915, 336), 336)).toBe(0);
    // Android, the keyboard reported a moment before the resize lands: lift now, drop it on the resize.
    expect(keyboardCover(915, keyboardLine(915, 915, 336), 336)).toBe(336);
    // iOS never resizes: the whole keyboard.
    expect(keyboardCover(852, 852 - 336, 336)).toBe(336);
    // The web: the visual viewport's bottom edge.
    expect(keyboardCover(800, 480, 320)).toBe(320);
    // No keyboard: nothing, whatever the browser's own bars are doing.
    expect(keyboardCover(800, 760, 0)).toBe(0);
    // Never more than the keyboard, never negative.
    expect(keyboardCover(900, 400, 336)).toBe(336);
    expect(keyboardCover(500, 527, 336)).toBe(0);
  });
  it('the sheet uses it for both the lift and the cap, and draws again on a resize', () => {
    const SHEET = read('../../src/screens/LeagueScreen.jsx');
    const sheet = SHEET.slice(SHEET.indexOf('function Sheet('), SHEET.indexOf('// ── CREATE AND INVITE'));
    expect(sheet).toMatch(/const kbInset = typeof window === "undefined" \? 0 : keyboardCover\(window\.innerHeight, visibleBottom\(kbHeight\), kbHeight\);/);
    expect(sheet).toMatch(/window\.addEventListener\("resize", resized\)/);
    expect(sheet).toMatch(/style=\{kbInset \? \{ paddingBottom: kbInset \} : undefined\}/);
    expect(sheet).toMatch(/maxHeight: `calc\(92vh - \$\{kbInset\}px\)`/);
  });
});

describe('the results panel', () => {
  const DD = read('../../src/components/DailyDone.jsx');
  it('sends the league result for a live puzzle only, before the daily record\'s await, without awaiting it', () => {
    const block = DD.slice(DD.indexOf('if (!isArchive) {'), DD.indexOf('await recordDailyResult('));
    expect(block).toMatch(/import\("\.\.\/lib\/leagueResults\.js"\)\.then\(\(m\) => m\.recordLeagueResult\(\{ game, edition, bucket, won \}\)\)/);
    expect(block).not.toMatch(/await import/);
    // Phase 2 (29 Oct 2026): the native shell sends results too.
    expect(block).not.toMatch(/isNativeShell/);
  });
  it('the league offer is one quiet pill under the share, never a second solid button, and waits for a head-to-head', () => {
    // 12 Nov 2026: with no rival the offer is off this panel (296 shows to 80
    // people, no tap outside our own testing); the solid button sends the
    // puzzle to a mate instead, and the plain result is one quiet link.
    // "Make it a league?" (dd.league) with a rival; "Start a league with your
    // mates" (dd.leagueStart) for anyone not yet in one. 7 Nov 2026: the
    // underlined 12.5px line was tapped 0 times in 178 shows, so it is now a
    // full-width hairline pill (dd-league), still no fill.
    // 10 Nov 2026: still a hairline BUTTON, but compact and first in the row of
    // quiet options (two full-width bars under each other read as clutter).
    expect(DD).toMatch(/className="dd-league" onClick=\{makeLeague\}>\s*<Users[^>]*\/> \{t\(rival \? "dd\.league" : "dd\.leagueShort"\)\}/);
    expect(DD.indexOf('className="dd-share-alts"')).toBeLessThan(DD.indexOf('className="dd-league"'));
    expect(read('../../src/components/dailyDone.css')).toMatch(/\.dd-league\{[^}]*border:1px solid var\(--border2\);background:var\(--s2\)/);
    expect((DD.match(/className="dd-share"/g) || []).length).toBe(3); // Send it back | Send it to a mate | Share result
    expect(DD).toMatch(/const leagueOffer = leagueGame && !!rival;/);
    expect(DD).toMatch(/className="dd-share" onClick=\{doChallenge\}>\s*<Swords[^>]*\/> \{t\([^)]*"dd\.sendMate"\)\}/);
    expect(DD).not.toMatch(/wa\.me/);
    expect(DD).not.toMatch(/isNativeShell/);
  });
});

describe('the open table keeps up (10 Nov 2026)', () => {
  it('reads the table again when the app comes back to the foreground, without a loading flash', () => {
    const src = read('../../src/screens/LeagueScreen.jsx');
    const m = src.match(/const onVis = \(\) => \{[\s\S]*?\};\n/);
    expect(m, 'a visibility handler in LeagueScreen').toBeTruthy();
    expect(m[0]).toContain('document.visibilityState !== "visible"');
    expect(m[0]).toContain('getLeagueTable(leagueId)');
    expect(m[0]).toContain('setData(t)');
    expect(m[0]).not.toContain('setState("loading")');
    expect(src).toContain('document.removeEventListener("visibilitychange", onVis)');
  });
});
