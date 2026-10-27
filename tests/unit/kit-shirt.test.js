import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import KitShirt from "../../src/components/KitShirt.jsx";

/**
 * ⚠️ A SHIRT, NEVER A CREST. Club crests, logos and player photos are
 * trademarks (App Store guideline 5.2.1; Manchester United v Football
 * Manager). KitShirt may draw shapes in a club's colours and print its short
 * name, and nothing else: no image, no text inside the drawing, nothing loaded
 * from anywhere.
 */
const KITS = JSON.parse(readFileSync(fileURLToPath(new URL("../../src/data/gridKits.json", import.meta.url)), "utf8"));
const html = (props) => renderToStaticMarkup(React.createElement(KitShirt, props));
const textOf = (s) => s.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim();

describe("KitShirt", () => {
  it("draws every kit with shapes only, and no words but the short name", () => {
    for (const [club, kit] of Object.entries(KITS)) {
      const out = html({ kit, name: kit.s });
      expect(out, club).not.toMatch(/<(image|img|text|tspan|foreignObject|use|script|pattern)\b/i);
      expect(out, club).not.toMatch(/(xlink:)?href=|https?:|data:|\.png|\.svg|\.jpe?g|\.webp/i);
      // The only url() is the shirt's own clip path, inside the same SVG.
      for (const u of out.match(/url\([^)]*\)/g) || []) expect(u, club).toMatch(/^url\(#kit[\w-]*\)$/);
      expect(textOf(out), club).toBe(kit.s);
      // Its colours, and only its colours plus the outline.
      const fills = new Set((out.match(/fill="([^"]+)"/g) || []).map((f) => f.slice(6, -1).toUpperCase()));
      for (const f of fills) expect([kit.c1.toUpperCase(), kit.c2.toUpperCase(), "NONE"], club).toContain(f);
    }
  });

  it("without a name it is decorative, and an unknown club gets a plain grey shirt", () => {
    const out = html({ kit: KITS["FC Barcelona"] });
    expect(textOf(out)).toBe("");
    expect(out).toMatch(/aria-hidden="true"/);
    expect(html({ kit: undefined, name: "Somewhere" })).toMatch(/#3A4150/);
  });

  it("gives each shirt on a page its own clip path", () => {
    const a = html({ kit: KITS["FC Barcelona"], name: "A" });
    const ids = [...a.matchAll(/clipPath id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(1);
    expect(a).toContain(`url(#${ids[0]})`);
  });
});
