# Handoff: Ball IQ — Marketing Website (“Matchday”) + In-Browser Play Experience

## Overview
This package contains the redesign of the **Ball IQ** marketing website and its **“Play in browser” experience**. Ball IQ is a football-trivia app (iOS + web; React + Vite + Supabase). The goal of the redesign is a premium, dark, energetic marketing site that drives **App Store installs** and **“play now in browser”**, plus a cohesive web game (Footle + quiz modes) that the browser CTA leads to.

Two deliverables:
1. **Marketing homepage** — the **“Matchday”** direction (bold/energetic). This is the chosen direction.
2. **Play experience** (`Play.dc.html`) — the in-browser game: a web dashboard → **Footle** (Wordle for footballers) and quiz modes → results, with guest-mode and ad/monetization mockups.

## About the design files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look and behavior. They are **not** production code to copy verbatim. They’re authored in a small streaming-component format (`*.dc.html`: HTML markup with inline styles + a `Component` logic class; `{{ }}` are data bindings). **Read them for layout, exact styles, copy, and behavior**, then **recreate the designs in the Ball IQ codebase** using its existing React patterns, component library, and conventions. The inline styles are deliberately verbatim so exact values (hex, px, easing) are easy to lift.

> The marketing site is a **separate surface** from the app. If it doesn’t exist yet, a static React/Vite (or Next.js) site is appropriate. The Play experience should reuse the app’s real components/state where possible — the HTML here is the visual/UX spec, not the data layer.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, shadows, copy, and interactions are all intended as shown. Recreate pixel-faithfully using the codebase’s libraries. Where a real data source exists (live player counts, real Footle word of the day, real questions, auth), wire it up — the prototype uses representative placeholder data.

---

## Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| Brand green | `#58CC02` | Primary CTAs, correct state, logo accent, progress |
| Green (rim/hover ref) | `#46A302` / `#4CAE02` | (legacy 3D rim — **not used**, see Buttons) |
| Green soft | `#22c55e` | Gradient pair for progress bar |
| Amber | `#FFC107` | “IQ” wordmark, hero accent word, Footle “present” tiles, streak |
| Flame | `#FF6A00` | Daily gradient, glows, ticker bullets, streak |
| Navy ink | `#0C0E13` | Ticker / deepest panels |
| bg-0 | `#0A0A0A` | Page background |
| bg-1 | `#0F1117` | App canvas / inputs |
| card | `#14161E` | Cards/tiles (primary card surface used throughout) |
| card-alt | `#101218` | Recessed tiles, muted answer rows |
| bg-3 | `#1A1D27` | Hairline dividers reference |
| bg-4 | `#242836` | Card borders / elevated |
| Hairline (dark) | `#16181F` | Nav border, footer border |
| Border subtle | `#2A2D3A` | Default card border |
| Border medium | `#3A3D4A` | Hover border |
| Border strong | `#4A4D5A` | Footle filled-tile border |
| fg-1 | `#FFFFFF` | Headings |
| fg-2 | `#F0F1F5` | Body on dark |
| fg-3 | `#9BA0B8` | Muted / subtitle |
| fg-4 | `#6E7180` | Faint labels |
| fg-5 | `#3C3F4C` | Faintest (ad “Advertisement” label) |
| wrong | `#FF3B30` | Incorrect state |
| streak / flame text | `#FF8A3D` | Streak number |

Accent text helpers used: success text `#8AE042` / `#9BE25C`; wrong text `#FF8A82`; amber text `#FFD24A`; flame text `#FF9245`.

### Typography
- **Inter** (400, 500, 600, 700, 800, 900) — everything.
- **JetBrains Mono** (400, 500, 700) — numbers, tickers, timers, question counters, Footle countdown, score/stat readouts. Always `font-variant-numeric: tabular-nums` on changing numbers.
- Load both from Google Fonts.
- Display/headings are heavy and tracking-tight: H1 hero `clamp(44px, 8vw, 86px)`, weight **900**, `letter-spacing:-0.035em`, `line-height:0.98`. Section H2 `clamp(30px, 4.4vw, 46px)`, weight 800, `letter-spacing:-0.03em`. Feature H2 `clamp(30px, 4vw, 42px)` weight 800. Body 15–19px, `line-height:1.55–1.65`, color `#9BA0B8`. Eyebrows: 11–12px, weight 800, `letter-spacing:0.14em`, uppercase.

