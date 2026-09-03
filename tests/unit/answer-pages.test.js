// The served answer pages (api/footle.js, api/daily-answers.js) have no
// build-time artefact for the SERP and orphan gates to inspect, so their
// contracts are asserted here instead: titles under the truncation limit,
// one canonical per URL, no future puzzle ever rendered, past pages open,
// today's hidden, and the site shell on every one of them.
import { describe, it, expect } from 'vitest';
import { renderFootleAnswer, recentFootleAnswers, footleNumber, pageUrl as footleUrl } from '../../scripts/seo/footle-answer-page.mjs';
import { renderDailyAnswers, recentDailyDays, todayIndex, isoOf } from '../../scripts/seo/daily-answers-page.mjs';
import { getWordleDayIndex, getWordleAnswerForDayIndex } from '../../src/lib/wordle.js';
import DAILY_LOG from '../../src/data/dailyLog.js';

const NOW = new Date(Date.UTC(2026, 8, 4, 12)); // 2026-09-04 noon UTC
const title = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1];
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
const robots = (html) => (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1];

describe('Footle answer pages', () => {
  const todayN = footleNumber(getWordleDayIndex(NOW));

  it('the hub carries today\'s answer behind a reveal, in the site shell', () => {
    const p = renderFootleAnswer({ now: NOW });
    const ans = getWordleAnswerForDayIndex(getWordleDayIndex(NOW));
    expect(p.status).toBe(200);
    expect(title(p.html).length).toBeLessThanOrEqual(60);
    expect(canonical(p.html)).toBe('https://balliq.app/football-wordle/answer/');
    expect(p.html).toContain('<details class="reveal">');
    expect(p.html).toContain(`<div class="big">${ans}</div>`);
    expect(p.html).toContain('class="fd-head"');
    expect(p.html).toContain('class="fd-foot"');
    expect(p.html).toContain('id="fd-find"');
    expect(p.cacheSeconds).toBeLessThanOrEqual(24 * 3600);
    expect(p.staleSeconds).toBe(60); // a today-page must roll with the puzzle, not an hour later
  });

  it('a past puzzle is its own open page with prev/next and a month of cache', () => {
    const n = todayN - 3;
    const p = renderFootleAnswer({ n, now: NOW });
    const ans = getWordleAnswerForDayIndex(getWordleDayIndex(NOW) - 3);
    expect(p.status).toBe(200);
    expect(title(p.html).length).toBeLessThanOrEqual(60);
    expect(title(p.html)).toContain(`No. ${n}`);
    expect(canonical(p.html)).toBe(footleUrl(n));
    expect(p.html).not.toContain('<details class="reveal">');
    expect(p.html).toContain(`<div class="big">${ans}</div>`);
    expect(p.html).toContain(footleUrl(n - 1));
    expect(p.html).toContain(footleUrl(n + 1));
    expect(p.cacheSeconds).toBe(30 * 24 * 3600);
    expect(p.staleSeconds).toBe(24 * 3600);
  });

  it('today\'s number resolves to the hub, and the future is a noindex 404', () => {
    expect(canonical(renderFootleAnswer({ n: todayN, now: NOW }).html)).toBe('https://balliq.app/football-wordle/answer/');
    for (const n of [todayN + 1, 0, -4, 1.5, NaN]) {
      const p = renderFootleAnswer({ n, now: NOW });
      expect(p.status, `n=${n}`).toBe(404);
      expect(robots(p.html)).toContain('noindex');
      // no answer for a puzzle that has not happened leaks into the 404 body
      expect(p.html).not.toContain('class="big"');
    }
  });

  it('the recent list is newest-first, finished puzzles only, and floors at No. 1', () => {
    const r = recentFootleAnswers(30, NOW);
    expect(r[0].n).toBe(todayN - 1);
    expect(r.every((a, i) => i === 0 || a.n === r[i - 1].n - 1)).toBe(true);
    expect(recentFootleAnswers(1000, NOW).at(-1).n).toBe(1);
  });
});

describe('Daily 7 answer pages', () => {
  const today = todayIndex(NOW);

  it('the hub hides today\'s seven behind one reveal', () => {
    const p = renderDailyAnswers({ now: NOW });
    expect(p.status).toBe(200);
    expect(title(p.html).length).toBeLessThanOrEqual(60);
    expect(canonical(p.html)).toBe('https://balliq.app/daily-football-quiz/answers/');
    expect(p.html).toContain('<details class="reveal">');
    expect((p.html.match(/<div class="qq">/g) || []).length).toBe(14); // 7 listed + 7 inside the reveal
    expect(p.html).toContain('class="fd-head"');
  });

  it('a logged past day is open, explained, and canonical to its own date', () => {
    const di = today - 2;
    const iso = isoOf(di);
    const p = renderDailyAnswers({ date: iso, now: NOW });
    expect(p.status).toBe(200);
    expect(canonical(p.html)).toBe(`https://balliq.app/daily-football-quiz/answers/${iso}/`);
    expect(p.html).not.toContain('<details class="reveal">');
    expect((p.html.match(/<span class="ok">/g) || []).length).toBe(7);
    expect(p.cacheSeconds).toBe(30 * 24 * 3600);
  });

  it('days before the log, the future, and junk are noindex 404s', () => {
    for (const d of [isoOf(DAILY_LOG.anchor - 1), isoOf(today + 1), '2026-13-40', 'yesterday', '2026-9-3']) {
      const p = renderDailyAnswers({ date: d, now: NOW });
      expect(p.status, d).toBe(404);
      expect(robots(p.html)).toContain('noindex');
      expect(p.html).not.toContain('class="qq"');
    }
  });

  it('the recent list stops at the first logged day', () => {
    const r = recentDailyDays(400, NOW);
    expect(r[0].di).toBe(today - 1);
    expect(r.at(-1).di).toBe(DAILY_LOG.anchor);
  });
});
