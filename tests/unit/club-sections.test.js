import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
// The picker left App.jsx on 2026-09-06 (E16, brick 10); the club maps stay in App.
const src = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8') + '\n' + readFileSync(join(ROOT, 'src/screens/ClubQuizScreen.jsx'), 'utf8');

const objectAfter = (marker) => {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error(`${marker} not found`);
  let d = 0, j = src.indexOf('{', i);
  for (; j < src.length; j += 1) {
    if (src[j] === '{') d += 1;
    else if (src[j] === '}') { d -= 1; if (!d) break; }
  }
  return src.slice(i, j + 1);
};

const leagues = {};
for (const m of objectAfter('const CLUB_LEAGUES = {').matchAll(/(\w+):\s*"(\w+)"/g)) leagues[m[1]] = m[2];

const packKeys = [...objectAfter('export const CLUB_PACKS = {').matchAll(/^ {2}(\w+):\s*\{/gm)].map((m) => m[1]);

const sections = [...src.matchAll(/\{ key: "(\w+)", label: "([^"]+)" \}/g)].map((m) => ({ key: m[1], label: m[2] }));

/**
 * The club picker groups by COUNTRY, and the order inside each group matters.
 *
 * ⚠️ BOTH HALVES OF THIS WERE BROKEN ON 2026-08-23, in the same change, and a
 * player caught it in one screenshot: "why are birmingham and cardiff on top of
 * premier league club quiz? they are not even in the premier league?"
 *
 *   1. WRONG LABEL. Ten clubs were filed under "pl" — following the convention
 *      Coventry/Hull/Burnley/Wolves already used, beneath a comment that openly
 *      said Burnley and Wolves are in the Championship. A section header is a
 *      statement to the player, and that one was false. League membership
 *      changes every May, so a league label is a fact with an expiry date;
 *      a country does not change, so these cannot rot.
 *
 *   2. WRONG ORDER. The picker previewed the first two clubs per section in
 *      CLUB_PACKS INSERTION ORDER, so the most recently added rows fronted the
 *      section — Birmingham and Cardiff above Arsenal and Liverpool. Order is
 *      now explicit in CLUB_ORDER.
 */
describe('club picker sections', () => {
  it('every club pack has a country', () => {
    const orphans = packKeys.filter((k) => !leagues[k]);
    expect(orphans, `\n  clubs with no country: ${orphans.join(', ')}\n`).toEqual([]);
  });

  it('every country a club claims has a section to render it', () => {
    const keys = new Set(sections.map((s) => s.key));
    const missing = [...new Set(Object.values(leagues))].filter((c) => !keys.has(c));
    expect(missing, `\n  countries with no section: ${missing.join(', ')}\n`).toEqual([]);
  });

  it('no section label names a league', () => {
    // The whole point. "Premier League", "La Liga", "Serie A" and the rest are
    // claims that expire; a club relegated in May silently makes them false.
    const LEAGUEY = /premier league|la liga|serie a|bundesliga|ligue ?1|eredivisie|championship|süper lig|super lig|primeira|premiership|pro league|first league/i;
    const offenders = sections.filter((s) => LEAGUEY.test(s.label)).map((s) => s.label);
    expect(offenders, `\n  league names used as section labels: ${offenders.join(', ')}\n`).toEqual([]);
  });

  it('does not call the Welsh clubs English', () => {
    // Cardiff, Swansea and Wrexham play in the English pyramid but are Welsh.
    // Grouping them with England is right; LABELLING them England is not — it
    // is the same class of error as calling Birmingham a Premier League club.
    for (const k of ['Cardiff', 'Swansea', 'Wrexham']) {
      expect(leagues[k], `${k} should sit in the england section`).toBe('england');
    }
    const label = sections.find((s) => s.key === 'england')?.label || '';
    expect(label, `the england section is labelled "${label}" — it contains Welsh clubs`)
      .toMatch(/wales/i);
  });

  it('the biggest clubs lead their country', () => {
    // Only CLUB_PREVIEW (2) render before "Show all", so whatever leads a
    // section IS the section for most players.
    const order = {};
    const m = src.match(/const CLUB_ORDER = Object\.fromEntries\(Object\.values\((\{[\s\S]*?\})\)\.flat\(\)/);
    expect(m, 'CLUB_ORDER not found').toBeTruthy();
    let idx = 0;
    for (const key of m[1].matchAll(/"(\w+)"/g)) {
      if (!/^(england|spain|italy|germany|france|portugal|netherlands|turkiye|scotland|belgium|croatia|brazil|argentina|other)$/.test(key[1])) {
        order[key[1]] = idx += 1;
      }
    }
    const leadersOf = (country) => Object.keys(leagues)
      .filter((k) => leagues[k] === country)
      .sort((a, b) => (order[a] ?? 1e6) - (order[b] ?? 1e6))
      .slice(0, 2);

    expect(leadersOf('england')).toEqual(['Arsenal', 'ManUtd']);
    expect(leadersOf('spain')).toEqual(['RealMadrid', 'Barcelona']);
    expect(leadersOf('germany')).toEqual(['BayernMunich', 'Dortmund']);
    // And the specific regression the player reported.
    expect(leadersOf('england')).not.toContain('Birmingham');
    expect(leadersOf('england')).not.toContain('Cardiff');
  });

  it('the picker sorts by CLUB_ORDER rather than insertion order', () => {
    expect(src, 'the club list is not sorted — insertion order will front new clubs again')
      .toMatch(/\.sort\(\(\[a\], \[b\]\) => \(CLUB_ORDER\[a\]/);
  });
});
