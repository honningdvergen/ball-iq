// i18n step 6: the last English surfaces. Once I18N_LIVE flips, a Spanish
// player should not meet English on them: the Legends / Chaos / Club Quiz
// banners above the quiz, the Hot Streak and True or False how-to sheets,
// local pass-and-play and its topic picker, the answer-by-email toast, and
// the share and invite texts (useShare's Daily 7, per-mode and card lines,
// shareCard's line under the card, the Footle streak line, Draft, league
// invites, Stitch-up, the multiplayer invite and result).
//
//   • ENGLISH IS BYTE-IDENTICAL. Every share builder is run over a grid of
//     inputs and compared with the code main had before step 6 (18bc2ba5),
//     copied below as the reference; every new key is pinned to the literal
//     it replaced (i18n-last-english.keys.js).
//   • A Spanish player sees and shares Spanish, product names kept.
//   • Still English on purpose: multiplayer questions (the server's), the
//     hidden bank review tool, and the share card IMAGE (lib/shareCardRender.js).
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { t, __resetI18nForTests } = await import('../../src/i18n/index.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const enHome = (await import('../../src/i18n/en.home.js')).default;
const { STEP6_EN } = await import('./i18n-last-english.keys.js');
const { STEP5_EN } = await import('./i18n-leftovers.keys.js');
const { dailyShareLines, scoreShareText, scoreShareLabel } = await import('../../src/hooks/useShare.js');
const { shareLine, computeCard } = await import('../../src/lib/ballIqCard.js');
const { buildDraftShareText } = await import('../../src/lib/draftModel.js');
const { inviteShareText, h2hShareText } = await import('../../src/lib/leagues.js');
const { stitchShareText } = await import('../../src/screens/StitchUp.jsx');
const { STITCH_TAUNTS } = await import('../../src/lib/stitchToken.js');
const { LocalSetup, LocalResults } = await import('../../src/screens/LocalPlay.jsx');
const { TopicPickerSheet, topicMeta } = await import('../../src/components/TopicPickerSheet.jsx');

const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, ROOT)), 'utf8');
const html = (el) => renderToStaticMarkup(el);
const noop = () => {};

