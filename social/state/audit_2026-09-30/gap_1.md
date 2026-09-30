# GAP 1: CRITIC + GATE CALIBRATION DELIVERABLE (2026-09-30, ~12:00 Oslo, read-only)

Files written: this note, `gap_1_calibration_set.csv` (745 labelled rows), `gap_1_calibration.py` (rebuilds the CSV and prints every number below; run `python3 gap_1_calibration.py` from this folder). Nothing posted, queued, edited or scored through review.mjs. All inputs are files already on disk (backtest_2026-09-29, ig_data, quality_data matured pull 10:58, verdicts.jsonl, deleted.md, taste.jsonl, banger-critic.md, review.mjs, gate.mjs, preflight.mjs, review-guard.mjs).

## 0. Bottom line
1. **The 09-29 rubric is NOT validated. No blind measurement of it exists.** The only measured recall belongs to the rubric it replaced: 3/12 known hits passed (25%, 95% CI 9-53%; 1/10 if the two items whose model card is quoted in the definition are dropped). The rewrite was tuned on the same 24 items it is judged on, and its text now quotes four of the backtest hits as PASS anchors (Yamal v Nazario ragebait card = T-07, Dortmund knife-last list = T-08, hairline crops = T-05, four players one gesture = T-06). Re-running the 24 on today's rubric would be contaminated by construction.
2. **Nearest thing to a measured recall for the current X/Threads rule** (action not "none" AND P(50K+) >= 10): 9/11 X/Threads hits passed = 82% (CI 52-95%), 1/8 flops passed (CI 2-47%). It is in-sample (threshold picked after seeing the 24), came from a general-purpose agent with only the FIRST QUESTION text and platform base rates, not from a banger-critic instance, and 9 of 11 is 7 of 9 once the two duplicated cards are collapsed (78%, CI 45-94%). Treat as a hypothesis.
3. **The rule for IG carousels, reels and everything else (overall >= 7, no criterion < 5) has zero labelled IG hits behind it.** Applied to the old-rubric scores of all 24 backtest items it passes 7/12 hits, 3/12 flops. Instagram posts/carousels are the only place IG pays (~$81/month, Alex fact 1/5), so this is the uncalibrated lane that matters most for money.
4. **A held-out set that no rubric edit ever touched already exists and is big enough: the 425 IG feed posts (08-17 to 09-26), 51 hits at reach >= 25K vs 374 non-hits, with all 425 slide-1 thumbnails on disk.** Those 51 hits carry 61% of the period's IG views (money) and 78% of attributed follows (growth), so one set calibrates both. Nobody has scored it with any critic version. That is the test to run (section 5).
5. **Provisional, stated plainly:** ~12 known hits with critic-scored outcomes (10 unique premises, all but one posted 09-21 to 09-25 on Spurs/City story days). Any threshold set from them is provisional until the held-out run passes. The gate-era items with a verdict and a matured outcome (24 joined, 7 with shadow forecasts) carry too little information to calibrate anything.
6. **Split the gate.** Hard gates only for rules whose justification is not "predicts views" (hard-floor content, repeat, our-own-tweet-card on X, caption lists slides, capacity/render sanity). Every taste rule (0-10 criteria, VETO/BODY/WHO-CARES, STALE-NEWS, P(50K+) line, window/emoji quotas) becomes advisory-with-logged-override until it passes the pre-registered test in section 5. Reasoning and per-rule evidence in section 4.

