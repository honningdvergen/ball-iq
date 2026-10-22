// i18n step 2: every user-visible string on Home and in the navigation goes
// through t() (src/i18n/en.js), with Spanish in es.js.
//
//   • ENGLISH IS BYTE-IDENTICAL. Home (12 states), the Multiplayer row, the
//     desktop rail, the web app bar and the site header are rendered and
//     compared with i18n-home-nav.golden.json: the markup the same scenarios
//     produced on main before step 2 (d1a8e1b2). Do not regenerate the golden
//     to make this pass: a diff here IS an English regression.
//   • Every key step 2 added is pinned to its exact English below, including
//     the ones no static render reaches (the finder's dropdown, the open menu).
//   • Spanish renders with biq_lang=es, with no English left in those surfaces
//     beyond product names, club names and numbers.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import en from '../../src/i18n/en.js';
import es from '../../src/i18n/es.js';
import { t, initI18n, getLang, LANG_STORAGE_KEY, __resetI18nForTests } from '../../src/i18n/index.js';
import { FOOTLE_SHORT } from '../../src/lib/modeCopy.js';
import { STEP3_EN } from './i18n-games.keys.js';
import { STEP4_EN } from './i18n-screens.keys.js';
import { STEP5_EN } from './i18n-leftovers.keys.js';
import { STEP6_EN } from './i18n-last-english.keys.js';
import { STEP7_EN } from './i18n-step7.keys.js';

const S = vi.hoisted(() => ({}));
vi.mock('../../src/useAuth.jsx', () => ({ useAuth: () => S.auth }));
vi.mock('../../src/lib/wordleStatus.js', async (orig) => ({ ...(await orig()), readWordleTodayStatus: () => S.ws }));
vi.mock('../../src/lib/trail.js', async (orig) => ({
  ...(await orig()),
  getTrailAnswer: () => (S.trailLive ? { name: 'x' } : null),
  loadTrailDay: () => S.trailDay,
  getTrailNumber: () => 61,
}));
vi.mock('../../src/lib/top10.js', async (orig) => ({
  ...(await orig()),
  isTop10Live: () => S.top10Live,
  getTop10Number: () => 12,
  loadTop10Day: () => S.top10Day,
}));
vi.mock('../../src/lib/mysteryPlayer.js', async (orig) => ({
  ...(await orig()),
  MYSTERY_ENABLED: true,
  answerIdForDay: () => 'p1',
  mysteryNumber: () => 88,
  loadMysteryResult: () => S.mysteryRes,
}));
vi.mock('../../src/lib/footleNumber.js', async (orig) => ({ ...(await orig()), getFootleNumber: () => 150 }));

const { renderAll, SCENARIOS } = await import('./i18n-home-nav.scenarios.js');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-home-nav.golden.json', import.meta.url)), 'utf8'));
const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
// The first byte where two renders part, with context: a 15 KB "expected"
// dump says nothing, this says which string moved.
function firstDiff(was, now) {
  if (was === now) return null;
  let i = 0;
  while (was[i] === now[i]) i++;
  return `at ${i}\n  was: …${was.slice(Math.max(0, i - 80), i + 80)}…\n  now: …${String(now).slice(Math.max(0, i - 80), i + 80)}…`;
}

let store;
function boot(stored) {
  store = new Map(stored ? [[LANG_STORAGE_KEY, stored]] : []);
  vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  // en-US: appStoreUrl() picks the storefront from the device language, and
  // the golden was rendered with the default (us) one.
  vi.stubGlobal('navigator', { language: 'en-US' });
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  return initI18n();
}

// Noon on the day step 2 was written: the Draft's NEW label is still up, and
// the done strip's countdown reads "12h 0m" in every timezone.
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0)); });
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
beforeEach(() => { __resetI18nForTests(); });