// ── The English as main built it before step 6 (18bc2ba5), verbatim ─────────
const APP = 'Ball IQ';
const OLD = {
  daily: ({ score, total = 7, streak, url, date }) => {
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const grid = Array.from({ length: total }, (_, i) => i < score ? '✅' : '❌').join('');
    const streakLine = streak > 0 ? `🔥 ${streak}-day streak` : '';
    return [`⚽ ${APP} Daily 7`, `📅 ${dateStr}`, `🎯 ${score}/${total}`, streakLine, '', grid, '', 'Think you can beat me?', url].filter(Boolean);
  },
  verdict: (pct) => (pct === 100 ? "Ballon d'Or form" : pct >= 80 ? 'Top-corner finish' : pct >= 60 ? 'Solid at the back' : pct >= 40 ? 'Squad rotation material' : 'Sunday league, first half'),
  score: (mode, score, total, url) => {
    const pct = total ? Math.round(score / total * 100) : 0;
    const beat = 'Can you beat me? ⚽';
    const msgs = {
      daily: (() => {
        const dots = Array.from({ length: total }, (_, i) => i < score ? '🟢' : '🔴').join('');
        return `⚽ ${APP} — Daily 7\n${dots}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      classic: (() => {
        const medal = pct === 100 ? '🏆' : pct >= 80 ? '🔥' : pct >= 60 ? '⚽' : '😅';
        return `${medal} ${APP} — Classic Quiz\n${OLD.verdict(pct)}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      survival: `🔥 ${APP} — Survival\n${score} in a row before missing one\n${beat}\n${url}`,
      hotstreak: `⚡🔥 ${APP} — Hot Streak\n${score} correct in 60 seconds (${total} answered)\n${beat}\n${url}`,
      truefalse: `✅ ${APP} — True or False\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      legends: `📜 ${APP} — Legends & History\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      local: `🤝 ${APP} — Local Multiplayer\nFinal scores in — settle it on the rematch.\n${beat}\n${url}`,
      chaos: `🎭 ${APP} — Chaos\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
    };
    return msgs[mode] || msgs.classic;
  },
  label: (mode, packName) => {
    const MODE_LABELS = { classic: 'Classic Quiz', daily: 'Daily 7', survival: 'Survival', hotstreak: 'Hot Streak', truefalse: 'True or False', legends: 'Legends & History', local: 'Local Multiplayer', chaos: 'Chaos Quiz' };
    return packName ? `${packName} Quiz` : MODE_LABELS[mode] || 'Quiz';
  },
  line: (type, data, link) => {
    if (type === 'wordle') {
      const wLink = '⚽ https://balliq.app/footle';
      const n = data.num > 0 ? ` #${data.num}` : '';
      const cl = data.clue ? ' (with a clue 💡)' : '';
      if (data.failed) return `Footle${n} got me${cl} — can you do better? ${wLink}`;
      if (data.score === 1) return `Got Footle${n} on my FIRST guess 🎯 ${wLink}`;
      return `Got Footle${n} in ${data.score} guesses${cl} — can you beat me? ${wLink}`;
    }
    if (type === 'hotstreak') return `I hit a ${data.score}-streak in Hot Streak — beat that ${link}`;
    if (data?.modeLabel && data?.score != null && data?.total != null) return `I scored ${data.score}/${data.total} on ${data.modeLabel} — can you beat me? ${link}`;
    return `Can you beat it? ${link}`;
  },
  footleStreak: (streak) => `\n🔥 ${streak}-day Footle streak`,
  draft: ({ number = 0, se, par = null }) => {
    const row = (ms) => ms.map((m) => (m.r === 'w' ? '🟩' : m.r === 'd' ? '⬜' : '🟥')).join('');
    const head = `⚽ Ball IQ · Draft${number > 0 ? ` #${number}` : ''}`;
    const line = `${se.pts} points · ${se.w}-${se.d}-${se.l}${par != null ? ` · par ${par}` : ''}`;
    return `${head}\n${line}\n${row(se.matches.slice(0, 19))}\n${row(se.matches.slice(19))}\n\nballiq.app/play?game=draft`;
  },
  invite: (name, url) => `Join ${name} on Ball IQ: the four dailies, Monday to Sunday. ${url}`,
  stitch: (taunt) => `Whose career is this? ${STITCH_TAUNTS[taunt] || 'Go on then'}.`,
  mpInvite: `⚽ Play me at ${APP}! Tap to join:`,
  mpResult: (oppName, draw, won) => {
    const oppBit = oppName ? ` against ${oppName}` : '';
    return draw ? `🤝 Dead level${oppBit} on ${APP} — settling it in the rematch. Join us!`
      : won ? `🏆 Just won an online match${oppBit} on ${APP}! Think you can take me?`
        : `⚔️ Just went down${oppBit} on ${APP} — rematch incoming. Join us!`;
  },
  email: (correct, a) => (correct ? `✓ ${a} — correct. Here's today's Daily 7` : `✗ It was ${a} — today's seven are waiting`),
};
// The site's own call for shareCard's line (App.jsx), mirrored: the source check below holds App.jsx to it.
const NEW_LINE = (type, data, link) => {
  if (type === 'wordle') {
    const wLink = '⚽ https://balliq.app/footle';
    const n = data.num > 0 ? ` #${data.num}` : '';
    const cl = data.clue ? t('share.lineClue') : '';
    if (data.failed) return t('share.lineFootleFail', { n, cl, link: wLink });
    if (data.score === 1) return t('share.lineFootleFirst', { n, link: wLink });
    return t('share.lineFootle', { n, score: data.score, cl, link: wLink });
  }
  if (type === 'hotstreak') return t('share.lineHot', { score: data.score, link });
  if (data?.modeLabel && data?.score != null && data?.total != null) return t('share.lineScore', { score: data.score, total: data.total, label: data.shareLabel || data.modeLabel, link });
  return t('share.lineAny', { link });
};
const MODES = ['daily', 'classic', 'survival', 'hotstreak', 'truefalse', 'legends', 'local', 'chaos', 'speed'];
const URL_ = 'balliq.app/play?club=arsenal';
const season = (pts, w, d, l) => ({ pts, w, d, l, gf: 70, ga: 30, matches: Array.from({ length: 38 }, (_, i) => ({ r: i < w ? 'w' : i < w + d ? 'd' : 'l' })) });
const RATED = computeCard({ PL: { c: 70, a: 90 }, UCL: { c: 60, a: 70 }, LaLiga: { c: 40, a: 70 }, SerieA: { c: 30, a: 60 }, Bundesliga: { c: 30, a: 50 }, WorldCup: { c: 40, a: 60 } }, 0.7, { c: 270, a: 400 });

let store;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); __resetI18nForTests(); });
beforeEach(() => { __resetI18nForTests(); });

