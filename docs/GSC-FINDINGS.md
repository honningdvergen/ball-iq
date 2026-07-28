# Google Search Console — 2026-07-28

## ⚠️ CORRECTION to the first read below — it is NOT a page-3 problem

The "average position 21.3 = page 3, 6x opportunity" framing further down is
**wrong for the pages that matter.** Position 21.3 is a site-wide mean dragged
down by a long tail of ~160 pages picking up stray impressions at deep ranks.

**The pages carrying the traffic are on PAGE 1 already** (7 days):

| Page | Clicks | Impressions | Position |
|---|---|---|---|
| balliq.app/ | 20 | 119 | **5.7** |
| /quiz/rangers/ | 10 | 108 | **8.4** |
| /quiz/tottenham/ | 8 | 175 | **9.8** |
| /quiz/everton/ | 7 | 71 | **9.2** |
| **/quiz/arsenal/** | 6 | **268** | **10.9** |
| /quiz/liverpool/ | 6 | 144 | 16.5 |
| /quiz/newcastle/ | 4 | 87 | 9.6 |

And by query: `rangers quiz with answers` **5.0**, `rangers quiz` **6.0**,
`tottenham quiz with answers` **7.5**, `everton quiz` **8.9**,
`tottenham quiz` **9.8**, `ball iq` **2.4**.

### What this changes

- ❌ **"We rank badly, get to page 1"** — we ARE on page 1 for club terms.
- ❌ **The title rewrite across ~160 pages.** Club titles ALREADY contain
  "Questions & Answers". The `with answers` CTR advantage is mostly a POSITION
  advantage (7.5 vs 9.8), not a title-match advantage. Rewriting titles risks
  disturbing pages that are working, for a benefit the data does not support.
- ✅ **The real shape: positions 8-11 — the bottom of page 1 / top of page 2.**
  That is the "so close" zone where small gains pay most: moving 10 -> 5 roughly
  triples CTR on the SAME impressions.

### The single best target

**`/quiz/arsenal/` — 268 impressions, position 10.9, only 6 clicks (2.2% CTR).**
Highest impression count on the site and stuck at the very top of page 2. One
position better and it moves onto page 1 proper.

Then `/quiz/tottenham/` (175 impr @ 9.8) and `/quiz/liverpool/` (144 @ 16.5).

**Strategy: strengthen the handful of high-impression pages already at 8-11.
Not more pages, not new titles.**

### Ceiling caveat — read before over-investing

Club-quiz queries are **low volume**: `everton quiz` drew 23 impressions in 7
days. Even ranking #1 with 30% CTR that is ~7 clicks. Winning these terms
outright is worth tens of clicks a week, not hundreds. The volume lives in the
long tail (~7,000 of the 7,910 impressions) and in head terms like
`football quiz` (75 impressions, position deep).

---

## First read (superseded above where they disagree)

First full read. Property is `https://balliq.app/` (URL-prefix), account u/2.

## The headline

**28 days: 177 clicks · 10,500 impressions · 1.7% CTR · avg position 21.3**

Impressions were **flat near zero until ~21 July**, then jumped to ~2,300/day.
The club-quiz + /lists waves are being indexed and served RIGHT NOW. The
content strategy is working.

## The problem is position, not content

**Average position 21.3 = page 3.** That is the entire story of the 1.7% CTR.

Rough industry CTR by position: #1 ~28%, #3 ~11%, #5 ~6%, #10 ~2.5%, #20 ~1%.
At 10.5k impressions:

| If avg position were | Expected CTR | Clicks |
|---|---|---|
| 21 (today) | 1.7% | **177** |
| 10 | ~2.5% | ~260 |
| 5 | ~6% | ~630 |
| 3 | ~11% | ~1,150 |

**Same content, same impressions — 6x the traffic from moving to page 1.**
Nothing needs to be written. The pages already exist and are already served.

## Top queries (28d)

| Query | Clicks | Impressions |
|---|---|---|
| ball iq | **42** | 210 |
| everton quiz | 5 | 23 |
| tottenham quiz with answers | 3 | 15 |
| rangers quiz with answers | 3 | 9 |
| football quiz | 2 | **75** |
| tottenham quiz | 2 | 45 |

Reads:
- **"ball iq" is 42 of 177 clicks — 24% of all search traffic is BRAND.** People
  already looking for us. Non-brand discovery is thinner than the headline
  number suggests.
- **"...quiz with answers" converts unusually well** (3 clicks from 9-15
  impressions ≈ 20-33% CTR). That phrasing matches intent precisely. Worth
  testing in more titles — the pages already answer it.
- **"football quiz": 75 impressions, 2 clicks.** High-volume head term, ranking
  far down. This is the one to chase, and the hardest.
- Club terms (everton, tottenham, rangers) are where the real non-brand
  traffic is, matching the Clarity entry-page data exactly.

## What this means alongside Clarity

Two independent datasets, same conclusion from opposite ends:

- **GSC:** plenty of impressions, poor position -> few clicks arrive.
- **Clarity:** the few that arrive convert at 5.4%.

**Both stages leak.** Ranking work multiplies traffic into a funnel that loses
94.6% of it; conversion work polishes a funnel almost nobody reaches. Doing
either alone wastes most of its own gain.

## Next

- [ ] Pages report (SIDER tab) — WHICH urls hold the 10.5k impressions
- [ ] Position by query — how far off page 1 the club terms actually are
- [ ] Test "quiz with answers" phrasing in titles, given its standout CTR
- [ ] Re-read weekly; the 21 July inflection means this data is changing fast
