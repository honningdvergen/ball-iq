// gen-grid-headers.mjs — how the daily grid (Tiki Taka Toe) draws its headers.
//
//   node scripts/gen-grid-headers.mjs           # report only
//   node scripts/gen-grid-headers.mjs --write   # emit src/data/gridHeaders.json
//
// A header is a TEXT BADGE: a three-letter monogram and a short name on the
// club's colour. No crests and no photos (an earlier lineup game failed on
// photos). The schedule stores the career dictionary's names ("Real Madrid Club
// de Fútbol", "Club Atlético River Plate"), which do not fit a 80pt column, so
// the short name and the letters are written out here, once per club, where
// they can be read and corrected.
//
// ⚠️ THE COLOUR IS THE CLUB PAGES' COLOUR. colourFor (seo/grid-section.mjs)
// already resolves exactly these names for the club-page grids, through the
// app's pack table and the shared EXTRA table, with its exactly-one rule. The
// app's clubColour() coloured only 10 of the 53 scheduled clubs (it never
// strips "FC" / "AS" / "SSC"), so reusing it would have drawn half the board
// grey. One resolver, so a club page and the app paint a club the same.
//
// ⚠️ A SCHEDULED CLUB WITH NO ROW HERE FAILS THE WRITE. The schedule is frozen,
// so the set is known; a club drawn with its raw dictionary name would be the
// silent failure.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { colourFor } from './seo/grid-section.mjs';

const OUT = fileURLToPath(new URL('../src/data/gridHeaders.json', import.meta.url));
const SCHEDULE = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/gridSchedule.json', import.meta.url)), 'utf8'));

// [short name, monogram]. Short names are the ones the app's packs use where
// it has one ("Man United", "Tottenham").
const DISPLAY = {
  'AC Milan': ['AC Milan', 'MIL'],
  'ACF Fiorentina': ['Fiorentina', 'FIO'],
  'AFC Ajax': ['Ajax', 'AJA'],
  'AS Monaco FC': ['Monaco', 'MON'],
  'AS Roma': ['Roma', 'ROM'],
  'Arsenal F.C.': ['Arsenal', 'ARS'],
  'Aston Villa F.C.': ['Aston Villa', 'AVL'],
  'Atlético Madrid': ['Atlético', 'ATM'],
  'Borussia Dortmund': ['Dortmund', 'BVB'],
  'Celtic F.C.': ['Celtic', 'CEL'],
  'Cerezo Osaka': ['Cerezo Osaka', 'CER'],
  'Chelsea F.C.': ['Chelsea', 'CHE'],
  'Club Atlético River Plate': ['River Plate', 'RIV'],
  'Clube de Regatas do Flamengo': ['Flamengo', 'FLA'],
  'Crystal Palace F.C.': ['Crystal Palace', 'CRY'],
  'Everton F.C.': ['Everton', 'EVE'],
  'FC Barcelona': ['Barcelona', 'BAR'],
  'FC Bayern Munich': ['Bayern', 'FCB'],
  'FC Porto': ['Porto', 'POR'],
  'Fulham F.C.': ['Fulham', 'FUL'],
  'Galatasaray S.K.': ['Galatasaray', 'GAL'],
  'Gamba Osaka': ['Gamba Osaka', 'GAM'],
  'Genoa CFC': ['Genoa', 'GEN'],
  'Inter Milan': ['Inter', 'INT'],
  'JEF United Chiba': ['JEF United', 'JEF'],
  'Juventus FC': ['Juventus', 'JUV'],
  'Kashiwa Reysol': ['Kashiwa', 'KAS'],
  'Liverpool F.C.': ['Liverpool', 'LIV'],
  'Manchester City F.C.': ['Man City', 'MCI'],
  'Manchester United F.C.': ['Man United', 'MUN'],
  'Newcastle United F.C.': ['Newcastle', 'NEW'],
  'Olympique Lyonnais': ['Lyon', 'OL'],
  'Olympique de Marseille': ['Marseille', 'OM'],
  'PSV Eindhoven': ['PSV', 'PSV'],
  'Paris Saint-Germain FC': ['PSG', 'PSG'],
  'Parma Calcio 1913': ['Parma', 'PAR'],
  'RCD Espanyol de Barcelona': ['Espanyol', 'ESP'],
  'Real Madrid Club de Fútbol': ['Real Madrid', 'RMA'],
  'S.L. Benfica': ['Benfica', 'BEN'],
  'SS Lazio': ['Lazio', 'LAZ'],
  'SSC Napoli': ['Napoli', 'NAP'],
  'Sevilla FC': ['Sevilla', 'SEV'],
  'Sporting CP': ['Sporting CP', 'SCP'],
  'Sunderland A.F.C.': ['Sunderland', 'SUN'],
  'São Paulo FC': ['São Paulo', 'SAO'],
  'Tokyo Verdy': ['Tokyo Verdy', 'VER'],
  'Torino FC': ['Torino', 'TOR'],
  'Tottenham Hotspur F.C.': ['Tottenham', 'TOT'],
  'U.C. Sampdoria': ['Sampdoria', 'SAM'],
  'Valencia CF': ['Valencia', 'VAL'],
  'Villarreal CF': ['Villarreal', 'VIL'],
  'West Ham United F.C.': ['West Ham', 'WHU'],
  'Yokohama F. Marinos': ['Yokohama FM', 'YFM'],
};

const clubs = [...new Set(SCHEDULE.days.flatMap((d) => [...d.r, ...d.c]))].sort();
const fail = [];
const out = {};
let coloured = 0;
for (const c of clubs) {
  const row = DISPLAY[c];
  if (!row) { fail.push(`no DISPLAY row for "${c}"`); continue; }
  const [short, abbr] = row;
  if (short.length > 14) fail.push(`"${short}" is longer than 14 characters`);
  if (!/^[A-Z]{2,3}$/.test(abbr)) fail.push(`"${abbr}" (${c}) is not 2-3 capitals`);
  const hex = colourFor(c);
  if (hex) coloured++;
  out[c] = { s: short, a: abbr, h: hex || null };
}
for (const k of Object.keys(DISPLAY)) if (!clubs.includes(k)) fail.push(`DISPLAY row "${k}" is in no scheduled grid (typo?)`);

console.log(`\n  grid headers — ${clubs.length} clubs in the schedule, ${coloured} with a colour`);
for (const c of clubs.filter((x) => out[x] && !out[x].h)) console.log(`    no colour: ${c} (drawn neutral)`);
if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} problem(s):`);
  for (const f of fail) console.error(`      · ${f}`);
  process.exit(1);
}
if (process.argv.includes('--write')) {
  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
  console.log(`  → wrote ${OUT}\n`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridHeaders.json)\n');
}
