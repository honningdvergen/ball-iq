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

Note that this chain rebuilds the file only as far as `patch-impeccable`. The
later commands in the list below (`document`, `clarify`, `onboard`, `animate`,
`polish`, and the bug fixes at `db73078` / `1286d27`) were applied directly to
`scouting-d.html` and are not in any patch script, so re-running the chain will
*not* reproduce the current file. Git history is the record from there on.

## Impeccable commands applied

`critique` (dual-agent) · `new-work` · `craft-floor` · `bolder` · `overdrive` ·
`typeset` · `layout` · `colorize` · `delight` · `distill` · `audit` · `adapt` ·
`optimize` · `harden` · `document` (DESIGN.md) · `clarify` · `onboard` ·
`animate` · `polish`

Still owed: the finish review. The playbook is explicit that "unreviewed and
undocumented is unfinished".

Detector gate: `npx impeccable@3.5.0 detect <url>` — **exit 0** on `scouting-d`.

## Resolved: the triplicated font payload

**Applied in the `polish` pass.** The three Archivo `@font-face` blocks embedded
byte-identical copies of the same variable payload (34,940 B decoded, md5
`92895aba…`). They are now one declaration at `font-weight:100 900`:

| | before | after |
|---|---|---|
| raw | 214,713 B | 121,269 B (−43.5%) |
| gzip | 143,615 B | 72,762 B (−49.3%) |

Rendering was verified by measuring a fixed string at 100px before and after.
The three declared weights are reproduced **exactly** — 400 → 5408.91px,
600 → 5557.80px, 800 → 5973.66px, identical to two decimals — and total
document height was unchanged at 2888px.

One correction to the earlier note, which claimed the collapse renders
identically full stop: it does not, and the difference is an improvement. With
only three pinned faces, CSS font-matching snapped `font-weight:500` down to the
400 face and `font-weight:700` up to the 800 face. Both are real call-sites —
`.opt` is 500, and the shared uppercase micro-label rule is 700 — so those were
rendering at weights nobody wrote. They now resolve to true 500 and 700
(`.opt` +1.35px, `.clab` −2.72px; no reflow, no line-break changes).

The `>150,000`-byte integrity assertion the old note was blocked on has been
retired. The assertions to run after any write to `scouting-d.html` are now:

    wc -c > 100000 · ends with </script> · @font-face ×2
    · contains class="mast" · ftlGrid · starts with <!doctype

## Product record

`PRODUCT.md` at the repo root is the durable product truth these were built
against, including the binding rule that the exact question count never appears
in copy.
