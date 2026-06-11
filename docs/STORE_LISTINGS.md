# Ball IQ — Store listings (drafts for Alex's review)

Sprint #81 YY1. Drafts for both App Store and Play Store v1.0
submissions. Each section is editable; Alex marks up or replaces
before submission.

---

## App Store Connect — iOS

### App Information

| Field | Value | Notes |
|---|---|---|
| App Name | `Ball IQ` | 30-char limit; current name uses 6 |
| Subtitle | `The Ultimate Football Quiz` | 30-char limit; current uses 26 |
| Bundle ID | `app.balliq` | Locked in this sprint |
| SKU | `balliq-ios-1` | Internal Apple identifier, never shown to users |
| Primary Category | `Trivia` | |
| Secondary Category | `Sports` | |
| Age Rating | `4+` | No objectionable content; all questions are football-trivia |
| Content Rights | Does not contain, show, or access third-party content | We author all questions; football facts aren't copyrightable |
| Price | `Free (Tier 0)` | |
| Availability | All countries (default) | Per Alex's confirmation |
| Has IAP / Subscription | No | v1.0 confirmed no IAP |

### Promotional text (170 chars; can change without app review)

```
Football trivia for real fans. Daily puzzles, multiplayer matches, a streak worth defending. Built by football lovers.
```
(118 chars)

### App description (4,000 chars max)

```
Ball IQ — The Ultimate Football Quiz

Test your football knowledge against 3,500+ hand-curated trivia questions across 10 game modes. From Premier League legends to World Cup history, La Liga to the Bundesliga — Ball IQ has the depth real fans demand.

GAME MODES
• Daily 7 — a fresh 7-question quiz every day. Share your score, build a streak.
• Footle — the daily football-surname word puzzle. One player per day, six guesses.
• Classic — pick your difficulty, answer 10 questions, beat your best.
• Survival — keep going until you get one wrong. How long can you last?
• Hot Streak — 60 seconds, maximum questions. Pure sprint mode.
• Online Multiplayer — challenge a friend in real time over a shared room code.
• Pass-and-Play — local multiplayer on a single device for two to six players.
• Ball IQ Test — 15 calibrated questions produce a score from 60 to 160. Comparable across players.
• Legends — a focused mode on football's icons across eras.
• Chaos — quotes, moments, the madness. Trivia from the corners of the game.

DAILY HABIT
• Streak tracking across all game modes
• XP and level system that grows with you
• Friends leaderboard so you can compete with your group chat
• Per-day review screens — see every answer you missed

BUILT DIFFERENTLY
• Hand-curated questions, not AI-generated noise
• Daily updates and fact-checking — when a record falls, the questions get refreshed
• Works offline — your scores sync when you're back online
• No ads at launch
• No tracking, no analytics, no data sold or shared

Built solo from Norway by someone who loves football and wanted a trivia app that respects how much real fans actually know. Have feedback? Email hello@balliq.app — every message goes to me.
```
(1,808 chars — well under the 4,000 cap)

### Keywords (100 chars total, comma-separated)

```
football,trivia,quiz,soccer,worldcup,premier league,laliga,bundesliga,daily,puzzle
```
(82 chars)

**Strategy:** prioritized broad sport terms first (`football`, `soccer`),
then mode-affinity terms (`trivia`, `quiz`, `daily`, `puzzle`), then
competition names (`worldcup`, `premier league`, `laliga`, `bundesliga`).
Apple doesn't show keywords to users; they only affect search ranking.
Trademark-risk terms (`fifa`, `wordle`) deliberately omitted.

### What's New (for v1.0)

```
First release. Welcome to Ball IQ. Drop us a note at hello@balliq.app — we read every message.
```

### Support URL

`https://balliq.app/` (lands on the marketing page with help affordances)

### Marketing URL

`https://balliq.app/`

### Privacy Policy URL

`https://balliq.app/privacy.html`

### App Privacy ("nutrition label")

Per Sprint #73 OO2 Privacy Policy rewrite — what we actually collect:

**Data Used to Track You:** *None*

**Data Linked to You** (user identity associated with the data):
- Contact Info → Email Address
- User Content → Other User Content (game results, custom username)
- Identifiers → User ID (Supabase UID)
- Usage Data → Other Usage Data (game scores, completion counts — used for cross-device sync, NOT for analytics)

**Data Not Linked to You:**
- Diagnostics → Crash Data, Other Diagnostic Data (Sentry crash reports; email + auth tokens scrubbed in beforeSend per `main.jsx`)

### Age Rating Questionnaire answers

| Question | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humor | None |
| Alcohol, Tobacco, or Drug Use | None |
| Mature/Suggestive Themes | None |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Unrestricted Web Access | No |
| Gambling and Contests | No |
| Medical/Treatment Information | No |
| Age Gate | No |

