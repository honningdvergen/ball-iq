// The "N you missed" list on a finish: one card per question (25 Nov 2026).
//
// Alex, on a screenshot of the list as the tidy pass of 10 Nov left it:
// "question explainers look hectic and not properly divided or structured,
// separated from one question to the other, looks like a mess to be honest".
// Every miss sat in ONE outlined box with a hairline between them, and the
// question, "Your answer" and the explanation were three greys at nearly one
// size. Now each miss is its own filled card with one order inside it. These
// pin that order, that nothing the list said or did was lost, and that the
// day review in History (which shares the old row classes) was left alone.
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import en from '../../src/i18n/en.js';
import es from '../../src/i18n/es.js';

// The real button, watched: what the list hands it is what a tap sends.
const SEEN = vi.hoisted(() => ({ props: [] }));
vi.mock('../../src/components/ReportButton.jsx', async (orig) => {
  const Real = (await orig()).default;
  const R = await import('react');
  return { default: (p) => { SEEN.props.push(p); return R.createElement(Real, p); } };
});

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
// a rule by its whole selector, at the start of a line (".wm-u" is not ".wm-a,.wm-u")
const rule = (css, sel) => { const i = `\n${css}`.indexOf(`\n${sel}{`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i) + 1); };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const el = React.createElement;
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); SEEN.props.length = 0; });
const load = async (store) => { vi.resetModules(); vi.stubGlobal('localStorage', mem(store)); return import('../../src/components/WrongAnswersReview.jsx'); };
const render = async (props, store) => { const { WrongAnswersReview } = await load(store); return renderToStaticMarkup(el(WrongAnswersReview, props)); };

const FULL = { id: 'q1', q: 'AC Milan and Inter Milan share which famous stadium?', user: 'Stadio Olimpico', correct: 'San Siro', hint: 'Officially the Stadio Giuseppe Meazza.' };
const TIMED_OUT = { id: 'q2', q: 'Who scored the 2014 World Cup final winner?', correct: 'Götze', hint: 'In extra time, against Argentina.' };
const NO_WHY = { id: 'q3', q: 'Which club won the 2005 Champions League final?', user: 'Milan', correct: 'Liverpool' };
const BUTTON = '<button type="button" aria-live="polite" style="[^"]*">.*?</button>';
const TICK = '<svg[^>]*width="16" height="16"[^>]*stroke-width="3"[^>]*lucide-check[^>]*aria-hidden="true">.*?</svg>';
const CROSS = '<svg[^>]*width="16" height="16"[^>]*stroke-width="3"[^>]*lucide-x[^>]*aria-hidden="true">.*?</svg>';

