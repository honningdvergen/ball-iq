import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LeagueTableView, LeagueCreateSheet, LeagueJoinSheet } from '../../src/screens/LeagueScreen.jsx';

/**
 * Mates' leagues, the screens: one solid button per surface, the banter only
 * on a final table, nothing about crowd size before joining, Lucide icons and
 * sentence case only. Drawn from fixtures (no network).
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const solids = (html) => (html.match(/class="lg-solid"/g) || []).length;
const h = React.createElement;

const MON = 20738; // Mon 12 Oct 2026
const rows = (final) => [
  { rank: 1, tied: false, name: 'Alex', is_me: false, points: 41, tens: 2, days: 5, joined_day: MON - 9, per_day: [8, 9, null, 7, 9, 8, null], labels: final ? ['crown'] : [] },
  { rank: 2, tied: true, name: 'Sam', is_me: true, points: 30, tens: 1, days: 4, joined_day: MON - 9, per_day: [10, null, 6, 7, 7, null, null], labels: [] },
  { rank: 2, tied: true, name: 'Kim', is_me: false, points: 30, tens: 1, days: 4, joined_day: MON - 9, per_day: [null, 9, 6, 7, 8, null, null], labels: [] },
  { rank: 4, tied: false, name: 'Jon', is_me: false, points: 22, tens: 0, days: 3, joined_day: MON - 9, per_day: [9, 9, 4, null, null, null, null], labels: final ? ['bottled'] : [] },
  { rank: 5, tied: false, name: 'Lee', is_me: false, points: 6, tens: 0, days: 1, joined_day: MON + 2, per_day: [null, null, 6, null, null, null, null], labels: final ? ['spoon'] : [] },
  { rank: 6, tied: false, name: 'Max', is_me: false, points: 0, tens: 0, days: 0, joined_day: MON, per_day: [null, null, null, null, null, null, null], labels: final ? ['ghost'] : [] },
];
const table = (final) => ({
  meta: { id: 'L1', name: 'The Lads', code: 'K7QM2XPA', tz: 'Europe/Oslo', week_start: MON, today: MON + 4, is_final: final, is_owner: true, my_joined_day: MON - 9, my_name: 'Sam' },
  rows: rows(final),
  last_week: { winners: ['Alex'], points: 214, week_start: MON - 7 },
});

describe('the league table', () => {
  it('live, with dailies open: one solid button, "Play today\'s", and no banter yet', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [{ key: 'trail', name: "Today's Transfer Trail" }] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/class="lg-solid"[^>]*>Play today/);
    expect(html).toContain('Final whistle Sun midnight (Oslo)');
    expect(html).not.toMatch(/Wooden spoon|Bottled it|Didn&#x27;t turn up|Didn't turn up/);
    expect(html).toContain('=2');                       // a shared rank
    expect(html).toContain('Last week: Alex won on 214');
  });

  it('live, all played: the solid button invites', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/Invite mates/);
  });

  it('final: one solid button to share it, and the labels as chips', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(true), nextUp: [{ key: 'trail' }] }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/Share final table/);
    expect(html).toContain('Winner');
    expect(html).toContain('Wooden spoon');
    expect(html).toContain('Bottled it');
    expect(html).toMatch(/Didn(&#x27;|')t turn up/);
    expect(html).toContain('Final table');
  });

  it('a late joiner\'s days before joining are blank, not a miss', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), nextUp: [] }));
    const lee = html.slice(html.indexOf('>Lee<'), html.indexOf('>Max<'));
    expect((lee.match(/lg-cell is-before/g) || []).length).toBe(2);
  });

  it('a guest is told where their points live', () => {
    const html = renderToStaticMarkup(h(LeagueTableView, { data: table(false), isAnon: true, onSave: () => {} }));
    expect(html).toContain('Your points live on this phone');
    expect(solids(html)).toBe(1);
  });
});

describe('the sheets', () => {
  it('create: one solid button, the head-to-head name, the one line of rules', () => {
    const html = renderToStaticMarkup(h(LeagueCreateSheet, { seed: 'h2h_footle', vs: 'Alex', displayName: 'Sam' }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/value="Sam v Alex"/);
    expect(html).toContain('Points from today, Monday to Sunday. Anyone with the link can join.');
    expect(html).toMatch(/Create league/);
  });

  it('join: one solid button, the inviter and the name, and no crowd size', () => {
    const html = renderToStaticMarkup(h(LeagueJoinSheet, { token: 'K7QM2XPA.The%20Lads.Alex', displayName: 'Turbo Keeper 12' }));
    expect(solids(html)).toBe(1);
    expect(html).toContain('Alex invited you to');
    expect(html).toContain('The Lads');
    expect(html).toMatch(/Join league/);
    expect(html).not.toMatch(/\d+\s*(members|players|mates) /i);
  });

  it('a broken invite says so, with one way out', () => {
    const html = renderToStaticMarkup(h(LeagueJoinSheet, { token: 'nonsense' }));
    expect(solids(html)).toBe(1);
    expect(html).toMatch(/doesn(&#x27;|'|’)t open a league/);
  });
});

describe('drawn, not decorated', () => {
  const SRC = ['../../src/screens/LeagueScreen.jsx', '../../src/components/LeagueHomeCard.jsx'].map(read).join('\n');
  const CSS = read('../../src/screens/league.css');
  it('Lucide icons, no emoji, no capitals by CSS', () => {
    expect(SRC).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{FE0F}]/u);
    expect(SRC).toMatch(/from "lucide-react"/);
    expect(CSS).not.toMatch(/text-transform:\s*uppercase/);
    expect(SRC).not.toMatch(/textTransform/);
  });
  it('the Home card has no solid button of its own', () => {
    expect(read('../../src/components/LeagueHomeCard.jsx')).not.toMatch(/lg-solid/);
  });
});

describe('the results panel', () => {
  const DD = read('../../src/components/DailyDone.jsx');
  it('sends the league result for a live puzzle only, before the daily record\'s await, without awaiting it', () => {
    const block = DD.slice(DD.indexOf('if (!isArchive) {'), DD.indexOf('await recordDailyResult('));
    expect(block).toMatch(/import\("\.\.\/lib\/leagueResults\.js"\)\.then\(\(m\) => m\.recordLeagueResult\(\{ game, edition, bucket, won \}\)\)/);
    expect(block).not.toMatch(/await import/);
    expect(block).toMatch(/!isNativeShell\(\)/);
  });
  it('"Make it a league?" is a hairline under the head-to-head, never a second solid button', () => {
    // "Make it a league?" is the dd.league key since i18n step 4.
    expect(DD).toMatch(/className="dd-share-alt" onClick=\{makeLeague\}>\{t\("dd\.league"\)\}/);
    expect((DD.match(/className="dd-share"/g) || []).length).toBe(2); // Send it back | Share result
    expect(DD).toMatch(/const leagueOffer = !!rival && !isNativeShell\(\);/);
  });
});
