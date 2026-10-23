// i18n step 5, the leftovers of step 4: share texts, the countdown, Hot
// Streak's and True or False's chrome, the install banner, Stump a mate, the
// pre-boot onboarding shell and the iOS language list.
//
//   • ENGLISH IS BYTE-IDENTICAL. Every share builder is run over a grid of
//     inputs and compared with the code main had before step 5 (5a12fb94),
//     copied below as the reference; every new key is pinned to the literal
//     it replaced (i18n-leftovers.keys.js).
//   • A Spanish player shares in Spanish, with the product names kept.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { t, __resetI18nForTests } = await import('../../src/i18n/index.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const enHome = (await import('../../src/i18n/en.home.js')).default;
const { STEP5_EN } = await import('./i18n-leftovers.keys.js');
const { STEP4_EN } = await import('./i18n-screens.keys.js');
const { STEP6_EN } = await import('./i18n-last-english.keys.js');
const { STEP7_EN } = await import('./i18n-step7.keys.js');
const { footleShareHead } = await import('../../src/lib/wordle.js');
const { buildTrailShareText, TRAIL_MAX_ATTEMPTS } = await import('../../src/lib/trail.js');
const { buildMysteryShareText } = await import('../../src/lib/mysteryPlayer.js');
const { buildTop10ShareText, TOP10_LIVES } = await import('../../src/lib/top10.js');
const { scoreLabel } = await import('../../src/lib/gameChallenge.js');
const { countdownText } = await import('../../src/i18n/names.js');
const { formatCountdown } = await import('../../src/lib/date.js');

const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, ROOT)), 'utf8');

// ── The English as main built it before step 5 (5a12fb94), verbatim ─────────
const OLD = {
  footleHead: (appName, num, won, guessCount, clue, hard = false) => {
    const tag = num > 0 ? ` #${num}` : '';
    return `⚽ ${appName} Footle${tag} ${won ? guessCount : 'X'}/6${hard ? ' Hard' : ''}${clue ? ' 💡' : ''}`;
  },
  trail: ({ number, won, clubsUsed, streak } = {}) => {
    const head = `⚽ Ball IQ · Transfer Trail${number > 0 ? ` #${number}` : ''}`;
    const line = won
      ? `Got it on ${clubsUsed} club${clubsUsed === 1 ? '' : 's'} ${'⚽'.repeat(Math.min(clubsUsed, 6))}`
      : `Didn't get it — X/${TRAIL_MAX_ATTEMPTS}`;
    const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day Trail streak` : '';
    return `${head}\n${line}${streakLine}\n\nhttps://balliq.app/trail`;
  },
  mystery: ({ number, guesses = [], won, streak = 0 } = {}) => {
    const head = `⚽ Ball IQ · Mystery Player${number > 0 ? ` #${number}` : ''}`;
    const icon = { win: '🟩', hot: '🟩', warm: '🟨', cold: '⬜' };
    const grid = [...guesses].sort((a, b) => b.rank - a.rank).map((g) => icon[g.band] || '⬜').join('');
    const line = won ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}` : 'Gave up';
    const streakLine = won && streak > 1 ? `\n🔥 ${streak}-day Mystery streak` : '';
    return `${head}\n${line}\n${grid}${streakLine}\n\nhttps://balliq.app/mystery`;
  },
  top10: ({ number, title, found = [], lives = 0, streak = 0 } = {}) => {
    const score = found.filter(Boolean).length;
    const head = `⚽ Ball IQ · Top 10${number > 0 ? ` #${number}` : ''}`;
    const squares = found.map((f) => (f ? '🟩' : '⬛')).join('');
    const hearts = '❤️'.repeat(lives) + '🤍'.repeat(Math.max(0, TOP10_LIVES - lives));
    const streakLine = streak > 1 ? `\n🔥 ${streak}-day Top 10 streak` : '';
    return `${head}\n${title}\n${squares} ${score}/${found.length}\n${hearts}${streakLine}\n\nhttps://balliq.app/top10`;
  },
  challenge: (what, edition, game, s) => `${what} No. ${edition}: ${scoreLabel(game, s)}. Can you beat it?`,
  stump: (missed, link) => (missed ? `This one got me 🙈 bet you can't get it either ⚽ ${link}` : `I got this one — bet you can't 😏 ⚽ ${link}`),
  stumpPass: (got, link) => (got ? `Got it ✅ your turn 😏 ⚽ ${link}` : `It got me too 🙈 can YOU get it? ⚽ ${link}`),
  app: '⚽ Ball IQ — the football quiz for real fans. https://balliq.app/get',
};
const LINK = 'https://balliq.app/q?id=q_1f5bf2&qt=Who%3F&c=UCL';
const guess = (rank, band) => ({ rank, band });
const MYSTERY_GUESSES = [[], [guess(1, 'win')], [guess(40, 'cold'), guess(9, 'warm'), guess(1, 'win')]];

