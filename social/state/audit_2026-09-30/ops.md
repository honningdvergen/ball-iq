# OPS AUDIT — tooling, hooks, silent failures, incident history (2026-09-30 ~02:30 Oslo, read-only)

Auditor: "Operations, tooling and silent failures". Nothing was posted, queued, edited or deleted. Only read-only APIs
(Graph/Threads GETs, Metricool getScheduledPosts/getBrandSettings, scheduled-task run listing) and local file reads were used.
Two throw-away probe copies of verify.mjs / review-guard.mjs live in the session scratchpad (not in the repo).
Every number below has a source; "MEASURED" = I read it off a file/API/process, "INFERRED" = reasoning from measured facts.

## 0. Bottom line (five things that matter most)

1. **The whole watch-and-verify layer runs on Alex's laptop, inside Claude sessions, with no independent alarm and no push to Alex.**
   Watchers are children of the Claude CLI process (PID 80023), not launchd/cron (`launchctl list`, `crontab -l` empty). The Mac has slept ~10 h on two of the
   last three nights (pmset: clamshell sleep 09-27 00:39 -> 11:04, 09-28 00:34 -> 10:08). The hourly floor manager, the one scheduled "watcher", was stalled
   95% of its wall-clock on 09-29 (8.9 h idle of 9.3 h) and its 22:18 run has been "running" for 4+ h with 2 tool calls; the 23:05 slot (the failure hour) never ran.
   The promised "23:40 check" had no timer; there were ZERO tool calls between 23:30:41 and 00:02:58.
2. **Metricool was a free-plan (20 posts/month) hub. The failure was predictable and documented.** Exactly 20 distinct posts had published through
   Metricool (5 on 09-28 + 15 on 09-29) when the 21st was rejected. HANDOFF.md (09-28) says "free plan 20 posts/month"; memory on 09-29 06:05 says "NO plan limit".
   The limit is enforced at PUBLISH time (create returned PENDING), so no creation-time check can see it, and the only readable signal (getScheduledPosts status ERROR)
   is an MCP call that scripts cannot make.
3. **The instruments that were built after the incident fail silent-green.** verify.mjs prints "every IG/FB/Threads slot has a published item" (exit 0) when the keychain
   token cannot be read (probed: PATH without `security` -> `[]`). review-guard.mjs allows a post silently when hashes.json is unreadable (probed). Both new hook code paths
   were written 01:07-01:09 on 09-30, after the last real Metricool create: they have never run against a real post, and have no tests.
4. **State drifts from reality in a way nobody reads.** 89/89 Metricool rows in posts_log have an empty id (uuid regex cannot match the escaped MCP response);
   31/89 have no scheduledFor (unverifiable); updateScheduledPost/draft/delete never touch posts_log, so 9 stale Metricool IG/FB rows for 09-30 will raise false MISSED alarms
   (two of them, the 07:30 "keeper's WiFi" rows, have no real counterpart at all); POSTING_LEDGER and coverage.mjs count "scheduled" as "posted".
5. **Postiz is the hidden single point of failure.** 528 of 1,118 Postiz calls (47%) are uploads, and every Metricool post carries a uploads.postiz.com URL, so the 25/h
   Postiz cap throttles the "other" scheduler too. 24 of 76 active clock-hours were pinned at >=25 calls. The plan to cancel Postiz ~10-03 depends on a paid Metricool plan
   that does not exist yet.

Also material: the gates built since 09-28 (verify, preflight, enforce, tg, coverage, dashboard, scheduler_status, verify_ignore) are **untracked in git**; the review-guard/
postlog hooks and the critic threshold change (8 -> 7) are uncommitted edits in a checkout that other sessions commit to.

## 1. Method and commands (reproducible)

