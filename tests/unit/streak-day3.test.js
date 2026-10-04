import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Day 3 is the first streak celebration (2026-10-04). Before it the first one
// was a week away, past the point where most new players have already decided
// whether to come back. It is a toast and haptic only; confetti stays for the
// big ones, so day 3 doesn't cheapen day 7.
const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

describe('the day-3 streak moment', () => {
  it('fires on the streak tick, once', () => {
    expect(APP).toMatch(/\[3, 7, 30, 100\]\.includes\(result\.streak\)/);
    expect(APP).toMatch(/if \(result\.streak !== 3\) setMilestoneConfetti\(true\)/);
  });

  it('fires from a finished game too, behind its own once-flag', () => {
    expect(APP).toMatch(/loginStreak === 3 && !stats\.streak3Celebrated/);
  });
});
