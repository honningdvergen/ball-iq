// The Scouting Report layer — the marketing homepage only.
//
// WHY THIS IS A SEPARATE FILE FROM tokens.js
// tokens.js is inlined into all 191 generated pages. Those pages are the part
// of the site that is currently growing and the decision (2026-08-03) was to
// hold them. Nothing in here is theirs, so nothing in here should cost them
// bytes. This layer loads with the marketing chunk and nowhere else.
//
// THE FINDING THAT SHAPED THIS FILE
// The approved direction (docs/mockups/scouting-d.html, seed cf2f8891) is not
// a second design system. It is TWO LAYERS, and one of them is already ours:
//
//   THE DESK — page canvas, rules, chrome. Measured against the existing dark
//   ramp, it is the same palette with a green cast instead of a blue one:
//     --desk     #0E1110  vs  --bg     #0A0A0A   RGB distance 10
//     --desk2    #161A17  vs  --card2  #14161E   distance  8
//     --deskline #252B26  vs  --bd     #242836   distance 16
//     --onDeskHi #F2F5F1  vs  --tx     #F0F1F5   distance  6
//   So the desk is NOT redefined here. It reuses the shared tokens, which is
//   the entire reason the homepage and the SEO pages can stay consistent.
//   Only --on-desk is genuinely new: #C3CBC3 is a brighter body text than
//   --tx3 (distance 60), and the direction depends on that lift.
//
//   THE PAPER — the report itself. Newsprint at 15.5:1 against the desk. That
//   is the concept, not a clash: a lit document lying on a dark surface. It is
//   a COMPONENT, so it never propagates to a page theme.
//
// THE ONE RULE THAT DID NOT RECONCILE, AND HOW IT WAS SETTLED
// The contract says "Action is ink, never a fourth colour". Ball IQ says green
// means act. Alex's call (2026-08-03): ink on the paper, green on the desk.
// So a button ON the report is --ink at 14.7:1 (green on newsprint would read
// worse, not better), while the desk chrome keeps --grn and the brand cue.
// Do not "helpfully" reintroduce green inside the paper.
//
// ⚠️ SPACING IS --sp*, NEVER --s*. app.css uses --s1/--s2/--s3 for SURFACES;
// the mockup used --s1..--s6 for SPACING. Both cannot be right in one
// document, and the app's meaning is older and load-bearing.

