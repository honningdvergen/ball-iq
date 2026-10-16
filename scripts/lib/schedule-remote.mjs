// The Transfer Trail log and the Mystery Player schedule as the site serves
// them to installed apps (src/lib/scheduleRemote.js), and the served horizon
// each build bundles beside them (src/data/scheduleServed.json).
//
// Written in the same run as the bundled log, from the same array, so the two
// cannot differ; tests/unit/schedule-remote.test.js fails if they ever do.
// The pattern is Daily 7's (scripts/gen-daily-log.mjs -> public/data/daily7.json).
//
// `served` = how many leading days may already have been served: everything
// through TOMORROW (a player in UTC+13 is a day ahead of the build machine),
// never less than the last file said, and for the Trail never less than the
// days frozen in tests/unit/trail-schedule.test.js. An installed app refuses a
// fetched file that moves any of those days, so this REFUSES to write one.
//
// Usage: const plan = planScheduleRemote('mystery', { anchor, days });
//        ...write the bundled log...;  plan.write();
// planScheduleRemote throws before anything is written when a served day moved.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
export const SERVED_FILE = new URL('src/data/scheduleServed.json', ROOT);
export const REMOTE_FILES = {
  trail: new URL('public/data/trail.json', ROOT),
  mystery: new URL('public/data/mystery.json', ROOT),
};

const readJson = (url) => { try { return JSON.parse(readFileSync(url, 'utf8')); } catch { return null; } };
// Same day the app calls today: UTC midnight of the LOCAL date.
const todayIndex = (now = new Date()) => Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);

export function planScheduleRemote(name, { anchor, days, minServed = 0, now = new Date() }) {
  const file = REMOTE_FILES[name];
  if (!file) throw new Error(`[schedule-remote] unknown log "${name}"`);
  if (!Array.isArray(days) || !days.length) throw new Error(`[schedule-remote] ${name}: empty log`);
  const servedAll = readJson(SERVED_FILE) || {};
  const prev = readJson(file);
  const prevServed = Math.max(servedAll[name] ?? 0, prev?.served ?? 0);
  if (prev) {
    if (prev.anchor !== anchor) throw new Error(`[schedule-remote] ${name}: the anchor moved (${prev.anchor} -> ${anchor}); every installed app would refuse the file`);
    if (days.length < prev.days.length) throw new Error(`[schedule-remote] ${name}: the log got shorter (${prev.days.length} -> ${days.length})`);
    for (let i = 0; i < Math.min(prevServed, prev.days.length); i++) {
      if (prev.days[i] !== days[i]) {
        throw new Error(`[schedule-remote] ${name}: refusing. Day index ${i} (No. ${i + 1}) moved (${prev.days[i]} -> ${days[i]}) `
          + `but the first ${prevServed} days are recorded as served. Installed apps would refuse this file. Find out why the log moved.`);
      }
    }
  }
  const served = Math.min(days.length, Math.max(prevServed, todayIndex(now) - anchor + 2, minServed));
  const text = JSON.stringify({ v: 1, anchor, served, days }) + '\n';
  return {
    served,
    changed: !prev || readFileSync(file, 'utf8') !== text || servedAll[name] !== served,
    write() {
      const next = { ...(readJson(SERVED_FILE) || {}), [name]: served };
      const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
      writeFileSync(SERVED_FILE, JSON.stringify(sorted, null, 2) + '\n');
      writeFileSync(file, text);
      console.log(`[schedule-remote] ${name}: ${days.length} days, the first ${served} recorded as served -> public/data/${name}.json`);
    },
  };
}

/** How many Trail days tests/unit/trail-schedule.test.js holds as PUBLISHED (frozen). */
export function trailPublishedLength() {
  const src = readFileSync(new URL('tests/unit/trail-schedule.test.js', ROOT), 'utf8');
  const block = src.match(/const PUBLISHED = \[([\s\S]*?)\n {2}\];/);
  if (!block) throw new Error('[schedule-remote] could not find PUBLISHED in tests/unit/trail-schedule.test.js');
  return [...block[1].matchAll(/"([A-Z0-9_]+)"/g)].length;
}
