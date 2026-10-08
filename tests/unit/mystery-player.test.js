// ⚠️ POOL DATA-QUALITY SUITES SUSPENDED (2026-08-11) while Mystery Player is
// PULLED (MYSTERY_ENABLED=false). These suites assert properties of
// mysteryPool.json that are KNOWN-FALSE today — that is WHY the mode is
// pulled (squad fillers, wrong-era entries). They were failing honestly, not
// flakily. UN-SKIP all three describe.skip blocks as part of the Mystery
// relaunch (board: Who-Are-Ya format + pool rebuild) — the relaunch is not
// done until they pass. Engine tests (matchGuess, normaliseName, persistence)
// remain active below.
import { describe, it, expect } from 'vitest';
import {
  similarity, rankPool, bandFor, matchGuess, normaliseName,
  answerIdForDay, MYSTERY_ANCHOR_DAY, hintPosition, withArticle,
} from '../../src/lib/mysteryPlayer.js';
import { clubLabel, suggestionSubtitle } from '../../src/lib/playerSearch.js';
import roles from '../../src/data/mysteryRoles.json';
import schedule from '../../src/data/mysterySchedule.json';
import pool from '../../src/data/mysteryPool.json';
import answers from '../../src/data/mysteryAnswers.json';

const byName = (n) => pool.find((p) => p.name === n);

describe('mystery player pool', () => {
  it('every player carries the five attributes the game compares on', () => {
    // ⚠️ dob OR born. This asserted `!p.dob` outright, against a schema the
    // pool did not have — which is how the missing field went unnoticed while
    // the suite sat suspended. The backfill now covers 8,479 of 8,489; the
    // last 10 are upstream entries with only year precision (six of them
    // "born 2000" with no day), and similarity() has an explicit, documented
    // year fallback on the same exponential curve for exactly this case.
    // Dropping them instead would mean refusing real footballers as GUESSES,
    // which this game must never do.
    const broken = pool.filter((p) => !p.name || !p.club || !p.slot || !p.nat || !(p.dob || p.born));
    expect(broken.map((p) => p.name)).toEqual([]);
  });

  it('nobody appears at two clubs', () => {
    // Wikidata records a transfer before an editor closes the old membership,
    // so the raw snapshot had 52 of these — Rashford at BOTH Man Utd and
    // Barcelona. An ambiguous answer would make the game unwinnable.
    const seen = new Map();
    for (const p of pool) {
      expect(seen.has(p.id), `${p.name} appears twice`).toBe(false);
      seen.set(p.id, p.club);
    }
  });

  it('lets a fan guess the household names by the name they would type', () => {
    // ⚠️ THIS IS AN UPSTREAM-VANDALISM GUARD, not a spelling test.
    //
    // The pool is generated from Wikidata, so the names we render are editable
    // by anyone, with no review step between a wiki edit and a live daily
    // puzzle — and the same strings ship inside the iOS and Android binaries.
    //
    // Jude Bellingham was in the pool as "Jude Belligoal" for two days. A
    // player typing "Bellingham" was told no such player existed, and because
    // searching our own data for "Bellingham" also found nothing, it was
    // misdiagnosed as a MISSING player rather than a renamed one.
    //
    // Every name here is a player a football fan would expect to be able to
    // guess. A failure means either the pool lost them (a squad-query
    // regression) or someone upstream changed their name — check which before
    // reaching for scripts/_name-overrides.mjs.
    // ⚠️ Full names for Bellingham and Mbappé ON PURPOSE. The pool holds Jude
    // AND Jobe Bellingham, Kylian AND Ethan Mbappé, so those surnames are
    // genuinely ambiguous and matchGuess is right to refuse them — the
    // autocomplete is what disambiguates in the UI. Worth noting that while
    // Jude was mislabelled, "Bellingham" resolved cleanly... to Jobe.
    // 'de Ligt' stays as a bare multi-word surname: that one has exactly one
    // match and used to fail, because only the final name part was compared.
    const household = [
      // ⚠️ 'Erling Haaland' and 'Gianluigi Donnarumma' in FULL, for the same
      // reason as Bellingham and Mbappé above: the pool now also holds
      // Alf-Inge Haaland and Antonio Donnarumma, so those surnames became
      // genuinely ambiguous and matchGuess is RIGHT to refuse them. This is
      // the pool growing, not a regression — verified both pairs are present.
      'Jude Bellingham', 'Erling Haaland', 'Kylian Mbappé', 'Vinícius Júnior', 'Rodri',
      'Gianluigi Donnarumma', 'Pickford', 'de Ligt', 'Isak', 'Gavi',
    ];
    const missing = household.filter((n) => !matchGuess(pool, n));
    expect(missing).toEqual([]);
  });

  it('never schedules a non-footballer or an unguessable answer', () => {
    // ⚠️ REPLACES 'holds nobody implausibly old for a current squad', which
    // asserted the GUESS pool held nobody born before 1988. That encoded the
    // original current-squads-only model and is now wrong BY DESIGN: the guess
    // pool is deliberately inclusive and cross-era — Pelé, Maradona and Cruyff
    // are intended ANSWERS, and 5,283 entries predate 1988.
    //
    // The invariant that actually protects a player is about the ANSWER pool:
    // every daily puzzle must be someone a football fan can name. That is what
    // scripts/curate-mystery-answers.mjs enforces, and this is its guard.
    const answerSet = new Set(answers);
    const answerPlayers = pool.filter((p) => answerSet.has(p.id));
    expect(answerPlayers.length).toBe(answers.length);
    // Julio Iglesias and Niels Bohr both cleared the old fame gate because the
    // gate measured notability, and notability is not football fame.
    const notFootballers = answerPlayers
      .filter((p) => ['Niels Bohr', 'Julio Iglesias', 'Harald Bohr'].includes(p.name))
      .map((p) => p.name);
    expect(notFootballers).toEqual([]);
    // Every answer needs the attributes the ranking compares on, or its puzzle
    // silently loses a whole signal.
    const thin = answerPlayers.filter((p) => !p.club || !p.slot || !p.nat).map((p) => p.name);
    expect(thin).toEqual([]);
  });
});

