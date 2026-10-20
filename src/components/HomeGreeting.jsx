// The Home greeting line ("Good morning" …), lifted out of HomeScreen.jsx on
// 2026-10-20 as the i18n pilot. Its English markup is byte-identical to the
// inline <div> it replaced (pinned by tests/unit/i18n-pilot.test.js).
import React from "react";
import { useT, useLang } from "../i18n/index.js";

// The hour each language's evening greeting starts. Spanish keeps "Buenas
// tardes" until about eight; "Buenas noches" at 18:30 reads as a goodbye.
const EVENING_FROM = { en: 18, es: 20 };

/** Which greeting key fits this hour (0–23) in this language. */
export function greetingKey(hour, lang = "en") {
  // Small hours are NOT morning. `h < 12` greeted someone playing at
  // 00:38 with "Good morning", which reads as a broken clock rather
  // than a greeting. 00:00-04:59 belongs to the night before.
  if (hour < 5) return "home.greeting.night";
  if (hour < 12) return "home.greeting.morning";
  if (hour < (EVENING_FROM[lang] ?? EVENING_FROM.en)) return "home.greeting.afternoon";
  // ⛔ THE "Good ebening" EGG IS RETIRED (2026-09-09). It ran ~1
  // evening in 5 and it is the FIRST LINE OF THE APP. It read as a
  // commentator's pun while the line was "Good ebening, Alex" — the
  // name gave it the cadence. The greeting lost the name earlier the
  // same day, and a lone misspelt word is not a joke, it is a typo on
  // the header of a product with 500+ downloads. This is the same
  // judgement that already gated it out of the store screenshots
  // ("reads as a typo, permanently, to everyone deciding whether to
  // download") — the gate was right and the conclusion generalises.
  return "home.greeting.evening";
}

// THE GREETING CARRIES NO NAME (Alex, 2026-09-09). "Good afternoon, Alex"
// fit because his name is four letters; the line was nowrap + ellipsis,
// so a longer name printed "Good afternoon, Alexander…" — the worst of
// both. The time-of-day line is the charm ("Still up" at 01:16) and it
// needs no name; the name is the Profile tab's job. Dropping it also
// frees the line from homeDisplayName, so a signed-out player gets the
// same header instead of a shorter one.
// `now` is for tests; the app passes nothing and gets the current time.
export function HomeGreeting({ now }) {
  const t = useT();
  const lang = useLang();
  const hour = (now || new Date()).getHours();
  return (
    <div className="hg-greet" style={{fontSize:20, fontWeight:800, letterSpacing:"-0.02em", color:"var(--t1)", lineHeight:1.1, maxWidth:"100%"}}>
      {t(greetingKey(hour, lang))}
    </div>
  );
}
