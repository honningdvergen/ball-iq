// Reads today's Footle (Wordle) progress from localStorage. Used by the
// home greeting subtext, the Daily tab "Today's actions" row, and the
// FootleHero card so all three surfaces agree on the day's state.

function dateToDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWordleDateKey() {
  return dateToDateKey(new Date());
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
