/**
 * A funnel event from the MARKETING page, with no Supabase client attached.
 *
 * ⚠️ WHY fetch AND NOT supabase-js. `/` renders ScoutingReport, a lazy chunk
 * that today imports no Supabase code at all. Pulling in the client to send one
 * event would add the whole library to the page whose measured WebKit first
 * contentful paint is 317ms — paying a load-time cost on every visitor to
 * measure a minority of them. The static SEO pages already solved this the same
 * way (scripts/seo/club-quiz-engine.js), so this mirrors that contract rather
 * than inventing a second one.
 *
 * ⚠️ ROBOTS MUST NOT VOTE. Mirrors isSyntheticTraffic() in App.jsx. On
 * 2026-08-21 the Playwright suite put 767 fake rows into funnel_events in three
 * hours against a real DAU of 13-17, because localhost reads the PRODUCTION
 * Supabase credentials.
 *
 * ⚠️ NOT USED ON NATIVE, and must not be. Native never renders `/`. loopEvent's
 * native branch strips the visitor id AND all meta to keep privacy §4, the App
 * Store label and the Play data-safety form true. This file has no such branch
 * because it has no native caller — if one is ever added, that branch comes
 * with it.
 *
 * The visitor id deliberately reuses the app's `biq_vid`, so someone who reads
 * the homepage and then plays is ONE journey rather than two strangers.
 */
// ⚠️ The project URL is a literal in src/supabase.js, NOT an env var — reading
// import.meta.env.VITE_SUPABASE_URL here returned undefined and every event
// would have silently no-opped through the `!URL_` guard below, which is the
// worst failure mode for an instrument: it looks installed and measures zero.
const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
const KEY_ = (import.meta.env.VITE_SUPABASE_KEY || '').trim();

function synthetic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver === true) return true;
    const h = typeof location !== 'undefined' ? location.hostname : '';
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local');
  } catch { return false; }
}

function visitorId() {
  try {
    let v = localStorage.getItem('biq_vid');
    if (!v) {
      v = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : null;
      if (!v) return null;
      localStorage.setItem('biq_vid', v);
    }
    return (v && v.length === 36) ? v : null;
  } catch { return null; }
}

export function marketingEvent(name, meta) {
  if (synthetic() || !URL_ || !KEY_) return;
  try { if (typeof window !== 'undefined' && typeof window.clarity === 'function') window.clarity('event', name); } catch { /* Clarity is optional and consent-gated */ }
  try {
    // keepalive: the whole point of these events is that they fire on a click
    // that NAVIGATES AWAY. Without it the request is cancelled on unload and
    // the most important events — the ones that convert — are the ones lost.
    fetch(`${URL_}/rest/v1/rpc/record_funnel_event`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json', apikey: KEY_, authorization: `Bearer ${KEY_}` },
      body: JSON.stringify({ p_event: name, p_meta: { surface: 'scouting-report', ...(meta || {}) }, p_visitor: visitorId() }),
    }).catch(() => { /* measurement must never break the page */ });
  } catch { /* ditto */ }
}
