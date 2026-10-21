// i18n step 7, the last: once I18N_LIVE flips, a Spanish player meets no
// English UI anywhere (the list of what stays English on purpose is in the
// step 7 PR: multiplayer questions from the server, the hidden bank review
// tool, the share card image, the privacy policy and the server's link
// previews).
//
//   • THE FIVE FIXES from the review of step 6 (a–e below).
//   • ENGLISH IS BYTE-IDENTICAL. Every new key is pinned to the literal it
//     replaced (i18n-step7.keys.js); the screens below are rendered in English
//     and held to main's strings, and the builders that changed shape are run
//     against main's code, copied here verbatim.
//   • A Spanish player sees Spanish on each surface, product names kept.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Effects run on render here (there is no DOM). Each cleanup is kept, so a
// test can take a question off the screen the way an unmount would.
const cleanups = [];
vi.mock('react', async (orig) => ({ ...(await orig()), useEffect: (fn) => { const c = fn(); if (typeof c === 'function') cleanups.push(c); } }));

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { t, fmtLocale, fmtLocaleEnglish, __resetI18nForTests } = await import('../../src/i18n/index.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const enHome = (await import('../../src/i18n/en.home.js')).default;
const Q = await import('../../src/i18n/questionText.js');
const { loadQuestions } = await import('../../src/questions-loader.js');
const { STEP7_EN } = await import('./i18n-step7.keys.js');
const { STEP6_EN } = await import('./i18n-last-english.keys.js');
const { buildDraftShareText } = await import('../../src/lib/draftModel.js');
const { StitchBuilder, StitchShare } = await import('../../src/screens/StitchUp.jsx');
const { STITCH_TAUNTS } = await import('../../src/lib/stitchToken.js');
const { stitchPlayers } = await import('../../src/lib/stitch.js');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const html = (el) => renderToStaticMarkup(el);
const text = (s) => s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const flush = () => new Promise((r) => setTimeout(r, 0));
const ES_BANK = JSON.parse(read('src/i18n/questions.es.json'));

let store;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); Q.__setSpanishQuestionsLoaderForTests(null); __resetI18nForTests(); });
beforeEach(() => { __resetI18nForTests(); cleanups.length = 0; });

describe('the step 7 keys', () => {
  it('each prints its pinned English, in en.js and (where Home needs it) en.home.js', () => {
    for (const [k, v] of Object.entries(STEP7_EN)) {
      expect(en[k], k).toBe(v);
      if (Object.hasOwn(enHome, k)) expect(enHome[k], k).toBe(v);
    }
  });
  it('the pinned list is every key step 7 added (after step 6\'s, to the end of en.js)', () => {
    const keys = Object.keys(en);
    const first = keys.findIndex((k) => Object.hasOwn(STEP7_EN, k));
    expect(keys.slice(first).sort()).toEqual(Object.keys(STEP7_EN).sort());
    expect(Object.hasOwn(STEP6_EN, keys[first - 1])).toBe(true);
  });
  it('each has a Spanish value; product names and the shared vocabulary hold', () => {
    for (const k of Object.keys(STEP7_EN)) expect(typeof es[k] === 'string' && es[k].length > 0, k).toBe(true);
    for (const k of Object.keys(STEP7_EN)) {
      for (const name of ['Footle', 'Daily 7', 'Ball IQ', 'Transfer Trail', 'Top 10', 'Draft']) if (en[k].includes(name)) expect(es[k], `${k} keeps "${name}"`).toContain(name);
      for (const ph of en[k].match(/\{\w+\}/g) || []) expect(es[k], `${k} keeps ${ph}`).toContain(ph);
    }
  });
});