// Every key step 2 added, with the exact English it must print. Literal on
// purpose: an edit to en.js has to be made here too, on purpose.
const STEP2_EN = {
  'common.play': "Play",
  'common.new': "NEW",
  'mode.footle.short': "Surname of a footballer",
  'nav.primary': "Primary",
  'nav.play': "Play",
  'nav.settings': "Settings",
  'nav.notifications': "Notifications",
  'nav.notificationsNew_one': "Notifications, {count} new",
  'nav.notificationsNew_other': "Notifications, {count} new",
  'nav.newDot': "new",
  'nav.getTheApp': "Get the app",
  'site.homeLabel': "Ball IQ home",
  'site.sections': "Sections",
  'site.today': "Today",
  'site.games': "Games",
  'site.clubs': "Clubs",
  'site.quizzes': "Quizzes",
  'site.lists': "Lists",
  'site.signIn': "Sign in",
  'site.find': "Find your club or league",
  'site.findEmpty': "Nothing on file called “{q}” yet.",
  'site.findSeeAll': "See every club",
  'site.findLeague': "League quiz",
  'site.getAppPill': "Get app",
  'site.menu': "Menu",
  'site.closeMenu': "Close menu",
  'home.streak_one': "{count}-day streak",
  'home.streak_other': "{count}-day streak",
  'home.challenge.by': "{name} challenged you",
  'home.challenge.anon': "You've been challenged",
  'home.challenge.beat': "Beat {score}/7 on today's Daily 7",
  'home.challenge.beatYesterday': "Beat {score}/7 (yesterday's score) on today's Daily 7",
  'home.challenge.dismiss': "Dismiss challenge",
  'home.today.label': "Today's puzzles",
  'home.today.allDone': "{total}/{total} done",
  'home.today.progress': "{done}/{total} today",
  'home.today.allDoneAria': "All {total} of today's puzzles done — open History",
  'home.today.progressAria': "{done} of {total} puzzles played today — open History",
  'home.row.no': "No. {n}",
  'home.row.review': "Review",
  'home.row.continue': "Continue",
  'home.row.open': "Open",
  'home.row.doneScore': "Done · {score}",
  'home.row.ariaPlay': "Play today's {mode}",
  'home.row.ariaReview': "Today's {mode}: done — review",
  'home.footle.solved': "Solved in {n}",
  'home.footle.lost': "Out of guesses",
  'home.footle.inProgress': "In progress · {n} of 6",
  'home.footle.start': "Start here · six guesses",
  'home.daily7.sub': "7 questions · ~3 min",
  'home.daily7.ariaPlay': "Play Daily 7",
  'home.daily7.ariaDone': "Daily 7 complete: {score} out of 7",
  'home.trail.sub': "Whose career is this?",
  'home.trail.doneSub': "Done · today's player",
  'home.top10.sub': "Name all ten · 3 lives",
  'home.top10.found': "{n} of 10 found so far",
  'home.top10.ariaDone': "Today's Top 10: done, {n} out of 10 — review",
  'home.top10.ariaOpen': "Today's Top 10: {n} of 10 found — continue",
  'home.mystery.sub': "Guess who from clues",
  'home.mystery.doneSub': "Done · guess who",
  'home.mystery.guessesIn_one': "{count} guess in · keep hunting",
  'home.mystery.guessesIn_other': "{count} guesses in · keep hunting",
  'home.mystery.ariaOpen_one': "Today's Mystery Player: {count} guess in — continue",
  'home.mystery.ariaOpen_other': "Today's Mystery Player: {count} guesses in — continue",
  'home.done.titleFour': "Today’s four, done",
  'home.done.title': "Today’s {n}, done",
  'home.done.next': "New in {time}",
  'home.mp.openAria': "Open the Multiplayer tab",
  'home.mp.sub': "Play your mates live",
  'home.mp.invite': "Invite",
  'home.mp.inviteAria': "Create a room and invite friends",
  'home.rail.label': "Your stats",
  'home.rail.anonName': "Ball IQ Player",
  'home.rail.overall': "OVERALL",
  'home.rail.unrated': "Answer 10 questions to get rated",
  'home.rail.viewProfile': "View full profile →",
  'home.rail.dayStreak': "Day streak",
  'home.rail.best': "Best · {n}",
  'home.rail.formAria': "Login streak: {n} of the last 14 days",
  'home.rail.last14': "Last 14 days",
  'home.rail.yourForm': "Your form",
  'home.rail.accuracy': "Accuracy",
  'home.rail.bestScore': "Best score",
  'home.rail.strongest': "Strongest",
  'home.rail.formEmpty': "Play a game to see your form.",
  'home.findQuiz': "Find a quiz",
  'home.finder.placeholder': "Find your club…",
  'home.finder.label': "Find your club",
  'home.finder.results': "Clubs",
  'home.finder.empty': "No club called “{q}” on file yet.",
  'home.finder.seeAll': "See every club",
  'home.finder.play': "Play →",
  'home.finder.chips': "Most played clubs",
  'home.finder.all_one': "All {count} clubs →",
  'home.finder.all_other': "All {count} clubs →",
  'home.quiz.title': "Quiz",
  'home.quiz.sub': "Ten questions · any league, era or theme",
  'home.quiz.aria': "Quiz: ten questions on any league, era or theme",
  'home.moreModes': "More modes",
  'home.draft.sub': "Spin real seasons, build an XI, win the league",
  'home.draft.aria': "Play the Draft: build an eleven out of real seasons",
  'home.top10lists.title': "Top 10 lists",
  'home.top10lists.sub': "Your club’s lists, and every past daily",
  'home.top10lists.aria': "Top 10 lists: your club's lists and every past daily",
  'home.mode.survival': "Survival",
  'home.mode.survivalDesc': "One miss, out",
  'home.mode.hotstreak': "Hot Streak",
  'home.mode.hotstreakDesc': "60 seconds",
  'home.comingSoon': "Coming soon: {list}",
  'home.appBanner.title': "Take {app} everywhere",
  'home.appBanner.sub': "Your streak, rating and friends follow your account — on your phone or in any browser.",
  'store.appStore.aria': "Download on the App Store",
  'store.appStore.eyebrow': "Download on the",
  'store.play.aria': "Get it on Google Play",
  'store.play.eyebrow': "Get it on",
};

