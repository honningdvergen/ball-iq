# EXPERIMENT 3: CRITIC BLIND BACKTEST, RESULT (2026-09-29)

Run by the critic-backtest agent. Read-only apart from this folder. Nothing posted, scheduled, deleted, edited; no Chrome. `.claude/agents/banger-critic.md` was NOT edited (recommendations only, section 6).

## 1. Verdict in five lines
1. **Rubric A (current full definition) FAILS the pre-registered rule and trips the kill condition.** It PASSED **3/12 hits** (need >=8) and 2/12 flops (need <=4). Kill rule was "<6/12 hits passed => downgrade critic from gate to advisor on X and Threads (hard-fail categories stay hard)": **triggered.** It BLOCKED 9 of 12 known hits, including the 3.29M Threads post (T-01), the 1.43M Ramos post and the 840K hairstyles post.
2. **Two of A's 3 hit-passes are not blind:** the definition itself quotes the 684 card as its model post (P13, P18), and the critic said so. Excluding them A passes **1/10** hits.
3. **Rubric B (FIRST QUESTION only) is clearly better at ranking, not at calling.** Spearman vs real views **+0.77** (bracket) / +0.80 (P(50K+)), AUC hit-vs-flop **0.88** (0.93 on X+Threads only) versus A's overall score: Spearman +0.27, AUC 0.69. But B **never once forecast 50K+** (0/12 hits placed there), exact-bracket accuracy is only **6/24 (25%)**.
4. **B's "within one bracket" number (21/24 = 87.5%) passes the pre-registered >=60% rule but is not evidence of skill:** the outcomes are bimodal (12 in 50K+, 9 in <1K, 3 in 1-5K, **0 in 5-50K**), so a constant "5-50K" guess scores 15/24 = **62.5%** and also "passes". The rule needs a discrimination metric; use AUC / Spearman / exact-bracket, not within-one.
5. **Do not treat any of this as final:** n=24, extremes only (top and bottom of our own lists), several confounds (section 7). It is enough to say the 8/10 gate as written is more likely to block a hit than to catch a flop on X/Threads, and that "action + P(50K+)" ranks better than "score >=8".

## 2. Design as run
- 24 posts: 12 hits (T-01, T-02, T-03, T-05, T-06, T-07, T-08, T-09, X-40, X-41, X-43, FB-01) and 12 flops. **The pre-registered flop list resolves to only 11 IDs** (X-50..54 = 5, T-20..22 = 3, FB-05..07 = 3). **Substitute 12th flop: our Facebook reel "Everton fans waking up to the City news" (LIBRARY_video.md: OURS-02, 54 FB views; same reel 2.4K on IG), shown as FB-OURS02.** All 23 other IDs resolved directly to their library entries and images.
- Blinded packet (`BLIND_PACKET.md` + `img/P01..P24.jpg`): shuffled with fixed seed 20260929; per post only platform, exact text, cropped screenshot (footer with likes/replies/timestamp cut off with ffmpeg; header with our handle left), neutral clip description for video, posting time (Oslo) and a neutral one-line context. No numbers, no library commentary. Answer key separate: `ANSWER_KEY.json` / `ANSWER_KEY.md`. Critics worked from a copy of the packet in the scratchpad, so the key was never in their working folder; both transcripts show Read calls only on the packet md + images.
- Critic A: `banger-critic` subagent, its full current definition, told to skip the "Read before judging" file reads (the libraries contain these exact posts and outcomes), not to run review.mjs or write anything. Critic B: **general-purpose agent, NOT a banger-critic instance** (deviation from the brief: a banger-critic instance carries the full definition as its system prompt, so a "FIRST QUESTION only" run would not have been clean). It got the FIRST QUESTION section verbatim and nothing else, plus base rates (X ~1-2K, Threads ~1-5K, FB reels ~30-100 views) and the bracket task. The two critics never saw each other's output. Raw outputs: `critic_outputs/`.

