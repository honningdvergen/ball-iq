export const meta = {
  name: 'ball-iq-scout-2',
  description: 'Full re-scout of Ball IQ: 8 areas re-graded with deltas, 6 unexamined areas, competitive read, critic + synthesis',
  whenToUse: 'Second scouting report, 2026-08-21. Compare against docs/review-panel-raw.json.',
  phases: [
    { title: 'Panel', detail: '15 reviewers: 8 re-grades + 6 new ground + competitive' },
    { title: 'Critic', detail: 'what the panel STILL missed' },
    { title: 'Synthesis', detail: 'ranked plan + biggest lever' },
  ],
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['area', 'grade_10', 'letter', 'verdict', 'strengths', 'weaknesses', 'quick_wins', 'five_star_moves', 'evidence', 'looked_at'],
  properties: {
    area: { type: 'string' },
    grade_10: { type: 'number' },
    letter: { type: 'string' },
    prev_grade_10: { type: ['number', 'null'] },
    movement: { type: 'string', description: 'For re-graded areas: what actually changed since the last panel, and whether the grade moved. "n/a — new area" otherwise.' },
    verdict: { type: 'string', description: 'One or two sentences. The honest headline.' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    quick_wins: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'effort', 'impact'],
        properties: { title: { type: 'string' }, effort: { type: 'string' }, impact: { type: 'string' } },
      },
    },
    five_star_moves: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'why'],
        properties: { title: { type: 'string' }, why: { type: 'string' } },
      },
    },
    evidence: { type: 'array', items: { type: 'string' }, description: 'file:line, URL, SQL result or measured number. No claim without one.' },
    looked_at: { type: 'array', items: { type: 'string' }, description: 'What you actually OPENED or SCREENSHOTTED, not just read.' },
  },
}

const CONTEXT = `
You are on a review panel for Ball IQ, a solo-dev football trivia app.
  web: https://balliq.app/play (React+Vite PWA; \`main\` IS production)
  repo: /Users/alexanderbrynolsen/ball-iq  (src/App.jsx is a ~10k-line monolith)
  native: Capacitor — iOS live (1.6.0 approved), Android vc19 live on Play, 1.6.2 cut
  backend: Supabase prod project blcisypmngimqkwxrrdm (MCP connector is live; read-only SQL is free)

HOW THIS PANEL EARNS ITS KEEP — read carefully, the last one was graded on this:

1. USE YOUR EYES, NOT ONLY GREP. Alex's instruction verbatim: "use your eyes to
   grab screenshots so you not only measure but look at things." Open the actual
   page or screen and LOOK at it before grading anything visual or experiential.
   Browser tools are available via ToolSearch (mcp__Claude_Browser__* — use
   preview_start with a url, then computer{action:"screenshot"}, resize_window
   for phone widths). The iOS Simulator is BOOTED and running the app right now
   (mcp__Claude_Code_iOS_Simulator__control — screenshot/tap/swipe). A grade on
   something you never looked at is the failure mode being guarded against.

2. USE THE REAL TOOLS, don't hand-roll. ToolSearch for what you need. Notably:
   seo_core_web_vitals_tool (real Lighthouse/CrUX), seo_page_audit_tool,
   Microsoft Clarity (query-analytics-dashboard, list-session-recordings) for
   actual player behaviour, execute_sql against prod for real numbers, exa /
   WebSearch for competitor facts. A measured number beats a reasoned one.

3. EVIDENCE OR IT DIDN'T HAPPEN. Every strength and weakness needs a file:line,
   a URL, a SQL result, or a measured value in \`evidence\`. Record in
   \`looked_at\` what you actually opened or screenshotted.

4. NO FLATTERY, NO PADDING. This is a report Alex will act on. If an area is
   thin, say so and grade it low. If the previous panel over-graded it, say that
   too. Weaknesses are more valuable than strengths here.

5. Grade 1-10 with a letter. Be calibrated: 10 = best-in-class against real
   competitors, 5 = mediocre, and most things are not 8s.

FACTS ALREADY ESTABLISHED (do not re-derive, do not contradict without evidence):
  - Funnel re-measured 2026-08-14: DAU FLAT at 13-17 through 111 signups/30d.
    It is a leaky bucket — retention, not acquisition, is the constraint.
  - k-factor 0.23/wk (floor). 24% of signups are room-invite converts. Friend
    loop inert (0 friend-driven signups in 30d).
  - GSC: /lists is ~47-51% of impressions and ~4-5% of clicks. Only 6 of 51 list
    pages reach page 1. "X quiz with answers" already ranks top-10 for big clubs;
    bare "<club> quiz" terms are the weak half. Head term "football quiz" sits ~41.
  - Localised pages measurably work per-market (/es/ River Plate 134 clicks vs 8
    English); Turkish inverts it. US/Egypt localisation thesis is DEAD.
  - Ratings: both stores showed no rating at 50+ installs; a ratings floor
    shipped 0cb0702. Alex has only 2 testers and no orbit to ask.
  - Android FCM push went live and was VERIFIED in prod TODAY (2026-08-21).
  - Daily schedule runway is HEALTHY: Trail 389 days queued, Footle 400 entries.
  - In-app account deletion EXISTS (Settings > Account > Delete Account).
    Both of those were previous blind spots and are now closed — don't re-flag.
`

