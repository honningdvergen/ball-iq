// The funnel: loopEvent() and the gates in front of it. Moved out of App.jsx on
// 11 Nov 2026 (unchanged) so every screen and hook reports into the SAME funnel
// without importing the app itself.
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabase.js';
import { cleanAppDayMeta } from './cohort.js';
import { IS_NATIVE } from './platform.js';

// A stable per-device id so a funnel can be followed across a visit without
// anything resembling a fingerprint. Random, client-issued, and it never
// leaves localStorage — same approach challenge_events already uses.
function visitorId() {
  try {
    let v = localStorage.getItem("biq_vid");
    if (!v) { v = (crypto?.randomUUID?.() || String(Math.random()).slice(2)); localStorage.setItem("biq_vid", v); }
    return /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  } catch { return null; }
}

// ⚠️ This used to fire into Clarity and NOWHERE ELSE, which made it
// write-only: Clarity's export API returns only its own auto-detected smart
// events, so a query for onboard-done-answered / first-game-started /
// clubq-play comes back empty. Three features shipped in August that could
// not be read, and every recommendation about them in scouting report #2 was
// therefore reasoning rather than measurement.
// Now it fans out to BOTH — Clarity keeps session replay lined up with the
// numbers, and funnel_events makes the numbers answerable in SQL forever.
// Fire-and-forget on purpose: measurement must never delay or break a game.
// ⚠️ SYNTHETIC TRAFFIC MUST NOT REACH THE FUNNEL.
//
// Measured 2026-08-21, three hours after funnel_events went live: 905 rows,
// of which 767 were `first-game-started` at ~250/hour, exactly one per
// visitor, arriving in precisely the hours the Playwright suite was running —
// against a real DAU of 13-17. One row was literally named `probe-e2e`.
//
// The cause is a seam, not a bug in anything: the e2e suite runs against
// localhost:4173, localhost reads .env.local, and .env.local points at
// PRODUCTION Supabase because there is no staging project. So every local run
// and every CI run wrote test events into the table the product's decisions
// are supposed to come from. A green suite was quietly corrupting the
// instrument it shares a repo with.
//
// This is worse than having no data, because it looks like data. 767 synthetic
// rows would have drowned real signal at a ratio of roughly 50:1 and made
// every funnel number read as a triumph.
//
// Two signals, both deliberately conservative — when in doubt, DON'T record:
//   navigator.webdriver  is set by every automation driver (Playwright,
//                        Selenium, Puppeteer) and by nothing else.
//   localhost/127.0.0.1  is Alex's own dev browsing, which is not a user
//                        journey either and never should have counted.
// Native builds have neither, so real app traffic is untouched.
export function isSyntheticTraffic() {
  try {
    if (IS_NATIVE) return false;
    if (typeof navigator !== "undefined" && navigator.webdriver === true) return true;
    const h = typeof location !== "undefined" ? location.hostname : "";
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local");
  } catch { return false; }
}

// ⭐ The ONE exception to "native sends the name and nothing else" (below):
// the rating funnel, and only a fixed set of low-cardinality words.
//
// ASO deep-dive, 2026-10-04: native logged 103 rate-prompt-shown against 668
// rate-prompt-skipped in five weeks, skips rising every week — and every one of
// those rows reads {native, anon}, so nobody can say whether the cooldown, a
// bad moment or a screen change eats 87% of the happy moments. Ratings are
// also per STORE, and the rows could not even tell iOS from Android.
//
// Why this still keeps the promise in privacy §4 ("no identifier of any
// kind… nothing links one count to another"): every value here is one word
// from a short closed list (cooldown, footle, ios…). There is no id, no club
// slug, no surface path, no number — nothing that varies per person, so no
// combination of these fields can single anyone out or join two rows. Keys
// outside the list, and values that are not a short lowercase word, are
// dropped rather than trusted, so a future call site cannot widen it by
// accident.
const NATIVE_RATE_EVENT = /^rate-(prompt|link)-/;
const NATIVE_RATE_KEYS = ["reason", "trigger", "engine", "store", "surface"];
const NATIVE_RATE_WORD = /^[a-z][a-z-]{0,23}$/;
function nativeRateMeta(name, meta) {
  const out = { native: true, anon: true };
  // The return counter (lib/cohort.js, 8 Nov 2026): the second closed
  // exception. Install week, a days-since bucket and a league flag, filtered
  // to their exact shapes, plus the platform. Still no identifier.
  if (name === "app-day") {
    try { const p = Capacitor.getPlatform?.(); if (p === "ios" || p === "android") out.platform = p; } catch {}
    return { ...out, ...cleanAppDayMeta(meta) };
  }
  if (!NATIVE_RATE_EVENT.test(name)) return out;
  try {
    const p = Capacitor.getPlatform?.();
    if (p === "ios" || p === "android") out.platform = p;
    if (meta) for (const k of NATIVE_RATE_KEYS) {
      const v = meta[k];
      if (typeof v === "string" && NATIVE_RATE_WORD.test(v)) out[k] = v;
    }
  } catch {}
  return out;
}