**Resulting rating: 4+**

### App Review notes (private — Apple reviewer only)

```
Ball IQ is a football trivia app. Reviewer testing tips:

Most of Ball IQ — all solo game modes, local pass-and-play multiplayer,
profile, and settings — is accessible without an account via "Continue
as guest" on the launch screen.

Online 1v1 multiplayer and the social features (friends, online
leaderboards) require an account. Two demo accounts are provided so the
full online flow can be tested:

  Account A — username balliqdev1
    Email: balliq.app.dev@gmail.com
    Password: [shared password — entered in ASC at submission]

  Account B — username balliqdev2
    Email: balliq.app.dev+rev@gmail.com
    Password: [same shared password]

To test online multiplayer end-to-end (two devices, or sign out and
back in between):

  1. On device 1, sign in as Account A. Tap Multiplayer → Online.
     The app creates a room and shows a 6-character code.
  2. On device 2, sign in as Account B. Tap Multiplayer → Online →
     Join with code. Enter the code from step 1.
  3. Both players answer 10 quiz questions in real time. Highest
     score wins.

Note: online multiplayer requires sign-in on BOTH devices — guests
tapping Online are prompted to sign in. This is intentional (rooms
are keyed to account identity).

"Sign in with Apple" and "Continue with Google" are also available on
the launch screen and work identically to email sign-in.

Differentiated functionality beyond the website:
  - Native Sign in with Apple (ASAuthorizationController system sheet)
  - Native haptic feedback on every quiz answer and streak tick
  - Offline gameplay — full game modes work without network; results
    sync when reconnected
  - Native iOS share sheet with rendered result cards for Footle /
    Daily results
  - Universal Links: tapping a balliq.app/join/CODE link from Messages
    opens this app directly into the join flow

Account deletion: Settings → Danger zone → Delete account (removes the
account and all server-side data).

Any questions: hello@balliq.app — Alexander Bryn Olsen (developer).
```

### Screenshots (5 per device class)

Required device classes:
- 6.7" (iPhone 14/15/16 Pro Max) — 1290 × 2796
- 6.5" (iPhone Plus / older Pro Max) — 1242 × 2688 — Apple auto-derives from 6.7" if not provided
- 5.5" (iPhone 8 Plus) — 1242 × 2208 — still REQUIRED by Apple for older device support

Per-screenshot proposal (capture via Playwright in Phase 5 once Capacitor build is on-device, or via web at viewport 393×852 then upscale):

