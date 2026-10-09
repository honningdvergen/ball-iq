// One reminder a day, not two (found 9 Oct 2026: two banners on Alex's phone at
// 13:00, one from the phone's own schedule and one pushed by the server).
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { getReminderHour, noteCompletionHour, DEFAULT_REMINDER_HOUR } from '../../src/lib/playHour.js';

const read = (rel) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');

describe('the server keeps what a phone told it when the push token is registered again', () => {
  const MIG = read('supabase/migrations/v2_7_register_keeps_reminder_hour.sql');
  const body = MIG.slice(MIG.indexOf('create or replace function public.register_device_token'));

  it('reads the hour and the local flag before the row is replaced, and writes them back', () => {
    const read1 = body.indexOf('select d.reminder_hour, d.local_reminders');
    const del = body.indexOf('delete from public.device_tokens where token = p_token');
    const ins = body.indexOf('insert into public.device_tokens');
    expect(read1).toBeGreaterThan(-1);
    expect(del).toBeGreaterThan(read1);
    expect(ins).toBeGreaterThan(del);
    expect(body).toMatch(/last_seen_at, reminder_hour, local_reminders\)\s*values \(auth\.uid\(\), p_token, coalesce\(p_platform, 'ios'\), p_tz_offset, now\(\), v_hour, coalesce\(v_local, false\)\)/);
  });

  it('never inherits another account\'s hour on a shared phone', () => {
    expect(body).toMatch(/from public\.device_tokens d\s*where d\.user_id = auth\.uid\(\)/);
  });

  it('keeps the signature builds in the stores already call', () => {
    expect(body).toMatch(/register_device_token\(\s*p_token text,\s*p_platform text default 'ios',\s*p_tz_offset int default null\s*\)/);
    expect(MIG).not.toMatch(/drop function/i);
  });
});

describe('a player with a browser subscription and a phone that reminds itself gets nothing from the server', () => {
  const MIG = read('supabase/migrations/v2_8_reminder_quiet_when_a_phone_reminds_itself.sql');

  it('a row that reminds itself wins the pick', () => {
    expect(MIG).toMatch(/v_new constant text := 'order by s\.user_id, coalesce\(s\.local_reminders, false\) desc, s\.pref, s\.last_seen_at desc nulls last';/);
  });

  it('edits the deployed function and refuses if the line is not there exactly once', () => {
    expect(MIG).toMatch(/pg_get_functiondef\(p\.oid\)/);
    expect(MIG).toMatch(/if v_hits <> 1 then\s*raise exception/);
  });

  it('ends by closing the function to everyone but the cron', () => {
    expect(MIG.trim().endsWith('revoke execute on function public.enqueue_web_daily_reminders() from public, anon, authenticated;')).toBe(true);
  });
});

describe('the phone says its hour again once the token has landed', () => {
  const PUSH = read('src/lib/push.js');
  const NOTIF = read('src/lib/notifications.js');

  it('push.js resyncs after a successful register, and only then', () => {
    expect(PUSH).toMatch(/\} else \{[\s\S]{0,400}import\('\.\/notifications\.js'\)\.then\(\(m\) => m\.resyncReminderHour\?\.\(\)\)/);
  });

  it('a phone that schedules nothing itself never claims to', () => {
    expect(NOTIF).toMatch(/export function resyncReminderHour\(\) \{\s*if \(_localWindowOn\) syncReminderHour\(\);\s*\}/);
    expect(NOTIF).toMatch(/_localWindowOn = true;\s*syncReminderHour\(\);/);
  });

  it('no reminder text says "tonight": the hour runs from morning to late evening', () => {
    const bodies = /const DAILY_BODIES = \[([\s\S]*?)\];/.exec(NOTIF)[1];
    expect(bodies).not.toMatch(/tonight/i);
  });
});

describe('the learned hour is a habit, not a week', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    };
  });
  const at = (h) => new Date(2026, 9, 1, h, 5, 0);

  it('defaults to the evening with nothing to go on', () => {
    expect(getReminderHour()).toBe(DEFAULT_REMINDER_HOUR);
  });

  it('four lunchtime games do not move an evening player (they did, with a window of seven)', () => {
    for (let i = 0; i < 10; i++) noteCompletionHour(at(21));
    for (let i = 0; i < 4; i++) noteCompletionHour(at(13));
    expect(getReminderHour()).toBe(21);
  });

  it('a real change of habit still moves it', () => {
    for (let i = 0; i < 6; i++) noteCompletionHour(at(21));
    for (let i = 0; i < 9; i++) noteCompletionHour(at(8));
    expect(getReminderHour()).toBe(8);
  });

  it('stays inside 08:00 to 22:00', () => {
    for (let i = 0; i < 14; i++) noteCompletionHour(at(2));
    expect(getReminderHour()).toBe(8);
  });
});
