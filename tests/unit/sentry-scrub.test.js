// 24 Nov 2026. A sign-in link never reaches a crash report.
// Supabase returns the session in a URL (#access_token=…&refresh_token=…, or ?code=… with PKCE).
// The native sign-in listener logged that URL with console.log, Sentry keeps console arguments as
// breadcrumbs, and the old scrub only looked at three named fields. With native crash reporting a
// stored breadcrumb is copied to the Android SDK and sent without passing beforeSend, so the
// cleaning has to happen when the breadcrumb is stored.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { scrubText, scrubUrl, scrubDeep, scrubBreadcrumb, scrubEvent } from '../../src/lib/sentryScrub.js';

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const CALLBACK = `app.balliq://auth/callback#access_token=${JWT}&expires_in=3600&refresh_token=v4xq2abcd1234&token_type=bearer`;

describe('scrubText and scrubUrl', () => {
  it('redacts token parameters and any JWT, and keeps the rest readable', () => {
    const out = scrubText(`opened ${CALLBACK}`);
    expect(out).not.toContain(JWT);
    expect(out).not.toContain('v4xq2abcd1234');
    expect(out).toContain('access_token=REDACTED');
    expect(out).toContain('refresh_token=REDACTED');
    expect(out).toContain('expires_in=3600');
  });
  it('redacts a PKCE code and an apikey in a query string', () => {
    expect(scrubText('https://balliq.app/auth?code=abc123def&next=/play')).toBe('https://balliq.app/auth?code=REDACTED&next=/play');
    expect(scrubText(`https://x.supabase.co/rest/v1/scores?apikey=${JWT}&select=*`)).toBe('https://x.supabase.co/rest/v1/scores?apikey=REDACTED&select=*');
  });
  it('catches the shapes the first version missed', () => {
    expect(scrubText('access_token=abc123&refresh_token=def456')).toBe('access_token=REDACTED&refresh_token=REDACTED');
    expect(scrubText('https://balliq.app/auth/confirm?token_hash=pkce_9f8e7d&type=magiclink')).toBe('https://balliq.app/auth/confirm?token_hash=REDACTED&type=magiclink');
    expect(scrubText('{"refresh_token":"v4xq2abcd1234","expires_in":3600}')).toBe('{"refresh_token":"REDACTED","expires_in":3600}');
    expect(scrubText('session { refresh_token: v4xq2abcd1234, user: x }')).toBe('session { refresh_token: REDACTED, user: x }');
    expect(scrubText('?code_verifier=zzz999')).toBe('?code_verifier=REDACTED');
  });
  it('does not touch ordinary text that merely says code= or token', () => {
    expect(scrubText('PostgREST error code=42501 for upsert')).toBe('PostgREST error code=42501 for upsert');
    expect(scrubText('push token refreshed')).toBe('push token refreshed');
  });
  it('a URL loses its fragment whole', () => {
    expect(scrubUrl(CALLBACK)).toBe('app.balliq://auth/callback');
    expect(scrubUrl('https://balliq.app/c/AB12?token=zzz#x')).toBe('https://balliq.app/c/AB12?token=REDACTED');
  });
  it('passes non-strings through', () => {
    expect(scrubText(undefined)).toBe(undefined);
    expect(scrubUrl(null)).toBe(null);
    expect(scrubText(42)).toBe(42);
  });
});

describe('scrubDeep', () => {
  it('cleans nested strings and secret-named keys WITHOUT changing what it was given', () => {
    const logged = { url: CALLBACK, nested: [{ headers: { Authorization: `Bearer ${JWT}`, apikey: 'k', Accept: 'json' } }] };
    const before = JSON.stringify(logged);
    const out = scrubDeep(logged);
    expect(JSON.stringify(logged)).toBe(before);
    expect(JSON.stringify(out)).not.toContain(JWT);
    expect(out.nested[0].headers).toEqual({ Authorization: 'REDACTED', apikey: 'REDACTED', Accept: 'json' });
  });
  it('fails closed: what it cannot walk becomes cleaned text or a placeholder, never the original', () => {
    const a = { name: 'a' }; a.self = a;
    const outA = scrubDeep(a);
    expect(outA.self).toBe(outA); // the cycle points at the COPY
    const shared = { url: CALLBACK };
    const twice = scrubDeep({ first: shared, second: shared });
    expect(twice.second).toBe(twice.first);
    expect(JSON.stringify(twice)).not.toContain(JWT);
    const err = new Error(`Load failed ${CALLBACK}`);
    const out = scrubDeep({ err, link: new URL(`https://balliq.app/auth?code=abc123`) });
    expect(typeof out.err).toBe('string');
    expect(out.err).not.toContain(JWT);
    expect(out.link).toBe('https://balliq.app/auth?code=REDACTED');
    let deep = { url: CALLBACK }; for (let i = 0; i < 8; i++) deep = { deep };
    expect(JSON.stringify(scrubDeep(deep))).not.toContain(JWT);
    expect(JSON.stringify(scrubDeep(deep))).toContain('[deep]');
    const unreadable = new (class { toString() { throw new Error('no'); } })();
    expect(scrubDeep({ unreadable }).unreadable).toBe('[unreadable]');
  });
  it('caps how much of a big value it copies', () => {
    const out = scrubDeep(Array.from({ length: 500 }, (_, i) => i));
    expect(out.length).toBe(101);
    expect(out[100]).toBe('[400 more]');
  });
  it('redacts secret-named keys in either spelling', () => {
    expect(scrubDeep({ refreshToken: 'a', accessToken: 'b', identityToken: 'c', authorizationCode: 'd', token_hash: 'e', email: 'f', username: 'jo' }))
      .toEqual({ refreshToken: 'REDACTED', accessToken: 'REDACTED', identityToken: 'REDACTED', authorizationCode: 'REDACTED', token_hash: 'REDACTED', email: 'REDACTED', username: 'jo' });
  });
});

