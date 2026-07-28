// /get — platform-aware store redirect.
//
// WHY THIS EXISTS
// Ball IQ is now live on BOTH stores. The ~180 generated SEO pages are static
// HTML with no JS available at render time, so a "Get the app" CTA there has to
// commit to one URL — and hardcoding the App Store dead-ends every Android
// visitor (and vice versa). One redirect fixes every single-CTA call site at
// once, and doubles as the link to paste into a bio, a Reddit comment or a
// social post without picking a platform.
//
// Desktop and anything unrecognised goes to the web app, which is the correct
// destination there: the game runs fine in a browser and installs as a PWA.

const APP_STORE = 'https://apps.apple.com/us/app/ball-iq-football-trivia/id6775975961';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=app.balliq';
const WEB_APP = 'https://balliq.app/play';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const ua = req.headers.get('user-agent') || '';

  // Order matters: iPadOS 13+ reports as "Macintosh", so check the iOS family
  // first and treat a touch-capable Mac UA as iPad only via the explicit
  // iPad/iPhone/iPod tokens. Windows Phone historically contained "Android"
  // in some UAs, so exclude it before the Android test.
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua) && !/Windows Phone/i.test(ua);

  const target = isIOS ? APP_STORE : isAndroid ? PLAY_STORE : WEB_APP;

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Never cache at the edge or in the browser — the same URL must be able
      // to resolve differently per visitor. A cached 302 would pin whichever
      // platform happened to ask first.
      'Cache-Control': 'no-store, must-revalidate',
      Vary: 'User-Agent',
    },
  });
}
