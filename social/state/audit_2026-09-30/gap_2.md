# GAP 2: IG monetization economics and the money section (2026-09-30 ~12:00 Oslo)

Read-only. Sources: Alex's facts 1 and 5 (00_ALEX_FACTS, his 11:10 and 11:19 screenshots, relayed in chat; no screenshot file exists on disk), ig_truth/acct.json and ig_truth/media.json (Graph pulls 09-30 08:56Z), business.md, memory project_ig_and_x_monetization_2026_09_30, reference_social_stack_consolidation. Tags: [ALEX] from his screenshots, [MEASURED] recomputed by me from the Graph pulls, [INFERRED] my arithmetic.

## 1. What IG actually pays (numbers)

- [ALEX] IG pays on POSTS and CAROUSELS only. About $81 this month. Per-post payouts on his screen: $0.04, $0.28, $0.16, $0.12, $0.06. The Old Trafford carousel: $0.16 on 5,727 qualified views = $0.028 per 1K, screen says average RPM "less than $0.05".
- [INFERRED] $81 / $0.03 per 1K = 2.7M qualified views. Roughly $30 per 1M qualified views.
- [MEASURED] Cross-check, three independent routes agree within about 25%:
  - Account level, Sep 1-30, feed views (POST + CAROUSEL_CONTAINER buckets) = 4.79M. $81 implies 56-60% of those count as qualified.
  - Per-media, the 227 feed posts created Sep 1-30 (121 carousels, 106 images) = 4.10M views. At $0.028/1K and 70% qualified the model gives $80.
  - The Old Trafford carousel (09-29 11:12Z) shows 7,529 views in the 08:56Z pull vs 5,727 qualified on Alex's screen = 76% qualified (one post, so a rough ratio).
  - So the working rule is: about 60-76% of feed views qualify, paid at about $0.028-0.03 per 1K qualified, which is about $17-20 per 1M feed views.
- [MEASURED] Per-post scale matches Alex's cents: median Sept feed post 6,893 views = about $0.12-0.15; the top Sept post (363,774 views, image, 09-14) would be about $6-8. Alex's five sample payouts ($0.04-$0.28) fit 1.5K-10K qualified views. "The bigger the post, the bigger the pay" is linear and nothing else.
- [MEASURED] Concentration decides the month: the top 23 of 227 feed posts (10%) carry 57.6% of Sept feed views (top 5 = 26.3%, top 10 = 39.4%, top 50 = 71.8%). About 58% of the $81 came from 23 posts. The median post pays about 13 cents.
- [MEASURED] Carousels are 59% of Sept feed views (2.42M), images 41% (1.67M). Both are paid. The $81 is not carousel-only; images pay at the same rate.

## 2. Reels: growth only, not a paid unit on IG

- [ALEX] Reels and video are not part of IG monetization. I cannot verify that independently (no earnings API), only that his per-post list contains posts and carousels. Flag: ask him for one screenshot of the reel row if it exists.
- [MEASURED] Reel reach share depends on the window. 61 reels 08-22..09-29 = 160,299 reach = 1.1% of the 14.16M feed reach in that pull (quality pack figure, Aug posts inflate the denominator). Sept only: account reach 3.5% (135K of 3.88M summed daily reach), and 55 Sept reels = 189,777 views vs 4.10M views on Sept feed posts = 4.4% of views on Sept-created posts (0.19M of 4.29M). Use "1-4% of IG reach, 4.4% of views on Sept posts".
- [MEASURED] Reel median 2,230 views (n=55 Sept), 0.064x followers (benchmark n=35-37) vs 0.36-0.74x for peers. Highest Sept reel 30.6K.
- Trap for anyone reading acct.json: its REEL views bucket totals 3.0M for Sept (38% of views) but 2.18M of that is 09-03 and 09-04 alone, when account reach for reels was about 2.9K and no per-media reel is above 31K views. Ex those two days it is 0.83M. Do not cite the account-level REEL bucket as reel performance; per-media is the reliable view.
- Where reels do earn: Facebook, $17.74 for Sep 1-30 on 1.27M media views = $0.0139 per 1K. Per view, an IG feed view (about $0.017-0.020 per 1K all views) is worth roughly 1.2-1.4x a Facebook view.
- [INFERRED] Consequence: every reel slot on IG is growth-and-reach spend with a stated $0 return on IG; the case for it has to be follows and FB/TikTok/YT re-use, and the audit already says it fails its own test (median 1,253 for the last 10). The paid unit on IG is the carousel/image, and the money is in the tail: one 100K post pays about $2-3; twenty 10K posts pay the same.