### Spacing
4px base; scale used: 4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 30, 32, 40, 56, 72, 80, 90, 96. Section vertical rhythm ~80–96px on the marketing site; card interiors 18–30px.

### Radius
Buttons/inputs `12px`; cards/tiles `14–18px`; hero/feature cards & modals `20–28px`; pills/avatars `999px`; Footle tiles `10px`.

### Shadow & glow
- Card: `0 4px 16px rgba(0,0,0,0.35)`.
- Pop/modal: `0 30px 60px -20px rgba(0,0,0,0.85)`.
- **Green CTA glow** (signature): `0 8px 22px -6px rgba(88,204,2,0.6), inset 0 1px 0 rgba(255,255,255,0.25)`; hover `0 14px 30px -6px rgba(88,204,2,0.72)`.
- Radial accent glows behind imagery: e.g. `radial-gradient(circle, rgba(255,106,0,0.26) 0%, rgba(255,106,0,0.10) 36%, transparent 64%)` (flame), and green/amber equivalents at lower alpha.

### Buttons (important — design decision)
The brand’s old “Duolingo 3D” buttons (hard offset rim `box-shadow:0 5px 0 #46A302`, press = translateY) were **replaced** with a **modern flat** treatment per stakeholder feedback. Primary CTA:
```
background:#58CC02; color:#0A0A0A; font-weight:800; border-radius:12px;
box-shadow:0 8px 22px -6px rgba(88,204,2,0.6), inset 0 1px 0 rgba(255,255,255,0.25);
transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, filter .15s;
:hover { transform:translateY(-2px); box-shadow:0 14px 30px -6px rgba(88,204,2,0.72); filter:brightness(1.04); }
```
Secondary/dark button: `background:#14161E; color:#fff; border:1px solid #242836;` → hover `background:#1B1E27; border-color:#3A3D4A;`. App Store badge: black `#000`, 1px `#2A2D3A` border, Apple glyph + two-line “Download on the / App Store”.

### Motion
- **Scroll reveals** use CSS scroll-driven animations: `animation: revealIn .85s cubic-bezier(.16,1,.3,1) both; animation-timeline: view(); animation-range: entry 0% cover 22%;` with `@keyframes revealIn { from{opacity:0; transform:translateY(30px)} to{opacity:1; transform:none} }`. In your React app, an IntersectionObserver-based reveal is the robust equivalent (and what I’d ship).
- Ambient: phones float (`@keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-13px)} }`, 6–7s), hero glow pulses opacity, ticker marquees, hero accent word has a subtle gradient shimmer. All decorative; respect `prefers-reduced-motion`.
- Hover: cards lift `translateY(-4px)` + border brightens; buttons lift + brighten. Transitions 150–220ms with overshoot `cubic-bezier(0.34,1.56,0.64,1)`.

---

## Marketing homepage — “Matchday”  (file: `Ball IQ Website.dc.html`, the `isA` block)

> ⚠️ `Ball IQ Website.dc.html` contains **three** explored directions (Matchday / Editorial / Arcade) behind a bottom “Style” switcher. **Implement only Matchday** — the default view (`dir===0`, the `<sc-if value="{{ isA }}">` block). The Editorial/Arcade blocks and the fixed switcher dock are exploration artifacts; ignore them.

Page background `#0A0A0A`, `overflow-x:hidden`, Inter. Sections top→bottom:

1. **Sticky nav** — `position:sticky; top:0`, `background:rgba(10,10,10,0.82)` + `backdrop-filter:blur(14px)`, border-bottom `1px #16181F`, padding `15px 28px`. Left: ball logo (32px, radius 8) + “Ball IQ” (Ball `#fff`, IQ `#FFC107`, weight 900, 20px). Right: `Features` / `Modes` / `FAQ` anchor links (`#9BA0B8`, 14px/600, hover `#fff`) → in-page `#features` / `#modes` / `#faq`; green **“Get the app”** button → App Store.

