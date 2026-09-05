# What else should we be doing — app assessment against best-in-class (2026-09-06, after the home rebuild)

Bar: top of category (NYT Games/Wordle, Duolingo, Immaculate Grid), not "good for a football quiz app".
Grounded in: simulator walk of Home / Online / Daily / Profile / Footle; the source; the measured numbers
(≈44% of accounts never play; day-1→2 leak; WAU ≈45 flat on ~130 signups/30d; 13 notifications ever sent;
16.7% of accounts reachable by push; k-factor 0.23 with room invites = 24% of signups).

## Already top-class (keep)
- Footle's play screen: board, legend, keyboard, full-width ENTER — Wordle-grade.
- Four dailies with editions; the club depth (small clubs = giants) — the moat.
- The new home: one section idiom, one colour of Play, first Play at ~170pt.

## The gaps, in order of leverage
1. THE RETURN LOOP IS NOT BUILT. The results moment is where Wordle/Duolingo win tomorrow: score → share →
   streak lit → "next puzzle in Xh" → remind me. Ours: results covered by a guest save-nudge at +2s; the
   notification ask fires 7s later as a sheet; no countdown on Home; streak only on the Daily tab; no "how
   did everyone do" distribution. → ONE results component for all four dailies: emoji-grid share as the
   primary action, streak state, countdown, one-tap "Remind me at [the time you played]" (permission asked
   AT the moment of value), today's global solve distribution + your percentile.
2. HOME AND DAILY ARE THE SAME SCREEN. Daily tab = the same four rows + countdown + streak + recent days, and
   still wears the OLD row styling (per-mode Play pills, washes) — inconsistent since tonight. → Merge: Home
   absorbs countdown + streak strip + recent days; Daily tab becomes History/Archive (or goes; 3 tabs).
   Minimum tonight-class fix: Daily rows adopt the new row CSS.
3. NOTIFICATIONS ARE THE BIGGEST UNPULLED LEVER. 13 ever sent; 1 in 6 reachable. Duolingo's engine is the
   reminder at YOUR habitual hour + streak-at-risk in the evening. → local reminder at the player's own play
   time; streak-at-risk 20:00 nudge only when a streak ≥2 is live; "a friend beat your score" push; new-puzzle
   push at rollover for opted-in players. Measure reachable% weekly.
4. THE ACCOUNT IS A WALL, NOT A REWARD. Online = a "Sign up to play online" slab; Profile = sign-in slab over
   an all-dashes rating card. Wordle asks to log in when you HAVE stats to save. → prompt only where an
   account unlocks something concrete, named ("Save this 3-day streak", "Invite by link"); guest Profile
   shows the guest's real numbers; Online for guests leads with Join-by-code + Local play, sign-up second.
5. NO ANCHOR AT THE TOP. Every tab opens on 13.5px "Good evening" + a settings gear; NYT opens on the brand
   and the date + puzzle number. → header = F mark/wordmark + "Saturday 5 Sep"; greeting/name to Profile;
   one header pattern across the four tabs (Daily repeats "Good evening" today).
6. ONBOARDING = A GENERIC QUESTION. Fresh install shows "Quick one — give it a go ⚽" (an emoji title) then
   Home. Play-first is right; the object is wrong. → onboarding IS today's Footle with the legend inline
   (that is the return reason), skip = Home with "Start here" (shipped).
7. SOCIAL PROOF INSIDE THE PUZZLE. "Everyone gets the same player" is the claim; nothing shows the everyone.
   → per-puzzle aggregate (solved %, guess distribution) on results and on the answer pages; needs a tiny
   aggregate table fed by the existing footle/daily events.
8. CRAFT P3s (from the critique): emoji glyphs (🔥 ✅ ✗ 🏆 ⚽) → Lucide; duplicate "No. 34"; Footle subline
   wraps (rows unequal); chip mask cuts "Barcelona"; web shell shows a second search field above the finder.

## Measure
One north-star for the app: D1→D2 return of new installs, read weekly (funnel-analyst). Secondary: daily-puzzle
completion rate, reachable%, share taps per finish.

## Proposed order
(1) results component + remind-me at the value moment → (2) Daily rows onto the new CSS now, merge decision
next → (3) reminder engine → (4) guest-first Online/Profile → (5) header anchor → (6)–(8).