describe('scrubBreadcrumb', () => {
  it('the real case: the console breadcrumb of the sign-in listener', () => {
    const arg = { url: CALLBACK };
    const bc = { category: 'console', level: 'log', message: `[OAuth] appUrlOpen fired ${CALLBACK}`, data: { arguments: ['[OAuth] appUrlOpen fired', arg], logger: 'console' } };
    const out = scrubBreadcrumb(bc);
    expect(JSON.stringify(out)).not.toContain(JWT);
    expect(JSON.stringify(out)).not.toContain('v4xq2abcd1234');
    expect(out.data.logger).toBe('console');
    expect(arg.url).toBe(CALLBACK); // the app's own object is untouched
    expect(bc.data.arguments[1]).toBe(arg);
  });
  it('navigation and fetch breadcrumbs keep working as before', () => {
    const nav = scrubBreadcrumb({ category: 'navigation', data: { from: '/play', to: `/auth#access_token=${JWT}` } });
    expect(nav.data).toEqual({ from: '/play', to: '/auth' });
    const fetchBc = scrubBreadcrumb({ category: 'fetch', data: { url: `https://x.supabase.co/rest/v1/scores?apikey=${JWT}`, method: 'GET', status_code: 200 } });
    expect(fetchBc.data).toEqual({ url: 'https://x.supabase.co/rest/v1/scores?apikey=REDACTED', method: 'GET', status_code: 200 });
  });
  it('a breadcrumb with nothing to clean comes back equal', () => {
    const bc = { category: 'ui.click', message: 'button.t7s-cta', timestamp: 1 };
    expect(scrubBreadcrumb(bc)).toEqual(bc);
  });
});

describe('scrubEvent', () => {
  it('cleans the URL, the breadcrumbs, the exception text and the extras', () => {
    const ev = scrubEvent({
      request: { url: CALLBACK },
      message: `failed at ${CALLBACK}`,
      exception: { values: [{ type: 'Error', value: `Load failed https://x.supabase.co/auth/v1/token?refresh_token=abcd1234` }] },
      breadcrumbs: [{ category: 'console', data: { arguments: [{ url: CALLBACK }] } }],
      extra: { supabase: { hint: `bearer ${JWT}` } },
    });
    const s = JSON.stringify(ev);
    expect(s).not.toContain(JWT);
    expect(s).not.toContain('abcd1234');
    expect(ev.request.url).toBe('app.balliq://auth/callback');
  });
});

describe('scrubEvent keeps the report', () => {
  it('a part it cannot clean is removed, the exception stays', () => {
    const bad = {}; Object.defineProperty(bad, 'boom', { enumerable: true, get() { throw new Error('getter'); } });
    const ev = scrubEvent({ exception: { values: [{ type: 'Error', value: 'real bug' }] }, extra: bad, breadcrumbs: [{ message: 'ok' }] });
    expect(ev.extra).toBeUndefined();
    expect(ev.exception.values[0].value).toBe('real bug');
    expect(ev.breadcrumbs).toEqual([{ message: 'ok' }]);
  });
  it('cleans a transaction: request headers and span descriptions', () => {
    const ev = scrubEvent({ type: 'transaction', request: { url: 'https://balliq.app/play', headers: { Referer: CALLBACK } }, spans: [{ description: `GET https://x.supabase.co/auth/v1/verify?token_hash=abc&type=magiclink`, data: { url: CALLBACK } }] });
    const s = JSON.stringify(ev);
    expect(s).not.toContain(JWT);
    expect(s).not.toContain('token_hash=abc');
  });
});

describe('where it is wired', () => {
  const main = readFileSync(new URL('../../src/main.jsx', import.meta.url), 'utf8');
  const auth = readFileSync(new URL('../../src/useAuth.jsx', import.meta.url), 'utf8');
  it('main.jsx cleans breadcrumbs when they are stored, and the event again when it is sent', () => {
    expect(main).toMatch(/beforeBreadcrumb\(breadcrumb\)\s*\{\s*try \{ return scrubBreadcrumb\(breadcrumb\) \} catch \{ return null \}/);
    expect(main).toMatch(/beforeSend\(event, hint\) \{[\s\S]*?return scrubEvent\(event\)\s*\},/);
    expect(main).toMatch(/beforeSendTransaction\(event\) \{\s*return scrubEvent\(event\)\s*\}/);
  });
  it('the sign-in listener never logs a whole URL', () => {
    expect(auth).not.toMatch(/console\.log\([^\n]*\{\s*url\s*\}\)/);
    expect(auth).not.toMatch(/console\.log\([^\n]*url:\s*(r\.url|data\?\.url|url)\s*[,}]/);
  });
});
