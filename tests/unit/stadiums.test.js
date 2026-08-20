// Stadiums mode — dataset shape + matcher behaviour.
//
// The dataset is season-pinned (2026-27); these tests guard the properties
// that make the game fair rather than the season's specific facts:
// completeness, uniqueness, normalized accept lists, and a matcher that can
// never hand one club's ground to another.
import { describe, it, expect } from "vitest";
import { STADIUM_LEAGUES, normalizeStadiumGuess, matchStadium } from "../../src/data/stadiums.js";

const PL = STADIUM_LEAGUES.find((l) => l.id === "premier-league");

describe("stadiums dataset", () => {
  it("has the Premier League with exactly 20 clubs", () => {
    expect(PL).toBeTruthy();
    expect(PL.clubs.length).toBe(20);
  });

  it("has unique clubs and unique display stadiums", () => {
    const clubs = PL.clubs.map((c) => c.club);
    const stadiums = PL.clubs.map((c) => c.stadium);
    expect(new Set(clubs).size).toBe(clubs.length);
    expect(new Set(stadiums).size).toBe(stadiums.length);
  });

  it("every accept entry is already in normalized form", () => {
    for (const c of PL.clubs) {
      for (const a of c.accept) {
        expect(normalizeStadiumGuess(a)).toBe(a);
      }
    }
  });

  it("no accept string is claimed by two different clubs", () => {
    const seen = new Map();
    for (const c of PL.clubs) {
      const forms = new Set([...c.accept, normalizeStadiumGuess(c.stadium)]);
      for (const f of forms) {
        expect(seen.has(f), `"${f}" claimed by ${seen.get(f)} and ${c.club}`).toBe(false);
        seen.set(f, c.club);
      }
    }
  });
});

describe("matchStadium", () => {
  const none = new Set();

  it("matches sponsor and traditional names to the same club", () => {
    expect(matchStadium(PL, "Etihad", none)).toBe("Man City");
    expect(matchStadium(PL, "City of Manchester Stadium", none)).toBe("Man City");
    expect(matchStadium(PL, "Dean Court", none)).toBe("Bournemouth");
    expect(matchStadium(PL, "Falmer Stadium", none)).toBe("Brighton");
  });

  it("survives punctuation and case — St. James' Park", () => {
    expect(matchStadium(PL, "St. James' Park", none)).toBe("Newcastle");
    expect(matchStadium(PL, "ST JAMES PARK", none)).toBe("Newcastle");
  });

  it("never collides City Ground with City of Manchester", () => {
    expect(matchStadium(PL, "city ground", none)).toBe("Nottingham Forest");
    expect(matchStadium(PL, "city", none)).toBe(null);
  });

  it("excludes already-solved clubs so a repeat guess is a miss", () => {
    const solved = new Set(["Liverpool"]);
    expect(matchStadium(PL, "Anfield", solved)).toBe(null);
  });

  it("returns null for empty or garbage input", () => {
    expect(matchStadium(PL, "", none)).toBe(null);
    expect(matchStadium(PL, "   ", none)).toBe(null);
    expect(matchStadium(PL, "camp nou", none)).toBe(null);
  });

  it("covers the freshly-promoted 2026-27 grounds", () => {
    expect(matchStadium(PL, "MKM Stadium", none)).toBe("Hull City");
    expect(matchStadium(PL, "Portman Road", none)).toBe("Ipswich Town");
    expect(matchStadium(PL, "CBS Arena", none)).toBe("Coventry City");
    expect(matchStadium(PL, "Hill Dickinson Stadium", none)).toBe("Everton");
  });
});
