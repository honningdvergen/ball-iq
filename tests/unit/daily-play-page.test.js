import { describe, it, expect } from 'vitest';
import { renderDailyPlay } from '../../scripts/seo/daily-play-page.mjs';
import { todayIndex, isoOf } from '../../scripts/seo/daily-answers-page.mjs';

/**
 * /daily-football-quiz/ is SERVED and plays today's seven in the club engine.
 * These gates pin the contract the engine's daily branch and the local-date
 * swap depend on: seven visible rows for the UTC day, the day's date on the
 * section, neighbouring days as templates, no length picker, and a cache that
 * expires at UTC midnight so "today" can never be yesterday.
 */
describe('the served Daily 7 page', () => {
  const now = new Date();
  const page = renderDailyPlay({ now });
  const today = isoOf(todayIndex(now));

  it('renders today (UTC) as the visible board', () => {
    expect(page.status).toBe(200);
    expect(page.html).toContain(`data-daily="${today}"`);
    const list = page.html.slice(page.html.indexOf('<ol class="bq-list">'), page.html.indexOf('</ol>'));
    expect((list.match(/class="bq-q"/g) || []).length).toBe(7);
    expect(list).toContain('class="bq-why"');
  });

  it('carries the neighbouring days as templates for the local-date swap', () => {
    const tpl = page.html.match(/<template id="bq-day-(\d{4}-\d{2}-\d{2})"/g) || [];
    expect(tpl.length).toBeGreaterThanOrEqual(1);        // yesterday is always logged
    expect(tpl.join('')).not.toContain(today);
    expect(page.html).toContain("getElementById('bq-day-'+y)");
  });

  it('is one shot: no length picker, the engine present, the daily record key in it', () => {
    expect(page.html).not.toContain('class="bq-len"');
    expect(page.html).toContain("localStorage.setItem('biq_daily_'+daily");
    expect(page.html).toContain('record_funnel_event');
  });

  it('expires at UTC midnight', () => {
    expect(page.cacheSeconds).toBeGreaterThan(0);
    expect(page.cacheSeconds).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it('links the explained answers and the app once, and never a count of the bank', () => {
    expect(page.html).toContain('/daily-football-quiz/answers/');
    expect((page.html.match(/apps\.apple\.com/g) || []).length).toBeGreaterThanOrEqual(1);
    expect(page.html).not.toMatch(/\d{3,5}\+? (verified )?questions/i);
  });
});