// Exported so lazy screens can report into the SAME funnel rather than growing
// their own. OnlineMultiplayer needs it for the rivalry prompt; scouting report
// #4's item 5 was "instrument the rating funnel — it has ZERO loopEvents", and
// the way that happens is a feature shipping in a file that could not reach
// this function.
export function loopEvent(name, meta) {
  // Gate BOTH sinks. Clarity session replays of a robot are as useless as
  // funnel rows from one, and Clarity's own quota is finite.
  if (isSyntheticTraffic()) return;
  try {
    if (!IS_NATIVE && typeof window !== "undefined" && typeof window.clarity === "function") window.clarity("event", name);
  } catch {}
  // PostHog mirror (web only, consent-gated: biqTrack exists only once
  // public/ph.js has been allowed to load).
  try {
    if (!IS_NATIVE && typeof window !== "undefined" && typeof window.biqTrack === "function") window.biqTrack(name, meta);
  } catch {}
  try {
    // ⚠️ NATIVE IS COUNTED, BUT NEVER IDENTIFIED — and the privacy policy says
    // so in those words. Decision recorded 2026-08-23 (Alex, from three
    // options: guard native entirely / anonymous counts / full funnel).
    //
    // The guard above covers Clarity but NOT this RPC, so shipping 1.6.5 as it
    // stood would have made three separate declarations false at once: privacy
    // §4's "does not measure how you use it… this is enforced in code", the
    // App Store privacy label, and the Play Data safety form. Nobody could
    // have caught it after the fact either — funnel_events holds zero native
    // rows precisely because no shipped build has ever had this code, so the
    // contradiction only appears once it is too late to stop.
    //
    // So native sends the event NAME and nothing else: no biq_vid, no meta
    // (the rating funnel's closed word list in nativeRateMeta is the only
    // exception, and it carries no identifier either).
    // We learn which modes get used and where people stop; we cannot follow a
    // person, because there is no key to follow them by. Dropping meta as well
    // as the id is deliberate — meta carries club slugs and surfaces, and a
    // rich enough meta rebuilds a fingerprint even without an explicit id.
    const anon = IS_NATIVE === true;
    supabase.rpc("record_funnel_event", {
      p_event: name,
      p_meta: anon
        ? nativeRateMeta(name, meta)
        : (meta ? { ...meta, native: false } : { native: false }),
      p_visitor: anon ? null : visitorId(),
      // ⚠️ Belt AND braces, and the braces are the load-bearing half. Passing
      // p_visitor: null is not enough on its own — the function also records
      // auth.uid(), so a signed-in native player would still be named by their
      // ACCOUNT id, a stronger identifier than the one we just withheld.
      // p_anon makes the server null both, so the guarantee survives a stale
      // bundle or a future call site that forgets. See
      // supabase/migrations/v1_6_funnel_anon_native_and_rate_cap.sql.
      p_anon: anon,
    }).then(({ error }) => {
      // ⚠️ supabase.rpc() RESOLVES on error rather than rejecting — a bare
      // .catch() would silently swallow every failure, which is exactly how
      // two write paths were lost before. Check the error explicitly.
      if (error) Sentry.addBreadcrumb({ category: 'funnel', message: `record_funnel_event failed: ${error.message}`, level: 'warning' });
    });
  } catch {}
}
