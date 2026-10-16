import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { buildClubRoutes } from "../../src/lib/clubFaceRoute.js";
import { CLUB_NAME_TO_COMP } from "../../src/data/clubPackColours.js";
import { faceCatFor, setClubRoutes } from "../../src/lib/ballIqCard.js";
import { CLUB_PACK_TO_QB, CLUB_LEAGUES, CLUB_SLUG_TO_PACK } from "../../src/data/clubPacks.js";
import { CLUB_INDEX } from "../../src/marketing/clubIndex.js";

/**
 * 2026-09-21 — the generated clubPackColours table came OFF Home's blocking
 * path. ballIqCard.js no longer imports it; the app builds the same map from
 * CLUB_PACK_TO_QB + CLUB_LEAGUES and registers it with setClubRoutes().
 *
 * That trades a build-time guarantee for a runtime one, so it is pinned here:
 * if the registration line disappears, every club-quiz answer silently stops
 * feeding its league's face, and no other test would notice — the card still
 * renders, it is just wrong.
 *
 * 2026-10-16 — the two tables left App.jsx for the LAZY src/data/clubPacks.js
 * (Home eager budget). Registration moved with them into lib/clubData.js,
 * which registers BEFORE its promise resolves; the runtime guarantee is now
 * that every source of club answers waits for that promise. All three pinned.
 */
const SRC = resolve(__dirname, "../../src");
const app = readFileSync(resolve(SRC, "App.jsx"), "utf8");
const loader = readFileSync(resolve(SRC, "lib/clubData.js"), "utf8");
const bankLoader = readFileSync(resolve(SRC, "questions-loader.js"), "utf8");

describe("the card's club routes", () => {
  it("are registered the moment the club tables load, before anyone is told they have", () => {
    const m = loader.match(/import\('\.\.\/data\/clubPacks\.js'\)\.then\(\(mod\) => \{([\s\S]*?)return mod;/);
    expect(m, "the clubPacks import() in lib/clubData.js was not found").toBeTruthy();
    const body = m[1];
    expect(body).toMatch(/setClubRoutes\(buildClubRoutes\(mod\.CLUB_PACK_TO_QB, mod\.CLUB_LEAGUES\)\);/);
    // Registered before `loaded` is published, so clubData() can never return
    // tables the card has not been told about.
    expect(body.indexOf("setClubRoutes(")).toBeLessThan(body.indexOf("loaded = mod"));
  });

  it("every source of club answers waits for them", () => {
    // 1. Bank rounds: no bank without the routes.
    expect(bankLoader).toMatch(/Promise\.all\(\[import\('\.\/questions\.js'\), import\('\.\/questionConflicts\.js'\), loadClubData\(\)\]\)/);
    // 2. The web's queued club-page rounds drain only once the tables have landed.
    expect(app).toMatch(/loadClubData\(\)\.then\(\(\) => \{\s*const pending = drainPendingRounds\(\);/);
    // 3. And the load starts at App.jsx module level, not on some later tap.
    expect(app).toMatch(/^loadClubData\(\)\.catch\(\(\) => \{\}\);$/m);
  });

  it("loading the tables registers the routes (the real loader, end to end)", async () => {
    setClubRoutes({});
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("Legends");
    const { loadClubData, clubData } = await import("../../src/lib/clubData.js");
    const mod = await loadClubData();
    expect(clubData()).toBe(mod);
    expect(faceCatFor({ cat: "ClubQuiz", realCat: "History", club: "Arsenal" })).toBe("PL");
  });

  it("App.jsx never imports the club tables statically (that puts them back on Home)", () => {
    expect(app).not.toMatch(/from\s+['"]\.\/data\/clubPacks(\.js)?['"]/);
  });

  it("the boot check's slug set (the eager club index) is exactly CLUB_SLUG_TO_PACK's", () => {
    // App.jsx decides whether a ?club= link skips onboarding SYNCHRONOUSLY, so
    // it reads the club index Home already carries instead of the lazy map.
    // That is only the same decision while the two slug sets are equal.
    expect(CLUB_INDEX.map((r) => r.s).sort()).toEqual(Object.keys(CLUB_SLUG_TO_PACK).sort());
  });

  it("built from the club tables equal the generated table the SEO pages stamp", () => {
    // The tables themselves (not the generator's regex parse of them), so this
    // is the map the BROWSER builds.
    const runtime = buildClubRoutes(CLUB_PACK_TO_QB, CLUB_LEAGUES);
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
    // TransferTrail and StitchUp are React.lazy and the islands are separate
    // entries; they may.
    const ALLOWED = new Set(["screens/TransferTrail.jsx", "screens/StitchUp.jsx"]);
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
