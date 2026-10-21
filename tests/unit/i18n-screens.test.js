// i18n step 4: every user-visible string on the finish panels (DailyDone,
// ResultFoot, ChallengeBanner), the results screens, the answer review, the
// History tab, Profile, Settings and Onboarding goes through t()
// (src/i18n/en.js), with Spanish in es.js.
//
//   • ENGLISH IS BYTE-IDENTICAL. Each surface is rendered in the states listed
//     in i18n-screens.scenarios.js and compared with i18n-screens.golden.json:
//     the markup the same scenarios produced on main before step 4 (12708880).
//     Do not regenerate the golden to make this pass: a diff here IS an
//     English regression.
//   • Every key step 4 added is pinned to its exact English
//     (i18n-screens.keys.js), and the tables the game keeps in English for
//     its share texts (levels, tiers, badges, verdicts …) must agree with them.
//   • Spanish renders with biq_lang=es, with no step 4 English left.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const S = vi.hoisted(() => ({ calls: {}, state: null, auth: null }));
vi.mock('react', async (orig) => {
  const R = await orig();
  const { overriddenUseState } = await import('./i18n-screens.harness.js');
  const useState = overriddenUseState(S, R.useState);
  return { ...R, default: { ...R.default, useState }, useState };
});
// A static render cannot portal; the sheets Profile portals to document.body
// render in place instead.
vi.mock('react-dom', async (orig) => {
  const R = await orig();
  const createPortal = (c) => c;
  return { ...R, default: { ...R.default, createPortal }, createPortal };
});
vi.mock('../../src/useAuth.jsx', async (orig) => ({ ...(await orig()), useAuth: () => S.auth }));

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { pinDefaultLocale, stubWalkableStorage } = await import('./i18n-screens.harness.js');
const { renderAll, buildScenarios } = await import('./i18n-screens.scenarios.js');
const { STEP4_EN } = await import('./i18n-screens.keys.js');
const { t, getLang, __resetI18nForTests } = await import('../../src/i18n/index.js');
const { levelName, tierName, compName } = await import('../../src/i18n/names.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const { LEVELS } = await import('../../src/lib/scoring.js');
const { CARD_TIERS, CARD_COMPS } = await import('../../src/lib/ballIqCard.js');
const { BADGE_DEFS } = await import('../../src/screens/ProfileScreen.jsx');
const { REPORT_REASONS } = await import('../../src/lib/userReports.js');
const { dailyTierCopy, scoreTagline } = await import('../../src/lib/resultsCopy.js');
const { resultVerdict } = await import('../../src/lib/resultVerdict.js');
const { ONBOARD_SAMPLE } = await import('../../src/screens/OnboardingScreen.jsx');
const { comparisonLine } = await import('../../src/lib/dailyResults.js');
const { scoreLabel, challengeLine } = await import('../../src/lib/gameChallenge.js');
const { reportLabel } = await import('../../src/components/ResultFoot.jsx');
const { catLabel, CAT_LABELS, LEAGUE_QUIZ_SECTIONS } = await import('../../src/App.jsx');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-screens.golden.json', import.meta.url)), 'utf8'));
const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
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
  pinDefaultLocale();
  store = stubGlobals();
  stubWalkableStorage(store);
});
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); __resetI18nForTests(); });