describe('English is byte-identical (golden markup from main before step 2)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(SCENARIOS.map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('Home, the Multiplayer row, BiqNav, AppBar and SiteHeader render exactly as before', async () => {
    await boot(null);
    expect(getLang()).toBe('en');
    const now = renderAll(S);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
  it('an explicit biq_lang=en is the same English', async () => {
    await boot('en');
    const now = renderAll(S);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
});

describe('the step 2 keys', () => {
  const STEP1 = (k) => k.startsWith('tab.') || k.startsWith('home.greeting.') || k === 'settings.language';
  it('each one prints its pinned English', () => {
    for (const [k, v] of Object.entries(STEP2_EN)) expect(en[k], k).toBe(v);
  });
  it('the pinned list is every key step 2 added (no unpinned English)', () => {
    // Step 3's keys (the game screens) are pinned in i18n-games.keys.js,
    // step 4's (results, History, Profile, Settings …) in i18n-screens.keys.js.
    expect(Object.keys(en).filter((k) => !STEP1(k) && !Object.hasOwn(STEP3_EN, k) && !Object.hasOwn(STEP4_EN, k) && !Object.hasOwn(STEP5_EN, k) && !Object.hasOwn(STEP6_EN, k) && !Object.hasOwn(STEP7_EN, k)).sort()).toEqual(Object.keys(STEP2_EN).sort());
  });
  it('each one has a Spanish value', () => {
    expect(Object.keys(STEP2_EN).filter((k) => typeof es[k] !== 'string')).toEqual([]);
  });
  it('the Footle prompt still has one English source: en.js takes it from lib/modeCopy.js', () => {
    expect(en['mode.footle.short']).toBe(FOOTLE_SHORT);
    expect(read('i18n/en.js')).toMatch(/import \{ FOOTLE_SHORT \} from '\.\.\/lib\/modeCopy\.js';/);
    expect(read('i18n/en.js')).toContain("'mode.footle.short': FOOTLE_SHORT,");
  });
  it('the strings no static render reaches still print the old English', async () => {
    await boot(null);
    // ClubFinder's dropdown (only open while typing).
    expect(t('home.finder.empty', { q: 'Wrexham' })).toBe('No club called “Wrexham” on file yet.');
    expect(t('home.finder.seeAll')).toBe('See every club');
    expect(t('home.finder.play')).toBe('Play →');
    expect(t('home.finder.results')).toBe('Clubs');
    // The site header's finder results and the open burger.
    expect(t('site.findEmpty', { q: 'Wrexham' })).toBe('Nothing on file called “Wrexham” yet.');
    expect(t('site.findLeague')).toBe('League quiz');
    expect(t('site.closeMenu')).toBe('Close menu');
    // Plurals keep English's one word for every count.
    expect(t('home.streak', { count: 1 })).toBe('1-day streak');
    expect(t('nav.notificationsNew', { count: 1 })).toBe('Notifications, 1 new');
    expect(t('home.finder.all', { count: 1 })).toBe('All 1 clubs →');
    expect(t('home.mystery.guessesIn', { count: 1 })).toBe('1 guess in · keep hunting');
    expect(t('home.mystery.guessesIn', { count: 2 })).toBe('2 guesses in · keep hunting');
    // The Coming-soon shelf (empty today, so never rendered).
    expect(t('home.comingSoon', { list: 'A · B' })).toBe('Coming soon: A · B');
  });
});

describe('Spanish (biq_lang=es)', () => {
  const html = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  it('renders every surface in Spanish, with no English string of a step 2 key left', async () => {
    await boot('es');
    expect(getLang()).toBe('es');
    const now = renderAll(S);
    // Whole-string English values that would show up as a text node or an
    // attribute if a site still printed English. Values equal in both
    // languages (Quiz, Quizzes, Draft names) are skipped.
    const english = Object.keys(STEP2_EN)
      .filter((k) => es[k] !== en[k] && !/\{\w+\}/.test(en[k]))
      .map((k) => en[k]);
    for (const [name, markup] of Object.entries(now)) {
      const m = html(markup);
      for (const e of english) {
        expect(m.includes(`>${e}<`) || m.includes(`="${e}"`), `${name}: "${e}" still in English`).toBe(false);
      }
    }
  });
  it('the Today block, in Spanish', async () => {
    await boot('es');
    const now = renderAll(S);
    const guest = html(now['home: guest, nothing played, Top 10 day (Mystery as a side row)']);
    expect(guest).toContain('aria-label="Retos de hoy"');
    expect(guest).toContain('>0/4 hoy<');
    expect(guest).toContain('aria-label="0 de 4 retos jugados hoy. Abrir Historial"');
    expect(guest).toContain('<span class="t7s-sub">Apellido de un futbolista</span>');
    expect(guest).toContain('<span class="t7s-no">N.º 150</span>');
    expect(guest).toContain('<span class="t7s-cta">Jugar</span>');
    expect(guest).toContain('aria-label="Jugar al Footle de hoy"');
    expect(guest).toContain('<div class="home-section-title">Busca un quiz</div>');
    expect(guest).toContain('placeholder="Busca tu club…"');
    const busy = html(now['home: everything in progress (Footle 3 of 6, Top 10 open, Mystery side row 1 guess)']);
    expect(busy).toContain('<span class="t7s-sub">En juego · <strong>3</strong> de 6</span>');
    expect(busy).toContain('<span class="t7s-sub">Hecho · <strong>5/7</strong></span>');
    expect(busy).toContain('<span class="t7s-sub"><strong>2</strong> de 10 encontrados</span>');
    expect(busy).toContain('<span class="t7s-sub">1 intento · sigue buscando</span>');
    expect(busy).toContain('aria-label="Racha de 12 días"');
    const done = html(now['home: all four done (the done strip)']);
    expect(done).toContain('<span class="dds-title">Los cuatro, listos</span>');
    // Step 5: the countdown in Spanish's own format (time.* keys), was "12h 0m".
    expect(done).toContain('<span class="dds-next">Más en 12 h 0 min</span>');
    expect(done).toContain('>4/4 hechos<');
    expect(t('home.done.title', { n: 3 })).toBe('Los 3, listos');
  });
  it('plurals pick the Spanish form, with numbers in Spanish word order', async () => {
    await boot('es');
    expect(t('home.mystery.guessesIn', { count: 1 })).toBe('1 intento · sigue buscando');
    expect(t('home.mystery.guessesIn', { count: 3 })).toBe('3 intentos · sigue buscando');
    expect(t('home.streak', { count: 1 })).toBe('Racha de 1 día');
    expect(t('home.streak', { count: 30 })).toBe('Racha de 30 días');
    expect(t('nav.notificationsNew', { count: 1 })).toBe('Notificaciones, 1 nueva');
    expect(t('nav.notificationsNew', { count: 5 })).toBe('Notificaciones, 5 nuevas');
    expect(t('home.finder.all', { count: 120 })).toBe('Los 120 clubes →');
  });
  it('the navs, in Spanish, agree with the mobile tab bar', async () => {
    await boot('es');
    const now = renderAll(S);
    const rail = html(now['BiqNav: home tab, daily not done, signed out']);
    for (const w of ['Inicio', 'Historial', 'Perfil', 'Multijugador', 'Ajustes', 'Descarga la app']) expect(rail).toContain(`<span>${w}</span>`.replace('<span>Descarga la app</span>', '>Descarga la app<'));
    const bar = html(now['AppBar: 2 notifications, settings active']);
    expect(bar).toContain('aria-label="Notificaciones, 2 nuevas"');
    for (const w of ['Jugar', 'Historial', 'Multijugador', 'Perfil', 'Ajustes']) expect(bar).toContain(`<span>${w}</span>`);
    const head = html(now['SiteHeader: signed out']);
    expect(head).toContain('>Descarga la app<');
    expect(head).toContain('class="fd-head-app" href="/get?src=header-pill">App</a>');
    expect(head).toContain('placeholder="Buscar club o liga"');
    expect(head).toContain('aria-label="Menú"');
  });
});

describe('no copy left behind in the source', () => {
  it('HomeScreen, the Multiplayer row and the navs print no English literal a step 2 key replaced', () => {
    const files = ['screens/HomeScreen.jsx', 'components/MultiplayerCard.jsx', 'BiqNav.jsx', 'components/AppBar.jsx', 'marketing/SiteHeader.jsx'];
    const literals = Object.values(STEP2_EN).filter((v) => !/\{\w+\}/.test(v) && v.length > 3 && !['Quiz', 'Quizzes', 'Draft'].includes(v));
    const found = [];
    for (const f of files) {
      // Code only: comments quote old copy on purpose (the history of a row).
      const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const v of literals) {
        if (code.includes(`>${v}<`) || code.includes(`"${v}"`) || code.includes(`'${v}'`) || new RegExp(`>\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`).test(code)) found.push(`${f}: ${v}`);
      }
    }
    expect(found).toEqual([]);
  });
  it('each surface subscribes to the language (useT), so a switch re-renders it', () => {
    for (const f of ['screens/HomeScreen.jsx', 'components/MultiplayerCard.jsx', 'BiqNav.jsx', 'components/AppBar.jsx', 'marketing/SiteHeader.jsx']) {
      expect(read(f), f).toMatch(/const t = useT\(\);/);
    }
    // ClubFinder is its own component inside HomeScreen: it needs its own.
    const home = read('screens/HomeScreen.jsx');
    const finder = home.slice(home.indexOf('function ClubFinder('), home.indexOf('function HomeScreenImpl('));
    expect(finder).toMatch(/const t = useT\(\);/);
  });
});
