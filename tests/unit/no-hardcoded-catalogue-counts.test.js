// ⚠️ A NUMBER A HUMAN TYPES STOPS BEING TRUE.
//
// "This is one set from a bank of thousands of questions spanning 72 clubs"
// shipped on 149 club pages while the bank had grown to 99 — we understated
// ourselves by 27 clubs to every reader for months. The same literal 72 sat on
// /partners/ twice, which is the page that pitches our catalogue to publishers,
// so the one page whose job is to make us look worth embedding was the one
// quoting the smallest number.
//
// Nothing caught it: it is not a broken link, a bad title, a layout fault or an
// invalid schema. It is prose that was true in July. Only counting it does.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

// Comments legitimately quote historical figures ("71 of 72 clubs were capped"),
// so they are not prose and must not be scanned.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('catalogue counts are derived, not typed', () => {
  const gen = stripComments(read('scripts/gen-seo-pages.mjs'));

  it('no literal club/quiz count survives in generator prose', () => {
    const hits = [...gen.matchAll(/\b(\d{2,4})\s+(clubs|club quizzes|quizzes|leagues)\b/g)]
      .map((m) => m[0]);
    expect(hits, `hardcoded catalogue counts: ${hits.join(', ')}`).toEqual([]);
  });

  it('the two that actually shipped wrong are derived', () => {
    expect(gen, 'the club-page editorial line must count the bank')
      .toContain('spanning ${BANK_CLUB_COUNT} clubs');
    expect(gen, '/partners/ must count the catalogue, not quote July')
      .toContain('carries ${CLUBS.length} club quizzes');
  });

  it('catches the exact regression this was written for', () => {
    expect([...stripComments('<p>spanning 72 clubs</p>').matchAll(/\b(\d{2,4})\s+(clubs)\b/g)].length)
      .toBe(1);
  });
});