describe('the step 6 keys', () => {
  it('each one prints its pinned English, in en.js and (where Home needs it) en.home.js', () => {
    for (const [k, v] of Object.entries(STEP6_EN)) {
      expect(en[k], k).toBe(v);
      if (Object.hasOwn(enHome, k)) expect(enHome[k], k).toBe(v);
    }
  });
  it('the pinned list is every key step 6 added (after step 5\'s, to the end of en.js)', () => {
    const keys = Object.keys(en);
    const first = keys.findIndex((k) => Object.hasOwn(STEP6_EN, k));
    expect(keys.slice(first).sort()).toEqual(Object.keys(STEP6_EN).sort());
    expect(Object.hasOwn(STEP5_EN, keys[first - 1])).toBe(true);
  });
  it('the taunts are STITCH_TAUNTS, index for index', () => {
    expect(STITCH_TAUNTS.map((_, i) => en[`share.taunt.${i}`])).toEqual(STITCH_TAUNTS);
    expect(en[`share.taunt.${STITCH_TAUNTS.length}`]).toBeUndefined();
  });
  it('each one has a Spanish value; the shared vocabulary holds', () => {
    for (const k of Object.keys(STEP6_EN)) expect(typeof es[k] === 'string' && es[k].length > 0, k).toBe(true);
    expect(es['share.lHotstreak']).toBe('Crono');
    expect(es['share.mHotstreak']).toContain('Crono');
    expect(es['share.lSurvival']).toBe('A muerte');
    expect(es['share.mSurvival']).toContain('A muerte');
    expect(es['sn.share']).toContain('reto');
    for (const k of Object.keys(STEP6_EN)) {
      for (const name of ['Footle', 'Daily 7', 'Ball IQ', 'Transfer Trail', 'Top 10']) if (en[k].includes(name)) expect(es[k], `${k} keeps "${name}"`).toContain(name);
    }
  });
});

