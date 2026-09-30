# SPEED AND NEWSJACKING LATENCY AUDIT (specialist notes)
Written 2026-09-30 ~02:45 Oslo (UTC+2). READ-ONLY: nothing posted, queued, scheduled, deleted or edited. Only files written: this file and speed_data/fresh_pull_2026-09-30.json (raw Graph/Threads read).
All times Oslo (UTC+2) unless marked Z. "measured" = read from an API, a file or a transcript timestamp. "inferred" = my reading.

## 0. Bottom line
1. The City verdict miss was a DETECTION failure, not a production failure. Story t0 = 17:51 Oslo (earliest tweet found), Guardian article 18:05:21 (16:05:21Z, per benchmark_timing.md), Sky 18:07, BBC 18:09. Nobody in the operation started until Alex asked at 23:08: 5h17m after the first tweet, 5h03m after the Guardian article (80% of the 6h22m-6h36m to publish). Once started, the pipeline produced a critic-passed, scheduled carousel in 18.6 min.
2. The team's own story clock was wrong: posts_log `broke`, the critic prompt ("~2h old") and the draft `--broke 21:30` all say the verdict landed at ~21:30. It landed 3h39m earlier. The stale-news test was run on the wrong age.
3. Every detector was blind: breaking.mjs not running on 09-29 (and its scorer would not have fired: real verdict headlines score 1-3 vs threshold 6), trend sweep at 18:31 wrote "nothing else fresh", floor manager 18:20/19:35/20:30/21:45 never mention the statement, the Radar was never built.
4. On match nights the tooling is fast (event to chat line median 92 s) and formats with pre-approved lines or own cards beat 30 min (5-11 min measured). What fails is the gate: none of the ~10 live X lines sent to Alex on 09-29 was posted by the operation (posts_log shows 0 in-game X posts; Alex's own phone posts are unlogged and unreadable, so his count is unknown). Alex said "you can post it" at 20:56 and "post on x" at 22:20; both times the critic FAIL (4-6/10) held the line.
5. Being late does cost reach on scoops and on 2nd-order restatements, but the data is mixed: the same account got 260K Threads views at +54 min and 373K at +271 min on 09-25; two Threads posts PRE-positioned 4-5 h before the verdict collected ~150K views after it, while every reactive post made 3-6.6 h after got 1.4-2.6K. Pre-positioning beat reacting.

## 1. Sources (all read-only)
- social/state/posts_log.jsonl (187 rows, 09-28 14:46 to 09-30 01:36), pm/board.md, pm/ACCOUNTABILITY.md, pm/floor_2026-09-29.md, pm/POSTING_LEDGER.md, review/verdicts.jsonl, matchwatch.json, postiz_calls.log, breaking_seen.json, breaking.mjs, matchnight_2026-09-29_x_lines.md, matchkit_2026-09-28_*.md, sweeps/2026-09-29-pm.md.
- audit_2026-09-30/quality_data/ig_threads_pull_17d_2026-09-30.json and competitor_sweep_2026-09-29.json (other auditors; IG `taken_at_unix`).
- Session transcript 71fad5c5-...jsonl (timestamps of chat lines, tool calls, critic hand-backs). Helper scripts in the session scratchpad: tx.py, tools.py, durations.py.
- ESPN summary API (public): site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=<id> keyEvents[].wallclock = ground-truth event times (401861092, 401861084, 401861091 tonight; 401861081, 401861080, 401861077 on 09-28; 401861073, 401861066 on 09-27/26).
- Twitter snowflake decoding: ms = (id >> 22) + 1288834974657. Validated on our own Yamal repost 2105056631172342021: decodes to 22:06:25Z = 00:06:25 Oslo, matching Postiz scheduled 22:06:00Z.
- cdn.syndication.twimg.com/tweet-result?id=<id> (public single tweet: created_at, likes).
- Graph API (IG, FB page) and Threads API read via Keychain tokens (never printed) -> speed_data/fresh_pull_2026-09-30.json (104 Threads, 52 IG, FB posts since 09-24; pulled 02:17 Oslo).
- Web: Reuters, Sky Sports, premierleague.com statement page, CNN (Ornstein tweet id 2103480016915009611), via firecrawl search.

## 2. Clock traps in the data (each one silently changes a latency by 2 h or more)
- posts_log `at` = when the row was WRITTEN (UTC), not when the post went out. Example: IG Zidane/Gyokeres carousel row at 23:35, `scheduledFor` 23:24 (past), actually published 23:36:28 per Graph.
- `scheduledFor` mixes formats: Postiz rows are UTC with Z (e.g. 20:40:00Z = 22:40 Oslo); Metricool rows are naive Oslo local (e.g. 2026-09-29T23:38:00 = 23:38 Oslo). Reading Metricool naive strings as UTC is off by 2 h.
- `broke` is a hand-typed HH:MM from the Editor. It is wrong for the City verdict (21:30 typed, 17:51 real). It is only present on 30 of 187 rows.
- Draft IDs (e.g. 09291857_671ce) are UTC (18:57Z = 20:57 Oslo).
- No row has an event timestamp with a source, and ACCOUNTABILITY.md has no saw-to-post minutes column filled (commitment #9 unmeasured).

## 3. THE CITY VERDICT, 09-29 (t0 = 17:51:24 Oslo)
### 3.1 Ground truth
| time | source | what |
|---|---|---|
| 15:41:31 on 09-25 | snowflake of Ornstein tweet 2103480016915009611 | scoop (114 of 115 guilty) |
| 15:08 on 09-29 | ESPNUK tweet 2104921155325050962 | "Sources say Man City knew of guilty verdicts in the summer" |
| 17:51:24 | JacobsBen tweet 2104962254227550479 | first tweet found with "BREAKING: The Premier League c..." |
| 17:58 | FabrizioRomano 2104964053994995969 (164K likes) | |
| 18:07 | Sky Sports article "Tuesday 29 September 2026 17:07, UK" | official statement published |
| 18:09:38 | BBCNews 2104966844557783136 | "Man City guilty of all financial breaches, PL confirms" |
The `broke 21:30` in posts_log / critic prompt has no source anywhere; 21:30 is 3h39m after the first tweet (3h25m after the Guardian article). Independent cross-check: benchmark_timing.md (another auditor, own pull) also puts the statement at ~16:05Z = 18:05 Oslo (Guardian first-published 16:05:21Z, BBC 16:07Z, Goal 16:22Z), gets 6h22m to our IG carousel and 5h19m from statement to first draft, and independently found four blind watchers. Use 18:05 as the conservative t0 if you want one number: detection to Alex's ask 5h03m, to first draft 5h19m, to publish 6h22m.
### 3.2 Who posted when (lag from 17:51:24)
X (>=6K-like tweets found by the session's x.com search): Brighton_arg +33 min (22.9K likes), SkyNews +46 (54K), TheHateCentral2 +51 (16K), Shednotty +71 (18.8K), Chester_17 +74 (13.8K), xGPhilosophy +87 (21.3K).
IG competitors (competitor_sweep_2026-09-29.json, `taken_at_unix`, each account's newest 5-8 posts):
| lag | account | format | likes / plays |
|---|---|---|---|
| +54 min | anfieldcentral | single "BREAKING" | 530 likes |
| +78 | thatguysjokes | 4-slide carousel | 43.1K |
| +98 | thatguysjokes | video | 58.7K / 945K plays |
| +120 | thatguysjokes | video | 36.9K / 449K plays |
| +133 | rivalsbanter | 13-slide "Part 4" | 13.6K |
| +164 | thatguysjokes | video | 19.5K / 261K |
| +166 | footy.rn | 7-slide | 6.2K |
| +201 | midnitefootball | video | 1.2K / 22K |
| +212 | thatguysjokes | 4-slide | 31.2K |
| +259 | simptv | carousel | 3.5K |
| +279 | thatguysjokes | video | 9.0K / 125K |
Also thatguysjokes posted a City "little transfer ban" take at 17:15 (36 min BEFORE t0) = 20.3K likes.
Of 13 IG accounts sampled, none posted about the verdict within 30 min of the first tweet (earliest +54 min, and that was a 530-like single). Winners sat at +78 to +120 min.
Ours: Threads "BREAKING: City were informed in JULY..." 21:00:44 (+189 min, not in posts_log, origin unverified, likely Alex from the phone; 2,582 views), IG carousel 00:27:05 (+396 min), FB reel 00:31:01 (+400 min). X: nothing in posts_log; Alex's hand posts are unlogged (gap). Three generic pre-scheduled posts ran through the news hours: Threads 17:33 'Big Six wedding ranking' (933 views), X 18:30 Forest fact, Threads 19:30 Forest (961 views); the schedule did not yield to the news.
### 3.3 Where the 396 minutes went (measured, tool-call and Graph timestamps)
| stage | from | to | min | share |
|---|---|---|---|---|
| nobody detects / decides | 17:51:24 | 23:08:18 (Alex: "carousel content from trending posts from tonight, now") | 316.9 | 80% |
| Editor starts, sweeps IG competitors + tweet fetch + dedupe + build (Chrome-driven) | 23:08:18 | 23:24:01 draft | 15.7 | 4% |
| critic v1 FAIL 6 (betting logo, child in frame, caption listed slides) | 23:24:01 | 23:25:13 | 1.2 | |
| re-cut + critic v2 PASS 8 | 23:25:13 | 23:26:22 | 1.2 | |
| FB reel build + 7 slide uploads + Metricool createScheduledPost | 23:26:14 | 23:26:57 (IG) / 23:28:07 (FB) | 0.7 / 1.9 | |
| ask to scheduled | 23:08:18 | 23:26:57 | 18.65 | 5% |
| self-imposed scheduler lead time | 23:26:57 | 23:38:00 slot | 11.05 | 3% |
| Metricool "account limit" rejected the 23:38 IG and 23:50 FB posts; nobody checks | 23:38 | ~00:04 (found from Alex's screenshot; promised 23:40 check had no timer) | 26 | 7% |
| Postiz path: rebuilt without 2 repeat slides; 25/h Postiz call cap blocked create until 00:26:28 | 00:04 | 00:27:05 published | 23 | 6% |
Postiz call log: 24 logged calls in the trailing hour at 00:05:07 (cap 25); the next posts:create succeeded at 00:26:28, exactly when the 23:26 upload calls aged out. Metricool posts need Postiz-hosted image URLs (pz upload), so slide uploads (7 slides = 7 calls, twice) drain the same 25/h budget.
Ask to publish = 78.8 min; t0 to publish = 395.7 min (377 min from BBC 18:09).
### 3.4 The detectors that should have fired (measured)
- breaking.mjs (Google News Romano/Ornstein relays, BBC, Guardian, Sky, ESPN; exits on a story to wake the session). Last launched 09-28 20:00:19 with --max 10800 (3 h); breaking_seen.json mtime 09-28 22:50:38; no launch in the main transcript on 09-29; no process now. Offline replay of its own score() on real headlines with MIN=6: BBC "Man City guilty of all financial breaches, PL confirms" = 1; Sky "Man City charges verdict: Club found guilty of all charges related to serious breaches..." = 3; Athletic "Manchester City found guilty on almost all Premier League charges" = 1; Ornstein-source headline = 2. VERBS has no "guilty", no "confirms" (only "confirmed"), no "statement". So even running, it would have stayed silent on the biggest story of the week.
- Trend sweep 18:31-18:55 (WebSearch only): "Nothing else fresh"; called the Pochettino quote "dead unless a fresh beat lands" 40 min after the statement.
- Floor manager reports 18:20, 19:35, 20:30, 21:45 (floor_2026-09-29.md): "Nothing live that matters" / graded the Threads City post's views without noting the news; none mention the PL statement.
- board.md (16:47) planned "City sanctions scoop (Ornstein/Romano) quote-tweet 20-120 min" and Pochettino "stale by tonight". It anticipated a sanctions scoop; the official verdict arrived 64 min after the board was written and was not on it.
- Radar: TEAM.md promised a Radar script; saydo audit 3.1 confirms none exists (board written by hand).
- Grep of all sessions for "found guilty / independent commission" 17:30-23:05 Oslo: zero mentions in the Editor session; one in the 18:32 trend-sweep session (Pochettino quote only).
### 3.5 Pre-positioning effect on Threads (measured views, inferred cause)
| post | published | views at ~18:35 (trend sweep) | views now (02:17) |
|---|---|---|---|
| "Proper punishment for Manchester City" list | 12:44:33 | 19.5K (16.9K at 18:20 floor) | 103,896 |
| "THE DAILY NUMBER #1" (City 114 = 114 charges; Alex deleted the X copy ~14:30 as stale) | 13:42:51 | 3.5K | 71,991 |
Floor-manager series for the first post: 16.9K (18:20), 29.9K (19:35), 44.7K (20:30), 62.5K (21:45), 101.0K (01:40). Together ~+153K views arrived after the statement on posts published 4-5 h before it. Reactive Threads post at +189 min: 2,582. Inference: the verdict re-surfaced posts already on the topic; not proven, no hourly series before 18:20 for Daily #1. (Views/hour on the first post: 3.0K/h pre-statement vs ~10K/h after.)

## 4. THE 09-25 SCOOP, the clean early-vs-late pair (t0 = 15:41:31 Ornstein tweet)
| lag | platform | post | result |
|---|---|---|---|
| +44.0 min | IG carousel 16:25:34 | "It's actually happened. The Athletic's David Ornstein reports..." | 36,246 views, reach 22,662, 1,012 shares, 4 follows |
| +51.3 min | X 16:32:47 (snowflake) | "Everton were deducted 6 points for one breach. City found guilty of 114. That's 684 points." | 77,808 likes (public syndication read 02:xx) |
| +53.8 min | Threads 16:35:16 | same maths joke | 259,935 views, 8,279 likes |
| +42.8 min | Threads 16:24:16 | "It's actually happened. Manchester City found guilty..." (news restatement) | 446 views |
| +58.0 min | IG carousel | "Man City's lawyers beat one charge out of 115" | 17,134 views, reach 10,136 |
| +77 to +88 | IG reels x3 / Threads videos x3 | fan-reaction videos | IG 1.8K-6.3K views; Threads 515-722 |
| +164 | IG carousel | Arsenal fans think Arteta has three titles | 25,085 views, reach 14,314, 12 follows |
| +210.7 | Threads | the 684-points joke posted AGAIN | 2,116 views (0.8% of the original) |
| +262 | Threads | "Haaland speaks on the City news" | 37,275 views |
| +271 | Threads | "I'm crying" (topic unverified) | 372,717 views |
Reading: the news restatement at +43 min got 446 Threads views; the maths joke at +54 got 260K; a 373K hit landed at +271. On Threads, hit vs flop was decided by the hook, not by latency. On IG the first City carousel (+44) got 2.2x the reach of the second (+58). n is small, topics not controlled.
The 09-29 repeat of the same story: Threads +189 min 2.6K; IG +396 min 1,373 views / reach 548 at 1.8 h age (immature); X none logged.

## 5. MATCH NIGHTS
### 5.1 09-29 live lane: event to chat line (ESPN wallclock vs the Editor's message to Alex)
Yamal 2' 20:47:56 -> 20:49:28 (+92 s); Hendry red 11' 20:57:07 -> 20:58:33 (+86); Rodriguez 12' 20:58:08 -> 20:59:24 (+76); Sulc red 25' 21:10:24 -> 21:11:39 (+75; Alex texted first at 21:11:08, +44 s); Beljo 28' 21:14:33 -> 21:16:07 (+94); Pubill 31' 21:17:07 -> 21:18:21 (+74); Gordon 47' 21:50:15 -> 21:51:41 (+86); Elvedi 55' 22:00:01 -> 22:01:33 (+92); Yamal 63' 22:07:40 -> 22:09:38 (+118); Kane 69' 22:12:43 -> 22:14:24 (+101); Amdouni 82' 22:26:28 -> 22:28:22 (+114); Williams 89' 22:33:20 -> 22:35:45 (+145). n=12 goals/reds: median 92 s, range 74-145 s. matchwatch polls ESPN every 20 s and exits on change; the Editor must relaunch it each time (25 launches 09-29, 32 on 09-28).
### 5.2 What became of those lines
- 20:56:53 Alex: "you can post it" (Yamal 2' line). 20:57:45 critic FAIL 5. 20:58:02 Editor: "I haven't posted it... I won't push it through without your override." Goal to Alex's OK = 9 min, to no post.
- 22:20:04 Alex: "i suggest you post on x, i can not be asked posting ... i do not care about the risk". 22:21:57 critic FAIL 4/5/6 on the three queued lines. Nothing posted.
- The lines went to Alex in chat before any critic verdict (A_GRADE_PLAN section 9 says none may), then the critic failed them afterwards.
- X posts tonight: Yamal hero 22:40 (+32.3 min after his 2nd goal, image carried our own tweet card = defect, deleted 00:03, reposted bare 00:06:25). The ACCOUNTABILITY board line "no post within 30 min of any 20:45 moment" is right: first in-game own post = Threads Modric 22:03:46 = +49.2 min after the 28' equaliser (+46.6 after Pubill).
- Post-match: Scotland IG carousel 22:47:50 = +9.2 min after SCO FT (22:38:35) / +10.9 after ENG FT; FB slideshow reel 22:50:22 (+11.8). No England post at all (hero draft FAIL 5, "every 22 minutes" dropped).
- Dead zones on a day rated BIG: Threads 19:30:24 -> 22:03:46 (2h33m), IG 14:52:57 -> 22:41:28 (7h48m), FB last photo 15:28:14 -> 21:47:22 (6h19m; last video reel 14:45:56, 7h01m) spanning the verdict and kick-off. Alex 21:40: "same mistake as yesterday".
### 5.3 09-28 (Nations League) and 09-27: what ≤8 min looked like
| moment (ESPN wallclock) | our post (Graph/Postiz time) | lag | result (mature) |
|---|---|---|---|
| Kayode 3rd goal TUR-ITA 21:12:29 | Threads 21:18:53 / X sched 21:18:27 | +6.4 / +6.0 min | Threads 16,651 views; X ~1,300 |
| Olise 88' BEL-FRA 22:37:01, FT 22:43:23 | Threads 22:44:43 / X 22:44:37 | +7.7 from goal, +1.3 from FT | Threads 11,472; X ~1,000 |
| same | IG Olise carousel 22:51:50 | +14.8 from goal, +8.5 from FT | 3,467 views, reach 1,969, 0 follows |
| Gyokeres 72' SWE-POL 22:15:57, FT 22:37:31 | Threads 23:00:28 / X 22:59:55 | +44.5 from goal, +22.9 from FT | Threads 1,344; X ~1,000 |
| same viral Zidane sprint (Olise goal) | IG Gyokeres/Zidane carousel 23:36:28 | +59.5 from goal | 6,999 views, reach 5,333, 34 shares, 1 follow |
| same | IG reel 00:09:24 / FB reel 00:08:20 | +92 | IG 2,240 views |
| Ramos winner 09-27 POR-NOR 22:01:34 | six Threads text posts 22:04-23:02 (first +2.5 min) | | 287-1,466 views each |
Why 09-28 was fast: the lines were PRE-WRITTEN conditional drafts from the matchkit (13:40-14:30; "France win, any score (FT <=10 min)"; "SWE-POL Sweden win") with facts and a photo plan, critic-passed before the whistle (Belgium PASS 8 at 22:39:55, before FT 22:43:23). Why 09-29 was slow: the pre-match file (matchnight_2026-09-29_x_lines.md) was generic 2-8 word reactions ("Calm down. It's Czechia.") with no fact or hinge; live-built lines failed 4-6/10.
Serial queue: Sweden's line went out 23 min after FT because the single Editor session was building the Belgium IG carousel first (22:44 -> 22:52).
Schedulers publish on time: Postiz 6-33 s after slot (Threads), Metricool 28-50 s (IG/FB), one Threads via Metricool +2m46s (Modric 22:01 -> 22:03:46).

## 6. CAN A FORMAT BEAT 30 MIN WITH TODAY'S TOOLS? (measured minutes)
| format | measured | verdict |
|---|---|---|
| Threads/X/Bluesky one-liner or image with a PRE-APPROVED conditional line | 6.4 and 7.7 min (09-28) | yes |
| Same, improvised live | 32-49 min (Yamal, Modric), or never (7 lines killed by critic) | no, unless the critic bar for live lines changes |
| IG single hero image from a hero pool | 5.0 min from Alex's go (22:36:26 -> 22:41:28); 33.8 min after the goal because the trigger waited for FT | yes |
| IG own-card carousel post-match | 9.2 min after FT (Scotland) | yes |
| FB slideshow reel from that carousel | +3 min after IG; carousel2fb 9-19 s build | yes |
| IG sweep carousel from real tweets/competitor slides | 18.65 min ask -> scheduled (Chrome sweeping 13.5 min of it) | yes if triggered on time; the 3 h was trigger + scheduler failure |
| Video/clip reaction reels (what won on IG on verdict day: 945K and 449K plays at +98/+120) | pipeline cannot cut footage | no |
| Native-audio reels / TikTok (Alex phone) | TikTok day-1 test video never went out | no, Alex-dependent (he said 12:38 he will not always be available) |
| YouTube Highlights | parked | no |
Stage costs (measured): FAST critic 15-24 s per call on 09-29 22:36-22:43 (verdict hand-back 60-85 s on the City draft); tool builds 2-19 s each; uploads 2-6 s each normally, ~40 s each at 00:07 during quota stress; Metricool needs 5-11 min lead (Editor's choice 22:42 -> 22:47 and 23:27 -> 23:38).

## 7. DOES BEING LATE COST REACH? (small n, mixed)
- Yes, strongly, at the extreme: 396 min after t0 the IG carousel had 1,373 views / reach 548 at 1.8 h age (immature but far below the ~5-13K daily median), Threads +189 min 2.6K.
- Yes, on IG for the first hour: 09-25 IG City carousels +44 min reach 22.7K vs +58 min 10.1K.
- No, on Threads: 09-25 hits at +54 min (260K) and +271 min (373K); +43 min news restatement 446 views. 09-28 Threads: +6 and +8 min = 16.7K and 11.5K; +45 min = 1.3K (same template, but team size differs: confounded).
- No, on X in our 3 09-28 posts: ~1.0-1.3K whether +6 or +44 min (views are round numbers from a manual read; n=3).
- IG post-match carousels at almost identical lag (ESPN FT vs Graph time): 09-24 Germany-NED 1-1 (FT 22:42:29) carousel 23:08:34 = +26 min: 88,271 views, reach 56.8K, 1,622 shares; 09-24 Portugal-Wales (FT 22:38:42) carousel 23:03:35 = +25 min: 65,841 views; 09-25 France-Turkiye (FT 22:45:30) carousel 22:54:34 = +9 min: 40,392 views; 09-28 Olise carousel +8.5 min after FT: 3,467; 09-29 Scotland carousel +9.2 min after FT: 1,528 (3.5 h old). Same lag, 12-60x spread in views: on IG the hook/format and account state decide, latency does not.
- Competitor evidence: the verdict-day winners landed +78 to +120 min, not first; likes on thatguysjokes fell from 58.7K at +98 to 9K at +279. Fixed-schedule aggregators post match stories 15-20 h late and still get 3-16K likes (itsfootybants 8 carousels in 3 days at ~14:30/16:30/18:30, median 7.3K likes; "Ronaldo benched" posted 15.8 h after FT; ftblmemeshub 3 fixed "Morning/Afternoon/Evening" posts, median 4.7K). Our IG feed median is 197 likes (n=119, 17 days). Follower counts not in the data, so this is a scale comparison, not an apples-to-apples one.
- Net: speed pays on scoops (09-25: +44 to +54 min produced our best IG/Threads/X of the fortnight) and is table stakes only inside ~2-3 h of a mega story. The 30-min target is stricter than what competitors need on IG; the real defect is detection latency of hours, and reacting instead of pre-positioning.

## 8. OTHER OBSERVATIONS
- The saydo audit row 4.23 says no x.com Chrome activity after 12:39. The transcript shows a Claude-in-Chrome `navigate` to https://x.com/search?q=(city OR "man city" ...) min_faves:6000 at 23:16:35 and reads of results through javascript_tool (browser_batch 23:16:35, 23:16:54). Alex's rule (memory + A_GRADE_PLAN) is no Chrome automation on x.com. Reported as a process/policy observation, not as speed.
- IG feed-post likes for our 09-29 evening posts are young: Yamal 3.6 h, Scotland 3.5 h, City 1.8 h at read time.
- A Threads post appeared at 02:13:26 ("Oh dear Manchester City are so heavily in the mud"), source unknown, while I was writing.

## 9. Commands run (read-only)
ls/cat/grep of the files above; python parsers over posts_log.jsonl, verdicts.jsonl, the 17-day pull, competitor sweep, postiz_calls.log (epoch ms to Oslo); curl to site.api.espn.com scoreboard/summary; curl to cdn.syndication.twimg.com/tweet-result for ids 2105056631172342021, 2104966844557783136, 2103480016915009611, 2103492920380723696; one syndication timeline call (429 then 200; returned an old top-tweets subset, unusable for recency); node script (scratchpad pull_fresh.mjs) reading Threads/IG/FB with Keychain tokens, output to speed_data; node offline replay of breaking.mjs score() regexes; firecrawl_search for the PL statement and Ornstein story. No POST/DELETE, no postiz, no tg.mjs, no enforce/review/verify commands, no Metricool tool, no browser.

## 10. Per-platform event-to-post minutes (from posts_log slots and Graph times; mirrors are logged slots only, publish not verifiable)
09-28 Belgium-France (Olise goal 22:37:01, FT 22:43:23):
| platform | our slot / publish | min after goal | min after FT |
|---|---|---|---|
| X (Postiz) | 22:44:37 | 7.6 | 1.2 |
| Threads | 22:44:43 (Graph) | 7.7 | 1.3 |
| Bluesky, Telegram (Postiz, same call) | 22:44:37 | 7.6 | 1.2 |
| IG carousel | 22:51:50 (Graph) | 14.8 | 8.5 |
| YouTube Short (Metricool slot) | 23:02:00 | 25 | 18.6 |
| Snapchat (OneUp, logged) | 23:58 | 81 | 75 |
| IG reel / FB reel / TikTok (Metricool) | 00:08-00:09 | 91-92 | 85 |
09-29 tonight (in-game 20:45-22:37 and after):
| platform | in-game own posts | post-match | note |
|---|---|---|---|
| Threads | 22:03:46 Modric (+49.2 min after equaliser) | 22:42:11 Yamal (+34.5 after 2nd goal), 21:00:44 unlogged City post | Threads last post before: 19:30 |
| IG | none | 22:41:28 Yamal, 22:47:50 Scotland carousel (+9.2 FT) | |
| X | none | 22:40 Yamal (+32.3 after goal, card defect, reposted 00:06:25) | |
| FB | 21:47:22 England iceberg reel (not tied to an event) | 22:50:22 Scotland reel (+11.8 FT) | |
| Bluesky, Telegram, TikTok, YouTube, Snapchat | none logged | none logged | no rows in posts_log after 18:45Z tied to tonight |
