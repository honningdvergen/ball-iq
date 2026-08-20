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
  it("has the five leagues at their 2026-27 sizes", () => {
    const sizes = Object.fromEntries(STADIUM_LEAGUES.map((l) => [l.id, l.clubs.length]));
    expect(sizes).toEqual({
      "premier-league": 20, "la-liga": 20, "serie-a": 20,
      "bundesliga": 18, "ligue-1": 18,
    });
  });

  it("has unique clubs per league, and unique stadiums outside shared grounds", () => {
    for (const L of STADIUM_LEAGUES) {
      const clubs = L.clubs.map((c) => c.club);
      expect(new Set(clubs).size, L.id).toBe(clubs.length);
      // Shared grounds (San Siro, the Roman Olimpico) are two rows with the
      // SAME display name, explicitly marked `shared`; everything else must
      // be unique.
      const unshared = L.clubs.filter((c) => !c.shared).map((c) => c.stadium);
      expect(new Set(unshared).size, L.id).toBe(unshared.length);
      const sharedGroups = new Map();
      for (const c of L.clubs.filter((c) => c.shared)) {
        sharedGroups.set(c.shared, (sharedGroups.get(c.shared) || []).concat(c));
      }
      for (const [key, members] of sharedGroups) {
        expect(members.length, `${L.id}:${key}`).toBe(2);
        expect(new Set(members.map((m) => m.stadium)).size, `${L.id}:${key}`).toBe(1);
      }
    }
  });

  it("every accept entry is already in normalized form", () => {
    for (const L of STADIUM_LEAGUES) {
      for (const c of L.clubs) {
        for (const a of c.accept) {
          expect(normalizeStadiumGuess(a), `${L.id}:${c.club}`).toBe(a);
        }
      }
    }
  });

  it("no accept string is claimed by two clubs, except within a shared ground", () => {
    for (const L of STADIUM_LEAGUES) {
      const seen = new Map(); // form -> {club, shared}
      for (const c of L.clubs) {
        const forms = new Set([...c.accept, normalizeStadiumGuess(c.stadium)]);
        for (const f of forms) {
          const prev = seen.get(f);
          if (prev) {
            const sameGround = !!c.shared && prev.shared === c.shared;
            expect(sameGround, `${L.id}: "${f}" claimed by ${prev.club} and ${c.club}`).toBe(true);
          } else {
            seen.set(f, { club: c.club, shared: c.shared });
          }
        }
      }
    }
  });

  it("a shared ground fills both rows across two identical guesses", () => {
    const SA = STADIUM_LEAGUES.find((l) => l.id === "serie-a");
    const solved = new Set();
    const first = matchStadium(SA, "san siro", solved);
    expect(["Inter", "AC Milan"]).toContain(first);
    solved.add(first);
    const second = matchStadium(SA, "san siro", solved);
    expect(["Inter", "AC Milan"]).toContain(second);
    expect(second).not.toBe(first);
    solved.add(second);
    expect(matchStadium(SA, "san siro", solved)).toBe(null);
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