describe('English is byte-identical (golden markup from main before step 4)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(buildScenarios().map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('the finish panels, results, review, History, Profile, Settings and Onboarding render exactly as before', async () => {
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

describe('the step 4 keys', () => {
  it('each one prints its pinned English', () => {
    for (const [k, v] of Object.entries(STEP4_EN)) expect(en[k], k).toBe(v);
  });
  it('the pinned list is every key step 4 added (from dd.aria to the end of en.js)', () => {
    const keys = Object.keys(en);
    expect(keys.slice(keys.indexOf('dd.aria')).sort()).toEqual(Object.keys(STEP4_EN).sort());
  });
  it('each one has a Spanish value', () => {
    expect(Object.keys(STEP4_EN).filter((k) => typeof es[k] !== 'string' || !es[k])).toEqual([]);
  });
  it('product names stay untranslated in Spanish', () => {
    for (const k of Object.keys(STEP4_EN)) {
      for (const name of ['Footle', 'Daily 7', 'Transfer Trail', 'Mystery Player', 'Top 10', 'Draft', 'Ball IQ']) {
        if (en[k].includes(name)) expect(es[k], `${k} keeps "${name}"`).toContain(name);
      }
    }
    // The shared vocabulary: Hot Streak = Crono, Survival = A muerte.
    for (const k of ['hs.newBest', 'st.r6', 'bd.speed_demon.d']) expect(es[k], k).toContain('Crono');
    for (const k of ['hi.survNever', 'bd.survivor.d']) expect(es[k], k).toContain('A muerte');
  });
});

// The game keeps some of these words in English tables, for share texts and
// the share card that go to someone else. The keys must say what they say.
describe('the English tables and their keys agree', () => {
  beforeAll(async () => { __resetI18nForTests(); await bootLang(store, null); });
  it('levels, tiers, competitions, badges and report reasons', () => {
    expect(LEVELS.map((l) => levelName(l.name))).toEqual(LEVELS.map((l) => l.name));
    expect(levelName('Not a level')).toBe('Not a level');
    for (const tier of Object.keys(CARD_TIERS)) expect(tierName(tier), tier).toBe(CARD_TIERS[tier].label);
    for (const c of CARD_COMPS) {
      expect(compName(c), c.cat).toBe(c.name);
      expect(compName(c, true), `${c.cat} short`).toBe(c.short || c.name);
    }
    for (const [id, , name, desc] of BADGE_DEFS) {
      expect(t(`bd.${id}`), id).toBe(name);
      expect(t(`bd.${id}.d`), `${id} desc`).toBe(desc);
    }
    for (const r of REPORT_REASONS) expect(t(`pf.rr.${r.value}`), r.value).toBe(r.label);
  });
  it('the result tiers and verdicts', () => {
    for (let s = 0; s <= 7; s++) {
      const band = ['h0', 'h1', 'h2', 'h3', 'h4'].findIndex((h) => t(`d7.${h}`) === dailyTierCopy(s, 7).headline);
      expect(band, `${s}/7`).toBeGreaterThanOrEqual(0);
      expect(t(`d7.s${band}`)).toBe(dailyTierCopy(s, 7).sub);
    }
    for (let p = 0; p <= 100; p++) expect([0, 1, 2, 3, 4].map((i) => t(`tag.${i}`))).toContain(scoreTagline(p));
    expect([100, 80, 60, 40, 0].map((p) => t(`rv.${p}`))).toEqual([100, 80, 60, 40, 0].map(resultVerdict));
  });
  it('the onboarding question, and the category names', () => {
    expect(t('ob.q')).toBe(ONBOARD_SAMPLE.q);
    for (const c of Object.keys(CAT_LABELS)) expect(catLabel(t, c), c).toBe(CAT_LABELS[c]);
    for (const s of LEAGUE_QUIZ_SECTIONS) for (const it of s.items) expect(catLabel(t, it.cat), it.cat).toBe(it.name);
  });
});

// Strings no static render reaches (a toast, a fetch, a lib line), and the ones
// built from parts: each must still print the old English.
describe('English that only appears after a tap or is built from parts', () => {
  beforeAll(async () => { __resetI18nForTests(); await bootLang(store, null); });
  it('the line about everyone else', () => {
    const e = (o) => Object.entries(o).map(([b, c]) => [Number(b), c]);
    expect(comparisonLine(e({ 3: 5, 4: 10 }), 15, { outOf: null, mine: 3, won: true })).toBe('Only 33% matched you');
    expect(comparisonLine(e({ 3: 1, 4: 10 }), 11, { outOf: null, mine: 3, won: true })).toBe('Nobody did better');
    expect(comparisonLine(e({ 2: 10, 3: 50, 4: 40 }), 100, { outOf: null, mine: 3, won: true })).toBe('Same as 50% of players');
    expect(comparisonLine(e({ 1: 5, 2: 10, 4: 85 }), 100, { outOf: null, mine: 2, won: true })).toBe('Top 15%');
    expect(comparisonLine(e({ 2: 30, 4: 30, 5: 40 }), 100, { outOf: 7, mine: 4, won: true })).toBe('Better than 30%');
  });
  it('the challenge lines: the banner in the language, the outgoing text in English', () => {
    expect(challengeLine({ game: 'footle', score: 3, name: 'Alex' })).toBe('Alex solved it in 3');
    expect(challengeLine({ game: 'top10', score: 7, name: '' })).toBe('A mate got 7/10');
    expect(challengeLine({ game: 'trail', score: 0, name: 'Jo' })).toBe('Jo missed this one');
    expect(challengeLine({ game: 'trail', score: 1, name: 'Jo' })).toBe('Jo got him with 1 club');
    expect(challengeLine({ game: 'trail', score: 2, name: 'Jo' })).toBe('Jo got him with 2 clubs');
    expect([scoreLabel('trail', 1, t), scoreLabel('trail', 3, t), scoreLabel('trail', 0, t)]).toEqual(['1 club', '3 clubs', 'missed']);
    expect(reportLabel('Career')).toBe('Career looks wrong? Tell us');
  });
  it('the toasts and the sheets a tap opens', () => {
    expect(t('pf.newReq', { name: 'Sam' })).toBe('📩 New friend request from Sam');
    expect(t('pf.reqSent', { name: 'Sam' })).toBe('Friend request sent to Sam ✉️');
    expect(t('st.signOutBody', { app: 'Ball IQ' })).toBe('Sign out of your Ball IQ account on this device? Your progress stays synced — sign back in any time to pick up where you left off.');
    expect(t('ob.wrong', { a: ONBOARD_SAMPLE.o[ONBOARD_SAMPLE.a] })).toBe("It's Cristiano Ronaldo — the all-time record holder. You'll pick these up fast!");
    expect(t('rw.solvedIn', { count: 1 })).toBe('Solved in 1 guess');
    expect(t('rw.solvedIn', { count: 4 })).toBe('Solved in 4 guesses');
    expect([1, 2, 3, 4, 5, 6].map((n) => t(`rw.t${n}`))).toEqual(['Incredible', 'Excellent', 'Great', 'Good', 'Phew', 'Just made it']);
    expect(t('dd.shieldsAria', { count: 1 })).toBe('1 streak shield banked: each covers one missed day');
    expect(t('dd.shieldsAria', { count: 2 })).toBe('2 streak shields banked: each covers one missed day');
    expect(t('dd.today', { g: 'Top 10' }) + ' / ' + t('dd.contToday', { g: 'Footle' })).toBe("Today's Top 10 / Continue today's Footle");
    expect(`Non-League · 120 XP${t('dd.toNext', { n: 180, name: 'Championship' })}`).toBe('Non-League · 120 XP · 180 to Championship');
    expect(t('hi.gapN', { a: 'Oct 12', b: 'Oct 17', n: 6 })).toBe('Oct 12 to Oct 17 · 6 days not played');
    expect(t('pf.badgeAria', { name: 'Scholar', s: t('pf.locked') })).toBe('Scholar — locked. Tap for details.');
    expect(t('cf.prov', { c: 'International', r: 61, n: 4, min: 10 })).toBe('International 61, provisional — 4 of 10 answered');
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
  // Unescaped, and without React's text-node separators: "Récord personal (antes 5)".
  const unq = (s) => s.replace(/<!-- -->/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  it(`no English string of a step 4 key is left in any of the ${Object.keys(GOLDEN).length} renders`, () => {
    // Whole-string English values, as a text node or an attribute. Values the
    // same in both languages are skipped, and so is what the scenarios pass in
    // themselves (a host's streak label, a "Next up" name, a save line, a
    // player called "Unknown"): the app hands those over translated.
    const english = Object.keys(STEP4_EN).filter((k) => es[k] !== en[k] && !/\{\w+\}/.test(en[k]) && !/^dd\.l\./.test(k) && k !== 'pf.unknown').map((k) => en[k]);
    const left = [];
    for (const [name, markup] of Object.entries(now)) {
      const m = unq(markup);
      for (const e of english) if (m.includes(`>${e}<`) || m.includes(`="${e}"`)) left.push(`${name}: "${e}"`);
    }
    expect(left).toEqual([]);
  });
  it('the finish panel', () => {
    const won = unq(now['dd: footle won in 3, everything on, loading']);
    for (const s of ['Mañana serán <', '> · nuevos retos en <', ' Avísame a las 19:00', 'Asciendes a <strong>Regional<', ' Compartir resultado<', '>Reta a un colega<', '>Ahora toca<', '>Siete preguntas · 3 min<', '>Jugar<', '> hechos hoy<', '>Cómo le fue a todos<', 'aria-label="Tras el reto de hoy"']) expect(won, s).toContain(s);
    expect(unq(now['dd: footle lost, streak safe, reminder on, early numbers'])).toContain('>Racha a salvo<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('>Mejor que el 44%<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('>4,6/7<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('>1240 jugadas<');
    expect(unq(now['dd: trail won on 2, yesterday stands in'])).toContain('>Ayer, N.º 74<');
    expect(unq(now['dd: trail won on 2, yesterday stands in'])).toContain('Llegas pronto hoy. <strong class="dd-num">77%</strong> resolvió el de ayer.');
    expect(unq(now['dd: top 10 on 7, a mate beat it'])).toContain('>Esta la gana Sam<');
    expect(unq(now['dd: trail missed, mate got it on 1'])).toContain('>fallado<');
    expect(unq(now['dd: mystery won, all done today (clean sweep)'])).toContain('>Pleno<');
    expect(unq(now['dd: guest save, 4-day streak, no line'])).toContain('>Tu racha de <strong class="dd-num">4 días</strong>: solo en este móvil.<');
    expect(unq(now['dd: shared, no label'])).toContain('>2 días de racha<');
    expect(unq(now['challenge banner: trail on 3 clubs'])).toContain('>Sam lo sacó con 3 clubes<');
    expect(unq(now['resultfoot: career report and the way out'])).toContain('¿Trayectoria errónea? Avísanos');
  });
  it('the results', () => {
    const c = unq(now['results: classic 7/10, new best over 5, footle open']);
    for (const s of ['>Resultado final<', '>Buena actuación.<', '>Récord personal (antes 5)<', 'Te faltan 3 respuestas para tener media', '>Juega al Footle de hoy<', '>Repasa tus fallos (2)<', '>Ronda completada<', '>Clásico<', '>XP ganados<']) expect(c, s).toContain(s);
    expect(unq(now['results: classic 3/10, daily open (the daily is the primary), one more to rate'])).toContain('Te falta 1 respuesta para tener media');
    expect(unq(now['results: survival 12, new best over 8'])).toContain('>12 seguidas antes del primer fallo<');
    expect(unq(now['results: daily 7 on 5, the panel'])).toContain('>Hoy había alguna difícil.<');
    expect(unq(now['hot streak: first run, 3'])).toContain('⚡🔥 Crono');
    expect(unq(now['true or false: perfect 10'])).toContain('>Nivel Balón de Oro<');
  });
  it('the review', () => {
    const r = unq(now['review: daily 7 today, full review, day 1 streak']);
    for (const s of ['>Hoy · martes, 20 de octubre<', '>Repaso completo<', '>P1<', '>Selecciones<', '>VERDADERO<', '>tu respuesta<', '>sin tiempo<', '>Escribiste: <', '>mié<']) expect(r, s).toContain(s);
    expect(unq(now['review: footle lost'])).toContain('>Mañana será otro día<');
    expect(unq(now['review: footle won in 4, clue, hard'])).toContain('>Resuelto en 4 intentos<');
  });
  it('History', () => {
    const h = unq(now['history: two weeks with gaps, yesterday open']);
    for (const s of ['>Historial<', '>Nuevos retos en<', '>1 día de racha<', '>HACE 2 SEM<', '>Últimos días<', '>Ayer<', '>dom<', '>18 oct<', '15 oct – 16 oct · 2 días sin jugar', '>1 escudo de racha listo<', '>5,0 / 7<']) expect(h, s).toContain(s);
    expect(unq(now['history: all done today, yesterday open, streak broke'])).toContain('>Se rompió tu racha de 9 días<');
    expect(unq(now['history: a new player, nothing played'])).toContain('Termina cualquiera de los cuatro retos de hoy');
  });
  it('Profile, a friend, blocked users', () => {
    const p = unq(now['profile: signed in, rated, friends and requests']);
    for (const s of ['>Perfil<', '>Tu Ball IQ<', ' Nivel europeo · 1640 XP<', '>MEDIA<', '>ORO<', '>Medias por liga<', '>Selecciones<', ' Informe del ojeador<', '>A mejorar<', '"Especialista en Premier League"', ' Tu camino<', '>ESTÁS AQUÍ<', '>Faltan 1360 XP<', '>20.000 XP<', '>Solicitudes recibidas<', '>Puntos 900<', '>Clasificación de amigos<', '>TÚ<', '>Insignias: 4/12 conseguidas<', '>Velocista<', '>12 en Crono<', '>✓ Conseguida<']) expect(p, s).toContain(s);
    expect(unq(now['profile: guest, first visit (the example card)'])).toContain('>EJEMPLO<');
    expect(unq(now['profile: guest, first visit (the example card)'])).toContain('RESPONDE 10 PARA TENER MEDIA');
    expect(unq(now['profile: guest, 4 answered, example dismissed'])).toContain('FALTAN 6 PARA TENER MEDIA');
    expect(unq(now['profile: league picker open'])).toContain('>40 respondidas<');
    expect(unq(now['friend: loaded'])).toContain('>Retar a Jo<');
    expect(unq(now['friend: loaded'])).toContain(' El camino de Jo<');
    expect(unq(now['friend: report sheet'])).toContain('>Nombre ofensivo<');
    expect(unq(now['blocked users: none'])).toContain('>No has bloqueado a nadie.<');
  });
  it('Settings and Onboarding', () => {
    const s = unq(now['settings: signed in, native reminders, help rows']);
    for (const x of ['>Ajustes<', '>Cuenta<', '>Cerrar sesión<', '>Temporizador<', '>Avisos diarios<', '>Ayuda y preguntas frecuentes<', '>Acerca de<', '>Borrar mis estadísticas<', '>Eliminar cuenta<']) expect(s, x).toContain(x);
    expect(unq(now['settings: reset stats sheet'])).toContain('>Récord en Crono<');
    expect(unq(now['onboarding: answered wrong'])).toContain('Es Cristiano Ronaldo, el máximo goleador');
  });
  it('plurals and numbers in the Spanish way', () => {
    expect(t('hi.dayStreak', { count: 1 })).toBe('{n} día de racha');
    expect(t('rs.correctOf', { count: 1, n: 1, total: 10 })).toBe('1 acierto de 10');
    expect(t('gc.gotHim', { who: 'Jo', count: 2 })).toBe('Jo lo sacó con 2 clubes');
    expect(scoreLabel('trail', 1, t)).toBe('1 club');
    expect(challengeLine({ game: 'footle', score: 3, name: '' })).toBe('Un colega lo resolvió en 3');
    expect(levelName('Cult Hero')).toBe('Ídolo de culto');
    expect(tierName('silver')).toBe('PLATA');
  });
});

describe('no copy left behind in the source', () => {
  const FILES = ['components/DailyDone.jsx', 'components/ResultFoot.jsx', 'components/ChallengeBanner.jsx', 'components/WrongAnswersReview.jsx', 'components/BallIqCardFace.jsx', 'components/InstallCard.jsx', 'screens/ModeResults.jsx', 'screens/ResultsScreen.jsx', 'screens/ReviewScreens.jsx', 'screens/DailyScreen.jsx', 'screens/ProfileScreen.jsx', 'screens/SettingsScreen.jsx', 'screens/OnboardingScreen.jsx'];
  it('the step 4 screens print no English literal a step 4 key replaced', () => {
    // Not scanned: words that are also ids, data or the English tables kept
    // for share texts. ProfileScreen's BADGE_DEFS keeps the badges' English
    // (their keys are pinned above); "Player" is the server's default username;
    // "earned"/"locked"/" correct" are class names; ONBOARD_SAMPLE keeps its
    // English question, which the pre-boot shell in index.html must match.
    const DATA = new Set(['Save', 'Share', 'Rate', 'Player', 'Unknown', 'Install', 'Correct', 'correct', ' correct', 'missed', 'Help', 'earned', 'locked']);
    const kept = new Set([...BADGE_DEFS.flatMap(([, , n, d]) => [n, d]), ONBOARD_SAMPLE.q]);
    const literals = Object.values(STEP4_EN).filter((v) => !/\{\w+\}/.test(v) && v.trim().length > 3 && !DATA.has(v) && !kept.has(v));
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
  it('each screen component subscribes to the language (useT/useLang), so a switch re-renders it', () => {
    for (const f of FILES) expect(read(f), f).toMatch(/useT\(\)|useLang\(\)/);
    const p = read('screens/ProfileScreen.jsx');
    for (const fn of ['function CropModal(', 'function FriendsSection(', 'function FriendProfileScreenImpl(', 'function BlockedUsersScreenImpl(', 'function ProfileScreenImpl(']) {
      expect(p.slice(p.indexOf(fn), p.indexOf(fn) + 1200), fn).toMatch(/const t = useT\(\);/);
    }
    const app = read('App.jsx');
    expect(app.slice(app.indexOf('export function ReviewQuestionCard('), app.indexOf('export function ReviewQuestionCard(') + 120)).toContain('const t = useT();');
    expect(app).toMatch(/const uiLang = useLang\(\);[\s\S]{0,200}const dailyDoneServices = useMemo/);
  });
  it('dates and numbers follow the language (fmtLocale), never a hard-coded undefined', () => {
    for (const f of ['screens/ReviewScreens.jsx', 'screens/DailyScreen.jsx', 'screens/ProfileScreen.jsx', 'components/DailyDone.jsx']) {
      // The one exception says so on its line: the Footle share card's date, English like its text.
      const code = read(f).split('\n').filter((l) => !l.includes('share card')).join('\n');
      expect(code, f).not.toMatch(/toLocale(Date)?String\(undefined/);
      expect(code, f).not.toMatch(/\.toLocaleString\(\)/);
    }
  });
  it('the share texts that go to someone else stay English (step 5 decides them)', () => {
    expect(read('components/DailyDone.jsx')).toMatch(/const text = `\$\{what\} No\. \$\{edition\}: \$\{scoreLabel\(game, myScore\)\}\. Can you beat it\?`;/);
    expect(read('screens/SettingsScreen.jsx')).toContain('⚽ Ball IQ — the football quiz for real fans. https://balliq.app/get');
    expect(read('lib/resultVerdict.js')).toContain('"Ballon d\'Or form"');
  });
  it('es.js stays lazy: nothing in src/ imports it statically', () => {
    for (const f of [...FILES, 'App.jsx', 'i18n/names.js', 'lib/dailyResults.js', 'lib/gameChallenge.js', 'lib/resultsCopy.js']) {
      expect(read(f), f).not.toMatch(/from ['"][./]*i18n\/es\.js['"]|from ['"]\.\/es\.js['"]/);
    }
  });
  it('nothing the edge functions import pulls in i18n (api/og.js imports ballIqCard → scoring)', () => {
    for (const f of ['lib/ballIqCard.js', 'lib/scoring.js']) expect(read(f), f).not.toMatch(/i18n/);
  });
});
