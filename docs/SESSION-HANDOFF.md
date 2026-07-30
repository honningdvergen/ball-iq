# Session handoff — 2026-07-30

Read `MEMORY.md` first; this covers only what happened today and what's still
open. Delete this file once it's absorbed.

## Shipped today (all pushed to main, all live)

| commit | what |
|---|---|
| `5cb8655` | Hajduk Split — 15 verified questions, 72nd club page |
| `03f469f` | Hub title stopped splitting "football quiz"; hub description 187 → 153 |
| `68ec74c` | Android R8 enabled with Capacitor keep rules; AAB 7.63 → 6.50 MB |
| `ccdb960` | Site-wide SERP sweep: 31 truncated titles → 0, 46 descriptions → 0 |
| `1e531b3` | Build gate so truncation can't return (`scripts/audit-serp-meta.mjs`) |
| `4d7c25a` | Trail wave M: 44 careers, schedule min-gap 1 → 14 days |

Earlier the same day: the question-report loop (which had **never** delivered a
single report in the app's life), the MP card dead click, persistent iOS zoom,
club picker search, PRL → EPL.

## Blocking on Alex

1. **Device-test the R8 Android build** before uploading
   `~/Downloads/balliq-1.4.1-vc10-r8.aab`. R8 breakage is runtime-only and
   silent. Exercise: push prompt + token, share sheet, splash dismiss, Apple
   sign-in, in-app review, haptics, keyboard. The pre-R8 7.63 MB bundle is still
   in Downloads as a fallback.
2. **Spot-check the 6 new Trail careers** before 2026-09-01 (van Dijk, Courtois,
   Griezmann, De Bruyne, Son, Lewandowski). Spec requires 100% human review; a
   wrong club order is unfalsifiable to the player.
3. **Tap "⚑ Report a problem" once on a device.** The loop is fixed but has still
   never delivered a real report end to end.
4. **Directory submissions** — see `docs/BACKLINK-SUBMISSIONS.md`. Deduped
   against what's already done; all URLs verified live 2026-07-30.

## Open questions Alex asked that still need answers

- **An Android emulator needs a ~1.5 GB SDK download** (cmdline-tools + a system
  image). Nothing is installed — no AVDs, no `sdkmanager`. Needs his OK.
- **Performance + bug audit** — not done for a while. His instinct is right that
  it's overdue. See the caution below.
- **More clubs** — 72 packs live. The constraint is thin-club repetition, not
  breadth: 10-question sessions + a 14-day filter means a ~40-question pack gives
  only ~4 fresh plays. Topping up the thin packs beats adding club 73.

## ⚠️ Before running another audit, read this

Measured on 2026-07-30: **playtesters ~100% precision, sweeping audits 3-6%.**
Every genuine defect found today came from Alex or his friend. Every broad audit
I ran was mostly noise — one grammar sweep produced 1,744 false positives and a
single real defect in 6,856 rows.

So audits are worth running, but: prefer **executing** things over reading them
(the real bugs today came from running `report_question()` against prod, diffing
DEX, and decoding HTML entities), and treat any detector's first run as a
hypothesis until a sample is verified by a different route.

The gates that already exist and do work: eslint, distractor plausibility, lists
staleness, and now SERP metadata. Converting a finding into a gate has a much
better track record here than another sweep.

## Design tooling (added 2026-07-30, for the facelift)

`magicui` and `shadcn` MCP servers are now in `~/.claude.json` (user scope) and
were verified by probing their tool lists, not by trusting "Connected". A backup
of the config sits at `~/.claude.json.bak-*`.

⚠️ **But read the TODO's facelift section first.** Ball IQ is plain CSS — no
Tailwind, no shadcn, no GSAP. Six of shadcn's seven tools require a
`components.json` we do not have, Magic UI ships Tailwind components, and the
GSAP motion presets need GSAP added. The first facelift decision is a stack
decision, not a tooling one.

Figma Dev Mode MCP is the one genuinely worth having and it is blocked: Figma
desktop is not installed on this Mac and the local server at 127.0.0.1:3845
answers nothing.

## Tooling state

- **This conversation cannot see Firecrawl, Serena or Semgrep.** They connect
  fine at the process level; a conversation's tool registry is fixed at its first
  turn. A new conversation gets them. See `reference_mcp_registry_state`.
- GitHub MCP fails with `Incompatible auth server: does not support dynamic
  client registration` — not fixable by re-authorizing; that connector needs
  replacing.
- Brightdata and Exa are plain `Unauthorized` — they need Alex's tokens.

## The through-line

`"football quiz"` sits at GSC **position 41**. Alex named getting it to page one
as the goal — "life changing" for the app. On-page work is now finished and
gated; the remaining lever is **authority**, which means the directory pack above
and the outreach in `#51`/`#8`. No further page or title work moves that number.
