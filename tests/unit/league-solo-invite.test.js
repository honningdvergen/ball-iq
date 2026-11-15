// 15 Nov 2026: a league with nobody else in it asks its owner for a mate.
// In the first three days of leagues in the installed apps 14 were created,
// 12 still had one member, and two invites were sent in all.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
const CARD = read('components/LeagueHomeCard.jsx');
const CSS = read('screens/league.css');

describe('the Home card for a league of one', () => {
  it('is its own card: says nobody else is in, and carries the invite', () => {
    expect(CARD).toMatch(/const solo = \(x\) => x\.members === 1 && !x\.is_final;/);
    expect(CARD).toMatch(/if \(solo\(l\)\) \{/);
    expect(CARD).toMatch(/className="lg-solo" role="group"/);
    expect(CARD).toMatch(/\{t\("lg\.soloLine"\)\}/);
    expect(CARD).toMatch(/className="lg-solo-invite" onClick=\{invite\}>\{t\(copied \? "lg\.linkCopied" : "lg\.soloInvite"\)\}/);
  });
  it('the name still opens the table, as the whole card does for a real league', () => {
    expect(CARD).toMatch(/className="lg-solo-open" onClick=\{\(\) => onOpen\?\.\(l\.id\)\}/);
  });
  it('sends the same invite the table sends, and counts it only when it went', () => {
    expect(CARD).toContain('via = await shareInvite(inviteShareText(l.name, url));');
    expect(CARD).toContain('if (!via) return;');
    // One sheet at a time.
    expect(CARD).toContain('if (!url || sharing.current) return;');
    expect(CARD).toContain('loopEvent("league-invite-share", { via, from: "home" });');
  });
  it('a league with mates is never hidden behind a new league of one', () => {
    expect(CARD).toContain('const l = list.find((x) => !solo(x)) ?? list[0];');
  });
  it('a cancelled share sheet is not a copy: nothing is claimed', () => {
    expect(CARD).toMatch(/if \(e && \(e\.name === "AbortError" \|\| \/cancel\/i\.test\(e\.message \|\| ""\)\)\) return null;/);
  });
  it('the pill is tinted, never solid: Home keeps one solid button', () => {
    expect(CARD).not.toMatch(/lg-solid/);
    expect(CSS).toMatch(/\.lg-solo-invite\{[^}]*background:rgba\(88,204,2,0\.12\)/);
    expect(CSS).toMatch(/\.lg-solo-invite\{[^}]*min-height:44px/);
  });
});
