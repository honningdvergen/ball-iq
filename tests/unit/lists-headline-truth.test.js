import { describe, it, expect } from 'vitest';
import { LISTS } from '../../scripts/seo/lists.mjs';

/**
 * A /lists headline may not advertise an older season than the table holds.
 *
 * Found 2026-09-01. /lists carries 47% of all Search impressions and converts
 * 4% of the clicks. The assumed cause was stale DATA. It was not: nearly every
 * table already ran through the completed 2025-26 season. What was stale was
 * the HEADLINE — 17 of 50 pages said "(1992-93 to 2024-25)" above a table
 * whose last row was 2025-26. Searchers were being told the page was a season
 * out of date while the season they wanted sat right there in it.
 *
 * The drift is structural, not careless. A forge run appends the new season to
 * `rows` and stamps `updated`, and there is nothing in that operation that
 * knows the year is also spelled out in three prose strings. So it will happen
 * again every May unless a build fails.
 *
 * ⚠️ Two traps, both of which produced wrong answers on the first pass:
 *
 * 1. A 4-digit year regex reads "2025-26" as 2025, because "26" is not four
 *    digits. That single fact invented eight non-existent "overclaim" pages
 *    AND hid five genuinely stale ones. Season tokens must resolve to their
 *    SECOND year: "2025-26" ends in 2026.
 *
 * 2. Not every headline claims an end. "Every Capocannoniere Since 1929-30"
 *    is open-ended and can never rot, but a naive max-year check reads its
 *    largest token as 1930 and fails the page forever — the fastest way to
 *    get a gate deleted. So we only compare when the text actually names a
 *    terminus: "to X", "through X", or a literal YYYY–YYYY range.
 *
 * 3. ⚠️ THIS GATE SHIPPED A BUG ON ITS FIRST DAY, AND THEN PASSED IT.
 *    The scripted repair chained three .replace() calls. The first correctly
 *    rewrote "2024-25" -> "2025-26"; the third, /(\bto\s+)2025\b/, then matched
 *    the 2025 it had just written — \b sits happily before a hyphen — and
 *    produced "to 2026-26". Ten live pages read "(1992-93 to 2026-26)".
 *    Both the ad-hoc detector and this gate passed it, because both resolve a
 *    season token to its SECOND year: endYear("2026-26") is 2026, which is the
 *    right terminus. Checking the endpoint was never enough. A season token
 *    must also be INTERNALLY COHERENT — YYYY-YY where YY is the year after
 *    YYYY — or "2026-26" and "1992-47" sail straight through.
 */

const TOKEN = String.raw`\d{4}(?:\s*[-–]\s*\d{2})?`;

/** "2025-26" -> 2026 · "2025" -> 2025 */
function endYear(token) {
  const s = String(token).trim();
  const season = s.match(/^(\d{2})(\d{2})\s*[-–]\s*(\d{2})$/);
  if (season) return Number(season[1] + season[3]);
  const plain = s.match(/^(\d{4})$/);
  return plain ? Number(plain[1]) : null;
}

/** The newest year a string CLAIMS as its endpoint, or null if it claims none. */
function claimedEnd(text) {
  const ends = [];
  for (const m of String(text).matchAll(new RegExp(String.raw`\b(?:to|through)\s+(${TOKEN})`, 'gi'))) ends.push(endYear(m[1]));
  for (const m of String(text).matchAll(/\b(\d{4})\s*[-–]\s*(\d{4})\b/g)) ends.push(endYear(m[2]));
  const real = ends.filter(n => Number.isFinite(n));
  return real.length ? Math.max(...real) : null;
}

/** The newest year the table actually contains. */
function dataEnd(list) {
  let best = null;
  for (const row of list.rows) {
    const y = endYear(row[0]) ?? (String(row[0]).match(/\b(\d{4})\b/) ? Number(String(row[0]).match(/\b(\d{4})\b/)[1]) : null);
    if (Number.isFinite(y) && (best === null || y > best)) best = y;
  }
  return best;
}

describe('/lists headlines tell the truth about the data underneath', () => {
  it('resolves season tokens to their second year', () => {
    expect(endYear('2025-26')).toBe(2026);
    expect(endYear('2025–26')).toBe(2026);
    expect(endYear('1999-00')).toBe(1900); // documented limitation, no such row exists
    expect(endYear('2025')).toBe(2025);
  });

  it('ignores open-ended headlines that claim no endpoint', () => {
    expect(claimedEnd('Every Capocannoniere Since 1929-30')).toBe(null);
    expect(claimedEnd('Clubs With the Most FA Cups')).toBe(null);
    expect(claimedEnd('Every Champion (1992-93 to 2025-26)')).toBe(2026);
    expect(claimedEnd('Every Winner, 1929–2026 | Ball IQ')).toBe(2026);
  });

  it('never prints an incoherent season token', () => {
    // "2025-26" is a season. "2026-26" is a typo that still resolves to the
    // right end year, which is exactly why the terminus check cannot see it.
    const bad = [];
    for (const L of LISTS) {
      for (const field of ['h1', 'title', 'description']) {
        for (const m of String(L[field]).matchAll(/\b(\d{4})\s*[-–]\s*(\d{2})\b/g)) {
          const start = Number(m[1]), end = Number(m[2]);
          if ((start + 1) % 100 !== end) bad.push(`${L.slug}.${field}: "${m[0]}" is not a season`);
        }
      }
    }
    expect(bad, `\n${bad.join('\n')}\n`).toEqual([]);
  });

  it('never advertises an older end than the table holds', () => {
    const stale = [];
    for (const L of LISTS) {
      const data = dataEnd(L);
      if (data === null) continue;
      for (const field of ['h1', 'title', 'description']) {
        const claim = claimedEnd(L[field]);
        if (claim !== null && claim < data) {
          stale.push(`${L.slug}.${field} says ${claim}, table ends ${data} — "${L[field]}"`);
        }
      }
    }
    expect(stale, `\n${stale.join('\n')}\n\nAppend a season to rows and the headline must move with it.`).toEqual([]);
  });
});
