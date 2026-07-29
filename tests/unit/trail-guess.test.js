import { describe, it, expect } from "vitest";
import {
  TRAIL_PLAYERS, TRAIL_ALIASES, TRAIL_POSITIONS, TRAIL_MAX_ATTEMPTS,
  normaliseGuess, normaliseVariants, acceptedNamesFor, guessMatchesPlayer,
  cluesShown, hintFor, buildTrailShareText,
} from "../../src/lib/trail.js";

const find = (k) => TRAIL_PLAYERS.find((p) => p.key === k);

describe("guess matching", () => {
  it("ignores accents, case and punctuation", () => {
    // One NFD rule instead of a lookup table: Čech, Özil, Agüero, Kanté.
    expect(guessMatchesPlayer("cech", find("CECH"))).toBe(true);
    expect(guessMatchesPlayer("Čech", find("CECH"))).toBe(true);
    expect(guessMatchesPlayer("  OZIL  ", find("OZIL"))).toBe(true);
    expect(guessMatchesPlayer("agüero", find("AGUERO"))).toBe(true);
    expect(guessMatchesPlayer("N'Golo Kanté", find("KANTE"))).toBe(true);
  });

  it("accepts the compound surname with or without the particle", () => {
    expect(guessMatchesPlayer("van Persie", find("VAN_PERSIE"))).toBe(true);
    expect(guessMatchesPlayer("persie", find("VAN_PERSIE"))).toBe(true);
  });

  // Alex, 2026-07-29: "people write names differently — some swedish names,
  // norwegian names, south american, they all have unique letters and dots
  // everywhere, so we should be graceful here."
  //
  // The subtle half: é č ö ü å ñ ş are DECORATED ascii letters and decompose
  // under NFD, so stripping marks handles them. But ø æ ß ł đ are their own
  // letters — they do not decompose, and a naive strip DELETES them. Measured
  // before the fold table existed: Ødegaard -> "degaard", Højbjerg -> "hjbjerg",
  // Błaszczykowski -> "baszczykowski", Đorđević -> "orevic", Weiß -> "wei".
  // Every one unwinnable, because the player types the obvious plain spelling.
  const asPlayer = (first, last) => ({ key: "TEST", display: [first, last], clubs: ["A", "B"], loans: [false, false] });

  it("folds letters that do NOT decompose, not just accents", () => {
    for (const [typed, real] of [
      ["Odegaard", "Ødegaard"], ["Hojbjerg", "Højbjerg"],
      ["Blaszczykowski", "Błaszczykowski"], ["Dordevic", "Đorđević"],
      ["Weiss", "Weiß"], ["Sorloth", "Sørloth"],
    ]) {
      expect(guessMatchesPlayer(typed, asPlayer("X", real)), `${typed} vs ${real}`).toBe(true);
      expect(guessMatchesPlayer(real, asPlayer("X", real)), `${real} typed exactly`).toBe(true);
    }
  });

  it("accepts both German/Nordic spellings of the same name", () => {
    // Müller is written "Muller" AND "Mueller" by real people; one fold cannot
    // satisfy both, so a name folds to a SET and the sets have to overlap.
    for (const typed of ["Muller", "Mueller", "Müller"]) {
      expect(guessMatchesPlayer(typed, asPlayer("Thomas", "Müller")), typed).toBe(true);
    }
    for (const typed of ["Odegaard", "Oedegaard", "Ødegaard"]) {
      expect(guessMatchesPlayer(typed, asPlayer("Martin", "Ødegaard")), typed).toBe(true);
    }
  });

  it("gracefulness does not make everything match everything", () => {
    expect(guessMatchesPlayer("Muller", asPlayer("Mesut", "Özil"))).toBe(false);
    expect(guessMatchesPlayer("Odegaard", asPlayer("Thomas", "Müller"))).toBe(false);
    expect(normaliseVariants("").length).toBe(0);
  });

  it("rejects a wrong player", () => {
    expect(guessMatchesPlayer("messi", find("RONALDO_C"))).toBe(false);
    expect(guessMatchesPlayer("", find("RONALDO_C"))).toBe(false);
  });

  // THE IMPORTANT ONE. Two careers are unwinnable without an alias, because the
  // surname in the data is not what any human types: Neymar's is "Júnior" and
  // Isco's is "Alarcón". This is the same class of bug as the unwinnable Footle
  // answer (SNIJDER spelled wrong) — perfect code, wrong content, and no linter
  // or type can see it. If someone adds a one-name player later without an
  // alias, this is what catches it.
  it("accepts the name people actually use for mononym players", () => {
    expect(guessMatchesPlayer("neymar", find("NEYMAR"))).toBe(true);
    expect(guessMatchesPlayer("isco", find("ISCO"))).toBe(true);
    expect(guessMatchesPlayer("joaquin", find("JOAQUIN"))).toBe(true);
  });

  it("every career is solvable by at least one accepted name", () => {
    const unsolvable = TRAIL_PLAYERS.filter(
      (p) => !acceptedNamesFor(p).some((n) => guessMatchesPlayer(n, p))
    );
    expect(unsolvable.map((p) => p.key)).toEqual([]);
  });

  it("no accepted name folds to an empty string", () => {
    // A name of only punctuation/accents would normalise to "" and then match
    // every empty guess — silently marking a blank submit correct.
    const empties = TRAIL_PLAYERS.flatMap((p) =>
      acceptedNamesFor(p).filter((n) => !normaliseGuess(n)).map(() => p.key)
    );
    expect(empties).toEqual([]);
  });
});

