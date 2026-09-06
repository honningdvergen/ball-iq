import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * A route that promises "play today's puzzles" must land on the screen that
 * renders them.
 *
 * This broke once, silently, and stayed broken. On 2026-09-06 the four daily
 * rows moved off the Daily tab (Home already listed them, and two doors to one
 * room read as a longer app) and the tab was renamed History. Two handlers kept
 * sending players there:
 *
 *   - the local-reminder tap, whose own comment said "the notification's whole
 *     point is 'play today's puzzles', so land the user on them"
 *   - the back/quit exit out of a daily game
 *
 * Both arrived on a countdown, a streak strip and a table of past days, with no
 * control that starts a puzzle. The reminder is the one mechanism that acts on
 * day-1-to-day-2 return, and it was pointed at the emptiest screen in the app.
 *
 * No linter sees this: both files were individually correct. The invariant only
 * exists in the relationship between them, so it is pinned here.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const HOME = read('../../src/screens/HomeScreen.jsx');
const DAILY = read('../../src/screens/DailyScreen.jsx');

describe("routes that promise today's puzzles land on today's puzzles", () => {
  it('Home is the screen that renders the daily rows, and History is not', () => {
    // If this ever inverts, the assertions below are pointing at the wrong tab
    // and must be re-derived rather than flipped.
    expect(HOME, 'the four dailies are rows on Home').toMatch(/todays-seven-secondary/);
    expect(DAILY, 'History lists no puzzle rows').not.toMatch(/todays-seven-secondary/);
  });

  it('a reminder tap lands on Home', () => {
    const handler = APP.match(/onReminderTap\(\(\) => \{[^}]*\}\)/)?.[0] || '';
    expect(handler, 'the reminder handler exists').toContain('setTab');
    expect(handler).toContain('setTab("home")');
  });

  it('quitting or finishing a daily lands on Home', () => {
    expect(APP).toMatch(/if \(mode === "daily"\) \{ setScreen\("home"\); setTab\("home"\); \}/);
  });

  it('nothing routes a player to the History tab as if it were playable', () => {
    // ?tab=daily stays ACCEPTED — an explicit link to the history surface is a
    // real destination. What must not exist is code that sends a player there
    // when what it owes them is a puzzle.
    expect(APP, 'the deep-link whitelist still honours old links')
      .toMatch(/\["home", "daily", "online", "profile"\]/);
    expect(APP, 'but no handler picks that tab on the player\'s behalf')
      .not.toMatch(/setTab\("daily"\)/);
  });
});
