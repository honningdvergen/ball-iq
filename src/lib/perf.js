// Sprint #90 EEE1: gated cold-start instrumentation. Logs survive force-quit
// via Xcode device console (Window → Devices and Simulators → Open Console
// for the device, filter "BIQ_PERF").
//
// SET BIQ_PERF_TRACE = false BEFORE LAUNCH. Trivial revert: grep -r BIQ_PERF
// and remove. Single shared T0 across all consumers so cross-module deltas
// are accurate.

// Sprint #91 FFF1: traces collected — cold-start path verified at 160ms total
// (App.jsx parse → SplashScreen.hide() resolved). Flipped back to false to
// suppress prod console spam. Flip to true if a future regression suspects
// the same area; helper + marks remain in place ready to fire.
export const BIQ_PERF_TRACE = false;

const T0 = typeof performance !== 'undefined' ? performance.now() : 0;
const seen = new Set();

export function perfMark(label, opts = {}) {
  if (!BIQ_PERF_TRACE) return;
  if (opts.once !== false) {
    if (seen.has(label)) return;
    seen.add(label);
  }
  const t = (typeof performance !== 'undefined' ? performance.now() : 0) - T0;
  try { console.log(`[BIQ_PERF +${Math.round(t)}ms] ${label}`); } catch {}
}