const RESCORE = [
  { slug: 'store-ratings', prev: 6, area: 'Store presence & ratings engine', brief: 'App Store + Play listings, screenshots, the ratings ask, review responding. Localised Play listings for 10 locales were entered TODAY but are saved as a DRAFT, not yet submitted for review. Look at the live store pages.' },
  { slug: 'gameplay-feel', prev: 7, area: 'Core gameplay feel — quiz engine + daily modes', brief: 'Play the games. Footle, Trail, Mystery, Stadiums, Daily 7, Classic. Juice, pacing, feedback, the moment-to-moment. Stadiums and the Footle keyboard both changed TODAY.' },
  { slug: 'retention', prev: 5, area: 'Retention & habit mechanics', brief: 'Streaks, reminders, push (now BOTH platforms), the Android widget, the 14-day back-catalogue, streak repair. This was the worst-graded area last time and the most worked-on since.' },
  { slug: 'social-loops', prev: 6, area: 'Social & viral loops', brief: 'Invites, challenge links, share cards, multiplayer, friends. k is 0.23 and the friend loop is inert — why, specifically, and what would move it.' },
  { slug: 'content-moat', prev: 8, area: 'Content quality of the question bank (the moat)', brief: 'The bank, explanations, distractor quality, freshness, anchoring. Graded 8 last time — is that still right, and is the moat actually defensible?' },
  { slug: 'competitive-position', prev: 6, area: 'Competitive position', brief: 'Named rivals, what they do better, where Ball IQ genuinely wins. Use real research on actual competing apps and sites, not assumptions.' },
  { slug: 'onboarding', prev: 7, area: 'Onboarding & first-run activation', brief: 'First run, the taster, guest mode, sign-in friction, the path to first game. Guest entry for invite links landed but is INERT pending a toggle.' },
  { slug: 'accessibility', prev: 7, area: 'Accessibility & inclusivity', brief: 'Contrast, targets, screen readers, colour-blind mode, language coverage. Note: Footle keys are 35.7-38.4pt wide, under Apple 44pt minimum — width is arithmetically maxed.' },
]