let store;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); __resetI18nForTests(); });
beforeEach(() => { __resetI18nForTests(); });

describe('the step 5 keys', () => {
  it('each one prints its pinned English, in en.js and (where Home needs it) en.home.js', () => {
    for (const [k, v] of Object.entries(STEP5_EN)) {
      expect(en[k], k).toBe(v);
      if (Object.hasOwn(enHome, k)) expect(enHome[k], k).toBe(v);
    }
  });
  it('the pinned list is every key step 5 added (after step 4\'s, to the end of en.js)', () => {
    const keys = Object.keys(en);
    const first = keys.findIndex((k) => Object.hasOwn(STEP5_EN, k));
    expect(keys.slice(first).filter((k) => !Object.hasOwn(STEP6_EN, k) && !Object.hasOwn(STEP7_EN, k)).sort()).toEqual(Object.keys(STEP5_EN).sort());
    expect(keys.slice(0, first).some((k) => Object.hasOwn(STEP5_EN, k))).toBe(false);
    expect(Object.hasOwn(STEP4_EN, keys[first - 1])).toBe(true);
  });
  it('each one has a Spanish value with the same {placeholders}', () => {
    const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const k of Object.keys(STEP5_EN)) {
      expect(typeof es[k] === 'string' && es[k].length > 0, k).toBe(true);
      expect(ph(es[k]), k).toEqual(ph(en[k]));
    }
  });
  it('the shared vocabulary: Hot Streak is Crono', () => {
    expect(es['hs.header']).toContain('Crono');
  });
});

