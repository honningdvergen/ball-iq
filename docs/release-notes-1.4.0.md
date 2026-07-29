# Ball IQ 1.4.0 — release notes

- **iOS:** build 51, MARKETING_VERSION 1.4.0 (Xcode → Archive → Distribute)
- **Android:** versionCode 9, versionName 1.4.0 —
  `~/Downloads/BallIQ-1.4.0-versionCode9.aab`

Previously live: **1.3.3 / versionCode 6** (Play, 27 July). So these notes cover
everything between 1.3.3 and 1.4.0, not just the last session.

⚠️ Play needs the `<en-US>` language tags and caps each language at **500
characters**. The block below is 431 characters including tags.

---

## Google Play — "Hva er nytt" (paste verbatim, tags included)

```
<en-US>
Faster start: onboarding is one screen now, so you are playing within seconds.

Footle opens straight on the puzzle instead of an explainer, and answers are always 5-8 letters.

Online multiplayer now earns XP toward your level.

Rematch and Challenge tell you whether your opponent was actually notified.

Plus fact-checked corrections across the question bank.
</en-US>
```

## App Store — "What's New in This Version"

```
Faster start — onboarding is a single screen now, so you are playing within seconds instead of tapping through setup.

Footle opens straight on the puzzle. The explainer is gone (the board teaches itself), and every answer is now 5-8 letters.

Online multiplayer finally earns XP toward your level — it was the only mode that paid nothing.

Rematch and Challenge now tell you whether your opponent was actually notified, instead of leaving you waiting in an empty lobby.

Plus fact-checked corrections across the question bank and a wider Footle keyboard.
```

---

## Why these lines and not others

Only user-visible changes are listed. Deliberately left out because a player
cannot see them: the bank-index split, the SEO/localisation pages (web only),
the internal-link work, and the rating-prompt lifetime-cap fix.

**The claim about Footle answers is safe to publish.** Verified 2026-07-29: all
16 non-conforming answers are in the published past, #87 (RICE) was the last
4-letter one, and `tests/unit/wordle-schedule.test.js` now fails the build if a
future answer breaks the 5-8 rule. Proven by injecting one and watching it fail.

**MP XP is listed but NOT device-verified** — it needs two live clients (Alex's
pending 2-device test). If it turns out not to fire, this line has to come out
of the next release notes rather than stay as an unearned claim.

## The Android API-36 warning resolves itself with this upload

Play flags "Appen må målrettes mot Android 16 (API-nivå 36) eller høyere",
deadline **31 Aug 2026**, penalty = no more app updates. It is NOT an
outstanding task: `android/variables.gradle` already carries
`targetSdkVersion = 36` (commit `8cdb73f`), and the merged manifest inside
versionCode 9 confirms `targetSdkVersion="36"`. The warning is against the
PUBLISHED build (versionCode 6 / 1.3.3), which predates that bump — so shipping
9 clears it.

⚠️ Still open, and related: Play's three "recommended actions" (edge-to-edge
coverage, deprecated fullscreen APIs, R8). `grep` finds no `enableEdgeToEdge` /
`WindowCompat` / `setDecorFitsSystemWindows` anywhere in
`android/app/src/main`, and targetSdk 36 means Android 15+ **enforces**
edge-to-edge. Worth a device check on a modern Android after this ships — if
content sits under the status or nav bar, that is why.
