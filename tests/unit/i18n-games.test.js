// i18n step 3: every user-visible string on the PLAY screens of the daily games
// goes through t() (src/i18n/en.js), with Spanish in es.js: Footle, the quiz
// engine (Daily 7 and the quiz modes), the Quiz topic screen, Transfer Trail,
// Mystery Player and Top 10.
//
//   • ENGLISH IS BYTE-IDENTICAL. Each screen is rendered in the states listed in
//     i18n-games.scenarios.js and compared with i18n-games.golden.json: the
//     markup the same scenarios produced on main before step 3 (d5d4cbc7). Do
//     not regenerate the golden to make this pass: a diff here IS an English
//     regression.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const S = vi.hoisted(() => ({}));
// The player pool arrives on focus in the real screens (an import()); here it
// is the real pool, handed over at once, or nothing (S.poolReady false).
vi.mock('../../src/lib/usePlayerPool.js', () => ({
  usePlayerPool: ({ careers = false } = {}) => ({
    pool: S.poolReady ? S.mysteryPool : [],
    careers: S.poolReady && careers ? S.mysteryCareers : null,
    ready: !!S.poolReady,
    ensure: () => {},
  }),
}));
vi.mock('../../src/lib/scheduleRemote.js', async (orig) => {
  const m = await orig();
  return { ...m, mysteryAnswerIds: (...a) => (S.noAnswer ? [] : m.mysteryAnswerIds(...a)) };
});
// Top 10 loads its lists with an import() in an effect, which a static render
// never runs: its one `useState({ data: null, failed: false })` is handed the
// scenario's data instead. Every other useState is React's own.
vi.mock('react', async (orig) => {
  const R = await orig();
  const isTop10Init = (v) => v && typeof v === 'object' && !Array.isArray(v) && v.data === null && v.failed === false && Object.keys(v).length === 2;
  const useState = (init) => R.useState(isTop10Init(init)
    ? (S.top10 === 'failed' ? { data: null, failed: true } : { data: S.top10, failed: false })
    : init);
  return { ...R, default: { ...R.default, useState }, useState };
});

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { fillPool, stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { renderAll, buildScenarios } = await import('./i18n-games.scenarios.js');
const { STEP3_EN } = await import('./i18n-games.keys.js');
const { t, getLang, __resetI18nForTests } = await import('../../src/i18n/index.js');
const { rich } = await import('../../src/i18n/rich.jsx');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const { footleWinWord } = await import('../../src/games/FootballWordle.jsx');
const { footleClue } = await import('../../src/lib/wordle.js');
const { wrongPathNote } = await import('../../src/lib/trail.js');
const { reasonLine, topShare } = await import('../../src/lib/mysteryPlayer.js');
const { formatAsOf } = await import('../../src/lib/top10.js');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-games.golden.json', import.meta.url)), 'utf8'));
const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
const html2 = (node) => renderToStaticMarkup(React.createElement(React.Fragment, null, node));
// The first byte where two renders part, with context.
function firstDiff(was, now) {
  if (was === now) return null;
  let i = 0;
  while (was[i] === now[i]) i++;
  return `at ${i}\n  was: …${was.slice(Math.max(0, i - 80), i + 80)}…\n  now: …${String(now).slice(Math.max(0, i - 80), i + 80)}…`;
}

let store;
// Noon on 20 Oct 2026, as the golden was rendered.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
  fillPool(S);
  store = stubGlobals();
});
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); __resetI18nForTests(); });