// ── a + b. questionText.js: what is held English, and for how long ───────────
describe('a. a failed Spanish fetch at quiz open is treated like the cap: no mid-question flip', () => {
  const Live = ({ q, onScreen = true, out }) => { out.v = Q.useLiveQuestion(q, onScreen); return null; };
  const show = (q, onScreen = true) => { const out = {}; html(React.createElement(Live, { q, onScreen, out })); return out.v; };
  let rows;
  beforeAll(async () => {
    rows = (await loadQuestions()).QB.filter((r) => ES_BANK[r.id] && r.type === 'mcq' && !Q.HELD_ES_ROWS.has(r.id)).slice(0, 3);
  });

  it('the fetch fails fast, the quiz opens in English, a retry lands while question 1 is up: question 1 stays English', async () => {
    const [q1, q2] = rows;
    Q.__setSpanishQuestionsLoaderForTests(() => Promise.reject(new Error('offline')));
    await bootLang(store, 'es');
    const t0 = Date.now();
    expect(await Q.loadSpanishQuestionsCapped()).toBe(false); // failed, not timed out
    expect(Date.now() - t0).toBeLessThan(Q.ES_BANK_WAIT_MS);
    expect(show(q1)).toBe(q1); // displayed in English
    await flush(); // the view's own retry (useQuestionText's effect) fails too, on the same network
    // A later retry succeeds.
    Q.__swapSpanishQuestionsFetchForTests(async () => ES_BANK);
    expect(await Q.loadSpanishQuestions()).toBe(true);
    await flush();
    expect(Q.questionText.q(q1)).toBe(q1); // still on screen: no flip
    expect(show(q2).q).toBe(ES_BANK[q2.id].q); // the next question is Spanish
  });

  it('a question held English is Spanish when it next comes round, once it has left the screen', async () => {
    const [q1] = rows;
    Q.__setSpanishQuestionsLoaderForTests(() => Promise.reject(new Error('offline')));
    await bootLang(store, 'es');
    await Q.loadSpanishQuestionsCapped();
    show(q1);
    await flush();
    Q.__swapSpanishQuestionsFetchForTests(async () => ES_BANK);
    await Q.loadSpanishQuestions();
    expect(Q.questionText.q(q1)).toBe(q1);
    for (const c of cleanups.splice(0)) c(); // it leaves the screen
    expect(Q.questionText.q(q1).q).toBe(ES_BANK[q1.id].q);
    expect(show(q1).q).toBe(ES_BANK[q1.id].q);
  });

  it('the late table (step 6\'s case) still works the same way', async () => {
    const [q1, q2] = rows;
    let release;
    Q.__setSpanishQuestionsLoaderForTests(() => new Promise((r) => { release = r; }));
    await bootLang(store, 'es');
    expect(await Q.loadSpanishQuestionsCapped(30)).toBe(false);
    expect(show(q1)).toBe(q1);
    release(ES_BANK);
    await flush();
    expect(Q.questionText.q(q1)).toBe(q1);
    expect(show(q2).q).toBe(ES_BANK[q2.id].q);
  });
});

describe('b. only questions actually displayed are held, and the hold is let go', () => {
  const Live = ({ q, onScreen = true }) => { Q.useLiveQuestion(q, onScreen); return null; };
  let rows;
  beforeAll(async () => {
    rows = (await loadQuestions()).QB.filter((r) => ES_BANK[r.id] && r.type === 'mcq' && !Q.HELD_ES_ROWS.has(r.id)).slice(0, 2);
  });

  it('rendered but not displayed (the email-answer toast, local play\'s hand-off) holds nothing', async () => {
    const [q1, q2] = rows;
    let release;
    Q.__setSpanishQuestionsLoaderForTests(() => new Promise((r) => { release = r; }));
    await bootLang(store, 'es');
    await Q.loadSpanishQuestionsCapped(10);
    expect(Q.questionText.q(q1)).toBe(q1); // the toast's lookup while the table is missing
    html(React.createElement(Live, { q: q2, onScreen: false })); // behind the hand-off screen
    release(ES_BANK);
    await flush();
    expect(Q.questionText.q(q1).q).toBe(ES_BANK[q1.id].q);
    expect(Q.questionText.q(q2).q).toBe(ES_BANK[q2.id].q);
  });

  it('holdOnScreen: nothing for English, nothing once the table is in; a release lets go once', async () => {
    const [q1] = rows;
    await bootLang(store, null);
    Q.holdOnScreen(q1)();
    Q.__setSpanishQuestionsLoaderForTests(async () => ES_BANK);
    await bootLang(store, 'es');
    await Q.loadSpanishQuestions();
    Q.holdOnScreen(q1);
    expect(Q.questionText.q(q1).q).toBe(ES_BANK[q1.id].q); // the table was here: never held
  });

  it('two views showing the same question: it is held until both have let go', async () => {
    const [q1] = rows;
    let release;
    Q.__setSpanishQuestionsLoaderForTests(() => new Promise((r) => { release = r; }));
    await bootLang(store, 'es');
    await Q.loadSpanishQuestionsCapped(10);
    const a = Q.holdOnScreen(q1);
    const b = Q.holdOnScreen(q1);
    release(ES_BANK);
    await flush();
    a(); a();
    expect(Q.questionText.q(q1)).toBe(q1);
    b();
    expect(Q.questionText.q(q1).q).toBe(ES_BANK[q1.id].q);
  });

  it('the live views use useLiveQuestion; the toast and the lists pin nothing', () => {
    expect(read('src/screens/QuizEngine.jsx')).toContain('const qv = useLiveQuestion(q);');
    expect(read('src/screens/StumpScreen.jsx')).toContain('const shown = useLiveQuestion(row);');
    expect(read('src/screens/LocalPlay.jsx')).toContain('const shownQ = useLiveQuestion(currentQ, phase === "question" || phase === "locked" || phase === "reveal");');
    const app = read('src/App.jsx');
    expect(app).toContain('const qv = useLiveQuestion(q);'); // Hot Streak
    expect(app).toContain('const qv = useLiveQuestion(done ? null : questions?.[idx]);'); // True or False
    expect(app).toContain('const answerText = questionText.q(q).o[q.a];');
    const qt = read('src/i18n/questionText.js');
    expect(qt).not.toMatch(/pastCap|shownEnglish/);
  });
});

