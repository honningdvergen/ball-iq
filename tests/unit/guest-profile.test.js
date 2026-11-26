// The Profile tab for a player who is NOT signed in (25 Nov 2026; screens/ProfileScreen.jsx).
// Alex: "the sign in or profile tab has to make a btter impression for first timers", "i want them
// to know they will get that fifa card style thing that we have", "locked is WAY too big here,
// writing and lock"; on the last drawing: "good, build when ready please".
// The render itself is held by the three not-signed-in entries of i18n-screens.golden.json, and
// the signed-in Profile by the other Profile entries there, byte for byte. This file holds the
// rules a render cannot: that the change is only for that state, and that sign-in is untouched.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');
const PROFILE = read('src/screens/ProfileScreen.jsx');
const CSS = read('src/screens/guestProfile.css');
const APP = read('src/App.jsx');
const GOLDEN = JSON.parse(read('tests/unit/i18n-screens.golden.json'));
const EN = (await import('../../src/i18n/en.js')).default;
const ES = (await import('../../src/i18n/es.js')).default;

// LATER ON 25 Nov 2026 the signed-in Profile was built on the same kit (Alex, on its drawing: "Yes,
// build it"; tests/unit/profile-signed-in.test.js). So "only the not-signed-in state changed" is no
// longer true of the screen as a whole, and four checks below follow it: the strip's tiles are over
// every Profile; the phone column's lower blocks (Share, the scouting report) are a not-signed-in
// player's alone, each behind guestView; the kit's gp- classes are also drawn by the signed-in phone
// column, in its own marked blocks; and the screen has one more useState, declared last. What a
// not-signed-in player sees has not moved: their three golden entries are byte-identical.
describe('only the not-signed-in state changed', () => {
  it('one test decides it; the strip above the tab is tiled over every Profile', () => {
    expect(PROFILE).toContain('const guestView = !user || isGuest || isAnonUser;');
    // (Earlier on 26 Nov 2026 the History tab wore the strip's tiles too; it draws its own
    // on its title's row now, tests/unit/history-tab.test.js, so the class is the Profile's alone.)
    expect(APP).toContain('<div className={screen === "home" && tab === "profile" ? "hdr hdr-guest" : "hdr"}>');
    expect(read('src/app.css')).not.toMatch(/\.hdr\.hdr-guest/);
    expect(CSS).toContain('.hdr.hdr-guest .icon-btn{border:0;border-radius:14px;background:var(--s1);color:var(--t2);}');
  });

  it('every new branch in the screen is behind guestView', () => {
    // The lines that draw something new, or stop drawing something old.
    for (const line of [
      '{isActiveTab && !guestView && (stats?.gamesPlayed || 0) === 0 && !sampleDismissed && (() => {',
      'if (guestView && !hasPlayed) {',
      'avatar={guestView ? guestFace(96, pal.accent) :',
      '{guestView && (() => {',
      '{guestView && (stats?.totalAnswered || 0) >= MIN_RATED_ANSWERS && !recalSeen && (',
      '{guestView && (stats.gamesPlayed || 0) > 0 && (\n        <div className="profile-secondary-actions gp-quiet"',
      '{guestView && (stats.gamesPlayed || 0) > 0 && (\n        (() => {',
      '{(!guestView || xp > 0) && (() => {',
      '{(!guestView || earned.size > 0) && (',
      'if (guestView) return cardEl;',
    ]) expect(PROFILE, line).toContain(line);
    // And nothing new is drawn outside those: each gp- class in the markup sits in a guest branch,
    // or in one of the signed-in phone column's own blocks (its rows, its card parts, its screens).
    const uses = [...PROFILE.matchAll(/className=(?:"|\{`|\{[^}]*")[^>]*\bgp-[a-z-]+/g)].map((m) => m.index);
    expect(uses.length).toBeGreaterThan(12);
    const zones = [
      [PROFILE.indexOf('const guestFace = (size, accent) => ('), PROFILE.indexOf('const handleCropConfirm = async (blob) => {')],
      [PROFILE.indexOf('if (guestView && !hasPlayed) {'), PROFILE.indexOf('// ⚠️ ONE CARD, THREE SURFACES.')],
      [PROFILE.indexOf('{guestView && (() => {'), PROFILE.indexOf('{/* Two peer secondary actions.')],
      [PROFILE.indexOf('<div className="profile-secondary-actions gp-quiet"'), PROFILE.indexOf('<div className="profile-secondary-actions gp-quiet"') + 120],
      [PROFILE.indexOf('// ─── THE SIGNED-IN PROFILE ON A PHONE: ITS ROWS'), PROFILE.indexOf('// ─── PROFILE SCREEN ───')],
      [PROFILE.indexOf('const kitFace = ('), PROFILE.indexOf('const cardEl = (')],
      [PROFILE.indexOf('// ── THE SIGNED-IN PHONE COLUMN'), PROFILE.indexOf('  return (\n    <div className="tab-content profile-screen"')],
    ];
    for (const [a, b] of zones) expect(a > 0 && b > a).toBe(true);
    for (const i of uses) expect(zones.some(([a, b]) => i > a && i < b), PROFILE.slice(i, i + 60)).toBe(true);
  });

  it('the golden harness reads state by its position: the one new useState is the last', () => {
    const impl = PROFILE.slice(PROFILE.indexOf('function ProfileScreenImpl('), PROFILE.indexOf('export const ProfileScreen = React.memo(ProfileScreenImpl);'));
    const calls = [...impl.matchAll(/\buseState\(/g)].map((m) => m.index);
    expect(calls.length).toBe(11);
    // `sub` (the screen behind a row of the signed-in phone column) comes after the ten that were there.
    expect(impl.indexOf('const [sub, setSub] = useState(null);')).toBe(calls[10] - 'const [sub, setSub] = '.length);
    expect(impl.indexOf('const [selectedBadgeId, setSelectedBadgeId] = useState(null);')).toBe(calls[9] - 'const [selectedBadgeId, setSelectedBadgeId] = '.length);
  });

  it('the stylesheet touches nothing but that state', () => {
    const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
    const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => m[1].split(',')).map((s) => s.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(40);
    for (const s of selectors) expect(/^\.profile-screen \.gp-|^\.hdr\.hdr-guest\b/.test(s), s).toBe(true);
    expect(CSS, 'filled, not outlined').not.toMatch(/border:1(\.5)?px solid var\(--border/);
    expect(CSS, 'no glow').not.toMatch(/box-shadow:(?!inset |none)/);
  });

  it('a signed-in player\'s golden entries carry none of it outside the phone column: the wide window is as it was', () => {
    const signedIn = Object.keys(GOLDEN).filter((k) => k.startsWith('profile: ') && !/^profile: (guest|anonymous)/.test(k));
    expect(signedIn.length).toBe(14);
    for (const k of signedIn) {
      const g = GOLDEN[k];
      const a = g.indexOf('<div class="profile-mobile-identity">'), b = g.indexOf('<div class="profile-col-right">');
      expect(a > 0 && b > a, k).toBe(true);
      expect(/class="gp-|gp-quiet|hdr-guest|class="sp[ "-]/.test(g.slice(0, a) + g.slice(b)), k).toBe(false);
      expect(g.slice(a, b), k).not.toContain('gp-quiet');
    }
  });
});

describe('what a first-timer sees', () => {
  const first = GOLDEN['profile: guest, first visit (the example card)'];
  // The phone column: what a phone shows (a wide screen hides it and keeps its own cards).
  const phone = first.slice(first.indexOf('<div class="profile-mobile-identity">'), first.indexOf('<div class="profile-col-right">'));
  it('the card in gold, not yet unlocked, with one small padlock and one line', () => {
    expect(phone).toContain('<section class="gp-card">');
    expect(phone).toContain('<b>10 answers to unlock your card</b>');
    expect((phone.match(/lucide-lock/g) || []).length, 'one padlock').toBe(1);
    expect(phone).not.toMatch(/>Locked<|LOCKED|ANSWER 10 TO GET RATED/);
    expect(CSS, 'the padlock line is 15px, the size of a row title, not a headline').toMatch(/\.profile-screen \.gp-unlock b\{font-size:15px;/);
    expect(PROFILE).toContain('<Lock size={18} strokeWidth={2.3} aria-hidden="true" />');
  });
  it('none of what made it hectic', () => {
    expect(first).not.toContain('modal-overlay'); // the one-time EXAMPLE pop-up
    expect(phone).not.toContain('No stats yet');
    expect(phone).not.toContain('Saved on this phone only');
    expect(first).not.toContain('journey-section');
    expect(first).not.toContain('badges-section');
    expect(phone, 'the green default face').not.toContain('profile-avatar');
  });
  it('one solid green button, and it is the account', () => {
    expect((phone.match(/class="gp-cta"/g) || []).length).toBe(1);
    expect(phone).toContain('>Create free account</button>');
    expect(phone).not.toContain('card-action-primary');
    expect(CSS).toMatch(/\.profile-screen \.gp-cta\{[^}]*height:50px;[^}]*background:var\(--accent\);color:var\(--grn-ink\);/);
    expect(CSS, 'a player who has played keeps Share, as the quiet button').toContain('.profile-screen .gp-quiet .card-action-primary{background:var(--s1);color:var(--t1);-webkit-text-fill-color:var(--t1);box-shadow:none;}');
  });
});

describe('sign-in is the call it was', () => {
  it('the button and the "Sign in" in its line open the sheet the old row and pill opened', () => {
    expect(PROFILE).toContain("const openAccount = () => { try { openAuthPrompt?.(isAnonUser ? 'upgrade' : 'save'); } catch {} };");
    expect((PROFILE.match(/onClick=\{openAccount\}/g) || []).length).toBe(2);
    // A tap on the face still asks a guest to sign in, and still opens the photo menu for an account.
    expect(PROFILE).toContain("try { openAuthPrompt?.('save'); } catch { /* auth UI is optional here */ }");
    expect(PROFILE).toContain('<button type="button" className="gp-face" onClick={openAvatarPicker}');
  });
});

describe('the words', () => {
  it('the five new lines, in both languages', () => {
    const want = {
      'gp.yourCard': ['YOUR CARD', 'TU CARTA'],
      'gp.unlock_one': ['{n} answer to unlock your card', '{n} respuesta para desbloquear tu carta'],
      'gp.unlock_other': ['{n} answers to unlock your card', '{n} respuestas para desbloquear tu carta'],
      'gp.create': ['Create free account', 'Crea tu cuenta gratis'],
      'gp.keeps': ['Keeps your card on any phone', 'Tu carta, en cualquier móvil'],
    };
    for (const [k, [en, es]] of Object.entries(want)) { expect(EN[k], k).toBe(en); expect(ES[k], k).toBe(es); }
    for (const gone of ['pf.saveAria', 'pf.signInFree', 'pf.saveThis', 'pf.phoneOnly', 'pf.guestSub0', 'pf.guestSub1']) { expect(EN[gone], gone).toBeUndefined(); expect(ES[gone], gone).toBeUndefined(); }
  });
});
