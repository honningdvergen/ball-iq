import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { recordDailyResult } from '../../src/lib/dailyResults.js';

/**
 * ⚠️ ANOTHER GAME'S SCORE WAS BEING RECORDED AS TODAY'S DAILY 7 (2026-10-04).
 *
 * daily_results held Daily 7 buckets of 8 and 10 out of 7. Reproduced in a
 * browser: finish a Classic quiz, tap "Play today's Daily 7" on its results,
 * and startMode() sets mode "daily" BEFORE it awaits the questions. For that
 * moment the results screen showed the Classic result under mode "daily", so
 * DailyDone recorded it (3/10 became bucket 3 for today). It also set the
 * once-per-day flag, so the player's real Daily 7 was never counted.
 * Archive replays recorded into TODAY's edition for the same reason.
 *
 * The result now carries its own mode and edition, so the live mode can't
 * relabel it.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const RESULTS = read('../../src/screens/ResultsScreen.jsx');

describe('a Daily 7 result is only ever a Daily 7 result', () => {
  it('the results screen reads the mode from the result, not the live mode', () => {
    expect(APP).toMatch(/<Results\s+result=\{result\}\s+mode=\{result\.mode \|\| mode\}/);
    expect(APP).toMatch(/setResult\(\{ \.\.\.res, mode,/);
  });

  it('the edition comes from the day that was played, archive included', () => {
    const tags = RESULTS.match(/<DailyDone game="daily7"[^>]*>/g) || [];
    expect(tags).toHaveLength(2);
    for (const t of tags) {
      expect(t).toContain('edition={result.dailyEdition ?? dayIndexForDate(new Date())}');
      expect(t).toContain('isArchive={!!result.dailyArchive}');
    }
  });

  it('a Daily 7 bucket above 7 is refused before any network call', async () => {
    expect(await recordDailyResult({ game: 'daily7', edition: 20730, bucket: 8, won: true })).toBe(false);
    expect(await recordDailyResult({ game: 'daily7', edition: 20730, bucket: 10, won: true })).toBe(false);
  });
});
