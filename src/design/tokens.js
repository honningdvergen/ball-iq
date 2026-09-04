// The one place a Ball IQ web colour is decided.
//
// WHY THIS FILE EXISTS
// Three surfaces render Ball IQ on the web and, until now, each carried its own
// copy of the palette:
//
//   1. the 191 generated SEO pages  — a :root block inside gen-seo-pages.mjs
//   2. the marketing homepage       — 269 hardcoded hex literals, no variables
//   3. the app                      — src/app.css, a THIRD set of names
//
// They agreed on the values by hand, which is not the same as agreeing. The
// homepage still paints #1A1D27 ten times; app.css:57 records that the app
// moved off that exact colour ("cards -- neutral dark (was #1A1D27 navy)").
// Nobody decided to keep the old navy on the homepage. There was simply no
// mechanism that could notice, because there was nothing to compare.
//
// THE VOCABULARY IS THE GENERATOR'S, DELIBERATELY
// --bg/--card/--bd/--tx/--grn are the names the 191 pages already use. Adopting
// them means the pages that are currently GROWING (every rising page in the
// 2026-08-03 Search Console read was a club page) change by exactly zero bytes,
// while the homepage -- the surface that actually needs the redesign -- is the
// only thing that moves.
//
// ⚠️ DO NOT introduce --s1/--s2/--s3 here. app.css uses those names for
// SURFACES and the approved "Scouting Report" mockup uses --s1..--s6 for a
// SPACING scale. They cannot both be right in one document. Spacing tokens,
// when they arrive, are --sp1..--sp6.
//
// Club identity colours are NOT tokens. They live in CLUB_COLOR
// (MarketingHome.jsx) and CLUB_COLOR (gen-seo-pages.mjs), keyed by slug,
// because Arsenal red is data about Arsenal, not a design decision.

/** Canonical web palette. Keys are the CSS custom-property names, minus `--`. */
export const TOKENS = {
  // ── Surfaces, darkest to lightest ──────────────────────────────────────
  // Lifted 2026-09-04 (Alex on his phone: "it does not hit me as modern…
  // not sure if it is the background colour or what"). The old ground was
  // #0A0A0A with cards at #0F1117 — five points apart, so on an OLED they
  // were one black and every edge had to be drawn as a border, and a page
  // made of outlines reads as a wireframe. Three surfaces are now visibly
  // three steps, and the borders are hairlines one step above their surface
  // rather than the loudest thing on the page. Chosen on an A/B page of the
  // Footle band (A as shipped · B filled tiles · C = B + these surfaces);
  // Alex picked C. Every old value that was inlined anywhere (app.css,
  // App.jsx, index.html, manifest, OG images, the sign-in sheet) moved with
  // it in the same commit, so the app and the site stay one palette.
  bg: '#0B0C10', // page canvas
  bg2: '#0F1116', // raised canvas / alternating bands
  card: '#13151C', // cards
  card2: '#1B1E27', // inset surfaces inside a card

  // ── Borders, weakest to strongest ──────────────────────────────────────
  bd: '#242730',
  bd2: '#2F3240',
  bd3: '#3E4150',

  // ── Action. Green means ACT; a club colour means IDENTITY. ─────────────
  // Key order matters here and nowhere else: it is the emission order of
  // rootCss(), and keeping it identical to the block this replaced makes the
  // 191 generated pages a byte-for-byte no-op. Verified by diffing dist/.
  grn: '#58CC02',
  'grn-ink': '#06230C', // text ON green
  'grn-soft': '#8AE042', // green as a lighter fill / hover

  // ── Status ─────────────────────────────────────────────────────────────
  amber: '#FFC107',
  wrong: '#FF4747',

  // ── Text, brightest to dimmest. --tx4 is the AA floor on --bg. ─────────
  tx: '#F0F1F5',
  tx2: '#E8EAF0',
  tx3: '#9BA0B8',
  tx4: '#7E828C',

  // ── Type ───────────────────────────────────────────────────────────────
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

/**
 * Render TOKENS as a `:root{...}` declaration.
 *
 * Emitted into the 191 static pages at build time by gen-seo-pages.mjs, and
 * written to design/tokens.css for the app entry by gen-design-tokens.mjs, so
 * the two surfaces are the same bytes rather than the same intention.
 */
export function rootCss() {
  const decls = Object.entries(TOKENS)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');
  return `:root{${decls}}`;
}
