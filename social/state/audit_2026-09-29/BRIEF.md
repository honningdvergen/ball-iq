# FAT AUDIT BRIEF — Shithousery HQ, 2026-09-29 (Alex + Claude captain)

## Why
Alex (09-29 12:30): "we have 9-10 social platforms, how do we make sure we succeed at all of them… we are going blind… failed post after failed post, Threads posts on 0 likes with 40K followers, some can never be repeated. YouTube completely dead, always been. Instagram needs to do way better, Bluesky dead, no idea on the new ones… we have been doing incredibly bad since Friday… I am tired of slight tweaks and failing. We need BIG changes… exponential growth within our voice and genre. Is it just the international break?"
Goal (binding): 1M followers all platforms by 2027-01-01 (stretch). Testable target: 500–900 net/day (today ≈ +130–170/day). Money pressure: socials must pay back (X Original Content Rewards first payout 10-09; FB pays ~$0.007/1k views; brand deals/affiliates later). Voice: football HUMOUR/satire/banter brand (not news), ragebait/fanbase mockery welcome, no discrimination. Audience UK+EU first, US growing, Asia interest. Alex is in Norway (TikTok Creator Rewards N/A).

## Platforms (followers ≈ 09-29)
X 45.3K · Threads 41.9K · Instagram 32.6K · TikTok 16.2K · Bluesky 1.3K · Facebook Page 0.57K (ad kr50/day) · YouTube 30 · Telegram/WhatsApp/Snapchat ≈0 (new 09-28) · schedulers: Postiz (social/pz), Metricool, OneUp (trial ends ~10-05).

## Known facts (verify, don't repeat blindly)
- Views do NOT convert: follows per 10K views FB ≈7, Threads ≈4, IG ≈1.4, others ≈0. IG follows/day fell 50→22 in a week while volume rose 60%. YouTube: 0 subs from 40+ Shorts. Bluesky flat 6 days. X flat at 45.3K 4+ days.
- Hits are image-led one-liners tying a fanbase to a recognisable absurdity (Threads Cissé 142K, Croatia/Nike 56.7K; X "684 points" 1.3M; IG City carousel 19.8K). Live-match Threads text blocks hit 2 of ~27.
- The quality gate (banger-critic) was mis-calibrated (blind backtest: passed 3 of 12 known hits) and was recalibrated 09-29 (PASS ≥7, X/Threads need ACTION+WHO+P(50K+)≥10%).
- Alex's taste: must move his body (anger/laughter/urge to send); "interesting" ≠ funny; captions never list the slides; X voice 2–8 words; no hashtags on X/Threads; quiz reels dead on TikTok/YT.

## Where evidence lives (read what you need; run scripts with `perl -e 'alarm 200; exec @ARGV'` timeouts; Postiz `social/pz posts:list` may hang/429 — avoid)
- Repo /Users/alexanderbrynolsen/ball-iq. social/state/: PLATFORM_PLANS.md, TEAM.md, RULES_REVIEW_2026-09-29.md, scoreboard.md, posts_log.jsonl (every post w/ platform, scheduledFor, text, format, critic, metrics), pm/2026-09-28.md, pm/2026-09-29.md, pm/floor_2026-09-29.md, sweeps/*.md, review/verdicts.jsonl + taste.jsonl, bangers/LIBRARY_x_threads.md, deleted.md, replies.md, research/*.md, sotw/, media/, collab_plan.md, series_daily_number.md.
- `node social/insights.mjs --no-rivals --hours 72` (follower deltas + per-post views; may be slow — skip on timeout and say so).
- Memory (playbooks + past findings): /Users/alexanderbrynolsen/.claude/projects/-Users-alexanderbrynolsen-ball-iq/memory/ — start with MEMORY.md, playbook_winning_formulas.md, project_platform_diagnosis_2026_09_25.md, reference_platform_algorithms_2026_09.md, project_social_audit_2026_09_22.md, project_social_rootcause_2026_09_22.md.
- External benchmarks available via MCP if your tool list has them: vidIQ (vidiq_outliers, vidiq_instagram_tiktok_outlier_search, vidiq_ig_profile*), mysocial, socialinsider. Web: WebSearch/WebFetch. Budget-aware: vidIQ credits are limited (≤15 calls total), Socialinsider/Firecrawl only if needed.

## HARD RULES for every auditor
1. READ-ONLY on the operation: do NOT post, schedule, delete, edit any post/queue, do NOT use Chrome/browser tools (shared tab group in use), do NOT edit settings/permissions/CLAUDE.md/scheduled tasks. Your only write is your own report file.
2. Every claim is tagged [DATA] (with file/number/source), [INFERRED] or [GUESS]. Never invent metrics. Say "no instrument" when there is none. Numbers older than 09-25 must carry their date.
3. Name specific posts (text/date/views/likes) as evidence, both winners and the zero-like losers. Compare against what the biggest comparable funny football accounts (banter/satire, NOT news) actually do on that platform — cite accounts and specific recent posts, not vibes.
4. Be brutal and specific. "Post better content" is banned. Every recommendation = WHAT (exact format/example line), WHO, WHEN/how many per day, WHY (the number/comparable), and HOW WE'LL KNOW (metric + threshold + date + kill rule).
5. Think BIG: at least 2 "big swing" bets per platform that are not slight tweaks (new format, series, collab, different posting model, kill/merge the platform), each with an honest expected-value estimate and cost in effort/money. Also say what to STOP.
6. Report format (write to social/state/audit_2026-09-29/<your-name>.md, ≤ ~350 lines, tables welcome): for EACH platform you cover → GRADE (A–F, with the criteria) · what the data says (5 bullets) · root cause(s) ranked · what the top comparable accounts do that we don't · STOP/KEEP/DOUBLE list · big bets · 14-day plan with daily posting spec · monetization path · "would I keep investing here? yes/no + why". End with a 10-line summary. Then hand back a ≤15-line summary as your final message.
