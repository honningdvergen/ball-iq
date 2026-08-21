# The money question

**Status: UNDECIDED. This document exists to be answered, not admired.**

Written 2026-08-21 as item 12 of scouting report #2. The panel produced roughly
45 quick wins and 38 five-star moves across ten reviewers and did not contain
one sentence about revenue. Its own critic called that the biggest hole in the
review. Everything below is measured, not estimated.

---

## The question, in one line

**Is Ball IQ a business or a hobby — and if it is a business, what number
proves it and by when?**

Everything else here is arithmetic. That sentence is the decision, and it is
Alex's alone. The honest answer may well be "a hobby that pays for itself",
which is a perfectly good answer — it is just not currently written down, so
every roadmap decision gets made without it.

---

## Where things actually stand (prod, 2026-08-21)

| | |
|---|---|
| Accounts | **205** (121 created in the last 30 days) |
| Signed in, 30d | 126 |
| Played something, 30d | 89 |
| Played something, 7d | 41 |
| Plays recorded, 30d | 1,145 |
| Club-page quiz plays, 30d | **227** — of which **222 landed in the last 7 days** |
| Reachable by push | **37** of 205 |
| Accepted friendships | **4** |
| Revenue, all time | **£0** |

Two of those deserve a second look.

**The club pages are the busiest game in the product and they are anonymous.**
`club_quiz_results` has no `user_id` column — it is unattributed telemetry. So
the surface carrying ~39% of all play cannot be sold an in-app purchase,
because the people on it do not have accounts and mostly never will. Anything
monetising them is advertising or an upsell into the app, not IAP.

**Growth is real but young.** 121 of 205 accounts are less than a month old.
Any conversion rate calculated today is calculated on a base that mostly
arrived last week.

## What it costs to keep the lights on

| | monthly |
|---|---|
| Supabase Pro | ~$25 |
| Vercel | $0–20 depending on plan |
| Apple Developer | $99/yr ≈ $8 |
| Google Play | $25 once, amortised ≈ $0 |
| **Floor** | **roughly $35–55/month** |

## The three honest options

### A. Pay for itself, then stop
Target: cover infrastructure. **~13 buyers a month at $2.99** (net ~$2.54 after
Apple's 15% small-business rate, which is now signed) clears the floor. At a
2% conversion rate that needs ~650 monetisable monthly actives against roughly
90 today. Reachable in months, not years, if the season delivers.

### B. Meaningful side income
Target: ~$500/month. Needs ~200 buyers a month, i.e. ~10,000 monetisable MAU
at 2%. That is a different product stage entirely and should not be planned
for until A is comfortably passed.

### C. Licence the bank, not the app
The only asset at genuinely licensable scale: **6,694 questions, 84% carrying
a written explanation, across 86 club packs**, with a build-gated plausibility
audit. No measured competitor ships explanations at all. `docs/PARTNERSHIP-
PITCH.md` already exists. This is emails and a contract rather than
engineering, and it is not exclusive with A.

## What the evidence says about HOW, if the answer is A

- **A one-time unlock, not a subscription.** Every measured competitor in the
  category sells a one-time unlock at $1.99–$2.99. The only subscription in
  the set belongs to a fifteen-year-old platform with a back catalogue to
  justify it. This contradicts the "Pro subscription at 2.0" plan currently on
  record, which is exactly why it needs deciding rather than inheriting.
- **AdSense is not the answer and never was.** At the site's measured 2,570
  pageviews it would earn roughly **$13–26/month** — less than the Supabase
  bill alone. Worth having as a floor; not worth planning around.
- **Content stays free.** Already decided and still right: the bank is the
  moat and paywalling it would blunt the one surface that converts. Sell
  features and cosmetics — of which, note, **zero are currently built**.
- **Do not build billing until the number is chosen.** There is no
  RevenueCat, Stripe, StoreKit or BillingClient anywhere in the repo. That is
  the correct state for an undecided product and the wrong state for a decided
  one.

## Already done, so the runway is clear either way

- Apple **Paid Applications Agreement** signed (2026-08-21).
- Apple **Small Business Program** — 15% instead of 30%.
- Google Play **payments profile** linked; EEA rate now as low as 10%.

None of that commits to selling anything. It removes a multi-week wait from
the day the decision is made, which was the whole point of doing it early.

## The recommendation, for what it is worth

**Option A, with C running alongside, and a date on it.**

A is within reach on the current trajectory and turns an anxious open question
into a target. C costs emails rather than engineering and monetises an asset
that otherwise sits idle. B is a distraction at 205 accounts.

The thing that would make this real: **write the target number and the date at
the top of this file.** Until then every roadmap decision is being made without
knowing what the product is for, and the next panel will hand over another 83
items with no way to rank them by what they earn.

---

## ⚠️ Decision — ANSWERED 2026-08-21

**Alex, verbatim:** _"the goal is for ball iq to be a self sustaining passive
income app with automated agents controlling questions and issues, however we
have to grow our userbase first. I would ideally like ball iq to generate at
least one million dollars a year within 6 months."_

Three separate things in that, and they do not share a verdict.

### 1. Self-sustaining, agent-operated — YES, and mostly already true
The forge pipeline (generate → examiner → skeptic), the build-gated audits,
the frozen daily schedules and the harvesters are already the machine being
described. Option A — covering infrastructure — is ~13 buyers a month. This
is a months-away goal, not a years-away one.

### 2. Grow the userbase first — CORRECT, and it is the panel's own finding
Every reviewer independently landed on reach as the binding constraint. Do not
build billing before the audience exists; the conversion rate of nobody is
nobody.

### 3. $1M/year within 6 months — NOT ACHIEVABLE. Arithmetic, not pessimism.

| | |
|---|---|
| $1M/year | $83,333/month net · ~$98,000/month gross |
| At a $2.99 unlock (net ~$2.54) | **32,789 buyers every month** |
| At 2% conversion | 1,639,452 monetisable MAU |
| At 5% conversion (generous) | **655,781 MAU** |
| At 10% conversion (category-leading) | 327,890 MAU |
| Subscription at $4.99 instead | 19,647 ACTIVE subscribers |
| Ads instead, at $3 RPM | **32.7 million pageviews/month** (currently ~2,570) |
| Current MAU | **90** |
| Required growth | **~7,286x in six months** |

The decisive line: **doubling the userbase every single month — sustained
hypergrowth almost no app achieves — reaches 5,760 MAU in six months, and
takes ~13 months to reach the target.** Six months of perfect doubling gets
about 0.9% of the way there.

### So the target is kept, and the deadline is moved

**$1M/year stays as the north star.** It is a real destination on a monthly-
doubling curve and it tells us which levers matter (reach, not price).

**The 6-month milestone becomes: sustained monthly doubling, ~5,000+ MAU, and
roughly $500–700/month.** That is Option A passed many times over, it is on
the $1M curve rather than beside it, and it is genuinely ambitious — it still
requires the userbase to double every month for six consecutive months.

**Answer:** _North star $1M/yr. Six-month target: ~5,000 MAU and $500+/month,
via monthly doubling. One-time unlock at $2.99, content stays free, licensing
(Option C) runs in parallel. Revisit this file at 1,000 MAU._
