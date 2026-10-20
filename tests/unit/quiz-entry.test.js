import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * ONE QUIZ ENTRY (Alex, 16 Oct 2026).
 *
 * Home carried five doors for "a quiz on a topic": the League Quiz row and the
 * Classic, Legends, Chaos and Stadiums tiles. They became one Quiz row that
 * opens the lazy Quiz screen, where each old entry is a chip (Stadiums a row).
 * The approved mock and mapping: ball-iq-audit/2026-10-16/simplify/.
 *
 * What this pins is the PROMISE of the merge, not its pixels:
 *   1. Home has the one row and none of the old five.
 *   2. Every old mode is still reachable, through the launcher it used before,
 *      so pools, scoring, XP, results, History and analytics are unchanged.
 *   3. Legends is one door, not two.
 *   4. The old deep links still start their modes directly.
 *   5. The screen stays off Home's eager bundle.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const HOME = read("src/screens/HomeScreen.jsx");
const QUIZ = read("src/screens/QuizScreen.jsx");
const APP = read("src/App.jsx");
// Comments here quote the old markup on purpose; read the code only.
const code = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const HOME_CODE = code(HOME);
const QUIZ_CODE = code(QUIZ);
const APP_CODE = code(APP);

function pickerCats() {
  const start = APP.indexOf("const LEAGUE_QUIZ_SECTIONS = [");
  const block = APP.slice(start, APP.indexOf("\n];", start));
  return [...block.matchAll(/\{\s*cat:\s*"([^"]+)"/g)].map((m) => m[1]);
}

describe("Home: one Quiz row replaces five entries", () => {
  it("the Quiz row opens the Quiz screen", () => {
    expect(HOME_CODE).toMatch(/className="todays-seven-secondary mp-row quiz-entry"/);
    expect(HOME_CODE).toMatch(/onClick=\{\(\) => setScreen\("quiz-topics"\)\}/);
    expect(HOME_CODE).toMatch(/<span className="t7s-title">\{t\("home\.quiz\.title"\)\}<\/span>/); // en: "Quiz" (i18n step 2)
    expect(HOME_CODE).toMatch(/<CircleHelp size=\{22\}/);
  });

  it("the old League Quiz row and the four topic tiles are gone", () => {
    expect(HOME_CODE).not.toMatch(/startMode\("leaguequiz"\)/);
    expect(HOME_CODE).not.toMatch(/League Quiz/);
    for (const key of ["classic", "legends", "chaos", "stadiums"]) {
      expect(HOME_CODE, `${key} tile is back on Home`).not.toMatch(new RegExp(`key:\\s*"${key}"`));
    }
  });

  it("the grid keeps Survival and Hot Streak, the modes with rules of their own", () => {
    expect(HOME_CODE).toMatch(/key:"survival",\s*Icon: Heart/);
    expect(HOME_CODE).toMatch(/key:"hotstreak",\s*Icon: Flame/);
  });
});

describe("Quiz screen: every old entry, through its old launcher", () => {
  it("Mix holds Classic (Everything), Chaos and Legends as their own modes", () => {
    expect(QUIZ_CODE).toMatch(/key: "classic",\s*name: "Everything"/);
    expect(QUIZ_CODE).toMatch(/key: "chaos",\s*name: "Chaos"/);
    expect(QUIZ_CODE).toMatch(/key: "legends",\s*name: "Legends · pre-2000"/);
    // A Mix chip starts its mode through startMode, exactly as the tile did.
    expect(APP_CODE).toMatch(/onStartMode=\{\(m, t\) => \{ setQuizTopic\(t\); startMode\(m\); \}\}/);
  });

  it("every League Quiz competition is a chip, started by launchLeagueQuiz", () => {
    const cats = pickerCats();
    expect(cats.length, "parser control").toBeGreaterThanOrEqual(12);
    // The chips are LEAGUE_QUIZ_SECTIONS itself, minus Legends (which is in Mix).
    expect(QUIZ_CODE).toMatch(/LEAGUE_QUIZ_SECTIONS\s*\n?\s*\.map\(\(s\) => \(\{ label: s\.label, items: s\.items\.filter\(\(it\) => it\.cat !== "Legends"\) \}\)\)/);
    expect(cats).toContain("Legends");
    expect(APP_CODE).toMatch(/onStartCat=\{\(c, t\) => \{ setQuizTopic\(t\); launchLeagueQuiz\(c\); \}\}/);
  });

  it("Legends is one door: no second Legends chip under Themes", () => {
    expect((QUIZ_CODE.match(/name: "Legends/g) || []).length).toBe(1);
  });

  it("Stadiums is a row under 'Not ten questions' and opens the Stadiums screen", () => {
    expect(QUIZ_CODE).toMatch(/Not ten questions/);
    expect(QUIZ_CODE).toMatch(/<span className="qz-run-name">Stadiums<\/span>/);
    expect(APP_CODE).toMatch(/onStadiums=\{\(\) => setScreen\("stadiums"\)\}/);
  });

  it("one solid button, sentence case, lucide icons only", () => {
    expect((QUIZ_CODE.match(/next-btn-primary/g) || []).length).toBe(1);
    expect(QUIZ_CODE).toMatch(/>Start quiz</);
    for (const h of ["Mix", "Not ten questions"]) expect(QUIZ_CODE).toMatch(new RegExp(`>${h}<`));
    expect(QUIZ_CODE).not.toMatch(/textTransform|text-transform|uppercase/);
    // No typed arrows standing in for icons: the back and Open marks are lucide.
    expect(QUIZ_CODE).not.toMatch(/[←→]/);
    expect(QUIZ_CODE).toMatch(/<ArrowLeft size=/);
    expect(QUIZ_CODE).toMatch(/<ArrowRight size=/);
  });
});

describe("old routes and deep links", () => {
  it("?game= doors still start the old modes directly", () => {
    expect(APP_CODE).toMatch(/\["classic", "survival", "hotstreak", "legends", "chaos", "clubquiz", "leaguequiz"\]\.includes\(gameSlug\)\) \{ startMode\(gameSlug\); return; \}/);
    expect(APP_CODE).toMatch(/if \(gameSlug === "stadiums"\) \{ setScreen\("stadiums"\); return; \}/);
    // ?quiz=<slug> still resolves to a league quiz, not to the picker.
    expect(APP_CODE).toMatch(/else if \(catKey\) launchLeagueQuiz\(catKey\);/);
  });

  it("startMode keeps every mode it had, and leaguequiz now opens the Quiz screen", () => {
    expect(APP_CODE).toMatch(/else if \(m === "legends"\) \{ qs = await getQs\(\{ cat: "Legends", diff: "hard", n: 10 \}\); \}/);
    expect(APP_CODE).toMatch(/else if \(m === "chaos"\) \{/);
    expect(APP_CODE).toMatch(/if \(m === "leaguequiz"\) \{[^\n]*setScreen\("quiz-topics"\); return; \}/);
    expect(APP_CODE).not.toMatch(/"league-quiz"/);
  });

  it("quitting a league quiz goes back to the Quiz screen on that league", () => {
    expect(APP_CODE).toMatch(/else if \(activeLeague\) \{ setQuizTopic\(activeLeague\); setScreen\("quiz-topics"\); \}/);
  });

  it("the screen draws its own header, so the global wordmark stays off it", () => {
    expect(APP).toMatch(/"stadiums", "quiz-topics", "stump"/);
    expect(APP).toMatch(/"quiz-topics": "Quiz"/);
  });
});

describe("Home's eager budget", () => {
  it("the Quiz screen is lazy, never a static import", () => {
    expect(APP_CODE).toMatch(/const QuizScreen = withSuspense\(lazyNamed\(\(\) => import\('\.\/screens\/QuizScreen\.jsx'\), 'QuizScreen'\)/);
    expect(APP_CODE).not.toMatch(/import \{[^}]*QuizScreen[^}]*\} from/);
    expect(HOME_CODE).not.toMatch(/QuizScreen/);
  });
});
