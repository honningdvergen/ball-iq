#!/usr/bin/env node
// audit-distractor-eras.mjs — career-era distractor sweep.
//
//   node scripts/audit-distractor-eras.mjs [--json out.json] [--all]
//
// The defect class (third live sighting fixed in q_4775c2, 2026-08-28): a stem
// anchors an era ("In 2023 …") but a person-name distractor's career had ended
// years earlier — Michael Carrick (retired 2018) and Mark Noble (retired 2022)
// as options for a 2023 sale. Every such option is a free elimination, and the
// per-question verifiers structurally cannot see it because each option is
// individually a real footballer and the answer key is correct.
//
// This differs from audit-distractor-plausibility.mjs in one way: that script
// tests era only at the INTERSECTION with a surname clash, against a ~100-name
// hand-curated retirement table, and only on single-match play-event stems —
// which is exactly why it could not see q_4775c2 (a transfer stem). This sweep
// tests era alone, against the 9,268-player Wikidata careers snapshot
// (scripts/_mystery-careers*.json), across any career-event stem.
//
// ⚠️ THIS REPORTS, IT DOES NOT WRITE (same bar as verify-trail-careers.mjs).
// The fix for a finding is replacing the distractor with an era-true one that
// still fits the stem's qualifier yet is wrong — an editorial call. See the
// q_4775c2 fix: Paquetá/Ward-Prowse, both 2023-true West Ham midfielders,
// answer string and index unchanged so the frozen Daily 7 stays untouched.
//
// ⚠️ ERA MISMATCH ALONE IS SOMETIMES UNAVOIDABLE BY CONSTRUCTION (lesson kept
// from audit-distractor-plausibility.mjs): "which player scored in the 2002,
// 2006, 2010 AND 2014 World Cups" cannot have a distractor who plausibly did.
// And a stem ABOUT the past ("legend", "all-time", "whose 1972 record…")
// legitimately offers past players. Precision therefore comes from demotions:
// a finding starts HIGH and each soft doubt drops it a tier. Only HIGH is
// meant to be actionable without reading the question first.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { QB } = await import(join(ROOT, 'src/questions.js'));
// ⚠️ REUSED, NOT HAND-ROLLED. normaliseName is the shipped Mystery guess
// matcher's normaliser (case/accent-insensitive), and the surname handling
// below generalises matchGuess's trailing-suffix rule ("de ligt", "van dijk")
// from find-the-unique-bearer to collect-every-bearer. The short/long-name
// trap has fired five times in this repo; build on the matcher that already
// survived production, never on a fresh one.
const { normaliseName } = await import(join(ROOT, 'src/lib/mysteryPlayer.js'));
const { NAME_OVERRIDES } = await import(join(ROOT, 'scripts/_name-overrides.mjs'));

const args = process.argv.slice(2);
const jsonAt = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const showAll = args.includes('--all');
const THIS_YEAR = 2026; // data snapshot year, not wall clock — bump when refetching careers

// ── Player pool: QID → name + last recorded career year ─────────────────────
const CORE = JSON.parse(readFileSync(join(ROOT, 'scripts/_mystery-core.json'), 'utf8'));
const CAREERS = JSON.parse(readFileSync(join(ROOT, 'scripts/_mystery-careers.json'), 'utf8'));
// The partial file carries 35 QIDs the main snapshot is missing; main wins.
const PARTIAL = JSON.parse(readFileSync(join(ROOT, 'scripts/_mystery-careers.partial.json'), 'utf8'));
for (const [qid, spells] of Object.entries(PARTIAL)) if (!CAREERS[qid]) CAREERS[qid] = spells;

