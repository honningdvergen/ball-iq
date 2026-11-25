// Home, 25 Nov 2026 (a proposal, in a commit of its own): the lower half is
// drawn by the kit of the top half. Quiz is a row in a plain card under the
// finder; Top 10 lists, the Ballpark preview row, Draft, Mystery Player and
// Survival are rows of ONE plain card under "More modes" (Alex's order: "let us
// put the best modes to the top"), each with its icon well in its own colour
// and, at its end, the grey arrow of the mates rows (Alex chose it over the soft
// pill; Quiz keeps its pill). Nothing is outlined, and every tap goes where it
// went. Hot Streak has no row on Home any more; the mode itself is untouched.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
const HOME = read('screens/HomeScreen.jsx');
const CSS = read('app.css');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-home-nav.golden.json', import.meta.url)), 'utf8'));
const GUEST = GOLDEN['home: guest, nothing played, Top 10 day (Mystery as a side row)'];
// A card's own markup: from its opening tag to the first </div> (a card holds buttons only).
const cards = (markup) => [...markup.matchAll(/<div class="home-list">(.*?)<\/div>/g)].map((m) => m[1]);
const rows = (card) => [...card.matchAll(/<button type="button" class="(todays-seven-secondary mp-row[^"]*)"(?: [^>]*)?>.*?<\/button>/g)];
const names = (card) => [...card.matchAll(/<span class="t7s-name">([^<]*)<\/span>/g)].map((m) => m[1]);
const pills = (card) => [...card.matchAll(/<span class="t7s-cta">([^<]*)<\/span>/g)].map((m) => m[1]);
const arrows = (card) => (card.match(/<span class="mp-row-chev" aria-hidden="true"><svg [^>]*lucide-chevron-right[^>]*><\/svg><\/span><\/button>/g) || []).length;

