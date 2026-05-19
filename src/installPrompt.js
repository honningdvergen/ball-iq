// Sprint #34 BB2: PWA install affordance.
//
// Listeners wire up at module-load time so we catch the early-firing
// `beforeinstallprompt` event before React mounts — Chrome fires it once
// per cold load; missing it leaves the install button inert for the session.
//
// Public hook: `useInstallPrompt()` returns reactive state (isInstalled,
// platform, showCard, promptInstall, dismiss) and re-renders consumers
// when the underlying global state changes.
//
// Dismiss key (`biq_install_dismissed`) holds the dismiss timestamp; we
// re-show the card 30 days after dismissal. The key is a UX dismiss-flag,
// not user data — per feedback memory `feedback_phase_b_clear_list_principle.md`,
// it must NOT be added to USER_SCOPED_STATIC_KEYS in useAuth.jsx.

import { useEffect, useReducer } from 'react';

let stashedPrompt = null;
let installed = isStandaloneNow();
const subscribers = new Set();

function isStandaloneNow() {
  try {
    return (typeof window !== 'undefined' && (
      window.matchMedia?.('(display-mode: standalone)').matches === true
      || window.navigator?.standalone === true
    )) || false;
  } catch { return false; }
}

function notify() {
  for (const fn of subscribers) {
    try { fn(); } catch {}
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // preventDefault stops Chrome's auto-shown mini-infobar so we control
    // when/where the install affordance appears.
    e.preventDefault();
    stashedPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    stashedPrompt = null;
    installed = true;
    notify();
  });
  try {
    const mql = window.matchMedia('(display-mode: standalone)');
    const onChange = () => {
      installed = mql.matches || window.navigator?.standalone === true;
      notify();
    };
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
  } catch {}
}

function detectPlatform() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) && typeof window !== 'undefined' && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  // Safari excludes Chrome/Firefox/Edge on iOS (which all UA-include "Safari"
  // but also their own brand strings).
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return { isIOS, isAndroid, isSafari, isIOSSafari: isIOS && isSafari };
}

const DISMISS_KEY = 'biq_install_dismissed';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readDismiss() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = parseInt(raw, 10);
    if (!at || Number.isNaN(at)) return false;
    return (Date.now() - at) < DISMISS_TTL_MS;
  } catch { return false; }
}

function writeDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

export function useInstallPrompt() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    subscribers.add(force);
    return () => { subscribers.delete(force); };
  }, []);

  const platform = detectPlatform();
  const isInstalled = installed;
  const canPromptNative = !!stashedPrompt;
  const dismissed = readDismiss();
  // iOS Safari has no install API but supports manual Add-to-Home-Screen,
  // so we show instructions instead of a button. iOS in other browsers
  // (Chrome, Firefox, Edge) can't install at all — hide entirely.
  const showCard = !isInstalled && !dismissed && (canPromptNative || platform.isIOSSafari);

  async function promptInstall() {
    if (!stashedPrompt) return { outcome: 'no-prompt' };
    let outcome = 'dismissed';
    try {
      const ev = stashedPrompt;
      // `prompt()` returns a Promise that resolves immediately; userChoice
      // resolves after the user accepts/dismisses the system dialog.
      await ev.prompt();
      const choice = await ev.userChoice;
      outcome = choice?.outcome || 'dismissed';
    } catch {}
    // The event is single-use; clear regardless of outcome so the card
    // unmounts (success) or stays dismissable (cancel).
    stashedPrompt = null;
    notify();
    return { outcome };
  }

  function dismiss() {
    writeDismiss();
    notify();
  }

  return { isInstalled, canPromptNative, platform, showCard, promptInstall, dismiss };
}
