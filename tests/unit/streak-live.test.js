import { describe, it, expect } from "vitest";
import { liveStreak, localDayNow, shieldsAvailable } from "../../src/lib/streak.js";

// ⚠️ THE BUG THIS PINS: a signed-in player with {streak: 1, best: 58} on the
// server was shown "0 day streak - play one puzzle to light it" on any device
// whose localStorage had not cached it — a reinstall, a new phone, cleared
// data. Nothing fed the display, because hydrate had been told (wrongly) that
// a mount-time useEffect would call the tick RPC. It does not exist.
describe("liveStreak", () => {
  const T = 20706;
  it("keeps a streak extended today or yesterday — you have all of today to keep it", () => {
    expect(liveStreak({ streak: 9, lastDay: T }, T)).toBe(9);
    expect(liveStreak({ streak: 9, lastDay: T - 1 }, T)).toBe(9);
  });
  it("ends a streak that missed a day with no shield", () => {
    expect(liveStreak({ streak: 9, lastDay: T - 2 }, T, 0)).toBe(0);
    expect(liveStreak({ streak: 58, lastDay: T - 30 }, T, 3)).toBe(0);
  });
  it("lets one banked shield carry a single missed day", () => {
    expect(liveStreak({ streak: 9, lastDay: T - 2 }, T, 1)).toBe(9);
  });
  it("trusts a lastDay ahead of today rather than punishing our own clock change", () => {
    // a legacy UTC tick banked a later day; the player did nothing wrong
    expect(liveStreak({ streak: 4, lastDay: T + 1 }, T)).toBe(4);
  });
  it("is 0 for absent, empty or malformed records — never NaN or undefined", () => {
    for (const bad of [null, undefined, {}, { streak: 0, lastDay: T }, { streak: 5 }, { streak: "x", lastDay: T }]) {
      expect(liveStreak(bad, T)).toBe(0);
    }
  });
  it("READS ONLY — the same record on the same day never grows", () => {
    const rec = { streak: 3, lastDay: T - 1 };
    expect(liveStreak(rec, T)).toBe(3);
    expect(liveStreak(rec, T)).toBe(3);
    expect(rec).toEqual({ streak: 3, lastDay: T - 1 });
  });
});

describe("shieldsAvailable", () => {
  it("is one per 200 XP, capped at 3, minus those spent", () => {
    expect(shieldsAvailable(0, 0)).toBe(0);
    expect(shieldsAvailable(199, 0)).toBe(0);
    expect(shieldsAvailable(400, 0)).toBe(2);
    expect(shieldsAvailable(99999, 0)).toBe(3);   // the cap kills the every-other-day "streak"
    expect(shieldsAvailable(600, 2)).toBe(1);
    expect(shieldsAvailable(200, 9)).toBe(0);     // never negative
  });
});

describe("localDayNow", () => {
  it("counts LOCAL days, so an evening west of UTC is not a skipped day", () => {
    const d = new Date("2026-09-10T23:30:00Z");
    expect(Number.isInteger(localDayNow(d))).toBe(true);
    // one day later is exactly one day later, whatever the zone
    expect(localDayNow(new Date(d.getTime() + 86400000)) - localDayNow(d)).toBe(1);
  });
});

import { questionSeconds } from "../../src/lib/quiz.js";

// ⚠️ A FLAT CLOCK PUNISHED LONG QUESTIONS. Watched on device: a seven-line
// stem plus four club names is ~270 characters, roughly half of a 20-second
// timer spent reading. Nothing may ever get LESS than the base.
describe("questionSeconds", () => {
  const opts = ["Granada", "Girona", "Alavés", "Las Palmas"];
  it("leaves short and average questions exactly as they were", () => {
    expect(questionSeconds({ q: "Who won the Ballon d'Or in 2022?", o: opts })).toBe(20);
    expect(questionSeconds({ q: "x".repeat(110), o: opts })).toBe(20);
  });
  it("buys reading time for a genuinely long stem", () => {
    const long = "Which Catalan club shocked Spanish football in 2023-24 by finishing third and qualifying for the Champions League for the first time, under manager Míchel — beating Barcelona 4-2 home and away that season?";
    expect(questionSeconds({ q: long, o: opts })).toBe(23);
  });
  it("counts the OPTIONS too — they are half the reading on a four-club question", () => {
    const stem = "x".repeat(150);
    expect(questionSeconds({ q: stem, o: [] })).toBe(20);
    expect(questionSeconds({ q: stem, o: ["y".repeat(50), "y".repeat(50), "y".repeat(50), "y".repeat(50)] })).toBe(28);
  });
  it("caps the bonus so one pathological row cannot hand out a minute", () => {
    expect(questionSeconds({ q: "x".repeat(5000), o: opts })).toBe(30);
  });
  it("never returns less than the base, whatever it is handed", () => {
    for (const bad of [null, undefined, {}, { q: "" }, { q: "hi", o: null }]) {
      expect(questionSeconds(bad)).toBeGreaterThanOrEqual(20);
    }
    expect(questionSeconds({ q: "short" }, 12)).toBe(12);
  });
});