describe('English is byte-identical (golden markup from main before step 3)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(buildScenarios(S).map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('Footle, the quiz engine, the Quiz screen, Trail, Mystery and Top 10 render exactly as before', async () => {
    __resetI18nForTests();
    await bootLang(store, null);
    expect(getLang()).toBe('en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
  it('an explicit biq_lang=en is the same English', async () => {
    __resetI18nForTests();
    await bootLang(store, 'en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
});

describe('the step 3 keys', () => {
  it('each one prints its pinned English', () => {
    for (const [k, v] of Object.entries(STEP3_EN)) expect(en[k], k).toBe(v);
  });
  it('the pinned list is every key step 3 added (they follow settings.language in en.js, up to step 4\'s first)', () => {
    const keys = Object.keys(en);
    expect(keys.slice(keys.indexOf('settings.language') + 1, keys.indexOf('dd.aria')).sort()).toEqual(Object.keys(STEP3_EN).sort());
  });
  it('each one has a Spanish value, with the same {placeholders}', () => {
    expect(Object.keys(STEP3_EN).filter((k) => typeof es[k] !== 'string' || !es[k])).toEqual([]);
  });
  it('product names stay untranslated in Spanish', () => {
    for (const k of Object.keys(STEP3_EN)) {
      for (const name of ['Footle', 'Daily 7', 'Transfer Trail', 'Mystery Player', 'Top 10', 'Ball IQ']) {
        if (en[k].includes(name)) expect(es[k], `${k} keeps "${name}"`).toContain(name);
      }
    }
    expect(es['mp.streak']).toContain('Mystery');
    expect(es['trail.streak']).toContain('Trail');
  });
});

// Strings no static render reaches (a tap, a timer, a toast, a sheet), and the
// ones the old code built from pieces: each must still print the old English.
describe('English that only appears after a tap or is built from parts', () => {
  beforeAll(async () => { __resetI18nForTests(); await bootLang(store, null); });
  const html = html2;
  it('plurals keep the old singular/plural English', () => {
    expect(t('game.left', { count: 1 })).toBe('1 guess left');
    expect(t('game.left', { count: 4 })).toBe('4 guesses left');
    expect(t('trail.gotIt', { count: 1 })).toBe('Got it on 1 club');
    expect(t('trail.gotIt', { count: 3 })).toBe('Got it on 3 clubs');
    expect(t('mp.solved', { count: 1 })).toBe('Solved in 1 guess');
    expect(t('mp.gaveUp', { count: 7 })).toBe('Gave up after 7 guesses');
    expect(t('mp.clues', { count: 1 })).toBe('1 clue');
    expect(t('mp.clues', { count: 2 })).toBe('2 clues');
    expect(t('mp.clues')).toBe('Clues');
    expect(t('mp.unlocksIn', { count: 1 })).toBe('unlocks in 1 guess');
    expect(t('mp.inN', { count: 3 })).toBe('in 3 guesses');
    expect(t('top10.allSpare', { count: 1 })).toBe('All ten, with 1 life to spare.');
    expect(t('top10.allSpare', { count: 2 })).toBe('All ten, with 2 lives to spare.');
  });
  it('the word lists are the old arrays', () => {
    expect(t('top10.ords').split(' ')).toEqual(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']);
    expect(t('top10.months').split(' ')).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
    expect(formatAsOf('2026-03-07')).toBe('7 Mar 2026');
    expect(t('trail.nums').split(' ')).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
    expect([1, 2, 3, 4, 5, 6].map(footleWinWord)).toEqual(['Top bins!', 'World class', 'Brilliant', 'Solid', 'Close call', 'Last-gasp winner']);
    expect(footleWinWord(9)).toBe('Last-gasp winner');
  });
  it('the lib lines read as before', () => {
    const board3 = ['Atlético Madrid', 'Man Utd', 'Chelsea'];
    expect(wrongPathNote('Falcao', [board3], board3.slice(0, 2))).toBe('Falcao played for both, wrong path');
    expect(wrongPathNote('Falcao', [board3], board3)).toBe('Falcao played for all three, wrong path');
    expect(wrongPathNote('Falcao', [board3.slice(0, 2)], [...board3, 'Monaco'], board3.slice(0, 2))).toBe('Falcao played for the first two, wrong path');
    expect(topShare(30, 1000)).toBe('top 3%');
    expect(footleClue('PELE')).toBe('Goes by a single name');
    expect(footleClue('KANE')).toBe('First name starts with H');
    const x = (o) => ({ shared: [], samePosition: false, gap: null, era: null, bornWhen: null, ...o });
    expect(reasonLine(x({ shared: [{ club: 'Juventus', together: 2 }], samePosition: true, era: 'same', bornWhen: 'later', gap: 2 }))).toBe('Teammates at Juventus · Same position · Same era, born later');
    expect(reasonLine(x({ shared: [{ club: 'Barcelona', together: 0 }], era: 'far', bornWhen: 'later', gap: 15 }))).toBe('Shared Barcelona · Later era');
    expect(reasonLine(x({ era: 'near', bornWhen: 'earlier', gap: 6 }))).toBe('No shared club, born 6 years earlier');
    expect(reasonLine(x({ era: 'same', bornWhen: 'earlier', gap: 2 }))).toBe('No shared club · Same era, born earlier');
    expect(reasonLine(x({ samePosition: true, era: 'far' }))).toBe('No shared club · Same position · Different era');
    expect(reasonLine(x({ era: 'near', gap: 5 }))).toBe('No shared club, born 5 years apart');
    expect(reasonLine(x({}))).toBe('No shared club');
  });
  it('the quiz engine’s after-the-answer strings and the quit sheet', () => {
    expect(html(rich(t('quiz.leaveBody'), { score: React.createElement('strong', null, 3), n: React.createElement('strong', null, 5) })))
      .toBe('<strong>3</strong> right from <strong>5</strong> answered — that&#x27;s lost if you quit.');
    expect(t('quiz.secsLeft', { n: 10 })).toBe('10 seconds left');
    expect(t('quiz.secsLeft', { n: 5 })).toBe('5 seconds left');
    expect([t('quiz.right'), t('quiz.timesUp'), t('quiz.wrong'), t('quiz.why')]).toEqual(['✓ Correct!', "Time's up", '✗ Incorrect', 'Why?']);
    expect([t('quiz.next'), t('quiz.results'), t('quiz.leave'), t('quiz.leaveLost'), t('quiz.keepPlaying'), t('quiz.quit')])
      .toEqual(['Next →', 'Results →', 'Leave this quiz?', 'Your progress will be lost.', 'Keep playing', 'Quit']);
    expect(t('quiz.inARow', { n: 3 })).toBe('3 in a row');
    expect([t('quiz.surv1'), t('quiz.surv2'), t('quiz.surv5'), t('quiz.surv10'), t('quiz.newPb')]).toEqual(['First one!', 'Keep going!', 'On fire!', 'Unstoppable!', 'New PB']);
    expect([t('report.sending'), t('report.done')]).toEqual(['Sending…', '✓ Reported — thanks']);
  });
  it('Footle’s rich reveal line keeps its markup', () => {
    const name = React.createElement(React.Fragment, null, 'Harry ', React.createElement('strong', null, 'Kane'));
    expect(html(rich(t('footle.answerWas'), { name }))).toBe('The answer was Harry <strong>Kane</strong>');
    expect(t('footle.hardOn')).toBe('Hard mode: on');
    expect(t('footle.srGuess', { n: 2, parts: 'K correct spot' }) + ` ${t('footle.srSolved', { a: 'KANE' })}`)
      .toBe('Guess 2 of 6: K correct spot. Solved — the answer is KANE.');
  });
  it('Top 10’s pick lines and Mystery’s errors and trend', () => {
    expect(t('top10.near', { note: '11th, 150 goals' })).toBe('So close: 11th, 150 goals. No life lost.');
    expect(t('top10.miss', { name: 'Les Ferdinand' })).toBe('Les Ferdinand: not in the ten');
    expect(t('top10.countsAs', { name: 'Russia', shown: 'Soviet Union' })).toBe('Russia counts as Soviet Union');
    expect(t('mp.noSuch', { q: 'Zidane' })).toBe('No player called "Zidane" in today\'s pool.');
    expect(t('mp.colder', { r: '1,204' })).toBe('Colder than your closest, rank 1,204');
    expect(t('mp.rules', { a: 4, b: 8 })).toMatch(/A club he played for unlocks after 4 guesses, his initials after 8\.$/);
  });
  it('the How-to-play sheet: Footle and Survival read from en.js, the other two stay as they were', () => {
    const app = read('App.jsx');
    expect(app).toContain('wordle: { title:"Footle", stepKey:"help.footle" },');
    expect(app).toContain('survival: { titleKey:"home.mode.survival", stepKey:"help.survival" },');
    expect(app).toContain('{t("help.gotIt")}');
    expect(en['home.mode.survival']).toBe('Survival');
    expect([1, 2, 3, 4, 5].map((i) => t(`help.footle.${i}`))).toEqual(["Guess the name today's footballer goes by — usually a surname, sometimes a one-name legend", 'Green = right letter, right spot', 'Yellow = right letter, wrong spot', 'Grey = not in the name at all', '6 guesses, new player at midnight']);
  });
});

describe('Spanish (biq_lang=es)', () => {
  let now;
  beforeAll(async () => {
    __resetI18nForTests();
    await bootLang(store, 'es');
    expect(getLang()).toBe('es');
    now = renderAll(S, store);
  });
  afterAll(() => { __resetI18nForTests(); });
  const unq = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  it('no English string of a step 3 key is left in any of the 64 renders', () => {
    // Whole-string English values, as a text node or an attribute. Values the
    // same in both languages (Local, Quiz…) are skipped.
    // "Back to Home" is also the finished dailies' own footer (ResultFoot, a
    // shared finish panel that moves in step 4), so it is not looked for here.
    const english = Object.keys(STEP3_EN).filter((k) => es[k] !== en[k] && !/\{\w+\}/.test(en[k]) && k !== 'quiz.backHome').map((k) => en[k]);
    const left = [];
    for (const [name, markup] of Object.entries(now)) {
      const m = unq(markup);
      for (const e of english) if (m.includes(`>${e}<`) || m.includes(`="${e}"`)) left.push(`${name}: "${e}"`);
    }
    expect(left).toEqual([]);
  });
  it('Footle', () => {
    const fresh = unq(now['footle: fresh board (legend, hard-mode switch)']);
    for (const s of ['>Apellido de un futbolista<', '>en su sitio<', '>en otro sitio<', '>Modo difícil<', '>ENVIAR<', 'aria-label="Borrar la última letra"', 'aria-label="Cómo se juega a Footle"', '>N.º ']) expect(fresh).toContain(s);
    expect(unq(now['footle: three guesses (the clue offer)'])).toContain('¿Te atascas? Pide una pista');
    expect(unq(now['footle: clue taken'])).toMatch(/Su nombre empieza por [A-Z]</);
    expect(unq(now['footle: three guesses (the clue offer)'])).toMatch(/Intento 3 de 6: [A-Z] no está/);
    const won = unq(now['footle: won in 3']);
    expect(won).toContain('>Brillante<');
    expect(won).toContain('La respuesta era Brad <strong>Friedel</strong>');
    expect(won).toContain('>Resuelto en 3/6<');
    expect(won).toContain('>El reto de hoy<');
    expect(won).toContain('>Próximo<');
    expect(unq(now['footle: lost'])).toContain('>Sin intentos. La respuesta era<');
    expect(unq(now['footle: archive, fresh'])).toContain('>Del archivo<');
    expect(unq(now['footle: hard mode, one guess in'])).toContain('>Difícil: solo nombres reales<');
  });
  it('the quiz engine and the Quiz screen', () => {
    const classic = unq(now['quiz: classic, timed, first question']);
    for (const s of ['>Clásico<', '>Champions League<', '>P 01 / 3<', '>Pregunta 1<', '>aciertos<', 'Racha 0', 'aria-label="Salir de la partida"', 'aria-label="Volver"']) expect(classic).toContain(s);
    const surv = unq(now['quiz: survival, PB 12']);
    for (const s of ['>A muerte<', '>Un fallo y se acaba<', '>Récord: 12<', '>P1<']) expect(surv).toContain(s);
    expect(unq(now['quiz: speed, club label'])).toContain('>Quiz de club<');
    expect(unq(now['quiz: speed, club label'])).toContain('Quedan 10 segundos');
    expect(unq(now['quiz: legends, a typed question (easy, with the first-letter hint)'])).toContain('Empieza por "T"');
    expect(unq(now['quiz: legends, a typed question (easy, with the first-letter hint)'])).toContain('>Enviar →<');
    expect(unq(now['quiz: true or false'])).toContain('>VERDADERO<');
    expect(unq(now['quiz: managers category, local mode'])).toContain('>Entrenadores<');
    expect(unq(now['quiz: no questions (could not load)'])).toContain('>No se pudieron cargar las preguntas<');
    const qs = unq(now['quiz screen: Premier League, rated']);
    for (const s of ['>Mezcla<', '>De todo<', '>Ligas<', '>Torneos<', '>Temas<', '>Selecciones<', '>Eurocopa<', '>Otros formatos<', '>Estadios<', '>Empezar<', 'Diez preguntas · sube tu media']) expect(qs).toContain(s);
    expect(unq(now['quiz screen: legends'])).toContain('<strong>Leyendas</strong> · Diez preguntas · antes de 2000');
  });
  it('Transfer Trail', () => {
    const fresh = unq(now['trail: fresh']);
    for (const s of ['>¿Qué jugador es?<', '>5 intentos<', 'aria-label="5 intentos"', '>cedido<', '>Pasar y ver el siguiente club<', 'placeholder="Escribe un jugador…"']) expect(fresh).toContain(s);
    expect(unq(now['trail: one guess left'])).toContain('>1 intento<');
    expect(unq(now['trail: one wrong guess'])).toContain('>↩ vuelve<');
    const won = unq(now['trail: won on the first two clubs']);
    for (const s of ['>Resuelto<', '>Era<', '>Acertado con 2 clubes<']) expect(won).toContain(s);
    expect(unq(now['trail: lost'])).toContain('>Sin intentos: vuelve mañana<');
    expect(unq(now['trail: archive, lost'])).toContain('>Sin intentos: este ya es historia<');
    expect(unq(now['trail: embedded (static page), fresh'])).toContain('adivina el jugador por su carrera');
    expect(unq(now['trail: no career (coming soon)'])).toContain('Muy pronto: una carrera nueva');
  });
  it('Mystery Player', () => {
    const fresh = unq(now['mystery: fresh, the pool in (free clues, the key to the colours)']);
    for (const s of ['>Intentos ilimitados<', '>Posición<', '>Nació<', '>Jugó en<', '>Iniciales<', '>en 4 intentos<', '>ardiendo<', '>El resto<', '>Puesto 1<', 'placeholder="Busca un jugador"', 'aria-label="Pistas"']) expect(fresh).toContain(s);
    expect(unq(now['mystery: fresh, the pool not loaded yet'])).toContain('>Al empezar<');
    const five = unq(now['mystery: five guesses (club clue ready, give up offered)']);
    for (const s of ['>Mejor<', '>Toca para verla<', '>Rendirse y ver la respuesta<', 'Ningún club en común', '>caliente<']) expect(five).toContain(s);
    expect(unq(now['mystery: nine guesses, both clues taken'])).not.toContain('(one name)');
    const won = unq(now['mystery: won in 6 with a clue']);
    expect(won).toContain('Resuelto en 6 intentos · 1 pista');
    expect(won).toContain('nacido en 1986');
    expect(won).toContain('aria-label="Trayectoria"');
    expect(unq(now['mystery: gave up after 5'])).toContain('Te rendiste tras 5 intentos');
    expect(unq(now['mystery: gave up after 5'])).toContain('>Era Olivier Giroud<');
    expect(unq(now['mystery: archive, two guesses'])).toContain(' · archivo');
    expect(unq(now['mystery: no puzzle today'])).toContain('Hoy no hay Mystery Player');
  });
  it('Top 10', () => {
    const fresh = unq(now['top10: fresh, a player list']);
    for (const s of ['>Nombra los diez. Tres vidas.<', 'A 1 oct 2026 · pista: club', 'aria-label="Te quedan 3 de 3 vidas"', 'aria-label="Los diez"', '>¿No sale? Enséñame la lista<', 'placeholder="Escribe un jugador…"']) expect(fresh).toContain(s);
    expect(unq(now['top10: fresh, a nation list with no clue label or note'])).toContain('placeholder="Escribe un país…"');
    expect(unq(now['top10: out of lives'])).toContain('>Sin vidas. Arriba tienes los que se te escaparon.<');
    expect(unq(now['top10: out of lives'])).toContain('>La lista completa<');
    expect(unq(now['top10: gave up on nought'])).toContain('>Hoy tocaba una difícil. Arriba tienes los diez.<');
    expect(unq(now['top10: perfect, no miss'])).toContain('>Diez de diez<');
    expect(unq(now['top10: perfect, one life spare'])).toContain('>Los diez, con 1 vida de sobra.<');
    expect(unq(now['top10: perfect, two lives spare'])).toContain('>Los diez, con 2 vidas de sobra.<');
    expect(unq(now['top10: three found, one miss, one near'])).toContain('aria-label="No están entre los diez"');
    expect(unq(now['top10: could not load'])).toContain('No se pudo cargar la lista de hoy');
  });
  it('plurals and lines built from parts, in Spanish word order', () => {
    expect(t('game.left', { count: 1 })).toBe('1 intento');
    expect(t('game.left', { count: 3 })).toBe('3 intentos');
    expect(t('mp.gaveUp', { count: 1 })).toBe('Te rendiste tras 1 intento');
    expect(t('top10.ords').split(' ')[2]).toBe('3.º');
    expect(formatAsOf('2026-09-07')).toBe('7 sept 2026');
    const board3 = ['Atlético Madrid', 'Man Utd', 'Chelsea'];
    expect(wrongPathNote('Falcao', [board3], board3)).toBe('Falcao jugó en los tres, pero no es él');
    expect(wrongPathNote('Falcao', [board3.slice(0, 2)], [...board3, 'Monaco'], board3.slice(0, 2))).toBe('Falcao jugó en los dos primeros, pero no es él');
    const x = (o) => ({ shared: [], samePosition: false, gap: null, era: null, bornWhen: null, ...o });
    expect(reasonLine(x({ era: 'near', bornWhen: 'earlier', gap: 6 }))).toBe('Ningún club en común, nació 6 años antes');
    expect(reasonLine(x({ shared: [{ club: 'Juventus', together: 2 }], era: 'same', bornWhen: 'later', gap: 2 }))).toBe('Compañeros en Juventus · Misma época, nació después');
    expect(footleWinWord(1)).toBe('¡Por la escuadra!');
    expect(footleClue('PELE')).toBe('Se le conoce por un solo nombre');
    expect(html2(rich(t('quiz.leaveBody'), { score: React.createElement('strong', null, 3), n: React.createElement('strong', null, 5) })))
      .toBe('Llevas <strong>3</strong> de <strong>5</strong>: si sales, lo pierdes.');
  });
});

describe('no copy left behind in the source', () => {
  const FILES = ['games/FootballWordle.jsx', 'screens/QuizEngine.jsx', 'screens/QuizScreen.jsx', 'screens/TransferTrail.jsx', 'screens/MysteryPlayer.jsx', 'screens/Top10.jsx', 'components/InAppStrip.jsx', 'components/GameTitle.jsx'];
  it('the game screens print no English literal a step 3 key replaced', () => {
    // Not scanned: words that are also ids or data in this code. "Legends" is a
    // category id, "correct" a sound and haptic name, TRUE/FALSE the stored
    // answer of a true-or-false question (for the review screen, step 4),
    // "ENTER" Footle's key code, "warm"/"cold" Mystery's band ids, "Career"
    // the `thing` ResultFoot (a finish panel, step 4) builds its line from.
    const DATA = new Set(['Legends', 'correct', 'TRUE', 'FALSE', 'ENTER', 'warm', 'cold', 'Career']);
    const literals = Object.values(STEP3_EN).filter((v) => !/\{\w+\}/.test(v) && v.length > 3 && !DATA.has(v));
    const found = [];
    for (const f of FILES) {
      // Code only: comments quote old copy on purpose.
      const code = read(f).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const v of literals) {
        if (code.includes(`>${v}<`) || code.includes(`"${v}"`) || code.includes(`'${v}'`) || code.includes(`\`${v}\``) || new RegExp(`>\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`).test(code)) found.push(`${f}: ${v}`);
      }
    }
    expect(found).toEqual([]);
  });
  it('each screen component subscribes to the language (useT), so a switch re-renders it', () => {
    for (const f of FILES) expect(read(f), f).toMatch(/const t = useT\(\);/);
    const t10 = read('screens/Top10.jsx');
    for (const fn of ['function Head(', 'export default function Top10(', 'function Top10Board(']) {
      expect(t10.slice(t10.indexOf(fn), t10.indexOf(fn) + 260), fn).toContain('const t = useT();');
    }
    const qe = read('screens/QuizEngine.jsx');
    expect(qe.slice(qe.indexOf('export function TypedInput('), qe.indexOf('export function TypedInput(') + 150)).toContain('const t = useT();');
  });
  it('es.js stays lazy: nothing in src/ imports it statically', () => {
    for (const f of [...FILES, 'App.jsx', 'i18n/rich.jsx', 'lib/trail.js', 'lib/mysteryPlayer.js', 'lib/top10.js', 'lib/wordleFullNames.js', 'components/ReportButton.jsx']) {
      expect(read(f), f).not.toMatch(/from ['"][./]*i18n\/es\.js['"]|from ['"]\.\/es\.js['"]/);
    }
  });
});
