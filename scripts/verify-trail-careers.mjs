// verify-trail-careers.mjs — re-read all 102 Transfer Trail careers from
// Wikipedia and report where the shipped trail has gone stale.
//
//   node scripts/verify-trail-careers.mjs [--json out.json] [--limit N]
//
// ⚠️ RUN THIS AT EVERY TRANSFER WINDOW. Standing instruction from Alex,
// 2026-08-12: "these careers are something we should be verifying now and at
// the end of the transfer window and every future transfer window for that
// matter to stay updated." A Trail career is a factual claim about a living
// player that the world keeps editing — Torres retiring changed nothing, but
// any active player moving club makes our trail WRONG, silently, on a puzzle
// that has already been scheduled. Nothing else in the build catches this: the
// tests assert schedule shape, not that the football is still true.
//
// ⚠️ THIS REPORTS, IT DOES NOT WRITE. Same bar as the generator — Wikipedia is
// a starting point, not an authority, and it gets vandalised (see the
// "Belligoal" incident). Every finding here is a prompt to go and look, not an
// edit to apply. Fixing a career also means checking whether its puzzle has
// already been PLAYED, because the played part of the answer log is frozen.
import { writeFileSync } from 'fs';
import { TRAIL_PLAYERS } from '../src/lib/trail.js';
import { careerFor, house, sleep, UA } from './lib/wiki-career.mjs';

const args = process.argv.slice(2);
const jsonAt = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const MAX_RUNGS = 6;

// ⚠️ COMPARE LOOSELY, REPORT PRECISELY. The shipped careers were hand-curated
// over two waves and carry house spellings that predate the NAME map
// ("Atletico Madrid", "Inter Milan"), so an exact string diff would flag ~40
// careers that are perfectly correct. Fold to a comparison key — lowercase,
// accents stripped, punctuation and the FC/CF/AFC suffixes gone — and only
// report a difference the key still sees.
const key = (s) => house(String(s))
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\b(fc|cf|sc|ac|as|ss|sk|afc|vfl|vfb|tsg|sv|club|de|futbol|football)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

// ⚠️ EXACT KEYS ARE NOT ENOUGH, AND THE FIRST RUN PROVED IT. 20 of 23
// "divergences" were the same club under two names: ours "Newcastle" vs wiki
// "Newcastle United", "Dortmund" vs "Borussia Dortmund", "Hamburg" vs
// "Hamburger SV". All correct, all noise — and noise is not harmless here,
// because this tool exists to be run unattended at a transfer window and 20
// false positives is how the one real transfer gets scrolled past. One name
// containing the other is the same club; the 4-character floor stops a short
// key matching half the league.
const sameClub = (a, b) => {
  const [x, y] = [key(a), key(b)];
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 4 && long.includes(short);
};

