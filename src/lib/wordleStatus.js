// Reads today's Footle (Wordle) progress from localStorage. Used by the
// home greeting subtext, the Daily tab "Today's actions" row, and the
// FootleHero card so all three surfaces agree on the day's state.

function dateToDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Takes a date so the archive can key on a past day. Defaults to now, so every
// existing caller is unchanged.
export function getWordleDateKey(date = new Date()) {
  return dateToDateKey(date);
}

// Footle solves on this device from days BEFORE today.
//
// There is no counter to read — Footle's only trace is one `biq_wordle_<ymd>`
// key per day played, so the count IS a scan. That is fine: the keyset is one
// entry per day of play, and this runs once, on a solve.
//
// Today is excluded ON PURPOSE, and not as a rounding choice. The caller is the
// App Store rating ask, which runs off the solve event — but the day's state is
// written by a useEffect, so whether today's key exists yet when we count is a
// race React does not promise either way. Excluding today makes the answer the
// same in both orderings: "has this person ever solved one on an earlier day?"
//
// That question is also the one worth asking. Rating an app on the first puzzle
// you have ever played produces "seems fine?" three-star ratings; having come
// back on a second day IS the opinion we are asking them to give.
export function countPriorFootleSolves() {
  const todayKey = `biq_wordle_${getWordleDateKey()}`;
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("biq_wordle_") || k === todayKey) continue;
      try {
        if (JSON.parse(localStorage.getItem(k))?.status === "won") n++;
      } catch { /* a malformed day is not a solve */ }
    }
  } catch { return 0; }
  return n;
}

// Returns one of:
//   { kind: "ready" } | { kind: "in-progress", used: N } | { kind: "won", used: N } | { kind: "lost" }
export function readWordleTodayStatus() {
  try {
    const raw = localStorage.getItem(`biq_wordle_${getWordleDateKey()}`);
    if (!raw) return { kind: "ready" };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.guesses)) return { kind: "ready" };
    if (parsed.status === "won") return { kind: "won", used: parsed.guesses.length };
    if (parsed.status === "lost") return { kind: "lost" };
    if (parsed.guesses.length > 0) return { kind: "in-progress", used: parsed.guesses.length };
    return { kind: "ready" };
  } catch { return { kind: "ready" }; }
}
