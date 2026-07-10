// Footle puzzle-number math, extracted from wordle.js so MarketingHome can
// show "Footle #N is live today" without pulling the 400+-player answer list
// (and the rest of the game logic) into the marketing chunk.
//
// #1 = WORDLE_ANCHOR_DAY (2026-05-04, pre-launch). Accepts a Date so the
// review screen can number PAST puzzles. Both share builders AND the
// marketing strip must use this — the number is the token that makes
// strangers' grids comparable in a feed.

export const DAY_MS = 24 * 60 * 60 * 1000;

export const WORDLE_ANCHOR_DAY = 20577;

export function getFootleNumber(date = new Date()) {
  const di = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  return di - WORDLE_ANCHOR_DAY + 1;
}
