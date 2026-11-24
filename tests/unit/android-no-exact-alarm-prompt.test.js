// 24 Nov 2026, the move from Capacitor 6 to 8.
//
// @capacitor/local-notifications 8.3 made an EXACT alarm the default for every
// scheduled notification on Android. On Android 12 and later, schedule() then
// answers a missing exact-alarm permission by opening the system's "Alarms &
// reminders" settings screen (LocalNotificationsPlugin.kt: honorExact, then
// ACTION_REQUEST_SCHEDULE_EXACT_ALARM). Android 14 denies that permission to a
// new install, and the reminder window is rescheduled on every app open. One
// notification scheduled without `isExactNotification: false` would therefore
// throw every Android player out of the app into Settings at launch.
//
// Read from the plugin's source, not seen on a device: the upgrade was
// compiled, not run. This pins the two halves of the answer so that a new
// reminder, or a tidy-up, cannot quietly bring the prompt back.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const NOTIF = read('src/lib/notifications.js');
const MANIFEST = read('android/app/src/main/AndroidManifest.xml');

describe('scheduling a reminder never opens Android\'s "Alarms & reminders" settings', () => {
  it('every scheduled notification is marked inexact', () => {
    const scheduled = NOTIF.match(/schedule: \{[^}]*\}/g) || [];
    const inexact = NOTIF.match(/schedule: \{[^}]*\}, isExactNotification: INEXACT,/g) || [];
    expect(scheduled.length, 'no scheduled notification was found: the shape moved, re-read this test').toBeGreaterThan(0);
    expect(inexact.length, 'a notification is scheduled without isExactNotification: false').toBe(scheduled.length);
    expect(NOTIF).toMatch(/^const INEXACT = false;$/m);
  });

  it('this file is the only place a local notification is scheduled', () => {
    // A second caller would need the same flag; make it come through here.
    for (const f of ['src/App.jsx', 'src/hooks/useLocalNotifications.js', 'src/lib/push.js', 'src/screens/SettingsScreen.jsx']) {
      expect(read(f), `${f} schedules a local notification itself`).not.toMatch(/LocalNotifications\.schedule\(/);
    }
  });

  it('the exact-alarm permission the plugin brings is stripped from the manifest', () => {
    expect(MANIFEST).toContain('xmlns:tools="http://schemas.android.com/tools"');
    expect(MANIFEST).toMatch(/<uses-permission android:name="android\.permission\.SCHEDULE_EXACT_ALARM" tools:node="remove" \/>/);
  });
});