const NEWGROUND = [
  { slug: 'stability', area: 'Stability, crash handling & release safety', brief: 'The previous panel NEVER graded this. Sentry is wired (src/main.jsx, src/multiplayerRpc.js, docs/SENTRY_RULES.md). Does Sentry actually receive events from the NATIVE shells, or only web? What is the crash-free rate? What regression risk does the Android 1.5.1->1.6.x jump carry? Is there any release gate beyond `npm run build`? Check the boot path for hangs (there is a documented class of boot-await bugs).' },
  { slug: 'privacy-compliance', area: 'Privacy, consent & store compliance', brief: 'Previous blind spot. Compare the App Store privacy nutrition label and Play Data Safety form against what the app ACTUALLY collects (Microsoft Clarity session recording, Supabase, Sentry, AdSense on web only). GDPR consent for recording EU sessions — the dev is Norwegian and traffic is EU-heavy; is there a consent banner? Check public/privacy.html vs reality. NOTE: in-app account deletion EXISTS, that gap is closed — verify the rest. Flag anything rejection-class.' },
  { slug: 'tablet-desktop', area: 'Tablet & desktop experience', brief: 'Previous blind spot: nobody looked at any screen wider than 375px. iOS target is iPhone-only (TARGETED_DEVICE_FAMILY="1"). The desktop-web refresh is half-done (Home rebuilt; Daily/Profile/Friends/Settings/Quiz/Results outstanding). Most organic search traffic is desktop. LOOK at 1024/1440/1920 widths and at an iPad. Screenshot them.' },
  { slug: 'monetisation', area: 'Monetisation & pricing readiness', brief: 'Previous blind spot: ZERO coverage. Pro (2.0) is the stated plan with content free and features/cosmetics paid. AdSense has been stuck in review since 5 July with AD_SLOTS commented out. Is there ANY revenue path? What would Pro cost, and what is in it? What is the cost ceiling of Supabase Pro plus a season-start traffic spike for a solo dev with no income from this? Research what comparable apps charge.' },
  { slug: 'featuring-editorial', area: 'App Store featuring & editorial pitch', brief: 'Previous blind spot, and the critic called it "the only distribution channel that could move installs 10x that the panel never named." Evaluate Ball IQ against Apple\'s actual featuring criteria (widgets, localisation, iPad, accessibility, design quality, timely relevance). The football season is starting NOW — is there a pitchable sports-moment editorial window, and what would the pitch say? Research how Apple/Google featuring submissions actually work.' },
  { slug: 'backend-capacity', area: 'Backend capacity, cost & abuse surface', brief: 'Previous blind spot. Rate limiting on the anon key, RLS posture, what 10x season-start traffic does to the Supabase plan and bill. Repo memory records anon-full-DML defaults and RPC-grant lessons — verify current grants via SQL. docs/PRODUCTION_RUNBOOK.md exists and was never reviewed. Also: solo-dev ops — who notices an outage on a Saturday matchday, and is there any alerting at all?' },
]

phase('Panel')

const reviewers = [
  ...RESCORE.map((r) => () => agent(
    `AREA::${r.slug}\n\n${CONTEXT}\n\nYOUR AREA: ${r.area}\n\n${r.brief}\n\n` +
    `This area was graded ${r.prev}/10 by the previous panel on 2026-08-19. Read that ` +
    `panel's review of it in docs/review-panel-raw.json (the "reviews" array; match on ` +
    `the "area" field, it will be close to but not identical to your area name) so you ` +
    `can say what MOVED. Set prev_grade_10 to ${r.prev} and use \`movement\` to state ` +
    `plainly whether the work since actually shifted the grade, and why. Do not inflate ` +
    `the grade to reward effort — grade the CURRENT state against real competitors. If ` +
    `it did not move, say it did not move.`,
    { label: `regrade:${r.slug}`, phase: 'Panel', schema: REVIEW_SCHEMA },
  )),
  ...NEWGROUND.map((r) => () => agent(
    `AREA::${r.slug}\n\n${CONTEXT}\n\nYOUR AREA: ${r.area}\n\n${r.brief}\n\n` +
    `This area has NEVER been graded — it was a blind spot the last panel's own critic ` +
    `identified. There is no previous grade: set prev_grade_10 to null and movement to ` +
    `"n/a — new area". You are the first person to look at this, so be especially ` +
    `careful to establish facts rather than inherit assumptions, and say clearly if ` +
    `something here is worse than anyone realised.`,
    { label: `new:${r.slug}`, phase: 'Panel', schema: REVIEW_SCHEMA },
  )),
]

