// 24 Nov 2026. capacitor.config.json gained ios.includePlugins so that
// @sentry/capacitor (Swift Package Manager only since 4.4.0) stays out of an
// iOS project that is still on CocoaPods, where `pod install` stops at
// "No podspec found for SentryCapacitor".
//
// The list is an ALLOWLIST. `cap sync ios` installs only what it names, so a
// Capacitor plugin added to package.json and not to the list builds green and
// ships an iOS app without it: the call rejects at runtime, on a device, with
// nothing in the build to say why. This keeps the two in step.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const cap = JSON.parse(read('capacitor.config.json'));

// What is left out on purpose, and why. Nothing else may be missing.
const NOT_ON_IOS = ['@sentry/capacitor'];

// A dependency is a Capacitor plugin when its own package.json says so.
const plugins = Object.keys(pkg.dependencies).filter((name) => {
  const p = join(ROOT, 'node_modules', name, 'package.json');
  if (!existsSync(p)) return false;
  return !!JSON.parse(readFileSync(p, 'utf8')).capacitor;
});

describe('the iOS plugin allowlist names every plugin the app uses', () => {
  it('finds the plugins', () => {
    expect(plugins.length).toBeGreaterThan(10);
    expect(plugins).toContain('@capacitor/push-notifications');
    expect(plugins).toContain('@sentry/capacitor');
  });

  it('every Capacitor plugin in package.json is on the list, except the one that cannot build there', () => {
    const list = cap.ios.includePlugins;
    const missing = plugins.filter((p) => !list.includes(p) && !NOT_ON_IOS.includes(p));
    expect(missing).toEqual([]);
  });

  it('the list names nothing that is not installed, and not the plugin it exists to leave out', () => {
    const list = cap.ios.includePlugins;
    expect(list.filter((p) => !plugins.includes(p))).toEqual([]);
    expect(list.filter((p) => NOT_ON_IOS.includes(p))).toEqual([]);
  });

  it('Android is not narrowed: it takes every plugin, the native crash reporter included', () => {
    expect(cap.android.includePlugins).toBeUndefined();
    expect(cap.includePlugins).toBeUndefined();
    const settings = read('android/capacitor.settings.gradle');
    expect(settings).toContain("include ':sentry-capacitor'");
  });

  it('the app starts the native reporter only where the plugin is in the binary', () => {
    const main = read('src/main.jsx');
    expect(main).toContain("Capacitor.isPluginAvailable('SentryCapacitor') === true");
    expect(main).toContain("import('@sentry/capacitor')");
    // never a static import: 20 KB on the website's Home for code only a shell can run
    expect(main).not.toMatch(/^import .*from '@sentry\/capacitor'/m);
  });
});
