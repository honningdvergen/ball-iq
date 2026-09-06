import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The pre-boot shell must be the screen it is pretending to be — and it must
 * answer the tap it invites.
 *
 * ⚠️ WHAT THIS CAUGHT (2026-08-24, verified against the LIVE document):
 * `https://balliq.app/play` served SIX buttons and they were the only buttons
 * in the whole document — a complete, convincing onboarding question painted
 * from static HTML, with zero `onclick` and zero `addEventListener` anywhere
 * near it. The shell exists precisely because the lazy GameRoot chunk takes
 * seconds to arrive on a cold first visit, so for those seconds a brand-new
 * player's first ever interaction with Ball IQ was a tap that did nothing:
 * no press state, no answer, no error. The better the shell got at looking
 * instant, the longer it lied.
 *
 * Two invariants keep it honest, and BOTH fail silently in the direction of
 * looking fine:
 *
 *   1. EVERY BUTTON IS WIRED. A new control added to the shell markup without
 *      a data hook is a new dead tap, and nothing about the page would look
 *      wrong.
 *   2. THE HTML AND THE COMPONENT AGREE. The replay is INDEX-based, so if the
 *      options drift apart the shell records "option 2" and OnboardingScreen
 *      renders a different option 2 — the player taps Pelé and watches the app
 *      mark Neymar. The file already carried a "KEEP IN SYNC" comment; a
 *      comment is not a gate, which is the entire reason this file exists.
 */

const HTML = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
const APP = readFileSync(fileURLToPath(new URL('../../src/screens/OnboardingScreen.jsx' /* onboarding left App.jsx on 2026-09-06 (E16) */, import.meta.url)), 'utf8');

/** The shell only — never the landing chrome further down the document. */
function shellMarkup() {
  const start = HTML.indexOf('<div id="preboot-onboard"');
  expect(start, 'the pre-boot shell has vanished from index.html').toBeGreaterThan(-1);
  const end = HTML.indexOf('LANDING CHROME', start);
  return HTML.slice(start, end > -1 ? end : start + 12000);
}

/** ONBOARD_SAMPLE, read from source — App.jsx cannot be imported in a unit test. */
function onboardSample() {
  const m = APP.match(/const ONBOARD_SAMPLE = \{ q: "([^"]+)", o: \[([^\]]+)\], a: (\d+) \}/);
  expect(m, 'ONBOARD_SAMPLE moved or changed shape — update this parser deliberately').toBeTruthy();
  return {
    q: m[1],
    o: m[2].split(',').map((s) => s.trim().replace(/^"|"$/g, '')),
    a: Number(m[3]),
  };
}

