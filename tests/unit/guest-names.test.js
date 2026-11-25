// The name a player gets before they have typed one (lib/guestNames.js, 25 Nov 2026).
// Alex: "and do not call the default player mega winger 61 haha. give him a funny football
// community inside joke type of name"; "var victim is funny, hoofball enjoyer is funny, stat
// padder is funny".
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUEST_NAMES, pickGuestName } from '../../src/lib/guestNames.js';
import { isProfaneUsername } from '../../src/lib/profanity.js';

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

describe('the default name is a football in-joke', () => {
  it('his three picks lead the English pool, and the old adjective-noun-number names are gone', () => {
    expect(GUEST_NAMES.en.slice(0, 3)).toEqual(['VAR Victim', 'Hoofball Enjoyer', 'Stat Padder']);
    expect(APP).not.toMatch(/GUEST_ADJECTIVES|GUEST_NOUNS/);
    for (const old of ['Mega', 'Turbo', 'Winger', 'Striker']) for (const n of GUEST_NAMES.en) expect(n.split(' ')).not.toContain(old);
  });

  it('every name fits where it is shown: 20 characters, no number, allowed by the name filter', () => {
    for (const lang of ['en', 'es']) {
      const pool = GUEST_NAMES[lang];
      expect(pool.length, lang).toBe(18);
      expect(new Set(pool).size, `${lang}: no name twice`).toBe(pool.length);
      for (const n of pool) {
        // set_player_name and the league's name rule both stop at 20.
        expect(n.length, n).toBeLessThanOrEqual(20);
        expect(n, `${n}: no number`).not.toMatch(/\d/);
        expect(n, `${n}: tidy`).toBe(n.trim().replace(/\s+/g, ' '));
        expect(isProfaneUsername(n), n).toBe(false);
        // Not a name the app treats as "no name yet".
        expect(/^player(_|$)/i.test(n), n).toBe(false);
      }
    }
  });

  it('Spanish has its own, not the English ones', () => {
    const en = new Set(GUEST_NAMES.en);
    for (const n of GUEST_NAMES.es) expect(en.has(n), n).toBe(false);
    expect(GUEST_NAMES.es).toContain('Víctima del VAR');
  });

  it('a name comes from the player\'s language, English for any other', () => {
    expect(pickGuestName('en', () => 0)).toBe('VAR Victim');
    expect(pickGuestName('es', () => 0)).toBe('Víctima del VAR');
    expect(pickGuestName('en', () => 0.9999)).toBe(GUEST_NAMES.en[17]);
    expect(pickGuestName('en', () => 1)).toBe(GUEST_NAMES.en[17]);
    expect(pickGuestName('nb', () => 0)).toBe('VAR Victim');
    for (let i = 0; i < 50; i++) expect(GUEST_NAMES.es).toContain(pickGuestName('es'));
  });

  it('is made once and kept on the device, so a guest who has a name keeps it', () => {
    const fn = APP.slice(APP.indexOf('export function getGuestDisplayName() {'), APP.indexOf('export function peekGuestDisplayName() {'));
    expect(fn).toContain('const stored = localStorage.getItem(GUEST_NAME_KEY);');
    expect(fn).toContain('if (stored) return stored;');
    expect(fn).toContain('const name = pickGuestName(getLang());');
    expect(fn).toContain('localStorage.setItem(GUEST_NAME_KEY, name);');
    expect(fn.indexOf('if (stored) return stored;')).toBeLessThan(fn.indexOf('pickGuestName('));
    expect(APP).toContain('const GUEST_NAME_KEY = "biq_guest_name";');
  });
});
