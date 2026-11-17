// Modal a11y primitives — ESC to close, focus trap, focus restore, and
// browser/iOS back-gesture closes the topmost open modal.
//
// Sprint #4 SS audit found that all 8 dialogs in the app carry role="dialog"
// + aria-modal="true" but none of them:
//   - close on ESC
//   - trap Tab focus inside the modal
//   - restore focus to the trigger when closed
// Sprint #77 SS4 / Sprint #78 TT1 added:
//   - browser back button (and iOS Safari swipe-back gesture) closes the
//     topmost open modal instead of exiting the app entirely
//
// This hook closes that gap with a single behavioral primitive. Each
// calling component:
//   1. Holds a ref to the modal container.
//   2. Calls useModalA11y({ isOpen, onClose, ref }) once.
//   3. Renders the modal with ref={ref} and tabIndex={-1} (so the container
//      itself is focusable as a fallback when the modal has zero focusable
//      children).
//
// Implementation notes:
//   - keydown listener is attached at window level (not modal-scoped) so it
//     catches keypress regardless of where focus drifts. Tab-cycle logic
//     checks if focus has escaped the modal and pulls it back.
//   - Initial focus goes to the first focusable element inside the modal,
//     falling back to the container itself if none exists.
//   - Previous active element is restored on close — this is what makes
//     ESC + tab-back-out flows feel correct (focus returns to the button
//     the user clicked to open the modal).
//   - Disabled buttons are excluded from the focus cycle.
//
// Back-button coordination (TT1):
//   - A module-level stack tracks open modals in mount order. A single
//     popstate listener is installed lazily on first modal open.
//   - When a modal opens we push one history entry per open. Stacked modals
//     produce stacked history entries — back button pops them one at a time
//     in LIFO order (most recently opened closes first), matching iOS sheet
//     behavior.
//   - When the user presses back, the popstate handler pops the topmost
//     entry off the stack, marks it as via-popstate, and fires its onClose.
//     The modal's effect cleanup then sees via-popstate=true and skips its
//     own history.back() (the entry is already gone).
//   - When the modal closes for any other reason (button click, ESC, backdrop
//     tap), cleanup sees via-popstate=false → calls history.back() to clean
//     up the pushed entry. A list of owed events (`owedPopstates`) suppresses
//     the resulting popstate event so it doesn't try to close the next modal
//     underneath.

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function getFocusables(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.disabled && el.offsetParent !== null)
}

// Module-level state for popstate coordination. Single source of truth across
// every modal mount on the page.
const modalStack = []
let popstateInstalled = false
// The popstate events our own history.back() calls still owe us, as the time
// each was asked for. A LIST, not a flag (16 Nov 2026): two cleanups before
// the first event arrived left the second event looking like a real back
// press, and it closed whatever sheet was open (see the note on the effect
// below). Each one EXPIRES: WebKit answers two quick back() calls with one
// event (measured), and an event that never comes must not swallow the
// player's next real back press.
const owedPopstates = []
const OWED_MS = 1500
// A sheet whose onClose declined (a form mid-submit) is still open after a
// back press took its history entry: it gets a new one after this long.
const REFUSED_MS = 400
// Sheets that mounted while one of our back() calls was still in flight.
// MEASURED in Chromium and WebKit, 16 Nov 2026: back() followed at once by
// pushState() lands on the entry BELOW the one back() was called from, and the
// new entry is left ahead as a forward entry. The open sheet then has no
// history entry under it: the back button leaves the page, or does nothing at
// all in a native shell. So such a sheet pushes its entry only once the
// traversal has landed (or its owed event has expired).
let waitingToPush = []

const liveOwed = () => {
  const now = Date.now()
  while (owedPopstates.length && now - owedPopstates[0] > OWED_MS) owedPopstates.shift()
  return owedPopstates.length
}
function pushEntry(entry) {
  if (entry.pushed || !entry.mounted) return
  try { window.history.pushState({ biq_modal: 1, biq_modal_id: entry.myId }, ''); entry.pushed = true } catch {}
}
function pushWaiting() {
  if (liveOwed() > 0) return
  const list = waitingToPush
  waitingToPush = []
  for (const e of list) pushEntry(e)
}

function ensurePopstateListener() {
  if (popstateInstalled) return
  popstateInstalled = true
  window.addEventListener('popstate', () => {
    // Programmatic history.back() from a modal's cleanup → suppress.
    if (liveOwed() > 0) {
      owedPopstates.shift()
      pushWaiting()
      return
    }
    // User back gesture (or browser back button) → close the topmost open
    // modal. Pop it from the stack first so the modal's cleanup sees
    // viaPopstate=true and skips its own history.back() (the entry has
    // already been popped by the browser).
    const top = modalStack.pop()
    if (!top) return
    top.viaPopstate = true
    top.pushed = false
    try { top.onClose() } catch {}
    // Still open a moment later: onClose declined. Before 16 Nov 2026 the
    // effect ran again on the next render and put the sheet back by accident;
    // now it is put back on purpose, so the back button keeps answering.
    setTimeout(() => {
      if (!top.mounted || modalStack.includes(top)) return
      top.viaPopstate = false
      modalStack.push(top)
      pushEntry(top)
    }, REFUSED_MS)
  })
}