- Files read: social/{pz,gate,enforce,verify,review,tg,postlog,coverage,matchwatch,carouselreel,carousel2fb,preflight,dashboard,insights,breaking}.mjs, .claude/hooks/*.mjs,
  .claude/settings.json + settings.local.json, ~/.claude/scheduled-tasks/*/SKILL.md, memory reference_/feedback_/project_ files, social/state/{deleted.md,scheduler_status.json,
  verify_ignore.json,tg_queue.jsonl,postiz_calls.log,uploads.tsv,hashes.json,posts_log.jsonl}, pm/{ENFORCEMENT_LOG,POSTING_LEDGER,DASHBOARD,ACCOUNTABILITY,board}.md.
- Transcript search: streaming grep over ~/.claude/projects/-Users-...-ball-iq/71fad5c5-....jsonl (399 MB, 73,164 lines, 09-20 -> now) and the per-run CLI transcripts of the scheduled
  sessions (found via ~/Library/Application Support/Claude/claude-code-sessions/*/local_<id>.json -> cliSessionId).
- Live reads: `mcp__scheduled-tasks__list_task_runs`, `mcp__ccd_session_mgmt__get_session/list_events` (stuck floor manager), Metricool `getBrandSettings` + `getScheduledPosts`
  (09-24 -> 10-02), Graph reads (IG media + per-media insights, FB /me/posts + /me/video_reels, Threads /me/threads, Threads debug_token), `ps`, `pmset -g` / `pmset -g log`,
  `launchctl list`, `crontab -l`, `gh run list` (deploy-check.yml, ci.yml).
- Probes (offline, no writes to the repo):
  - `verify_probe.mjs` = verify.mjs with the ignore list emptied, run at now=00:10 09-30 (a) with keychain (b) with PATH=/nonexistent so `security` is unavailable.
  - `hookprobe/` = copy of gate/review/postlog + review-guard.mjs + copies of hashes.json/uploads.tsv/verdicts.jsonl; fed a synthetic createScheduledPost payload.

## 2. Part A - code and hook review (silent-failure modes)

### 2.1 verify.mjs / enforce.mjs (the "truth" instruments)
| # | Finding | Evidence |
|---|---|---|
| A1 | `key()` returns '' on ANY failure; `j()` returns `{error}` on any failure; `findMissed` then does `if (!ok[platform]) continue; // never cry wolf` and the CLI prints "verify: every IG/FB/Threads slot in the last 4h has a published item", exit 0. A dead instrument reads as clean. | Probe: with keychain -> `MISSED` = the 23:38 IG carousel (correct). With `PATH=/nonexistent` -> `[]` for the same input. enforce.mjs has the same `key()`/`j()` and appends "clean" to ENFORCEMENT_LOG. |
| A2 | Matching is "some published item within -20/+45 min of the slot", per platform, not "this post". A different post (Alex's manual post, a reel + a post 90 s apart, deduped to one) satisfies the slot and hides a missed one. FB reel appears in both /posts and /video_reels and is de-duplicated within 90 s, so two real FB items <90 s apart collapse to one. | verify.mjs lines 56-57, 72. |
| A3 | Rows with empty `scheduledFor` are excluded (`&& r.scheduledFor`). 31 of 89 Metricool rows (8 FB, 8 TikTok, 7 YT, 8 IG) have none: never verified. | posts_log.jsonl counts. |
| A4 | Coverage of the verifier: IG, FB, Threads only. X (45.3K), TikTok (16.2K), Bluesky, YouTube, Snapchat, Telegram have no publish check. IG+FB+Threads = 75.3K of ~138K followers (55%); 45% of the audience is unverified. | DASHBOARD.md follower counts; verify.mjs header. |
| A5 | The stale-row problem: `verify cancel <logId>` is a manual step after every pull/delete/replace. Nine stale Metricool IG/FB rows for 09-30 are not in verify_ignore.json (IG 07:30, 12:30, 13:30, 17:30, 21:30; FB 07:30, 12:30, 17:30, 21:30). The five posts were moved to Postiz (new rows munbep.. etc.), the Metricool copies are `draft:true` (getScheduledPosts). "keeper's WiFi" was moved 07:30 -> 19:00 (Metricool publicationDate now 19:00; log still 07:30) so at 07:45 verify.mjs will flag two rows with no counterpart at all; the seven duplicates each consume one real item and flag their twin. INFERRED from the matching logic; the current ENFORCEMENT_LOG already carries the phantom "No overnight IG - Scheduled IG post 07:30" for the same reason. |
| A6 | Alerts are one-shot: `seen[id]` suppresses re-alerts forever; the process EXITS on the first new violation and must be relaunched by the Claude session. | enforce.mjs lines 104-110. Currently only enforce (PID 97929, started 01:38) and tg.mjs run (PID 17054) are alive; coverage.mjs last alerted 21:43 (coverage.json mtime) and was not relaunched; matchwatch ended; breaking.mjs last state 09-28 22:50 (3 h max runtime, then exit 3, never relaunched; another auditor found it did not run at all on 09-29). |
| A7 | Log noise: 94 enforcer runs (09-29 13:09 -> 09-30 02:12), 0 clean. Rule rows: "No overnight IG reels" 372, "Facebook video only" 279, "Threads window" 163, "No overnight IG" 93, "critic PASS" 84, YT/TikTok soft ceiling 79 each, 😭 73, "IG reel must be shared to feed" 20 (a rule Alex later dropped), "Scheduled post never appeared" 0 (never fired). The log is 195 KB, appended forever. Three scripts disagree on the IG cap (dashboard 4, enforce 6x tier, PLAN 8x tier) and on Threads (message says 7, test uses <5). This is the "always-red CI = no alarm" pattern the memory already names. | ENFORCEMENT_LOG.md, DASHBOARD.md, enforce.mjs. |
| A8 | POSTING_LEDGER `done` = row time <= now, i.e. "scheduled" counted as "posted". coverage.mjs: "A scheduled post counts from its scheduled time". A failed scheduled post therefore satisfies both watchers. | enforce.mjs line 97; coverage.mjs lines 12, 37-38. |
| A9 | `enforce.json` / `coverage.json` are read with bare `JSON.parse` at start and written non-atomically; the enforcer is routinely `pkill`ed (01:07). A truncated file crashes the next start. LOW. | enforce.mjs line 102, coverage.mjs line 42. |

### 2.2 Hooks and gate (pz.mjs / gate.mjs / review-guard / postlog-metricool)
| # | Finding | Evidence |
|---|---|---|
| A10 | review-guard.mjs is FAIL-OPEN on its whole media/repeat gate: `catch { /* the media check must never break a valid post */ }`. If hashes.json is unreadable (the gate deliberately throws "refusing to continue") the hook allows the post with no output. pz.mjs, by contrast, crashes loudly. | Probe B: unreadable hashes.json -> empty output (= allow). Probe A (intact db, repeat picture) -> deny with the correct REPEAT message. |
| A11 | The repeat gate only sees media whose URL is in uploads.tsv (i.e. uploaded through `social/pz upload`). Any other URL is `unmapped` -> a warn that review-guard never shows. | Probe C2: the same already-posted picture at a non-pz URL -> allowed silently. Probe C1 (mapped URL) -> denied. |
| A12 | postlog-metricool.mjs `uuid` regex `"uuid"\s*:\s*"..."` runs on `JSON.stringify(tool_response)` where the MCP reply is an array of `{type:'text', text:'{"data":...}'}`; the inner quotes are backslash-escaped, so it never matches. 89/89 rows have `id:''`. The hook also logs every non-draft create as "scheduled" without reading `providers[].status` (the plan limit is not visible at creation anyway: create returned PENDING for the 23:27 and 23:28 posts). | posts_log.jsonl; tool_result of the 21:26:57Z create in the main transcript ("has uuid field: true", status PENDING). |
| A13 | updateScheduledPost is guarded by review-guard but NOT logged: publicationDate changes, draft flips and deletes leave posts_log stale (A5). Same for `pz posts:delete`: no cancel, no gate-db cleanup. 106 distinct posts:delete ids since 09-23; 29 are still referenced by 52 of 1,099 hashes.json entries (4.7%): false "REPEAT" blocks on the corrected repost (happened 09-26 and 09-29 22:03, fixed by hand with a python JSON edit of the shared repeat DB, the same operation that wiped 482 -> 27 entries on 09-24). | postiz_calls.log vs hashes.json; reference_postiz_queue_gotchas.md; transcript 09-29T22:03Z. |
| A14 | Gate records at SCHEDULE time, not publish time (`record()` after create). A post that never publishes (Metricool cap, drafted) stays in the repeat DB as "posted" and blocks its own retry. | pz.mjs line 95; postlog-metricool line 29. |
| A15 | Repeat-DB decay: 875 media entries, 677 (77%) reference files that no longer exist (792 point into /tmp). For a missing old file the fine-hash confirmation is skipped and low-detail frames (`pop < 16`, i.e. text cards, dark quiz reels) are NOT counted as repeats. So the classes of picture most likely to repeat are the least protected as time passes. | gate.mjs lines 105-110; hashes.json analysis. |
| A16 | `load -> (ffmpeg fingerprint per media) -> save` in `record()` is not locked. Two writers (pz job + Metricool hook, or two sessions) can lose updates; atomic rename only prevents torn files. INFERRED (same class as the 09-24 wipe). | gate.mjs lines 181-190. |
| A17 | pz.mjs 429 handling: `if (/429\|Throttler/i.test(out) && attempt < 3)` is applied to stdout+stderr of ANY call, without checking the exit code. A successful posts:create whose output echoes an id or caption containing "429" (e.g. "£429m", a cuid) is treated as throttled and RETRIED after 5 minutes = duplicate publish. Demonstrated regex-only (`/429\|Throttler/i.test('{"postId":"cmun429abc"}') === true`); no duplicate found in posts_log (1 duplicate group, a Snapchat pair). LOW probability, HIGH cost. | pz.mjs line 57. |
| A18 | Gate covers: Postiz (pz) and Metricool create/update. It does NOT cover: `mcp__...vidiq_instagram_publish_reel` (direct IG publish), direct Graph `media_publish` via `curl` (Bash(curl *) and the keychain token are both available), Chrome/OneUp (Snapchat, TikTok, YouTube, X), tg.mjs (text critic only, no repeat/media check), Alex's phone. `preflight.mjs` (tweet-card marker `.card`, slide-listing captions, windows) is advisory, run by hand; none of its checks are in gate.check(), so a Postiz X post with a tweet card is not blocked. The critic PASS is keyed on caption text only; it says nothing about the image (the Yamal tweet-card-on-X error was an image error under a passed caption). | gate.mjs, review-guard.mjs, preflight.mjs, settings.local.json. |
| A19 | The Metricool door had no repeat/brand/FB-video gate for its first 33 hours (first published Metricool post 09-28 16:08 -> hook change 09-30 01:08). All 20 published Metricool posts were ungated for repeats; consequences on record: 2 repeat slides (09-29) and a Facebook album (13:11 Metricool IG+FB 5-slide post, proven via getScheduledPosts); two more FB photo posts (14:53, 15:28) hit the enforcer's 'Facebook video only' rule (279 rows) but their route is not proven to be Metricool (14:53 published on IG/FB/Threads within 11 s, which looks like a Postiz multi-integration post). | posts_log, getScheduledPosts, ENFORCEMENT_LOG, file mtimes. |
| A20 | hooks.test.mjs / postiz-guard.test.mjs contain 0 references to review-guard or postlog-metricool. The matcher hard-codes the Metricool connector UUID (a2599811-...); if the connector is re-added under a new id the hooks stop matching with no error. | grep; .claude/settings.json. |
| A21 | Verdict threshold changed 8 -> 7 in review.mjs (uncommitted) while the header comments in gate.mjs and review-guard.mjs still say >=8. `review.mjs verdict` has no caller identity: nothing stops the operator from recording its own PASS. In 130 verdicts, 40 scored exactly 7 and 38 exactly 8 (78 of 130 sit at 7-8); PASS rate 64/130. | verdicts.jsonl; review.mjs line 95. |

### 2.3 tg.mjs (Telegram bot), coverage.mjs, matchwatch.mjs
- tg.mjs `run`: on a send error it stores `r.error` and retries every 30 s forever (only `gate` errors mark done); the only output is stdout of a background shell nobody reads; no alert path. It rewrites the whole queue file at the end of each pass, so a `queue` append that lands during a slow video send is lost (read-modify-write race, INFERRED). Two `run` processes would double-send. `logIt` swallows failures. It only runs while the Mac is awake (tomorrow's five mirrors are queued for 12:40-21:40). Channel has 2-3 members (x_tt_snap_tg.md, session transcript 14:42Z), so cost/benefit is ~0.
- coverage.mjs: MAX_GAP table still encodes pre-09-29 plans (Bluesky 4 h, YouTube 12 h, TikTok 12 h) that the floor-manager prompt says to ignore; `process.exit(late.length ? 0 : 0)`.
- matchwatch.mjs: `snap(id).catch(() => null)` then `.filter(Boolean)`; if ESPN is down or an event id is wrong, `snaps=[]`, the loop never alerts and never exits (`snaps.length &&` guard). First sight of an event is stored, not reported.
- breaking.mjs: per-feed `catch { }` (one dead feed silently shrinks coverage), MIN threshold 6 vs real verdict headlines scoring 1-3 (speed.md), 3 h max runtime then exit 3.

### 2.4 Scheduled-task prompts
- shq-floor-manager SKILL.md is self-contradictory: paragraph 1 "you do NOT post, schedule, delete, edit posts ... or call Postiz/Metricool/OneUp write tools", the 09-30 PUBLISH CHECK block tells the same run to `updateScheduledPost draft:true`, run `social/pz`, and `verify cancel`. In an unattended default-permission session either it stalls on the prompt or breaks the read-only rule.
- Cron `5 9-23 * * *` with jitter up to ~13 min: 15 slots/day, 11 started on 09-29. Skipped slots: 10:05, 13:05, 14:05 (each while the previous run was still "running" for 2h17m / 3h) and 23:05 (the 22:18 run is stuck). The scheduler appears to skip overlapping runs; the 09:05 run tomorrow will be skipped too if the stuck session is not stopped (INFERRED from the 3-of-3 overlap pattern).
- Nothing runs 23:05 -> 09:05 (the hours with reels at 03:30-08:00 on 09-29 and the largest news window) except the enforcer while the Mac is awake.

### 2.5 Permission-prompt stalls (the scheduled runs)
Floor-manager runs on 09-29 (UTC start, Oslo = +2), gaps >=25 min between a Bash tool_use and its tool_result:
| run (Oslo start) | wall | biggest gap(s) | command pending |
|---|---|---|---|
| 09:19 | 137 min | 129 min | `perl -e 'alarm 120; exec @ARGV' node social/coverage.mjs --once \| tail -60` |
| 12:19 | 181 min | 28 + 147 min | `security find-generic-password ... curl graph.facebook.com ...`; then `cat >> floor_2026-09-29.md <<'EOF'` |
| 16:18 | 31 min | 30 min | `curl ... $(security find-generic-password ...)` |
| 18:18 | 74 min | 73 min | `cat >> floor_2026-09-29.md <<'EOF'` |
| 19:33 | 55 min | 54 min | heredoc append |
| 20:28 | 73 min | 27 + 43 min | `ls --time-style` ; heredoc append |
| 22:18 | 4 h+ (still "running") | no result after 2 Bash calls | `date ... && ls ... && perl -e 'alarm 120; exec @ARGV' node social/dashboard.mjs \| tail -60` ; `perl ... coverage.mjs --once ...` |
Total idle gaps 531 min = 8.9 h of 9.3 h run wall-clock (95%). Cause = INFERRED (high confidence): the session's `permissionMode` is `default` (get_session), Alex typed into run 20:28 "hey please stop asking for permissions, assume i approve everything" (19:40Z), settings.local.json has `defaultMode: bypassPermissions` (set 15:29) but the scheduled session still reports default, and the allowlist has 0 rules for `cat >>` heredoc appends or `security find-generic-password` (208 rules; `Bash(node *)`, `curl *`, `git *` exist). The Editor asked Alex at 19:35 for a screenshot of the prompt; still open. (Trend-sweep/PM run wall-clocks are contaminated by resumed sessions, not used.)

## 3. Part B - incident register since 2026-09-20 (time lost, gate today)

| Date (Oslo) | Incident | Detected by | Time lost / cost | Gate now? |
|---|---|---|---|---|
| 09-17 -> 09-21 | Prod deploys failed 4 days (Home JS budget 911 vs 910 KB); Brasileirao pages 404; CI red on 40 pushes 09-07 -> 09-23 | by chance while shipping a redirect (09-21) | 4 days of prod frozen | YES: session-start + stop-deploy-verified hooks; deploy-check/CI green on the last 7 runs (one failure 09-28 15:43 fixed in 16 min). |
| 09-21 16:15 | Postiz 429 lockout: ~130 calls in minutes, 30+ min of ThrottlerException; two concurrent queue jobs cross-attached media (Haaland reel got a PNG on FB/TikTok/Threads, caught pre-publish); silent (-91 dB) Travolta reel shipped | self | 30+ min lockout + re-queue "an hour or two"; 3 posts deleted | PARTIAL: pz.mjs quota wait (25/h), audio gate (silent block), single-serial-job rule is only a note. |
| 09-21/22 | Context compaction -> two "new" Threads drafts duplicated a 192-view flop and an already-queued stat | caught by listing the queue | minutes | PARTIAL: gate REPEAT TEXT. |
| 09-22 | Postiz date labels off by one -> wrong "takeover crashed Facebook" root cause; trial reels flopped (25 vs 1,930 views), 12 queued posts flipped | Alex pushback | a day of wrong diagnosis | NO gate (process note). |
| 09-23 | Re-queue scripts re-uploaded slides and fought the sweep for quota "for ~2h"; 9 consecutive hours pinned at 25-26 calls (14:00-22:59) | self | ~2 h | PARTIAL: uploads.tsv reuse is a note; preflight warns on quota. |
| 09-23 | Repeat posts (Endrick printer nearly reposted), car_B 11 slides failed (IG cap 10), quiet quiz reel reached TikTok | Alex | recurring | YES for Postiz door (gate.mjs 09-23). |
| 09-24 | hashes.json wiped 482 -> 27 by two writers | self | repeat DB rebuilt (backfill entries: 506 of 1,099 have non-Postiz ids) | PARTIAL: unreadable file now throws, write atomic; no lock; review-guard swallows the throw (A10). |
| 09-25, 09-26 | `while pgrep -f "<own pattern>"` waits forever (twice) | self | unmeasured | NO (note only). |
| 09-26 -> 09-29 | Deleted posts stay in the repeat DB | self | 2 manual DB edits | NO tool (29 of 106 deleted ids still referenced, 52 entries). |
| 09-28 | X quote-post through Postiz stripped the BBC link ('two contracts. zero concerns'), replaced by Chrome quote-post | Alex | ~1 post | NO (note: quote posts never via Postiz). |
| 09-28 22:30 -> 09-29 16:45 | IG scheduler reels read `is_shared_to_feed:false` ("hidden from grid"); flagged by floor manager for ~10 h and 20 enforcer rows; Alex then said it is deliberate for royalty-free-music reels | self / Graph API | ~10 h of a mis-specified alarm | Rule dropped by decision; enforce.mjs still fetches the field, checks nothing. |
| 09-28 23:20 | Facebook silent 7 h with paid ads running | Alex | 7 h | PARTIAL: coverage.mjs (counts scheduled as posted, not running now). |
| 09-29 (all day) | Scheduled floor-manager stalls on permission prompts: 8.9 h idle of 9.3 h; 4 of 15 slots skipped | Alex ("stop asking for permissions") | see 2.5 | NO: defaultMode bypass did not propagate; screenshot request open >6 h. |
| 09-29 14:24-14:44Z | Telegram bot token: 3 store attempts (16-char, 25-char, then a 138-char junk value), the real token pasted into a Terminal tab where the assistant could read it (exposed in transcript; Alex declined to revoke) | assistant | ~20 min (+30 min to build tg.mjs) for a channel with 2-3 members | tg.mjs has no token-shape check; no rotation. Token now appears once in the 71fad5c5 transcript; a Graph token in a Chrome tab URL (Access Token Debugger) appears twice on 09-23. Local disk only. |
| 09-29 ~22:00 -> 00:10 | Yamal hero posted to X as our own tweet-card image | Alex | ~2 h (delete blocked by a permission check, done 00:03 after Alex OK; deleted.md 00:10) | PARTIAL: preflight `.card` marker (advisory, not in pz/gate). |
| 09-29 21:26-00:31 | Metricool 20-post cap: IG carousel 23:38 and FB reel 23:50 rejected at publish time; found 00:03:49 (+26 min); re-route blocked by Postiz 25/h until 00:26:28; IG published 00:27:05 (+49 min), FB 00:31:01 (+41 min). Speed.md: story t0 17:51 Oslo, so the ops failure is 26 min of a 6 h 36 m story-to-publish chain. | Alex's screenshot / Claude's check after "go ahead" | 26 min to detect + 23 min to reroute; a 32-min silent window (no tool calls) | PARTIAL: verify.mjs + preflight (01:07, uncommitted, never fired: 0 'never appeared' rows), scheduler_status.json is manual. |
| 09-30 01:37 | 5 Metricool posts (17 provider-posts) converted to drafts and re-created on Postiz; last Postiz create (Inevitable TikTok/YT) waiting on quota (PID 57869, 38+ min) | - | in progress | stale-row problem (A5). |

## 4. Stack: cost, redundancy, attention

| Tool | What it does here | Cost (documented) | Redundant with | Verdict |
|---|---|---|---|---|
| Metricool (MCP) | Scheduler for IG/FB/TikTok/YT/Threads/Bluesky; getScheduledPosts is the only structured status read; media hosted at static.metricool.com after fetch | Free tier inferred (20 posts/month exactly consumed); memo: Starter EUR16-20/mo, Advanced EUR43/mo; memo unsure whether the API/MCP survives on Starter | Postiz (same 6 networks), Meta Business Suite | Either pay and make it the only scheduler, or stop building on it. At 10-15 posts/day a 20-post month lasts ~2 days. |
| Postiz | X, Bluesky, Threads, IG/FB/TT/YT fallback, and the upload host for Metricool; 25 calls/h (real ~30) | $29/mo Standard (5 ch) after 09-27 trial; 8 integrations in gate.mjs implies Team $39/Pro $49; billing screenshot still outstanding | Metricool for 6 of 8 networks | Keep until Metricool is paid and media has another host. Cancel plan ~10-03 is premature. |
| OneUp | Snapchat only (14 rows) via Chrome; also TikTok/FB/YT/X accounts | $25/mo after ~10-05 trial | Metricool/Postiz for everything but Snapchat; Snapchat count unreadable | Decide 10-04 as planned; Snapchat has no read API in the stack. |
| tg.mjs + bot | Telegram mirror | free; ~1 h of build+token time | Postiz Telegram (deleted 09-29 19:35) | 2-3 members, $0 payout path (needs 1K subs). Lowest ROI item; also laptop-bound. |
| vidIQ / Higgsfield / Bright Data / Socialinsider / Mysocial | research/one-offs | vidIQ 150 credits/mo (~95 left), Bright Data $2, Socialinsider 0 profiles (blocked), Mysocial free tier | - | Idle; vidIQ also exposes an ungated IG publish tool. |
| FB follow ad | growth test | kr 50/day x 12 = kr 600 | - | judged at 72 h by Alex |
| Local automation | 37 scripts, 3,929 lines (social/*.mjs + hooks); 4 scheduled tasks; 3-4 background watchers; 130 critic verdicts; 126 subagent transcripts in the Editor session (99 since 09-28 12:00) for 89 distinct content units in the 32.8 h posts_log window; ~2.0 GB of transcripts | Claude usage (not measured) | - | Attention cost is the real bill: the recurring failures are in the glue, not in any single tool. |
Measured revenue anchor: Facebook page ~$16/month (09-20 baseline memo); X Original Content Rewards first payout 10-09; other platforms $0 (x_tt_snap_tg.md). Scheduler spend on record is >= $54-74/mo (Postiz + OneUp) before Metricool.
Doors per platform (posts_log via): Metricool 89 rows (48%), Postiz 78 (42%), OneUp 14 (7.5%), chrome 5, phone 1. Six of nine platforms have 3+ posting doors, each with a different gate/log path; that multiplicity is the mechanism behind A18/A19.

## 5. Not the problem (checked, looks bad but is fine)
- Meta Graph rate limits: `x-business-use-case-usage` call_count 1% (02:19); no rate pressure from enforce/dashboard/verify.
- Token expiry: Threads token valid, 53.4 days to expiry (2026-11-22). (FB debug_token returned an app-level "(#4) request limit" on the debug endpoint only; ordinary calls fine; inconclusive, not counted.)
- Dashboard IG "follows 0": verified against Graph per-media insights (feed posts 0/0/0/1/0; reels correctly excluded because the API does not support `follows` for reels). The number is right.
- Deploy/CI: last 7 deploy-check runs green; hooks for it exist.
- Critic gate at the Postiz door works as designed (probe A/C1 deny correct repeats). Threads/IG/FB timing conversion in verify.mjs is correct (Metricool naive Oslo vs Postiz Z handled by slotMs).
- The enforcer itself was continuous while the Mac was awake: 94 runs, no gap >15 min.
- Duplicate uploads are not the main quota burn: only 16 of 518 uploads are same-path repeats; the burn is volume (528 uploads for ~370 creates).

## 6. Data gaps
- Metricool plan/price and reset date (billing screenshot outstanding since 09-29 14:18Z); whether Metricool emails on failed posts; whether the API survives on Starter.
- Postiz plan/price; Postiz posts:list for the day's queue (not allowed to call; can't confirm the five moved posts exist there; the last two creates appear unsent).
- The exact text of the stalled permission prompt (not visible from list_events); Keychain-ACL dialog vs Claude permission prompt not separable.
- Whether the Telegram run/queue survived any sleep (only 09-27/28 sleeps in pmset; none since 09-28 10:08).
- Sweep/PM stall data: wall-clocks include resumed sessions.
- Cost of Claude usage; effect of the 09-29 Editor model swap (Sonnet 5.5 trial) on failure rate: confounded, not attributable.

## 7. Fix order (ops only)
1. Move the truth check off the laptop and give it a push channel (Supabase Pro pg_cron + Edge Function, or a GitHub Action, calling Graph/Threads + Postiz/Metricool status and DMing Alex via the existing bot). Make "cannot read the API/token" a loud alert, not a skip.
2. Settle the scheduler: pay Metricool (verify the tier keeps the MCP) or drop it; host media somewhere other than Postiz (Supabase Storage/Vercel) so 25/h stops throttling everything.
3. Fix the scheduled-run permission model (allow rules for `cat >>`, `security find-generic-password`, `perl -e`; or move the mechanical steps into `node` scripts covered by `Bash(node *)`), stop the stuck session, add a max-runtime kill.
4. Log truth: fix the uuid regex (parse the inner JSON), log updateScheduledPost/draft/delete, mark rows cancelled automatically, record fingerprints at publish confirmation, add a `gate forget <postId>`.
5. Commit the gates (git add verify/preflight/enforce/tg/coverage/dashboard + hooks + state); add tests for review-guard/postlog; make review-guard fail closed.