describe('the lower half of Home is two plain cards of rows', () => {
  it('Quiz is one row in a card of its own, under the finder', () => {
    const [quiz] = cards(GUEST);
    expect(names(quiz)).toEqual(['Quiz']);
    expect(pills(quiz)).toEqual(['Play']);
    expect(GUEST.indexOf('class="club-finder"')).toBeLessThan(GUEST.indexOf('<div class="home-list">'));
    expect(GUEST.indexOf('<div class="home-list">')).toBeLessThan(GUEST.indexOf('>More modes</div>'));
  });
  it('More modes is ONE card, best first: Top 10 lists, Draft, Mystery Player, Survival, each ending in the arrow', () => {
    const all = cards(GUEST);
    expect(all).toHaveLength(2);
    expect(GUEST).toContain('<div class="home-section-title">More modes</div><div class="home-list">');
    expect(names(all[1])).toEqual(['Top 10 lists', 'Draft', 'Mystery Player', 'Survival']);
    expect(pills(all[1])).toEqual([]);
    expect(arrows(all[1])).toBe(4);
    expect(rows(all[1])).toHaveLength(4);
    // The Quiz row keeps its pill and has no arrow.
    expect(arrows(all[0])).toBe(0);
    // Every row of the card is a row: nothing else sits between them.
    expect(all[1].replace(/<button type="button" class="todays-seven-secondary mp-row[^"]*"(?: [^>]*)?>.*?<\/button>/g, '')).toBe('');
  });
  it('each mode keeps its own colour; no row is outlined or lit, Draft included', () => {
    const more = cards(GUEST)[1];
    expect(more).toContain('style="--mode:#FF8FB8;--mode-rgb:255,120,170"');
    expect(more).toContain('style="--mode:#FF9B7A;--mode-rgb:255,138,101"');
    expect(more).toContain('style="--mode:#B9A5FF;--mode-rgb:139,108,240"');
    for (const markup of Object.values(GOLDEN)) for (const card of cards(markup)) expect(card).not.toMatch(/border:|linear-gradient|box-shadow|margin-bottom/);
    expect(HOME).not.toMatch(/1\.5px solid rgba\(\$\{MODE_RGB\.draft\}/);
  });
  it('NEW and PREVIEW are the small tag, in the row\'s colour', () => {
    expect(cards(GUEST)[1].match(/<span class="t7s-tag">NEW<\/span>/g)).toHaveLength(2);
    expect(HOME).toContain('<span className="t7s-tag">{t("home.ballpark.tag")}</span>');
    expect(CSS).toMatch(/\.t7s-tag\{flex:none;margin-left:8px;padding:2px 7px;border-radius:6px;background:rgba\(var\(--mode-rgb\),0\.18\);color:var\(--mode\);font-size:10\.5px;font-weight:800;letter-spacing:0\.08em;\}/);
  });
  it('with no pill to say it, a Mystery Player in progress or finished says so in its grey line', () => {
    const line = (name) => cards(GOLDEN[name])[1].match(/<span class="t7s-name">Mystery Player<\/span>.*?<span class="t7s-sub">(.*?)<\/span><\/span>/)[1].replace(/<[^>]+>/g, '');
    expect(line('home: guest, nothing played, Top 10 day (Mystery as a side row)')).toBe('Guess who from clues');
    expect(line('home: everything in progress (Footle 3 of 6, Top 10 open, Mystery side row 1 guess)')).toBe('1 guess in · keep hunting');
    expect(line('home: Mystery side row with 2 guesses, Footle solved')).toBe('2 guesses in · keep hunting');
    expect(line('home: Mystery side row done, Footle lost, Trail done')).toBe('Done · guess who');
    // The row is marked done all the same (the quiet pill, were the pills switched back).
    expect(cards(GOLDEN['home: Mystery side row done, Footle lost, Trail done'])[1]).toMatch(/class="todays-seven-secondary mp-row is-done" style="--mode:#B9A5FF/);
    expect(cards(GUEST)[1]).not.toContain('is-done');
  });
  it('the whole row is the tap, and it is 68 high (44 is the floor)', () => {
    for (const card of cards(GUEST)) expect(card.replace(/<button type="button" class="todays-seven-secondary mp-row[^"]*"(?: [^>]*)?>.*?<\/button>/g, '')).toBe('');
    expect(CSS).toMatch(/\.home-col-below \.home-list > \.todays-seven-secondary\{[^}]*min-height:68px;\}/);
  });
  it('the tiles are gone from Home, and every tap goes where it went', () => {
    expect(HOME).not.toMatch(/className="play-(grid|card)/);
    expect(HOME).toContain('onClick={() => setScreen("quiz-topics")}');
    expect(HOME).toContain('onClick={() => { markModeSeen("draft"); setScreen("draft"); }}');
    expect(HOME).toContain('onClick={() => { markModeSeen("top10lists"); setScreen("top10lib"); }}');
    expect(HOME).toContain('onClick={() => setScreen("mystery")}');
    expect(HOME).toContain('onClick={() => setScreen("ballpark")}');
    // Survival (and a topical pack, when there is one) starts as the tile did.
    expect(HOME).toContain('onClick={() => { markModeSeen(key); (onTap || (() => startMode(key)))(); }}');
    expect(HOME).toMatch(/\{ key:"survival",\s+Icon: Heart,\s+name:t\("home\.mode\.survival"\),\s+desc:t\("home\.mode\.survivalDesc"\) \},/);
  });
  it('in the source the preview row is second: Top 10 lists, Ballpark, Draft, Mystery Player, Survival', () => {
    const at = ['setScreen("top10lib")', 'setScreen("ballpark")', 'setScreen("draft")', 'onClick={() => setScreen("mystery")}', 'key:"survival"'].map((x) => HOME.indexOf(x, HOME.indexOf('{t("home.moreModes")}</div>')));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
  });
  it('Hot Streak has no row on Home, and the mode is whole everywhere else', () => {
    expect(HOME).not.toMatch(/key:\s*"hotstreak"/);
    for (const markup of Object.values(GOLDEN)) expect(markup).not.toContain('Hot Streak');
    const app = read('App.jsx');
    // the link the website's own card opens, the screen, its results and its retry
    expect(app).toMatch(/\["classic", "survival", "hotstreak", "legends", "chaos", "clubquiz", "leaguequiz"\]\.includes\(gameSlug\)\) \{ startMode\(gameSlug\); return; \}/);
    expect(app).toContain('{screen === "quiz" && mode === "hotstreak" && (');
    expect(app).toContain('{screen === "results" && result && mode === "hotstreak" && (');
    expect(app).toContain('onRetry={() => startMode("hotstreak")}');
    expect(read('marketing/FrontDoor.jsx')).toMatch(/\{ k: 'hotstreak', n: 'Hot Streak', [^}]*href: door\('hotstreak'\) \}/);
    // and its words stay in the tables
    expect(read('i18n/en.js')).toContain("'home.mode.hotstreak': 'Hot Streak',");
    expect(read('i18n/es.js')).toContain("'home.mode.hotstreak': 'Crono',");
  });
  it('how a More modes row ends is one constant: the mates rows\' arrow (as shipped) or the pill', () => {
    expect(HOME).toMatch(/\nconst MORE_MODES_ARROWS = true;\n/);
    expect(HOME).toMatch(/const modeEnd = \(label\) => \(MORE_MODES_ARROWS\s+\? <span className="mp-row-chev" aria-hidden="true"><ChevronRight size=\{18\} strokeWidth=\{2\.4\} \/><\/span>\s+: <span className="t7s-cta">\{label\}<\/span>\);/);
    // every row of the card ends through it; the Quiz row keeps its pill either way
    const card = HOME.slice(HOME.indexOf('<div className="home-list">', HOME.indexOf('{t("home.moreModes")}</div>')), HOME.indexOf('{/* Coming-Soon shelf'));
    expect(card.match(/\{modeEnd\(/g)).toHaveLength(5);
    expect(card).not.toContain('className="t7s-cta"');
    const quiz = HOME.slice(HOME.indexOf('className="todays-seven-secondary mp-row quiz-entry"'), HOME.indexOf('{t("home.moreModes")}</div>'));
    expect(quiz).toContain('<span className="t7s-cta">{t("common.play")}</span>');
    // the arrow is the mates rows' own
    expect(read('components/MultiplayerCard.jsx')).toContain('<span className="mp-row-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>');
  });
});

describe('app.css: the card and its pill are the dailies\' own, on phones', () => {
  const phone = CSS.slice(CSS.indexOf('.home-col-below .home-list{background:var(--s1)'));
  it('one filled card, a hairline between rows, 68 high with the 46px well', () => {
    expect(CSS).toMatch(/@media \(max-width: 1023px\)\{\n  \.home-col-below \.home-list\{background:var\(--s1\);border-radius:20px;padding:2px 14px;margin:0;\}/);
    expect(phone).toMatch(/\.home-col-below \.home-list > \.todays-seven-secondary\{background:none;border:0;border-radius:0;box-shadow:none;padding:11px 0;margin:0;min-height:68px;\}/);
    expect(phone).toMatch(/\.home-col-below \.home-list > \.todays-seven-secondary \+ \.todays-seven-secondary\{padding-top:10px;border-top:1px solid rgba\(255,255,255,0\.07\);\}/);
    // The same numbers as the dailies' card.
    expect(CSS).toContain('.daily-zone .daily-well{background:var(--s1);border:0;border-radius:20px;padding:2px 14px;}');
    expect(CSS).toMatch(/\.daily-well \.todays-seven-secondary\.is-mode,[^{]*\{background:none;border:0;border-radius:0;box-shadow:none;padding:11px 0;margin:0;min-height:68px;\}/);
    expect(CSS).toMatch(/\.t7s-icon\{[^}]*width:46px;height:46px;/);
  });
  it('the pill is the dailies\' soft pill at each of its three sizes', () => {
    expect(phone).toContain('.home-col-below .home-list .t7s-cta{padding:9px 16px;font-size:13.5px;background:rgba(var(--mode-rgb),0.16);color:var(--mode);-webkit-text-fill-color:var(--mode);border:1px solid rgba(var(--mode-rgb),0.45);}');
    expect(CSS).toContain('.todays-seven-secondary.is-mode .t7s-cta{padding:9px 16px;font-size:13.5px;background:rgba(var(--mode-rgb),0.16);color:var(--mode);-webkit-text-fill-color:var(--mode);border:1px solid rgba(var(--mode-rgb),0.45);}');
    expect(phone).toContain('@media (max-width: 389px){.home-col-below .home-list .t7s-cta{padding:9px 11px;}}');
    expect(CSS).toContain('@media (max-width: 389px){.todays-seven-secondary.is-mode .t7s-cta{padding:9px 11px;}}');
    expect(phone).toContain('.home-col-below .home-list .t7s-cta{padding:7px 13px;font-size:12px;}');
    expect(CSS).toContain('@media (max-width: 359px){.todays-seven-secondary.is-mode .t7s-cta{padding:7px 13px;font-size:12px;}}');
  });
  it('a row with no colour of its own (Quiz, Survival) is the soft green of Footle\'s pill', () => {
    expect(CSS).toContain('.home-list > .mp-row{--mode:var(--grn-soft);}');
  });
});
