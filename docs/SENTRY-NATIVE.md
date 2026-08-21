# Native crash reporting — where it stands, and the wall in front of it

**Status: JS-layer crashes are now reported. Native-layer crashes are not.**
Written 2026-08-21 (scouting report #2, item 15).

## What got fixed today

`.env.local` had no `VITE_SENTRY_DSN`, and `src/main.jsx` guards the whole
Sentry init behind it, so Rollup dead-stripped the SDK out of every native
build. Vercel had the variable, so **web was always covered and native never
was** — both "worked", and only one reported. The DSN is now in `.env.local`
(gitignored; the value is not secret — it only permits sending events and it
already ships in the public web bundle), and it is **verified present in both
the iOS and Android bundles**, not merely assumed from a green build.

`src/lib/push.js` also stopped swallowing FCM registration failures, on the
one code path with a history of hard-crashing Android.

## What is still missing, and why it is not a one-line install

`@sentry/react` runs inside the webview. It cannot see a crash in the native
layer — and the crash this app has actually suffered was exactly that:
ticket #1650, `Default FirebaseApp is not initialized`, thrown outside the JS
bridge. A JS SDK never sees it. `@sentry/capacitor` is what does.

**The blocker is peer pinning.** Sentry pins peers to EXACT versions:

| @sentry/capacitor | requires @sentry/react |
|---|---|
| 1.0.0 | 8.27.0 |
| **1.1.0** | **8.42.0** |
| 2.0.0 | 9.27.0 |
| 2.1.0 | 9.38.0 |
| 4.3.0 (latest) | 10.69.0 |

This repo is on `@sentry/react@^8.55.2`. There is **no version of
@sentry/capacitor that drops in cleanly**:

- **v1.1.0** would mean *downgrading* the working web SDK from 8.55.2 to
  8.42.0 — taking a regression risk on the half that currently works, to add
  the half that does not.
- **v4.3.0** means `@sentry/react` 8 → 10: two major versions, across a
  ~10k-line `App.jsx`, with breaking changes in both.

## Why it was deliberately NOT attempted on 2026-08-21

Judgement call, recorded so the next person does not assume it was overlooked:

1. The **valuable half already landed**. The DSN fix moved native from "no
   crash reporting at all" to "JS crashes reported". `@sentry/capacitor` adds
   the native layer on top — real, but a smaller delta than the one just made.
2. **vc20 was in Play review that same day** carrying a week of work. A
   two-major dependency upgrade is the wrong thing to put behind a build
   already in flight.
3. It is a **dependency upgrade wearing an install's clothing**. Twenty
   minutes of typing, then an unknown amount of fixing — which is exactly the
   kind of thing that goes badly at the end of a long session.

## How to do it when picked up fresh

Take the **v10 path**, not the downgrade. Upgrading forward is the direction
the ecosystem is moving and the downgrade trades a working thing for a
broken one.

1. `@sentry/react` 8.55.2 → 10.69.0 and `@sentry/vite-plugin` to match.
   Read BOTH the v9 and v10 migration guides — the v9 breaking changes apply
   even though you skip through it.
2. Then `npm i @sentry/capacitor@4.3.0`.
3. Init changes: `@sentry/capacitor`'s `init` wraps the React one — the
   sibling SDK is passed in rather than initialised separately.
4. `npx cap sync` both platforms; the native SDKs arrive via CocoaPods and
   Gradle.
5. **Verify by causing a real native crash on a device**, not by reading a
   green build. The whole point is the class of crash a JS SDK cannot see, so
   a JS-thrown test error proves nothing about it.

## Also outstanding from item 15

A real **VoiceOver / TalkBack pass** on a device. The accessibility work
shipped this month (colour-blind Footle, the club-page glyph + live region,
aria labels) is verified present but has never been driven by an actual
screen-reader user. Present is not the same as usable.