## 3. Per-post table (hits first, by real views)
| Post | Platform | Real views | Real bracket | A overall | A verdict | A deciding criterion | B bracket | B P(50K+) |
|---|---|---|---|---|---|---|---|---|
| T-01 (P12) | Threads | 3,290,000 | 50K+ | 7 | FAIL | Originality 5 ("Mathematically" template done to death) | 5-50K | 15% |
| T-02 (P14) | Threads | 2,700,000 | 50K+ | 8 | PASS | Joke 8 (frame delivers it) | 5-50K | 15% |
| T-03 (P03) | Threads | 1,430,000 | 50K+ | 7 | FAIL | Timing 4 (old incident, no live hook) | 5-50K | 12% |
| X-40 (P13) | X | 1,360,000 | 50K+ | 9 | PASS | Joke 9 (684 hinge) | 5-50K | 30% |
| T-05 (P07) | Threads | 840,000 | 50K+ | 4 | FAIL | Clarity 3 (anonymous homework) | 5-50K | 12% |
| X-43 (P06) | X | 781,000 | 50K+ | 7 | FAIL | overall <8 (thin target) | 1-5K | 5% |
| X-41 (P22) | X | 380,000 | 50K+ | 7 | FAIL | Originality 5 (template maths) | 5-50K | 15% |
| T-06 (P20) | Threads | 373,000 | 50K+ | 5 | FAIL | Clarity 4 (needs homework) | 1-5K | 6% |
| T-07 (P01) | Threads | 295,000 | 50K+ | 7 | FAIL | Joke 5 (ragebait, no joke, no live story) | 5-50K | 10% |
| T-08 (P09) | Threads | 261,000 | 50K+ | 6 | FAIL | Joke 5 (fact list, veto test caps at 6) | 5-50K | 12% |
| T-09 (P18) | Threads | 260,000 | 50K+ | 8 | PASS | Joke 9 (684 card) | 5-50K | 20% |
| FB-01 (P17) | Facebook Reel | 78,577 | 50K+ | 5 | FAIL | Joke 5 (generic amateur men) | <1K | 1% |
| X-51 (P19) | X | 1,400 | 1-5K | 4 | FAIL | Clarity 3 | 1-5K | 4% |
| X-54 (P23) | X | 1,400 | 1-5K | 4 | FAIL | Clarity 3 | 1-5K | 4% |
| X-52 (P21) | X | 1,100 | 1-5K | 5 | FAIL | Stopping power 4 | 5-50K | 12% |
| X-53 (P16) | X | 559 | <1K | 8 | PASS | Joke 7, live story | 1-5K | 4% |
| T-22 (P11) | Threads | 513 | <1K | 3 | FAIL | Joke 2 (pure stat) | 1-5K | 3% |
| X-50 (P24) | X | 498 | <1K | 6 | FAIL | Stopping power 3, Timing 3 | 1-5K | 6% |
| T-21 (P15) | Threads | 355 | <1K | 4 | FAIL | Stopping power 2, Joke 2 | 1-5K | 4% |
| T-20 (P08) | Threads | 257 | <1K | 6 | FAIL | Stopping power 3 (text only) | 1-5K | 3% |
| FB-OURS02 (P10) | Facebook Reel | 54 | <1K | 8 | PASS | Timing 9, Joke 8 | <1K | 2% |
| FB-06 (P05) | Facebook Reel | 34 | <1K | 7 | FAIL | overall <8 | <1K | 2% |
| FB-07 (P02) | Facebook Reel | 27 | <1K | 6 | FAIL | Originality 5 | <1K | 2% |
| FB-05 (P04) | Facebook Reel | 26 | <1K | 6 | FAIL | Originality 4 | <1K | 1% |

## 4. Scoring against the pre-registered success rule
**Rubric A (gate at overall >=8, no criterion <6)**
| Metric | Result | Rule |
|---|---|---|
| Hits passed | **3/12** (X-40, T-09, T-02) | need >=8: **FAIL** |
| Flops passed | 2/12 (FB-OURS02, X-53) | need <=4: met |
| Kill rule (<6/12 hits) | triggered | downgrade to advisor on X and Threads |
| Hits passed excl. the two 684 posts named in the definition | 1/10 | (not blind otherwise) |
| Spearman(overall, real views) | +0.27 (X+Threads only, n=19: +0.48) | (no rule; >=0.3 was the forecast target) |
| AUC, overall score separates hit from flop | 0.69 (X+Threads only: 0.81) | |
Score resolution: A scored five hits at exactly 7, three at 8 or 9, and four at 4-6, so 8 of 12 hits sit at >=7. Post-hoc only (tuned on the same 24, do not adopt without retest): a gate at >=7 would pass 8/12 hits and 3/12 flops, which would meet the rule. The failure is mostly the height of the bar and a few criteria, not the direction of the ranking.