## 3. Ceiling

Assuming the same qualified share and rate (rate may not be linear: unknown, only Alex's screen can show tiers):
| Scenario | IG $/month |
|---|---|
| Now (Sept) | about $81 |
| Double carousel views only | about +$48 (carousels are 59% of feed views) |
| Double ALL feed views (posts + carousels) | about +$81 |
| Aug pace (4.24M feed views) | about $72-84 |
| July 20-31 pace (13.8M feed views/month equivalent, 3x Sept) | about $235-275, and unknown whether those posts were monetized then |
| $500/month | about 6x Sept feed views (about 25-30M/month) |
| $1,000/month | about 12x Sept feed views |
So the honest ceiling is: IG at the best pace ever seen in the data is a low-hundreds-of-dollars a month line, not a rent line. Doubling carousel views is worth about $50, doubling all feed views about $80, and the audit's whole "views" effort on IG moves money in dollars, not hundreds.

## 4. Money section (replaces business.md sections 0 and 2 to 3 summary)

Income known, per month:
| Line | $ | Status |
|---|---|---|
| Instagram bonus (posts and carousels) | about 81 | [ALEX] this month to 09-30, payout timing and threshold unknown |
| Facebook content monetization | 17.74 | [MEASURED] Graph approximate earnings, Sep 1-30 (approximate, not a payout) |
| Known total | about 98.74 | |
| X Original Content Rewards | UNKNOWN | active, first payout 10-09; the old revenue share paid $1,311.08 over 28 weeks (about $47/week) to 08-01 then three periods "below minimum" |
| YouTube, TikTok (Norway), Snapchat, Telegram, Ball IQ | 0 | as before |

Cost known, per month:
| Line | $ | Status |
|---|---|---|
| Postiz Team | 39 | confirmed (Alex 09-27); Alex asked 09-29 whether to cancel |
| OneUp Basic | 25 | confirmed price, starts about 10-05 after trial; go/no-go 10-04. So $39 is what is being paid today, $64 if OneUp is kept |
| Confirmed recurring stack | 39 now / 64 from 10-05 | |
| FB follow ad | kr 600 one-off (about $55-60 at an assumed 10-11 NOK/USD) | spread 09-28 to about 10-09, not all in Sept |
| Claude | UNKNOWN | |
| X Premium | UNKNOWN | required for X rewards |
| Instagram Meta Verified | UNKNOWN | |
| Metricool | UNKNOWN | free plan capped at 20 posts and blocked since 09-29 21:27Z; public list Starter EUR16, Advanced EUR43, not confirmed |
| vidIQ | UNKNOWN | |
| Socialinsider, Magic Patterns | UNKNOWN | |
| Alex's hours | UNMEASURED | |

Recomputed answer to "does the operation pay for itself":
- Known income $98.74 vs known recurring cost $64 (OneUp kept) = +$34.74, covers 1.5x. Vs $39 today = +$59.74, covers 2.5x.
- With the one-off ad counted once (about $57): $64 + $57 = $121 vs $98.74 = about -$22; on today's $39 + $57 = $96 = about +$3. Break-even either way.
- Any single unknown line above $35 a month flips the $64 case negative (any above $60 flips the $39 case). Claude, X Premium, Meta Verified and Metricool are each unknown; Alex's own 09-28 17:55 words were that the IG bonus and X payouts "do not cover it", which was about the total including Claude, Verified and X Premium. That is consistent with the table and cannot be confirmed or refuted here.
- Correct claim: "Known income ($98.74) exceeds known recurring tool cost ($39 now, $64 from 10-05). Whether the operation pays for itself cannot be answered until Claude, X Premium, Meta Verified, Metricool and vidIQ costs and the 10-09 X payout are known." The old claim (confirmed cost exceeds revenue) is FALSE. B4 keeps status CUT-OFF, now overridden by facts 1 and 5.
- Ask Alex for one line each on Claude, X Premium, Meta Verified, Metricool and vidIQ. Once he gives them, money.md can be built in ten minutes.

## 5. Plan changes this forces (for the report)

1. IG format allocation: carousels and images are the paid unit and reels are growth-only. Stop describing IG reels in any plan as a revenue lever; cap them to a same-day-moment format with the existing 7-day kill rule.
2. Post-level earnings screen is the only instrument for IG money. Ask Alex for one screenshot a week (bonus list plus month total); log per-post dollars beside views in posts_log so the gate can be calibrated on payout, not likes.
3. Tail chasing is the strategy: 10% of posts are 58% of money, so it is better to make fewer, bigger, faster carousels on the story of the day (bench: verdict broke about 18:05 Oslo) than more medium ones.
4. Metricool free-plan quota: reels burned scarce scheduler slots for $0 on IG. The carousel slots are the ones worth protecting.
5. Money claims: any place that says IG earns $0 or that social money is Facebook-only is wrong. Facebook is 18% of known income, IG 82%.
6. X is the unknown that could dominate. Do not call the operation unprofitable before 10-09.

## 6. Correction ledger: every hit to remove or fix (existing files NOT edited, per read-only rule)

| File:line | Hit | Replace with |
|---|---|---|
| PACK_COMPACT.md:3 | KNOWN CORRECTIONS line quotes the wrong figure (already labelled wrong) | Rewrite as: "IG earns about $81 this month from posts and carousels (reels are not paid on IG); known income is about $98.74 (IG $81 + FB $17.74) before any X payout." |
| PACK_COMPACT.md:716 (B-dimension summary) | the "Money:" sentence (about eighteen dollars a month, Facebook only) and "on every number that does exist it is not [paying for itself]" | "Money: known income about $98.74 a month (IG about $81 from posts and carousels, FB $17.74), X payout unknown until 10-09. Confirmed recurring stack $39 now, $64 if OneUp is kept, plus unknown Claude, X Premium, Meta Verified, Metricool, vidIQ. Known income exceeds known recurring cost; whether it pays for itself cannot be answered until the unknowns are filled." |
| PACK_COMPACT.md:717 KEY NUMBERS | "Facebook revenue: $17.74 ..." (correct but lone) and "X revenue" | Add "Instagram bonus about $81 (Alex, 09-30)". |
| PACK_COMPACT.md:722 [B4] | the claim itself | "[B4] OVERRIDDEN (was CUT-OFF, sev 5): social income about $98.74 a month (IG about $81 from posts/carousels, FB $17.74), X unknown, vs confirmed recurring cost $39 now / $64 from 10-05; five cost lines unknown. Cannot say it does or does not pay for itself." |
| PACK.json:3982 and :4124 (B summary, B4 claim) | same text | same replacements; evidence line "IG bonus ... $0" becomes "IG bonus about $81 (Alex 09-30)" |
| business.md:12 | Revenue from social row | "about $98.74: IG about $81 (posts and carousels, Alex), FB $17.74; X unknown (10-09); rest $0" |
| business.md:14 | "Not on any measured number" | "Known income beats known recurring cost; unknowns listed in section 3" |
| business.md:68 | "IG bonus / TikTok / Snapchat / Telegram $0" | "IG bonus about $81 (Alex, 09-30); TikTok, Snapchat, Telegram $0" |
| business.md:94 | "$39 needs 2.8M monetized views ... FB covers 45%" | recompute against $98.74 (covers $39 2.5x, $64 1.5x) |

Post-fix check to run on the final report: grep for the dollar-eighteen figure, the phrase "all from" plus "Facebook", and the phrase "reels" plus "earn"; zero hits expected (patterns not spelled out here so this note stays clean under the same grep).

## 7. Limits

- The $0.03 per 1K and the 60-76% qualified share rest on one screenshot and one matched post; treat them as +/- 25%.
- I cannot see which posts made the $81, the payout window, the payout threshold, or why 24-40% of views do not qualify (originality rules are the obvious suspect, not verified).
- Reel $0 is Alex's statement; IG has no earnings API, so it cannot be checked here.
- X, Claude, Verified, Metricool, vidIQ costs and X income are unknown and stay marked unknown.