describe('English share texts are byte-identical', () => {
  beforeEach(() => bootLang(store, null));
  it('Footle\'s head line', () => {
    for (const num of [0, 150]) for (const won of [true, false]) for (const n of [1, 3, 6]) for (const clue of [false, true]) for (const hard of [false, true]) {
      expect(footleShareHead('Ball IQ', num, won, n, clue, hard)).toBe(OLD.footleHead('Ball IQ', num, won, n, clue, hard));
    }
  });
  it('Transfer Trail', () => {
    for (const number of [0, 61]) for (const won of [true, false]) for (const clubsUsed of [1, 2, 5, 8]) for (const streak of [0, 1, 4]) {
      const o = { number, won, clubsUsed, streak };
      expect(buildTrailShareText(o)).toBe(OLD.trail(o));
    }
  });
  it('Mystery Player', () => {
    for (const number of [0, 88]) for (const won of [true, false]) for (const guesses of MYSTERY_GUESSES) for (const streak of [0, 1, 2, 9]) {
      const o = { number, won, guesses, streak };
      expect(buildMysteryShareText(o)).toBe(OLD.mystery(o));
    }
  });
  it('Top 10', () => {
    for (const number of [0, 12]) for (const lives of [0, 2, 3]) for (const streak of [0, 1, 2, 7]) {
      const o = { number, title: 'Premier League top scorers', found: [true, false, true, true, false, true, true, true, false, true], lives, streak };
      expect(buildTop10ShareText(o)).toBe(OLD.top10(o));
    }
  });
  it('DailyDone\'s challenge, Results\' and Stump a mate\'s stump texts, Settings\' share-the-app text', () => {
    for (const [game, what] of [['footle', 'Footle'], ['trail', 'Transfer Trail'], ['top10', 'Top 10']]) {
      for (const s of [0, 1, 2, 3, 6, 10]) {
        expect(t('share.challenge', { what, edition: 150, score: scoreLabel(game, s, t) })).toBe(OLD.challenge(what, 150, game, s));
      }
    }
    for (const missed of [true, false]) expect(t(missed ? 'share.stumpMissed' : 'share.stumpGot', { link: LINK })).toBe(OLD.stump(missed, LINK));
    for (const got of [true, false]) expect(t(got ? 'share.stumpPassGot' : 'share.stumpPassMissed', { link: LINK })).toBe(OLD.stumpPass(got, LINK));
    expect(t('share.app')).toBe(OLD.app);
  });
  it('the sites build them from these keys', () => {
    expect(read('src/components/DailyDone.jsx')).toContain('t("share.challenge", { what, edition, score: scoreLabel(game, myScore, t) })');
    expect(read('src/screens/ResultsScreen.jsx')).toContain('t(stumpWrong.length ? "share.stumpMissed" : "share.stumpGot", { link: stumpLink(stumpQ) })');
    expect(read('src/screens/StumpScreen.jsx')).toContain('t(gotIt ? "share.stumpPassGot" : "share.stumpPassMissed", { link: stumpLink(row) })');
    expect(read('src/screens/SettingsScreen.jsx')).toContain('const text = t("share.app");');
  });
  it('the countdown: "12h 0m", "5m", "soon", as lib/date.js formats it', () => {
    for (const ms of [0, -5, 5 * 60000, 59 * 60000, 12 * 3600000, 12 * 3600000 + 59999, 23 * 3600000 + 7 * 60000]) {
      expect(countdownText(ms)).toBe(formatCountdown(ms));
    }
    expect(countdownText(12 * 3600000)).toBe('12h 0m');
  });
});

describe('a Spanish player shares in Spanish', () => {
  beforeEach(() => bootLang(store, 'es'));
  it('every builder, product names kept', () => {
    expect(footleShareHead('Ball IQ', 150, true, 3, true, true)).toBe('⚽ Ball IQ Footle #150 3/6 Difícil 💡');
    expect(buildTrailShareText({ number: 61, won: true, clubsUsed: 2, streak: 4 })).toBe('⚽ Ball IQ · Transfer Trail #61\nAcertado con 2 clubes ⚽⚽\n🔥 Racha de 4 días en Trail\n\nhttps://balliq.app/trail');
    expect(buildTrailShareText({ number: 61, won: false })).toBe(`⚽ Ball IQ · Transfer Trail #61\nNo lo acerté: X/${TRAIL_MAX_ATTEMPTS}\n\nhttps://balliq.app/trail`);
    expect(buildMysteryShareText({ number: 88, won: true, guesses: MYSTERY_GUESSES[1], streak: 0 })).toBe('⚽ Ball IQ · Mystery Player #88\nResuelto en 1 intento\n🟩\n\nhttps://balliq.app/mystery');
    expect(buildMysteryShareText({ number: 88, won: false, guesses: MYSTERY_GUESSES[2] })).toContain('\nMe rendí\n');
    expect(buildTop10ShareText({ number: 12, title: 'X', found: [true], lives: 3, streak: 5 })).toContain('\n🔥 Racha de 5 días en Top 10\n');
    expect(t('share.challenge', { what: 'Transfer Trail', edition: 61, score: scoreLabel('trail', 2, t) })).toBe('Transfer Trail n.º 61: 2 clubes. ¿Me superas?');
    expect(t('share.app')).toBe('⚽ Ball IQ: el quiz de fútbol para los que saben. https://balliq.app/get');
    expect(t('share.stumpGot', { link: LINK })).toContain(LINK);
  });
  it('the countdown reads "12 h 0 min"', () => {
    expect(countdownText(12 * 3600000)).toBe('12 h 0 min');
    expect(countdownText(5 * 60000)).toBe('5 min');
  });
});

