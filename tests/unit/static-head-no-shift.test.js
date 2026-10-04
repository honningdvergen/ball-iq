import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CONFIG = readFileSync(fileURLToPath(new URL('../../vite.config.js', import.meta.url)), 'utf8');

/**
 * The build injects a static copy of the site header above #root so / and
 * /play paint a header before any JavaScript. It used to sit IN FLOW, so #root
 * started 57px down; React then committed an empty Suspense frame for the lazy
 * FrontDoor/GameRoot chunk, SiteHeader removed the static copy, and #root
 * jumped to 0. Lighthouse mobile scored that as CLS 0.069 on both pages
 * (2026-10-04). As a fixed overlay nothing underneath moves on the swap.
 */
describe('static site header does not shift #root', () => {
  it('is a fixed overlay, not an in-flow block', () => {
    expect(CONFIG).toContain('#biq-static-head{position:fixed;top:0;left:0;right:0;z-index:100}');
  });
});