1. **Home tab** showing the mode grid with WC2026 tile and active Daily/Footle pills. Caption overlay: "10 game modes. One football quiz."
2. **Mid-quiz** screen with a Premier League question, 4 options, streak counter at 5. Caption: "3,500+ hand-curated questions."
3. **Footle** mid-game: 3 guesses in showing greens/yellows/greys, virtual keyboard below. Caption: "One player, six guesses, every day."
4. **Daily tab** Recent Fixtures list with the matchday rows + T7 scores (post Sprint #71 MM2). Caption: "Build a streak. Track every day."
5. **Profile tab** with XP bar / level / Friends leaderboard. Caption: "Climb the league with your group chat."

---

## Google Play Console — Android

### Store Listing

| Field | Value |
|---|---|
| App Name | `Ball IQ` |
| Short description (80 chars) | `The ultimate football quiz. 3,500+ questions across 10 game modes.` (66 chars) |
| Full description | (same as App Store description above, paste verbatim — Play allows 4,000 chars too) |
| Application ID | `app.balliq` |
| Category | `Games → Trivia` |
| Tags | `Trivia`, `Sports`, `Word` |
| Email | `hello@balliq.app` |
| Website | `https://balliq.app/` |
| Privacy Policy | `https://balliq.app/privacy.html` |
| Price | Free |
| Countries | All (default) |
| Has IAP | No |

### Content Rating (IARC questionnaire)

Same answers as iOS (no violence, no sexual content, no gambling, etc.). Expected ratings:
- ESRB: `Everyone`
- PEGI: `3`
- USK: `0`
- IARC generic: `Ages 3+`

### Target Audience and Content

| Question | Answer |
|---|---|
| Target age group | `13+ to 17`, `18+` (matches Apple Family Sharing model; signed-in mode requires email which under COPPA = 13+) |
| Children-only content | No |
| Designed primarily for families/children | No |

### Data Safety section (Play Console equivalent of App Privacy)

**Data collected:**
| Type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| Email address | Yes | No | Required (for signed-in mode only) | Account management, sign-in |
| Username | Yes | No | Required (signed-in) | Account management, social (friends list) |
| Photos | Yes (avatar uploads) | No | Optional | Account management |
| App activity (in-app actions, in-app search) | Yes | No | Required | App functionality, sync |
| App info and performance (crash logs, diagnostics) | Yes | No | Optional | Analytics (technical) — Sentry |
| Device IDs | No | — | — | We don't collect device IDs |

**Data security practices:**
- All data encrypted in transit (HTTPS via Vercel + Supabase TLS)
- Users can request data deletion (Settings → Account → Delete Account fully removes everything)
- Independent security review: No (note: solo team, no third-party audit yet)

### Feature graphic (1024 × 500)

Generate via the existing og-image template (Sprint #73 OO3 produced 1200×630). Compress + crop to 1024×500. Single asset; not per-device.

Composition: icon on left third, wordmark "Ball IQ" + tagline "The Ultimate Football Quiz" on right two-thirds. Same #0F1117 background. Same accent green for IQ.

### Screenshots (Play allows 2-8; recommend 5)

Same 5 screen captures as App Store but at Play's preferred phone size 1080×1920 (just rescale the captured 393×852 → 1080×1920 or capture fresh at Pixel 7 viewport).

Tablet screenshots (7" + 10") optional — skip for v1.0 unless we want to position for tablet category surfacing.

### App content questionnaire

| Question | Answer |
|---|---|
| Has ads? | No |
| In-app purchases? | No |
| Has account creation/login? | Yes (email + password) |
| Government app? | No |
| News app? | No |
| Health/Medical? | No |
| Designed for children? | No |
| Refund policy URL | Not applicable (free app, no IAP) |

### Release tracks plan

1. **Internal testing track** — Alex + 1-3 trusted testers. Same APK as production. Hidden listing.
2. **Closed testing** (optional, skip if Internal goes smoothly) — opens to 5-10 invited testers.
3. **Production** — staged rollout 20% → 50% → 100% over 24-48h. Allows pulling release if a crash surge emerges.

---

## Cross-store consistency checklist

| Item | App Store | Play Store | Match? |
|---|---|---|---|
| App name | Ball IQ | Ball IQ | ✓ |
| Bundle / App ID | app.balliq | app.balliq | ✓ |
| Primary category | Trivia | Trivia | ✓ |
| Age rating | 4+ | Ages 3+ (IARC) | ✓ equivalent |
| Price | Free | Free | ✓ |
| Description | (long form, same text) | (long form, same text) | ✓ |
| Privacy URL | https://balliq.app/privacy.html | same | ✓ |
| Support email | hello@balliq.app | same | ✓ |
| Has IAP | No | No | ✓ |
| Has ads | No (implied) | No (declared) | ✓ |
| Screenshots count | 5 | 5 | ✓ |
| Languages | English (en-GB primary) | English | ✓ |

---

## Resolved decisions (locked from Alex's Sprint #81 review)

1. ✅ **Description copy** — "no ads, ever" softened to "no ads at launch" (preserves IAP optionality for v1.1). Closing paragraph rewritten to solo-founder voice ("Built solo from Norway by someone who loves football…"). Mode-naming locked to **"Daily 7"** across the listing. *(In-app code uses both "Daily 7" and "Today's 7" inconsistently — tracked as v1.1 follow-up sprint, see below.)*
2. ✅ **Promotional text** — replaced with "Football trivia for real fans. Daily puzzles, multiplayer matches, a streak worth defending. Built by football lovers." (118 chars)
3. ✅ **Keywords** — `fifa` and `wordle` removed (trademark risk); replaced with `daily` and `puzzle`. Final string at 82 chars.
4. ✅ **App Review demo accounts** — superseded 2026-06-11: two accounts created for the two-device online-MP flow — `balliqdev1` (balliq.app.dev@gmail.com) and `balliqdev2` (balliq.app.dev+rev@gmail.com), shared password entered directly in ASC (never committed to git).
5. ✅ **Screenshot captions** — caption #3 updated to "One player, six guesses, every day." Others unchanged.
6. ✅ **Feature graphic for Play** — derived from existing og-image template. Single 1024×500 asset.
7. ✅ **Country availability** — accept Apple's default (auto-excludes embargoed countries: Cuba, Iran, North Korea, Syria, Crimea).
8. ✅ **Pricing tier** — Free (Tier 0) confirmed for v1.0. v1.1 IAP path left open via #1.

## v1.1 follow-up sprint items surfaced by this review

- **Mode-name unification:** in-app code uses both "Daily 7" and "Today's 7" in different surfaces (showToast strings, mode labels, HOW_TO_PLAY entries). Listing copy uses "Daily 7" exclusively per Alex's call. Small sprint post-launch to unify all in-app references to "Daily 7". Low risk, mechanical search/replace + verification.

---

This draft is locked. Final version attached to App Store Connect /
Play Console listings during Phase 6 submission window.
