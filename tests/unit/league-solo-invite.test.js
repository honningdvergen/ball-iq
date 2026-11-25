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
    expect(CARD).toMatch(/\{rowLine\(t\("lg\.soloLine"\)\)\}/); // one grey line, as pieces (lib/rowLine.jsx)
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
    // 25 Nov 2026: the Multiplayer tab carries the same row, so the count names where the card
    // stands. Home passes nothing and still counts as "home".
    expect(CARD).toContain('export default function LeagueHomeCard({ onOpen, onStart, wait = null, from = "home" }) {');
    expect(CARD).toContain('loopEvent("league-invite-share", { via, from });');
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

// 1.8.7 Android walk, 16 Nov 2026: after making a league from Home the row
// still said "Mates' league / Start" until the app restarted. The card
// fetched once on mount and nothing told it a league now existed, so the
// invite pill could never appear in the session that made the league.
describe('Home learns about a league made, joined or left in this session', () => {
  const LIB = read('lib/leagues.js');
  const HOME = read('screens/HomeScreen.jsx');
  const fn = (name) => {
    const from = LIB.indexOf(`export async function ${name}(`);
    expect(from).toBeGreaterThan(-1);
    const next = LIB.indexOf('\nexport ', from + 1);
    return LIB.slice(from, next === -1 ? undefined : next);
  };
  it('create, join and leave each announce the change, only after they succeeded', () => {
    expect(LIB).toContain("window.dispatchEvent(new CustomEvent('biq:leagues-changed'))");
    for (const name of ['createLeague', 'joinLeague']) {
      const body = fn(name);
      expect(body.indexOf('announceLeaguesChanged();')).toBeGreaterThan(body.indexOf('if (err) return { error: err };'));
    }
    expect(fn('leaveLeague')).toContain('if (!r.error) { forgetLeft(id); announceLeaguesChanged(); }');
    // A guest's leagues moving to an account at sign-in is the same change.
    expect(fn('redeemLeagueClaim')).toContain('if (moved > 0) { setLeagueMember(true); announceLeaguesChanged(); }');
    // Never before the early return on an error.
    for (const name of ['createLeague', 'joinLeague']) expect(fn(name).split('announceLeaguesChanged();').length).toBe(2);
  });
  it('the card fetches again on that event and stops listening when it goes', () => {
    expect(CARD).toContain('window.addEventListener("biq:leagues-changed", load);');
    expect(CARD).toContain('window.removeEventListener("biq:leagues-changed", load);');
  });
  it('only the newest fetch answers', () => {
    expect(CARD).toContain('const load = () => { const mine = ++asked; return getMyLeagues().then((l) => {');
    expect(CARD).toContain('if (!alive || mine !== asked) return;');
  });
  it('a refetch that fails keeps the card that is on screen', () => {
    expect(CARD).toContain('setList((was) => (l == null && was != null ? was : l));');
  });
  it('Home draws again, so the way in gives place to the card', () => {
    expect(HOME).toContain('window.addEventListener("biq:leagues-changed", leaguesChanged);');
    expect(HOME).toContain('window.removeEventListener("biq:leagues-changed", leaguesChanged);');
    // Home must not pull the league library into its eager graph for this.
    expect(HOME).not.toMatch(/from ["']\.\.\/lib\/leagues\.js["']/);
  });
});