describe('the in-game chrome and the banners print through t()', () => {
  const APP = read('src/App.jsx');
  const body = (fn) => APP.slice(APP.indexOf(fn), APP.indexOf('\n}\n', APP.indexOf(fn)));
  it('Hot Streak: the header and "pts" (and the hold\'s words) are keys now', () => {
    const hs = body('function HotStreakEngine(');
    for (const lit of ['⚡🔥 Hot Streak', '>pts<', 'tap to skip', '"30 seconds left"', 'aria-label="Go back"', '> Why?<']) expect(hs, lit).not.toContain(lit);
    for (const k of ['hs.header', 'hs.pts', 'hs.skip', 'quiz.why', 'quiz.secsLeft', 'game.goBack', 'game.howTo']) expect(hs, k).toContain(`t("${k}"`);
  });
  it('True or False: label, buttons and verdict', () => {
    const tf = body('function TrueFalseEngine(');
    for (const lit of ['✅ True or False', '✓ TRUE', '✗ FALSE', "'✓ Correct!'", "'✗ Incorrect'"]) expect(tf, lit).not.toContain(lit);
    for (const k of ['tf.label', 'quiz.true', 'quiz.false', 'quiz.right', 'quiz.wrong', 'quiz.why']) expect(tf, k).toContain(`t("${k}"`);
  });
  it('InstallBanner and FootleGetAppCTA', () => {
    const ib = body('export function InstallBanner(');
    for (const lit of ['Never miss a day', '>Install<', 'iOS install steps', 'Dismiss install prompt']) expect(ib, lit).not.toContain(lit);
    expect(body('export function FootleGetAppCTA(')).toContain('caption={t("ib.cta")}');
  });
});

describe('the pre-boot onboarding shell (index.html)', () => {
  const HTML = read('index.html');
  const script = HTML.slice(HTML.indexOf('var ES=null;'), HTML.indexOf('el.style.display=\'flex\';'));
  const val = (k) => (script.match(new RegExp(`${k}:"([^"]+)"`)) || [])[1];
  it('speaks es.js\'s onboarding lines, so the swap to OnboardingScreen is seamless', () => {
    expect(val('title')).toBe(es['ob.title']);
    expect(val('q')).toBe(es['ob.q']);
    expect(val('skip')).toBe(es['ob.skip']);
    expect(val('start')).toBe(es['ob.start']);
    expect(val('play')).toBe(es['ob.play']);
    expect(val('right')).toBe(es['ob.right']);
    expect(val('wrong')).toBe(es['ob.wrong'].replace('{a}', 'Cristiano Ronaldo'));
  });
  it('follows the same rule as resolveLang: biq_lang first, the device only while Spanish is live', () => {
    expect(script).toContain("localStorage.getItem('biq_lang')");
    expect(script).toContain("localStorage.getItem('biq_i18n_live')==='1'");
    expect(read('src/i18n/index.js')).toMatch(/if \(live\) localStorage\.setItem\(LIVE_HINT_KEY, '1'\); else localStorage\.removeItem\(LIVE_HINT_KEY\);/);
    expect(read('src/i18n/index.js')).toContain("export const LIVE_HINT_KEY = 'biq_i18n_live';");
  });
  it('English stays as it was', () => {
    expect(HTML).toContain('>Quick one — give it a go ⚽</div>');
    expect(HTML).toContain('var CORRECT="Nice — you’re a natural";');
    expect(HTML).toContain('start.textContent=ES?ES.play:"Let\'s play";');
  });
});

describe('iOS', () => {
  it('lists Spanish in CFBundleLocalizations, so the App Store shows it', () => {
    const plist = read('ios/App/App/Info.plist');
    const m = plist.match(/<key>CFBundleLocalizations<\/key>\s*<array>([\s\S]*?)<\/array>/);
    expect(m).toBeTruthy();
    expect([...m[1].matchAll(/<string>([^<]+)<\/string>/g)].map((x) => x[1])).toEqual(['en', 'es']);
  });
});
