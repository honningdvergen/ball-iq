// The reminder is asked for in words again (21 Nov 2026).
//
// The ask had shrunk to a grey bell with no label, and in the week of 16 Nov
// one finished daily in 1,263 led to a tap on it; no phone said yes to
// notifications that week. These pin the rule that replaced it: a labelled
// button under the streak row for a player's first five days of finishes, the
// quiet bell after that, and nothing at all once a reminder is set.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mem = (seed = {}) => { const m = new Map(Object.entries(seed)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };

let DailyDone, readOfferDays, noteOfferDay, asksInWords, noteOfferShown, REMIND_ASK_DAYS;
const load = async (seed) => {
  vi.resetModules();
  vi.stubGlobal('localStorage', mem(seed));
  ({ default: DailyDone, readOfferDays, noteOfferDay, asksInWords, noteOfferShown, REMIND_ASK_DAYS } = await import('../../src/components/DailyDone.jsx'));
};
afterEach(() => { vi.unstubAllGlobals(); });

describe('counting the days the labelled button has been offered', () => {
  beforeEach(() => load());
  it('five days, then it steps back', () => { expect(REMIND_ASK_DAYS).toBe(5); });
  it('nothing stored, or rubbish, reads as never offered', () => {
    expect(readOfferDays(mem())).toEqual({ n: 0, day: -1 });
    for (const junk of ['x', ':', '-3:5', 'NaN:NaN', '{}']) expect(readOfferDays(mem({ biq_remind_offer: junk })).n).toBe(0);
    expect(readOfferDays(mem({ biq_remind_offer: '3:20778' }))).toEqual({ n: 3, day: 20778 });
  });
  it('one count a day, however many dailies are finished that day', () => {
    const s = mem();
    let seen = readOfferDays(s);
    seen = noteOfferDay(seen, s, 20778); seen = noteOfferDay(seen, s, 20778); seen = noteOfferDay(readOfferDays(s), s, 20778);
    expect(readOfferDays(s)).toEqual({ n: 1, day: 20778 });
    noteOfferDay(readOfferDays(s), s, 20779);
    expect(readOfferDays(s)).toEqual({ n: 2, day: 20779 });
  });
  it('storage that throws does not break the panel', () => {
    const bad = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(readOfferDays(bad)).toEqual({ n: 0, day: -1 });
    expect(() => noteOfferDay({ n: 0, day: -1 }, bad, 20778)).not.toThrow();
  });
});

describe('which days are asked in words', () => {
  beforeEach(() => load());
  it('days one to five, and the whole of the fifth day', () => {
    expect(asksInWords({ n: 0, day: -1 }, 20778)).toBe(true);
    expect(asksInWords({ n: 4, day: 20777 }, 20778)).toBe(true);
    // The fifth day's first finish has already written 5:today. The second
    // daily finished that day must still be asked in words.
    expect(asksInWords({ n: 5, day: 20778 }, 20778)).toBe(true);
    expect(asksInWords({ n: 5, day: 20777 }, 20778)).toBe(false);
    expect(asksInWords({ n: 9, day: 20778 }, 20778)).toBe(false);
  });
});

