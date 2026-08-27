import { describe, it, expect } from "vitest";
import { CLUBS } from "../../scripts/seo/clubs.mjs";

/**
 * ⚠️ THE ARRAY HOLE. `clubs.mjs` is a hand-appended array literal, and JS
 * tolerates a trailing comma — so a blind append has produced BOTH a missing
 * comma (two objects merging into one) and a `},,` double comma, which leaves
 * an EMPTY SLOT that crashes every consumer the moment it iterates.
 *
 * The seo-wave skill says to import the file and assert after every append.
 * That instruction has existed for a while and nothing enforced it, so this
 * does — before wave P appends Leicester, Olympiacos and Panathinaikos.
 *
 * ⚠️ THE LENGTH LIMITS COME FROM scripts/audit-serp-meta.mjs, WHICH IS THE
 * AUTHORITY — TITLE_MAX 60, DESC_MAX 160, described there as the practical
 * truncation points Google uses (~600px). This test first used 155, copied
 * from the skill's prose, and immediately "found" five violations that were
 * all within the real limit. The data was right and the new instrument was
 * wrong. If these numbers ever move, move them there first.
 */
describe("clubs.mjs survives being appended to", () => {
  const list = Array.isArray(CLUBS) ? CLUBS : Object.values(CLUBS);

  it("has no array holes and no entry missing a slug", () => {
    // `.filter(Boolean)` would hide a hole; compare counts instead so an empty
    // slot is loud rather than quietly skipped.
    expect(list.length, "CLUBS is empty — the import or the export shape moved").toBeGreaterThan(80);
    const holes = [];
    list.forEach((c, i) => { if (!c || typeof c !== "object" || !c.slug) holes.push(i); });
    expect(holes, "empty slot or slug-less entry — look for `},,` or a missing comma").toEqual([]);
  });

  it("every slug is unique", () => {
    const seen = new Map();
    const dupes = [];
    list.forEach((c, i) => {
      if (seen.has(c.slug)) dupes.push(`${c.slug} at ${seen.get(c.slug)} and ${i}`);
      else seen.set(c.slug, i);
    });
    expect(dupes, "two entries claim the same slug — one page will silently win").toEqual([]);
  });

  it("every club carries the prose the generator requires", () => {
    const bad = [];
    for (const c of list) {
      if (!c.h1 || !c.title || !c.description) bad.push(`${c.slug}: missing h1/title/description`);
      if (!Array.isArray(c.intro) || c.intro.length !== 4) bad.push(`${c.slug}: intro is not 4 paragraphs`);
      if (!Array.isArray(c.faq) || c.faq.length !== 4) bad.push(`${c.slug}: faq is not 4 pairs`);
      else if (c.faq.some((f) => !f || !f.q || !f.a)) bad.push(`${c.slug}: an faq pair is missing q or a`);
    }
    expect(bad).toEqual([]);
  });

  it("titles and descriptions fit the SERP", () => {
    const over = [];
    for (const c of list) {
      if (c.title && c.title.length > 60) over.push(`${c.slug}: title ${c.title.length}`);
      if (c.description && c.description.length > 160) over.push(`${c.slug}: description ${c.description.length}`);
    }
    expect(over, "truncated in Google — the one place this copy has to work").toEqual([]);
  });
});
