import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { buildClubRoutes } from "../../src/lib/clubFaceRoute.js";
import { CLUB_NAME_TO_COMP } from "../../src/data/clubPackColours.js";
import { faceCatFor, setClubRoutes } from "../../src/lib/ballIqCard.js";

/**
 * 2026-09-21 — the generated clubPackColours table came OFF Home's blocking
 * path. ballIqCard.js no longer imports it; App.jsx builds the same map from
 * CLUB_PACK_TO_QB + CLUB_LEAGUES and registers it with setClubRoutes().
 *
 * That trades a build-time guarantee for a runtime one, so it is pinned here:
 * if the registration line disappears, every club-quiz answer silently stops
 * feeding its league's face, and no other test would notice — the card still
 * renders, it is just wrong.
 */
const SRC = resolve(__dirname, "../../src");
const app = readFileSync(resolve(SRC, "App.jsx"), "utf8");

describe("the card's club routes", () => {
  it("are registered by App.jsx at MODULE level, from its own tables", () => {
    // Column 0 = top-level statement: not inside an effect, a callback or an import().
    expect(app).toMatch(/^setClubRoutes\(buildClubRoutes\(CLUB_PACK_TO_QB, CLUB_LEAGUES\)\);$/m);
  });

  it("built from App.jsx's tables equal the generated table the SEO pages stamp", () => {
    // Evaluate the two literals themselves (not the generator's regex parse of
    // them) so this is the map the BROWSER builds.
    const literal = (name) => {
      const m = app.match(new RegExp(`export const ${name} = (\\{[\\s\\S]*?\\n\\});`));
      expect(m, `${name} literal not found`).toBeTruthy();
      return new Function(`return (${m[1]});`)();
    };
    const runtime = buildClubRoutes(literal("CLUB_PACK_TO_QB"), literal("CLUB_LEAGUES"));
    expect(runtime).toEqual(CLUB_NAME_TO_COMP);
    expect(Object.keys(runtime).length).toBeGreaterThanOrEqual(90);
  });

  it("an unregistered map routes nothing, a registered one routes the club", () => {
    setClubRoutes({});
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("Legends");
    setClubRoutes(CLUB_NAME_TO_COMP);
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("PL");
  });

  it("no module the app boots with imports the generated colours table", () => {
    // TransferTrail is React.lazy and the islands are separate entries; they may.
    const ALLOWED = new Set(["screens/TransferTrail.jsx"]);
    const offenders = [];
    const scan = (dir, rel = "") => {
      for (const e of readdirSync(resolve(SRC, dir), { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) { if (e.name !== "islands" && e.name !== "data") scan(`${dir}/${e.name}`, r); continue; }
        if (!/\.(jsx?|mjs)$/.test(e.name)) continue;
        const src = readFileSync(resolve(SRC, dir, e.name), "utf8");
        if (/from\s+['"][^'"]*clubPackColours(\.js)?['"]/.test(src) && !ALLOWED.has(r)) offenders.push(r);
      }
    };
    scan(".");
    expect(offenders, "importing clubPackColours puts a generated, ever-growing table on Home's boot path").toEqual([]);
  });
});