2. **Hero** — centered, `max-width:1200px`, padding `96px 24px 40px`, `overflow:hidden`. Behind: a large flame radial-glow (pulsing opacity), `z-index:0`, centered on the phone cluster. Content `z-index:2`:
   - Eyebrow pill: `🔥 The ultimate football quiz` (border `#2A2D3A`, bg `rgba(26,29,39,0.6)`, 12.5px/700, uppercase, `#9BA0B8`).
   - **H1**: “Prove you know **football.**” — “football.” is `#FFC107` with `text-shadow:0 0 38px rgba(255,106,0,0.5)` (warm glow). *(Do NOT use `background-clip:text` gradient — it renders as a solid block in some capture/SSR contexts; solid amber + glow is intentional.)*
   - Sub (`#9BA0B8`, `clamp(16px,2vw,19px)`): “4,000+ questions across 10 game modes. Play the daily, climb the ranks, or take on up to 8 players — live.”
   - CTA row: App Store badge (black) + **“Play free in browser →”** (green flat CTA) → links to the Play experience.
   - **Phone cluster** below: three iPhone mockups, slightly overlapped, center one larger/raised, sides rotated ±7°, each floating. Screens: `Footle`, `Home`, `Profile` (see Assets). Device frame = `Phone.dc.html` (titanium gradient bezel, Dynamic Island, side buttons).

3. **Ticker** — full-bleed strip, bg `#0C0E13`, hairline top/bottom `#16181F`, JetBrains Mono 13px uppercase `#6E7180`, marquee scroll (`@keyframes marquee { to { transform:translateX(-50%) } }`, ~34s linear, content duplicated for seamless loop). Items separated by flame `✦`: `4,000+ Questions · 10 Game modes · Daily 7 · Footle · Up to 8 online · Survival · Hot Streak · Legends`.

4. **Features** (`#features`) — `max-width:1140px`, three rows, alternating image/text (`flex-wrap:wrap` / `wrap-reverse`), gap 48px, each row `~96px` vertical, each reveals on scroll. Text column: colored eyebrow, **H2** (two lines), body (`#9BA0B8`, 17px, max ~46ch), 2–3 pill chips. Image column: phone mockup(s) with a soft radial glow behind, floating.
   - **F1 — eyebrow `A NEW FIX, DAILY` (`#FF6A00`)** · H2 “A new challenge, / every single day.” · body about Footle + Daily 7 + streaks · chips “⚽ Footle”, “📋 Daily 7”, “🔥 Streaks” · phone: **Footle**.
   - **F2 — eyebrow `MULTIPLAYER` (`#58CC02`)** · H2 “Race real players, / in real time.” · body about online (up to 8) / local, live scores, podium · chips “🌐 Online · up to 8”, “👥 Local 1v1” · phones: **Multiplayer (live)** + **Podium**.
   - **F3 — eyebrow `YOUR PROFILE` (`#FFC107`)** · H2 “Your football brain, / rated out of 99.” · body about the FIFA-style card, league ratings, scouting report, shareable · chips “⭐ OVERALL rating”, “🔍 Scouting report” · phone: **Profile card**.

5. **Game modes** (`#modes`) — centered eyebrow `10 GAME MODES` + H2 “Pick your battle.”; grid `repeat(auto-fit, minmax(230px,1fr))`, gap 14px, 8 tiles. Tile: bg `#14161E`, border `#242836`, radius 18, padding 22; icon in 46px tinted rounded square (emoji), title (18px/800 `#fff`), sub (14px `#9BA0B8`); hover `translateY(-4px)` + border `#3A3D4A`. Tiles + subs: **Daily 7** “Seven questions, ~3 min.” · **Footle** “Guess the surname in six.” · **Online** “Up to 8 players, live.” · **Classic** “10 questions, 20s each.” · **Survival** “One wrong answer ends it.” · **Hot Streak** “60-second sprint.” · **Legends** “Pre-2000 greats.” · **Local** “Pass & play on one device.”

6. **Daily band** — `max-width:1140px`, full-width card, radius 28, padding `clamp(32px,5vw,56px)`, `background:linear-gradient(120deg,#FF6A00,#FFC107)`, giant faded 🔥 bottom-right. Dark eyebrow `DAILY 7`, headline “Seven questions. Three minutes. Everyone plays the same set.” (900, `#0A0A0A`), dark CTA **“Play today’s set →”** → Play experience.

