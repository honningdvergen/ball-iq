// Sound and haptics: the two "you did something" signals. Moved out of App.jsx
// on 11 Nov 2026 (unchanged) so screens can import them without importing the
// app itself.
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { IS_NATIVE } from './platform.js';

// ─── SOUND EFFECTS ────────────────────────────────────────────────────────────
// Pure Web-Audio sound synthesis. Honours biq_settings.sound and no-ops on
// environments without AudioContext or with the setting disabled. Reuses a
// single AudioContext across calls (iOS Safari limits to ~4 concurrent ones).
let _audioCtx = null;
function _getAudioCtx() {
  try {
    if (_audioCtx) return _audioCtx;
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    _audioCtx = new AC();
    return _audioCtx;
  } catch { return null; }
}
export function playSound(type) {
  try {
    // Honour user sound preference (read synchronously so we can be called from anywhere)
    let enabled = false;
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) enabled = JSON.parse(raw)?.sound === true;
    } catch {}
    if (!enabled) return;

    const ctx = _getAudioCtx();
    if (!ctx) return;
    // iOS Safari often keeps the context in "suspended" state until a user gesture.
    // Calling resume() inside a touch handler (where playSound usually fires) is safe.
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      try { ctx.resume(); } catch {}
    }
    const now = ctx.currentTime;

    // Helper: schedule a single sine note with a short attack + exponential release
    const note = (freq, start, dur, vol = 0.13, wave = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      const t0 = now + start;
      const tAttackEnd = t0 + 0.02;
      const tEnd = t0 + dur;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, tAttackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(tEnd + 0.05);
    };

    if (type === "correct") {
      // Two-tone ascending chime: C5 → G5, ~600ms total
      note(523.25, 0,    0.28, 0.15);
      note(783.99, 0.22, 0.38, 0.15);
    } else if (type === "wrong") {
      // Soft sine glide 300 → 200Hz over 400ms — gentle, not harsh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "streak") {
      // C5 → E5 → G5, each 150ms, overlapping slightly
      note(523.25, 0.00, 0.22, 0.14);
      note(659.25, 0.12, 0.22, 0.14);
      note(783.99, 0.24, 0.30, 0.14);
    } else if (type === "daily_complete") {
      // Warm celebratory C-major chord with 800ms soft fade
      note(523.25, 0, 0.8, 0.09);
      note(659.25, 0, 0.8, 0.09);
      note(783.99, 0, 0.8, 0.09);
    } else if (type === "levelup") {
      // Ascending 4-note fanfare, 120ms each
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        note(freq, i * 0.12, 0.20, 0.13);
      });
    } else if (type === "soft") {
      // Sprint #78 UU1: short UI-tap tick. Used by local multiplayer's
      // option-pick handler. Was previously falling through to the silent
      // path because no "soft" case existed — soft taps had no audio
      // feedback even with sound enabled. ~60ms 700Hz, low volume.
      note(700, 0, 0.06, 0.08, "triangle");
    }
  } catch {}
}

// Sprint #87: native iOS haptics via @capacitor/haptics. navigator.vibrate is a
// silent no-op on iOS WKWebView so the web-only path produced zero feedback on
// the installed app. On native (Capacitor.isNativePlatform()) we dispatch to the
// system Taptic engine; on the web we keep the navigator.vibrate fallback so
// Android Chrome / installed Android PWAs still buzz.
// Sprint #89 #2: gated on settings.haptics (defaults true). Read synchronously
// from localStorage so the helper can be called from anywhere (matches the
// playSound pattern at line 3082). OS-level haptics disabled silently no-ops
// inside the plugin itself, so no extra guard needed for that case.
// ⚠️ EVERY CALL IS A NATIVE BRIDGE ROUND TRIP, AND THEY SERIALISE.
// From Alex's device log while tab switching felt slow — ~57 of these back to
// back, each a full JS -> native -> JS hop, with
// `WebProcessProxy::didBecomeUnresponsive` in the same log:
//
//     ⚡️ To Native ->  Haptics impact 120633433
//     ⚡️ TO JS undefined
//     ⚡️ To Native ->  Haptics impact 120633434
//     ⚡️ TO JS undefined      … x57
//
// No amount of browser profiling can see this: there is no bridge in Chrome,
// which is why three rounds of CSS measurement kept saying the app was fine
// while the phone said otherwise. Capacitor builds a fresh
// UIImpactFeedbackGenerator per call and iOS charges latency for one that has
// not been prepare()d, so a burst of taps queues a burst of hops in front of
// the UI work.
//
// 55ms floor for the LIGHT taps only. Two impacts closer together than that
// are not distinguishable by a fingertip anyway, so nothing is lost — while a
// spammed tab bar or a fast Footle typist stops flooding the bridge. The
// meaningful, once-per-moment haptics (correct, wrong, levelup, hardCorrect)
// are deliberately exempt: those must never be swallowed.
let _lastLightHapticAt = 0;
export function haptic(type) {
  try {
    if (type === "soft" || type === "select") {
      const now = Date.now();
      if (now - _lastLightHapticAt < 55) return;
      _lastLightHapticAt = now;
    }
    let enabled = true;
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) {
        const v = JSON.parse(raw)?.haptics;
        enabled = v !== false; // default-on: missing/undefined => true
      }
    } catch {}
    if (!enabled) return;
    if (IS_NATIVE) {
      if (type === "correct") Haptics.impact({ style: ImpactStyle.Medium });
      else if (type === "wrong") Haptics.notification({ type: NotificationType.Error });
      else if (type === "soft" || type === "select") Haptics.impact({ style: ImpactStyle.Light });
      else if (type === "heavy") Haptics.impact({ style: ImpactStyle.Heavy });
      else if (type === "hardCorrect") Haptics.notification({ type: NotificationType.Success });
      else if (type === "levelup") {
        Haptics.notification({ type: NotificationType.Success });
        setTimeout(() => { try { Haptics.impact({ style: ImpactStyle.Heavy }); } catch {} }, 220);
      }
      return;
    }
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (type === "correct") navigator.vibrate(40);
    else if (type === "wrong") navigator.vibrate([30, 20, 30]);
    else if (type === "soft" || type === "select") navigator.vibrate(15);
    else if (type === "heavy") navigator.vibrate(100);
    else if (type === "hardCorrect") navigator.vibrate([30, 40, 30, 40, 60]);
    else if (type === "levelup") navigator.vibrate([50, 30, 50, 30, 100]);
  } catch {}
}
