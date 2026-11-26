// THE QUIZ TOPIC SCREEN ON A PHONE (26 Nov 2026). The third drawing,
// ball-iq-audit/2026-11-24/finish/quiz-picker-3.png (the right phone), which Alex
// approved with "Yes, build it": every topic the same row in a plain card, a
// league's row led by its country's flag, the chosen row a soft green wash and a
// tick, and the one solid "Start quiz". What this pins:
//   1. every topic of QUIZ_CAT_SECTIONS, and Everything, Chaos and Legends, has a
//      row; a tap on a row chooses it, and Start starts that quiz through the
//      launcher it used before (nothing added, nothing removed);
//   2. a league row's mark is its country's flag from public/flags/, the file
//      src/data/nationFlags.json names, fetched as a picture; no league logo and
//      no colour of a topic's own anywhere on the list;
//   3. the wide window (1024 and up) still draws the pills it had;
//   4. the list's CSS starts at .qz-screen.is-list and keeps to the type scale.
// No DOM here: the screen is called as a function with React's hooks stood in
// for, and its element tree is walked (a row's onClick is called as a tap would).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const H = vi.hoisted(() => ({ sets: [] }));
vi.mock("react", async (orig) => {
  const R = await orig();
  const useState = (init) => { const v = typeof init === "function" ? init() : init; const set = (x) => H.sets.push(x); return [v, set]; };
  const useEffect = () => {};
  const useSyncExternalStore = (sub, get) => get();
  const over = { useState, useEffect, useSyncExternalStore };
  return { ...R, ...over, default: { ...R.default, ...over } };
});
vi.mock("../../src/lib/feedback.js", async (orig) => ({ ...(await orig()), haptic: () => {} }));

const { QuizScreen, QUIZ_CAT_SECTIONS, QUIZ_MIX, QUIZ_LEAGUE_FLAGS, QUIZ_TOPIC_ICONS } = await import("../../src/screens/QuizScreen.jsx");
const flags = JSON.parse(readFileSync(fileURLToPath(new URL("../../src/data/nationFlags.json", import.meta.url)), "utf8"));
const CSS = readFileSync(fileURLToPath(new URL("../../src/screens/quiz.css", import.meta.url)), "utf8");

// Every element in a tree (arrays, fragments and falsy children flattened).
function walk(node, out = []) {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out)); return out; }
  if (!node || typeof node !== "object") return out;
  out.push(node);
  walk(node.props?.children, out);
  return out;
}
const cls = (el) => String(el.props?.className || "");
function flat(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flat).join("");
  return flat(node.props?.children);
}

const spies = () => ({ onStartMode: vi.fn(), onStartCat: vi.fn(), onStadiums: vi.fn(), onBack: vi.fn() });
const screen = (props) => walk(QuizScreen({ catStats: {}, cardLeague: "PL", ...props }));
const rows = (els) => els.filter((e) => e.type === "button" && /\bqz-chip\b/.test(cls(e)));
const startBtn = (els) => els.find((e) => e.type === "button" && /\bqz-start\b/.test(cls(e)));

const CATS = QUIZ_CAT_SECTIONS.flatMap((s) => s.items);
const NATIONS = { PL: "England", LaLiga: "Spain", SerieA: "Italy", Bundesliga: "Germany", Ligue1: "France", SuperLig: "Turkey", Primeira: "Portugal" };

beforeEach(() => { H.sets.length = 0; vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) }); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("the phone list: every topic, and each one starts its own quiz", () => {
  it("fifteen rows: Everything, Chaos, Legends, then every topic of QUIZ_CAT_SECTIONS in its order", () => {
    const els = screen(spies());
    expect(els.some((e) => /\bis-list\b/.test(cls(e)))).toBe(true);
    const names = rows(els).map((r) => flat(r.props.children));
    expect(names.length).toBe(QUIZ_MIX.length + CATS.length);
    expect(names.slice(0, 3)).toEqual(["EverythingAll topics mixed", "Chaos", "Legendspre-2000"]);
    expect(names.slice(3)).toEqual(CATS.map((it) => it.name));
    expect(CATS.map((it) => it.cat)).not.toContain("Legends"); // one door for Legends
  });

  it("a tap on a row chooses that topic", () => {
    const els = screen(spies());
    rows(els).forEach((r) => r.props.onClick());
    expect(H.sets).toEqual([...QUIZ_MIX.map((m) => m.key), ...CATS.map((it) => it.cat)]);
  });

  it("with a league topic chosen, its row is the chosen one and Start calls launchLeagueQuiz's hand-off with it", () => {
    for (const it of CATS) {
      const s = spies();
      const els = screen({ ...s, initialTopic: it.cat });
      const on = rows(els).filter((r) => r.props["aria-pressed"] === true);
      expect(on.length, it.cat).toBe(1);
      expect(flat(on[0].props.children), it.cat).toBe(it.name);
      expect(cls(on[0])).toMatch(/\bis-on\b/);
      startBtn(els).props.onClick();
      expect(s.onStartCat).toHaveBeenCalledWith(it.cat, it.cat);
      expect(s.onStartMode).not.toHaveBeenCalled();
    }
  });

  it("Everything, Chaos and Legends start their own modes, as the old tiles did", () => {
    for (const { key } of QUIZ_MIX) {
      const s = spies();
      const els = screen({ ...s, initialTopic: key });
      startBtn(els).props.onClick();
      expect(s.onStartMode).toHaveBeenCalledWith(key, key);
      expect(s.onStartCat).not.toHaveBeenCalled();
    }
    // Nothing chosen yet: Everything, as before.
    const s = spies();
    startBtn(screen({ ...s })).props.onClick();
    expect(s.onStartMode).toHaveBeenCalledWith("classic", "classic");
  });

  it("Stadiums is still a row of its own, and back still leaves", () => {
    const s = spies();
    const els = screen(s);
    const st = els.find((e) => e.type === "button" && /\bqz-stadiums\b/.test(cls(e)));
    expect(flat(st.props.children)).toBe("StadiumsName every ground in a league");
    st.props.onClick();
    expect(s.onStadiums).toHaveBeenCalledTimes(1);
    const back = els.find((e) => e.type === "button" && /\bback-btn\b/.test(cls(e)));
    expect(back.props.onClick).toBe(s.onBack);
  });

  it("one solid button on the screen, and the summary names the choice in the app's own line", () => {
    const els = screen({ ...spies(), initialTopic: "PL" });
    expect(els.filter((e) => /next-btn-primary/.test(cls(e))).length).toBe(1);
    const sum = els.find((e) => /\bqz-sum\b/.test(cls(e)));
    expect(flat(sum.props.children).replace(/ /g, " ").trim()).toBe("Premier League · 10 questions · builds your EPL rating");
  });
});

