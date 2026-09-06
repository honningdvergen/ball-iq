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
    // A fabricated 64 shown as the visitor's own rating was a real bug; neither
    // the colour work nor the extraction into a shared component may reopen it.
    const FACE = readFileSync(join(ROOT, "src/components/BallIqCardFace.jsx"), "utf8");
    // Anchor on the RENDER ternary, not on a character distance — an earlier
    // version measured from the nearest `played ?` (a style prop) and broke the
    // moment a comment was added between it and the number.
    const grid = FACE.slice(FACE.indexOf("card.ratings.map"));
    expect(grid).toMatch(/const has = r\.answered >= MIN_RATED_ANSWERS;/);

    const open = grid.indexOf("{has ? (");
    expect(open, "the played/unplayed render ternary is gone").toBeGreaterThan(-1);
    const split = grid.indexOf(") : (", open);
    const close = grid.indexOf(")}", split);
    expect(split).toBeGreaterThan(open);
    expect(close).toBeGreaterThan(split);

    // the number lives ONLY in the played branch
    expect(grid.slice(open, split)).toMatch(/r\.rating/);
    expect(grid.slice(split, close)).not.toMatch(/r\.rating/);
  });

  it("there is exactly ONE card layout, and both profiles use it", () => {
    // ⚠️ THIS IS THE REAL REGRESSION GUARD. The card was built on the owner's
    // profile, re-approximated on a friend's, and Alex caught the difference
    // twice — "just use the same card design", then "you see how my friends
    // card still is not exactly like the one on my profile?". Both times the
    // fix was to copy the markup across, and a copy is a promise that somebody
    // will edit one of them. Now there is one component; nothing else may
    // render the six competitions itself.
    const PROFILE = readFileSync(join(ROOT, "src/screens/ProfileScreen.jsx"), "utf8");
    expect((PROFILE.match(/<BallIqCardFace[\s/>]/g) || []).length,
      "owner and friend profiles must both render the shared card").toBe(2);

    // Exactly one hand-rolled ratings grid may remain, and only the ≥1024px
    // desktop reflow is allowed to be it. That pane is a genuinely different
    // layout — wide, horizontal, driven by .pd-* classes in app.css and
    // mirrored in the standalone block — not an approximation of this card.
    // A SECOND one appearing here means the phone card has forked again.
    const grids = [...PROFILE.matchAll(/ratings\.map/g)];
    expect(grids.length, "a phone-side card grid has come back").toBe(1);
    expect(PROFILE.slice(Math.max(0, grids[0].index - 1200), grids[0].index),
      "the surviving grid is not the desktop pane").toMatch(/pd-/);
  });
});
