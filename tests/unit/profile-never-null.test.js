// 22 Nov 2026: deleting an account crashed the whole app.
//
// onAccountDeleted did setProfileState(null). The next render of the app shell
// ran the share hook, whose dependency list read profile.name, and React threw
// "Cannot read properties of null (reading 'name')" at the root: every phone,
// every time, straight after "Delete account" (Sentry BALL-IQ-3T, 19 and 20
// Nov, on the live 1.8.6). A second way in: the re-read of the saved profile
// after sign-in passed JSON.parse's answer straight to state, and "null" is
// valid JSON.
//
// The app shell cannot be mounted in a unit test, so these read the source:
// the profile state is only ever given something that passed isProfile, and
// the hook that crashed no longer assumes it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const app = read('src/App.jsx');
const share = read('src/hooks/useShare.js');

describe('the local profile is always an object', () => {
  it('one definition of empty and one test for a profile', () => {
    expect(app).toContain('const emptyProfile = () => ({ name: "", avatar: "⚽" });');
    expect(app).toContain('const isProfile = (p) => !!p && typeof p === "object" && !Array.isArray(p);');
  });
  it('the state is never set to null, undefined or raw parsed JSON', () => {
    const calls = [...app.matchAll(/setProfileState\(([^\n]*)/g)].map((m) => m[1].trim());
    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const c of calls) {
      expect(c, c).not.toMatch(/^null|^undefined|^JSON\.parse/);
    }
    // The three ways in: the setter, the re-read after sign-in, account deletion.
    expect(app).toContain('const next = isProfile(made) ? made : emptyProfile();');
    expect(app).toContain('if (raw !== null) { const p = JSON.parse(raw); if (isProfile(p)) setProfileState(p); }');
    expect(app).toMatch(/setProfileState\(emptyProfile\(\)\);\s*\n\s*showToast\(tl\("ts\.deleted"\)\);/);
  });
  it('first load takes only an object from storage', () => {
    expect(app).toContain('if (raw) { const p = JSON.parse(raw); if (isProfile(p)) return p; }');
  });
});

describe('the share hook does not assume a profile', () => {
  it('no bare profile.name or profile.avatar is left in it', () => {
    const bare = [...share.matchAll(/(?<![\w?.])profile\.(name|avatar)/g)].length;
    expect(bare).toBe(0);
    expect(share).toMatch(/profile\?\.name, profile\?\.avatar/);
  });
});