// ⚠️ THE ARTICLE IS NOT ALWAYS AT THE PLAYER'S FULL NAME. Spanish players in
// particular go by one: Isco's article is "Isco", not "Isco Alarcón", and
// Joaquín's is "Joaquín (footballer)". Both came back "no infobox" on the first
// run and looked like missing data rather than a missing title. Search is the
// honest fallback — but it is scoped with "footballer" and only ever used when
// the direct title fails, so a working lookup can never be quietly replaced by
// a search hit for a different player.
async function careerByName(name) {
  const direct = await careerFor(name.replace(/ /g, '_'));
  if (direct && direct.length) return { career: direct, via: null };
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(`${name} footballer`)}`;
  const hit = await fetch(url, { headers: UA }).then((r) => r.json()).catch(() => null);
  const title = hit?.query?.search?.[0]?.title;
  if (!title) return { career: null, via: null };
  await sleep(220);
  const found = await careerFor(title.replace(/ /g, '_'));
  return { career: found && found.length ? found : null, via: title };
}

// ⚠️ WHERE WE DELIBERATELY DISAGREE WITH WIKIPEDIA. Five of the first run's
// findings were not defects — they were places our data is RICHER than the
// infobox, and re-raising them every window is how a detector trains its owner
// to skim it. The pattern behind most of them: the locked rule says a return to
// a former club is its own rung, but Wikipedia's infobox collapses "Real Madrid
// 2013–2022" into ONE row with the loan nested inside, so Bale's return from
// Spurs and Alonso's from Eibar vanish from their side and not from ours.
//
// ⚠️ AN ENTRY HERE IS NOT A PERMANENT MUTE. It records the rung count we
// accepted; if Wikipedia's career changes length the finding fires again,
// because that means something new happened rather than the same old
// disagreement. 'new-club' is never suppressible — a settled argument about
// ordering must never hide the next transfer.
const ACCEPTED = {
  BALE: { kinds: ['divergence'], wikiRungs: 5, why: 'we count his 2021–22 return to Real Madrid after the Spurs loan; the infobox nests it inside one 2013–2022 row' },
  ALONSO: { kinds: ['divergence'], wikiRungs: 5, why: 'we count his return to Real Sociedad after the Eibar loan; the infobox nests it inside 1999–2004' },
  COURTOIS: { kinds: ['divergence'], wikiRungs: 4, why: 'VERIFIED 2026-08-03: the infobox lists Chelsea before the Atletico loan, a club he had not played a minute for. Our order is the fix, not the drift' },
  // ⚠️ TORRES, NOT TORRES_FER. The merger gives the disambiguating suffix to the
  // NEWER entry, so TORRES_FER is Ferran and plain TORRES is Fernando — the
  // opposite of what the suffix reads like. This entry sat on the wrong player
  // until the run showed Fernando still firing.
  TORRES: { kinds: ['loan-flag'], wikiRungs: 6, why: 'the Milan spell began as a loan from Chelsea and he was re-loaned on the day it turned permanent; "loan" is the honest label for a guessing game' },
  LEWANDOWSKI: { kinds: ['divergence'], wikiRungs: 7, why: 'wave-M editorial subset — the two lower-tier Polish openers are trimmed, the recent end is not' },
};

const findings = [];
const skipped = [];
const add = (kind, p, detail, wikiRungs) => {
  const ok = ACCEPTED[p.key];
  if (ok && ok.kinds.includes(kind) && ok.wikiRungs === wikiRungs) {
    skipped.push(`${p.display.join(' ')} — ${ok.why}`);
    return;
  }
  findings.push({ kind, key: p.key, name: p.display.join(' '), detail });
};

const targets = TRAIL_PLAYERS.slice(0, limit);
console.log(`checking ${targets.length} Trail careers against Wikipedia…\n`);

let checked = 0;
let unreadable = 0;
for (const p of targets) {
  let live; let via = null;
  try { ({ career: live, via } = await careerByName(p.display.join(' '))); } catch { live = null; }
  await sleep(220);

  if (!live || !live.length) {
    // Not a finding about the football — a finding about the lookup. Reported
    // separately so a batch of redirects can never read as "all careers fine".
    unreadable += 1;
    add('unreadable', p, 'no infobox found — check the article title by hand');
    continue;
  }
  checked += 1;

  const ours = p.clubs;
  const theirs = live.map((r) => house(r.club));

  // ── the transfer-window signal ────────────────────────────────────────────
  // A club at the END of their list that we do not have is a move that happened
  // after we curated this career. This is the whole reason the script exists.
  const extraTail = theirs.slice(ours.length);
  const tailMatches = ours.every((c, i) => sameClub(c, theirs[i]));
  if (tailMatches && extraTail.length) {
    add('new-club', p, `moved since we curated: + ${extraTail.join(' → ')} (trail now ${live.length} rungs)`);
    // ⚠️ A NEW CLUB CAN ALSO BREAK THE CAP. The locked rule rejects a career
    // over six rungs rather than truncating it, because a truncated trail is a
    // wrong trail — the first club goes missing. So this is a retire, not an
    // append.
    if (live.length > MAX_RUNGS) add('over-cap', p, `${live.length} rungs — over the ${MAX_RUNGS} cap, retire rather than extend`);
    continue;
  }

  // ── anything else that no longer lines up ────────────────────────────────
  if (!tailMatches) {
    const diffs = [];
    for (let i = 0; i < Math.max(ours.length, theirs.length); i += 1) {
      if (!sameClub(ours[i], theirs[i])) {
        diffs.push(`#${i + 1} ours=${ours[i] ?? '—'} wiki=${theirs[i] ?? '—'}`);
      }
    }
    add('divergence', p, diffs.join(' · '), live.length);
    continue;
  }

  // ── loan markers ─────────────────────────────────────────────────────────
  // A loan that became permanent is the common one, and it is a real factual
  // error in the hint — the rung would read "(loan)" for what turned into the
  // biggest move of a career.
  const loanDiffs = [];
  for (let i = 0; i < ours.length; i += 1) {
    const mine = !!(p.loans && p.loans[i]);
    const wiki = !!live[i].loan;
    if (mine !== wiki) loanDiffs.push(`#${i + 1} ${ours[i]}: ours=${mine ? 'loan' : 'permanent'} wiki=${wiki ? 'loan' : 'permanent'}`);
  }
  if (loanDiffs.length) add('loan-flag', p, loanDiffs.join(' · '), live.length);
  // Worth surfacing even when the career matches: a title we only reached by
  // search is a title the next run should be told about explicitly.
  if (via) add('title', p, `article lives at "${via}", not the full name`);
}

// ── report ──────────────────────────────────────────────────────────────────
const by = (k) => findings.filter((f) => f.kind === k);
const ORDER = [
  ['new-club', '⚠️  TRANSFERRED SINCE WE CURATED — the trail is now wrong'],
  ['over-cap', '⚠️  OVER THE 6-RUNG CAP — retire, do not truncate'],
  ['divergence', '   career no longer lines up — read the article'],
  ['loan-flag', '   loan marker disagrees'],
  ['title', '   found under a different article title'],
  ['unreadable', '   could not read an infobox (lookup problem, not a football one)'],
];
for (const [kind, heading] of ORDER) {
  const rows = by(kind);
  if (!rows.length) continue;
  console.log(`\n${heading}  (${rows.length})`);
  for (const f of rows) console.log(`   ${f.name} — ${f.detail}`);
}

if (skipped.length) {
  console.log(`\n   accepted divergences, not re-raised  (${skipped.length})`);
  for (const t of skipped) console.log(`   ${t}`);
}

const stale = by('new-club').length + by('over-cap').length;
console.log(`\n${checked} careers read · ${unreadable} unreadable · ${findings.length} findings · ${stale} need an editorial fix`);
if (jsonAt) { writeFileSync(jsonAt, `${JSON.stringify(findings, null, 1)}\n`); console.log(`wrote ${jsonAt}`); }
if (!findings.length) console.log('every career still matches Wikipedia.');
console.log('\n⚠️ Findings are prompts to go and look, not edits to apply. Check whether the');
console.log('   puzzle has already been played before touching TRAIL_ANSWER_LOG.');

// Non-zero only for the classes that mean a shipped puzzle is factually wrong,
// so this can be wired to a schedule later without unreadable-title noise
// failing the run.
process.exit(stale ? 1 : 0);
