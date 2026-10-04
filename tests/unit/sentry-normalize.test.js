import { describe, it, expect } from 'vitest';
import { normalizeSupabaseError, isSupabaseErrorObject } from '../../src/lib/sentryNormalize.js';

const synthetic = () => ({
  exception: { values: [{ type: 'Error', value: 'Object captured as exception with keys: code, details, hint, message' }] },
  tags: { area: 'daily-sync' },
});

describe('normalizeSupabaseError', () => {
  it('drops offline failures (BALL-IQ-1Y real payload)', () => {
    const oe = { code: '', details: '@capacitor://localhost/assets/main.js:19:6714', hint: '', message: 'TypeError: Load failed' };
    expect(normalizeSupabaseError(synthetic(), { originalException: oe })).toBeNull();
  });
  it('gives a real PostgREST error a readable title and per-site fingerprint', () => {
    const oe = { code: '42501', details: null, hint: null, message: 'permission denied for function upsert_daily_score' };
    const ev = normalizeSupabaseError(synthetic(), { originalException: oe });
    expect(ev.exception.values[0]).toEqual({ type: 'SupabaseError', value: '42501: permission denied for function upsert_daily_score' });
    expect(ev.fingerprint).toEqual(['supabase-error', 'daily-sync', '42501']);
    expect(ev.extra.supabase.code).toBe('42501');
  });
  it('leaves real Error instances alone', () => {
    const err = new Error('boom'); err.code = 'X';
    const ev = synthetic();
    expect(normalizeSupabaseError(ev, { originalException: err })).toBe(ev);
    expect(isSupabaseErrorObject(err)).toBe(false);
  });
  it('passes events with no hint through', () => {
    const ev = synthetic();
    expect(normalizeSupabaseError(ev, undefined)).toBe(ev);
  });
});