**Rubric B (FIRST QUESTION only, action + bracket + P(50K+))**
| Metric | Result | Rule |
|---|---|---|
| Within one bracket | 21/24 = 87.5% (hits 9/12, flops 12/12) | >=60%: nominally met, but trivial baseline 62.5% (see verdict 4) |
| Exact bracket | 6/24 = 25% | none set |
| Spearman(bracket, views) / (P(50K+), views) | +0.77 / +0.80 | >=0.3: met |
| AUC hit vs flop, P(50K+) | 0.88 (X+Threads only: 0.93) | none set |
| Top-5 by P(50K+) (X-40, T-09, T-01, T-02, X-41) | 5/5 hits | |
| P(50K+) >=12%: hits / flops | 8 hits / 1 flop (X-52) | |
| Bracket 50K+ ever predicted | **0 of 24**; all 12 hits under-forecast | forecast under-calls the top |
| Which hits B missed by 2+ brackets | FB-01 (called <1K, real 78.6K: Facebook base rate I supplied did it), X-43 (1-5K), T-06 (1-5K) | |
B's decision rule from the brief: forecasts "<=40% within one bracket => drop the score" is NOT triggered on within-one, but exact-bracket is 25%, so keep the ranking (P or rank), do not trust the bracket labels as absolute numbers.

