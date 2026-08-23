# Screenshot #1 — corrected, 2026-08-23

## What was wrong

The first screenshot on **both stores** had two mode-grid glyphs bleeding
straight through the tab bar: a flame sitting exactly where the D should be, so
the Daily tab read **"🔥aily"**, plus a slashed circle under the Home icon.

It is the first image on the product page in all 15 localisations — the one
Apple puts on the install sheet — and it has been live since **2026-08-15**.

Confirmed by downloading the live asset from Apple's CDN
(`is1-ssl.mzstatic.com/.../01-home.png/1284x2778bb.png`), not by re-reading the
repo copy. The same defect was in the Play phone set.

## Root cause — not a design problem, and not animations

`.tab-bar` (src/app.css:935) is `rgba(32,35,44,0.34)` — only 34% opaque — with
`backdrop-filter: blur(42px) saturate(200%) brightness(1.35)` doing all the
visual work.

**Chromium's screenshot path supports `backdrop-filter` but does not composite
it.** So the capture kept the 34% tint and dropped the blur, leaving whatever
sat behind the bar plainly visible.

The `@supports not ((backdrop-filter: blur(1px)) or ...)` fallback in app.css
could never have saved this: it tests **support**, not **effect**. Headless
Chrome reports support, so the opaque fallback never fired.

⚠️ The app itself is fine. Real iOS and Android WebViews composite the filter
correctly — this only ever affected captures.

## The fix

`scripts/shoot-store-screens.mjs` now calls `forceOpaqueMaterials(p)` before
every capture: it walks the DOM for any element with a live `backdrop-filter`
and a sub-0.99 alpha background, forces the background fully opaque and
disables the filter for that frame. It **returns the list it fixed**, so a new
translucent surface is reported rather than silently papered over.

On the re-shoot it caught **two**, not one: `.tab-bar` and `.landing-nav`.

Also fixed in the same pass: the capture seeds `biq_consent_analytics` so the
EEA consent banner cannot mount. The first re-shoot after the banner shipped
captured "Decline / Allow" across the bottom of the frame, hiding the tab bar
completely — these are shot on a machine in Norway.

## Why no check caught it

The existing verification asserted **which screen** was captured
(`txt.includes(s.expect)`), never what it looked like. It passed on a visibly
broken asset for eight days.

`LISTING.md` §6 had already written the lesson down for a different shot —
*"Caught by opening the PNG, not by the test"* — and it never generalised into
code. Now it has.

## What to upload

| File | Where | Needs a release? |
|---|---|---|
| `play-phone/01-home.png` (1080×1920) | Play Console → Store listing → Phone screenshots, **slot 1** | **No** — Play takes listing edits live, independently of any release |
| `apple-6.9/01-home.png` (1284×2778) | App Store Connect → 6.9" screenshots, **slot 1** | **Yes** — iOS screenshots can only change with a version submission, so carry this into the next upload |

Play is therefore fixable **today**, and iOS is free to fix whenever the next
build goes up — no extra cost either way.

⚠️ Order matters on both stores. This replaces slot 1 only; the other seven are
unchanged and still correct.
