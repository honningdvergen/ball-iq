import { useState, useEffect, useCallback } from "react";
import { webPushSupported, webPushPermission, enableWebPush, disableWebPush, refreshWebPushSubscription } from "../lib/webpush.js";

// Extracted from AppInner on 2026-09-06 (review E16): the web-push toggle, its
// optimistic state, and the once-per-session re-assert of the subscription.
export function useWebPush({ user, showToast }) {
  const [webPushOn, setWebPushOn] = useState(() => {
    try { return webPushSupported() && Notification.permission === 'granted'; } catch { return false; }
  });
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        if (!webPushSupported()) return;
        if (user?.id) await refreshWebPushSubscription();
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!dead) setWebPushOn(!!sub && Notification.permission === 'granted');
      } catch { /* keep the optimistic state rather than lying OFF on a flake */ }
    })();
    return () => { dead = true; };
  }, [user?.id]);
  const handleToggleWebPush = useCallback(async (on) => {
    if (on) {
      // Requesting from inside this handler is load-bearing, not incidental:
      // Safari rejects requestPermission() outside a user gesture entirely.
      const ok = await enableWebPush();
      setWebPushOn(ok);
      showToast(ok
        ? 'Daily reminders on 🔔'
        : (webPushPermission() === 'denied'
            ? 'Blocked in your browser — allow notifications for balliq.app'
            : "Couldn't turn reminders on"));
    } else {
      await disableWebPush();
      setWebPushOn(false);
      showToast('Daily reminders off');
    }
  }, [showToast]);
  return { webPushOn, setWebPushOn, handleToggleWebPush };
}
