// 25 Nov 2026: crashes from the phone apps could not be read.
//
// Every Sentry event from a native build said "frames have no debug ID":
// `qh (GameRoot-rI6VOHGA.js:94:2566)` and nothing more (BALL-IQ-3T, -38, -36).
// vite.config.js switched the Sentry plugin OFF whenever SENTRY_AUTH_TOKEN was
// missing, and the apps are built on a Mac whose shell has none: no debug ID
// in the chunks, no map uploaded. The website was fine, because Vercel has the
// token.
//
// The plugin now runs in every build. Without a token it stamps the debug IDs
// and skips the upload; it never fails the build and never talks to Sentry.
// The Home JS budget used to ASSUME which machines had the IDs; it now reads
// them from the build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { sentryCharge, hasDebugId, hasSentrySdk, SENTRY_SDK_KB, SENTRY_DEBUG_ID_KB } from '../../scripts/lib/home-budget-sentry.mjs';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

describe('the Sentry plugin stamps debug IDs in every build', () => {
  const config = read('vite.config.js');
  it('a missing token no longer switches the plugin off for a build', () => {
    expect(config).not.toMatch(/disable:\s*!process\.env\.SENTRY_AUTH_TOKEN/);
    expect(config).toMatch(/disable:\s*command !== 'build' && !process\.env\.SENTRY_AUTH_TOKEN/);
  });
  it('a build with no token sends the plugin\'s own telemetry nowhere', () => {
    expect(config).toMatch(/telemetry:\s*!!process\.env\.SENTRY_AUTH_TOKEN/);
  });
  it('an upload that fails still cannot fail the build', () => {
    expect(config).toMatch(/errorHandler\(err\)\s*\{\s*console\.warn/);
  });
});

describe('the Home budget reads Sentry\'s share from the build', () => {
  it('knows the snippet the installed plugin stamps (an upgrade that changes it fails here, not in the gate)', () => {
    // The plugin's own generator, found through the plugin so hoisting cannot hide it.
    const viaPlugin = createRequire(createRequire(import.meta.url).resolve('@sentry/vite-plugin'));
    const { getDebugIdSnippet } = viaPlugin('@sentry/bundler-plugin-core');
    expect(hasDebugId(getDebugIdSnippet('0a1b2c3d-1111-4222-8333-444455556666'))).toBe(true);
    expect(hasDebugId('const a=1;export{a};')).toBe(false);
  });
  it('finds the SDK by the DSN host', () => {
    expect(hasSentrySdk('dsn:"https://k@o1.ingest.de.sentry.io/2"')).toBe(true);
    expect(hasSentrySdk('nothing here')).toBe(false);
  });
  it('charges nothing when the SDK and the IDs are both in the bytes (Vercel, and a Mac with the DSN)', () => {
    expect(sentryCharge({ dsnInEnv: true, sdkInBuild: true, debugIdsInBuild: true }).kb).toBe(0);
    expect(sentryCharge({ dsnInEnv: false, sdkInBuild: true, debugIdsInBuild: true }).kb).toBe(0);
  });
  it('charges the SDK alone for a stamped build without a DSN (CI)', () => {
    expect(sentryCharge({ dsnInEnv: false, sdkInBuild: false, debugIdsInBuild: true }).kb).toBe(SENTRY_SDK_KB);
  });
  it('keeps the old sums for a build that was not stamped: 6 with the SDK, 71 without', () => {
    expect(sentryCharge({ dsnInEnv: false, sdkInBuild: true, debugIdsInBuild: false }).kb).toBe(SENTRY_DEBUG_ID_KB);
    expect(sentryCharge({ dsnInEnv: false, sdkInBuild: false, debugIdsInBuild: false }).kb).toBe(71);
  });
  it('the gate uses it, and no longer assumes the IDs from the machine', () => {
    const gate = read('scripts/audit-home-budget.mjs');
    expect(gate).toMatch(/sentryCharge\(\{/);
    expect(gate).not.toMatch(/SENTRY_EAGER_KB\s*=/);
  });
});
