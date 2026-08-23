// /get — platform-aware store redirect, with per-source attribution.
//
// WHY THIS EXISTS
// Ball IQ is now live on BOTH stores. The ~180 generated SEO pages are static
// HTML with no JS available at render time, so a "Get the app" CTA there has to
// commit to one URL — and hardcoding the App Store dead-ends every Android
// visitor (and vice versa). One redirect fixes every single-CTA call site at
// once, and doubles as the link to paste into a bio, a Reddit comment or a
// social post without picking a platform.
//
// ATTRIBUTION (added 2026-08-10, ahead of the PL-kickoff social push):
// `/get?src=tiktok-xi` tells us which post drove the install instead of
// "downloads went up".
//  - Android: the src rides the Play Install Referrer (`referrer=utm_source=…`),
//    which Play Console reports per-source under Store performance → UTM.
//  - iOS: the App Store URL cannot carry free-form UTM without an Apple
//    Campaign `pt=` provider token we do not have configured, so iOS
//    attribution is CLICK-side only for now (the log line below). Do not
//    invent a `ct=` — without `pt=` Apple ignores it.
//  - Every hit logs one structured line visible in Vercel's function logs:
//    src, platform, country. Coarse, zero-infrastructure, good enough to rank
//    posts against each other during the push window.
//
// ⚠️ The src is user-controlled input that ends up in a URL parameter — it is
// allow-listed to [a-z0-9-] and capped, never passed through raw.
//
// Desktop and anything unrecognised goes to the web app, which is the correct
// destination there: the game runs fine in a browser and installs as a PWA.

// ⚠️ STOREFRONT, NOT JUST PLATFORM. This used to be hardcoded to /us/ — and
// the US shelf is the one storefront with ZERO ratings. Measured live
// 2026-08-23: US 0, GB 5.0 from 3, NO 5.0 from 2, FR 5.0 from 1. Apple shows
// each country its own ratings, so every British and Norwegian visitor tapping
// a "Get the app" CTA was being handed the emptiest shelf we own, complete
// with "hasn't received enough ratings or reviews to display a summary" —
// while their own storefront showed five stars. That is the single worst
// conversion detail in the funnel and it is fixed here, for every one of the
// ~180 static SEO pages at once, with no app build and no store review.
//
// The old slug went too: `ball-iq-football-trivia` is two names stale and
// 301s. Apple routes by ID, so the ID-only form is both correct and one hop
// shorter on a tap that is already asking a lot.
//
// Keep in sync with APPLE_STOREFRONTS in src/lib/links.js — an edge function
// cannot import from src/, same constraint the static HTML has.
const APPLE_STOREFRONTS = new Set(['us','gb','no','de','es','fr','it','br','tr','id','nl','se','dk','fi','ie','pt','pl','ca','au','mx','ar','in','za','be','at','ch','cz','gr','hu','ro','sa','ae']);
const APP_STORE_ID = '6775975961';
const appStoreFor = (country) => {
  const cc = String(country || '').toLowerCase();
  // Fall back to /us/ when the region is unreadable or unsupported — that is
  // exactly the old behaviour, so this can only improve on what was there.
  return `https://apps.apple.com/${APPLE_STOREFRONTS.has(cc) ? cc : 'us'}/app/id${APP_STORE_ID}`;
};
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=app.balliq';
const WEB_APP = 'https://balliq.app/play';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const ua = req.headers.get('user-agent') || '';
  const url = new URL(req.url);

  // Allow-listed source tag: lowercase slug, max 40 chars, or absent.
  const rawSrc = url.searchParams.get('src') || '';
  const src = /^[a-z0-9-]{1,40}$/.test(rawSrc) ? rawSrc : '';

  // Order matters: iPadOS 13+ reports as "Macintosh", so check the iOS family
  // first and treat a touch-capable Mac UA as iPad only via the explicit
  // iPad/iPhone/iPod tokens. Windows Phone historically contained "Android"
  // in some UAs, so exclude it before the Android test.
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua) && !/Windows Phone/i.test(ua);

  const country = req.headers.get('x-vercel-ip-country') || null;
  let target = isIOS ? appStoreFor(country) : isAndroid ? PLAY_STORE : WEB_APP;
  if (src && isAndroid) {
    // Play Install Referrer: survives through install and shows up in Play
    // Console's acquisition reports, keyed by utm_source.
    target += '&referrer=' + encodeURIComponent(`utm_source=${src}&utm_medium=social`);
  } else if (src && !isIOS && !isAndroid) {
    // Web fallback keeps the tag so Clarity sessions can be segmented by it.
    target += `?src=${src}`;
  }

  // One line per hit, structured, greppable in Vercel logs during the push.
  console.log(JSON.stringify({
    t: 'get-click',
    src: src || null,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'web',
    country,
    // Which shelf the visitor was actually sent to, so "are non-US installs
    // landing on their own storefront?" is answerable from the logs rather
    // than by re-reading this file.
    storefront: isIOS ? (target.split('/')[3] || null) : null,
  }));

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Never cache at the edge or in the browser — the same URL must be able
      // to resolve differently per visitor. A cached 302 would pin whichever
      // platform happened to ask first.
      'Cache-Control': 'no-store, must-revalidate',
      // Country joins User-Agent now that the destination depends on it too.
      Vary: 'User-Agent, X-Vercel-IP-Country',
    },
  });
}
