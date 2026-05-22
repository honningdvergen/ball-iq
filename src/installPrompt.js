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
    writeInstalledEver();
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
// Sprint #64 FF1: post-Footle banner uses its own dismiss flag so the
// Settings card and the post-solve banner can be dismissed independently.
const BANNER_DISMISS_KEY = 'biq_install_banner_dismissed';
// Sprint #64 FF1 + EE3 edge case: once we observe an install completion
// (either the native `appinstalled` event or the user accepting the
// `beforeinstallprompt` outcome), record it permanently. iOS Safari users
// who installed once but reopen via Safari rather than the home-screen
// icon will have navigator.standalone=false, so isStandaloneNow() returns
// false — without this flag the banner would pester them every time. We
// can't observe uninstall, so once set this flag stays; if the user
// genuinely reinstalls they can clear localStorage.
const INSTALLED_EVER_KEY = 'biq_install_completed';
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

function readBannerDismiss() {
  try {
    const raw = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!raw) return false;
    const at = parseInt(raw, 10);
    if (!at || Number.isNaN(at)) return false;
    return (Date.now() - at) < DISMISS_TTL_MS;
  } catch { return false; }
}

function writeBannerDismiss() {
  try { localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now())); } catch {}
}

function readInstalledEver() {
  try { return localStorage.getItem(INSTALLED_EVER_KEY) === '1'; } catch { return false; }
}

function writeInstalledEver() {
  try { localStorage.setItem(INSTALLED_EVER_KEY, '1'); } catch {}
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

  return {
    isInstalled,
    canPromptNative,
    platform,
    showCard,
    promptInstall: runNativePrompt,
    dismiss: () => { writeDismiss(); notify(); },
  };
}

// Shared native-prompt runner. Both useInstallPrompt (Settings card) and
// useInstallBanner (Sprint #64 FF1 post-Footle banner) call the same
// underlying beforeinstallprompt flow. Records "installed ever" on accept
// so the EE3 iOS Safari edge case is handled.
async function runNativePrompt() {
  if (!stashedPrompt) return { outcome: 'no-prompt' };
  let outcome = 'dismissed';
  try {
    const ev = stashedPrompt;
    await ev.prompt();
    const choice = await ev.userChoice;
    outcome = choice?.outcome || 'dismissed';
    if (outcome === 'accepted') writeInstalledEver();
  } catch {}
  stashedPrompt = null;
  notify();
  return { outcome };
}

// Sprint #64 FF1: post-Footle solve install banner. Same install detection
// as useInstallPrompt, but with its own dismiss flag and an "installed
// ever" suppression that catches the iOS Safari edge case (user installed
// once, reopens in Safari rather than from the home-screen icon).
export function useInstallBanner() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    subscribers.add(force);
    return () => { subscribers.delete(force); };
  }, []);

  const platform = detectPlatform();
  const isInstalled = installed;
  const installedEver = readInstalledEver();
  const canPromptNative = !!stashedPrompt;
  const dismissed = readBannerDismiss();
  // Same iOS-Safari-only gate as useInstallPrompt: iOS in other browsers
  // can't install at all, so showing the banner there is wasted real estate.
  const showBanner = !isInstalled && !installedEver && !dismissed
    && (canPromptNative || platform.isIOSSafari);

  return {
    isInstalled,
    canPromptNative,
    platform,
    showBanner,
    promptInstall: runNativePrompt,
    dismiss: () => { writeBannerDismiss(); notify(); },
  };
}