describe('each missed question is its own card, in one order', () => {
  it('which question and the flag, the question, the right answer with a tick, the player\'s own with a cross, the explanation', async () => {
    const html = await render({ wrongAnswers: [FULL], onReport() {}, mode: 'daily' });
    expect(html).toMatch(new RegExp(`^<div style="margin-top:24px"><h3 class="wr-head">1 you missed</h3><div class="wm-list"><div class="wm-card"><div class="wm-top"><span class="wm-n">Question 1</span>${BUTTON}</div><div class="wm-q">AC Milan and Inter Milan share which famous stadium\\?</div><div class="wm-a">${TICK}<span>San Siro</span></div><div class="wm-u">${CROSS}<span>Your answer: Stadio Olimpico</span></div><div class="wm-why">Officially the Stadio Giuseppe Meazza\\.</div></div></div></div>$`));
  });
  it('one card per miss and no box round them: 1, 2 and 10 missed', async () => {
    for (const n of [1, 2, 10]) {
      const html = await render({ wrongAnswers: Array.from({ length: n }, (_, i) => ({ ...FULL, id: `q${i}` })), onReport() {} });
      expect((html.match(/class="wm-card"/g) || []).length).toBe(n);
      expect((html.match(/class="wm-list"/g) || []).length).toBe(1);
      expect(text(html)).toMatch(new RegExp(`^${n} you missed Question 1 `));
      expect(html).not.toMatch(/wrong-review|wr-item|wr-body/);
    }
    expect(await render({ wrongAnswers: [] })).toBe('');
    expect(await render({ wrongAnswers: null })).toBe('');
    const css = read('src/app.css');
    // the list is only a column with gaps; the surface belongs to each card, filled, with no outline
    expect(rule(css, '.wm-list')).toBe('.wm-list{display:flex;flex-direction:column;gap:10px;}');
    expect(rule(css, '.wm-card')).toBe('.wm-card{padding:14px 16px 16px;border-radius:20px;background:var(--s1);}');
    for (const sel of ['.wm-list', '.wm-card', '.wm-top', '.wm-q', '.wm-a', '.wm-u', '.wm-why']) expect(rule(css, sel), sel).not.toMatch(/border(?!-radius)|outline/);
    // the same surface and corner as the finish list above it
    expect(rule(read('src/components/dailyDone.css'), '.dd-list')).toContain('border-radius:20px;background:var(--s1);');
  });
  it('the clock ran out, or no pick was kept: the right answer and the explanation, and nothing claimed about a pick', async () => {
    for (const w of [TIMED_OUT, { ...TIMED_OUT, user: null }, { ...TIMED_OUT, user: '' }]) {
      const html = await render({ wrongAnswers: [w], onReport() {} });
      expect(html).not.toContain('wm-u');
      expect(html).not.toContain('lucide-x');
      expect(text(html)).not.toMatch(/Your answer/);
      expect(html).toMatch(new RegExp(`<div class="wm-q">Who scored the 2014 World Cup final winner\\?</div><div class="wm-a">${TICK}<span>Götze</span></div><div class="wm-why">In extra time, against Argentina\\.</div></div>`));
    }
  });
  it('no explanation: the card ends on the answers', async () => {
    const html = await render({ wrongAnswers: [NO_WHY, FULL], onReport() {} });
    expect(html).toMatch(new RegExp(`<div class="wm-a">${TICK}<span>Liverpool</span></div><div class="wm-u">${CROSS}<span>Your answer: Milan</span></div></div><div class="wm-card">`));
    expect((html.match(/class="wm-why"/g) || []).length).toBe(1);
  });
});