## 1. What is measured today (every figure reproduced by gap_1_calibration.py)
| Rubric / rule | Set | Result | Status |
|---|---|---|---|
| OLD gate: overall >= 8 and no criterion < 6 | blind backtest, 24 (12 hits, 12 flops) | hits passed 3/12 (25%); flops passed 2/12 (17%); AUC of the overall score 0.69 | measured; retired |
| FIRST QUESTION forecast, ranking only | same 24 | AUC 0.88 on P(50K+) (0.93 X+Threads); Spearman +0.80; exact bracket 6/24; **0/12 hits forecast at 50K+** | measured; ranks, cannot call magnitude |
| CURRENT X/Threads rule (action + P(50K+) >= 10) | same 24, X/Threads only (11 hits, 8 flops) | hits 9/11, flops 1/8; same at P >= 8; P >= 12 gives 8/11 and 1/8; P >= 15 gives 5/11 and 0/8 | in-sample, non-blind, not the banger-critic instance |
| CURRENT reels/carousel/other rule (>= 7, no criterion < 5) | old-rubric scores of the same 24 | hits 7/12, flops 3/12 | in-sample; criteria were re-worded after |
| CURRENT rubric run as the real banger-critic | anything | **not run** | unmeasured |
| Gate-era outcome join (published Threads+IG with a verdict, matured 10:58) | 24 posts | pooled rho -0.04 first / 0.00 final; Threads only n=10 rho +0.78/+0.66 (p 0.026), +0.61 without DN#1 | confounded: all five 8s are the maths-card template on story days |
| Shadow forecasts vs outcome (matured) | 7 Threads posts | exact bracket 2/7 (constant "1-5K" guess gets 3/7); mean P 14% vs 1/7 realised | n=7 |
| Adherence to the P rule | 18 verdicts with numeric P on X/Threads/IG since 09-28 22:56Z | verdict equals (P >= 10) in 18/18; PASS values 10,10,10,12,12,14,15,15,30 (5 of 9 sit at 10-12); FAIL values 2-7, none at 8-9 | the verdict is a deterministic function of a self-reported P clustered at the line |
| Alex agreement | taste.jsonl | 8 rows, all "yes", 0 "no" | cannot compute; his known "no"s (Sweden, DN#1, own-tweet card) were never logged |

The first two rows and the last row of the backtest are the only genuinely blind numbers in the repo. Everything on the CURRENT rubric is either in-sample or unmeasured.

## 2. The calibration set (named, with n and contamination status)
File: `gap_1_calibration_set.csv`, columns set / id / platform / ts_utc / format / outcome_metric / outcome_value / label / label_source / blind_status / note.
| Set | n | Labels | Blind status for the CURRENT rubric |
|---|---|---|---|
| S1_backtest_blind | 24 | 12 HIT (78K-3.29M views), 12 FLOP (26-1.4K). 11 X/Threads hits + 8 X/Threads flops; 1 FB hit + 4 FB flops (one of them the substitute Everton reel) | CONTAMINATED (rubric quotes 4 of the hits; thresholds chosen on these 24; 2 duplicated cards, so 10 unique hit premises; hits clustered 09-21 to 09-25; middle 5-50K empty). Keep as a regression test only |
| S2_ig_feed_heldout | 425 | 51 HIT (reach >= 25K), 374 NONHIT; slide-1 format tag (tweet-screenshot proxy vs photo-led); views, follows in note | HELD-OUT. Caption text of 2 of the 51 hits appears in research files (socialinsider/mysocial pulls): drop them or flag; 49 clean hits. Thumbs: `verify_repro_ig_photoshift/thumbs/<id>.jpg` (425/425) |
| S3_threads_pull | 283 | 19 HIT50K, 20 HIT10K, 36 FLOOR (<300 views), 208 MID; includes DN#1 = 170,167 views at +21 h (66,661 at +12 h, 1,483 at +1 h) | Held-out except the backtest T-items (flagged in the CSV); posts under 24 h old are still maturing |
| S4_alex_labelled | 13 | Alex NO / YES / pulled, with the critic verdict and the outcome next to it | UNBLINDABLE: the critic definition contains these catches. Use as acceptance examples, not as a metric |
S4 in one line each: Sweden stat (Alex NO, critic 8, Threads 1.3x: critic wrong, Alex right); DN#1 (Alex NO on X, critic 8, Threads 170K: Alex's X call not confirmed or refuted, X result never read); Gyokeres/Zidane carousel (critic FAIL 5, Alex YES, IG 1.04x median: average); Yamal own-tweet-card and Pochettino no-critic drafts (process breaches, not taste); 5 pre-publish pulls (no counterfactual).
**Two label axes must stay separate.** OUTCOME (views/reach) tells whether the gate blocks hits; ALEX-TASTE tells whether it matches the brand. They disagree at least once on the biggest post of the gate era (DN#1). Do not merge them into one "good/bad" column, and do not treat an Alex "no" as a "flop" label.
Missing labels to collect: Alex yes/no on ~30 items (he has logged zero "no"s), X per-post views for X items (manual only), IG follows for reels (not exposed).

## 3. What a HARD gate would have cost, measured on the held-out sets (base rate in brackets)
IG feed 425 (hit = reach >= 25K; base 12.0%): caption-lists-slides BLOCK fires on 10 posts, blocks 2/51 hits (4%), hit rate when fired 20%. IG overnight window fires on 7, blocks 1/51. Caption contains a 😭 (the enforcer's quota target): 46 posts, 12/51 hits (24%), hit rate 26%, i.e. the opposite of a penalty. Caption <= 40 characters: hit rate 7.4%; >= 200 characters: 25.6% (directional; format-confounded; peers post ~440 chars vs our ~75). Slide-1 tweet screenshot: 8.1% vs photo-led 14.3%.
Threads 283 (hit = >= 10K, base 13.8%; and >= 50K, base 6.7%): outside the 08-22 Oslo window blocks 4/39 and 1/19 (the 1.21M Bellingham quote posted 22:48 Oslo; the tier-2 exception would have let it through only on a matchday-file day). TEXT posts: 1/39 and 0/19 hits. VIDEO: 1/39 and 0/19. 19 of 19 posts >= 50K are IMAGE type. A 🚨 marker: 13/39 hits (33%), hit rate 37% vs 13.8% base, so the STALE-NEWS test's target marker is positively associated with hits, and its only labelled firing (DN#1) hit 170K on Threads. More than one 😭: 6 posts, 3 are >= 10K.
Reading: mechanical hygiene rules cost 2-10% of hits and the fix is a caption edit, so a false block is cheap. Taste rules blocked 9 of 12 known hits (old rubric) and the STALE-NEWS rule was written from a +1 h read that captured 1% of DN#1's eventual reach.

## 4. Hard vs advisory (recommendation; provisional)
Rule for the split: a rule is HARD only if (a) the harm is asymmetric or Alex has said it twice, AND (b) the fix is mechanical or the cost of a false block is one edit. A taste rule can become hard only after it clears section 5, with at least 30 held-out hits and an upper-bound miss rate <= 20% (rule of three: zero misses on 15 hits is the minimum evidence; with 12 known hits none qualifies).
| Rule | Where it lives today | Class | Evidence |
|---|---|---|---|
| Hard floor: slurs/discrimination, deaths/tragedy, life-threatening injury, minors/private individuals, invented quotes/facts, unverified crimes stated as fact, betting brands (Kalshi/Stake/blaze), sexual content, broken render | critic prompt + gate.mjs (brands by name only) + human look at contact sheet | HARD | 0 false blocks in 130 verdicts (7 FAILs cite fact/quote risk); asymmetric harm; recall unmeasurable (no OCR, image logos need eyes) |
| Repeat slide/media (dHash) | gate.mjs (Postiz door) + review-guard (Metricool door, added 09-30 01:08) | HARD | Alex said it twice; prevented the Endrick/Bluesky doubles; zero cost measured |
| Our own tweet card as image on X | preflight.mjs only (`.card` marker) | HARD, but move into a door | Alex 09-29; Yamal post deleted 00:10; fix = bare photo |
| Caption lists/explains slides (numbered >= 3 lines, "in one swipe") | preflight.mjs only | HARD, but move into a door | Alex cut it 09-28; blocks 2/51 IG hits, fix = edit caption |
| Scheduler blocked / Postiz quota / status ERROR | preflight.mjs + verify/watch | HARD | operational; the 09-29 night failure |
| Empty caption, silent video, double audio, IG carousel > 10 | gate.mjs | HARD | mechanical |
| A verdict exists for the exact caption within 36 h | review.mjs hasPass, review-guard | HARD (existence + no hard-floor flag only) | process guarantee; note it keys on caption text only, so it does not cover media |
| 0-10 criteria (stopping, joke, clarity, timing, platform fit, originality) | critic prompt | ADVISORY (FIX line) | old gate blocked 9/12 hits; criteria re-worded after; unmeasured now |
| P(50K+) >= 10 as PASS line (X/Threads) | critic prompt | ADVISORY: rank drafts, log P, "HOLD for one rewrite" then Editor may override with a logged reason | AUC 0.88 ranks; 0/12 calls 50K+; threshold in-sample; P clusters at the line |
| >= 7 and no criterion < 5 (IG carousel, reels, Snapchat, TikTok, YT) | critic prompt | ADVISORY | zero IG hits behind it |
| VETO / BODY / WHO-CARES tests | critic prompt | ADVISORY | Sweden agreed with Alex; DN#1 did not |
| STALE-NEWS test (timing cap 3, FAIL) | critic prompt (added 09-29 ~13:50) | ADVISORY; keep only a mechanical "slot older than N hours" warning | built from a mis-read; 🚨 posts hit 37% vs 13.8%; DN#1 = 170K on Threads; X outcome unread, so Alex's X call is untested, not refuted |
| Facebook reel gate on score | critic prompt | already not gated on score; keep checklist as advisory | outcomes binary (26-54 views vs 78K); scores of 7 beat 8 (median 2.9x vs 0.8x FB median, n=12) |
| IG overnight ban 00:30-09:00; Threads 08-22 window | preflight.mjs | SOFT (warn, needs a stated reason) | blocks 1/51 IG hits; 4/39 Threads hits incl. one 1.2M; hit rate outside 5.9% vs 13.8% |
| 😭 quota, hashtag ban on X/Threads | preflight/enforce | 😭: drop (IG hit rate 26% vs 12%); hashtag: hard (1 of 283 Threads posts, cost nil) | measured above |
| Coverage floors (coverage.mjs MAX_GAP_H) | coverage.mjs | not a quality gate; out of scope here | see strategy/quality notes |

## 5. Pre-registered pass/fail test (run once, do not edit the critic between scoring and reading the result)
**Protocol.** Build a packet from `gap_1_calibration_set.csv` S2: 49 clean hits + 49 non-hits matched to the hits by week and slide-1 format (reach < median 3,989), plus the bottom quartile (reach < 2,414, n~106) as a second flop set if budget allows. Packet shows slide-1 thumb + caption + weekday/time only: no reach, views, follows, likes, date-of-outcome or handle counts. Critic runs as the real `banger-critic` definition with its "Read before judging" file reads disabled (as the 09-29 backtest did), records action + bracket + P(50K+) + overall, and does NOT call review.mjs verdict (write results to a scratch file). Score once; then a second pass over 20 random items for stability. Repeat on S3 (19 HIT50K vs 36 FLOOR, thumbnails from the Threads pull) as a secondary check. Keep S1 as a regression check only.
**Pass criteria (all on S2 unless stated).**
| # | Metric | Pass | Why this number |
|---|---|---|---|
| T1 | Recall on hits (PASS under the stated rule) | >= 70% AND Wilson lower bound >= 55% (>= 36 of 49) | the gate's whole job is not to block the 12% of posts that carry 78% of follows |
| T2 | AUC, P(50K+) or overall vs hit label, matched non-hits | >= 0.75, permutation p < 0.05 | the ranking is the only demonstrated skill (0.88 in-sample) |
| T3 | Flop rejection on the bottom quartile | >= 40% rejected | if it rejects fewer, the gate is decorative and only the ranking is useful |
| T4 | Stability (same 20 items scored twice) | <= 10% verdict flips | critic noise is unmeasured; 7 of 9 FAIL-at-7 assets flipped inside 6 minutes on 09-28 |
| T5 | Alex agreement on 30 items he labels yes/no (include the 13 S4 rows) | >= 80% | needs his labels; currently 0 "no"s exist |
| T6 | Calibration of P(50K+) (Brier or bucketed hit rate) on >= 40 forecasts | P>=10 bucket realises within 10 points of stated P | today n=7 |
**Outcome rules.** T1 fails: the numeric PASS line stays advisory permanently for that platform and the critic's job is ranking which drafts to build first. T1 passes but T3 fails: keep as a "do not queue below P=5" floor only. T1, T2 and T3 pass on IG: promote the numeric line to a hold-and-override gate for IG posts/carousels; state n and CI in the verdict header. T2 passes on IG but not on Threads (n=19): report Threads as provisional. Anything passing on S2 still counts as provisional until re-run on the next 30 days of forward data (`shadow` forecast logged at post time, read at +48 h, never at +1 h).
**Budget.** 98 items at 15-85 s per critic item (the audit's measured range) is roughly 25-140 min of critic time; the 106-item flop set adds about the same. Alex is worried about token spend, so run the 98-item matched packet first and stop there if T1 fails.
**Forward-data fix (needed for any of this to become non-provisional).** Log at post time: post id (Threads/IG media id, not the Postiz id), action, bracket, P(50K+), overall, verdict; read outcomes at +48 h only. Today posts_log has metrics on 13 of 189 rows, no Threads/IG ids, and 7 of 22 gate-era Threads posts (57.8% of gate-era Threads views, including the 132K punishment list and the 80K Ronaldo/Messi post) have no verdict and no log row, so the biggest posts are invisible to any calibration.

## 6. Code and rubric disagree (found while reading; nothing edited)
1. `social/review.mjs` line 95 still refuses `--verdict PASS` with `--score` < 7, while for X/Threads the rubric says the score is advice and PASS is decided by action + P(50K+) >= 10. A critic that follows the prompt must invent an overall >= 7 to record a PASS. The critic's `description:` field also still says "PASS (>=7/10)". That is why scores 7-8 dominate: 183 of 183 scored posts_log rows are 7 or 8.
2. verdicts.jsonl has no structured fields for action, bracket, P(50K+), so the shadow forecast lives in free text (24 rows carry a parseable P; the PM cannot join outcomes without regex). Add `--action --bracket --p50k` to the verdict record.
3. `.claude/hooks/review-guard.mjs` header comment says PASS "(>=8/10)"; the code does not check the number (fine), the comment is stale and misleads the next reader.
4. `preflight.mjs` holds the four newest hard rules (own tweet card, caption lists slides, windows, capacity) but is an optional CLI; `gate.mjs` and `review-guard.mjs` are the enforced doors. Until the two hard rules in section 4 are in a door, "hard" means "if Claude remembers to run it" (audit lead F4/OPS-8, consistent with what I read).
5. `banger-critic.md` is +57/-7 lines uncommitted with 8 dated "binding" blocks; no version is pinned to any verdict, so a verdict cannot be traced to the rule text it was issued under. Commit it and stamp a `rubric_version` on each verdict.

## 7. Corrections and caveats
- quality.md's "DN#1 66,661 views" is superseded: 170,167 at 10:58 (curve +1 h 1,483; +7.5 h 7,448; +12 h 66,661; +18 h 122,040; +21 h 170,167).
- Hit counts: the matured pull has 19 Threads posts >= 50K and 39 >= 10K (the 01:40 pull said 18).
- "Recall" here is pass rate on known hits, not proof of prediction: hits are defined by outcome, and 8 of 12 backtest hits ran on the same two story days.
- Alex's instincts are right mostly on X; the only X item in S4 where outcome contradicts him (DN#1) has no X number. Do not treat his "no" as a flop label, and do not treat the 170K Threads number as proof his X call was wrong.
- IG hit label is reach >= 25K (follow driver). Alex's money is qualified views at about $0.03 per 1K; hits also carry 61% of the period's feed views (4.73M of 7.76M), so the label serves both, but reach is not the paid metric.
- The CSV S1 rows carry the old-rubric score and B forecast in the note column; S2/S3 rows have not been scored by any critic.

## 8. Grep targets for the report
Named set: `S2_ig_feed_heldout` (n=425: 51 hits vs 374; 49 clean) + `S3_threads_pull` (n=283) + `S1_backtest_blind` (n=24: 12 hits) + `S4_alex_labelled` (n=13). Measured recall on known hits: old rubric 3/12; current X/Threads rule 9/11 in-sample, non-blind; current IG/other rule 7/12 in-sample on old scores; current rubric as the banger-critic: not measured.
