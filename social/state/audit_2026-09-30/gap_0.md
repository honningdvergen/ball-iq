# gap_0: REPORT.md does not exist (checked 2026-09-30 11:48 Oslo)

## Verified facts
- `ls .../audit_2026-09-30/REPORT.md` -> "No such file or directory" (11:48).
- Folder holds 18 .md files, none a synthesis. Newest: 00_ALEX_FACTS, PACK.json, PACK_COMPACT.md (all 11:24), then ops_rerun (11:22), quality_rerun (11:09), x_tt_snap_tg_rerun (11:09), saydo_v2 (11:04).
- find over repo /social, /private/tmp/claude-501 and ~/.claude/projects for REPORT*/FINAL*/*synthesis*: only unrelated hits (.audit/bloodhound-2026-09-07/REPORT.md, docs/scout-4-synthesis.json). Nothing written elsewhere.
- Files modified after 11:20 in social/: only social/state/enforce.json. No synthesis output anywhere.
- The parent session transcript (71fad5c5...jsonl) mentions `audit_2026-09-30/REPORT.md` (path referenced 12 times), so it was the intended output, not a written one.
- Same failure mode already logged: BENCHMARK.md line 2 says "Write tool was unavailable to the agent, saved from its returned text". PACK_COMPACT also records "No Write tool in this run: complexity.md was NOT written" (complexity dimension, ~line 580). Two of the audit's agents have already lost their file output this way. The likeliest cause is the same for the synthesizer: no Write tool, so the text went to the workflow's return value, not disk.

## Inputs a synthesizer must handle (PACK_COMPACT.md, 729 lines, 12 dimensions)
Status counts by grep: about 24 HOLDS, 9 REFUTED lines (7 finding tags plus header), 7 CUT-OFF, 113 LEAD.
- REFUTED, must not appear as findings: FYB-02 (two FB plans / photos), FYB-12 (FB+YT ate half the Metricool posts), SD1 (accountability loop write-only), REPEAT_003 (repeat slides reached publish: the 7-slide City carousel on IG has no repeats; only a scheduling-time gate gap existed, fixed 01:08), F1 (177-min gap decomposition: t0 wrong by ~3h39m).
- Time base: City verdict broke ~16:05Z / 18:05 Oslo. Anything still saying 21:30 or 19:30Z (SPEED_001 lead, complexity summary "177 min") is stale. Real lag: verdict ~18:05 to publish 00:27 = about 6h, matches Alex's "~6h after the story".
- Money: business.md "IG $0 / social ~$18/month" is wrong. Alex: IG ~$81/month from posts/carousels only, per-post cents ($0.04-$0.28), about $0.03 per 1K qualified views, reels not monetized; FB $17.74; X monetized, first read 10-09. Any "IG reels earn" or "IG earns nothing" claim is false.
- IG dimension: "hit lottery": 12% of posts (51/425 reaching 25K+) gave 78% of follows; net follows +49/day -> -2/day; non-follower reach 143K/day -> 22K/day. Consistent with Alex's point that the bigger the post, the bigger the pay, so the report should frame IG revenue as views x $0.03/1K, not a hidden lever.
- Snapchat: 2 followers, 293 Spotlight views/28d. Alex parks WhatsApp; secondary platforms = mirrors only.
- Repeat-rule claims: REPEAT_002 HOLDS only partly (one 09-29 incident plus a second §9 breach; "twice same issue" overstated). TOOLING_001 (Metricool 20/month cap) HOLDS and is a documented cap; root cause was predictable, not a surprise.
- Alex's ask #4: the audit must deliver critic/gate calibration. Data gap recorded: critic accuracy vs outcomes unmeasurable (RULES_REVIEW backtest: 3 of 12 known hits passed on the pre-09-29 rubric).
- Say/do items to carry: the 23:40 check promised at 23:30 Oslo with 32 min of zero tool calls; Metricool error found by Alex at 00:03, not by us.

## Recommended action (not done here; read-only task)
1. Re-run synthesis with an agent that has Write (or have the harness write the returned text to REPORT.md), inputs: PACK_COMPACT.md + 00_ALEX_FACTS + BENCHMARK.md.
2. `ls -l .../REPORT.md` and confirm size > 0 before re-launching the critic.
3. Critic checklist: no REFUTED IDs cited; all times on the 18:05 Oslo base; IG money stated as ~$81/mo posts+carousels only; no LEAD presented as fact; calibration section for critic/gate present; token cost concern (Alex) addressed by a short report.
