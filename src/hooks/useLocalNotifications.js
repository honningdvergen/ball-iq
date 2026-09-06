import { useState, useEffect, useRef, useCallback } from "react";
import { cancelAllReminders, getNotifPermission, notificationsSupported, requestNotifPermission, scheduleReminderWindow } from "../lib/notifications.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";
import { registerPush } from "../lib/push.js";
import { webPushPermission, webPushSupported } from "../lib/webpush.js";
import { loopEvent } from "../App.jsx";

// Extracted from AppInner on 2026-09-06 (review E16). Inputs: the user, whether
// today's daily is done, the login streak, the toast, the streak the session
// started with (the once-more ask at three days), and the web-push pair the
// results reminder falls back to on the web. Everything else lives here.
export function useLocalNotifications({ user, dailyDone, loginStreak, showToast, initialStreakRef, webPushOn, handleToggleWebPush }) {
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return localStorage.getItem('biq_notif_enabled') === '1'; } catch { return false; }
  });
  const notifTimerRef = useRef(null);
  useEffect(() => () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); }, []);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const handleToggleNotif = useCallback(async (on) => {
    if (on) {
      const granted = await requestNotifPermission();
      // ⚠️ "Said yes" and "was granted" are DIFFERENT numbers, and only the
      // second earns reach. iOS shows its permission sheet exactly once ever,
      // so a denial here is permanent for that install — which makes the gap
      // between notif-prompt-yes and notif-permission-granted the single most
      // expensive drop in the retention funnel. Measured 2026-08-22: 35 of 209
      // accounts reachable (16.7%), 28 of 93 active players (30%), with no
      // instrumentation anywhere to say why.
      loopEvent(granted ? "notif-permission-granted" : "notif-permission-denied");
      if (!granted) {
        setNotifEnabled(false);
        try { localStorage.removeItem('biq_notif_enabled'); } catch {}
        showToast('Turn on notifications for Ball IQ in iOS Settings to get reminders');
        return;
      }
      try { localStorage.setItem('biq_notif_enabled', '1'); localStorage.removeItem('biq_notif_disabled'); } catch {}
      setNotifEnabled(true);
      // Permission just granted (local + remote share one iOS grant) — register
      // for APNs push too, so the passive sign-in path picks up a token here on.
      if (user?.id) registerPush(user.id, { requestPermission: true });
      const ws = readWordleTodayStatus();
      const playedToday = dailyDone || ws.kind === 'won' || ws.kind === 'lost';
      scheduleReminderWindow({ skipToday: playedToday, streak: loginStreak });
      showToast('Daily reminders on 🔔');
    } else {
      // Explicit opt-out. The 'disabled' marker distinguishes "user turned it
      // off" from "flag never set / evicted" so the reconcile self-heal below
      // won't silently re-enable someone who deliberately said no.
      try { localStorage.removeItem('biq_notif_enabled'); localStorage.setItem('biq_notif_disabled', '1'); } catch {}
      setNotifEnabled(false);
      cancelAllReminders();
      showToast('Daily reminders off');
    }
  }, [dailyDone, showToast, user?.id, loginStreak]);
  const resultsRemindState = notificationsSupported()
    ? (notifEnabled ? 'on' : (notifBlocked ? 'blocked' : 'off'))
    : (webPushSupported() && user?.id ? (webPushOn ? 'on' : (webPushPermission() === 'denied' ? 'blocked' : 'off')) : 'unsupported');
  const remindFromResults = useCallback(async () => {
    loopEvent('results-remind-tap', { engine: notificationsSupported() ? 'native' : 'web' });
    if (notificationsSupported()) await handleToggleNotif(true);
    else await handleToggleWebPush(true);
  }, [handleToggleNotif, handleToggleWebPush]);
  const maybePromptNotif = useCallback(async () => {
    // Min-gap between soft-prompt asks (first-session audit 2026-08-30: the
    // sheet fired twice within ~3 minutes of one session — the second time
    // over a LOSS screen, minutes after being declined). The 2-lifetime-ask
    // cap bounds the total; this bounds the RATE. Shared by both platform
    // paths below.
    try {
      const lastAsk = parseInt(localStorage.getItem('biq_notif_last_ask') || '0', 10);
      if (lastAsk && Date.now() - lastAsk < 24 * 3600 * 1000) {
        loopEvent('notif-prompt-skipped', { reason: 'asked-recently', engine: notificationsSupported() ? 'native' : 'web' });
        return false;
      }
    } catch {}
    // WEB PATH (scouting report, retention 5/C): the delivery engine — sw.js
    // push handlers, the send-web-push edge function, an hourly pg_cron — has
    // been live in prod with ZERO subscribers, because the only surface that
    // ever asked was a Settings toggle nobody visits. The same sheet at the
    // same post-solve moment now asks on the web too; "Yes, remind me" runs
    // enableWebPush() instead of the native toggle.
    //   · signed-in only: persist() upserts by user id, so a guest's subscribe
    //     cannot stick — and the guest already owns this moment via the
    //     save-your-progress nudge, which is worth more while retention is
    //     the binding constraint.
    //   · permission==='default' only: never re-ask a browser that decided.
    //   · same biq_notif_asks cap — localStorage is per-context, so the two
    //     platforms cannot burn each other's two asks.
    if (!notificationsSupported()) {
      try {
        // ⚠️ WHY THE BAIL REASON IS RECORDED. web_push_subscriptions holds ONE
        // row and notif-prompt-shown has never fired, and until now that told
        // us nothing: five different gates return false here and they mean
        // completely different things. "Nobody is signed in" is a product
        // problem, "the browser already denied" is not a problem at all, and
        // "no VAPID key in this build" is a config problem — the same silence
        // for all three.
        //
        // That ambiguity already cost a wrong diagnosis today: .env.local has
        // no VITE_VAPID_PUBLIC_KEY, which reads as "web push is structurally
        // impossible" — until you check the LIVE bundle, where Vercel's copy
        // of the key is present and it works fine. One event name would have
        // settled it in seconds.
        //
        // Cheap and bounded: one row per bail, only at the two moments the
        // prompt is considered at all, and only on web.
        const bail = (reason) => { loopEvent("notif-prompt-skipped", { reason, engine: "web" }); return false; };
        if (!webPushSupported()) return bail("unsupported");
        if (!user?.id) return bail("guest");
        if (webPushOn) return bail("already-on");
        if (webPushPermission() !== 'default') return bail(`perm-${webPushPermission()}`);
        const asks = parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10);
        if (asks >= 2) return bail("asks-exhausted");
        // Same rule as the native path — see the note there. Bails are already
        // instrumented, so this one is measurable rather than invisible.
        let webPlays = 0;
        try { webPlays = JSON.parse(localStorage.getItem('biq_stats') || '{}')?.gamesPlayed || 0; } catch {}
        if (webPlays < 2) return bail("too-early");
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        // Spend the ask WHEN THE SHEET OPENS, not at schedule time. A player
        // who closes the tab inside the 7s hold used to burn one of their two
        // lifetime asks on a sheet they never saw — prod showed a visitor at
        // asks-exhausted with notif-prompt-shown fired twice ever.
        // (2026-09-06) The bottom sheet is retired: the results panel (DailyDone)
        // carries "Remind me" and asks for permission on THAT tap. The bails above
        // stay measured; nothing opens here any more.
        return false;
      } catch { return false; }
    }
    const nBail = (reason) => { loopEvent("notif-prompt-skipped", { reason, engine: "native" }); return false; };
    try {
      if (localStorage.getItem('biq_notif_enabled') === '1') return nBail("already-enabled");
      const asks = parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10);
      if (asks >= 2) return nBail("asked-twice");
      // ⚠️ NEVER ON A PLAYER'S FIRST RESULT SCREEN.
      // The 7s hold below fixed the sheet COVERING the payoff. It did not fix
      // asking too early: on a clean install the very first thing a new player
      // finishes is also the first time they are asked to accept daily
      // notifications — before the app has shown them anything worth being
      // reminded about. That is the ask most likely to be refused, and iOS
      // gives you exactly one native permission prompt, so a "no" here is
      // permanent. `biq_notif_asks` caps us at 2 tries; this makes sure
      // neither of them is spent on the worst possible moment.
      // Read from the same persisted stats the rest of the app uses, so the
      // gate survives a reload and cannot be reset by remounting.
      let playsSoFar = 0;
      try { playsSoFar = JSON.parse(localStorage.getItem('biq_stats') || '{}')?.gamesPlayed || 0; } catch {}
      if (playsSoFar < 2) return nBail("too-early");

      const perm = await getNotifPermission();
      if (perm !== 'prompt' && perm !== 'prompt-with-rationale') return nBail(`perm-${perm}`);
      // ⏱ HOLD THE SHEET UNTIL THE PAYOFF HAS LANDED.
      // The moment is right — solving is the app's happiest second, and that
      // call stands. The problem was that the sheet opened on the SAME frame
      // as the reveal, so it covered the thing the player had just earned:
      // Footle's "The answer was Sergio Busquets" and the Trail's whole career
      // plus "It was Christian Eriksen". Both times it also buried Share,
      // which is the one action we most want at that moment.
      // Caught while taking store screenshots — the sheet had to be dismissed
      // to photograph either result.
      // The decision stays synchronous (the rating path reads the return value
      // to avoid stacking two modals); only the OPENING is deferred.
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      // 7s, not 3s. Measured on a clean install: the reveal animation alone runs
      // ~1.5s, so a 3s delay showed the answer and then covered Share before
      // anyone could reach it — a glance, not a window. Sharing is the action
      // we most want here, so it gets the beat. The ask still lands on the
      // result screen, which is the moment Alex called correctly.
      // Ask spent at open time, same reason as the web path above.
      // (2026-09-06) The bottom sheet is retired: the results panel (DailyDone)
      // carries "Remind me" and asks for permission on THAT tap. The bails above
      // stay measured; nothing opens here any more.
      return false;
    } catch { return false; }
  }, [user?.id, webPushOn]);
  useEffect(() => {
    if (!notifEnabled) return;
    const ws = readWordleTodayStatus();
    const playedToday = dailyDone || ws.kind === 'won' || ws.kind === 'lost';
    scheduleReminderWindow({ skipToday: playedToday, streak: loginStreak });
  }, [notifEnabled, dailyDone, loginStreak]);
  useEffect(() => {
    if (loginStreak >= 3 && initialStreakRef.current < 3) {
      try {
        if (localStorage.getItem('biq_notif_streak_asked') === '1') return;
        localStorage.setItem('biq_notif_streak_asked', '1');
      } catch {}
      maybePromptNotif();
    }
  }, [loginStreak, maybePromptNotif]);
  useEffect(() => {
    let cancelled = false;
    const reconcile = async () => {
      let enabledFlag, disabledFlag;
      try {
        enabledFlag = localStorage.getItem('biq_notif_enabled') === '1';
        disabledFlag = localStorage.getItem('biq_notif_disabled') === '1';
      } catch { return; }
      const perm = await getNotifPermission();
      if (cancelled) return;
      // Surface a hard denial in Settings. iOS only ever shows its permission
      // sheet ONCE — after a denial requestNotifPermission() resolves false
      // instantly, so the toggle became a dead control: flip it, get a toast,
      // watch it snap back, with no clue that the fix lives in iOS Settings.
      setNotifBlocked(perm === 'denied');
      if (enabledFlag && perm !== 'granted') {
        // Revoked in OS Settings while the toggle read ON — turn it off.
        setNotifEnabled(false);
        try { localStorage.removeItem('biq_notif_enabled'); } catch {}
        cancelAllReminders();
      } else if (!enabledFlag && !disabledFlag && perm === 'granted') {
        // Self-heal the other direction: OS permission is granted (only our
        // prompt or iOS Settings can do that) and the user never explicitly
        // opted out, but the local flag was lost (PWA storage eviction /
        // reinstall). Re-enable — the notifEnabled effect reschedules the
        // window — so a granted user never silently stops getting reminders.
        try { localStorage.setItem('biq_notif_enabled', '1'); } catch {}
        setNotifEnabled(true);
      }
    };
    reconcile();
    const onVis = () => { if (document.visibilityState === 'visible') reconcile(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); };
  }, []);
  useEffect(() => {
    if (!notifEnabled) return;
    const onRollover = () => { scheduleReminderWindow({ skipToday: false, streak: loginStreak }); };
    window.addEventListener('biq:day-rollover', onRollover);
    return () => window.removeEventListener('biq:day-rollover', onRollover);
  }, [notifEnabled, loginStreak]);
  return { notifEnabled, setNotifEnabled, notifBlocked, notifTimerRef, handleToggleNotif, resultsRemindState, remindFromResults, maybePromptNotif };
}