const reviews = (await parallel(reviewers)).filter(Boolean)
log(`panel returned ${reviews.length}/${reviewers.length} reviews`)

phase('Critic')

const CRITIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['blind_spots', 'grade_disputes', 'single_biggest_lever'],
  properties: {
    blind_spots: { type: 'array', items: { type: 'string' }, description: 'What THIS panel still failed to examine. Be specific and name what should have been opened.' },
    grade_disputes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['area', 'panel_grade', 'your_grade', 'why'],
        properties: { area: { type: 'string' }, panel_grade: { type: 'number' }, your_grade: { type: 'number' }, why: { type: 'string' } },
      },
    },
    single_biggest_lever: { type: 'string', description: 'The one thing that would move the product most, argued from the panel\'s own evidence.' },
  },
}

const critic = await agent(
  `AREA::critic\n\n${CONTEXT}\n\nYou are the completeness critic. Here is the full panel:\n\n` +
  JSON.stringify(reviews).slice(0, 160000) +
  `\n\nYour job is NOT to summarise. It is to find what this panel STILL missed, and ` +
  `where it graded wrongly. The previous panel's critic correctly identified eight blind ` +
  `spots (six of which became areas in this run) — match that standard. Ask what a ` +
  `reviewer would have had to OPEN to notice, name it, and say why its absence matters. ` +
  `Dispute any grade you think is generous; reward-for-effort inflation is the specific ` +
  `failure to hunt for. Then name the single biggest lever, argued from the panel's own ` +
  `evidence rather than your priors.`,
  { label: 'critic', phase: 'Critic', schema: CRITIC_SCHEMA, effort: 'high' },
)

phase('Synthesis')

const SYNTH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'overall_grade_10', 'movement_since_last', 'ranked_plan', 'stop_doing', 'competitive_edge'],
  properties: {
    headline: { type: 'string', description: 'The honest one-paragraph state of Ball IQ today.' },
    overall_grade_10: { type: 'number' },
    movement_since_last: { type: 'string', description: 'What genuinely improved since 2026-08-19 and what did not move at all.' },
    ranked_plan: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['rank', 'title', 'area', 'why_now', 'effort', 'expected_effect'],
        properties: {
          rank: { type: 'number' }, title: { type: 'string' }, area: { type: 'string' },
          why_now: { type: 'string' }, effort: { type: 'string' }, expected_effect: { type: 'string' },
        },
      },
      description: 'Ordered by return on Alex\'s time. Top item first. 12-18 items.',
    },
    stop_doing: { type: 'array', items: { type: 'string' }, description: 'Work that is not paying for itself and should be dropped or deferred.' },
    competitive_edge: { type: 'string', description: 'The defensible thing Ball IQ has that rivals do not, and how to press it.' },
  },
}

const synthesis = await agent(
  `AREA::synthesis\n\n${CONTEXT}\n\nPanel:\n${JSON.stringify(reviews).slice(0, 150000)}\n\n` +
  `Critic:\n${JSON.stringify(critic)}\n\n` +
  `Synthesise. Alex is ONE person with limited hours and no income from this product, ` +
  `so rank by return on HIS time, not by importance in the abstract. Fold the critic's ` +
  `disputes into your view rather than ignoring them. Be explicit about what is NOT worth ` +
  `doing — a plan with no stop_doing list is not a plan. The season has just started, ` +
  `which makes timing-sensitive items worth more this month than next.`,
  { label: 'synthesis', phase: 'Synthesis', schema: SYNTH_SCHEMA, effort: 'high' },
)

return { reviews, critic, synthesis }
