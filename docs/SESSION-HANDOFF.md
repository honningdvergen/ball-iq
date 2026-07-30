# Session handoff — 2026-07-30

**Read this, then `docs/TODO.md`.** Memory loads automatically and carries the
durable stuff (product decisions, traps, numbers); this file carries the things
memory can't: what happened today, why, and what is mid-flight.

Delete this file once it's absorbed.

---

## 0. Orient before you act

Open at the repo **root** (`/Users/alexanderbrynolsen/ball-iq`), not `/src` —
MCP servers are keyed to the exact cwd.

Three rules that cost real hours today and yesterday:

1. **`git rev-parse --abbrev-ref HEAD` before any bank or build work.** A clean
   `git status` tells you nothing about *which* branch you're clean on. Being on
   `desktop-web-refresh` (378 behind main) produced a failed iPhone build, a
   phantom bug, and a detector run over a half-size bank.
2. **Never claim state you haven't verified.** Prod status is not knowable from
   the repo. Verify a live page by its static `<title>`, never HTTP 200 — the SPA
   catch-all answers 200 for any path.
3. **Execute, don't reason, when a check is cheap.** Every genuine defect found
   today came from running something: calling `report_question()` against prod,
   diffing DEX bundles, decoding HTML entities before measuring, fetching five
   directories instead of trusting memory.

---

## 1. What shipped today (all on main, all live)

| commit | what, and why it mattered |
|---|---|
| `ac0f869` | **The question-report loop had NEVER delivered a single report** in the app's entire life — `public.question_reports` held zero rows. Two faults: an invisible 12px button, and `supabase.rpc()` resolving with `{data,error}` instead of throwing, so the wrapping try/catch never ran and users were thanked for reports that never landed. |
| `845b186` | Report path extended to results screen, Footle, Trail and MP. |
| `f940ff9` | Same swallowed-error shape fixed in `register_device_token`. |
| `5cb8655` | **Hajduk Split** — 15 verified questions, 72nd club page. Croatia got its own league section. |
| `03f469f` | **Hub title stopped splitting "football quiz."** It read `Football (Soccer) Quiz`; the parenthetical broke the exact phrase on the ONE page targeting our best term — and it was there for a US-localisation thesis we later disproved. Description 187 → 153 (it was truncating). |
| `68ec74c` | **Android R8 enabled.** AAB 7.63 → 6.50 MB (−14.8%). |
| `ccdb960` | **Site-wide SERP sweep**: 31 truncated titles → 0, 46 descriptions → 0, across 190 pages. |
| `1e531b3` | **Build gate** so truncation can't return a third time. |
| `4d7c25a` | **Trail wave M**: 38 → 44 careers; found and fixed a real bug (schedule min-gap was 1 day). |
| `53891cb` + docs | Backlink pack, handoff, TODO. |

Also today: MP card dead click, persistent iOS zoom (WKWebView never restores
scale on blur), club picker search over 72 packs, PRL → EPL, Dinamo Zagreb's
Trail colour, a rewritten Bundesliga question.

---

## 2. Blocking on Alex — in priority order

1. **Device-test the R8 Android build** before uploading
   `~/Downloads/balliq-1.4.1-vc10-r8.aab`. R8 breakage is **runtime-only and
   silent** — a green build proves nothing, because Capacitor registers all 17
   plugins by reflection. Exercise: push permission + token, share sheet, splash
   dismiss, Apple sign-in, in-app review, haptics, keyboard. The pre-R8 7.63 MB
   bundle is still in Downloads as a fallback. *(I verified the keep rules by
   diffing both DEX bundles: 15 plugin classes before, 15 after, empty
   difference — but that proves nothing was stripped, not that it runs.)*
2. **Spot-check the 6 new Trail careers** before 2026-09-01 — van Dijk, Courtois,
   Griezmann, De Bruyne, Son, Lewandowski. The spec requires 100% human review;
   a wrong club order is unfalsifiable to the player.
3. **One tap on "⚑ Report a problem"** on a device. Fixed everywhere, still never
   delivered one real report end to end.
4. **listdle.com/submit** — 30 seconds, no account. See §5.
5. **Yes/no on a ~1.5 GB Android SDK download** so an emulator exists. No AVDs,
   no `sdkmanager` installed, so there is currently no way to test Android here.

