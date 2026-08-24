#!/usr/bin/env node
/**
 * Find club-pack questions whose correct answer IS the club you just picked.
 *
 *   node scripts/audit-club-self-answers.mjs
 *   node scripts/audit-club-self-answers.mjs --selftest
 *
 * ⚠️ THE RB LEIPZIG CLASS, GENERALISED. On 2026-08-23 a player answered
 * "RB Leipzig were founded with investment from which energy drinks company?"
 * CORRECTLY and reported it anyway — the club's own name contains the answer.
 * Alex's rule: this is answerable with zero football knowledge, and it "cannot
 * be corrected, only replaced."
 *
 * The pack version is worse, because the player chose the club from a picker
 * thirty seconds earlier. "Which club won the 2025-26 Premier League title?"
 * inside the Arsenal pack is not a question; it is a free point with a badge on
 * it, and it is the purest form of the thing Alex called insulting.
 *
 * ⚠️ NOT every mention is a leak. A club pack is ABOUT that club, so its name
 * appears constantly and legitimately — "Which of these did Arsenal sign in
 * 2003?" has Arsenal in the stem and a player in the answer. The defect is
 * specifically that the ANSWER OPTION is the pack's own club, so a player who
 * knows nothing but which button they pressed can score.
 *
 * Even then there is a real exception: a question whose options are all clubs
 * and where the pack's club is genuinely one candidate among several — "who
 * knocked United out?" inside the United pack, answer Liverpool — is fine, and
 * so is a question where the pack club is a DISTRACTOR. Only the correct answer
 * being the pack club counts here.
 *
 * Prints candidates. Never edits. Same reason as always: audits run 3-6%
 * precision on this bank, players run near 100%.
 */
import { QB } from '../src/questions.js';
// ⚠️ Use the hand-verified alias table, do NOT fuzzy-match club names. Its own
// header records what automated matching produced here: Angers→Rangers, Paris
// FC→PSG, Cercle Brugge→Club Brugge. My first version of this file skipped it
// and its self-test immediately caught "Man United" failing to match
// "Manchester United" — a whole class of self-answers that would have gone
// unreported while the run looked clean.
import { CLUB_ALIAS } from './seo/club-alias.mjs';

