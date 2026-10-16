// Is this page open inside a social app's own browser, and which app?
//
// WHY (website audit 2026-10-15, item 7). Social traffic lands on /footle
// inside the Instagram, Threads, Facebook, TikTok and X in-app browsers, and
// Apple's Smart App Banner (the apple-itunes-app meta on every page) never
// appears in any of them. The only store link a social visitor met was two
// screens below a win. InAppStrip uses this to show them one quiet line.
//
// Two signals, either is enough:
//   1. the user agent names the app (the in-app browser itself), or
//   2. utm_source names a social channel (the /t /ig /tt /x /yt /bs /igs /tgf
//      short links in vercel.json all carry one, and /footle keeps the query
//      string when it rewrites the address to /play).
// The answer is a slug for /get?src=<slug>-inapp, so it must stay inside
// api/get.js's allow-list: [a-z0-9-], 40 characters at most.

// Order matters: the Threads browser identifies as "Barcelona" (its codename)
// and may carry Instagram's token as well, so it is tested first.
const UA_RULES = [
  [/\bBarcelona\b/i, 'threads'],
  [/\bInstagram\b/i, 'instagram'],
  [/FBAN|FBAV|FB_IAB|FBIOS/, 'facebook'],
  [/musical_ly|BytedanceWebview|TikTok|trill_/i, 'tiktok'],
  [/\bTwitter\b/i, 'x'],
];

const SOCIAL_UTM = {
  instagram: 'instagram', ig: 'instagram', instagram_story: 'instagram-story', 'instagram-story': 'instagram-story',
  threads: 'threads',
  facebook: 'facebook', fb: 'facebook',
  tiktok: 'tiktok',
  x: 'x', twitter: 'x',
  youtube: 'youtube', bluesky: 'bluesky', telegram: 'telegram', reddit: 'reddit', snapchat: 'snapchat',
};

/** The app whose in-app browser this user agent belongs to, or null. */
export function inAppFromUA(ua) {
  const s = String(ua || '');
  for (const [re, name] of UA_RULES) if (re.test(s)) return name;
  return null;
}

/** The social channel a utm_source names, or null for anything else. */
export function socialFromUtm(search) {
  try {
    const raw = new URLSearchParams(search || '').get('utm_source') || '';
    return SOCIAL_UTM[raw.toLowerCase().trim()] || null;
  } catch { return null; }
}

/** The source slug for the strip's /get link, or null when the strip should not show. */
export function inAppSource({ ua, search } = {}) {
  return inAppFromUA(ua) || socialFromUtm(search);
}

/**
 * True inside the Capacitor app, on both platforms. Three signals, because
 * each one alone has a gap: iOS serves from capacitor://, Android from
 * https://localhost (so the protocol test misses it), and the native-app class
 * is set by index.html's inline script, which an island page never runs.
 */
export function isNativeShell() {
  try {
    if (location.protocol === 'capacitor:') return true;
    if (document.documentElement.classList.contains('native-app')) return true;
    const C = window.Capacitor;
    return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  } catch { return false; }
}