describe('English share texts are byte-identical', () => {
  beforeEach(() => bootLang(store, null));
  it('the Daily 7 challenge (useShare)', () => {
    const date = new Date(2026, 9, 21, 12);
    for (const score of [0, 3, 7]) for (const streak of [0, 1, 12]) {
      const o = { score, streak, url: 'https://balliq.app/c/3.20261021.Ana?f=u1', date };
      expect(dailyShareLines(o)).toEqual(OLD.daily(o));
    }
  });
  it('every mode\'s text (useShare.shareScore), and the label under the card', () => {
    for (const mode of MODES) for (const [score, total] of [[0, 10], [4, 10], [6, 10], [8, 10], [10, 10], [3, 7], [12, 15], [0, 0]]) {
      expect(scoreShareText(mode, { score, total, url: URL_ }), `${mode} ${score}/${total}`).toBe(OLD.score(mode, score, total, URL_));
    }
    for (const mode of MODES) for (const pack of [null, 'Arsenal', 'Premier League']) expect(scoreShareLabel(mode, pack)).toBe(OLD.label(mode, pack));
  });
  it('shareCard\'s line under the card (App.jsx)', () => {
    const link = '⚽ https://balliq.app/play?quiz=premier-league';
    for (const num of [0, 150]) for (const failed of [false, true]) for (const score of [1, 3, 6]) for (const clue of [false, true]) {
      const d = { num, failed, score, clue };
      expect(NEW_LINE('wordle', d, link)).toBe(OLD.line('wordle', d, link));
    }
    expect(NEW_LINE('hotstreak', { score: 14 }, link)).toBe(OLD.line('hotstreak', { score: 14 }, link));
    expect(NEW_LINE('standard', { modeLabel: 'Arsenal Quiz', shareLabel: 'Arsenal Quiz', score: 9, total: 10 }, link)).toBe(OLD.line('standard', { modeLabel: 'Arsenal Quiz', score: 9, total: 10 }, link));
    expect(NEW_LINE('standard', {}, link)).toBe(OLD.line('standard', {}, link));
  });
  it('the Ball IQ card\'s line, the Footle streak line, Draft, league invites, Stitch-up', () => {
    const delta = { ratedAfter: true, faces: [{ abbr: 'UCL', before: 72, after: 78 }] };
    for (const card of [RATED, computeCard({})]) for (const d of [null, delta]) expect(shareLine(card, d, APP, t)).toBe(shareLine(card, d, APP));
    expect(RATED.rated).toBe(true);
    for (const n of [1, 9]) expect(`\n${t('share.footleStreak', { n })}`).toBe(OLD.footleStreak(n));
    const words = { line: (se) => t('share.draftLine', { pts: se.pts, w: se.w, d: se.d, l: se.l }), par: (par) => t('share.draftPar', { par }) };
    for (const number of [0, 12]) for (const par of [null, 61]) for (const se of [season(80, 24, 8, 6), season(31, 7, 10, 21)]) {
      expect(buildDraftShareText({ number, se, par, words })).toBe(OLD.draft({ number, se, par }));
    }
    expect(inviteShareText("Alex's lot", 'https://balliq.app/l/X')).toBe(OLD.invite("Alex's lot", 'https://balliq.app/l/X'));
    expect(h2hShareText({ game: 'footle', edition: 166, mine: 3, theirs: 5 }, 'U')).toBe('Footle No. 166: 3 v your 5. Make it a week? U');
    expect(h2hShareText({ game: 'trail', edition: 9, mine: 0, theirs: 2 }, 'U')).toBe('Transfer Trail No. 9: X v your 2. Make it a week? U');
    for (const taunt of [...STITCH_TAUNTS.keys(), 99, undefined]) expect(stitchShareText(taunt)).toBe(OLD.stitch(taunt));
  });
  it('the multiplayer invite and result, the email toast', () => {
    expect(t('share.mpInvite', { app: APP })).toBe(OLD.mpInvite);
    for (const opp of [null, 'Sam']) for (const [draw, won] of [[true, false], [false, true], [false, false]]) {
      const oppBit = opp ? t('share.mpAgainst', { name: opp }) : '';
      expect(t(draw ? 'share.mpDraw' : won ? 'share.mpWon' : 'share.mpLost', { opp: oppBit, app: APP })).toBe(OLD.mpResult(opp, draw, won));
    }
    for (const correct of [true, false]) expect(t(correct ? 'toast.emailRight' : 'toast.emailWrong', { a: 'Thierry Henry' })).toBe(OLD.email(correct, 'Thierry Henry'));
  });
  it('the sites build them from these keys', () => {
    const app = read('src/App.jsx');
    expect(app).toContain('if (data.failed) return tl("share.lineFootleFail", { n, cl, link: wLink });');
    expect(app).toContain('return tl("share.lineScore", { score: data.score, total: data.total, label: data.shareLabel || data.modeLabel, link });');
    expect(app).toContain('showToast(tl(correct ? "toast.emailRight" : "toast.emailWrong", { a: answerText }), 4200);');
    const share = read('src/hooks/useShare.js');
    expect(share).toContain('const lines = dailyShareLines({ score, streak: loginStreak, url: challengeUrl });');
    expect(share).toContain('const text = scoreShareText(mode, { score, total, url });');
    expect(share).toContain('shareLabel: scoreShareLabel(mode, packName),');
    expect(share).toContain('const text = shareLine(card, readCardDelta(), APP_NAME, t);');
    expect(read('src/screens/Draft.jsx')).toContain('buildDraftShareText({ number, se, par, words: DRAFT_SHARE_WORDS })');
    const mp = read('src/screens/OnlineMultiplayer.jsx');
    expect(mp).toContain('const text = tNow("share.mpInvite", { app: APP_NAME });');
    expect(mp).toContain('const text = tNow(survivalDraw ? "share.mpDraw" : isWinner ? "share.mpWon" : "share.mpLost", { opp: opp1, app: APP_NAME });');
    for (const f of ['src/games/FootballWordle.jsx', 'src/screens/ReviewScreens.jsx']) expect(read(f), f).toContain('`\\n${t("share.footleStreak", { n: streak })}`');
  });
});