## 5. Which hits A would have BLOCKED, and the criterion that did it (quoting the critic's decision)
| Hit (real views) | A overall | Failing criterion (critic's words) |
|---|---|---|
| T-01 Spurs 33-games maths, Threads (3.29M) | 7 | "Originality 5. The 'Mathematically' template is done to death, and the hinge is milder than the 684 card." |
| T-03 Ramos VAR (1.43M) | 7 | "Timing 4. It is an old incident with no live hook, and the copy explains the joke." |
| T-05 three terrifying hairstyles (840K) | 4 | "Clarity 3. The hair crops are anonymous homework." |
| X-43 Baguette Adama Traore (781K) | 7 | "Overall under 8... the target is thin and the 'new signing' hook is weak." |
| X-41 Spurs 33-games maths, X (380K) | 7 | "Originality 5. Same as P12: template maths with a mild hinge." |
| T-06 "I'm crying" pointing grid (373K) | 5 | "Clarity 4. The four-player pointing grid needs homework and has no anchor." |
| T-07 Yamal ragebait question (295K) | 7 | "The joke 5. It is ragebait with no joke, and there is no live story." |
| T-08 Dortmund receipt list (261K) | 6 | "The joke 5. It is a fact list with a twist, so the veto test caps it at 6." |
| FB-01 Tottenham vs Aston Villa slapstick reel (78.6K) | 5 | "The joke 5. The clip is generic amateur men." |
Blocking-criterion tally over the 9: Joke (3), Originality (2), Clarity (2), Timing (1), bare overall-below-8 (1). The two "Originality" blocks are the sharpest error: the critic penalised our own best format (the maths-card template) as overused, the opposite of what the library says works. The Joke/Clarity blocks are the known "too harsh on evergreen receipts, pattern-spot grids and ragebait-with-a-card" pattern in RULES_REVIEW section 3 (T-05, T-06, T-08, T-07 are all ones the review predicted).
False passes (2): FB-OURS02 (timing 9, "fanbase schadenfreude vessel") and X-53 (joke 7, "dry callback on a live story"), both riding the City verdict; note the FB one is a 54-view result on a page where about 7% of reels escape, so no rubric would call it.
Where A was right: it FAILED the four text-only posts (T-20 6, T-21 4, X-50 6, X-51 4) and the stat-only Ronaldo post T-22 (3); on X+Threads the ranking separates (AUC 0.81) even though the threshold is set too high.

## 6. Recommended rubric edits for `.claude/agents/banger-critic.md` (recommend only, not applied)
1. **Replace the opening stance.** Delete "You are NOT the author's friend. Most drafts should FAIL. A quiet day with 2 great posts beats 10 filler posts." Replace with: "A false FAIL costs a missed hit (our top 12 posts did 260K to 3.3M views; our bottom 12 did under 1.5K). A false PASS costs one flop, which costs us almost nothing. Judge each draft on its own merit; there is no target pass rate."
2. **Make the FIRST QUESTION the scorer, not a preamble, on X and Threads.** Replace "PASS needs overall >= 8 AND no criterion below 6" with: "For X and Threads, output: ACTION (SEND / COMMENT / LAUGH-REACT / none) + WHO, then a view bracket (<1K, 1-5K, 5-50K, 50K+) and P(50K+) as a whole percentage. PASS = ACTION is not 'none' AND P(50K+) >= 10 AND no hard-fail. Record action, bracket and P(50K+) in --why." (B ranked with AUC 0.88 / 0.93 on X+Threads and put 8 of 12 hits and 1 of 12 flops at P>=12.) Keep the six 0-10 criteria as advice for the FIX line only, not as gates.
3. **Lower the floor.** If the 8-point gate is kept anywhere, change to "PASS needs overall >= 7 and no criterion below 5" (post-hoc, 8/12 hits, 3/12 flops on this data, retest on the shadow sample before adopting).
4. **Originality criterion (fixes T-01/X-41 blocks).** Replace "6. Originality. Not already done by us ... and not a weak copy of what everyone posted 6 hours ago." with: "6. Originality. Same PREMISE already posted by us today or by a big account in the last 6 hours = low. Re-using a PROVEN FORMAT (absurd-maths card, broadcaster lower-third screenshot, receipt list ending on the knife, 'Never forget when...' twist) is NOT a penalty; those are our best formats."
5. **Timing criterion (fixes T-03, T-08, T-05 blocks).** Add: "Evergreen receipts and callbacks that need no live story (transfer-fee lists, lower-thirds, 'Never forget when...', hairline crops) score 7 on Timing. Below 6 only for a trend card older than 3h, a day-3-plus news follow-up, or a joke that needs a story the viewer has not seen."
6. **Clarity criterion (fixes T-05, T-06 blocks).** Add: "Clarity is below 6 only if a half-following viewer cannot tell what the post is ABOUT. An absurd image that makes people ask 'what am I looking at?' and guess (hairline crops, a grid of four players doing one gesture) is a Threads PASS anchor, not homework."
7. **Joke criterion and the veto test (fixes T-07, T-08).** Add two anchors to the ALEX LIKES list: "a ragebait question with an arguable comparison card (Yamal v Ronaldo Nazario) = COMMENT action, PASS on Threads" and "a receipt list whose last line is the knife (Dortmund sold five stars for big fees, Haaland for 60m) = LAUGH/COMMENT, PASS". Amend the VETO TEST: "'Interesting' caps at 6 only if no COMMENT/SEND action can be named; an arguable comparison or a knife-last list names one."
8. **Facebook reels: stop gating on the critic.** On FB the outcome was binary (26-54 views vs 78K on a 500-follower Page) and neither rubric separated the reels (A: FB-01 hit scored 5, flop FB-OURS02 scored 8). Replace the FB check with the library checklist (clip acts out the line, audio punchline or universal slapstick, moves in second 1) and count tickets (Exp 5).
9. **Test hygiene.** Remove named test-set posts from the definition (the 684 card is quoted in "Who we are"; it made P13/P18 non-blind). Keep a held-out set of 10 unseen hits and flops for every future backtest, and log each verdict with action + bracket + P(50K+) in posts_log at post time (RULES_REVIEW section 3 change 2).

## 7. Caveats (read before acting)
- **n=24, extremes only:** hits are the top of our list (78K to 3.29M), flops the bottom (26 to 1.4K), and the 5-50K middle is empty. Discrimination on extremes overstates discrimination on the real day-to-day draft stream; the 7-day shadow forecast (n>=40) is the real test. Neither AUC has a meaningful confidence interval at this size.
- **Duplicates:** X-40/T-09 are the same card, X-41/T-01 the same card, on different platforms, so 4 of 12 hits are two posts each. A "hit" that shows up twice moves the counts (and both maths posts were scored highly by B and low-to-mid by A).
- **Views are not follows or quality:** the library itself says X-43 (781K) had a 0.2% like rate and that T-06 could not be decoded. Excluding those two, A still passes only 3/10.
- **Confounds between hits and flops:** 8 of 12 hits were posted 21-25 Sep (Spurs-bottom and City-verdict days, Threads pushing maths posts to non-followers at scale) while 8 of 12 flops were posted 26-28 Sep (international break, night-of-match posts), and 4 flops are Facebook reels with a 26-54 view floor. Format and topic are confounded with date and platform reach. Text-only vs image also splits: all four text-only posts are flops.
- **Blinding is imperfect:** the critics saw posting times and one neutral context line (e.g. "reported about 50 minutes earlier", "day 3 of the story"), which is real timing information but also a partial tell. A's definition names 684, the Sweden example and the Alex-likes anchors. B was given base rates per platform, which by itself pushed every FB reel to <1K (right for the 11 FB flops, wrong for FB-01).
- **Variants are not like-for-like:** A outputs integers 3-9 with heavy ties (26 of 27 earlier live PASSes were also exactly 8); B outputs percentages. B is a different agent type from A (general-purpose, not banger-critic). A single run each: no repeat to measure critic noise.
- The pre-registered forecast success rule ("within one bracket") is weak on a bimodal outcome distribution; use AUC/Spearman/exact-bracket next time.
- Hit/flop calls come from our library entries (Metricool/API/manual), X numbers are manual screenshots; nothing here was re-pulled today.

## 8. Files
- `BLIND_PACKET.md`, `img/P01..P24.jpg` (packet), `ANSWER_KEY.json` / `ANSWER_KEY.md` (key), `critic_outputs/A_full_rubric_banger-critic.md`, `critic_outputs/B_first_question_only.md`, `RESULT.md` (this file).
