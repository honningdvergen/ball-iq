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
  answerIdForDay, MYSTERY_ANCHOR_DAY,
} from '../../src/lib/mysteryPlayer.js';
import pool from '../../src/data/mysteryPool.json';

const byName = (n) => pool.find((p) => p.name === n);

describe('mystery player pool', () => {
  it('every player carries the five attributes the game compares on', () => {
    const broken = pool.filter((p) => !p.name || !p.club || !p.slot || !p.nat || !p.dob);
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
      'Jude Bellingham', 'Haaland', 'Kylian Mbappé', 'Vinícius Júnior', 'Rodri',
      'Donnarumma', 'Pickford', 'de Ligt', 'Isak', 'Gavi',
    ];
    const missing = household.filter((n) => !matchGuess(pool, n));
    expect(missing).toEqual([]);
  });

  it('holds nobody implausibly old for a current squad', () => {
    // Ze Roberto (b. 1974) and Steve Harper (b. 1975) both survived the first
    // filter pass because their memberships were never end-dated.
    const old = pool.filter((p) => p.born < 1988);
    expect(old.map((p) => `${p.name} ${p.born}`)).toEqual([]);
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
