# Magic Patterns briefs — ready to run

Written 2026-07-29. Both briefs below were submitted and **rejected for
"Insufficient credits"** — the connector authenticates fine, the account just has
none. Top up at magicpatterns.com/settings and paste these straight in.

## What the tool actually does — read this first

Magic Patterns **generates** UI from a written brief. It has no access to this
repo, the running build, or screenshots, so it **cannot audit or critique what
already exists**. Asking it to "look over the app" is not a thing it can do.

What it is genuinely good for: hand it one well-scoped surface and a real
constraint, and it returns several buildable React variants to react to. That is
the loop that was missing on 2026-07-29, when hand-authored HTML mockups of a
palette change were rejected twice — generated variants are cheaper to throw away
than ones I have written by hand, and there is no sunk cost arguing for them.

**Always paste the tokens.** Without them it invents its own visual language and
the output is unusable no matter how good it looks.

---

## Brief 1 — the whole Home screen

> Design THREE alternative versions of the HOME SCREEN of a dark mobile
> football-trivia app called Ball IQ. Show them side by side in 402x874 phone
> frames so they can be compared. This is a real shipping app, so match the
> existing visual language exactly — do not invent a new one.
>
> TOKENS (use these literally):
> background #0A0A0A · card surface #0F1117 · inset #14161E · border #242836
> heading #FFFFFF · body #9BA0B8 · dim #7E828C
> the ONE accent is green #58CC02, text on green #06230C
> a secondary amber #FFC107 is used only for the Daily 7
> radius 14–18px · Inter / system sans · NO emoji anywhere, inline SVG icons
> only (thin 2px stroke, Lucide-like)
>
> WHAT MUST BE ON THE SCREEN:
> 1. A greeting row: "Good afternoon", a streak chip (flame + number), a cog.
> 2. A DAILY zone with a "0/2 today" progress label containing:
>    - FOOTLE, the flagship: a Wordle-style football game. Title, the line
>      "Surname of a footballer / 6 guesses", a Play button, and a small 5x2
>      grid of letter tiles (some green, some grey) as a visual teaser.
>    - DAILY 7: a compact row — icon, "Daily 7", "7 questions · ~3 min", Play.
> 3. A "Play with Friends" card: online 1v1 and local pass-and-play.
> 4. A "More modes" grid of 8 tiles: Club Quiz, League Quiz, Classic, Survival,
>    Hot Streak, Legends, Ball IQ Test, Chaos — icon, name, one line each.
> 5. A bottom tab bar: Home, Online, Daily, Profile.
>
> THE REAL DESIGN PROBLEM, and the thing to actually solve:
> Green currently paints 156 CSS declarations against amber's 6. Six separate
> things on this screen are the same green, so nothing reads as primary and the
> eye has nowhere to land. Meanwhile the usage data is stark: Footle has 280
> plays from 59 people, Daily 7 has 109, and online multiplayer has 10 plays
> from 4 people. The screen gives roughly equal weight to all of it.
>
> So each of the three versions should take a DIFFERENT position on how to make
> Footle unmistakably the main event and how to ration the green — not three
> colour swaps of one layout. Give each version a one-line caption naming what
> it is betting on, and keep every version buildable with plain CSS (no
> illustrations, no photography).

## Brief 2 — the "Play with Friends" card

Same tokens block, then:

> Design THREE alternative versions of a single card component, stacked
> vertically so they can be compared. Mobile width 402px, no taller than ~200px.
>
> THE CARD'S JOB: get someone to play a live quiz against friends. It currently
> offers three separate controls — "Invite", "Online" and "Local" — and gives no
> steer on which to press.
>
> CONTEXT THAT SHOULD SHAPE THE DESIGN: live multiplayer needs two people online
> at the same moment, which almost never happens at this app's size — only 4
> people have ever played it, against Footle's 59. Local pass-and-play works
> instantly with no account. A good design is honest about which path actually
> pays off right now, rather than presenting three equal doors.
>
> Make the three genuinely different in approach, not three colour variations of
> one layout. Caption each with what it is betting on.

---

## The measurements to keep quoting

These are what make a brief produce something useful rather than generic, and
they were all measured, not guessed:

- green `--accent` paints **156** CSS declarations; amber `--gold` paints **6**
- Footle **280** plays / **59** players · Daily 7 **109** / 35 · classic 169 / 37
- online multiplayer **10** plays / **4** players · all club quizzes **6** / 4
- 108 profiles, 102 never changed their avatar, 10 uploaded a photo
- `app.css` records a deliberate **"no-blue re-skin"** — blue is off the table
  unless Alex reopens it