// Android hardware back (Capacitor backButton) routes through here so a press
// closes the topmost modal the same way the browser back button does.
// Returns true when a modal was open (close initiated) so the caller can stop
// its fallback navigation. history.back() replays the exact popstate path
// above — stack pop, viaPopstate marking, and cleanup bookkeeping all behave
// identically to a real back gesture, so no second close mechanism exists.
export function closeTopModal() {
  if (modalStack.length === 0) return false
  try {
    window.history.back()
  } catch {
    // history unavailable — close directly; cleanup's myId check prevents the
    // orphaned pushed entry from causing an over-pop later.
    const top = modalStack.pop()
    if (top) {
      top.viaPopstate = true
      try { top.onClose() } catch {}
    }
  }
  return true
}

/** True while any sheet or dialog that uses this hook is open. */
export function anyModalOpen() {
  return modalStack.length > 0
}

export function useModalA11y({ isOpen, onClose, ref, focusContainer = false }) {
  // ⚠️ onClose IS READ THROUGH A REF, AND IS NOT A DEPENDENCY (16 Nov 2026).
  // Most callers pass a new function every render. With onClose in the
  // dependency list the whole effect ran again on EVERY render of an open
  // sheet: history.back() for the old entry, pushState for a new one. A burst
  // of renders queued several back() calls, the one-shot flag swallowed the
  // first popstate only, and the next one closed the sheet as if the player
  // had pressed back. Found on the 1.8.7 Android walk: a guest's FIRST league
  // never showed its "ready, share the invite" step, because the sign-in
  // remount re-rendered the restored sheet several times within 250 ms.
  // Reproduced in Chromium with three quick renders of the open sheet.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // focusContainer: the first focus goes to the sheet itself, not to its first
  // field. For a sheet whose first focusable is a text field that is already
  // filled in: focusing it raises the keyboard over a form that is ready to
  // send (the league sheet, 17 Nov 2026). Read when the sheet opens.
  const focusContainerRef = useRef(focusContainer)
  focusContainerRef.current = focusContainer
  useEffect(() => {
    if (!isOpen) return
    const container = ref.current
    if (!container) return

    ensurePopstateListener()

    const previousActive = document.activeElement
    const focusables = getFocusables(container)
    if (focusables.length > 0 && !focusContainerRef.current) {
      focusables[0].focus()
    } else if (typeof container.focus === 'function') {
      container.focus()
    }

    // Register on the modal stack + push one history entry so back-gesture
    // closes this modal. A unique per-effect id lets cleanup detect whether
    // the entry it pushed is still the topmost history entry — important
    // for dev-mode StrictMode where the effect mount-cleanup-mount dance
    // does push → back → push and the popstate from the strict-discard
    // back is consumed by the inhibit flag; without an id check, cleanup
    // on real unmount could try to back past an entry that's no longer
    // ours and over-pop, exiting the app entirely.
    const myId = `m${Math.random().toString(36).slice(2)}`
    const stackEntry = { onClose: () => onCloseRef.current?.(), viaPopstate: false, myId, mounted: true, pushed: false }
    modalStack.push(stackEntry)
    if (liveOwed() > 0) {
      // One of our own back() calls is still in flight (the app's remount:
      // the old sheet went a moment ago). Wait for it; see waitingToPush.
      waitingToPush.push(stackEntry)
      setTimeout(pushWaiting, OWED_MS + 50)
    } else {
      pushEntry(stackEntry)
    }

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const fs = getFocusables(container)
      if (fs.length === 0) {
        e.preventDefault()
        if (typeof container.focus === 'function') container.focus()
        return
      }
      const first = fs[0]
      const last = fs[fs.length - 1]
      const active = document.activeElement
      const inModal = container.contains(active)
      if (!inModal) {
        e.preventDefault()
        first.focus()
        return
      }
      // The container itself can hold the focus (focusContainer): Shift+Tab
      // from it wraps to the last control, as it does from the first.
      if (e.shiftKey && (active === first || active === container)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      // Remove from stack. If popstate already removed us (back gesture),
      // viaPopstate is true; if we're being cleaned up via programmatic
      // close (button / ESC / backdrop), the entry is still there.
      stackEntry.mounted = false
      const idx = modalStack.indexOf(stackEntry)
      if (idx !== -1) modalStack.splice(idx, 1)
      if (!stackEntry.viaPopstate) {
        // Programmatic close. Only history.back if OUR marker is still the
        // current entry — if popstate already moved past it (StrictMode
        // discard dance + race conditions), back-ing again would over-pop
        // and could exit the app entirely.
        const cur = (() => { try { return window.history.state } catch { return null } })()
        if (cur && cur.biq_modal_id === stackEntry.myId) {
          try { window.history.back(); owedPopstates.push(Date.now()) } catch {}
        }
      }
      if (previousActive && typeof previousActive.focus === 'function') {
        try { previousActive.focus() } catch {}
      }
    }
  }, [isOpen, ref]) // not onClose: see the note above
}
