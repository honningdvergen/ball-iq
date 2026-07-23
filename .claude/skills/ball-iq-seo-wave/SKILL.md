---
name: ball-iq-seo-wave
description: Run a Ball IQ content wave — new club/player quiz pages from forge to live URL (generate, verify, curate, wire, prose, deploy, index). Use whenever adding clubs or players to the bank + SEO surface, and BEFORE improvising the pipeline from memory — every step here was learned from a real wave going subtly wrong.
---

# Shipping a content wave (clubs / players)

The pipeline that took the bank 4,030 → 5,834 and the site to 61 live club pages
(waves A–K, 2026-07). Every rule below exists because its absence bit a real wave.
The zero-error bar from [ball-iq-question-bank] governs throughout: verify inline,
only survivors ship, reject-when-in-doubt.

## 0. Pick the wave

`scripts/seo/leagues.mjs` IS the coverage map — 356 clubs; built ones light up in
the directory automatically. Pick by: fanbase devotion × thin English SERP ×
history richness × reuses-an-existing-league-section. **Thin-history clubs
(post-2000, short trophy lists) get FEWER questions, never padding** — padding is
where fabrication creeps in. One wave at a time; **never run two generation
workflows concurrently** (usage-limit starvation kills both).

## 1. Forge (Workflow tool, needs ultracode/opt-in)

Per club: **2 generation lenses** (heritage + modern, ~18 Qs each, merged +
text-deduped) → **examiner** per question → **adversarial skeptic** per question,
both `effort: 'high'`, both instructed to reject when uncertain. Only
double-survivors continue. Prose agent last, grounded ONLY in survivor facts.
Reference script: `workflows/scripts/wave-*-forge-*.js` under the session dir of
2026-07-22 (schemas: GEN/EXAMINER/SKEPTIC/PROSE).

- Session-limit mid-run is survivable: relaunch with `resumeFromRunId` — completed
  agents replay from cache free; only casualties re-run.
- Generation agents put club names in whatever field you under-specify — pin every
  schema field with enums/descriptions.

## 2. Curate — REQUIRED, the forge output is NOT ship-ready

Run `node scripts/forge-curate.mjs <workflow-output> <repo-root>` (edit its
CLUB_FIELD map first: workflow club key → QB `club` display name). It fixes/flags
four defect classes that per-question verifiers structurally CANNOT see:

1. **HTML entities** in strings (`&amp;` etc.) — decoded automatically.
2. **Semantic dupes**: the two lenses re-ask the same fact in different words
   (~6-8 pairs per club, every wave). Flagged by same-answer + shared stem tokens.
   The matcher misses **accent variants** (Honvéd/Honved) — eyeball same-event
   pairs too. Drop the weaker of each pair via `DROP="Club:idx,..."` env.
3. **Mutual-leak event pairs**: the lenses ask the same EVENT from opposite
   directions ("who scored at X?" / "where did he score?") — each answer sits in
   the other's stem. Drop one side.
4. **Within-club answer leaks**: a survivor's answer appears verbatim in another
   survivor's stem. Either drop, or reword the stem to strip the incidental
   mention ("at Molineux" → "at home") — rewording preserves the fact. Big-club
   names (Liverpool/Arsenal) as answers are weak leaks; dates, grounds and people
   are strong ones. Re-run until strong leaks = 0.

## 3. Insert + wire (the lists that drift)

- `node scripts/add-questions.mjs <club>.json` — per-question `cat`/`club` ride
  the JSON; ids are sha1-stable; dedup is automatic.
- **App.jsx ×5**: CLUB_PACK_TO_QB, CLUB_LEAGUES, CLUB_ABBR, CLUB_SLUG_TO_PACK,
  CLUB_PACKS (`{name, icon, color, questions: []}`). League bucket: in-app has NO
  Championship section — big English clubs go under "pl" (West Ham precedent);
  the web directory shows the true division regardless.
- **MarketingHome ×2**: QUIZ_CLUBS tile + CLUB_COLOR.
- **gen-seo ×2 (+1)**: CLUB_BADGE, CLUB_COLOR, and **DIR_ALIAS when the
  directory name ≠ page club name** ('Coventry' → 'Coventry City') — the
  directory guard fails the build loud otherwise, which is correct.
- **clubs.mjs prose**: `{club, slug, name, h1, title(≤60), description(≤155),
  intro[4], faq[4]}`. ⚠️ The array tolerates a trailing comma, so a blind append
  has produced BOTH a missing comma and a `},,` double comma (= array hole that
  crashes iteration). After any append: import it and assert
  `CLUBS.filter(c => !c?.slug).length === 0`.

## 4. Head extras are UNCONDITIONAL

Anything that must load on every generated page (analytics, verification tags)
goes in `head()` as its own block. **Never piggyback on the AdSense block — it is
gated per page-type on `ads && ADS_ENABLED`** and silently skipped Clarity on
club pages once. Third-party scripts follow the native-guard rule from
[ball-iq-native-build].

## 5. Ship + verify

1. `npm run build` — the gates are friends: eslint, ≥15 hint-bearing MCQs per
   club page, directory guards. Confirm "✓ /quiz/<slug>/ (club, N Qs in bank)".
2. One commit for the wave; push main → Vercel deploy regenerates the sitemap and
   **pings IndexNow automatically** (prod builds only). No manual index step.
3. **Verify live by static `<title>`, not HTTP 200** — the SPA catch-all answers
   200 for any path, so 200 proves nothing. `curl | grep '<title>'` must show the
   club title, not "Ball IQ — The Ultimate Football Quiz". Deploys flip in ~1-3
   min; poll with an until-loop in a background task.
4. Update `project_club_expansion` memory: wave, commit, counts, next frontier.
