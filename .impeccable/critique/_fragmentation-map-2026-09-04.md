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