---

## 3. ⚠️ Budget — check before starting anything large

At the last check Alex was at **83% of his weekly usage limit**, resetting
**Sunday 21:00**. A large forge wave (e.g. the explanation-coverage job) would
consume most of what remains. Ask before committing to one.

---

## 4. The through-line: "football quiz" at position 41

Alex named this unprompted and emphatically — *"it would be so transformative if
we could become top 5 or top 10 here, so life changing actually for our app."*
**Treat it as a standing goal.**

77 impressions at position 41 is a sliver of the term, not its volume — page 4 is
never seen. Top 10 is a **10–20× impression multiplier**, not a CTR tweak.

**On-page work is now finished and gated. Do not do more of it.** The remaining
lever is authority: the directory pack (§5) and the outreach in tasks #51/#8.
The tail already converts — Everton at position 9.3 pulls 15.4% CTR while Arsenal
at 11.4 pulls 0.6% — so authority spent anywhere lifts all 72 club pages at once.

---

## 5. Directory status — CHECKED by fetching each site, not assumed

Alex believed these were already done. Four of five were not:

| directory | listed? |
|---|---|
| adoryvo daily-games list | ✅ **already there** (Sports, marked 🆕) |
| **listdle.com** | ❌ not listed — *and it carries football games*. Best target. |
| dailydle.org | ❌ not listed |
| likewordle.com | ❌ not listed |
| wordly.org | ❌ not listed |

Done, do not repeat: **Product Hunt** (~2026-07-09), **AlternativeTo**
(2026-07-13). `playfootball.games` stays dropped — verified as a direct
competitor with no submission path.

Full pack with pre-written copy: `docs/BACKLINK-SUBMISSIONS.md`.

⚠️ **I cannot submit forms or create accounts.** That's a standing boundary, not
a judgement about the task — prepare everything to copy-paste, then stop.

---

## 6. Queued work, with the reasoning

