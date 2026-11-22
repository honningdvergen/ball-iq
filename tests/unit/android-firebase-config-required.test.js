// 22 Nov 2026: the live Android app crashed on launch for every player who had
// allowed notifications.
//
// Versions 63 (1.8.6) to 69 were built in the release clone, which did not hold
// the git-ignored android/app/google-services.json. The Gradle file skipped the
// Firebase plugin without a word when the file was missing, so the app shipped
// with no Firebase configuration, and PushNotifications.register() (called on
// every launch once notifications are allowed) threw inside Capacitor's bridge
// and killed the process. Play's vitals: FirebaseApp.getInstance,
// IllegalStateException, about a hundred crashes, eleven players, 13 to 21 Nov.
// Sentry never saw it: the whole app dies before JavaScript can report.
//
// A release build without the file must be impossible. This pins the refusal.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const gradle = readFileSync(new URL('../../android/app/build.gradle', import.meta.url), 'utf8');

describe('an Android release cannot be built without its Firebase configuration', () => {
  it('the quiet skip is gone', () => {
    expect(gradle).not.toMatch(/catch\s*\(\s*Exception e\s*\)\s*\{\s*logger\.info\("google-services\.json not found/);
  });
  it('a release or bundle task without the file is refused with the reason', () => {
    expect(gradle).toContain("def hasServices = servicesJSON.exists() && servicesJSON.text.trim().length() > 0");
    expect(gradle).toMatch(/if \(wanted\.any \{ it\.contains\('release'\) \|\| it\.contains\('bundle'\) \}\) \{\s*throw new GradleException\("android\/app\/google-services\.json is missing/);
  });
  it('with the file the Firebase plugin is applied', () => {
    expect(gradle).toMatch(/if \(hasServices\) \{\s*apply plugin: 'com\.google\.gms\.google-services'/);
  });
});
