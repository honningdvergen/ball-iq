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
Hand-curated football trivia. 3,500+ questions, daily challenges, online multiplayer, streak tracking. Built for fans who want depth.
```
(154 chars)

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
• No ads, ever
• No tracking, no analytics, no data sold or shared

We're a small team in Norway, building Ball IQ because we love football and we wanted a trivia app that respects how much real fans actually know. Have feedback? Email hello@balliq.app — every message goes to a human.
```
(1,816 chars — well under the 4,000 cap)

### Keywords (100 chars total, comma-separated)

```
football,trivia,quiz,soccer,worldcup,premier league,laliga,bundesliga,fifa,wordle
```
(81 chars)

**Strategy:** prioritized broad sport terms first (`football`, `soccer`),
then mode-affinity terms (`trivia`, `quiz`, `wordle`), then competition
names (`worldcup`, `premier league`, `laliga`, `bundesliga`, `fifa`). Apple
doesn't show keywords to users; they only affect search ranking.

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

1. The app supports both guest mode and signed-in mode. Guest mode requires no account and exercises every single-player game mode. To test multiplayer:
   - Email: appreview@balliq.app
   - Password: [REDACTED — Alex to set before submission]

2. To test the online multiplayer flow:
   - Sign in with the above account
   - Tap "Play with Friends" → "Online Multiplayer"
   - Tap "Create Room" — a 6-character code appears
   - On a second device (or the iPhone simulator), sign in with a different account or use guest mode and tap "Join with Code"

3. Differentiated functionality beyond the website:
   - Native haptic feedback on every quiz answer and streak tick
   - Offline gameplay — full game modes work without network; results sync when reconnected
   - Native iOS share sheet for Footle / Daily results
   - Universal Links: tapping a balliq.app/join/CODE link from Messages opens this app directly into the join flow

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
3. **Footle** mid-game: 3 guesses in showing greens/yellows/greys, virtual keyboard below. Caption: "Daily football word puzzle."
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

## Open items for Alex's review

1. **Description copy** — paragraph-by-paragraph, mark anything that overclaims or sounds AI-generated. Particular spots to scrutinize:
   - "Built differently" section — does the "no ads ever" promise hold for v1.1+?
   - "Daily updates and fact-checking" — we DO ship fact updates (cf Bruno earlier today). Honest claim, good.
   - "We're a small team in Norway" — singular "we" or "small team" — keep as "small team" for the friendly framing?
   - Mode names: confirm canonical naming (e.g., "Daily 7" vs "Today's 7" — code calls it both in different places; the App Store listing should pick ONE).
2. **Promotional text (App Store only — 170 chars, updatable without re-review)** — currently 154 chars; room to make sharper if there's a punchier angle.
3. **Keywords** — review the 10 I picked. Drop or swap any. Apple allows 100 chars total; I'm at 81 so there's room.
4. **App Review demo account** — Alex needs to create `appreview@balliq.app` (or whatever address) and set a known password before submission. The reviewer instructions reference it.
5. **Screenshot captions** — overlay text on each store screenshot. Drafts above; Alex may have stronger lines.
6. **Feature graphic for Play** — confirm we should derive from og-image template, or design separately?
7. **Country availability** — confirmed "all countries" per Sprint #81 brief, but Apple has a list of countries we can't ship to (Cuba, Iran, North Korea, Syria, Crimea). Default selection excludes those; confirm we accept the default.
8. **Pricing tier** — Free (Tier 0) confirmed. For v1.1 if we add an optional "remove ads" tier, that's IAP and triggers Apple's 15% fee structure.

---

This draft is locked unless Alex requests changes. Final version
attached to App Store Connect / Play Console listings during Phase 6
submission window.