describe('a Spanish player shares in Spanish', () => {
  beforeEach(() => bootLang(store, 'es'));
  it('every builder, product names kept', () => {
    const lines = dailyShareLines({ score: 5, streak: 3, url: 'U', date: new Date(2026, 9, 21, 12) });
    expect(lines).toEqual(['⚽ Ball IQ Daily 7', '📅 21 oct', '🎯 5/7', '🔥 Racha de 3 días', '✅✅✅✅✅❌❌', '¿Te crees capaz de superarme?', 'U']);
    expect(scoreShareText('classic', { score: 8, total: 10, url: 'U' })).toBe('🔥 Ball IQ — Clásico\nA la escuadra\n8/10 aciertos · 80 % de acierto\n¿Me superas? ⚽\nU');
    expect(scoreShareText('hotstreak', { score: 14, total: 20, url: 'U' })).toContain('Crono\n14 aciertos en 60 segundos (20 respondidas)');
    expect(scoreShareLabel('classic', 'Arsenal')).toBe('Quiz de Arsenal');
    expect(NEW_LINE('standard', { modeLabel: 'Arsenal Quiz', shareLabel: scoreShareLabel('classic', 'Arsenal'), score: 9, total: 10 }, 'L')).toBe('He sacado 9/10 en Quiz de Arsenal. ¿Me superas? L');
    expect(NEW_LINE('wordle', { num: 150, score: 3, clue: true }, 'L')).toBe('Footle #150 en 3 intentos (con pista 💡). ¿Me superas? ⚽ https://balliq.app/footle');
    expect(shareLine(computeCard({}), null, APP, t)).toBe('¿Me superas en Ball IQ? ⚽');
    expect(inviteShareText('Los de Alex', 'U')).toBe('Únete a Los de Alex en Ball IQ: los cuatro retos diarios, de lunes a domingo. U');
    expect(h2hShareText({ game: 'footle', edition: 166, mine: 3, theirs: 5 }, 'U')).toBe('Footle n.º 166: mi 3 contra tu 5. ¿Nos lo jugamos a una semana? U');
    expect(stitchShareText(1)).toBe('¿De quién es esta carrera? Hasta mi abuela la ha sacado.');
    expect(t('share.mpInvite', { app: APP })).toBe('⚽ ¡Juega contra mí en Ball IQ! Toca para unirte:');
  });
});