describe('similarity', () => {
  it('scores a player closest to themselves', () => {
    const saka = byName('Bukayo Saka');
    const other = byName('Erling Haaland');
    expect(similarity(saka, saka)).toBeGreaterThan(similarity(other, saka));
  });

  it('ranks a team-mate above a foreign-league player', () => {
    const saka = byName('Bukayo Saka');
    const mate = byName('Declan Rice');
    const far = byName('Vinícius Júnior');
    expect(similarity(mate, saka)).toBeGreaterThan(similarity(far, saka));
  });

  it('separates players who match on every boolean, using age', () => {
    // The whole reason the age term is day-precise: without it these two tie
    // and the rank between them is alphabetical noise.
    const a = byName('Bukayo Saka');
    const mates = pool.filter((p) => p.club === a.club && p.slot === a.slot && p.id !== a.id);
    if (mates.length >= 2) {
      expect(similarity(mates[0], a)).not.toBe(similarity(mates[1], a));
    }
  });
});

describe('rankPool', () => {
  const answer = byName('Bukayo Saka');
  const ranks = rankPool(pool, answer);

  it('puts the answer at rank 1', () => {
    expect(ranks.get(answer.id)).toBe(1);
  });

  it('ranks every player exactly once', () => {
    expect(ranks.size).toBe(pool.length);
    expect(new Set(ranks.values()).size).toBe(pool.length);
  });

  it('is deterministic — same input, same ranks', () => {
    const again = rankPool(pool, answer);
    for (const [id, r] of ranks) expect(again.get(id)).toBe(r);
  });

  it('leaves few enough ties for the ordering to be explicable', () => {
    // Measured before the fix: 118 distinct scores / largest tie 86, i.e. ranks
    // 400-486 were alphabetical. This guards that regression.
    const scores = pool.map((p) => similarity(p, answer));
    const distinct = new Set(scores.map((s) => s.toFixed(6))).size;
    expect(distinct / pool.length).toBeGreaterThan(0.8);
  });
});

