import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { clubColour, clubAbbr, packColourMap, tint, lift, onColour } from "../../src/lib/clubColour.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

/**
 * Club colour has ONE home. The lookup already lived in lib/clubColour.js, but
 * the rendering maths (tint / lift / onColour) sat inside TransferTrail.jsx —
 * so when Stadiums needed the same treatment the obvious move was to paste
 * them, which is exactly how two screens end up painting the same club two
 * different shades. They now live beside the lookup.
 */
describe("club colour is single-sourced", () => {
  it("no screen re-declares the colour helpers", () => {
    const screens = readdirSync(join(ROOT, "src/screens")).filter((f) => f.endsWith(".jsx"));
    const offenders = [];
    for (const f of screens) {
      const src = read(`src/screens/${f}`);
      for (const fn of ["tint", "lift", "onColour"]) {
        const re = new RegExp(`(const|function)\\s+${fn}\\s*[=(]`);
        if (re.test(src)) offenders.push(`${f}: ${fn}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("both screens that colour clubs import from the shared module", () => {
    for (const f of ["src/screens/TransferTrail.jsx", "src/screens/StadiumGame.jsx"]) {
      expect(read(f), `${f} must import the shared resolver`).toMatch(
        /import \{[^}]*clubColour[^}]*\} from "\.\.\/lib\/clubColour\.js"/
      );
    }
  });

  it("resolves the clubs a football audience would notice instantly", () => {
    // Control set. These MUST resolve — a run that reports Arsenal or Man
    // United as having no colour is a broken detector, not missing data, and
    // that false negative has now happened twice while measuring coverage.
    const packs = { a: { name: "Man United", color: "#DA291C" }, b: { name: "Liverpool", color: "#C8102E" } };
    const map = packColourMap(packs);
    expect(map).toEqual({ "Man United": "#DA291C", Liverpool: "#C8102E" });
    expect(clubColour("Man Utd", map)).toBe("#DA291C");   // transfer shorthand
    expect(clubColour("Manchester United", map)).toBe("#DA291C"); // formal
    expect(clubColour("Liverpool", map)).toBe("#C8102E");
    // Unknown club gets null, never a guessed colour.
    expect(clubColour("Wimbledon Casuals FC", map)).toBe(null);
  });

  it("picks readable ink, and lifts black-and-white sides so they are visible", () => {
    expect(onColour("#FFFFFF")).toBe("#14181F");  // Real Madrid white -> dark type
    expect(onColour("#FDE100")).toBe("#14181F");  // Dortmund yellow  -> dark type
    expect(onColour("#C8102E")).toBe("#FFFFFF");  // Liverpool red    -> white type
    expect(lift("#111111")).not.toBe("#111111");  // Juventus black is lifted for the tint
    expect(lift("#C8102E")).toBe("#C8102E");      // already bright, untouched
    expect(tint("#C8102E", 0.5)).toBe("rgba(200,16,46,0.5)");
  });

  it("clubAbbr never degrades to a single letter", () => {
    // "L" for Liverpool is the bug this exists to prevent.
    expect(clubAbbr("Liverpool", {}).length).toBeGreaterThanOrEqual(2);
    expect(clubAbbr("Chelsea", {}).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Stadiums shows the clubs by default", () => {
  const SRC = read("src/screens/StadiumGame.jsx");

  it("the club list is the prompt, not a hint", () => {
    // Reversal of the 2026-08-20 cold-start design: a first-time player used to
    // face 0/20, an empty box, and had to spend a hint to see what was asked.
    expect(SRC).toMatch(/clubsHidden: false/);
    expect(SRC).toMatch(/const showClubs = !state\.clubsHidden;/);
    // hintsUsed must no longer include the club list.
    const hu = SRC.match(/const hintsUsed = [^;]+;/)[0];
    expect(hu).not.toMatch(/clubsHidden|clubsRevealed/);
    expect(hu).toMatch(/state\.letters/);
  });

  it("hard mode does not leak the answer through colour", () => {
    // The chip and tint are gated on `named`, never on the row alone.
    expect(SRC).toMatch(/const named = isSolved \|\| showClubs;/);
    expect(SRC).toMatch(/const col = named \? clubColour\(/);
  });
});
