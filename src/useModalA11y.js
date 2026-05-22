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
//     up the pushed entry. A one-shot `inhibitNextPopstate` flag suppresses
//     the resulting popstate event so it doesn't try to close the next modal
//     underneath.

import { useEffect } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function getFocusables(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.disabled && el.offsetParent !== null)
}

// Module-level state for popstate coordination. Single source of truth across
// every modal mount on the page.
const modalStack = []
let popstateInstalled = false
let inhibitNextPopstate = false

function ensurePopstateListener() {
  if (popstateInstalled) return
  popstateInstalled = true
  window.addEventListener('popstate', () => {
    // Programmatic history.back() from a modal's cleanup → suppress.
    if (inhibitNextPopstate) {
      inhibitNextPopstate = false
      return
    }
    // User back gesture (or browser back button) → close the topmost open
    // modal. Pop it from the stack first so the modal's cleanup sees
    // viaPopstate=true and skips its own history.back() (the entry has
    // already been popped by the browser).
    const top = modalStack.pop()
    if (!top) return
    top.viaPopstate = true
    try { top.onClose() } catch {}
  })
}

export function useModalA11y({ isOpen, onClose, ref }) {
  useEffect(() => {
    if (!isOpen) return
    const container = ref.current
    if (!container) return

    ensurePopstateListener()

    const previousActive = document.activeElement
    const focusables = getFocusables(container)
    if (focusables.length > 0) {
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
    const stackEntry = { onClose, viaPopstate: false, myId }
    modalStack.push(stackEntry)
    try { window.history.pushState({ biq_modal: 1, biq_modal_id: myId }, '') } catch {}

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
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
      if (e.shiftKey && active === first) {
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
      const idx = modalStack.indexOf(stackEntry)
      if (idx !== -1) modalStack.splice(idx, 1)
      if (!stackEntry.viaPopstate) {
        // Programmatic close. Only history.back if OUR marker is still the
        // current entry — if popstate already moved past it (StrictMode
        // discard dance + race conditions), back-ing again would over-pop
        // and could exit the app entirely.
        const cur = (() => { try { return window.history.state } catch { return null } })()
        if (cur && cur.biq_modal_id === stackEntry.myId) {
          inhibitNextPopstate = true
          try { window.history.back() } catch {}
        }
      }
      if (previousActive && typeof previousActive.focus === 'function') {
        try { previousActive.focus() } catch {}
      }
    }
  }, [isOpen, onClose, ref])
}