describe('bandFor', () => {
  it('calls rank 1 a win and a distant rank cold', () => {
    expect(bandFor(1, 1500)).toBe('win');
    expect(bandFor(1400, 1500)).toBe('cold');
  });
});

describe('matchGuess', () => {
  it('accepts an exact name, ignoring case and accents', () => {
    expect(matchGuess(pool, 'bukayo saka')?.name).toBe('Bukayo Saka');
    expect(matchGuess(pool, 'vinicius junior')?.name).toBe('Vinícius Júnior');
  });

  it('accepts an unambiguous surname', () => {
    expect(matchGuess(pool, 'Saka')?.name).toBe('Bukayo Saka');
  });

  it('refuses an AMBIGUOUS surname rather than guessing', () => {
    const bySurname = {};
    for (const p of pool) {
      const parts = normaliseName(p.name).split(' ');
      (bySurname[parts[parts.length - 1]] ||= []).push(p);
    }
    // ⚠️ Exclude surnames that are ALSO some player's FULL name: guessing
    // "ronaldo" correctly resolves to the player literally named Ronaldo (the
    // exact-match rule outranks ambiguity — that is intended, not a bug).
    // This test broke the day R9 entered the pool: it picked "ronaldo" as its
    // ambiguous case and asserted null against deliberate behaviour.
    const fullNames = new Set(pool.map((p) => normaliseName(p.name)));
    const shared = Object.entries(bySurname).find(([k, v]) => v.length > 1 && !fullNames.has(k));
    if (shared) expect(matchGuess(pool, shared[0])).toBeNull();
  });

  it('returns null for nonsense', () => {
    expect(matchGuess(pool, 'zzzz not a player')).toBeNull();
  });
});

describe('daily schedule', () => {
  it('reads the frozen log by day index', () => {
    const log = ['a', 'b', 'c'];
    expect(answerIdForDay(log, MYSTERY_ANCHOR_DAY)).toBe('a');
    expect(answerIdForDay(log, MYSTERY_ANCHOR_DAY + 2)).toBe('c');
  });

  it('returns null beyond the log instead of wrapping', () => {
    // Footle's modulo fallback silently rewrote every past answer when the
    // player list grew. Null means the card hides; a wrong answer would not.
    expect(answerIdForDay(['a'], MYSTERY_ANCHOR_DAY + 5)).toBeNull();
    expect(answerIdForDay(['a'], MYSTERY_ANCHOR_DAY - 1)).toBeNull();
  });
});