**Explanation coverage 77.6% → higher (task #72).** 4,970 of 6,402 MCQs carry an
explanation. All 72 **club** packs are at 100% (the MIN_HINTS gate enforces it);
the gap is entirely older category banks — World Cup 54%, Euros 56%, PL 61%.
Copy is honest in the meantime ("most answers explained"). **The prize is earning
the sentence back**: at 100% we can truthfully say "every answer explained"
everywhere, which is the product's whole pitch. Additive work — answers are
already verified, only the explanation is missing. ⚠️ Don't chase 100%
mechanically; "Which club plays at Anfield?" needs no explanation and forcing one
produces filler.

**Performance + bug audit.** Alex asked; it's overdue. ⚡ **The chrome-devtools MCP
is now live and carries `lighthouse_audit`, `performance_start_trace` and
`performance_analyze_insight`** — so this is a real tool run, not a manual
exercise. Run it as **measurement, not reading** — real Lighthouse, actual bundle numbers, live Sentry, prod
queries. Measured today: playtesters ~100% precision, sweeping audits 3–6%. One
grammar sweep produced 1,744 false positives and one real defect in 6,856 rows.
Convert findings into **gates** (eslint, distractor plausibility, lists
staleness, SERP metadata); gates have a far better track record here than sweeps.

**More clubs?** 72 packs live. Breadth isn't the constraint — **repetition is**.
A ~40-question pack with 10-question sessions and a 14-day filter gives about 4
fresh plays before repeats. Top up the five thin packs before adding club 73.

**Website facelift.** See the TODO's facelift section — and read §7 first.

---

## 7. The facelift's first decision is a STACK decision

Ball IQ is **plain CSS** (`src/app.css`). No Tailwind, no shadcn, no Radix, no
Framer Motion, **no GSAP**. The modern design-tooling ecosystem assumes Tailwind:

- 6 of shadcn MCP's 7 tools refuse to run without a `components.json` we don't have.
- Magic UI ships React + Tailwind components — usable as reference, not paste-in.
- The 16 GSAP motion presets in `ui-ux-pro-max` require adding GSAP as a dependency.

So decide **before** component work: adopt Tailwind (+GSAP), or stay on
hand-written CSS and use these servers for inspiration only. Adopting Tailwind on
an 11.5k-line `App.jsx` with a 155-rule `!important` standalone mirror is a real
migration.

**Figma** — pricing checked at source: Professional **Full seat $16/mo**, Dev seat
$12/mo (Dev can't create designs, only view/comment, so a solo dev needs Full).
Starter is free but has no Dev Mode. **Recommendation: skip for now** — not on
price, on sequencing. The MCP reads an *existing* design file and there are zero
Ball IQ designs in Figma, so the real cost is learning Figma and designing every
screen first. Zero-cost test: design one screen on the free tier and see whether
designing-before-coding suits how Alex works.

**⚠️ Facelift traps** (a redesign here is not just CSS):
1. **The standalone CSS mirror** — ~155 `!important` rules in a
   `@media (display-mode: standalone)` block that re-style whatever the ≥1024px
   desktop reflow changes. Every token touched must be checked against it *and*
   `index.html`'s `html.native-app` killswitch. Missing it has already shipped
   stale styling to installed PWAs.
2. One element commonly has hooks in **four** places: component, base rule,
   desktop reflow, mirror.
3. `webDir: "dist"` means **everything built for web ships inside the native
   app** — a raw third-party `<script src>` silently falsifies the store privacy
   declaration. Native-guard in code, not in a comment.
4. **Don't break `/footle`** — it's the short share alias in every share text and
   all four social redirects, and it boots straight into the puzzle.
5. Marketing `/` keeps the "Both" hero (Footle + quiz). Alex's standing call.

---

## 8. Tooling state

**Live in a new session:** Supabase, Vercel, Sentry, Clarity, **Firecrawl (FULL
authenticated tier — Alex completed OAuth 2026-07-30 evening; all 28 tools incl.
map/crawl/extract/agent/monitor, verified by a real `firecrawl_map` call)**, Serena,
Semgrep, context7, Exa *(via the claude.ai connector, not the plugin)*, Chrome ×2,
iOS Simulator, Magic UI, shadcn, Canva, Drive, desktop-commander, episodic-memory.

**Broken / needs Alex:**
- **GitHub** — `Incompatible auth server: does not support dynamic client
  registration`. **Not fixable by re-authorizing**; that connector needs replacing.
- **Brightdata, Exa-plugin, Ahrefs and ~20 others** — plain `Unauthorized`.
- **Figma Dev Mode MCP** — Figma desktop isn't installed; its server is local.

**Don't go MCP shopping.** 24 servers already fail on auth at every startup and
they're an enterprise sales stack (Apollo, Gong, Box, BigQuery, Klaviyo, Pendo,
DocuSign, QuickBooks…). Ball IQ is a solo football trivia app. The toolkit is
complete; the only genuine gaps are Ahrefs (paid) and Google Search Console (no
MCP exists — read it in Alex's Chrome).

---

## 9. How Alex works — things that came up today

- **He needs the written list.** `docs/TODO.md` is the single source of truth;
  update it when something lands. Without it the work "feels chaotic".
- **Fix everything we find, no regressions.** If something can't land complete,
  land it **inert** so it renders nothing rather than something broken.
- **Never handle his keys or tokens.** He obtains and enters them. And **never
  paste a command containing a credential placeholder** — three such commands
  were run verbatim today, each reporting success while broken. His words: *"it
  is hard for me to catch what is going on right now."*
- **Don't open speculative URLs.** Verify a link resolves before putting it in
  front of him.
- **Publishing is always his call** — uploads, posts, submissions, store actions.
- He'll push back when something looks wrong ("this looks bad no?", "those
  directories look like stuff we've already done"). **He is often right, and
  checking beats debating** — he was right about one of the five directories, and
  it was the one I'd called highest-value.

---

## 10. First move in the new session

Say what you're picking up, then do one of:

- **Cheapest high-value:** ask Alex to run the R8 device test so 1.4.1 can ship.
- **If he wants you working:** the performance audit as *measurement* — Lighthouse
  on `/`, `/quiz/`, and a club page; real bundle numbers; live Sentry issues.
  Cheap on the weekly budget, and it's the thing he asked for that's still undone.
- **If he wants content:** explanation coverage, World Cup first (~290 missing) —
  but check the weekly budget first (§3).
