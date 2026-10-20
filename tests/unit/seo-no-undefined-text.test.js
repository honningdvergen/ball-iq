import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// A missing string in a page generator renders as the literal word "undefined".
// It shipped on 12 Portuguese club pages (the "same page in English" line read
// "undefined <a>undefined</a>") until a localisation review found it on
// 20 Oct 2026. This scans every generated page's visible markup. Skips when
// dist/ is absent (it runs after the build in npm run build).
const DIST = new URL('../../dist/', import.meta.url).pathname;
function pages(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'assets') pages(p, out); } else if (f === 'index.html') out.push(p);
  }
  return out;
}
// Text between tags, or an attribute value, that is exactly "undefined" or
// starts with "undefined " (scripts are stripped first: code may say undefined).
const BAD = /(>\s*undefined(\s|<))|((alt|title|content|aria-label)="undefined")/;

describe('no generated page shows the word "undefined"', () => {
  it.skipIf(!existsSync(DIST))('every dist page', () => {
    const hits = [];
    for (const p of pages(DIST)) {
      const html = readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
      if (BAD.test(html)) hits.push(p.replace(DIST, ''));
    }
    expect(hits).toEqual([]);
  });
});
