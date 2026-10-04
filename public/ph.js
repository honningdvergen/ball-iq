/**
 * PostHog product analytics — WEBSITE ONLY, and only behind the same consent
 * gate as Microsoft Clarity. Nothing here decides whether to run: the gate in
 * index.html, the identical gate in scripts/gen-seo-pages.mjs head(), and the
 * Allow button in public/consent.js are the only three things that load this
 * file, and none of them runs inside the native app (the store listings and
 * privacy §4 declare no analytics there).
 *
 * Why it exists next to Clarity and funnel_events: Clarity answers "what did
 * this person's screen look like", funnel_events answers "how many reached
 * step N". Neither does retention cohorts, funnels with time-to-convert, or
 * feature-flagged A/B tests. PostHog does, so the same event names that go to
 * funnel_events are mirrored here (see window.biqTrack below).
 *
 * Choices, each deliberate:
 *   - EU cloud (project 293439), proxied through /ingest on our own origin
 *     (vercel.json rewrites) so ad blockers and the CSP see first-party calls.
 *   - PostHog keeps its OWN random anonymous id. It is deliberately NOT
 *     biq_vid: the privacy policy promises biq_vid is never linked to an
 *     account and never shared, and identify() below would break both.
 *   - person_profiles 'identified_only': anonymous visitors cost no profile;
 *     signed-in players are identified by their Supabase user id (useAuth).
 *   - NO session replay. Clarity already does replays with text masked; a
 *     second recorder would double the privacy surface for nothing.
 *   - Automation and localhost are dropped, same rule as loopEvent().
 */
(function () {
  'use strict';
  if (window.__biqPh) return; // loaded by the gate AND the Allow button
  window.__biqPh = true;
  var KEY = 'phc_x5FWX6yLK2WhQbvDH7m2JcnteR6k4hmhrSSoFoVEiYWN';

  function synthetic() {
    try {
      if (navigator.webdriver === true) return true;
      var h = location.hostname;
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /\.local$/.test(h);
    } catch (e) { return false; }
  }
  if (synthetic()) return;

  /* PostHog's official loader stub (queues calls until /ingest/static/array.js
     arrives). Kept verbatim apart from formatting. */
  !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split('.'); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement('script')).type = 'text/javascript', p.crossOrigin = 'anonymous', p.async = !0, p.src = s.api_host + '/static/array.js', (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = 'posthog', u.people = u.people || [], u.toString = function (t) { var e = 'posthog'; return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e }, u.people.toString = function () { return u.toString(1) + '.people (stub)' }, o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);

  window.posthog.init(KEY, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    disable_session_recording: true,
  });
  window.posthog.register({ native: false });

  /* The one call every first-party event sink makes. Defined here, so it only
     exists when PostHog is allowed to run; call sites guard on it. */
  window.biqTrack = function (name, props) {
    try { window.posthog.capture(name, props || {}); } catch (e) { /* never break the page */ }
  };
  /* A player signed in before consent was given: identify now. */
  try { if (window.__biqUid) window.posthog.identify(window.__biqUid); } catch (e) {}
})();
