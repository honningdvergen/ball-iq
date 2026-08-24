import { useState } from 'react';

/**
 * The one "report a problem" button.
 *
 * ⚠️ FOUR CALL SITES CARRIED FOUR COPIES OF THE SAME BUG, found by scouting
 * report #4 and confirmed in the source: QuizEngine (App.jsx), the wrong-answer
 * review (App.jsx), Footle (App.jsx) and Transfer Trail each ran
 *
 *     onReport({...});          // fire and forget
 *     setReported(true);        // …and claim success in the same tick
 *
 * so the button flipped to "✓ Reported — thanks" the instant it was tapped —
 * while the reason sheet was still open and unanswered, and before the RPC had
 * run. Nothing had been reported at that moment, and if the send then failed
 * the button went on saying it had worked. On the very day the reason channel
 * launched, this was actively teaching players that the second step was
 * optional.
 *
 * ⚠️ And `supabase.rpc()` RESOLVES on error rather than rejecting, so "it did
 * not throw" was never evidence of success here. `reportQuestion` now returns a
 * promise that settles only when the send does, carrying its real boolean.
 *
 * Shared rather than fixed four times, because fixing something in one half and
 * calling it done is the single most expensive habit in this project — the
 * scouting report counted six instances. A fifth report button now cannot get
 * this wrong.
 *
 * STATE, and why three rather than two:
 *   idle     → the label the call site chose
 *   sending  → the sheet is open or the RPC is in flight. Disabled, so a second
 *              tap cannot open a second sheet, but NOT yet claiming success.
 *   done     → the RPC returned without an error. Only now do we thank anyone.
 * A failed send returns to idle deliberately: the player's complaint is real
 * and they must be able to try again.
 *
 * Mount with `key={<question key>}` at call sites that reuse one button across
 * items — QuizEngine keeps the same element while `q` changes, so without a key
 * question 2 would inherit question 1's "reported" state.
 */
export default function ReportButton({
  info, onReport, idle,
  sending = 'Sending…',
  done = '✓ Reported — thanks',
  style,
  // QuizEngine's button is deliberately dimmer than the others — it sits under
  // the primary CTA on the busiest screen and was demoted on purpose — so the
  // idle colour is a call-site decision, not a constant.
  idleColor = 'var(--t2)',
  resolvedColor = 'var(--accent)',
}) {
  const [state, setState] = useState('idle');
  if (!onReport) return null;

  const label = state === 'done' ? done : state === 'sending' ? sending : idle;

  return (
    <button
      type="button"
      disabled={state !== 'idle'}
      // The label changes underneath a control the player just pressed, and the
      // change is the entire feedback. Screen readers have to be told.
      aria-live="polite"
      onClick={() => {
        if (state !== 'idle') return;
        setState('sending');
        // `info` may be a thunk so the call site can compute picked/correct at
        // press time rather than on every render.
        Promise.resolve(onReport(typeof info === 'function' ? info() : info))
          // `undefined` counts as success: a call site that has not been
          // migrated to the promise contract should still behave as before
          // rather than getting stuck on "Sending…" forever.
          .then((ok) => setState(ok === false ? 'idle' : 'done'))
          .catch(() => setState('idle'));
      }}
      style={{
        fontFamily: 'inherit',
        WebkitAppearance: 'none',
        appearance: 'none',
        WebkitTextFillColor: 'currentColor',
        cursor: state === 'idle' ? 'pointer' : 'default',
        color: state === 'done' ? resolvedColor : idleColor,
        ...style,
      }}
    >
      {label}
    </button>
  );
}