const norm = (s) => String(s ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Resolve a short/alternate club name to its canonical long form, then strip
 *  the decorations that make two spellings of one club look different. */
const clubKey = (s) => {
  const raw = String(s ?? '').trim();
  const canonical = CLUB_ALIAS[raw] || raw;
  return norm(canonical)
    .replace(/\b(fc|cf|afc|sc|ac|ss|as|ssc|rb|bv|vfb|vfl|tsg|1899|1860|club|de|futbol|football)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
};

export function findClubSelfAnswers(bank = QB) {
  const rows = [];
  for (const q of bank) {
    if (!q?.club || q.type !== 'mcq' || !Array.isArray(q.o) || typeof q.a !== 'number') continue;
    const answer = q.o[q.a];
    if (answer == null) continue;
    const pack = clubKey(q.club);
    const ans = clubKey(answer);
    if (!pack || !ans) continue;

    // ⚠️ STRICT EQUALITY, NOT CONTAINMENT — and this is the whole precision story
    // for this detector. The first version also accepted one key containing the
    // other, which produced two families of wrong answers:
    //
    //  1. IT MERGED TWO DIFFERENT CLUBS. Stripping "ac" turns "AC Milan" into
    //     "milan", which IS a substring of "inter milan" — so a question in the
    //     Inter pack about the San Siro, correctly answered AC Milan, was
    //     reported as Inter answering itself. Flagging a question about the
    //     RIVAL is the worst possible failure for this particular check.
    //  2. IT FLAGGED QUESTIONS WHERE THE CLUB NAME IS NOT THE DISCRIMINATOR.
    //     "Real Madrid Castilla", "Juventus Next Gen", "Milan Foot-Ball and
    //     Cricket Club" all contain the pack name — but so does every other
    //     option, so the pack name gives nothing away and the real answer is
    //     Castilla / Next Gen / Cricket.
    //
    // Alias resolution above already handles the only case containment was
    // there for ("Man United" vs "Manchester United"), so equality loses nothing.
    if (ans !== pack) continue;

    rows.push({
      id: q.id, club: q.club, diff: q.diff, q: q.q, answer,
      options: q.o,
    });
  }
  return rows;
}

if (process.argv.includes('--selftest')) {
  const cases = [
    { name: 'answer IS the pack club', expect: 1,
      q: { id: 'c1', club: 'Arsenal', type: 'mcq', q: 'Which club won the 2025-26 Premier League title?',
           o: ['Arsenal', 'Liverpool', 'Man City', 'Chelsea'], a: 0 } },
    { name: 'pack club is only a DISTRACTOR', expect: 0,
      q: { id: 'c2', club: 'Arsenal', type: 'mcq', q: 'Who knocked Arsenal out in 2024?',
           o: ['Arsenal', 'Bayern Munich', 'Chelsea', 'Porto'], a: 1 } },
    { name: 'pack club in the stem, answer is a player', expect: 0,
      q: { id: 'c3', club: 'Arsenal', type: 'mcq', q: 'Which of these did Arsenal sign in 2003?',
           o: ['Jens Lehmann', 'Petr Cech', 'Edwin van der Sar', 'Shay Given'], a: 0 } },
    { name: 'short vs long form of the same club still matches', expect: 1,
      q: { id: 'c4', club: 'Manchester United', type: 'mcq', q: 'Which club won the 1999 treble?',
           o: ['Man United', 'Arsenal', 'Chelsea', 'Leeds'], a: 0 } },
    { name: 'the two Manchesters are NOT the same club', expect: 0,
      q: { id: 'c5', club: 'Manchester United', type: 'mcq', q: 'Who won the 2011-12 title on goal difference?',
           o: ['Manchester City', 'Arsenal', 'Chelsea', 'Spurs'], a: 0 } },
    // ⚠️ The two families the containment version got wrong. Both pinned.
    { name: 'AC Milan is not Inter Milan (the substring trap)', expect: 0,
      q: { id: 'c6', club: 'Inter Milan', type: 'mcq', q: 'The San Siro was originally built for which club?',
           o: ['AC Milan', 'Inter Milan', 'Both', 'Neither'], a: 0 } },
    { name: 'club name in EVERY option is not the discriminator', expect: 0,
      q: { id: 'c7', club: 'Real Madrid', type: 'mcq', q: "What is Real Madrid's reserve team called?",
           o: ['Real Madrid Castilla', 'Real Madrid Aficionados', 'Real Madrid Atletico', 'Real Madrid Juvenil A'], a: 0 } },
    { name: 'an answer that is a sentence mentioning the club', expect: 0,
      q: { id: 'c8', club: 'Juventus', type: 'mcq', q: "What is the irony in Juventus's nickname?",
           o: ["The Latin name 'Juventus' means 'youth'", 'Founded by teenagers', 'Youngest of the giants', 'President was 19'], a: 0 } },
  ];
  let bad = 0;
  for (const c of cases) {
    const got = findClubSelfAnswers([c.q]).length;
    const ok = got === c.expect;
    if (!ok) bad += 1;
    console.log(`${ok ? '  ok  ' : '  FAIL'} ${c.name.padEnd(48)} expected ${c.expect}, got ${got}`);
  }
  console.log(bad ? `\n${bad} self-test(s) FAILED — do not trust this run` : '\nself-test passed');
  process.exit(bad ? 1 : 0);
}

const rows = findClubSelfAnswers();
console.log(`\nscanned ${QB.filter((q) => q?.club).length} club-pack questions across ${new Set(QB.filter((q) => q?.club).map((q) => q.club)).size} packs\n`);
console.log(`  ${rows.length} question(s) whose correct answer IS the pack's own club\n`);
for (const r of rows) {
  console.log(`  ${r.id}  [${r.club} / ${r.diff}]`);
  console.log(`  Q: ${r.q}`);
  console.log(`  A: ${r.answer}      options: ${r.options.join(' · ')}`);
  console.log('');
}
console.log('⚠️  For a human ruling. A player who knows only which button they');
console.log('    pressed can score on these — the class Alex calls insulting.\n');