7. **FAQ** (`#faq`) — `max-width:760px`, centered eyebrow `FAQ` + H2 “Good to know.”; accordion of 5 items (single-open). Each: full-width button row (question 18px/700 `#fff` + a `+` chevron that rotates 45° → `×` and turns green `#58CC02` when open), collapsible body (`max-height` + opacity transition) with answer (`#9BA0B8`, 15.5px). Items: *Is Ball IQ free?* · *Do I need an account?* · *What’s Footle?* · *Can I play with friends?* · *Where can I play?* (answers in the file).

8. **Footer** — bg `#0C0E13`, border-top `#16181F`. Left: logo + tagline “The ultimate football quiz. 4,000+ questions across 10 game modes — test your knowledge solo, with friends, or against up to 8 players online.” + small App Store badge. Right: **Quizzes** column (Football quizzes / World Cup quiz / Premier League quiz / Champions League quiz) + **Company** column (About / Contact / Privacy). Bottom bar: “© 2026 Ball IQ. The ultimate football quiz.”

**External links:** App Store → `https://apps.apple.com/no/app/ball-iq-football-trivia/id6775975961`. “Play in browser” CTAs → the Play experience route. Footer quiz links currently point to `https://balliq.app/` — wire to real routes.

---

## In-browser Play experience  (file: `Play.dc.html`)

A **web dashboard** (centered, full-width nav, NOT a phone column). Page bg `#0A0A0A` with fixed flame (top) + green (bottom) radial ambient glows. State machine: `screen ∈ {home, footle, quiz, results}` plus an ad overlay.

**Nav** (sticky): logo + “Ball IQ”; right = **“Sign in”** (secondary outline button — placeholder for real auth) + “← Back to site”.

### Home  (`max-width:1140px`)
- Greeting “Good evening, **Guest**” (`clamp(22px,3vw,30px)`/800; “Guest” in `#9BA0B8`).
- **Guest card** (replaces stats — a logged-out guest has no IQ/rank): subtle flame→green gradient bg, border `#242836`, radius 18. “🔒 GUEST MODE” (flame), “Your stats aren’t being saved”, body “IQ rating, day streak and global rank live in your account. Get the app to track your progress and climb the leaderboard.”, green **“Get the app →”** CTA. *(For logged-in users, swap this for a real stats strip: IQ score / Day streak / Global rank / Accuracy as 4 mono-number cards — that variant exists in git history of the prototype; here it’s intentionally guest-only.)*
- **Hero row** (`flex-wrap`): **Footle** primary card (`flex:1.5`, dark `#101218`, green radial glow, eyebrow “⚽ DAILY · FOOTLE”, “Today’s Footle”, body, a 6-tile **FOOTLE** teaser in green/amber/gray, green **“Play Footle →”** + mono “New word in 10:14:59”) **+** **Daily 7** card (`flex:1`, flame→amber gradient, “Today’s seven”, dark **“Play the seven →”**).
- **Game modes** heading + grid (`repeat(auto-fit, minmax(240px,1fr))`): Classic, Survival, Hot Streak, Legends, **Online** (green-accented border), **Local**. Each starts a quiz round (Online/Local/Daily reuse the quiz engine with that label).

### Footle  (`max-width:600px`, centered)
Wordle for footballers. Header: back ←, “⚽ Footle / Player or manager — guess the surname”, mono “NEXT 10:14:59”. **“💡 Reveal a letter ▶ AD”** rewarded button + revealed-hint chip. **Board**: 6 rows × `answer.length` cols, tiles 38–52px (`clamp`), radius 10. Tile states: **correct** `#58CC02` (bg+border, `#0A0A0A` text), **present** `#FFC107`, **absent** `#242836` (`#8A8F9E` text), **filled** `#14161E`+`#4A4D5A` border, **empty** `#101218`+`#242836` border. **On-screen QWERTY keyboard** (keys recolor by best-known state; Enter + ⌫ wider) — also accepts physical keyboard (A–Z, Enter, Backspace). Win/lose banner (“⚽ Brilliant!” / “Out of guesses”, “The answer was …”, **“Play another →”** which triggers an interstitial ad). Evaluation is standard two-pass Wordle (greens first, then yellows by remaining letter counts).

