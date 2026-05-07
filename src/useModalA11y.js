// Modal a11y primitives — ESC to close, focus trap, focus restore.
//
// Sprint #4 SS audit found that all 8 dialogs in the app carry role="dialog"
// + aria-modal="true" but none of them:
//   - close on ESC
//   - trap Tab focus inside the modal
//   - restore focus to the trigger when closed
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
//   - Listener is attached at window level (not modal-scoped) so it catches
//     keypress regardless of where focus drifts. Tab-cycle logic checks if
//     focus has escaped the modal and pulls it back.
//   - Initial focus goes to the first focusable element inside the modal,
//     falling back to the container itself if none exists.
//   - Previous active element is restored on close — this is what makes
//     ESC + tab-back-out flows feel correct (focus returns to the button
//     the user clicked to open the modal).
//   - Disabled buttons are excluded from the focus cycle.

import { useEffect } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function getFocusables(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.disabled && el.offsetParent !== null)
}

export function useModalA11y({ isOpen, onClose, ref }) {
  useEffect(() => {
    if (!isOpen) return
    const container = ref.current
    if (!container) return

    const previousActive = document.activeElement
    const focusables = getFocusables(container)
    if (focusables.length > 0) {
      focusables[0].focus()
    } else if (typeof container.focus === 'function') {
      container.focus()
    }

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
      if (previousActive && typeof previousActive.focus === 'function') {
        try { previousActive.focus() } catch {}
      }
    }
  }, [isOpen, onClose, ref])
}
