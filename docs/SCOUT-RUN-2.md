# Scouting report #2 — recovery card (2026-08-21)

⚠️ **Read this first if the session died mid-run.** Nothing is lost. Every agent
that finished wrote its result to disk before the session ended; only the
in-memory run is gone, and `resumeFromRunId` is same-session only.

```
run id      wf_b90f33f8-242
journal     /Users/alexanderbrynolsen/.claude/projects/-Users-alexanderbrynolsen-ball-iq-src/c6c4d416-cca9-4515-bc5c-315a9e6d20f0/subagents/workflows/wf_b90f33f8-242
script      scratchpad/scout.mjs (copy committed below as docs/scout-2-script.mjs)
launched    2026-08-21 ~14:45 local
```

## To recover, at any point

```bash
node scripts/scout-harvest.mjs \
  ~/.claude/projects/-Users-alexanderbrynolsen-ball-iq-src/c6c4d416-cca9-4515-bc5c-315a9e6d20f0/subagents/workflows/wf_b90f33f8-242 \
  docs/scout-panel-2-raw.json
```

That prints every area recovered with its grade, and writes the machine copy.
It works mid-run — run it as often as you like. It was proven against the
PREVIOUS panel's journal before this run started, so it is not untested code.

Every panel prompt opens with an `AREA::<slug>` marker precisely so the
harvester can attribute a result without depending on ordering. (The first
panel lacked these markers, which is why harvesting it returns results that are
correct but unattributed.)

## What this run covers

**8 areas re-graded with before→after deltas** (previous grade in brackets):

| slug | area | prev |
|---|---|---|
| `store-ratings` | Store presence & ratings engine | 6 |
| `gameplay-feel` | Core gameplay feel — quiz engine + daily modes | 7 |
| `retention` | Retention & habit mechanics | 5 |
| `social-loops` | Social & viral loops | 6 |
| `content-moat` | Content quality of the question bank | 8 |
| `competitive-position` | Competitive position | 6 |
| `onboarding` | Onboarding & first-run activation | 7 |
| `accessibility` | Accessibility & inclusivity | 7 |

**6 areas never graded before** — these were the previous panel critic's own
blind spots:

| slug | area |
|---|---|
| `stability` | Stability, crash handling & release safety |
| `privacy-compliance` | Privacy, consent & store compliance |
| `tablet-desktop` | Tablet & desktop experience |
| `monetisation` | Monetisation & pricing readiness |
| `featuring-editorial` | App Store featuring & editorial pitch |
| `backend-capacity` | Backend capacity, cost & abuse surface |

Then `critic` (what THIS panel still missed + grade disputes) and `synthesis`
(ranked plan by return on Alex's time, plus an explicit stop-doing list).

## Two blind spots were closed before launch, cheaply

Checked by hand rather than spending a reviewer on them:

- **In-app account deletion EXISTS** — Settings → Account → Delete Account,
  and it is documented in both the privacy policy and the FAQ. The previous
  critic flagged this as rejection-class-if-missing; it is not missing.
- **Daily schedules are not drying up** — Trail has **389 days** queued,
  Footle **400** entries. The critic's "runs dry mid-September" worry is unfounded.

Panel prompts state both as established fact so no reviewer wastes effort
re-deriving them.