// ⚠️ WIKIDATA CAREER HOLES, hand-verified on the first run (audit the
// auditors: every entry below was a FALSE ACCUSATION against a correct
// question, because the snapshot's last recorded spell is years before the
// player's real career end). Same contract as ACCEPTED in
// verify-trail-careers.mjs: one line of WHY per entry, keyed by QID.
const DATA_HOLES = {
  Q295887: { end: 2007, why: 'Vítor Baía — snapshot ends 2002; he was Porto\'s GK through the 2004 UCL win and retired 2007. Flagged him on the Euro 2004/WC 2006 Ricardo questions.' },
  Q17507: { end: 2022, why: 'Gerard Piqué — snapshot ends 2019 (a national-team row); played for Barcelona until Nov 2022. Flagged him on the 2021 Ramos-to-PSG question.' },
  Q45900: { end: 2023, why: 'Fabio Quagliarella — snapshot ends 2016; played Serie A for Sampdoria until 2023 and won the 2018-19 capocannoniere.' },
  Q3637942: { active: true, why: 'Ben Mee — snapshot ends 2012; played for Burnley until 2022 then Brentford. Flagged him on Burnley\'s 2017 record sale (Michael Keane).' },
  Q1101455: { active: true, why: 'Neal Maupay — snapshot ends 2015; Brentford/Brighton/Everton/Marseille since. Flagged him on Brentford\'s 2020 record sale (Ollie Watkins).' },
  Q191885: { end: 2019, why: 'Thiago Motta — snapshot ends 2018; played for PSG until May 2019. Puts his Euro 2020 flag under the 2-year threshold, where it belongs.' },
  Q350489: { end: 2011, why: 'Cristiano Doni — snapshot ends 2006; captained Atalanta until his 2011 ban. Falsely flagged the KEYED ANSWER of the 2010-11 Serie B question.' },
  Q285684: { active: true, why: 'Marten de Roon — snapshot ends 2016 (misses his 2017 Atalanta return; he is their captain). Flagged him on the 2024 Koopmeiners sale, where he is a PERFECT era-true distractor.' },
};

// A spell with end:null is an OPEN spell — the player is active and can never
// be era-flagged. So is a future-dated end (one Wikidata row runs to 2028: a
// contract end, not a career fact). Spells include national and youth teams;
// taking the max over all of them is deliberate — any recorded football
// activity in year Y makes the player era-plausible for year Y.
const pool = [];
const byExact = new Map();
for (const p of CORE) {
  const spells = CAREERS[p.id];
  if (!spells || !spells.length) continue; // Camus/Connery/Bohr: famous, careerless, not footballers
  let active = false; let end = 0;
  for (const s of spells) {
    if (s.end == null || s.end > THIS_YEAR) { active = true; break; }
    if (s.end > end) end = s.end;
  }
  const hole = DATA_HOLES[p.id];
  if (hole) { if (hole.active) active = true; else if (hole.end > end) end = hole.end; }
  const entry = { id: p.id, name: NAME_OVERRIDES[p.id] ?? p.name, fame: p.fame, active, end };
  pool.push(entry);
  const k = normaliseName(entry.name);
  if (!byExact.has(k)) byExact.set(k, []);
  byExact.get(k).push(entry);
}
// Every trailing run of name parts → bearers ("ligt", "de ligt", "van dijk"),
// so a bare-surname option can gather ALL the players it might denote.
const bySuffix = new Map();
for (const entry of pool) {
  const parts = normaliseName(entry.name).split(' ');
  for (let i = Math.max(0, parts.length - 3); i < parts.length; i += 1) {
    const suf = parts.slice(i).join(' ');
    if (!bySuffix.has(suf)) bySuffix.set(suf, []);
    bySuffix.get(suf).push(entry);
  }
}