describe("league rows lead with their country's flag; no logo, no colour of a topic's own", () => {
  it("each league's flag is the file nationFlags.json names for its country, and the file is there", () => {
    expect(Object.keys(QUIZ_LEAGUE_FLAGS).sort()).toEqual(QUIZ_CAT_SECTIONS.find((s) => s.label === "Leagues").items.map((it) => it.cat).sort());
    for (const [cat, file] of Object.entries(QUIZ_LEAGUE_FLAGS)) {
      expect(file, cat).toBe(flags[NATIONS[cat]]);
      expect(existsSync(fileURLToPath(new URL(`../../public/${file}`, import.meta.url))), file).toBe(true);
    }
    // England's own cross, never the Union flag.
    expect(QUIZ_LEAGUE_FLAGS.PL).toBe("flags/england.png");
  });

  it("a flag is a plain picture with its size and loading set, decorative beside the league's name", () => {
    const els = screen(spies());
    const imgs = els.filter((e) => e.type === "img");
    expect(imgs.length).toBe(7);
    for (const img of imgs) {
      expect(img.props.src).toMatch(/^\/flags\/[a-z-]+\.png$/);
      expect([img.props.width, img.props.height, img.props.loading]).toEqual(["26", "18", "lazy"]);
      expect(img.props.alt).toBe("");
      expect(img.props["aria-hidden"]).toBe("true");
    }
  });

  it("no row carries a style, a logo, a badge or a colour of its own", () => {
    const list = screen(spies());
    for (const r of rows(list)) {
      for (const e of walk(r)) {
        expect(e.props?.style, flat(r.props.children)).toBeUndefined();
        expect(cls(e)).not.toMatch(/cf-abbr|logo/);
        if (e.type === "img") expect(e.props.src).not.toMatch(/logo/i);
      }
    }
    // The other topics: one grey line icon each, from lucide.
    expect(Object.keys(QUIZ_TOPIC_ICONS).sort()).toEqual(["Euros", "Managers", "Records", "UCL", "WorldCup"]);
  });
});

describe("the wide window keeps its pills", () => {
  it("at 1024 and up the screen is the pills it was, with their badges", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    const els = screen(spies());
    expect(els.some((e) => /\bis-list\b/.test(cls(e)))).toBe(false);
    expect(rows(els).every((r) => /\bcf-chip\b/.test(cls(r)))).toBe(true);
    expect(els.filter((e) => /\bcf-abbr\b/.test(cls(e))).length).toBe(CATS.length);
    expect(els.some((e) => e.type === "img")).toBe(false);
  });
});

describe("the list's CSS", () => {
  const mark = CSS.indexOf("THE PHONE LIST (26 Nov 2026)");
  const list = CSS.slice(CSS.lastIndexOf("/*", mark)).replace(/\/\*[\s\S]*?\*\//g, "");
  it("every rule starts at .qz-screen.is-list, so the wide window is untouched", () => {
    expect(mark).toBeGreaterThan(0);
    const selectors = [...list.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)].map((m) => m[2].trim()).filter((s) => !/^@|^\d/.test(s));
    expect(selectors.length).toBeGreaterThan(20);
    for (const sel of selectors) for (const one of sel.split(",")) expect(one.trim(), sel).toMatch(/^\.qz-screen\.is-list\b/);
  });
  it("type sizes are 11, 13.5, 16 and 24 only; no amber", () => {
    const sizes = new Set([...list.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => m[1]));
    for (const s of sizes) expect(["11", "13.5", "16", "24"]).toContain(s);
    expect(CSS).not.toMatch(/amber/i);
  });
});

// 26 Nov 2026: Stadiums' back arrow went Home even when it was opened from the
// Quiz topic list, one step too far (found by playing the live screen).
describe("Stadiums opened from the Quiz topic list goes back to that list", () => {
  const APP = readFileSync(fileURLToPath(new URL("../../src/App.jsx", import.meta.url)), "utf8");
  it("the list marks where Stadiums was opened from, and its exit returns there", () => {
    expect(APP).toContain('onStadiums={() => { stadiumsFromQuiz.current = true; setScreen("stadiums"); }}');
    expect(APP).toContain('<StadiumGame onExit={() => { if (stadiumsFromQuiz.current) { stadiumsFromQuiz.current = false; setScreen("quiz-topics"); } else goHome(); }}');
  });
  it("opened by its own link it still leaves to Home", () => {
    expect(APP).toContain('if (gameSlug === "stadiums") { stadiumsFromQuiz.current = false; setScreen("stadiums"); return; }');
  });
});
