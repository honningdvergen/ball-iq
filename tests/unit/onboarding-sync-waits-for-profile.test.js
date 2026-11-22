// 22 Nov 2026: the onboarding sync wrote onboarded_at from the stand-in profile.
//
// useAuth shows a stand-in profile while the real row loads, and it has no
// onboarded_at. The sync in App.jsx took that as "never finished the intro"
// and wrote the date at once, often before the session token was ready, so
// the database refused it ("permission denied for table profiles", Sentry
// BALL-IQ-36 and -37, 15 events from 10 players, 21 Oct to 18 Nov). It also
// meant a write for accounts that had finished the intro long ago.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const auth = read('src/useAuth.jsx');
const app = read('src/App.jsx');

describe('the onboarding sync waits for the real profile', () => {
  it('the stand-in says it is one', () => {
    const fb = auth.slice(auth.indexOf('const fallbackProfile = {'), auth.indexOf('setProfile(fallbackProfile)'));
    expect(fb).toContain('_placeholder: true,');
  });
  it('the real row does not carry the mark', () => {
    const merged = auth.slice(auth.indexOf('const merged = {'), auth.indexOf('setProfile(merged)'));
    expect(merged).toContain('...profileData,');
    expect(merged).not.toContain('_placeholder');
    expect(merged).not.toContain('fallbackProfile');
  });
  it('the sync returns early on the stand-in, before anything is written', () => {
    const i = app.indexOf("tags: { area: 'onboarding-flag', site: 'local-to-profile' }");
    expect(i).toBeGreaterThan(0);
    const effect = app.slice(app.lastIndexOf('useEffect(() => {', i), i);
    expect(effect).toMatch(/if \(!authProfile \|\| authProfile\._placeholder \|\| !user\?\.id\) return;/);
    expect(effect.indexOf('authProfile._placeholder')).toBeLessThan(effect.indexOf(".update({ onboarded_at"));
  });
});

describe('a background warm-up that fails stays quiet', () => {
  it('every bare import() whose result is not used ends in .catch, never try/catch', () => {
    // A rejected import() escapes a try block; Sentry BALL-IQ-W was exactly that.
    expect(app).not.toMatch(/try \{ import\(/);
    expect(app).toContain("import('./screens/OnlineMultiplayer.jsx').catch(() => {");
    expect(app).toContain("import('./screens/ProfileScreen.jsx').catch(() => {");
  });
});
