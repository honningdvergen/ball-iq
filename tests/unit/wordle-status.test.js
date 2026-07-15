// readWordleTodayStatus — pins the exact `kind` strings ("ready" /
// "in-progress" / "won" / "lost") and payload shapes, because three home
// surfaces switch on them and the kinds are commonly guessed wrong.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getWordleDateKey, readWordleTodayStatus } from "../../src/lib/wordleStatus.js";

// Node has no localStorage — a Map-backed stub matches the API surface used.
const store = new Map();
vi.stubGlobal("localStorage", {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
});

const todayKey = () => `biq_wordle_${getWordleDateKey()}`;
const write = (obj) => localStorage.setItem(todayKey(), JSON.stringify(obj));

beforeEach(() => store.clear());

describe("getWordleDateKey", () => {
  it("is the user's LOCAL calendar date as YYYY-MM-DD", () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(getWordleDateKey()).toBe(expected);
  });
});

describe("readWordleTodayStatus kinds", () => {
  it("no entry -> ready", () => {
    expect(readWordleTodayStatus()).toEqual({ kind: "ready" });
  });

  it("entry with zero guesses -> still ready", () => {
    write({ guesses: [] });
    expect(readWordleTodayStatus()).toEqual({ kind: "ready" });
  });

  it("guesses but no terminal status -> in-progress with used count", () => {
    write({ guesses: ["KANE", "COLE"] });
    expect(readWordleTodayStatus()).toEqual({ kind: "in-progress", used: 2 });
  });

  it("won -> kind won with used count", () => {
    write({ status: "won", guesses: ["KANE", "COLE", "OWEN"] });
    expect(readWordleTodayStatus()).toEqual({ kind: "won", used: 3 });
  });

  it("lost -> kind lost, NO used field", () => {
    write({ status: "lost", guesses: ["KANE", "COLE", "OWEN", "MANE", "PELE", "BEST"] });
    expect(readWordleTodayStatus()).toEqual({ kind: "lost" });
  });

  it("corrupt JSON -> ready (never throws)", () => {
    localStorage.setItem(todayKey(), "{not json");
    expect(readWordleTodayStatus()).toEqual({ kind: "ready" });
  });

  it("missing guesses array -> ready (malformed entry treated as unplayed)", () => {
    write({ status: "won" });
    expect(readWordleTodayStatus()).toEqual({ kind: "ready" });
  });
});
