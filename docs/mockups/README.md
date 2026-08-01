# Homepage redesign mockups — "The Scouting Report"

Working files from the 2026-07-31/08-01 redesign session. Self-contained HTML:
open any of them directly in a browser, no server or build needed. Fonts are
embedded as base64 so they render identically anywhere.

## The builds, oldest to newest

| File | What it is |
|---|---|
| `home-final.html` | The last of the OLD dark direction ("Direction E"), kept as an anti-reference. Rejected as looking dated. |
| `scouting-c.html` | The Scouting Report, light newsprint ground. Assessment-first composition. |
| `scouting-d.html` | **Current.** Dark "desk" with the report as an oversized, rotated, lit paper sheet on it. |

## How it was made

Direction was assigned by `concept-seed` (seed key **cf2f8891**, candidate 4 of a
resonance-ordered seven), not chosen by taste. The direction contract lives in
the opening CSS comment of each scouting file — thesis, own-world, story, first
viewport, form, and the finish condition.

`scouting-d.html` is reproducible from `scouting-c.html` by running, in order:

    node patch-bolder.mjs      # dark desk, lit paper sheet
    node patch-reorder.mjs     # Footle above the club index
    node patch-integrate.mjs   # store links folded into the letterhead
    node patch-bugs.mjs        # scroll jump, World Cup IP, self-refuting club bar
    node patch-overdrive.mjs   # break the column, verdict as an event
    node patch-impeccable.mjs  # audit / adapt / optimize / harden pass

Run them from this directory. Each asserts file integrity after writing, because
a bad write silently truncated the file to exactly 131,072 bytes once.

## Impeccable commands applied

`critique` (dual-agent) · `new-work` · `craft-floor` · `bolder` · `overdrive` ·
`typeset` · `layout` · `colorize` · `delight` · `distill` · `audit` · `adapt` ·
`optimize` · `harden`

Still owed at time of writing: `polish`, `clarify`, `onboard`, `animate`,
`document` (DESIGN.md), and the finish review. The playbook is explicit that
"unreviewed and undocumented is unfinished".

Detector gate: `npx impeccable@3.5.0 detect <url>` — **exit 0** on `scouting-d`.

## Known open item

The three Archivo `@font-face` blocks embed **byte-identical** variable-font
payloads (46,589 B each, md5 `1d0a8875…`). Collapsing them to one face with
`font-weight:100 900` was measured to render identically and takes the file
203,240 → 109,796 bytes, gzip 139,473 → 68,508 (−50.9%). Not applied only
because it trips a >150,000-byte integrity assertion that was set arbitrarily.
Worth doing.

## Product record

`PRODUCT.md` at the repo root is the durable product truth these were built
against, including the binding rule that the exact question count never appears
in copy.