// ── c. British English on a Spanish device ──────────────────────────────────
describe('c. fmtLocale / fmtLocaleEnglish', () => {
  afterAll(() => vi.stubGlobal('navigator', { language: 'en-US', userAgent: 'Mozilla/5.0 (Macintosh)' }));
  it('English on a Spanish device is en-GB (day first), not en (US, month first)', async () => {
    vi.stubGlobal('navigator', { language: 'es-ES' });
    await bootLang(store, null);
    expect(fmtLocale()).toBe('en-GB');
    expect(fmtLocaleEnglish()).toBe('en-GB');
    expect(new Date(2026, 9, 21, 12).toLocaleDateString(fmtLocale(), { weekday: 'long', day: 'numeric', month: 'long' })).toBe('Wednesday 21 October');
  });
  it('off Spanish devices nothing changes: undefined, the device\'s own formats', async () => {
    for (const language of ['en-US', 'en-GB', 'nb-NO', 'de-DE', '']) {
      vi.stubGlobal('navigator', { language });
      await bootLang(store, null);
      expect(fmtLocale(), language).toBeUndefined();
      expect(fmtLocaleEnglish(), language).toBeUndefined();
    }
  });
  it('the comments say so', () => {
    expect(read('src/screens/MysteryPlayer.jsx')).not.toContain('device default it always had');
    expect(read('src/i18n/index.js')).toContain("there it is 'en-GB'");
  });
});

// ── d. the Spanish gaps ─────────────────────────────────────────────────────
const OLD_DRAFT = ({ number = 0, se, par = null }) => {
  const row = (ms) => ms.map((m) => (m.r === 'w' ? '🟩' : m.r === 'd' ? '⬜' : '🟥')).join('');
  const head = `⚽ Ball IQ · Draft${number > 0 ? ` #${number}` : ''}`;
  const line = `${se.pts} points · ${se.w}-${se.d}-${se.l}${par != null ? ` · par ${par}` : ''}`;
  return `${head}\n${line}\n${row(se.matches.slice(0, 19))}\n${row(se.matches.slice(19))}\n\nballiq.app/play?game=draft`;
};
const season = (pts, w, d, l) => ({ pts, w, d, l, gf: 70, ga: 30, matches: Array.from({ length: 38 }, (_, i) => ({ r: i < w ? 'w' : i < w + d ? 'd' : 'l' })) });
// Draft.jsx's DRAFT_SHARE_WORDS, mirrored (the source check below holds the screen to it).
const WORDS = {
  head: (number) => t('share.draftHead', { n: number > 0 ? t('share.draftNo', { n: number }) : '' }),
  line: (se) => t('share.draftLine', { pts: se.pts, w: se.w, d: se.d, l: se.l }),
  par: (par) => t('share.draftPar', { par }),
  url: () => t('share.draftUrl'),
};

