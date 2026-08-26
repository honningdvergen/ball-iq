import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CARD_COMPS, computeCard } from "../../src/lib/ballIqCard.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const APP = readFileSync(join(ROOT, "src/App.jsx"), "utf8");

/**
 * The rating card and the quiz picker both name the same six competitions.
 * They are declared in two places (CARD_COMPS in ballIqCard.js, and
 * LEAGUE_QUIZ_SECTIONS in App.jsx) because they serve different screens — but
 * a competition rendering purple in one and navy in the other is the drift
 * this repo keeps producing. Pin them together instead of merging the lists.
 */
function leagueQuizColours() {
  const start = APP.indexOf("const LEAGUE_QUIZ_SECTIONS = [");
  const block = APP.slice(start, APP.indexOf("\n];", start));
  const re = /\{\s*cat:\s*"([^"]+)"[^}]*?color:\s*"(#[0-9A-Fa-f]{6})"\s*\}/g;
  const out = {};
  for (const m of block.matchAll(re)) out[m[1]] = m[2].toUpperCase();
  return out;
}

describe("card competition colours", () => {
  it("parses the quiz picker (control — a zero here means the parser broke)", () => {
    const c = leagueQuizColours();
    expect(Object.keys(c).length).toBeGreaterThanOrEqual(10);
    expect(c.PL).toBe("#3D195B");
  });

  it("every card competition carries a colour", () => {
    expect(CARD_COMPS).toHaveLength(6);
    for (const c of CARD_COMPS) {
      expect(c.color, `${c.abbr} has no colour`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("matches the quiz picker's colour for the same cat", () => {
    const picker = leagueQuizColours();
    for (const c of CARD_COMPS) {
      expect(picker[c.cat], `${c.cat} missing from LEAGUE_QUIZ_SECTIONS`).toBeTruthy();
      expect(c.color.toUpperCase(), `${c.abbr} (${c.cat}) drifted from the quiz picker`)
        .toBe(picker[c.cat]);
    }
  });

  it("computeCard passes colour and cat through to the renderer", () => {
    const card = computeCard({});
    expect(card.ratings).toHaveLength(6);
    for (const r of card.ratings) {
      expect(r.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(r.cat).toBeTruthy();
    }
  });

  it("STILL shows no number for an unplayed competition", () => {
    // The card must never print the prior-seeded value as if it were measured.
    // A fabricated 64 shown as the visitor's own rating was a real bug; the
    // colour work must not have reopened it.
    const PROFILE = readFileSync(join(ROOT, "src/screens/ProfileScreen.jsx"), "utf8");
    const grid = PROFILE.slice(PROFILE.indexOf("_card.ratings.map"), PROFILE.indexOf("_card.ratings.map") + 1900);
    expect(grid).toMatch(/const played = r\.answered > 0;/);
    expect(grid).toMatch(/played \?[\s\S]{0,260}r\.rating/);
    // the unplayed branch must not reference r.rating at all
    const at = grid.indexOf(") : (");
    expect(at).toBeGreaterThan(-1);
    expect(grid.slice(at, at + 700)).not.toMatch(/r\.rating/);
  });
});
