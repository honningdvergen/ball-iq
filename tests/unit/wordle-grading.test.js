// gradeWordleGuess — two-pass Wordle colouring. The duplicate-letter cases
// are the ones that regress silently: greens must lock answer slots first,
// then yellows consume from the REMAINING letter counts.
import { describe, it, expect } from "vitest";
import { gradeWordleGuess } from "../../src/lib/wordle.js";

describe("gradeWordleGuess", () => {
  it("all green on an exact match", () => {
    expect(gradeWordleGuess("MESSI", "MESSI")).toEqual(["green", "green", "green", "green", "green"]);
  });

  it("all grey when no letters overlap", () => {
    expect(gradeWordleGuess("JOTA", "KING")).toEqual(["grey", "grey", "grey", "grey"]);
  });

  it("repeated guess letter against a single answer occurrence yields ONE non-grey", () => {
    // Answer KANE has one N (index 2). Guessing NNNN must show exactly the
    // green at index 2 — not extra yellows for the same N.
    expect(gradeWordleGuess("NNNN", "KANE")).toEqual(["grey", "grey", "green", "grey"]);
  });

  it("green consumes its slot before yellows are handed out", () => {
    // Answer MESSI has two S (idx 2,3). Guess SSSSS: those two go green;
    // the other three S's find no remaining S, so they are grey.
    expect(gradeWordleGuess("SSSSS", "MESSI")).toEqual(["grey", "grey", "green", "green", "grey"]);
  });

  it("wrong-position letters go yellow, each consuming one remaining copy", () => {
    // Answer KANE vs guess ANEK: full anagram, nothing in place -> all yellow.
    expect(gradeWordleGuess("ANEK", "KANE")).toEqual(["yellow", "yellow", "yellow", "yellow"]);
  });

  it("mixed: yellows only up to the count left after greens", () => {
    // Answer AGGER (A G G E R) vs guess GGGGG: greens at idx 1,2; the other
    // G's have no remaining G to consume -> grey.
    expect(gradeWordleGuess("GGGGG", "AGGER")).toEqual(["grey", "green", "green", "grey", "grey"]);
  });
});
