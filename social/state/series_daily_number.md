# Series: 🚨 THE DAILY NUMBER (v1, 2026-09-29) — Exp 1 in RULES_REVIEW_2026-09-29.md

**Why:** conversion is our bottleneck (0.4–4 follows per 10K views everywhere), and the only recurring forms that ever converted were numbered/fixed-form ones (own fake-official slide first, "Day five" carousel). The 684 (X 1.36M, Threads 260K/8,279 likes) and Spurs 33-wins (Threads 3.29M) are the same shape: real numbers, one absurd hinge, ends on the number, image that proves it. Make it a franchise: one per day, same look, same slot, numbered.

## Rules
1. **One per day, 13:30 Oslo, X + Threads posted within the same 10 minutes; IG feed carousel same hour.** Numbers are assigned at publication (#1, #2, …) and never skipped. **If there is no true AND funny number, skip the day — never fill.** (A skipped day costs nothing; a #N that flops costs the series.)
2. **Text shape (X/Threads):** line 1 `🚨 THE DAILY NUMBER #N`, blank line, then 2–4 short deadpan lines, last line = the number ("That's 684 points." / "That's one point per charge."). No emoji at the end, no hashtags, no "😭" (Change list #15: no 😭 on 2 of every 3 posts; this series gets none). Never explain the joke. Never say "fans".
3. **Hinge must be ABSURD, not just interesting.** Allowed hinge types: (a) a rule applied literally to an absurd result (684), (b) a literal extrapolation ("if X win all 33 → N points"), (c) a coincidence that makes people say "no way, that's real?" (City 114 = 114), (d) a unit price that lands on an absurd scale (£150m per point). A true fact + contrast is NOT a hinge (Sweden "beat Poland again" was vetoed).
4. **Target = a fanbase millions have feelings about** (City, Spurs, Arsenal, United, Liverpool, Chelsea, Real/Barça, Ronaldo/Messi). Max 1 Spurs post and 1 City post per 3 days (Spurs-only was named a root cause 09-22).
5. **TRUE = two independent sources per input** (one may be the official table / official stat provider), post-cutoff facts especially (today 2026-09-29; PL is paused after matchweek 5 until Sat 10-10, so tables are static until then). Run `social-fact-checker` on the text BEFORE `review.mjs draft`. Sensitive-story rule: sanctions are never stated as fact; hypotheticals say "If" and the image says "Hypothetical".
6. **Image = the proof.** Own graphic (table, receipt, roll of honour) or a CC-licensed Commons photo with the credit drawn on the image. No betting logos in any frame (Maresca photo rejected for the Sky Bet ribbon), no third-party screenshots as the IG slide 1.
7. **IG feed = 3-slide carousel** built by `social/dailynumber.mjs`: slide 1 our own fake-official text card, slide 2 the proof image, slide 3 "Following us takes one second." (+ Follow pill). IG caption one line, never lists slides, never repeats the CTA from slide 3. **IG City veto (day 1 or nothing) applies:** on City-only days (#1, #3) the IG carousel is optional; skip it if PM wants a clean read on IG follows/10K.
8. **Critic:** one `review.mjs draft --platforms x,threads,instagram` per number (the X caption and image are the asset); a separate IG draft only because the IG caption differs. The critic decides PASS/FAIL, not this doc. If FAIL, rewrite once; if it FAILs again, skip the day.
9. **Kill (from Exp 1):** after 5 published numbers, if Threads follows per 10K views < 1.0 AND IG < 1.5, drop the series (keep the hit-conversion routine if it costs < 5 min).

## Tooling (built 09-29)
```
node social/dailynumber.mjs --n 4 --text "body only, no header" --image proof.png --out social/state/media/dailynumber/n04 [--credit "Photo: Author / CC BY-SA 4.0"]
```
Writes `n04_1_card.png`, `n04_2_proof.png`, `n04_3_cta.png`, `n04_text.txt` (the exact X/Threads text incl. header). Proof-image builder for #1–#3 (table / receipt / roll of honour): `social/state/media/dailynumber/build_proofs.mjs`. Photo licences: `social/state/media/dailynumber/src/LICENCES.md`.
X/Threads: attach `n0N_2_proof.png`, paste `n0N_text.txt`. IG: slides 1→2→3.

## Hit-conversion routine (any post > 5× its platform median)
Medians to use until PM replaces them from the trailing 14 days: **Threads ≈ 1.2K views/post, X ≈ 900 views/post, IG reel ≈ 1.5K; IG feed carousel = PM's trailing median.** Check every series post at +30 and +75 min. Trigger = views ≥ 5× median OR likes ≥ 5× median likes.
Within 60 min of the trigger (Editor, ≤ 5 min total):
1. **Self-reply with the follow line** on X and Threads: `One number a day, same time. Following takes one second.` (post-specific variant allowed: `That was #N. #N+1 tomorrow, 13:30 Oslo.`).
2. **Pin** the post (X pin, Threads pin-to-profile; IG pin the comment).
3. **Matching bio line** on that platform for 48 h: `🚨 THE DAILY NUMBER, every day 13:30 Oslo. Following takes one second.` (X ≤160 chars, Threads/IG ≤150; put it before the link CTA, do not delete the /ig link).
4. **Follow-up**: the next day's number goes out on schedule; do NOT post a same-day sequel (a follow-up without its own image does 2K vs 77K — X-42).
5. Log in `social/state/pm/<date>.md`: post id, views at trigger, minute the reply/pin/bio went live.

## How the PM measures it (baselines from RULES_REVIEW_2026-09-29 §1, window 09-23 → 09-28)
Read each morning (Oslo) for the previous day's number; write one row per number in `scoreboard.md` notes and a 5-row table after #5.
| platform | how | baseline to beat | success (Exp 1) |
|---|---|---|---|
| **Threads** | `followers.csv` daily delta (THEV03) ÷ day views (THEV06) × 10K; plus the series post's own views from the Threads API | 0.4–0.6 follows/10K (09-24 +105 on 2.72M; 09-25 +113 on 1.83M); 5-day net +610 = **+122/day** | ≥ +200/day on series days, ≥ 1.0/10K |
| **IG feed** | Graph `follows` on the carousel ÷ its views × 10K; IG net follows/day | typical ≈ 1/10K, best CAR-02 = **4.9/10K** (12 follows on 24.4K); IG net follows 09-20→26 avg **36/day** | ≥ 3/10K per series carousel |
| **X** | Alex's weekly X Analytics export + post URL views/likes (no API; follower count rounded to 0.1K, so every X follow number is an upper bound) | ≲ 1/10K; X ≈ +20/day | ≥ +40/day; series post ≥ 1,500 views (X median ≈ 900) |
Also record for every number: views at +1h/+24h, likes, replies, reposts/shares, the action seen (sends/quotes/arguments — a hit here is replies and reposts, not likes), and whether the conversion routine fired. Compare series days against non-series days, not against the whole month (the 09-21→10-10 international break confounds everything; retest 10-10).

## Candidates #1–#3 (built 09-29, drafts in `social/state/review/drafts/`, all facts checked against ≥ 2 sources 09-29 00:30–01:30 Oslo)
Files: `social/state/media/dailynumber/n01_*`, `n02_*`, `n03_*`.
**#1 Tue 09-29 13:30 — City 114 = 114.** "Mathematically, if Manchester City win all 33 of their remaining games they will finish on 114 points. / They were found guilty of 114 charges. / That's one point per charge."
- Facts: City 15 pts from 5 (P5 W5, GD +8) = Sky Sports table (as of 09-21) + Wikipedia 2026–27 PL table (cites BBC/PL); 38−5 = 33 left; PL resumes 10-10 (Premier League, Yahoo, Man Utd site) so nobody can play before the post; 114 of 115 charges found proven = LADbible (09-25, chairman's statement), Economics Observatory, Newser, Wikipedia (Ornstein). 15 + 33×3 = 114.
- Image: Haaland smirk (CC BY-SA 4.0, Bryan Berlin) over a table strip with `15 + (33 × 3) = 114 PTS` / `CHARGES FOUND PROVEN 114`.
- Action + who: Arsenal/Liverpool/United fans send it to a City mate ("114 = 114 💀"); City fans argue "they'd earn it"; rivals reply "fake?" and get "it's real". Body: schadenfreude + laugh. Beats 684? It is the 684 shape on a proven template (33-wins = 3.29M on Threads) but 4 days after the story, so it loses the "first hour" boost; the coincidence is what earns the send. IG caution above.
**#2 Wed 09-30 13:30 — Spurs £150m per point.** "Tottenham spent £300m+ this summer. / They have 2 points. / That's over £150m per point."
- Facts: "£300m+ war chest" = Sky Sports; "£300m spent, bottom of the table" = Yahoo Sports; PSRwatch £308m gross reported fees; Wikipedia £311.5m. 2 points from 5 (0W 2D 3L, GD −6, bottom) = Sky, ESPN, the table. 300 ÷ 2 = 150. (Net spend is £176m per PSRwatch; the line says spent, which is gross, and the whole press uses £300m+.)
- Image: own till receipt (SUBTOTAL £300m+ / PREMIER LEAGUE POINTS 2 / PER POINT £150m+ / NO REFUNDS). No photo, so no rights or betting-logo issue.
- Action + who: Arsenal and Spurs-rival groups send it; Spurs fans reply with the record/Solanke/DZ arguments; Threads reply-magnet (T-01 got 148 replies). Beats 684? Same three-line shape, unit-price hinge is weaker than a coincidence, but Spurs is our best Threads audience; it is the safest of the three on facts.
**#3 Thu 10-01 13:30 — If City are stripped, United 22 / Liverpool 21.** "If Manchester City are stripped of the 3 league titles won during the 114 charges: / Manchester United: 22 / Liverpool: 21 / Gerrard slips. Liverpool win the league anyway."
- Facts: charges cover nine seasons 2009-10→2017-18 = SI, ESPN, Al Jazeera (LADbible says 2008-17, the outlier); City titles in that window 2011-12, 2013-14, 2017-18; runners-up: 2011-12 United 89 (City won on GD +64 v +56), 2013-14 Liverpool 84 (City 86, Chelsea 82), 2017-18 United 81 = final tables (Wikipedia; SI/StatMuse); titles now United 20, Liverpool 20 = Yahoo Sports, Statista; Arsenal won 2025–26 (ESPN) so nothing else moves. "Never happened in English football" (Economics Observatory) and no sanction decided: the image says "Hypothetical."
- Image: own roll-of-honour graphic (strikethrough City rows).
- Action + who: United and Liverpool fans argue ("22!", "Gerrard didn't slip, he was robbed"), City fans "cope"; Arsenal fans send. Body: ragebait + schadenfreude. Risk: "interesting not funny" if the Gerrard line lands as a recap; fact-checker must accept "won during the charges" wording; not a maths absurdity as strong as #1/#2.

## Idea bank (not built; verified where marked)
- **Win-all-33 table (computed from the 09-21 table, 15+... = pts+99):** Arsenal 111, Brighton 109, Brentford/Leeds/Liverpool/Everton 108, Hull/Newcastle 107, Chelsea 106, Ipswich 105, United/Forest 104, Sunderland/Palace/Villa 103, Bournemouth/Coventry 102, **Fulham 101 = Spurs 101**. Look for the next coincidence with a live number.
- **City: 114 charges over 9 seasons = 342 league games ÷ 114 = exactly one charge every 3 games** (charges 9 seasons per SI/ESPN; arithmetic mine).
- **Villa have won more domestic games at Tottenham's stadium in the past year (3) than Tottenham (2)** — ESPN verbatim; Opta only confirms Villa won their last three visits (single source for the 3-v-2).
- **Spurs 0 wins in 48 games after conceding first (11 D, 37 L, since Nov 2024)** = Sports Mole, ESPN, Sky, To The Lane. Hook for United v Spurs 10-10: "score first". "Spurs' first PL goal came from their 67th shot" = Opta only.
- **Ferran Torres (World Cup final winner, Spain 1–0 Argentina, CBS/NPR) has as many World Cups as Messi (1) and one more than Ronaldo/Haaland/Salah (0)**: needs a check of each player's WC record and it is trivia, not a hinge.
## Killed
- "Tottenham's 485 minutes without scoring = 2.5 Titanics (194 min)": ESPN says 485, Opta says 492 → two numbers, dead.
- Maresca fist-pump photo: source file is 542×874 and the trophy ribbon shows the Sky Bet logo.
- Ronaldo "21 from 1,000": true (979, ESPN/messixronaldo) but no absurd step.
- Man United "first home loss from 2–0 up since 1976": single Wikipedia source, unverified.
- Spurs "unbeaten for the whole break": ties their own 21-day best, logic too fiddly.
- Haaland (5) v Spurs (2): already used (card_haaland38 / c_numbers 02).