### Quiz  (`max-width:680px`, centered)
Header: close ✕ → home, green **progress bar**, mono **timer** (`{secs}s`, amber → `#FF3B30` ≤5s). Mono counter “Q 01 / 08 · {mode}”, question (`clamp(22px,3vw,28px)`/800), answers as a `repeat(auto-fit, minmax(260px,1fr))` grid (2-up on web) — each a row with a letter badge (A–D), label, and ✓/✗ on reveal. On answer/timeout: feedback block (Correct/Wrong/Time-up pill + detail) + green **Next question / See results**. Scoring `+10 + secondsRemaining` per correct; streak; best run. 8 questions (Daily 7 uses 7).

### Results  (`max-width:560px`, centered)
Mono “{mode} · complete”, grade emoji + grade (“Class of the season” / “Top of the table” / “Mid-table” / “Back to training” by accuracy), score card (big mono score `#58CC02`, then Accuracy / Correct / Best run), **Play again** (triggers interstitial ad) + **Back to home**, a **post-game app nudge** card (“Save this score → Get the app”), and a labeled **ad slot** (“Advertisement · Responsive banner”).

### Monetization mockups (placeholders — clearly labeled)
- **Anchor banner**: fixed bottom, dashed “Advertisement · 728×90 anchor” on the Footle/quiz screens. Game containers carry extra `padding-bottom:110px` to clear it.
- **Ad overlay** (`adOpen`): full-screen scrim + 16:10 “Your ad plays here” card with “Ad” chip and a ✕. Two kinds — **rewarded** (“Watch to earn your hint” → after a 5s countdown, **“Claim reward”** reveals a Footle letter; ✕ forfeits) and **interstitial** (“Quick ad break” → **“Continue →”** before a replay). Recommendation captured in the build: keep the **marketing site ad-free**; monetize the **free web game** with rewarded video + a between-games interstitial + an anchor banner, and funnel to the app / a future “Ball IQ Pro”.

---

## State management (Play experience)
React-class-style component. Key state: `screen`; quiz: `mode, qIndex, qTotal, picked, answered, score, streak, bestStreak, correct, timeLeft, lastGain`; Footle: `fIdx, fAnswer, fGuesses[], fCurrent, fStatus('playing'|'won'|'lost'), fHint`; ads: `ad { kind, secs, done }`. Timers via `setInterval` (quiz 1s tick; ad 5s countdown) — clear on unmount / screen change. Physical-keyboard listener active only on the Footle screen while playing. In production, replace placeholder questions/words/stats with real data and wire `Sign in` to Supabase auth.

## Assets
Located in `assets/` and `uploads/` of this bundle:
- `assets/ball.png` — the flaming-ball logo (app icon). Used in nav/footer (28–32px, radius ~8) and as the brand mark.
- `uploads/balliq-screenshot-00-home.png`, `-01-multiplayer-live.png`, `-02-profile-card.png`, `-03-multiplayer-podium.png`, `-04-footle.png` — **real app screen captures** (1284×2778) shown inside the device mockups on the marketing site. In production, use current real screenshots (export fresh ones from the app). The device frame itself is CSS (`Phone.dc.html`), not an image.
- Emoji are used as mode/feature icons (⚽ 🔥 ⚡ 🎯 🏆 📋 🌐 👥 ⏱️ 📅). The brand uses emoji intentionally; if you prefer SVG icons, Lucide matches the weight.

## Files in this bundle
- `Ball IQ Website.dc.html` — marketing site; implement the **Matchday** (`isA`) block only.
- `Play.dc.html` — the in-browser play experience (home / Footle / quiz / results / ads).
- `Phone.dc.html` — the CSS iPhone device frame (bezel + Dynamic Island) used by the mockups.
- `assets/ball.png`, `uploads/balliq-screenshot-0*.png` — image assets referenced above.
- `screenshots/` — annotated reference captures of the final designs: `01–04-matchday.png` (homepage hero, features, modes grid, FAQ) and `01–03-play.png` (Play home/guest dashboard, Footle with colored tiles + keyboard + anchor ad, results). Use these to match the intended look; the `.dc.html` files remain the source of exact values.

> Tip: open the `.dc.html` files in a text editor and read the inline `style="…"` values directly — they’re the spec. The `{{ token }}` bindings map to the state/props described above.
