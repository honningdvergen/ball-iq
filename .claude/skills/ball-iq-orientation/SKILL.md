---
name: ball-iq-orientation
description: Orient before recommending, prioritising, or answering "what should we do next" on Ball IQ. Use at the START of any session, and before any answer about priorities, roadmap, what's built, or what's live. Also use whenever about to say a feature is "not built", "missing", or "still open" — that claim has been wrong more often than right.
---

# Orient before you recommend

Ball IQ is a solo-dev football trivia app: React + Vite PWA, Capacitor 6 shell (iOS live, Android in closed test), Supabase backend, Vercel hosting, `src/App.jsx` is a ~10k-line monolith. `main` **is** production and auto-deploys on push.

## Why this skill exists

On 2026-07-14 a session spent hours ranking priorities and got them wrong three times in a row:

- Recommended building **League Quizzes** — shipped weeks earlier as `LEAGUE_QUIZ_SECTIONS` (the roadmap said "wire a picker onto the orphaned `CATS` array"; a *different* structure had been built, so grepping the planned name found nothing).
- Recommended **cutting build 44 while believing 42 was live** — three memory files each tracked native build state and all three were stale, in different directions.
- Built an **AdSense slot system from scratch** — `src/lib/ads.js` already existed with the same pattern, dormant.

Meanwhile the actual #1 issue — `robots.txt` blocking `/api/og`, which made **every share card on every surface unfurl blank** — was sitting in a memory file with a ⚠️ on it, unread for hours.

None of this was a reasoning failure. It was an orientation failure.

## Do this first, every session

1. **Read `MEMORY.md` fully**, then open every memory it flags with ⚠️ or that is dated within ~2 weeks. The newest scan supersedes older ones and usually says so.
2. **Check for a previous session.** Transcripts do NOT carry across sessions; memory does, imperfectly. Use `mcp__ccd_session_mgmt__list_sessions` → `list_events` on anything recent in this repo. Ask if unsure — the user would rather you read it than guess.
3. **Check the live task list** (`TaskList`) before creating anything.

## Then: never assert state you haven't verified

Memory is **good at rules, bad at status**. A note saying "build 43 is live" expires the moment you ship 44 and reads identically to a fresh one. Rules (`always rm -rf dist before cap sync`) never rot.

Before claiming something is unbuilt, missing, or broken:

- **Search by content, not by planned name.** Things get built under different names. `grep` the behaviour, the RPC, the CSS class, the route — not the noun from the roadmap.
- **Line numbers in memory and audits have drifted.** Locate by content.
- **Prod status is unknowable from the repo.** The repo shows what is *cut*, never what is *approved* or *deployed*. For App Store / Play / AdSense state: ask, or read it via the browser (the user's Chrome is paired — Play Console, App Store Connect, AdSense, Search Console are all readable).
- **Check what production actually serves** before claiming a fix is or isn't live: `curl https://balliq.app/...`. Local commits are not deployed; a branch is not `main`.

## Execute, don't reason, when a check is cheap

Every genuinely new bug found on 2026-07-14/15 came from running something, not from analysis:

- An audit agent reasoned that `Math.sin` engine differences "could theoretically" affect the Daily 7 — **low probability**. Running the expression through `jsc` (JavaScriptCore = iOS/Safari) vs `node` (V8 = Android/Chrome) showed **137 of 3000 values differ**: iOS and Android users had been getting different daily questions for months.
- A parse error that broke the whole build only surfaced from running ESLint, not from believing an agent's "all fixes applied".
- A modulepreload plugin was warning "chunk not found — skipping" on *every build* and injecting nothing. Nobody read the log.

Audits produce claims. Only execution produces facts. If a claim is cheap to test, test it.

## Where the bugs actually are

A 14-organ code audit graded this repo **A-** on 2026-07-12. Three days later a
single day of work found: two literally unwinnable Footle answers, iOS and
Android drawing different daily questions, every share card unfurling blank, and
a 15% activation rate nobody knew about.

Both are true. The grade was fair — the code IS good. **The bugs that survive a
good audit are the ones that live BETWEEN things:**

| Gap | Example found here |
|---|---|
| Between code and **data** | `SNIJDER: ["Wesley", "Sneijder"]` — perfect code, wrong content. Unwinnable puzzle. No linter, type or review catches this. |
| Between **engines** | `Math.sin` in a sort comparator: 137/3000 values differ JSC vs V8. Unreadable as a bug; only `jsc` vs `node` shows it. |
| Between code and **config** | `Disallow: /api/` in robots.txt nullified three sprints of share work. The renderer was flawless. |
| Between **two features** | `applySeenFilter` works correctly; `/c/` challenge links assume determinism. No single file is wrong. |
| Between **built and shipped** | ~6k lines of verified fixes worth exactly zero until `git push`. |
| Between the app and its **users** | 28/58 accounts never played. Sat in the `scores` table through three scans; nobody ran a query. |

**Every audit lens reads files. None of those live in a file.**

So: when asked to audit or find bugs, do NOT only read code. Also —
- **Run it across the real runtimes** (iOS = JavaScriptCore, Android/Chrome = V8; `jsc` lives at
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`).
- **Check the data, not just the code that reads it.** Correlate outcomes against inputs.
- **Query prod.** The Supabase connector is live and read-only queries are free.
- **Check what production actually serves**, and check it as the *consumer* does (`curl -A "Twitterbot/1.0"`),
  not as the config claims.
- **Look across feature boundaries** for assumed contracts.

## Standing rules from the user

- **"Fix everything we find — no regressions."** A finding is not filed, it's fixed — or explicitly deferred by him. If it can't land complete, land it **inert** (empty registry, dormant flag) so it renders nothing rather than something broken.
- **Ship controlled, goal-anchored increments.** Device-test native changes. One version through App Store review at a time.
- **Verify by exercising the thing**, not by re-reading the diff.
