// Draws the native launch screen for iOS and Android from one definition.
//
// The launch screen is a picture, not a web page: iOS shows it before the
// WebView exists and Capacitor holds it until App.jsx calls
// SplashScreen.hide(). So on a phone it is what "the splash" IS -- the
// .biq-splash markup in index.html is only ever seen on the web and in PWAs.
// The two are kept alike on purpose (same lettering, same 48% line).
//
// Until 2026-10-09 the picture was the flaming-ball icon over the name set in
// Helvetica Bold, exported by hand. Alex: "I don't like the app icon on the
// splash screen ... the Ball IQ font just looks like not the right font." It
// is now the name alone, in the lettering the app already uses for it (Inter
// 900, tight -- the sign-in screen and the About card). No icon: the icon is
// being redesigned, and a launch screen that carries it would have to be
// re-cut with it.
//
// Geometry. iOS scales one 2732-square image with scaleAspectFill, Android
// crops per-density images with CENTER_CROP. In portrait both fit the image's
// HEIGHT to the screen's, so anything placed as a fraction of the image height
// lands at that fraction of the screen on every phone -- hence the 48% line
// below. Type is sized from the image's long side for the same reason.
//
// Inter is fetched from Google Fonts at draw time, as the app itself does.
// Run by hand when the launch screen changes; the output is committed.
//
//   node scripts/gen-splash.mjs            draw every file
//   node scripts/gen-splash.mjs --preview <file.png>   one phone-sized picture to look at, nothing else written

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { TOKENS } from '../src/design/tokens.js';

const IOS_DIR = 'ios/App/App/Assets.xcassets/Splash.imageset';
const ANDROID_RES = 'android/app/src/main/res';
// Sources kept beside the icon so a later `capacitor-assets generate` cannot
// bring the old picture back.
const SOURCES = ['assets/splash.png', 'assets/splash-dark.png'];

const LINE = 0.48;       // vertical centre of the name, as a fraction of height
const TYPE = 0.054;      // font size, as a fraction of the image's long side

const html = (w, h) => {
  const size = Math.round(Math.max(w, h) * TYPE);
  return `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=block">
<style>
  html,body{margin:0;width:${w}px;height:${h}px;background:${TOKENS.bg};overflow:hidden}
  .mark{position:absolute;left:0;right:0;top:${LINE * 100}%;transform:translateY(-50%);
    text-align:center;line-height:1;white-space:nowrap;
    font-family:Inter,sans-serif;font-weight:900;font-size:${size}px;letter-spacing:-0.035em;
    color:${TOKENS.tx}}
  .mark em{font-style:normal;color:${TOKENS.grn}}
</style><div class="mark">Ball <em>IQ</em></div>`;
};

async function draw(browser, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html(w, h), { waitUntil: 'networkidle' });
  // A launch screen set in the fallback face is the fault this script exists
  // to remove, so refuse to draw one.
  const ok = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('900 40px Inter');
  });
  if (!ok) throw new Error('Inter 900 did not load — no network? Nothing was written.');
  const shot = await page.screenshot({ type: 'png' });
  await page.close();
  return sharp(shot).png({ compressionLevel: 9 }).toBuffer();
}

const browser = await chromium.launch();
try {
  const preview = process.argv.indexOf('--preview');
  if (preview !== -1) {
    const out = process.argv[preview + 1];
    if (!out) throw new Error('--preview needs a file to write');
    // 402x874 is the iPhone 17 in points; the 2732 square is fitted to its
    // height and centre-cropped, exactly as the storyboard does.
    const square = await draw(browser, 2732, 2732);
    await sharp(square).resize({ height: 874 * 2 }).extract({ left: Math.round((874 * 2 - 402 * 2) / 2), top: 0, width: 402 * 2, height: 874 * 2 }).toFile(out);
    console.log(out);
  } else {
    const square = await draw(browser, 2732, 2732);
    const ios = readdirSync(IOS_DIR).filter((f) => f.endsWith('.png'));
    for (const f of ios) await sharp(square).toFile(join(IOS_DIR, f));
    for (const f of SOURCES) await sharp(square).toFile(f);

    const android = readdirSync(ANDROID_RES)
      .filter((d) => d.startsWith('drawable'))
      .map((d) => join(ANDROID_RES, d, 'splash.png'))
      .filter(existsSync);
    // Many densities share a size; draw each size once.
    const bySize = new Map();
    for (const f of android) {
      const { width, height } = await sharp(f).metadata();
      const key = `${width}x${height}`;
      if (!bySize.has(key)) bySize.set(key, await draw(browser, width, height));
      await sharp(bySize.get(key)).toFile(f);
    }
    console.log(`launch screen: ${ios.length} iOS, ${android.length} Android, ${SOURCES.length} sources`);
  }
} finally {
  await browser.close();
}
