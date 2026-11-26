// The question card's accent on a phone (lib/questionAccent.js, 26 Nov 2026).
// Alex, shown the card in every topic's colour and asked "Shall the build use the
// lifted colours for those four: yes, lifted, or keep today's?": "Yes, lifted".
// Pinned here: the four lifted values, the nine topics he called good unchanged,
// every topic with an accent, and the Ball IQ card's own colours untouched.
import { describe, it, expect } from "vitest";
import { questionAccent, questionCardStyle } from "../../src/lib/questionAccent.js";
import { catColour, qCardStyle } from "../../src/lib/ballIqCard.js";
import { lift } from "../../src/lib/colourMath.js";

const TOPICS = ["PL", "LaLiga", "SerieA", "Bundesliga", "Ligue1", "SuperLig", "Primeira", "UCL", "WorldCup", "Euros", "Legends", "Managers", "Records"];

describe("the question card's accent", () => {
  it("lifts exactly four colours, keeping their hue (the picture he approved)", () => {
    expect(questionAccent("UCL")).toBe("#2E63D6");
    expect(questionAccent("Ligue1")).toBe("#5B6FDB");
    expect(questionAccent("Primeira")).toBe("#14A05A");
    expect(questionAccent("WorldCup")).toBe("#C79A2B");
    // Euros wears International's colour on purpose: the rating it builds.
    expect(questionAccent("Euros")).toBe("#C79A2B");
  });
  it("leaves the others as the card has them today", () => {
    for (const c of ["PL", "LaLiga", "SerieA", "Bundesliga", "SuperLig", "Legends", "Managers", "Records"]) {
      expect(questionAccent(c), c).toBe(lift(catColour(c)));
    }
    expect(questionAccent("Managers")).toBe(questionAccent("Records"));
  });
  it("gives every topic an accent, and the style carries it", () => {
    for (const c of TOPICS) {
      expect(questionAccent(c), c).toMatch(/^#[0-9a-fA-F]{6}$/);
      const s = questionCardStyle(c);
      expect(s["--qq-k"], c).toBe(questionAccent(c));
      expect(s["--qq-kr"], c).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
    }
    expect(questionCardStyle("chaos")).toBeUndefined();
  });
  it("does not touch the Ball IQ card's colours or today's stripe", () => {
    expect(catColour("UCL")).toBe("#123A8F");
    expect(catColour("Ligue1")).toBe("#1B2447");
    expect(catColour("Primeira")).toBe("#046A38");
    expect(catColour("WorldCup")).toBe("#8A6D1B");
    expect(qCardStyle("UCL")).toEqual({ "--q-accent": "#123A8F" });
  });
});