describe('the hierarchy inside a card', () => {
  const css = read('src/app.css');
  const px = (r, prop) => parseFloat((r.match(new RegExp(`[{;]${prop}:([\\d.]+)px`)) || [])[1]);
  it('the question leads in the page\'s white at 600; the label above it is the quiet one', () => {
    expect(rule(css, '.wm-q')).toContain('font-size:16px;line-height:1.4;font-weight:600;');
    expect(rule(css, '.wm-q')).toContain('color:var(--t1);');
    expect(rule(css, '.wm-n')).toContain('font-size:12.5px;line-height:20px;font-weight:700;color:var(--t3);font-variant-numeric:tabular-nums;');
  });
  it('the right answer is the app\'s green, bold; the player\'s own is secondary grey with the result card\'s red on the cross only', () => {
    expect(rule(css, '.wm-a')).toContain('font-weight:700;color:var(--green-ink);');
    expect(rule(css, '.wm-u')).toContain('font-weight:500;color:var(--t2);');
    expect(rule(css, '.wm-u svg')).toBe('.wm-u svg{color:#C23B33;}');
    expect(rule(read('src/components/resultCard.css'), '.rc-k i')).toContain('background:#C23B33;');
    // no other red, and no yellow, anywhere in the card
    expect((css.slice(css.indexOf('.wm-list{'), css.indexOf('}', css.indexOf('.wm-why{'))).match(/#[0-9A-Fa-f]{3,8}/g) || [])).toEqual(['#C23B33']);
  });
  it('the explanation is a note: smaller than the question, never under 13px, in the 7:1 grey, after a little space', () => {
    const why = rule(css, '.wm-why');
    expect(px(why, 'font-size')).toBeGreaterThanOrEqual(13);
    expect(px(why, 'font-size')).toBeLessThan(px(rule(css, '.wm-q'), 'font-size'));
    expect(why).toContain('color:var(--t2);');
    expect(px(why, 'margin-top')).toBeGreaterThan(px(rule(css, '.wm-u'), 'margin-top'));
  });
  it('long words and long answers wrap inside the card', () => {
    for (const sel of ['.wm-q', '.wm-a,.wm-u', '.wm-why']) expect(rule(css, sel), sel).toContain('overflow-wrap:anywhere;');
    expect(rule(css, '.wm-a span,.wm-u span')).toBe('.wm-a span,.wm-u span{min-width:0;}');
  });
});

describe('the flag is the same control, with a thumb-sized target', () => {
  it('same label, same icon, same three states; 44 by 44', async () => {
    const onReport = () => true;
    const html = await render({ wrongAnswers: [FULL, TIMED_OUT], onReport, mode: 'classic' });
    expect((html.match(/<svg[^>]*lucide-flag[^>]*aria-hidden="true">/g) || []).length).toBe(2);
    expect((html.match(/<span class="wr-flag-t">This looks wrong<\/span>/g) || []).length).toBe(2);
    expect(html).toMatch(/<button type="button" aria-live="polite" style="[^"]*color:var\(--t3\);position:relative;flex:none;width:44px;height:44px;margin:-12px -12px -12px 0;padding:0;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;border-radius:12px">/);
    expect(SEEN.props.length).toBe(2);
    // what a tap sends: the handler the screen gave, and the English record of that question
    expect(SEEN.props[0].onReport).toBe(onReport);
    expect(SEEN.props[0].info).toEqual({ id: 'q1', q: FULL.q, picked: 'Stadio Olimpico', correct: 'San Siro', mode: 'classic' });
    expect(SEEN.props[1].info).toEqual({ id: 'q2', q: TIMED_OUT.q, picked: null, correct: 'Götze', mode: 'classic' });
    expect(SEEN.props[0].idleColor).toBe('var(--t3)');
    const said = (node) => text(renderToStaticMarkup(node));
    expect(said(SEEN.props[0].idle)).toBe('This looks wrong');
    expect(said(SEEN.props[0].sending)).toBe(en['report.sending']);
    expect(said(SEEN.props[0].done)).toBe(en['report.done']);
    // the visually hidden label still has its rule
    expect(rule(read('src/app.css'), '.wr-flag-t')).toContain('position:absolute;width:1px;height:1px;overflow:hidden;');
  });
  it('a screen with no report handler shows no flag, and the label line stands alone', async () => {
    const html = await render({ wrongAnswers: [FULL] });
    expect(html).not.toContain('<button');
    expect(html).toContain('<div class="wm-top"><span class="wm-n">Question 1</span></div>');
  });
  it('the usage counter and the review heading are untouched', () => {
    const src = read('src/components/WrongAnswersReview.jsx');
    expect(src).toContain("useEffect(() => { if (wrongAnswers?.length) bumpUsage('review-viewed'); }, []);");
    expect(src).toContain('<h3 className="wr-head">{rich(t("rs.reviewMissed"), { n: wrongAnswers.length, w: t("rs.answers", { count: wrongAnswers.length }) })}</h3>');
    expect(src).toContain('info={{ id: w.id, q: w.q, picked: w.user ?? null, correct: w.correct ?? null, mode }}');
  });
});

describe('"Question N" is the question\'s own number when the answers on hand say so', () => {
  const answers = (...right) => right.map((isCorrect) => ({ isCorrect }));
  it('the 3rd and the 6th of seven were missed: the cards say 3 and 6', async () => {
    const html = await render({ wrongAnswers: [FULL, TIMED_OUT], allAnswers: answers(true, true, false, true, true, false, true) });
    expect(text(html)).toMatch(/^2 you missed Question 3 .* Question 6 /);
  });
  it('without the answers, or when the two do not add up, the list counts for itself as it always did', async () => {
    const { missedNumbers } = await load();
    expect(missedNumbers([FULL, TIMED_OUT], undefined)).toEqual([1, 2]);
    expect(missedNumbers([FULL, TIMED_OUT], answers(false, false, false, true))).toEqual([1, 2]);          // three not right, two in the list
    expect(missedNumbers([FULL], answers(true, true, true))).toEqual([1]);                                 // none not right, one in the list
    expect(missedNumbers([FULL, TIMED_OUT], [{ isCorrect: true }, { isCorrect: false, q: FULL.q }, { isCorrect: false, q: TIMED_OUT.q }])).toEqual([2, 3]);
    expect(missedNumbers([FULL, TIMED_OUT], [{ isCorrect: false, q: 'Another question?' }, { isCorrect: false, q: TIMED_OUT.q }])).toEqual([1, 2]); // not the same questions
    expect(text(await render({ wrongAnswers: [FULL, NO_WHY] }))).toMatch(/^2 you missed Question 1 .* Question 2 /);
  });
  it('the results screen hands the list its answers at all four places it draws it', () => {
    const src = read('src/screens/ResultsScreen.jsx');
    expect((src.match(/<WrongAnswersReview wrongAnswers=\{wrongAnswers\} allAnswers=\{result\.allAnswers\} onReport=\{onReport\} mode=\{mode\} \/>/g) || []).length).toBe(4);
    expect((src.match(/<WrongAnswersReview /g) || []).length).toBe(4);
  });
});

describe('no new wording, and Spanish has all of it', () => {
  it('the label is the quiz\'s own "Question {n}"; the other lines are the list\'s old keys', () => {
    expect(en['quiz.question']).toBe('Question {n}');
    expect(es['quiz.question']).toBe('Pregunta {n}');
    expect(en['rs.youSaid']).toBe('Your answer: {a}');
    expect(es['rs.youSaid']).toBe('Tu respuesta: {a}');
    expect(en['rs.reviewMissed']).toBe('{n} you missed');
    const src = read('src/components/WrongAnswersReview.jsx');
    // every string the list prints, and no key that was not there before but the label's
    expect([...new Set((src.match(/\bt\("[\w.]+"/g) || []).map((m) => m.slice(3, -1)))].sort()).toEqual(['quiz.question', 'report.done', 'report.sending', 'rs.answers', 'rs.looksWrong', 'rs.reviewMissed', 'rs.youSaid'].sort());
  });
  it('in Spanish the card reads Pregunta, Tu respuesta, and the flag\'s label', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', mem({ biq_lang: 'es' }));
    vi.stubGlobal('sessionStorage', mem());
    vi.stubGlobal('navigator', { language: 'en-US', userAgent: 'Mozilla/5.0 (Macintosh)' });
    vi.stubGlobal('document', { documentElement: { lang: 'en', classList: { contains: () => false } } });
    const { initI18n, getLang } = await import('../../src/i18n/index.js');
    await initI18n();
    expect(getLang()).toBe('es');
    const { WrongAnswersReview } = await import('../../src/components/WrongAnswersReview.jsx');
    const html = renderToStaticMarkup(el(WrongAnswersReview, { wrongAnswers: [FULL], onReport() {}, allAnswers: [{ isCorrect: true }, { isCorrect: false }] }));
    expect(text(html).startsWith(`${es['rs.reviewMissed'].replace('{n}', '1')} `)).toBe(true);
    expect(text(html)).toContain('Pregunta 2');
    expect(text(html)).toContain(`Tu respuesta: ${FULL.user}`);
    expect(text(html)).toContain(es['rs.looksWrong']);
  });
});

describe('the day review in History keeps its own rows', () => {
  it('its box and row rules are still in the stylesheet, and its markup still asks for them', () => {
    const css = read('src/app.css');
    expect(rule(css, '.wrong-review')).toBe('.wrong-review{background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:12px;}');
    for (const sel of ['.wr-item', '.wr-n', '.wr-body', '.wr-q', '.wr-a', '.wr-user', '.wr-why']) expect(rule(css, sel), sel).not.toBe('');
    expect(read('src/App.jsx')).toContain('<div className="wr-item">');
    expect((read('src/screens/ReviewScreens.jsx').match(/<div className="wrong-review">/g) || []).length).toBe(2);
    expect(read('src/components/WrongAnswersReview.jsx')).not.toMatch(/className="(wrong-review|wr-item|wr-body|wr-q|wr-a|wr-user|wr-why|wr-n)"/);
  });
});
