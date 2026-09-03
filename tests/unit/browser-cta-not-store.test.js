import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// `/get` is a PLATFORM-AWARE redirect (api/get.js): desktop falls through to the
// web app, but every phone is sent to the App Store or Play. That makes it the
// right target for "Get the app" and the WRONG target for any CTA whose copy
// promises the browser — on mobile, which is most of our traffic, the visitor
// taps "nothing to install" and lands on an install page.
//
// This shipped once on the homepage's post-report panel. It is the same class as
// the sign-up dead end in the 1.8 diagnosis: a loop built to the last step and
// leaking there. The copy and the href have to agree, so gate it.
const PAGES = [
  "src/marketing/FrontDoor.jsx",
];

// Anchor text that PROMISES no install. If copy like this grows, add to it.
const PROMISES_BROWSER = /browser|nothing to install|no download|play here/i;

// Hrefs that leave for a store, directly or via the redirect.
const GOES_TO_STORE = /GET_APP|['"]\/get['"]|apps\.apple\.com|play\.google\.com|appStoreUrl|PLAY_STORE_URL/;

describe("a CTA that promises the browser must not send phones to a store", () => {
  for (const file of PAGES) {
    it(`${file} keeps browser CTAs on the web app`, () => {
      const src = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
      // Non-greedy so nested markup inside one anchor doesn't swallow the next.
      const anchors = [...src.matchAll(/<a\s([^>]*)>(.*?)<\/a>/gs)];
      const offenders = anchors
        .filter(([, attrs, text]) => PROMISES_BROWSER.test(text) && GOES_TO_STORE.test(attrs))
        .map(([, attrs, text]) => `"${text.replace(/\s+/g, " ").trim()}" -> ${attrs.trim()}`);
      expect(offenders, `${file}: copy promises the browser but the link goes to a store`).toEqual([]);
    });
  }
});
