# What the next scouting report MUST look for

Written 2026-08-23, at Alex's instruction: *"it is imperative that we also look
for these issues we raised tonight, all the bugs and quality improvements we had
to make, slowness keyboard bugs"* and *"a very thorough scouting report/audit
where we learn from our mistakes and anticipate what might need doing."*

This file exists because **report #2 graded 14 areas and missed every single
defect Alex found in one playtest message.** Seven real bugs, all live, none
caught. A report that repeats that shape is not worth running.

---

## The rule this whole file comes from

> **Every bug found on 2026-08-22 was found by USING the app.
> Zero were found by reading it.**

So the next report is not allowed to be a reading exercise. Each section below
must be answered by *doing the thing*, and the answer must say **how** it was
checked. "Looks correct" is not an answer.

---

## 1. Dead and half-wired interactions — the biggest class

Alex: *"every single button has to work as intended."*

Two P1s in one night were controls that existed, looked right, and did nothing
useful:

- **Rematch** created a new room unconditionally, so when BOTH players tapped
  it they each ended up alone. The failure scaled with enthusiasm.
- **Push tap** routed correctly but the listener was attached inside
  `registerPush()`, which waits for sign-in — so a cold-launch tap was dropped
  before anything existed to catch it.

**How to check:** walk every flow end-to-end and press everything, including
the second-most-obvious path. Both bugs needed TWO participants or a cold
start — a single-user happy path finds neither.

⚠️ **Also check what a button cannot do.** `send_play_invite` raises
`not friends` unless there is an accepted friendship, and prod has **4**. The
rematch handshake is now correct and the invite still cannot send for most
pairs. A working button with an impossible precondition is still a dead button.

## 2. Typing and the on-screen keyboard

Reported THREE times across three modes from one root cause, and patched twice
by hand before anyone extracted the shape.

- Content grows ABOVE the input → the field slides under the keyboard.
- Content below the input → cannot be scrolled clear of the keyboard.

A mode needs **both** halves (`lib/useKeyboardAwareInput.js`). Stadiums had
only the inset and was still broken.

⚠️ **STILL NOT VERIFIED ANYWHERE.** Not in a desktop browser (no on-screen
keyboard), and not in the Simulator — it defaults to a connected hardware
keyboard and neither the global nor the per-device `ConnectHardwareKeyboard`
pref overrode it; AppleScript ⌘K is blocked without Accessibility permission.
**The fix rests on unit tests and code review only.** Either press ⌘K in the
Simulator manually, or test on Alex's device.

## 3. Slowness that is not slow code

Measuring tab switching gave **17ms paint, 733 DOM nodes, no tap delay** — all
healthy, and the conclusion was wrong. The real problem was a 52kB lazy chunk
nothing prefetched, so the first tap on Online showed an EMPTY pane while it
downloaded.

**Measure the empty frame, not the paint.** `scripts/experience-audit.mjs`
does this now. And remember every timing it reports is a **floor** — desktop
hardware, no radio, no thermal throttle.

## 4. Reachability — content that exists but cannot be reached

Two found in one morning, both silent:

- 4 questions orphaned by writing `club:"Tottenham"` where the bank uses
  `"Tottenham Hotspur"`.
- **135 Champions League questions** in a `cat` the app cannot route to.

Both now guarded (`tests/unit/question-club-names.test.js`). **Ask of any
content: what code path actually serves this to a player?**

## 5. Touch targets and visual quality

Nine controls under 44x44, including the Settings gear — where `.hdr-ic`
overrode `.icon-btn`'s correct 44 back down to 40.

---

## ⚠️ How to audit the auditors — read this before trusting any number

Every automated check I built this week was **wrong on its first run.** Not
subtly wrong; wrong in ways that would have produced a confident, useless list.

| detector | first-run failure |
|---|---|
| experience audit, contrast | read the CONTAINER's colour, not the text node's — reported the tab bar at 1.34:1 "invisible" when it is white on near-black |
| experience audit, contrast | treated `rgba(255,255,255,0.055)` as SOLID WHITE instead of compositing it |
| experience audit, tap targets | could not see its own hit-slop fixes, so it reported every FIXED control as broken |
| funnel gate test | passed with the gate deliberately disabled — it never triggered the event it claimed to test |
| trail freeze script | printed a green tick over a tampered history |
| native bundle check | reported the push fix MISSING because minification mangles internal names |

**So, non-negotiable for the next report:**

1. **Verify by a different route.** A negative result on something that should
   exist is the tell, not the finding.
2. **Break it on purpose.** A detector that has never failed is a hypothesis.
   Seed the defect, watch it fail, restore.
3. **State the false-positive rate.** An audit at 33% noise is one nobody
   reads — which is how the 3-6% precision audits earned their reputation.
4. **Say what was NOT verified**, explicitly. Two of this week's five fixes are
   unverifiable by me and the report must say so rather than imply coverage.

## What NOT to spend the report on

- Re-measuring things that cannot have moved. Rankings need a recrawl cycle;
  retention and ratings need weeks. Grading them 24h after a change produces
  noise dressed as a score.
- Deepening thin club packs. Traffic concentrates on Liverpool, Man City, Real
  Madrid, Barcelona, Chelsea. Hajduk Split has 15 questions and no players.
- Anything that ends in a list of 83 items ranked by nothing. Report #2 did
  that. The single highest-value item it produced was *publish the build that
  already exists.*

## The standing question

For every finding: **who can see this now?** If the answer is "nobody until an
upload, a toggle, or a review", say so in the same breath as "it's fixed".
1.6.4 is cut and unuploaded; the friend on 1.6.0 is missing fixes from
2026-08-17 onward.

---

## ⭐ NEW STANDING REQUIREMENT (Alex, 2026-08-23): grade the 5-star deciders

*"i would like for our next audit/scouting report to also grade us on things
that actually decide if people give you a 5 star or 4 star in app store etc.
Things we have to do to get to 5 stars, what we should be doing to improve our
current product, how we should be thinking going forward. some actionable
insight as to our path forward."*

So the next report MUST carry a **"Would this earn 5 stars?"** lens, graded
like any other area, built from evidence, not vibes:

1. **Walk the exact moments ratings are born.** The ask fires at streak
   milestones and after strong sessions (`src/lib/review.js`), and is
   suppressed for 24h after any bad moment (`markBadReviewMoment` call sites —
   crashes, reports, rage signals). Audit BOTH lists: is every genuinely bad
   moment registered as one? Is the ask landing at the player's proudest
   second, or merely a permitted one?
2. **Read what 4-star-not-5 actually means in this category.** Quiz-app
   reviews dock stars for: repeated questions, wrong/self-answering questions,
   ads/paywalls (we have neither — say so), crashes, and "ran out of content".
   Score us against that specific list with our own data (repeat rate from the
   14-day filter, question_reports WITH reasons now, crash-free rate from
   Sentry, bank depth per mode).
3. **The reasons channel is the star-predictor.** question_reports carries
   reasons as of 2026-08-23. A "wrong-answer" report is a 1-star review that
   chose to talk to us instead. Trend it; the report should treat report-rate
   per 1,000 sessions as a leading indicator of the rating.
4. **Per-storefront, always** (`npm run ratings`) — nobody sees an aggregate.
   GB is the flagship shelf; grade the path to 10+ ratings there specifically.
5. **End with the path, not the number.** Every area's writeup must answer
   Alex's three questions verbatim: what gets us to 5 stars, what improves the
   current product, how we should think going forward. An area writeup without
   a "do this next" is incomplete by definition.
