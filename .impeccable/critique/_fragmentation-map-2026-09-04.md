# Fragmentation map — balliq.app, 2026-09-04 (pre-synthesis, from source)

Alex's goal 1: "everywhere you can navigate on the website feels like the same website… now it feels
very fragmented and like separate products almost."

| surface | header | styles | palette source |
|---|---|---|---|
| `/` homepage | `SiteHeader.jsx` (React) | `front.css` (235 lines) | inlined hexes |
| 254 static pages (clubs, lists, directory) | `shell.mjs` (static HTML) | `SHELL_CSS` + 381 inline rules in gen-seo-pages | inlined hexes |
| served answer pages | `shell.mjs` | `SHELL_CSS` via answer-shell | inlined hexes |
| the club quiz INSIDE a club page | none — a widget | its own `.bq-*` rules | inlined hexes |
| `/play` (the app) | `SiteHeader.jsx` PLUS the app's own tab bar, greeting, second club finder | `app.css` 3,813 lines, three `:root` blocks | inlined hexes |

- Accent green declared in 19 files; page ground in 14. Surfaces look similar because the same hex was
  typed into each, not because they share anything — so they drift on everything that is not a colour.
- EVERY Play button on `/` (13 of them, Footle and Daily 7 included) is `/play?game=…`. A club page has 9
  links into `/play`. The website is a lobby with one exit and the exit is a different product.
- Two honest directions: render the playable surfaces inside the website's own chrome, or be openly the
  app's front porch and say so at the threshold. Today it is neither.

## Measured 2026-09-05 (pre-synthesis, prod, 375×812)
- **Club page, after answering: `.bq-next` bottom = 1024px on an 812px viewport — 212px below the fold, not
  visible without scrolling.** The 09-03 critique had this at 18px clipped (P1); it has got worse since. On
  the surface with 637 quiz starts/30d. Fix per 09-03: `scrollIntoView` after the reveal, or reserve the
  reveal height. NOT fixed during the critique so the reviewers see the live state.
- Homepage phone menu: burger present; opened-panel selector inconclusive (left to Assessment B). The only
  element spilling off-screen is the visually-hidden skip link — by design, not a defect.
- 09-03's P0 "three visual systems on one domain; traffic lands on the least designed one" is unchanged
  two days later and is Alex's fragmentation complaint verbatim.

## App funnel on `/`, measured 2026-09-05 at 375×812 (prod)
- The ONLY painted store links are two footer text links — "iOS" 22×17px and "Android" 50×17px — at y=5379,
  ~6.6 screens below the fold and far under the 44px tap minimum.
- Two real badges ("Download on the App Store →", "Get it on Google Play →", class `landing-store-badge`)
  are in the DOM at 0×0: rendered by React, styled by nothing that ships on `/`. Dead markup in the funnel.
- B (evidence agent) adds: `/play` at mobile paints zero store links; nearly every store link on every page
  and viewport is below the fold; store URLs use two forms (`/us/app/id…` vs `/app/id…`) for one app.