describe('the screens and sheets', () => {
  const result = { players: [{ id: 0, name: 'Ana', n: 1 }, { id: 1, name: 'Ben', n: 2 }], scores: { 0: 3, 1: 1 }, eliminatedIds: [], mode: 'classic', winnerId: null, endReason: 'questions-out' };
  it('local play in English reads as it did', async () => {
    await bootLang(store, null);
    const setup = html(React.createElement(LocalSetup, { onStart: noop, onBack: noop }));
    for (const s of ['>Local Multiplayer<', '>Players<', '>Names<', 'placeholder="Player 1"', '>Topic<', '>Change<', '>Mode<', '>Classic<', '>10 questions<', '>Sprint<', '>Survival<', '>Eliminated on wrong<', 'Start with 2 players →', 'aria-label="Go back"', '>Mixed — all topics<', '>Questions from every topic<']) expect(setup, s).toContain(s);
    const res = html(React.createElement(LocalResults, { result, onHome: noop, onRetry: noop, onShare: noop }));
    for (const s of ['>Ana wins<', '>3 correct<', '>Play again<', '>Share score<', '>Back to Home<']) expect(res, s).toContain(s);
    const pick = html(React.createElement(TopicPickerSheet, { value: 'cat:WorldCup', onDone: noop, onClose: noop }));
    for (const s of ['>Topics<', '>Leagues<', '>Tournaments<', '>International<', '>Euros<', '>Done — International<']) expect(pick, s).toContain(s);
    expect(topicMeta('cat:Euros')).toMatchObject({ label: 'Euros', sub: 'Competition pack' });
  });
  it('local play in Spanish', async () => {
    await bootLang(store, 'es');
    const setup = html(React.createElement(LocalSetup, { onStart: noop, onBack: noop }));
    for (const s of ['>Multijugador local<', '>Jugadores<', 'placeholder="Jugador 1"', '>Clásico<', '>A muerte<', 'Empezar con 2 jugadores →', '>Mixto: todos los temas<']) expect(setup, s).toContain(s);
    expect(setup).not.toMatch(/>(Players|Names|Topic|Change|Mode)</);
    const res = html(React.createElement(LocalResults, { result, onHome: noop, onRetry: noop, onShare: noop }));
    for (const s of ['>Gana Ana<', '>3 aciertos<', '>Otra partida<', '>Volver al inicio<']) expect(res, s).toContain(s);
    const pick = html(React.createElement(TopicPickerSheet, { value: 'cat:WorldCup', onDone: noop, onClose: noop }));
    for (const s of ['>Temas<', '>Torneos<', '>Selecciones<', '>Eurocopa<', '>Listo: Selecciones<']) expect(pick, s).toContain(s);
  });
  it('no English chrome literal is left in LocalPlay.jsx or the topic picker', () => {
    const lp = read('src/screens/LocalPlay.jsx');
    for (const lit of ['>Local Multiplayer<', '"Go back"', "'s turn", 'Answer locked in', 'Nobody Survives', "It's a tie", 'Elimination order', 'Play again', 'Share score', 'Back to Home', 'Loading questions', 'CAT_LABELS[']) expect(lp, lit).not.toContain(lit);
    const tp = read('src/components/TopicPickerSheet.jsx');
    for (const lit of ['>Topics<', '"Done — Mixed, all topics"', 'aria-label="Back"', '"Clear search"', '"Questions from every topic"']) expect(tp, lit).not.toContain(lit);
  });
  it('the banners, how-to sheets and the share-name sheet in App.jsx print through t()', () => {
    const app = read('src/App.jsx');
    for (const lit of ['📜 Legends & History</div>', '🎭 Chaos</div>', '>Club Quiz</div>', 'You have 60 seconds on the clock', 'You get 20 football statements', 'Who should we say it&apos;s from?', '>Share challenge<', "Here's today's Daily 7"]) expect(app, lit).not.toContain(lit);
    for (const k of ['qb.legends', 'qb.legendsSub', 'qb.chaos', 'qb.chaosSub', 'cat.ClubQuiz', 'sn.title', 'sn.share', 'sn.noName']) expect(app, k).toContain(`t("${k}")`);
    expect(app).toContain('hotstreak: { titleKey:"home.mode.hotstreak", stepKey:"help.hotstreak" },');
    expect(app).toContain('truefalse: { titleKey:"help.truefalse.title", stepKey:"help.truefalse" },');
    // App.jsx is on Home's eager path: the sheets' lines must be in en.home.js.
    for (const k of Object.keys(STEP6_EN).filter((x) => /^(help\.|qb\.|sn\.|toast\.)/.test(x))) expect(enHome[k], k).toBe(STEP6_EN[k]);
  });
});
