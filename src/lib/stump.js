// "Stump a mate": the share link and the share sheet for one question. Moved
// out of App.jsx on 2026-09-06 (review E16) with the Results screen.

// The recipient side of the viral loop: answer a single question with zero
// login, get the reveal + the hint story, then the chain CTA ("pass it on")
// and a full-quiz conversion path. Sender side lives in Results (🥜 button).
// Share-family audit 2026-08-30: an unsigned card converts worse than a
// signed one — "Alex bets you can't get this" beats "Can you get this one?".
// Read the name the challenge-share flow already persists (profile.name in
// biq_profile); no new ask, no new state. Preview-only, like qt/c.
export const shareSenderName = () => {
  try {
    return String(JSON.parse(localStorage.getItem("biq_profile") || "{}").name || "").trim().slice(0, 22);
  } catch { return ""; }
};
export const stumpLink = (row) => {
  const p = shareSenderName();
  return `https://balliq.app/q?id=${row.id}&qt=${encodeURIComponent(row.q.slice(0, 160))}${row.cat ? `&c=${encodeURIComponent(row.cat)}` : ""}${p ? `&p=${encodeURIComponent(p)}` : ""}`;
};

export async function shareStumpText(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch { return; } // user cancelled the sheet = done
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "Link copied 📋" }));
    }
  } catch {}
}

