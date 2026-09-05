import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * Alex, 2026-09-05, on seeing /play in a browser: "why should we have another
 * one that just copies the app?" The website is the home. A browser visitor
 * who opens BARE /play is sent to /; the shell stays only for what the site
 * does not have (?game= runners, ?tab= account/rooms, deep links) and for
 * installed PWAs and native, which never see the website.
 */
describe('the /play home is retired for browser visitors', () => {
  it('main.jsx redirects bare /play to / in a browser, and only there', () => {
    const m = read('src/main.jsx');
    expect(m).toMatch(/const _barePlay = _isBrowser && !_hasHandoff && \/\^\\\/play\\\/\?\$\/\.test\(_path\) && !_search && !_hash/);
    expect(m).toContain("window.location.replace('/')");
    expect(m).toContain('if (!showMarketing && !_barePlay) loadGameRoot()');
  });
  it('the shell has a ?tab= door and both headers use it for Sign in', () => {
    expect(read('src/App.jsx')).toContain('const tabSlug = (sp.get("tab") || "").toLowerCase();');
    expect(read('src/marketing/SiteHeader.jsx')).toContain("const PLAY = '/play?tab=profile';");
    const shell = read('scripts/seo/shell.mjs');
    expect(shell).not.toMatch(/href="\$\{b\}\/play"/);
    expect((shell.match(/\/play\?tab=profile/g) || []).length).toBe(2);
  });
  it('the short daily paths go to the pages, not the shell', () => {
    const v = read('vercel.json');
    expect(v).not.toContain('"/play?game=trail"');
    expect(v).not.toContain('"/play?game=mystery"');
  });
  it('the e2e suite opens the shell explicitly', () => {
    const dir = fileURLToPath(new URL('../e2e/', import.meta.url));
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.spec.js'))) {
      expect(read(`tests/e2e/${f}`), f).not.toMatch(/goto\(['"]\/play['"]\)/);
    }
  });
});
