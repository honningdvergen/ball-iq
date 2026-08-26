import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const GEN = readFileSync(join(ROOT, "scripts/gen-seo-pages.mjs"), "utf8");

/**
 * Guards four defects found live on 2026-08-26. All four passed every existing
 * check because they are bugs in GENERATED output, not in the generator's own
 * control flow — nothing ever rendered the pages.
 *
 * These tests run BEFORE `vite build` and the SEO generator in the build chain,
 * so there is no dist/ to read; everything asserts against the generator
 * source. Where the logic itself is the bug, the trap is reproduced directly
 * so the file records WHY the shape matters.
 */
describe("SEO funnel attribution", () => {
  it("the substring trap that caused it is real, and stays documented", () => {
    // This is the whole bug in one line: the Play Store URL contains "/play".
    expect("https://play.google.com/store/apps/details?id=app.balliq".indexOf("/play")).toBe(7);
    // Which is why href matching can never be trusted to mean "our web app".
    expect("https://play.google.com/store".indexOf("/play")).toBeGreaterThan(-1);
  });

  it("classifies outbound clicks by resolved hostname, store branch first", () => {
    const m = GEN.match(/var qh=\(a\.hostname\|\|''\);([\s\S]{0,400}?list-out-play'\);)/);
    expect(m, "outbound-click classifier not found — did it move or get rewritten?").toBeTruthy();
    const snippet = m[1];

    // Store must be decided first, on an EXACT host, so no substring can win.
    const storeAt = snippet.indexOf("list-out-store");
    const playAt = snippet.indexOf("list-out-play");
    expect(storeAt).toBeGreaterThan(-1);
    expect(playAt).toBeGreaterThan(-1);
    expect(storeAt).toBeLessThan(playAt);
    expect(snippet).toMatch(/qh==='play\.google\.com'/);
    expect(snippet).toMatch(/qh==='apps\.apple\.com'/);

    // The store test must not be an href substring check any more.
    expect(snippet).not.toMatch(/h\.indexOf\('play\.google\.com'\)/);
    expect(snippet).not.toMatch(/h\.indexOf\('apps\.apple\.com'\)/);

    // /get 302s to /play, so it belongs with the web app, not the store hop.
    expect(snippet).toMatch(/h\.indexOf\('\/get'\)>-1/);
  });

  it("never hardcodes the surface — it is derived from the path, in ONE place", () => {
    expect(GEN).not.toMatch(/surface:\s*['"]list-page['"]/);
    expect(GEN.match(/function biqSurface\(\)/g) || []).toHaveLength(1);
    expect(GEN).not.toMatch(/function tSurface\(\)/);
    expect((GEN.match(/surface:biqSurface\(\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });
});

describe("SEO generated markup", () => {
  it("reads playLabel off the club config, not the shared locale copy", () => {
    // `c` is the per-language copy object; `playLabel` lives on `cfg`. Reading
    // c.playLabel printed the literal "undefined →" on 35 localised pages —
    // the page type that converts 2.6x per market.
    expect(GEN).not.toMatch(/\$\{esc\(c\.playLabel\)\}/);
    expect(GEN).toMatch(/\$\{esc\(cfg\.playLabel\)\}/);
  });

  it("emits answer-option styling for BOTH selectors from one source", () => {
    // The static Q&A blocks on list pages use `.qa-opts .to` and render a `.tl`
    // letter badge. Those rules existed only for the taster's bare `.to`, so
    // list pages rendered "AEintracht Frankfurt" with no layout at all.
    expect(GEN).toMatch(/const OPTION_CSS = \(s\) =>/);
    expect(GEN).toMatch(/\$\{OPTION_CSS\('\.to'\)\}/);
    expect(GEN).toMatch(/\$\{OPTION_CSS\('\.qa-opts \.to'\)\}/);

    const fn = GEN.match(/const OPTION_CSS = \(s\) => `([\s\S]*?)`;/);
    expect(fn, "OPTION_CSS body not found").toBeTruthy();
    expect(fn[1]).toMatch(/display:flex/);
    expect(fn[1]).toMatch(/\$\{s\} \.tl\{/);

    // The tighter list-page padding must stay AFTER the shared block or it
    // loses the cascade — same selector, so source order decides.
    expect(GEN.indexOf("${OPTION_CSS('.qa-opts .to')}"))
      .toBeLessThan(GEN.indexOf(".qa-opts .to{padding:11px 13px"));
  });
});
