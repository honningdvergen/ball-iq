import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * DailyDone — ONE return-loop panel under every decided daily (2026-09-06).
 *
 * Before it, each game had its own finish: four share buttons in four styles,
 * a countdown on two, the streak on one, the reminder ask as a bottom sheet 7s
 * after Daily 7 only (0 of its first 10 shows converted), and no "how everyone
 * did" since the fake percentile was removed. These pin the shape.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
// The Daily 7 host is the Results screen, extracted from App.jsx on 2026-09-06 (E16).
const RESULTS = read('../../src/screens/ResultsScreen.jsx');
const HUB = read('../../src/screens/OnlineHubTab.jsx'); // the Online tab, extracted the same day
const DD = read('../../src/components/DailyDone.jsx');
const CSS = read('../../src/components/dailyDone.css');
const LIB = read('../../src/lib/dailyResults.js');
const NOTIF = read('../../src/lib/notifications.js');
const MIG = read('../../supabase/migrations/v1_9_daily_results.sql');
const HOSTS = {
  footle: read('../../src/games/FootballWordle.jsx'),
  trail: read('../../src/screens/TransferTrail.jsx'),
  mystery: read('../../src/screens/MysteryPlayer.jsx'),
};

describe('DailyDone — one panel, four surfaces', () => {
  it('every daily host renders the shared panel with its game key', () => {
    expect(HOSTS.footle).toMatch(/<DailyDone[\s\S]*?game="footle"/);
    expect(HOSTS.trail).toMatch(/<DailyDone[\s\S]*?game="trail"/);
    expect(HOSTS.mystery.match(/<DailyDone[\s\S]*?game="mystery"/g) || []).toHaveLength(2); // won + gave up
    expect(RESULTS.match(/<DailyDone game="daily7"/g) || []).toHaveLength(2);             // mobile + desktop card
  });

  it('the old per-game finish pieces are gone', () => {
    expect(APP, 'TomorrowTeaser retired').not.toMatch(/function TomorrowTeaser|<TomorrowTeaser/);
    expect(APP, 'the 7-second sheet never opens').not.toMatch(/setNotifPromptOpen\(true\)/);
    expect(APP, 'no deferred save prompt').not.toMatch(/saveNudgePendingRef/);
    expect(HOSTS.footle, 'Footle share button lives in the panel').not.toMatch(/className="wd-share" onClick=\{onShare\}/);
    expect(HOSTS.footle, 'countdown footer lives in the panel').not.toMatch(/wd-result-foot/);
    expect(HOSTS.mystery, 'Mystery countdown lives in the panel').not.toMatch(/nextIn/);
    expect(HOSTS.trail, 'the Mystery chain is a still-open row now').not.toMatch(/onPlayMystery/);
  });

  it('the bails stay measured even though nothing opens', () => {
    // daily-play-counts pins the three notif-prompt-skipped bails; keep them.
    expect((APP.match(/notif-prompt-skipped/g) || []).length).toBe(3);
  });

  it('is honest: the distribution only appears at n >= 20, never fabricated', () => {
    expect(LIB).toMatch(/export const MIN_N = 20;/);
    expect(LIB).toMatch(/if \(!dist \|\| dist\.n < MIN_N\) return null;/);
    expect(DD).toMatch(/summariseDistribution\(/);
    expect(DD).not.toMatch(/Math\.random|seed/i);
  });

  it('the panel is drawn, not decorated: Lucide icons, no emoji, no eyebrow', () => {
    // eslint-disable-next-line no-misleading-character-class
    expect(DD).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(DD).toMatch(/from "lucide-react"/);
    expect(CSS).not.toMatch(/text-transform:\s*uppercase/);
    expect(CSS).not.toMatch(/border-left:\s*[2-9]px/);
  });

  it('one green primary (share); every other pill is quiet', () => {
    const share = CSS.match(/\n\.dd-share\{[^}]*\}/)?.[0] || '';
    expect(share).toContain('background:var(--accent)');
    expect(share).toContain('border-radius:999px');
    const pill = CSS.match(/\n\.dd-pill\{[^}]*\}/)?.[0] || '';
    expect(pill).toContain('background:var(--s2)');
  });

  it('reminds at the player\'s own hour, not a constant', () => {
    expect(NOTIF).toMatch(/getReminderHour\(\)/);
    expect(NOTIF).not.toMatch(/REMINDER_HOUR = 19/);
    expect(DD).toMatch(/noteCompletionHour\(\)/);
  });

  it('a live streak gets ONE evening streak-at-risk nudge, today only, named', () => {
    expect(NOTIF).toMatch(/STREAK_RISK_ID = ID_BASE \+ 40/);
    expect(NOTIF).toMatch(/streak >= 2 && getReminderHour\(\) < STREAK_RISK_HOUR/);
    expect(NOTIF).toMatch(/\$\{streak\}-day daily streak ends at midnight/);
    expect(NOTIF, 'cancelled with tonight when the player plays').toMatch(/\{ id: ID_BASE \}, \{ id: STREAK_RISK_ID \}/);
    expect((APP.match(/scheduleReminderWindow\(\{ skipToday: [^}]*streak: loginStreak \}\)/g) || []).length).toBe(3);
  });

  it('guest-first Online + Profile: what a guest can do comes first; the account ask is a quiet, named row', () => {
    // Online: no empty "You vs ?" scoreboard for a guest; Create Room only for
    // accounts; the ask sits after join-by-code and local play, in the row
    // anatomy, naming what it unlocks.
    expect(HUB).toMatch(/\{!needsAccount && \(\n\s*<div style=\{\{borderRadius:22/);
    expect(HUB, 'the green slab no longer flips to a sign-up label').not.toMatch(/needsAccount \? "Sign up to play online"/);
    // The guest's first block is the PITCH (what a room is + the one green
    // button = sign-up), above join-by-code and local play.
    expect(HUB).toMatch(/Who knows more — you or your mates\?/);
    expect(HUB.indexOf('Who knows more')).toBeLessThan(HUB.indexOf('Got a code? Type it here'));
    expect(HUB).toMatch(/Challenge your friends/);
    // Profile: the ask comes AFTER the player's own card.
    const PROFILE = read('../../src/screens/ProfileScreen.jsx');
    expect(PROFILE).not.toMatch(/>Save your progress</);
    expect(PROFILE.lastIndexOf('Saved on this phone only')).toBeGreaterThan(PROFILE.lastIndexOf('<BallIqCardFace'));
    expect(PROFILE).toMatch(/className="todays-seven-secondary mp-row" role="group" aria-label="Save your progress"/);
  });

  it('a rating needs answered questions, not just a game (no 64 · Silver after one Footle)', () => {
    const PROFILE = read('../../src/screens/ProfileScreen.jsx');
    expect((PROFILE.match(/const hasPlayed = \(stats\?\.totalAnswered \|\| 0\) >= MIN_RATED_ANSWERS;/g) || []).length).toBe(3);
    expect(read('../../src/lib/scoring.js')).toMatch(/export const MIN_RATED_ANSWERS = 10;/);
    expect(read('../../src/components/BallIqCardFace.jsx')).not.toMatch(/answered > 0/);
    expect(PROFILE).not.toMatch(/const hasPlayed = \(stats\?\.gamesPlayed \|\| 0\) > 0/);
  });

  it('the migration follows the house rules', () => {
    expect(MIG).toMatch(/enable row level security/);
    expect(MIG).toMatch(/revoke all on table public\.daily_results from anon, authenticated, public/);
    expect((MIG.match(/revoke all on function/g) || []).length).toBe(2);
    expect(MIG).toMatch(/security definer/i);
  });

  it('the History tab (ex-Daily) lists NO puzzle rows — those live on Home only', () => {
    // Alex, 2026-09-06: Home and the Daily tab listed the same four puzzles.
    // The tab keeps the countdown, streak strip, recent days and archive.
    const DAILY = read('../../src/screens/DailyScreen.jsx');
    expect(DAILY).not.toMatch(/todays-seven-secondary/);
    expect(DAILY).not.toMatch(/background: m\.theme\.card|m\.theme\.btnBg/);
    expect(DAILY).toMatch(/>History<\/div>/);
    expect(APP).toMatch(/id:"daily",\s*Icon: CalendarDays, label:"History", badge: false/);
    expect(DAILY, 'result strings carry no glyphs').not.toMatch(/`[✓✗] /);
  });

  it('App passes the live services to all three game screens and the results screen', () => {
    expect(APP).toMatch(/services=\{footleServices\}/);
    expect((APP.match(/services=\{dailyScreenServices\}/g) || []).length).toBe(2);
    expect(APP).toMatch(/dailyDone=\{dailyDoneServices\}/);
    // The TDZ rule: the memo must not reference a const declared below it.
    expect(APP.indexOf('const dailyDoneServices')).toBeGreaterThan(APP.indexOf('const startMode'));
    expect(APP.slice(APP.indexOf('const dailyDoneServices'), APP.indexOf('const footleServices'))).not.toMatch(/\bplayDaily\b/);
  });
});
