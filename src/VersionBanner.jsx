import { useEffect, useRef, useState } from 'react'

// Tuning constants — surface here for easy adjustment without hunting.
// VERSION_CHECK_INTERVAL_MS: how often we poll /version.json while the tab is
//   visible. 5 min keeps load minimal while still catching new deploys quickly.
// VERSION_BANNER_DISMISS_MS: when the user clicks "Later", how long the banner
//   hides before reappearing. 45 min — long enough to not feel naggy, short
//   enough that a stuck user gets nudged again.
const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000
const VERSION_BANNER_DISMISS_MS = 45 * 60 * 1000

const BUILT_SHA = import.meta.env.VITE_GIT_SHA

function useVersionCheck() {
  const [mismatch, setMismatch] = useState(false)

  useEffect(() => {
    // No SHA injected (dev builds, builds without git): skip entirely.
    if (!BUILT_SHA || BUILT_SHA === 'unknown') return

    let cancelled = false

    async function check() {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        if (data?.sha && data.sha !== BUILT_SHA) {
          setMismatch(true)
        }
      } catch {
        // Offline / fetch failure — leave UI alone, retry next interval.
      }
    }

    check()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') check()
    }, VERSION_CHECK_INTERVAL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return mismatch
}

export default function VersionBanner() {
  const mismatch = useVersionCheck()
  const [dismissed, setDismissed] = useState(false)
  const dismissTimerRef = useRef(null)

  useEffect(() => {
    if (!dismissed) return
    dismissTimerRef.current = setTimeout(() => setDismissed(false), VERSION_BANNER_DISMISS_MS)
    return () => clearTimeout(dismissTimerRef.current)
  }, [dismissed])

  if (!mismatch || dismissed) return null

  return (
    <div className="version-banner" role="status" aria-live="polite">
      <span className="version-banner-text">↻ A new version of Ball IQ is available.</span>
      <div className="version-banner-actions">
        <button
          type="button"
          className="version-banner-refresh"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
        <button
          type="button"
          className="version-banner-later"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss for now"
        >
          Later
        </button>
      </div>
    </div>
  )
}
