---
target: the marketing homepage
total_score: 21
max_score: 36
na_heuristics: 7
p0_count: 2
p1_count: 2
timestamp: 2026-07-31T22-14-28Z
slug: src-marketing-marketinghome-jsx
---
Method: dual-agent (A: a12b7807ab7a760fd · B: a93d2035d6c2d221a)

## Design Health Score — LIVE homepage

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Taster feedback is good; hero odometer animates through false intermediates (1,689 → 2,996 → 6,407) |
| 2 | Match System / Real World | 2 | Footle/Daily 7/Hot Streak/Chaos unglossed; demo board spells INIESTA under "guess the mystery footballer" |
| 3 | User Control and Freedom | 3 | Guest play, no gate; no restart/skip once the taster begins |
| 4 | Consistency and Standards | 1 | Four colour systems, three heading treatments, two button geometries; hero card order REVERSES desktop vs mobile |
| 5 | Error Prevention | 3 | Single-tap commit is right for a quiz |
| 6 | Recognition Rather Than Recall | 2 | 8 modes described in two words each; marquee re-lists them in different wording |
| 7 | Flexibility and Efficiency | n/a | Persuade surface, cold first-time traffic — no expert path to provide |
| 8 | Aesthetic and Minimalist Design | 1 | 6,529px desktop / ~10,000px mobile; ~2,560px of desktop scroll is empty black |
| 9 | Error Recovery | 3 | Correct/wrong + WHY is strong; first explanation shown never confirms the answer |
| 10 | Help and Documentation | n/a→3 | FAQ is genuinely good, but says "a native Android app is on the way" beside a live Google Play button |
| **Total** | | **21/36 (58%)** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

LIVE: not specific, swappable wholesale. Hero pill + condensed caps H1 + two dark cards; three alternating "text left / floating phone right" SaaS feature rows; an 8-card icon-tile grid; a marquee; an orange gradient CTA; an FAQ accordion; a four-column footer. Delete the football nouns and it sells a CRM.

NEW WORK (The Scouting Report): specific. The composition encodes the product's argument — an empty attribute table only makes sense for a thing that grades football knowledge, and its unfilled state is a stronger CTA than any headline. Cannot be lifted onto another product.

Deterministic scan: live 40 findings across 13 rule types; new work 6 across 3; the rejected dark attempt 36 across 9.

## Priority Issues

P0 — The banned number is printed at the peak moment. Verdict block reads "Five of 6,407 questions... the other 6,402 are waiting". Comp footer prints both 6,407 and 5,186. Club table retails it 12 more times. Live site: animated odometer, chip, primary CTA, marquee, footer — and 6,407 and 6,000+ appear on the same screen.

P0 — The rating is not credible. One correct answer yields 71–83; one wrong yields 29–38. Two of five yields 66 / FIRST TEAM. A binary answer cannot produce a two-digit rating. A scout who grades everyone in the 60s is a horoscope, and credibility is the only thing this world has.

P1 — Footle, the most-played mode and the only daily return loop, is one sentence with nothing to touch in the new work.

P1 — ~2,560px of black nothing across three identical SaaS feature rows on live desktop, the surface search shows most.

P2 — The navy CTA breaks the new world's own colour law; three visible state bugs in the assessment card (stale lede, stuck 5/5 counter, empty 40px container).

## Persona Red Flags

Jordan (first-timer): the word Liverpool appears nowhere above the fold on a page they reached by searching "Liverpool quiz".
Riley (stress tester): 6,407 vs 6,000+ within 200px; FAQ says Android "on the way" beside a Google Play button; Hajduk "same depth as Real Madrid" two lines above "Real Madrid 107 Qs / Hajduk Split 15 Qs".
Casey (mobile, 66% of sessions): ~9,800px at 390px = 11.6 viewports; no sticky CTA after the taster; hero card order reverses between breakpoints.
The football obsessive from a club search: the taster's opening question is answerable in under a second. The entire SEO strategy attracts this person and the front door tells them they are not the audience.

## Verdict on the new direction

Worth building. First direction in the project with an idea underneath rather than a style on top. Recommended composition: C (Assessment First) — playable first, report as reward, identical sequence on both breakpoints. Must change: cut the five-line headline to two, graft in B's live-filling report stub from Q2 onward, fix the four issues above, and wire real breakpoints (there are currently zero width media queries).