describe('the position a clue may print', () => {
  // `position` and `slot` are ranking tokens from Wikidata. Printed, they are
  // claims about a real player, and 47 of the 400 scheduled answers carried a
  // false or meaningless one (2026-10-08).
  it('prints a verified role over whatever the pool says', () => {
    const p = { id: 'Qx', slot: 'DF', position: 'midfielder' };
    expect(hintPosition(p, { Qx: 'full-back' })).toBe('full-back');
  });

  it('prints the pool word only when it sits in the line the slot says', () => {
    expect(hintPosition({ id: 'a', slot: 'DF', position: 'centre-back' })).toBe('centre-back');
    expect(hintPosition({ id: 'b', slot: 'GK', position: 'goalkeeper' })).toBe('goalkeeper');
    expect(hintPosition({ id: 'c', slot: 'FW', position: 'midfielder' })).toBeNull();
    expect(hintPosition({ id: 'd', slot: 'DF', position: 'forward' })).toBeNull();
  });

  it('never prints a word it does not recognise', () => {
    // "wing half" is Wikidata's label for a modern winger; "coach" was
    // Stoichkov's, and "running back" is not a football position at all.
    for (const position of ['wing half', 'coach', 'running back', '', undefined]) {
      expect(hintPosition({ id: 'e', slot: 'FW', position })).toBeNull();
    }
    expect(hintPosition(null)).toBeNull();
  });

  it('withholds the clue when the role is recorded as contested', () => {
    // null is a decision: the sources disagree, so nothing is printed even
    // though the pool's own word would have passed the line check.
    expect(hintPosition({ id: 'Qx', slot: 'FW', position: 'forward' }, { Qx: null })).toBeNull();
  });

  it('has a printable position for every scheduled answer, or a recorded reason for none', () => {
    const byId = new Map(pool.map((p) => [p.id, p]));
    const silent = schedule.filter((id) => !hintPosition(byId.get(id), roles) && roles[id] !== null);
    expect(silent.map((id) => byId.get(id)?.name)).toEqual([]);
  });

  it('only holds verified roles for players who exist, in words the clue can say', () => {
    const SAYABLE = new Set([
      'goalkeeper', 'defender', 'centre-back', 'full-back', 'midfielder', 'defensive midfielder',
      'attacking midfielder', 'winger', 'forward', 'striker', 'wing half',
    ]);
    const ids = new Set(pool.map((p) => p.id));
    for (const [id, role] of Object.entries(roles)) {
      expect(ids.has(id), `${id} is not in the pool`).toBe(true);
      expect(role === null || SAYABLE.has(role), `${id}: "${role}"`).toBe(true);
    }
  });

  it('picks the article by sound', () => {
    expect(withArticle('winger')).toBe('a winger');
    expect(withArticle('attacking midfielder')).toBe('an attacking midfielder');
  });
});

describe('the club printed under a name', () => {
  it('hides youth, reserve and college sides', () => {
    for (const club of [
      'Antiguoko', 'Real Madrid Castilla', 'Real Sociedad B', 'FC Bayern Munich II',
      'FC Barcelona Atlètic', 'Liverpool F.C. Reserves and Academy',
      "California Golden Bears women's soccer",
    ]) expect(clubLabel({ id: 'x', club }), club).toBe('');
  });

  it('keeps senior clubs whose names only look like reserve sides', () => {
    // The answer-eligibility regex in the scripts blanks all of these.
    for (const club of [
      'Willem II', 'Associação Académica de Coimbra – O.A.F.', 'Académico de Viseu FC',
      'Atalanta BC', 'Athletic Club', 'Atlético Madrid', 'Boca Juniors', 'BSC Young Boys',
      'Chelsea F.C. Women', 'Real Madrid',
    ]) expect(clubLabel({ id: 'x', club }), club).toBe(club);
  });

  it('hides a senior club from the one player who was only ever a boy there', () => {
    // Ruud Gullit left AFC DWS at sixteen; the label is fine on anyone else.
    const gullit = pool.find((p) => p.name === 'Ruud Gullit');
    expect(clubLabel(gullit)).toBe('');
    expect(clubLabel({ id: 'someone-else', club: gullit.club })).toBe(gullit.club);
    // A guess row saved before the fix holds only { id, name, club, rank, band }.
    expect(clubLabel({ id: gullit.id, name: gullit.name, club: gullit.club, rank: 40, band: 'warm' })).toBe('');
  });

  it('leaves the birth year to tell namesakes apart when the club is hidden', () => {
    expect(suggestionSubtitle({ id: 'x', born: 1981, club: 'Antiguoko' })).toBe('1981');
    expect(suggestionSubtitle({ id: 'x', born: 1987, club: 'Barcelona' })).toBe('1987 · Barcelona');
  });

  it('shows no youth or reserve side anywhere in the pool', () => {
    const NAMED_LIKE_ONE = /(castilla|atlètic$| b$| ii$|reserves|antiguoko|women's soccer)/i;
    const leaked = pool.filter((p) => NAMED_LIKE_ONE.test(clubLabel(p)) && clubLabel(p) !== 'Willem II');
    expect(leaked.map((p) => `${p.name}: ${p.club}`)).toEqual([]);
  });
});