describe('when the labelled button is shown', () => {
  beforeEach(() => load());
  it('the day is written and the offer is counted once per result', () => {
    const s = mem(); const sent = [];
    const track = (name, meta) => sent.push([name, meta]);
    expect(noteOfferShown({ seen: readOfferDays(s), game: 'footle', edition: 202, track, storage: s, today: 20778 })).toBe(true);
    expect(readOfferDays(s)).toEqual({ n: 1, day: 20778 });
    // A second mount of the same result (StrictMode, coming back to the screen).
    expect(noteOfferShown({ seen: readOfferDays(s), game: 'footle', edition: 202, track, storage: s, today: 20778 })).toBe(false);
    // Another daily the same day: its own event, the same day count.
    expect(noteOfferShown({ seen: readOfferDays(s), game: 'daily', edition: 202, track, storage: s, today: 20778 })).toBe(true);
    expect(readOfferDays(s)).toEqual({ n: 1, day: 20778 });
    // The app left open overnight: tomorrow's Footle is a new result.
    expect(noteOfferShown({ seen: readOfferDays(s), game: 'footle', edition: 203, track, storage: s, today: 20779 })).toBe(true);
    expect(readOfferDays(s)).toEqual({ n: 2, day: 20779 });
    // The event carries its name and nothing else.
    expect(sent).toEqual([['dd-remind-offer', undefined], ['dd-remind-offer', undefined], ['dd-remind-offer', undefined]]);
  });
  it('no tracker is not an error', () => {
    expect(() => noteOfferShown({ seen: { n: 0, day: -1 }, game: 'trail', edition: 1, storage: mem(), today: 20778 })).not.toThrow();
  });
});

describe('what the finish panel draws', () => {
  const panel = (remind, extra = {}) => renderToStaticMarkup(React.createElement(DailyDone, { game: 'footle', edition: 202, streak: { count: 1 }, remind, ...extra }));
  const off = { state: 'off', onRemind: () => {} };
  it('a new player is asked in words, under the streak row, with no bell beside it', async () => {
    await load();
    const html = panel(off);
    expect(html).toContain('class="dd-remind"');
    expect(html).toMatch(/Remind me each day at \d{1,2}:\d{2}</);
    expect(html).not.toContain('class="dd-bell"');
    // After the streak row has closed, not inside it.
    expect(html).toMatch(/<\/div><\/div><\/div><button type="button" class="dd-remind"/);
  });
  it('on the fifth day it is still words; after five days it is the quiet bell', async () => {
    await load({ biq_remind_offer: '4:20000' });
    expect(panel(off)).toContain('class="dd-remind"');
    await load({ biq_remind_offer: '5:20000' });
    const html = panel(off);
    expect(html).toContain('class="dd-bell"');
    expect(html).not.toContain('class="dd-remind"');
  });
  it('later the same fifth day, the next finished daily is still asked in words', async () => {
    const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    await load({ biq_remind_offer: `5:${today}` });
    expect(panel(off)).toContain('class="dd-remind"');
  });
  it('the button and the bell call the same handler', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../../src/components/DailyDone.jsx', import.meta.url), 'utf8');
    expect(src).toMatch(/className="dd-remind" disabled=\{busy\} onClick=\{doRemind\}/);
    expect(src).toMatch(/className="dd-bell" disabled=\{busy\} onClick=\{doRemind\}/);
    // And the effect that counts the offer is wired to the labelled state.
    expect(src).toContain('if (askInWords) noteOfferShown({ seen: offerDays, game, edition, track });');
  });
  it('a reminder already set shows its hour and neither ask', async () => {
    await load();
    const html = panel({ state: 'on', onRemind: () => {} });
    expect(html).not.toContain('class="dd-remind"');
    expect(html).not.toContain('class="dd-bell"');
    expect(html).toContain('dd-pill is-set');
  });
  it('blocked, unsupported, or an old day from the archive: no ask of either kind', async () => {
    await load();
    for (const state of ['blocked', 'unsupported']) {
      const html = panel({ state, onRemind: () => {} });
      expect(html, state).not.toContain('class="dd-remind"');
      expect(html, state).not.toContain('class="dd-bell"');
    }
    const arch = panel(off, { isArchive: true });
    expect(arch).not.toContain('class="dd-remind"');
    expect(arch).not.toContain('class="dd-bell"');
  });
  it('the button is tinted, never solid: Share stays the panel\'s one solid thing', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(new URL('../../src/components/dailyDone.css', import.meta.url), 'utf8');
    const rule = css.slice(css.indexOf('.dd-remind{'), css.indexOf('}', css.indexOf('.dd-remind{')));
    expect(rule).toContain('background:rgba(255,170,0,0.10)');
    expect(rule).toContain('min-height:44px');
  });
});
