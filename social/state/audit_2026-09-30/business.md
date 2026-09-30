# BUSINESS OUTCOME AUDIT: money and product (read-only) - 2026-09-30 ~02:30 Oslo

Scope: does the social operation serve the business (Ball IQ funnel, money, cost, Alex's hours)?
Tags: [MEASURED] instrument output with source+window - [INFERRED] reasoned from measured inputs - [ANECDOTAL] a quote or one-off.
Nothing was posted, queued, edited or deleted. Prod Supabase (blcisypmngimqkwxrrdm) read-only SQL; Meta Graph / Threads API GET only (tokens read from Keychain inside scripts, never printed). Scripts used live in the session scratchpad (/private/tmp/claude-501/-Users-alexanderbrynolsen-ball-iq/71fad5c5-c7ad-4a4e-a426-ee6d9725cf0d/scratchpad/: ig_links.mjs, ig_daily2.mjs, ig_daily3.mjs, th.mjs, th3.mjs, fbearn2.mjs, corr.mjs).

## 0. Answer first

| Question | Answer |
|---|---|
| Visitors/signups per day attributable to social | NOT MEASURABLE end to end (no instrument records utm/referrer). Every instrument that does exist says ~0: IG bio-link taps 3 in 30d, Threads link clicks 0, no lift on the biggest social days (r ~ 0). Inferred ceiling 0.0-0.3 signups/day, most likely ~1-3/month. |
| Revenue from social | ~$18/month, all Facebook ($17.74 Sep 1-30). X Original Content Rewards $0.00 (first read 10-09). YT/IG/TikTok/Snap/Telegram $0. Ball IQ GBP 0. |
| Cost of the stack | Confirmed: Postiz Team $39/mo, OneUp $25/mo from ~10-05 (trial), FB ad kr 600 (~$55-60). Unknown: Claude, X Premium, Meta Verified, Metricool plan, vidIQ, Socialinsider, Magic Patterns. No ledger exists (money.md asked 09-28, absent). |
| On a path to paying for itself? | Not on any measured number. Cannot tell yet for X (10-09 payout). |
| Levers with a measurable business effect | None on Ball IQ from social. Money: FB RPM flat ($0.0146 -> $0.0139 /1K), X historically $47/wk itemized (2026) but $0 since 07-31. Only visible Ball IQ coincidence: IG profile-view spike 07-20..22. |
| Alex's hours | No time instrument. Proxy: 638 typed messages in 10.5 days, 6-13 h/day "touched". |

## 1. Ball IQ funnel from social

### 1.1 No attribution instrument exists (MEASURED, two routes)
- funnel_events meta keys (30d): surface, native, lang, slug, anon, kind, href, game, ... NO utm/ref/source/referrer key. `href` (629 rows) contains 0 utm/threads/instagram/tiktok/twitter strings. No column in any public table matches source|utm|referr|attrib|campaign|medium|channel (only question_review.source).
- Code: vercel.json redirects /t /ig /tt /x /bs /yt -> /footle?utm_source=<platform>; App.jsx keeps the query string (line ~6581 comment) but nothing writes it anywhere. api/get.js logs get-click to Vercel function logs only.
- Vercel Web Analytics referrers panel: "never opened" (ball-iq-social skill). Clarity: consent-gated in EU since 08-21; weekly read 09-21->28: 406 sessions, sources named = Google, ChatGPT, utm_source=listdle; no social source named. 07-28 read: google 60, balliq.app 9, accounts.google 4, instagram 1, threads 1, reddit 1. A prior auditor's Clarity source query on 09-29 "returned empty". Clarity MCP not callable from this run.

### 1.2 Platform-side link instruments
IG Graph insights, IG business id 17841445120874725, metric_type=total_value:
| window | views | profile_views | website_clicks (bio link taps) | profile_links_taps |
|---|---|---|---|---|
| 09-01..09-30 (08-31->09-30) | 8,034,325 | 12,635 | 3 | 0 |
| 08-01..08-31 | 4,163,925 | 11,287 | 137 (116 on 08-01 alone = artefact: 116 taps on 154 profile views that day; 21 without it) | 2 (EMAIL) |
| 07-02..08-01 | 15,146,775 | 45,160 | 42 | 1 (EMAIL) |
| 06-02..07-02 | 10,096,934 | 17,008 | 17 | 8 (EMAIL) |
Skill baseline (Alex, IG app 07-15): 20 taps / 24,746 visits = 0.081%. API says 17-42 per 30d in Jun-Jul (0.09-0.10%), Aug 21/11,287 = 0.19% (ex-outlier), Sep 3/12,635 = 0.024%.
Bio rewrite (09-23 "Know ball? Prove it" -> balliq.app/ig): 09-23..09-29 = 1 tap (09-25) on 1,185 profile views (0.084%); 09-16..09-22 = 0 taps on 2,473. n=1: cannot tell, and no change vs the 0.02-0.19% band. Taps were already ~0 from mid-Aug (6 taps in the 49 days 08-12..09-29), i.e. BEFORE the rewrite.
Daily series 08-16..09-29 in ig_daily2.mjs output: website_clicks is 0 on 39 of 45 days.

Threads /me/threads_insights?metric=clicks: returns link_total_values for 42 URLs. balliq.app/t = 0, /wa = 0, /footle = 0, footle?utm_source=threads = 0, Play link = 0, App Store link = 1. BUT the response is IDENTICAL for 24h, 7d, 30d, 60d, 90d windows and the no-window call shows 0 for the App Store link -> the metric ignores the window; treat as unreliable (zero-is-suspicious rule). Threads views 30d: 16,864,779 (prev 30d 14,384,628; 07-02..08-01 18,066,393).

### 1.3 Destination-side natural experiments (MEASURED, n=35 days, 08-26..09-29)
- Daily web visitors (distinct visitor_id, non-native, funnel_events after the 08-21 22:10 UTC cutoff): 54-118, mean 65 (08-26..09-01) -> 75 (09-23..09-29), peak ~100 in 09-08..09-20.
- Pearson r: IG daily views vs web visitors 0.02 (same day) / 0.13 (lag 1); vs real signups 0.03 / -0.11. Threads daily views vs web visitors -0.24 / -0.41; vs signups 0.20 / -0.11. Detection power is nil at ~1.7 signups/day, but there is no positive signal.
- Biggest social days: IG 09-03 1.36M views, 09-04 1.11M (web visitors 69 and 85; signups 2 and 1); Threads 09-21 2.45M (83 visitors, 1 signup), 09-24 2.27M (84 visitors, 6 signups: the only high day), X 684 post 09-25 1.36M (69 visitors, 2 signups).
- Only visible coincidence: 07-20..07-22 IG profile views 11,318 / 9,257 / 3,920 (normal ~500), bio taps 3 / 14 / 10, signups 4 / 9 / 8 vs ~2/day on 07-16..07-19. Single event, ~15 excess signups from ~24K profile visits (~0.06%). Consistent with "profile visits are the gate", not proof.
- Google explains ~all web traffic: GSC 535 clicks / 7d (08-31..09-06, memory 09-09; no fresh read) vs 60-118 funnel visitors/day.

### 1.4 The operation is not pointed at Ball IQ (MEASURED)
- posts_log.jsonl (09-28..09-29, 187 rows, 10 platforms): 0 mention balliq/ball iq/footle/quiz/app/download.
- review/verdicts.jsonl: 0 of 130 critic reviews mention Ball IQ/Footle/quiz/app. review/drafts: 0 of 590 files.
- Threads export (1,837 posts, 06-01..09-29): 2 mention Ball IQ/Footle (06-17 "Check out the Ball IQ app now" 3,584 views; 07-19 Footle 1,066 views). text140 truncation makes this a lower bound.
- Governance docs: grep balliq|ball iq|signup|install in A_GRADE_PLAN.md, TEAM.md, pm/DASHBOARD.md, pm/ACCOUNTABILITY.md, scoreboard.md = 0 hits. Five SHQ scheduled tasks (floor manager, PM, morning read, trend sweep, mcp kickoff) = 0 hits for balliq|signup|utm|revenue. Only ball-iq-weekly-clarity-review mentions the site.
- Skill rule "No CTA in a post. Ever." (ball-iq-social/SKILL.md) is why. Bio surfaces: Threads bio links = balliq.app/t, App Store, Play, Telegram, WhatsApp (3 of 5 slots for Ball IQ); X bio clickable = Snapchat, t.me, balliq.app/wa (a WhatsApp redirect) since 09-28 -> no documented Ball IQ landing link on X (audit_2026-09-29/small-platforms.md T3: "saves a slot for Ball IQ"). X profile visits 2.8K/28d (0.05% of 5.3M impressions) is the ceiling of any X bio funnel.

### 1.5 Ceiling arithmetic (INFERRED; inputs measured)
IG: 420 profile visits/day x (0.024%..0.19%) = 0.1-0.8 taps/day; x visitor->real-signup 1.9% (Sep) .. 6.5% (Aug) = 0.002-0.05 signups/day (0.06-1.6/month). X: 100 visits/day; at IG's best band 0.2 taps/day; at a textbook 5% bio CTR (never observed here) 5 taps/day -> <=0.3 signups/day. Threads: profile views not exposed. Total plausible: 0-10/month vs 46 real signups per 28d overall.

### 1.6 Ball IQ funnel itself (MEASURED, prod SQL)
Equal 28-day windows, profiles: A 08-03..08-30 = 123 accounts (120 real, 3 anon); B 08-31..09-27 = 75 (46 real, 29 anon/guest). Real -62%, total -39%. Provider mix similar (google 59 -> 23, apple 48 -> 15, email 13 -> 7); 0 test-pattern emails in either window.
Weekly real signups: wk 08-24 26 | 08-31 9 | 09-07 18 | 09-14 7 | 09-21 12 (Clarity says ~11-13/wk, same). 0 signups on 09-28 and 09-29 (profiles AND auth.users agree; last signup 2026-09-27 15:51 UTC = last username-step-shown; instruments alive: last funnel event 23:56 UTC). P(0 in 2 days | 1.66/day) ~ 4%. No sign-up-attempt event exists, so "quiet" vs "broken" is not distinguishable.
Activation (played anything = scores row or Footle guess>0): Sept real signups 33/44 = 75%; Aug window 68/120 = 57%.
DAU (distinct user_id in scores): 14.7/day (08-26..09-01) -> 21.4/day (09-23..09-29); WAU 40, MAU 79.
Invite loop k(7d): 3 invite signups / 40 active = 0.075 (rooms 24, with guest 4) vs 9/40 = 0.23 (rooms 99, with guest 64) on 08-20 (harness traffic in the baseline; n tiny).
Native funnel: 300-420 rows/day but growth is new instrumentation (dd-shown from 09-07, game-abandon 09-02); first-game-reached native 53 (7d) vs 62 (prior 7d). Native rows are anonymous by design - not a defect.
Baseline memory (08-31) "signups accelerating 21 -> 39 -> 51/wk" is stale/reversed.

## 2. Money in

| source | measured | how |
|---|---|---|
| Facebook content monetization | $17.74 (09-01..09-30), $19.03 over 8 weeks; first nonzero day 08-21; weekly 3.79 / 6.09 / 0.79 / 4.86 / 3.46 (wks ending 09-02..09-30); 1,274,210 media views 30d => $0.0139 per 1K (09-20 baseline $0.0146) | Graph monetization_approximate_earnings, fbearn2.mjs |
| X Original Content Rewards | $0.00 paid, next payout 2026-10-09 | Creator Studio read by Alex 09-29 (memory) |
| X old Revenue Sharing | itemized 2026 periods sum to $1,311.08 (Jan 17 -> Aug 1, 28 wks = $46.8/wk; best fortnight $413.17 May 23-Jun 6); Jul 31 -> Sep 11 three periods "below minimum". Memory's "lifetime $3,250.61" does NOT equal the itemized sum (gap $1,939.53, unexplained: pre-2026 or missing periods) | memory reference_x_original_content_rewards |
| YouTube | $0; 30 subs, 0 gained in 28d; YPP bar 1,000 subs + 10M Shorts views | insights 09-29 |
| IG bonus / TikTok / Snapchat / Telegram | $0; TikTok Creator Rewards N/A (Norway); Snap needs 50K + 15K view-hours; Telegram 3 subs | memory, audit_2026-09-29 |
| Ball IQ | GBP 0; AdSense rejected 2x (resubmit >= mid-Nov); docs/MONEY.md: AdSense ~$13-26/mo at 2.6K pageviews, no design gives meaningful money at this scale | docs/MONEY.md |
| Sponsors/affiliates | 0 sent. outreach/brands_2026-09-23.md: "Nobody has been contacted"; rate card $75 Threads post / $150 carousel / $250 dedicated / $450 bundle; "no public record of any brand paying a football meme account" | file |

Followers 09-23 -> 09-29 (followers.csv): Threads 41,264 -> 42,083 (+819), FB 444 -> 602 (+158, ad live from 09-28), IG 32,547 -> 32,562 (+15), YT 30 -> 30. X ~+10/day (manual), TikTok ~-1/wk. Brief's audience sizes (IG ~30K, Threads ~25K) are the July skill table; Threads is 42.1K.

## 3. Money out (prices and where unknown)
| item | monthly | source / status |
|---|---|---|
| Postiz Team (10 channels) | $39 | Alex 09-27 21:58 "the team 39 dollar postiz one we currently have"; upgraded to 10 ch 09-24; Alex 09-29 14:45 asks whether to cancel |
| OneUp Basic | $25 after trial (~10-05; go/no-go 10-04) | memory reference_oneup_and_chrome_recipes |
| Metricool | UNKNOWN. Public list Starter EUR16 / Advanced EUR43; free = 20 posts/mo. Hit "account limit" 09-29 23:38 after 89 Metricool-routed posts in 2 days | reference_metricool_connector; billing screenshot asked 09-29 16:15 and 09-30 01:04, still owed |
| X Premium (needed for OCR) | UNKNOWN | Alex 09-24 "HAS X Premium" |
| Instagram Meta Verified | UNKNOWN (bio edits blocked on web because of it) | memory |
| Claude | UNKNOWN; Alex 09-28: "paying so much... claude, instagram, x, postiz"; usage limits are a constraint | chat |
| vidIQ | UNKNOWN (150 credits/mo; 65 left, resets 10-15) | socialinsider note |
| Socialinsider | UNKNOWN (0 tracked profiles; write call not approved) | research |
| Mysocial | Free tier; upgrade $49/mo NOT taken | research |
| Magic Patterns, Higgsfield (free), Bright Data ($2 one-off), Exa/Firecrawl | unknown / free | memory |
| FB follow ad | kr 50/day x 12 = kr 600 (~$55-60 at an ASSUMED 10-11 NOK/USD); PM est. kr 2-5 per follow, "borderline", decision Wed 09-30 | HANDOFF.md, pm/2026-09-29.md |
| Ball IQ infra (shared) | ~$35-55 | docs/MONEY.md |
Confirmed recurring social stack: $39 now, $64 if OneUp kept, vs $17.74 income: FB covers 45% of Postiz alone, 28% of Postiz+OneUp. Break-even at FB's RPM: $39 needs 2.8M monetized views/mo (2.2x now), $100 needs 7.2M (5.6x). The FB ad: kr 600 ~ 3.2x the whole month's FB revenue; FB revenue per follower ~ $0.03/mo, so kr 2-5/follow ($0.19-0.48) pays back in 6-16 months only if every FB dollar were follower-driven (it is not; Reels non-follower reach is ~90% of views per 09-20 baseline).
Ledger: social/state/money.md does not exist (RULES_REVIEW #28; saydo.md item 3.6 "never-scheduled").
Stack consolidation research 09-29: "Combined ~ $100+/mo; consolidating saves ~$64/mo (Postiz + OneUp)".

## 4. Alex's attention (proxy only; no timesheet exists)
Session transcript 71fad5c5...jsonl, messages with origin.kind=human: 638 from 09-20 08:41Z to 09-30 00:14Z (Oslo +2), i.e. 61/day. Days: 09-20 54, 09-21 59, 09-22 22, 09-23 84, 09-24 48, 09-25 33, 09-26 58, 09-27 110, 09-28 97, 09-29 67. Distinct 30-minute blocks per day containing >=1 message: 12, 22, 12, 26, 19, 13, 14, 14, 24, 22 (6-13 h/day "touched", >=91 h in 11 days; an upper bound on effort, a lower bound on presence). Excludes phone time (X hand-posts, TikTok native, Snapchat, IG collabs). A_GRADE_PLAN adds: X 4-6 originals + 20 replies/day, TikTok 1 native/day, metric pastes at 12:00/18:00/22:55, weekly IG collab. Alex 09-28 21:44: "we're both putting in so much effort... stagnant and regressing... demotivated".
Original goals (Alex): 09-20 100K FB + 100K YT by Christmas, $1,000/wk each (baseline note), "promoting Ball IQ a little bit"; 09-23 "have these socials pay my rent and... my parents' loans"; 09-27 "1 million followers before 2027 at all costs, life or death"; 09-29 reframe "healthy growth, A grade every platform" (no revenue/Ball IQ criterion in A_GRADE_PLAN).

## 5. What is NOT the problem
- Views/reach: Threads 16.9M and IG 8.0M views in 30d; more of it does not move the business (r ~ 0).
- Bio wording: tap rate 0.02-0.19% under three different bios (old App Store CTA, Aug, "Know ball? Prove it"). The gate is profile visits (0.15% of views).
- Ball IQ activation improved (57% -> 75%).
- FB RPM anomaly is not new ($0.0146 -> $0.0139) and the audience is premium (UK 71%); Meta's own notice blames watch time + originality.
- Native anonymity (by design). Pre-08-21 funnel rows (contaminated; cutoff applied).
- DAU is up (14.7 -> 21.4), not dying.

## 6. Data gaps
No utm/ref capture; Vercel Analytics referrers unreadable here; Clarity API not callable; GSC last read 09-09; App Store Connect / Play Console installs and get-click logs unreadable; Threads clicks metric unreliable; X analytics manual; TikTok analytics null; costs of Claude/X Premium/Meta Verified/Metricool/vidIQ/Socialinsider/Magic Patterns unknown; Alex's real hours unmeasured; whether the 09-28/29 zero signups is quiet or broken; X 10-09 payout; NOK/USD assumed.
