// Which clicks on an on-screen key have already been typed by the finger's lift.
//
// Footle's letter keys type on pointerup (see FootballWordle.jsx for why), and
// the browser then sends a click for the same tap. That click must not type
// again. iOS sends it a moment AFTER the lift, so in fast typing lifts and
// clicks interleave: S up, A up, L up, then S's click. Remembering only "the
// last key lifted" let that late click through as a second S (the real app,
// 13 Oct 2026: five taps, six letters).
//
// So each lift leaves a note under its own key, and that key's next click
// spends one. A count, because a double letter is two lifts and then two
// clicks. A note lapses after `windowMs`, for a touch that never gets a click
// (two thumbs overlapping: iOS makes no click at all).
export function createTapLedger(windowMs = 3000, now = Date.now) {
  const owed = new Map();
  return {
    lifted(key) {
      const t = now(), p = owed.get(key);
      owed.set(key, { n: (p && t - p.t < windowMs ? p.n : 0) + 1, t });
    },
    // True when this click belongs to a lift that has already typed its letter.
    spent(key) {
      const p = owed.get(key);
      if (!p || p.n < 1 || now() - p.t >= windowMs) return false;
      p.n -= 1;
      return true;
    },
  };
}