describe("clue ladder", () => {
  it("opens at two clubs and adds one per miss", () => {
    expect(cluesShown(0, 6)).toBe(2);
    expect(cluesShown(1, 6)).toBe(3);
    expect(cluesShown(4, 6)).toBe(6);
  });

  it("never exceeds the career, so a short career cannot show blanks", () => {
    expect(cluesShown(4, 3)).toBe(3);
    expect(cluesShown(99, 5)).toBe(5);
  });

  it("runs out of clubs exactly as attempts run out on the longest careers", () => {
    // The 3-6 rung editorial rule and TRAIL_MAX_ATTEMPTS have to stay in step:
    // a 6-club career should be fully revealed on the final attempt.
    expect(cluesShown(TRAIL_MAX_ATTEMPTS - 1, 6)).toBe(6);
  });
});

describe("hint", () => {
  it("stays hidden until three guesses are gone", () => {
    expect(hintFor(find("RONALDO_C"), 0)).toBeNull();
    expect(hintFor(find("RONALDO_C"), 2)).toBeNull();
    expect(hintFor(find("RONALDO_C"), 3)).toBe("Portugal · Forward");
  });

  it("has a position for every career", () => {
    const missing = TRAIL_PLAYERS.filter((p) => !TRAIL_POSITIONS[p.key]);
    expect(missing.map((p) => p.key)).toEqual([]);
  });
});

describe("share text", () => {
  it("names neither the player nor any club", () => {
    const p = find("RONALDO_C");
    const text = buildTrailShareText({ number: 12, won: true, clubsUsed: 3, streak: 7 });
    for (const club of p.clubs) expect(text).not.toContain(club);
    expect(text.toLowerCase()).not.toContain("ronaldo");
  });

  it("reports a loss without leaking how far you got", () => {
    const text = buildTrailShareText({ number: 12, won: false, clubsUsed: 5 });
    expect(text).toContain(`X/${TRAIL_MAX_ATTEMPTS}`);
  });

  it("only claims a streak on a win", () => {
    expect(buildTrailShareText({ number: 1, won: false, streak: 9 })).not.toContain("streak");
  });
});

describe("aliases", () => {
  it("only lists keys that exist", () => {
    const keys = new Set(TRAIL_PLAYERS.map((p) => p.key));
    expect(Object.keys(TRAIL_ALIASES).filter((k) => !keys.has(k))).toEqual([]);
  });
});
