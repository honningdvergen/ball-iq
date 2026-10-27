import { describe, it, expect } from "vitest";
import { optionOrder, isNumericScale } from "../../src/lib/quiz.js";

// 27 Oct 2026: the Daily 7 showed "Four, One, Two, Three". Number options are
// shown in rising order in every mode; anything else is shuffled as before.
const reverse = (a) => a.slice().reverse();
const shown = (o) => optionOrder(o, reverse).map((i) => o[i]);

describe("option order", () => {
  it("puts number scales in rising order", () => {
    expect(shown(["Four", "One", "Two", "Three"])).toEqual(["One", "Two", "Three", "Four"]);
    expect(shown(["1998", "1995", "1997", "1996"])).toEqual(["1995", "1996", "1997", "1998"]);
    expect(shown(["9th", "6th", "8th", "7th"])).toEqual(["6th", "7th", "8th", "9th"]);
    expect(shown(["2004-05", "2000-01", "2005-06", "2003-04"])).toEqual(["2000-01", "2003-04", "2004-05", "2005-06"]);
    expect(shown(["€10,000", "€1", "€1,000", "€100"])).toEqual(["€1", "€100", "€1,000", "€10,000"]);
    expect(shown(["Twelve points", "Eight points", "Fifteen points", "Ten points"])).toEqual(["Eight points", "Ten points", "Twelve points", "Fifteen points"]);
  });
  it("shuffles everything else", () => {
    expect(isNumericScale(["Arsenal", "Chelsea", "Everton", "Fulham"])).toBe(false);
    expect(isNumericScale(["One Direction", "Two", "Three", "Four"])).toBe(false);
    expect(isNumericScale(["10 goals", "12 assists", "14 goals", "16 goals"])).toBe(false);
    // Scorelines keep their shuffle: "6-5, 6-4, 6-1, 6-2" is no scale (review, 27 Oct).
    expect(isNumericScale(["6-5", "6-4", "6-1", "6-2"])).toBe(false);
    expect(isNumericScale(["1-0", "1-1", "2-2", "2-1"])).toBe(false);
    expect(shown(["Arsenal", "Chelsea", "Everton", "Fulham"])).toEqual(["Fulham", "Everton", "Chelsea", "Arsenal"]);
  });
  it("keeps the keyed answer findable", () => {
    const o = ["Four", "One", "Two", "Three"], a = 3;
    const idx = optionOrder(o, reverse);
    expect(idx.map((i) => o[i])[idx.indexOf(a)]).toBe("Three");
  });
});
