---
name: shq-draft
description: Draft Shithousery HQ posts (X, Threads, Bluesky, IG/FB/TikTok reels, YT Shorts, carousels) from the banger library instead of from scratch. Use BEFORE writing any SHQ post, reel line, caption, reply or match-night line — then send the drafts through social/review.mjs and the banger-critic. Modes: satire, ragebait (with a hard never-list), live-match.
---

# SHQ drafting — start from what already won

We are a football HUMOUR account: shithousery, satire, sarcasm, clever jokes, mocking fanbases, ragebait, deadpan absurd-but-true maths. News is only the vehicle. Alex, 09-28: "we have to actually believe that every single post we make will do well."

## 0. Load before writing (every time)
1. `social/state/bangers/LIBRARY_x_threads.md` → THE CRAFT, INSTANT FAILS, **FORMAT PORTFOLIO**.
2. `social/state/bangers/LIBRARY_video.md` → rule 0 (the clip must ACT OUT the line) + the platform's CRAFT section. Also `LIBRARY_fbpages.md` / `LIBRARY_youtube.md` when they exist.
3. Today's match kit if any (`social/state/matchkit_<date>_*.md`), `social/state/USED_SLIDES.md`, `social/state/replies.md` (never repeat a premise), `social/state/review/taste.jsonl` (Alex's yes/no).

## 1. Pick the format family FIRST, then write
| story shape | families that fit |
|---|---|
| a number-shaped story (points, fees, charges, table) | absurd-but-true maths (🚨, deadpan, ends on the number, image that reacts), receipt list |
| one iconic reaction photo circulating | label-the-frame (2–8 words; the face mid-emotion IS the punchline), lip-read caption (≤30 min) |
| then-vs-now, club-vs-country, us-vs-them | two-panel contradiction, callback |
| a mega-story everyone's posting | aim at a SECONDARY fanbase (the City verdict bangers mocked Arsenal/Chelsea/Agüero, not City) |
| "officially" anything / sanctions / rebrands | fake-official (looks real for half a second) |
| full time | stat-sheet roast on the villain (≤10 min: "[Player] vs [Team]: 0 Saves / 1 Assist / MOTM") |
| contested player / awards / "best league" | ragebait verdict (see §3) |
Write 3 candidates in 2+ different families, pick the best, and write down WHY a stranger would repost it.

## 2. Platform shape
- **X**: 2–8 words (maths/receipts/stat-sheets excepted), picture that is still about the story with the caption covered, quote-post the source in Chrome (Postiz strips tweet URLs). Never explain the joke.
- **Threads**: a take or a question + an image/card; our text-only posts flop. X-screenshot singles with our one-line take (test 09-29→10-01).
- **Bluesky**: name the club/player in the first 5 words; ≤300 chars.
- **IG/FB reels**: `social/recaption.mjs` white plate, one line naming a concrete consequence, clip ACTS OUT the line, 6–18 s, keep iconic audio. FB: funny with zero football knowledge wins.
- **TikTok**: 6–8 s, native-style text, sound is part of the joke (silent copy + sound name for Alex if needed).
- **YT Shorts**: "[H] x y [A] | Highlights" meme ≤3 h after FT or "[Club] fans …" title; first frame = the thumbnail.
- **Hashtags (rules review 09-29):** none on X/Threads. IG/TikTok/YT Shorts/Snapchat: up to 3 topic tags are allowed (no measured effect either way — don't spend time on them). Club/player NAMES belong in the caption text (IG search reads keywords).
- **Caption sameness:** no 😭 suffix on more than 1 of every 3 posts; vary the "[Fanbase] fans …" template (79% of TikTok captions since 09-20 used it). A recurring named series beats a new template every day.
- **Captions**: one line + at most 1–2 short sentences. Never a numbered slide list. Never reuse a caption question within 7 days.

## 3. Ragebait — allowed, with a floor
Allowed: contested football opinions, mocking a fanbase's behaviour, sarcasm ("that Norway superteam"), bench-GOAT energy. NEVER: tragedy, deaths, serious injuries (a player's knee is not a joke), children/private individuals, race/religion/nationality slurs or stereotypes, betting brands, stating sanctions or crimes as fact. gate.mjs hard-blocks tragedy words and asks for a conscious OK on injuries/minors/legal/sanctions.

## 4. Live-match mode
Matchwatch (`node social/matchwatch.mjs <ESPN ids>`) wakes you on goal/red/pen/HT/FT → open the kit's scenario lines → pick the photo that's circulating (face mid-reaction) → 1 X post ≤5 min → FT: stat-sheet roast ≤10 min, then the reel and the Highlights Short. Before posting, search X for the same joke in the last hour (`<keywords> within_time:1h`); if it's already out, change the angle.

Also log any shithousery moment to `social/state/sotw/<ISO-week>.md` for the weekly award (social/state/series_shithouse_of_the_week.md).

## 4b. Hit conversion (rules review 09-29, KEEP + ENFORCE)
Views don't convert (0.4–4 follows per 10K views). Any post >5× its platform median → within 60 minutes: pin it (or self-reply a one-line reason to follow), put a matching line in the bio, and log it in social/state/board.md. Every IG carousel ends on a follow CTA slide. Judge posts on follows per 10K views, not views.

## 5. Hand-off (mandatory)
`node social/review.mjs draft --platform <p> --format <family> [--platforms a,b] --text-file cap.txt --media <file> --story "<what + when it broke>" --broke HH:MM` → LOOK at the mock-up → banger-critic → only PASS drafts are queued, with the exact reviewed text. Postiz and Metricool posts log themselves to social/state/posts_log.jsonl; Chrome posts: `node social/postlog.mjs add --platform x --via chrome --url … --text "…"`.
