// Live match watcher for several ESPN events at once. Polls every 20s and EXITS on the first change
// (goal, red card, penalty, half-time, full-time) so a background run wakes the live session.
//
//   node social/matchwatch.mjs 401861081 401861079 401861080 401861077
//
// State per event is kept in social/state/matchwatch.json, so a restart after acting doesn't
// re-report the same moment. Exit 0 + a report on stdout = something happened; exit 3 = all FT.
import fs from 'node:fs';

const IDS = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const STATE = new URL('./state/matchwatch.json', import.meta.url);
const prev = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE)) : {};
const API = (id) => `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${id}`;

async function snap(id) {
  const j = await (await fetch(API(id), { signal: AbortSignal.timeout(15000) })).json();
  const comp = j.header?.competitions?.[0];
  const teams = (comp?.competitors || []).sort((a) => (a.homeAway === 'home' ? -1 : 1));
  const name = teams.map((t) => t.team?.abbreviation || t.team?.displayName).join(' v ');
  const score = teams.map((t) => t.score ?? '-').join('-');
  const status = comp?.status?.type?.shortDetail || comp?.status?.type?.detail || '';
  const state = comp?.status?.type?.state || '';
  const keys = (j.keyEvents || [])
    .filter((e) => /goal|red card|penalty|own goal|var|disallow/i.test(e.type?.text || ''))
    .map((e) => `${e.clock?.displayValue || ''} ${e.type?.text}${e.participants?.[0]?.athlete?.displayName ? ' ' + e.participants[0].athlete.displayName : ''}${e.team?.displayName ? ' (' + e.team.displayName + ')' : ''}`);
  return { id, name, score, status, state, keys };
}

for (;;) {
  const snaps = (await Promise.all(IDS.map((id) => snap(id).catch(() => null)))).filter(Boolean);
  const changes = [];
  for (const s of snaps) {
    const p = prev[s.id];
    if (!p) { prev[s.id] = s; continue; }
    const newKeys = s.keys.filter((k) => !p.keys.includes(k));
    const phase = (x) => /^(HT|Halftime)/i.test(x.status) ? 'HT' : x.state === 'post' ? 'FT' : x.state;
    if (newKeys.length || phase(s) !== phase(p)) changes.push(`${s.name} ${s.score} [${s.status}]${newKeys.length ? '\n    ' + newKeys.join('\n    ') : ''}`);
    prev[s.id] = s;
  }
  fs.writeFileSync(STATE, JSON.stringify(prev));
  if (changes.length) {
    console.log(`MATCH UPDATE ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo' })}:\n` + changes.join('\n'));
    console.log('ALL: ' + snaps.map((s) => `${s.name} ${s.score} (${s.status})`).join(' | '));
    process.exit(0);
  }
  if (snaps.length && snaps.every((s) => s.state === 'post')) { console.log('all matches finished'); process.exit(3); }
  await new Promise((r) => setTimeout(r, 20000));
}
