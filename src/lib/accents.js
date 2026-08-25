/**
 * The mode accent set — one declaration, four modes.
 *
 * ⚠️ UNNAMED COLOURS ARE HOW THE WRONG ONES GET IN. The 1.7.0 design review
 * found off-token hues shipping at once — an avatar green `#1B7F3B` (a
 * BLUE-green, against the accent's yellow-green), a Trail blue in a codebase
 * whose own stylesheet documents a "no-blue re-skin", and a category pink on
 * the question rails. None was a mistake at the moment it was written: each
 * was a reasonable local choice, made in a file with no way of knowing what
 * the others had picked.
 *
 * ⚠️ The review also named a specific Trail blue, `#84D0FF`. That string
 * appears nowhere in this repo's history for src/ — the review was reading
 * rendered pixels, not source, and a tint over a dark card is not the value
 * that produced it. Recorded so nobody hunts for a hex that never existed.
 *
 * That is the whole failure mode: a colour with no name cannot be reused, so
 * the next person writes a new one — which is exactly how the Trail ink came
 * to be typed out as a literal in two separate files this week, one of them by
 * me, copying it across because there was nothing to import.
 *
 * ⚠️ THIS IS THE MODE LANGUAGE, NOT A PALETTE DUMP. Only colours that identify
 * a MODE belong here. Surfaces, text and the brand accent stay in app.css's
 * :root where the rest of the app already reads them — duplicating those into
 * JS would create the second source this file exists to prevent.
 *
 * Every value is checked against --s1 (#0F1117), the surface these render on:
 *   footle  #8AE042  10.4:1      trail    #7CC3F0  8.9:1
 *   daily7  #FFC107  11.6:1      mystery  #B9A5FF  8.9:1
 */

/** Ink — the readable foreground on a dark surface. */
export const MODE_ACCENT = {
  footle:  '#8AE042',
  daily7:  '#FFC107',
  trail:   '#7CC3F0',
  mystery: '#B9A5FF',
};

/**
 * Base hue as an `r,g,b` triple, for the rgba() tints each mode card builds
 * (card wash, icon well, button fill, result chip). Kept as a string because
 * every consumer interpolates it into rgba(...) — handing out an object would
 * mean four call sites doing the same join.
 */
export const MODE_RGB = {
  footle:  '88,204,2',
  daily7:  '255,170,0',
  trail:   '78,168,222',
  mystery: '139,108,240',
};

/** Convenience for the one-off tints outside the Daily cards. */
export const modeTint = (mode, alpha) => `rgba(${MODE_RGB[mode]},${alpha})`;