describe('the pre-boot shell is the screen it imitates', () => {
  it('no button in the shell is dead', () => {
    const shell = shellMarkup();
    const buttons = [...shell.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
    expect(buttons.length, 'the shell should still render the taster + actions').toBe(6);
    const dead = buttons.filter((b) => !/data-biq-(opt|act)=/.test(b));
    expect(
      dead,
      '\n  A shell button with no data hook is a tap that silently does nothing\n' +
      '  for the seconds before the app chunk executes. Give it data-biq-opt\n' +
      '  (a taster option) or data-biq-act (skip/start).\n',
    ).toEqual([]);
  });

  it('the capture script is actually attached', () => {
    // ⚠️ A zero above is worthless if nothing listens. This is the assertion
    // that would have failed against the shipped 2026-08-24 document.
    const shellAndScript = HTML.slice(HTML.indexOf('<div id="preboot-onboard"'));
    expect(shellAndScript).toMatch(/el\.addEventListener\('click'/);
    expect(shellAndScript).toMatch(/window\.__biqPreboot/);
  });

  it('the app adopts what the shell captured', () => {
    // Both halves, or the answer vanishes the moment React takes over.
    expect(APP).toMatch(/window\.__biqPreboot/);
    expect(APP).toMatch(/prebootRef\.current\?\.act/);
  });

  it('reading the pick does not consume it', () => {
    // ⚠️ THE BUG THIS FILE'S FIRST REVISION SHIPPED. Deleting on read looks
    // obviously right — "adopt it once" — and is wrong under StrictMode, which
    // mounts, unmounts and REMOUNTS: mount #1 ate the pick, mount #2 (the one
    // the player actually sees) found nothing and rendered unanswered. Every
    // unit assertion passed; only driving a real browser showed it.
    expect(
      APP,
      '\n  Re-reading is safe — the pick describes a tap from this same page\n' +
      '  load. Deleting it loses the tap on the mount that survives.\n',
    ).not.toMatch(/delete window\.__biqPreboot/);
  });

  it('the skip/start replay is latched so it cannot fire twice', () => {
    // The answer may be adopted on every mount; this one leaves the screen and
    // writes a funnel event, so a StrictMode remount would double-count it.
    expect(APP).toMatch(/prebootActReplayed/);
    const eff = APP.slice(APP.indexOf('if (!prebootRef.current?.act'), APP.indexOf('if (!prebootRef.current?.act') + 300);
    // ⚠️ This assertion is about ORDERING ONLY — do not re-pin the call's
    // arguments here. It used to end `persistAndFinish\(\);`, matching the bare
    // call literally, and in doing so it froze a real bug in place: the bare
    // call passed `undefined` for startGame, so the shell path landed on Home
    // instead of Footle. When that was fixed on 2026-09-01 this gate went red,
    // and a gate going red for a CORRECT change is how a fix gets reverted.
    // What the argument must be is pinned by preboot-replay-starts-game.test.js;
    // this one only guards that the latch is set before the side effect.
    expect(eff, 'latch must be set BEFORE the side effect').toMatch(
      /prebootActReplayed\) return;\s*prebootActReplayed = true;\s*persistAndFinish\(/,
    );
  });

  it('the question and options match ONBOARD_SAMPLE exactly, in order', () => {
    const sample = onboardSample();
    const shell = shellMarkup();
    expect(shell).toContain(sample.q);

    const opts = [...shell.matchAll(/data-biq-opt="(\d+)"[^>]*>([^<]+)</g)]
      .map((m) => ({ i: Number(m[1]), label: m[2].trim() }))
      .sort((a, b) => a.i - b.i);
    expect(opts.map((o) => o.i), 'indices must be 0..3 with no gaps').toEqual([0, 1, 2, 3]);
    expect(
      opts.map((o) => o.label),
      '\n  Index-based replay: drifted options mean the player taps one name and\n' +
      '  the app marks a different one.\n',
    ).toEqual(sample.o);
  });

  it('the shell grades the answer the same way the component does', () => {
    const sample = onboardSample();
    const shell = HTML.slice(HTML.indexOf('<div id="preboot-onboard"'));
    const answer = shell.match(/var ANSWER=(\d+);/);
    expect(answer, 'the shell must know which option is correct').toBeTruthy();
    expect(Number(answer[1]), 'shell and ONBOARD_SAMPLE.a disagree on the answer').toBe(sample.a);

    // The feedback copy is swapped for the React copy mid-visit, so a mismatch
    // is a visible flicker on the handover — including the apostrophes.
    const correct = shell.match(/var CORRECT="([^"]+)"/);
    const wrong = shell.match(/var WRONG="([^"]+)"/);
    // ⚠️ The ball went when the component gained a real reward beat (a green
    // tick + accent ink + a pop). The shell is plain JS in index.html and
    // cannot mount a lucide icon, so it carries the same WORDS — the handover
    // to React must not visibly change the sentence.
    expect(correct[1]).toBe('Nice — you’re a natural');
    expect(wrong[1]).toBe(`It's ${sample.o[sample.a]} — the all-time record holder. You'll pick these up fast!`);
    expect(APP, 'the component copy moved — re-sync the shell').toContain(correct[1]);
  });

  it('the shell\'s primary button LOOKS like the one it hands over to', () => {
    // ⚠️ THIS TEST PASSED THROUGH THE DRIFT IT EXISTS TO CATCH. It compared
    // strings and handlers and never once read app.css — so when .onboard-btn
    // became a 999px pill with a specular shine, the shell kept its 14px
    // rounded rect and nothing failed. A first-time web/PWA visitor saw a flat
    // rectangle snap into a glowing pill at hydration: the exact "two
    // implementations of one screen" seam the file was written for, in the one
    // dimension it was not looking at.
    // Native is unaffected (the shell early-returns on isNativePlatform), which
    // is why a simulator walk could never have found it either.
    const css = readFileSync(fileURLToPath(new URL('../../src/app.css', import.meta.url)), 'utf8');
    const i = css.indexOf('.onboard-btn{');
    const rule = css.slice(i, css.indexOf('}', i));

    const radius = /border-radius:\s*([^;]+)/.exec(rule);
    expect(radius, '.onboard-btn must declare a radius').toBeTruthy();
    expect(HTML, `the shell button must use the same radius (${radius[1]})`)
      .toMatch(new RegExp('border-radius:' + radius[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // The shell cannot use var(--btn-shine): app.css has not loaded yet when it
    // paints. It carries the resolved values instead, so the two must agree by
    // VALUE — assert the shell has a shine and a glow at all.
    expect(HTML, 'the shell button needs the specular highlight').toMatch(/inset 0 1\.5px 0 rgba\(255,255,255,0\.30\)/);
    expect(HTML, 'the shell button needs the glow').toMatch(/0 8px 22px -8px rgba\(88,204,2,0\.55\)/);
    expect(HTML, 'and the on-green ink, not a page black').toMatch(/color:#06230C/);
  });
});