describe('d. the Spanish gaps', () => {
  it('the Footle streak line: English as it was for every count, Spanish singular and plural', async () => {
    await bootLang(store, null);
    for (const n of [1, 2, 9, 30]) expect(t('share.footleStreak', { count: n, n })).toBe(`🔥 ${n}-day Footle streak`);
    await bootLang(store, 'es');
    expect(t('share.footleStreak', { count: 1, n: 1 })).toBe('🔥 Racha de 1 día en Footle');
    expect(t('share.footleStreak', { count: 9, n: 9 })).toBe('🔥 Racha de 9 días en Footle');
  });
  it('every Footle share builds its streak line from that key, FootleHero included', () => {
    for (const f of ['src/games/FootballWordle.jsx', 'src/screens/ReviewScreens.jsx', 'src/components/FootleHero.jsx']) {
      expect(read(f), f).toContain('t("share.footleStreak", { count: streak, n: streak })');
      expect(read(f), f).not.toContain('-day Footle streak`');
    }
  });
  it('the Draft share: English byte-identical to main, Spanish head and link line', async () => {
    await bootLang(store, null);
    for (const number of [0, 12]) for (const par of [null, 61]) for (const se of [season(80, 24, 8, 6), season(31, 7, 10, 21)]) {
      expect(buildDraftShareText({ number, se, par, words: WORDS })).toBe(OLD_DRAFT({ number, se, par }));
      expect(buildDraftShareText({ number, se, par })).toBe(OLD_DRAFT({ number, se, par }));
    }
    await bootLang(store, 'es');
    const s = buildDraftShareText({ number: 12, se: season(80, 24, 8, 6), par: 61, words: WORDS }).split('\n');
    expect(s[0]).toBe('⚽ Ball IQ · Draft n.º 12');
    expect(s[1]).toBe('80 puntos · 24-8-6 · par 61');
    expect(s.at(-1)).toBe('Juega en balliq.app/play?game=draft');
    const draft = read('src/screens/Draft.jsx');
    expect(draft).toContain('head: (number) => tNow("share.draftHead", { n: number > 0 ? tNow("share.draftNo", { n: number }) : "" }),');
    expect(draft).toContain('url: () => tNow("share.draftUrl"),');
  });
  it('the Stitch-up taunt chips are the player\'s language, the very words the share sends', async () => {
    const zidane = stitchPlayers(new Date(2026, 9, 16, 12)).find((p) => p.name === 'Zinedine Zidane');
    await bootLang(store, null);
    const enB = text(html(React.createElement(StitchBuilder, { onBack: () => {}, initial: { player: zidane, shown: 2, taunt: 3 } })));
    for (const taunt of STITCH_TAUNTS) expect(enB).toContain(taunt);
    await bootLang(store, 'es');
    const esB = text(html(React.createElement(StitchBuilder, { onBack: () => {}, initial: { player: zidane, shown: 2, taunt: 3 } })));
    for (let i = 0; i < STITCH_TAUNTS.length; i++) {
      expect(esB).toContain(es[`share.taunt.${i}`]);
      expect(esB).not.toContain(STITCH_TAUNTS[i]);
    }
    const share = text(html(React.createElement(StitchShare, { made: { token: 'abc.3.1.0-0', player: zidane, shown: 2, taunt: 1, name: 'Ana' }, onAnother: () => {}, onBack: () => {} })));
    expect(share).toContain('“Hasta mi abuela la ha sacado”');
    expect(share).toContain('Ana te ha preparado una: ¿de quién es esta carrera?');
  });
});

// ── e. the Home dateline ────────────────────────────────────────────────────
describe('e. the dateline\'s accents are not clipped, and nothing moves', () => {
  it('each clipping box gets room above, taken back by the same negative margin', () => {
    const css = read('src/app.css');
    expect(css).toMatch(/\.hg-dateline\{[^}]*overflow:hidden;[^}]*padding-top:4px;margin-top:-4px;\}/);
    expect(css).toContain('.daily-zone.daily-zone{padding-top:6px!important;margin-top:-6px!important;}');
    expect(css).toMatch(/\.daily-zone\{[^}]*contain:layout paint style;\}/); // the paint containment that clipped too
  });
});