/** Scouting Report tokens. Marketing homepage only. */
export const REPORT = {
  // ── The desk. Everything else is inherited from tokens.js. ─────────────
  'on-desk': '#C3CBC3', // body text on the desk — brighter than --tx3, on purpose
  // Secondary text on the desk. DESIGN.md "Desk Text — Mute": nav links,
  // captions, and specifically "the club index's competition column".
  // Measured 7.44:1 on --bg, 7.26:1 on --bg2 — comfortably AA as text on
  // either desk ground. (A first draft of this comment said 4.62:1, a number
  // that was never computed. Measure before writing the number down.)
  'on-desk-mut': '#98A199',

  // ── The paper: a light document, lightest to most shadowed. ────────────
  pa: '#E7E9E4', // newsprint
  pa2: '#DEE1DB',
  pa3: '#D5D8D2',

  // ── Ink. Also the action colour ON the paper — see the note above. ─────
  ink: '#14171A',
  mut: '#4A524C', // secondary text on paper

  // ── Hairline rules. The direction has no cards, so rules do that work. ─
  rule: '#B9BFB6',
  rule2: '#7A8078',
  rule2d: '#6E776F',

  // ── Saturation. The only colour on the page besides ink and paper.
  //
  // ⚠️ CORRECTED. The mockup declares TWO ramps, and an earlier pass here kept
  // the wrong one. Counting actual references settles it:
  //     --v0..--v5   1 reference each -- their own declaration. Never consumed.
  //     --r1 5 uses, --r3 5 uses, --r5 10 uses -- this is what the page paints.
  // I had reasoned from the names that --v* was canonical and dropped --r3
  // (#C9992B) as redundant. It is not redundant; it is the only mid-tone the
  // design actually renders, and --v2 (#7E6318) is far too dark to stand in.
  //
  // They are not duplicates -- they QUANTISE DIFFERENTLY, which is the real
  // reason both exist and why DESIGN.md read them as "two ramps sharing one
  // name". The attribute bars are three-level (poor / average / good). A
  // verdict over five questions has SIX outcomes. Keeping both is correct;
  // giving them the same name was not.
  //
  // The endpoints are shared, so only the attribute mid-tone is extra.
  'attr-mid': '#C9992B', // the 3-level bars' middle; their ends are --v0 / --v5

  // The six-step verdict band: one stop per possible score, 0 through 5.
  v0: '#8B2635', // oxblood — worst
  v1: '#94472A',
  v2: '#7E6318',
  v3: '#5F6A22',
  v4: '#46702E',
  v5: '#2F6B3A', // green — best

  // ── Spacing. --sp*, not --s*. See the warning above. ───────────────────
  sp1: '8px',
  sp2: '14px',
  sp3: '22px',
  sp4: '34px',
  sp5: '52px',
  sp6: '76px',

  // ── Motion. One easing, no bounce: a bounce on a verdict landing was the
  // exact tell this direction was built to avoid. ────────────────────────
  ease: 'cubic-bezier(.16,1,.3,1)',

  // ── Elevation. The sheet's lift off the desk. Tokenised because the
  // detector correctly flagged a bare rgba(0,0,0,.55) as palette drift.
  'sheet-shadow': '0 18px 50px rgba(0,0,0,.55)',

  // ── TYPE RAMP — transcribed from DESIGN.md, which documents this exact
  // direction. Every size here was already decided; inventing 21/24/19/16/64/
  // 30px instead was drift, and the impeccable detector flagged all ten.
  //
  // Each role is a `font` shorthand plus its tracking, because letter-spacing
  // cannot ride in the shorthand. Use as:  font:var(--ty-headline);
  //                                        letter-spacing:var(--ty-headline-ls);
  //
  // ⚠️ The tracking is not decoration. The headline is specified at -0.02em,
  // and writing +0.005em instead made "ONE HONEST VERDICT." overflow 375px and
  // wrap to three lines — against a contract that calls for two. The fix
  // looked like "shrink the headline to 34px". The actual fault was ignoring
  // the documented tracking.
  // ⚠️ DELIBERATE EXTENSION of the DESIGN.md ramp, not drift. DESIGN.md sets
  // the headline floor at 41px. Measured at 375px: "ONE HONEST VERDICT."
  // needs 385px at 41px, against 331px of available width, so it wraps to a
  // THIRD line — and the direction contract specifies a two-line headline in
  // the first viewport. The largest size that holds it on one line is 35px.
  //
  // The floor is 35px for that reason and no other. An earlier comment here
  // claimed the -0.02em tracking would recover the width; that was asserted
  // without measuring and is false — the tracking is worth about 6px, not the
  // 54px needed. Above 530px the documented 6.6vw takes over and the ramp is
  // unchanged, so this only ever applies to phones.
  'ty-headline': "700 clamp(35px,6.6vw,88px)/0.95 'Archivo Narrow',sans-serif",
  'ty-headline-ls': '-0.02em',
  'ty-section': "700 clamp(32px,5.2vw,60px)/0.98 'Archivo Narrow',sans-serif",
  'ty-section-ls': '-0.018em',
  'ty-verdict-num': "700 clamp(102px,13.4vw,176px)/0.74 'Archivo Narrow',sans-serif",
  'ty-verdict-num-ls': '-0.035em',
  'ty-verdict-tier': "700 clamp(34px,5.4vw,66px)/0.94 'Archivo Narrow',sans-serif",
  'ty-verdict-tier-ls': '-0.008em',
  'ty-lede': '400 20px/1.55 Archivo,system-ui,sans-serif',
  'ty-sub': '400 18px/1.62 Archivo,system-ui,sans-serif',
  'ty-body': '400 17px/1.55 Archivo,system-ui,sans-serif',
  'ty-sec': '400 15px/1.4 Archivo,system-ui,sans-serif',
  'ty-meta': '400 13.5px/1.4 Archivo,system-ui,sans-serif',
  'ty-label': '700 12px/1.4 Archivo,system-ui,sans-serif',
  'ty-label-ls': '0.13em',
};

/** Render REPORT as a `:root{...}` declaration. */
export function reportCss() {
  return `:root{${Object.entries(REPORT).map(([k, v]) => `--${k}:${v}`).join(';')}}`;
}
