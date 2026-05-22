# Sentry alert rules — Ball IQ

Mirrors the alert rules configured in the Sentry dashboard for the
`ball-iq/ball-iq` project. Drafted Sprint #67 II3; **Alex confirms this
doc matches the dashboard state**. If the doc and dashboard diverge,
update the dashboard side to match this file (or vice-versa) and bump
the "Last verified" line below.

**Last verified:** 2026-05-07 (initial setup) — Sprint #67 II3 catalogued
from memory; pending dashboard cross-check by Alex.

**Sentry project:** `ball-iq` org / `ball-iq` project.
**Sentry SDK init:** `src/main.jsx`, environment-gated on `VITE_SENTRY_DSN`.
**Source maps:** uploaded by `@sentry/vite-plugin` when `SENTRY_AUTH_TOKEN` is set.

---

## Rule 1 — New issue → email

**Trigger:** A previously-unseen issue fingerprint surfaces in production.

**Condition:** "A new issue is created" (Sentry built-in).

**Filter:** none — first occurrence of any unhandled exception, captured
exception, or captured message routes here.

**Action:** Email notification to the project owner address.

**Target email:** as configured in Sentry organisation settings → owner email.

**What this catches:** anything new. Particularly the captureMessage sites
in `src/useAuth.jsx` (lines ~158, ~174) for empty profile / user_game_state
rows, and the captureException site in `src/multiplayerRpc.js` line 145 for
retry-layer-exhausted RPC failures (tagged by `rpc:name`).

**Tuning notes:**
- A noisy day-1 release may trip this rule a lot. Mute or downgrade to
  "issue assigned to me" if inbox saturation becomes a problem.
- Sentry deduplicates by fingerprint; a recurring same-shape error
  shows up here only once even at high volume.

---

## Rule 2 — 10 events in 5 minutes → email

**Trigger:** Same issue fires ≥10 times within 5 minutes.

**Condition:** "An issue is seen more than 10 times in 5 minutes" (Sentry
built-in metric alert).

**Filter:** all environments (or limit to `production` if dev/preview
noise becomes a problem — currently unfiltered per setup memory).

**Action:** Email notification.

**Target email:** same as Rule 1.

**What this catches:** sudden spike in a single error type. A bad deploy
that breaks one code path will trip this within minutes. The launch-day
canary.

**Tuning notes:**
- The 10/5min threshold is conservative for a low-traffic launch. Post-
  launch, when DAU climbs into the thousands, this threshold may need
  raising to 50/5min or 100/5min to avoid alert fatigue from heavy
  same-error volume.

---

## Rule 3 — (gap)

Rule 3 was not described in the Sprint #67 II3 brief. If the dashboard
has a Rule 3 that the brief skipped, document it here on cross-check.
Likely candidates given the setup:
- Performance regression (slow page-load above threshold)
- High-severity tag filter (e.g., `level:fatal`)
- Specific environment isolation

Leaving as placeholder until Alex confirms.

---

## Rule 4 — 5× rate spike → email

**Trigger:** Event volume for a single issue is 5× the recent baseline.

**Condition:** "Event frequency increased by 5x" (Sentry built-in
comparison alert).

**Comparison window:** as configured (default Sentry comparison is
"% change in the last hour vs the previous 24h hour-average" or similar
— confirm exact window in dashboard).

**Filter:** all environments.

**Action:** Email notification.

**Target email:** same as Rule 1.

**What this catches:** errors that were rare before suddenly going
mainstream — e.g., a code path that fires only on a specific browser
version that just received a Chrome update.

**Tuning notes:**
- Comparison alerts can false-positive when daily volume is low (small
  baseline ÷ small denominator = noisy ratio). Watch for spurious
  triggers in the first few weeks post-launch.

---

## SDK context that flows into every event

Per Sprint #61 DD3, every Sentry event automatically carries:

| Field | Set where | Value |
|---|---|---|
| `user.id` | `useAuth.jsx` onAuthStateChange + getSession | UUID of authenticated user; cleared on sign-out. Email + username scrubbed by `beforeSend` in `main.jsx`. |
| `tags.screen` | `App.jsx` AppInner effect | `home` / `daily` / `wordle` / `quiz` / `profile` / `settings` / etc. |
| `tags.mode` | `App.jsx` QuizEngine effect | `classic` / `survival` / `hotstreak` / `legends` / `balliq` / `chaos` / `daily` / `truefalse` — only set while a quiz is mounted. |
| `tags.question_id` | `App.jsx` QuizEngine per-question effect | QB id (`q_<6hex>`); set per question, cleared between questions. |
| `tags.rpc` | `multiplayerRpc.js` captureException | RPC name (`create_room`, `join_room`, `advance_question`, `submit_answer`, etc.) — only on retry-exhausted failures. |

These tags make every event answerable as "who hit this, on what surface,
in what mode, on which question, in which multiplayer RPC". 2am-launch-
day debugger should not have to spelunk breadcrumbs.

## Breadcrumbs

| Category | Where | Message |
|---|---|---|
| `auth` | useAuth signIn / signUp / signOut | "sign-in attempted" / "sign-up attempted" / "sign-out initiated" |
| `nav` | AppInner screen-change effect | "screen → {screen}" |
| `game` | QuizEngine mount | "quiz started" (data: mode, diff, total) |
| `game` | QuizEngine registerAnswer | "answer submitted" (data: qid, idx, correct, timeout, type) |
| `game` | QuizEngine end-of-quiz | "quiz ended" / "quiz ended (survival fail)" |
| `multiplayer` | App.jsx create-room / join-room | "create-room initiated" / "join-room initiated" |

## PII handling

`main.jsx` `beforeSend` callback strips:
- `event.user.email`
- `event.user.username`
- Any `Authorization` / `apikey` headers in breadcrumbs

The `user.id` field is retained — it's a UUID, not PII on its own. We can
correlate to a user in the database but the Sentry payload doesn't expose
personal info.

## Sentry sample rate

`tracesSampleRate: 0.1` — 10% of transactions are sent for performance
monitoring. Error events are sent at 100% (default for `captureException` /
`captureMessage`). Post-launch, if Sentry quota becomes a concern, lower
`tracesSampleRate` further or filter on environment.

## When to update this file

- A new alert rule is added in the dashboard → add a section here.
- An existing rule's threshold/condition changes → update the "Condition"
  and "Tuning notes" lines and bump the "Last verified" date.
- A new captureException / captureMessage site is added in code → list it
  under the relevant rule's "What this catches" section.
- A new tag or breadcrumb category is introduced → add to the SDK context
  tables.

If this doc and the dashboard diverge, the next sprint that touches Sentry
should pause to reconcile them.
