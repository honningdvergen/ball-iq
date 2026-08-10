# Icon upgrade — external generation brief

The vector ball + gold "?" foundation is solved (see upgrade-composite.html).
The FIRE is the unsolved part: three in-house attempts (two hand-drawn SVG, one
traced from the current icon) each failed differently — sunflower petals, a
teardrop, paint drips. Flat-vector fire is illustration work; use an image
model.

## Prompt

> iOS app icon, flat vector illustration: a white and black panelled soccer
> ball centred on a solid near-black background (#0A0A0A), wrapped in one bold
> stylised flame whose tongues rise above the ball like a crown, a bold
> golden-orange question mark (#F2A413) centred on the ball overlapping the
> panels, flat poster colours only — three oranges (#FF7A1A, #FFB020,
> #E85D04) — thick clean shapes, crisp vector edges, square 1:1.

**Avoid (negative prompt where supported):** sparks, embers, particles, glow,
bokeh, 3D render, realistic fire, gloss, dark navy, gradients, any text.

## Acceptance tests — judge candidates like this, not at full size

1. Downscale to 64px BEFORE judging. If the fire smears, reject.
2. The ball must read as a football at 44px.
3. Count the oranges: more than ~3 flat values means the model drifted to
   painterly — reject.
4. The "?" must sit ON the ball, not float.

Generate 4+, paste winners back; size-sheet + store export (1024 iOS /
512 Play / Android adaptive layers) happens here.
