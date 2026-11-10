import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import EN from '../../src/i18n/en.js';

/**
 * Settings, the account card for a guest SESSION (10 Nov 2026, simulator walk).
 *
 * Starting a league makes an anonymous Supabase session. Settings then read
 * "Signed in as player_c112ef11" with a red Sign out row whose confirm says
 * "your progress stays synced, sign back in any time". None of it is true for
 * a session with no email: signing out loses the league and the points for
 * good. An anonymous session gets the guest card and a way to save it instead.
 */
const SRC = readFileSync(fileURLToPath(new URL('../../src/screens/SettingsScreen.jsx', import.meta.url)), 'utf8');

describe('Settings account card', () => {
  it('reads the anonymous flag from auth', () => {
    expect(SRC).toMatch(/const \{[^}]*\bisAnonUser\b[^}]*\} = useAuth\(\)/);
  });
  it('never shows "Signed in as" or Sign out to an anonymous session', () => {
    expect(SRC).toMatch(/\{user && profile && !isAnonUser \? \(/);
    expect(SRC).toMatch(/\) : user && !isAnonUser \? \(/);
    // both Sign out rows sit inside those two branches, before the guest card
    const guestAt = SRC.indexOf('t("st.guest")');
    const lastSignOutRow = SRC.lastIndexOf('setConfirmSignOut(true)');
    expect(guestAt).toBeGreaterThan(0);
    expect(lastSignOutRow).toBeLessThan(guestAt);
  });
  it('offers the anonymous session a way to save itself, in words that exist', () => {
    expect(SRC).toContain(`openAuthPrompt?.(isAnonUser ? 'upgrade' : 'save')`);
    expect(SRC).toContain('t(isAnonUser ? "pf.saveAcct" : "st.signIn")');
    expect(SRC).toContain('t(isAnonUser ? "pf.anonSub" : "st.guestSub")');
    for (const k of ['pf.saveAcct', 'pf.anonSub', 'st.guest', 'st.signIn', 'st.guestSub']) expect(EN[k], k).toBeTruthy();
  });
});