// ── Person-name shape (kept from audit-distractor-plausibility.mjs) ─────────
// 1-3 words, no conjunction/list, no all-numeric token — "R9" survives, "1962"
// and "Scholes & Cole" do not.
const words = (s) => String(s).split(/[\s'’.-]+/).filter(Boolean);
const isPersonName = (s) => {
  const t = String(s).trim();
  if (/[&,—]|\band\b/.test(t)) return false;
  const w = words(t);
  if (!w.length || w.length > 3) return false;
  if (w.some((x) => /^\d+$/.test(x))) return false;
  return w.every((x) => /^[A-ZÀ-Ý]/.test(x) || x.length <= 2);
};

// ── Stem classification ──────────────────────────────────────────────────────
// "As of 2026, …" is a freshness anchor, not an event year — q_c861b3 asks a
// pure history question under a 2026 anchor and Carrick is a fine distractor
// there. Strip the anchor before extracting years.
const ANCHOR = /\bas of (?:19|20)\d{2}\b,?/gi;
const YEAR = /\b(19[5-9]\d|20[0-2]\d)\b/g;

// Skip outright: the options in a manager/coach stem are people in NON-PLAYING
// roles, so "career ended years ago" is true of every correct option too —
// Lampard is an excellent distractor for a 2020-21 manager question.
const NON_PLAYING = /\b(manager|managed|managerial|coach(?:e[sd]|ing)?|boss|caretaker|pundit|president|chairman|director|masterminded|in charge|who said)\b/i;

// "Which club …" stems offer CLUBS as options, and club names collide with
// player surnames — the first run matched "Roma" to Flavio Roma and "Napoli"
// to Fernando De Napoli on five separate which-club questions.
const CLUB_OPTIONS_STEM = /\bwhich [a-z ]*club\b/i;

// Demotions — each one soft doubt, not a veto.
const PAST_MARKER = /\b(retire[ds]?|retirement|retiring|legend(?:s|ary)?|histor(?:y|ic|ical)|all[- ]time|of all time|former|hall of fame|inducted|veteran|statue|named after|tribute|honou?red|testimonial|farewell)\b/i;
const AWARD_STEM = /\b(award|ballon d'or|voted|vote|player of the (?:year|season|month)|inducted)\b/i;
// Any record stem, not just "whose record": prior record-holders are the
// CONVENTIONAL distractors for "who set the record in <year>" (Shearer and
// Cole on the Haaland 36-goal question) — era-bounded by construction, and
// whether they are too easy is an editorial call, not a defect.
const RECORD_STEM = /\brecord\b/i;
const CAREER_EVENT = /\b(sold|sale|sign(?:ed|ing)|transfer(?:red|s)?|joined|joining|moved|move|loan(?:ed)?|fee|bought|departure|left for|scored|scoring|goal|assist|penalt|shootout|played|start(?:ed|ing)|line[- ]?up|captain(?:ed)?|substitut|hat[- ]?trick|appearance|debut|won|winner|wore|arrived)\b/i;

// ── Option → era verdict ─────────────────────────────────────────────────────
// Single-word options ("Ronaldo", "Müller", "Coutinho", "Marcos") are the
// Ferran-Torres trap generalised: exactly one pool player may CARRY that
// exact label, but the option denotes whoever the reader thinks of. The first
// run's worst noise was "Ronaldo" resolving to R9 (end 2011) on eleven stems
// that all meant the active Cristiano. So a single word gathers EVERY bearer
// — exact label plus anyone whose surname-suffix matches — and only flags if
// every one of them was era-impossible. Multi-word options must match a full
// name exactly or not at all (Abedi Pelé is not Pelé).
// Returns null (no flag) or { end, demotions, player }.
function resolveEraMiss(opt, eventYear) {
  const q = normaliseName(opt);
  const demotions = [];
  let candidates;
  if (!q.includes(' ')) {
    const exact = byExact.get(q) ?? [];
    // First-token bearers too: Spanish nickname-first names invert the surname
    // convention — Atlético's Juanfran is labelled "Juanfran Torres", so his
    // mononym is a LEADING token the suffix index can't see, and missing him
    // flagged both a correct distractor and a correct KEYED ANSWER. Wider
    // bearer sets only ever SUPPRESS flags, so this costs no precision.
    const firstToken = pool.filter((p) => normaliseName(p.name).split(' ')[0] === q);
    const bearers = new Set([...exact, ...(bySuffix.get(q) ?? []), ...firstToken]);
    if (!bearers.size) return null;
    candidates = [...bearers];
    if (candidates.length > 1) demotions.push(`short-name option — ${candidates.length} bearers, era-tested against ALL of them`);
    else if (!exact.length) demotions.push('surname-only match');
  } else {
    candidates = byExact.get(q) ?? [];
    if (!candidates.length) return null;
    if (candidates.length > 1) demotions.push(`ambiguous exact name (${candidates.length} players)`);
  }
  // One era-plausible bearer anywhere means no free elimination existed.
  // end >= eventYear-1 is the same 2-year threshold from the other side.
  if (candidates.some((c) => c.active || c.end >= eventYear - 1)) return null;
  const end = Math.max(...candidates.map((c) => c.end));
  if (end >= THIS_YEAR - 3) demotions.push(`career end ${end} is near the data horizon — Wikidata may lag a real retirement`);
  const named = candidates.filter((c) => c.end === end);
  return { end, demotions, player: named[0].name };
}

// ── The check itself, as a function so the self-test can feed it a known row ─
export function checkQuestion(q) {
  const out = [];
  if (!Array.isArray(q.o) || q.o.length < 2) return out;
  const answer = q.o[q.a]; // ALWAYS resolve o[a] — `a` is an index, not the answer
  if (answer == null) return out;
  const stem = String(q.q || '').replace(ANCHOR, '');
  if (NON_PLAYING.test(stem) || CLUB_OPTIONS_STEM.test(stem)) return out;
  const years = [...stem.matchAll(YEAR)].map((m) => +m[1]);
  if (!years.length) return out;
  const eventYear = Math.max(...years);

  const stemDemotions = [];
  if (years.length > 1) stemDemotions.push('multi-year stem — anchor ambiguity, may be era-bounded by construction');
  if (PAST_MARKER.test(stem)) stemDemotions.push('past-oriented stem (retired/legend/history wording)');
  if (AWARD_STEM.test(stem)) stemDemotions.push('award/vote stem — retired players can be legitimate');
  if (RECORD_STEM.test(stem)) stemDemotions.push('record stem — prior record-holders are conventional distractors');
  if (!CAREER_EVENT.test(stem)) stemDemotions.push('no on-career event verb in stem');

  for (const opt of q.o) {
    if (opt === answer || !isPersonName(opt)) continue;
    const miss = resolveEraMiss(opt, eventYear);
    if (!miss) continue;
    const demotions = [...stemDemotions, ...miss.demotions];
    const confidence = demotions.length === 0 ? 'HIGH' : demotions.length === 1 ? 'MEDIUM' : 'LOW';
    out.push({
      id: q.id, cat: q.cat, opt, answer, eventYear, careerEnd: miss.end, gap: eventYear - miss.end,
      confidence, demotions, isAnswer: false, stem: q.q, player: miss.player,
    });
  }

  // The keyed answer failing the same test is a different, worse class — a
  // factual error, not a plausibility one. Reported separately, never mixed in.
  if (isPersonName(answer)) {
    const miss = resolveEraMiss(answer, eventYear);
    if (miss && !stemDemotions.length && !miss.demotions.length) {
      out.push({ id: q.id, cat: q.cat, opt: answer, answer, eventYear, careerEnd: miss.end, gap: eventYear - miss.end, confidence: 'ANSWER', demotions: [], isAnswer: true, stem: q.q, player: miss.player });
    }
  }
  return out;
}

// ── Self-test: the detector must catch the row it was built for ──────────────
// q_4775c2's OLD options (pre-3190c7a). Carrick (end 2018, gap 5) must flag at
// HIGH. Noble (end 2022, gap 1) is BELOW the 2-year threshold by design — that
// near-miss is asserted too, so a future threshold change is a conscious one.
// Per feedback_verify_detector_output: a detector's first run is a hypothesis,
// and a zero from an unverified detector is worthless.
{
  const known = {
    id: 'q_4775c2-OLD', cat: 'Transfers',
    q: "In 2023 which academy-graduate midfielder was sold to Arsenal in West Ham's biggest-ever sale?",
    o: ['Michael Carrick', 'Mark Noble', 'Declan Rice', 'Tomas Soucek'], a: 2,
  };
  const hits = checkQuestion(known);
  const carrick = hits.find((h) => h.opt === 'Michael Carrick');
  if (!carrick) { console.error('SELF-TEST FAILED: Michael Carrick (retired 2018) not flagged on the 2023 stem. Do not trust this run.'); process.exit(2); }
  if (carrick.confidence !== 'HIGH') { console.error(`SELF-TEST FAILED: Carrick flagged at ${carrick.confidence}, expected HIGH (demotions: ${carrick.demotions.join(' · ')})`); process.exit(2); }
  if (hits.find((h) => h.opt === 'Mark Noble')) { console.error('SELF-TEST FAILED: Mark Noble (end 2022, gap 1) flagged — the 2-year threshold has drifted.'); process.exit(2); }
  if (hits.find((h) => h.opt === 'Tomas Soucek' || h.opt === 'Declan Rice')) { console.error('SELF-TEST FAILED: an era-true option flagged.'); process.exit(2); }
  console.log('self-test: q_4775c2 old row — Carrick flagged HIGH, Noble under threshold, Soucek/Rice clean ✓\n');
}

// ── Sweep ────────────────────────────────────────────────────────────────────
const findings = QB.flatMap(checkQuestion).filter((f) => !f.id.endsWith('-OLD'));
const by = (c) => findings.filter((f) => f.confidence === c);

const show = (rows, cap) => {
  for (const f of rows.slice(0, cap)) {
    console.log(`  ${f.id} [${f.cat}] stem-year ${f.eventYear} · "${f.opt}"${f.player && f.player !== f.opt ? ` (= ${f.player})` : ''} last recorded ${f.careerEnd} (gap ${f.gap})`);
    console.log(`     ${f.stem}`);
    if (f.demotions.length) console.log(`     demoted: ${f.demotions.join(' · ')}`);
  }
  if (rows.length > cap) console.log(`  … ${rows.length - cap} more (rerun with --all or --json)`);
};

const CAP = showAll ? Infinity : 40;
const answers = by('ANSWER');
if (answers.length) {
  console.log(`⚠️  KEYED ANSWER predates the stem year — possible factual error, check first  (${answers.length})`);
  show(answers, CAP);
  console.log('');
}
console.log(`HIGH — clean single-year career-event stem, exact unique name, career over 2+ years earlier  (${by('HIGH').length})`);
show(by('HIGH'), CAP);
console.log(`\nMEDIUM — one soft doubt  (${by('MEDIUM').length})`);
show(by('MEDIUM'), CAP);
console.log(`\nLOW — two or more soft doubts, read the question before believing it  (${by('LOW').length})`);
show(by('LOW'), showAll ? Infinity : 15);

console.log(`\n${QB.length} questions scanned · pool ${pool.length} players with career data · ${findings.length} findings`);
console.log('\n⚠️ Findings are prompts to go and look, not edits to apply. The fix is an');
console.log('   era-true replacement that still fits the stem\'s qualifier yet is wrong');
console.log('   (see q_4775c2 → Paquetá/Ward-Prowse). Keep answer string and index');
console.log('   unchanged where the question feeds the frozen Daily 7 schedule.');
if (jsonAt) { writeFileSync(jsonAt, `${JSON.stringify(findings, null, 1)}\n`); console.log(`wrote ${jsonAt}`); }
