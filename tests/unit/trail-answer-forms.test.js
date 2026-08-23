import { describe, it, expect } from 'vitest';
import {
  TRAIL_ANCHOR_DAY,
  TRAIL_ANSWER_LOG,
  TRAIL_PLAYERS,
  getTrailAnswerForDayIndex,
  guessMatchesPlayer,
} from '../../src/lib/trail.js';
import POOL from '../../src/data/mysteryPool.json';

/**
 * A player who knows the answer must never lose an attempt to our storage format.
 *
 * ⚠️ PLAYER-REPORTED, 2026-08-22: a surname was marked wrong while the full
 * name was marked right. The cause was not the matcher — it was that `display`
 * splits names inconsistently. The particle rides with the forename for some
 * players and with the surname for others:
 *
 *     ["David de", "Gea"]        →  "de Gea" was rejected
 *     ["Virgil", "van Dijk"]     →  "Dijk"   was rejected
 *     ["Kevin", "De Bruyne"]     →  "Bruyne" was rejected
 *
 * ⚠️ AND AGAIN, 2026-08-23, on the LIVE daily: "Son Heung-min" was rejected on
 * his own puzzle. The version of this file written on 08-22 was green over that
 * bug the whole time, because it built its expected strings from
 * `p.display.join(' ')` — the very field whose ordering was wrong. It asked
 * "does the app accept the name in the order we happened to store it?", which
 * is true by construction. A guard derived from the suspect field cannot fail.
 *
 * So the contract is now stated against an INDEPENDENT source:
 *
 *     Anything the in-game autocomplete can offer for this player
 *     must be accepted as an answer for this player.
 *
 * TransferTrail.jsx feeds `rankPlayerSuggestions(POOL, …)` from
 * mysteryPool.json, so that file — not `display` — is the source of truth for
 * what a player can physically tap. Tapping the app's own first suggestion and
 * being marked wrong is the worst failure this mode has.
 */

const norm = (s) => String(s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Names are the same human regardless of the order the parts are stored in. */
const tokenKey = (s) => norm(s).split(' ').filter(Boolean).sort().join(' ');

const poolByTokens = new Map();
for (const entry of POOL) {
  if (entry?.name) poolByTokens.set(tokenKey(entry.name), entry.name);
}

describe('Trail accepts every natural form of an answer', () => {
  const players = [...new Set(TRAIL_ANSWER_LOG)]
    .map((k) => getTrailAnswerForDayIndex(TRAIL_ANCHOR_DAY + TRAIL_ANSWER_LOG.indexOf(k)))
    .filter((p) => p && Array.isArray(p.display));

  it('has a schedule to check', () => {
    expect(players.length).toBeGreaterThan(50);
  });

  it('accepts the exact name the autocomplete offers', () => {
    // The load-bearing test. Independent of `display` in both directions: the
    // expected string comes from the pool, and the lookup is order-insensitive
    // so a reversed `display` cannot hide the player from this check.
    const rejected = [];
    let checked = 0;
    for (const p of players) {
      const offered = poolByTokens.get(tokenKey(p.display.join(' ')));
      if (!offered) continue; // mononyms — covered by the coverage floor below
      checked += 1;
      if (!guessMatchesPlayer(offered, p)) {
        rejected.push(`${p.key}: autocomplete offers "${offered}", game rejects it`);
      }
    }
    expect(rejected, `\n  ${rejected.join('\n  ')}\n`).toEqual([]);
    // ⚠️ A zero above is only meaningful if the check could see anything. If a
    // pool rename or a shape change silently stops matching, `rejected` goes
    // empty for the wrong reason — the exact failure mode this file exists to
    // stop. So assert the check kept its eyes.
    expect(checked, 'pool lookup matched almost nothing — the check went blind')
      .toBeGreaterThan(players.length * 0.9);
  });

  it('accepts the full name, the bare surname, and particle+surname', () => {
    const rejected = [];
    for (const p of players) {
      const whole = p.display.join(' ').trim();
      const words = whole.split(/\s+/);
      const forms = new Set([whole, words[words.length - 1]]);
      if (words.length >= 3) forms.add(words.slice(-2).join(' '));
      for (const form of forms) {
        if (!guessMatchesPlayer(form, p)) rejected.push(`${whole} — typing "${form}"`);
      }
    }
    expect(rejected, `\n  ${rejected.join('\n  ')}\n`).toEqual([]);
  });

  it('accepts EITHER name part on its own, whichever order it is stored in', () => {
    // The generalisation of the Son bug. `acceptedNamesFor` derives the surname
    // as the LAST word, which is backwards for names stored in East Asian order
    // — "Son Heung-min" yielded the given name and refused "Son", the only
    // thing anyone actually says. Any future entry in native order fails here.
    const rejected = [];
    for (const p of players) {
      const parts = norm(p.display.join(' ')).split(' ').filter(Boolean);
      if (parts.length < 2) continue;
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (!guessMatchesPlayer(first, p) && !guessMatchesPlayer(last, p)) {
        rejected.push(`${p.key}: neither "${first}" nor "${last}" is accepted`);
      }
    }
    expect(rejected, `\n  ${rejected.join('\n  ')}\n`).toEqual([]);
  });

  it('has no undocumented duplicate of the same human in the roster', () => {
    // Two keys for one person means that person can be scheduled twice in a
    // cycle, and it is how the Son entries drifted into opposite orders in the
    // first place — nothing was comparing them.
    //
    // ⚠️ This allowlist must SHRINK, never grow. HEUNGMIN/SON is a real
    // duplicate left in place deliberately: TRAIL_ANSWER_LOG is frozen and
    // gives all 102 keys exactly 4 days each, so merging would hand Son 8 of
    // 408 days. The fix is a 102nd distinct player with verified career data
    // in HEUNGMIN's slot — tracked in docs/TODO.md.
    const KNOWN = [['HEUNGMIN', 'SON']];
    const allowed = new Set(KNOWN.map((g) => [...g].sort().join('+')));

    const byHuman = new Map();
    for (const p of TRAIL_PLAYERS) {
      const k = tokenKey((p.display || []).join(' '));
      if (!byHuman.has(k)) byHuman.set(k, []);
      byHuman.get(k).push(p.key);
    }
    const dupes = [...byHuman.values()]
      .filter((keys) => keys.length > 1)
      .map((keys) => [...keys].sort().join('+'))
      .filter((sig) => !allowed.has(sig));

    expect(dupes, `\n  undocumented duplicates: ${dupes.join(', ')}\n`).toEqual([]);
  });

  it('still rejects a different player with the same surname', () => {
    // Generosity has a floor: accepting every surname form must not turn into
    // accepting anybody. Xabi Alonso is in the schedule and the pool holds six
    // other Alonsos.
    const xabi = players.find((p) => p.display.join(' ') === 'Xabi Alonso');
    expect(xabi, 'Xabi Alonso should be in the schedule').toBeTruthy();
    expect(guessMatchesPlayer('Alonso', xabi)).toBe(true);
    expect(guessMatchesPlayer('Marcos Alonso Mendoza', xabi)).toBe(false);
    expect(guessMatchesPlayer('Diego Alonso', xabi)).toBe(false);
  });
});

describe('return spells are labelled, not silently repeated', () => {
  // ⚠️ THE TWO MOST-REPORTED CAREERS IN question_reports — Alonso (3 reports)
  // and Flamini (3) — are exactly the two whose puzzles show the same club
  // twice, and BOTH are Wikipedia-verified correct (verify-trail-careers.mjs
  // lists Alonso's Eibar loan-return as an accepted divergence; Flamini's
  // second Arsenal spell matches his infobox). Players who don't know the
  // history see a duplicate club and report the career as wrong. The fix is a
  // "↩ return" chip on any rung whose club already appeared above it; this
  // pins the predicate the chip uses, against the real roster data.
  const returnIndexes = (clubs) =>
    clubs.map((c, i) => (clubs.slice(0, i).includes(c) ? i : -1)).filter((i) => i >= 0);

  it('fires exactly on the documented return spells', () => {
    const flamini = TRAIL_PLAYERS.find((p) => p.key === 'FLAMINI');
    // Marseille, Arsenal, AC Milan, Arsenal(return), Crystal Palace, Getafe
    expect(returnIndexes(flamini.clubs)).toEqual([3]);
    const alonso = TRAIL_PLAYERS.find((p) => p.key === 'ALONSO');
    expect(alonso, 'ALONSO missing from roster').toBeTruthy();
    expect(returnIndexes(alonso.clubs).length).toBeGreaterThan(0);
  });

  it('never fires on a career with no repeats', () => {
    const son = TRAIL_PLAYERS.find((p) => p.key === 'SON');
    expect(returnIndexes(son.clubs)).toEqual([]);
  });

  it('only looks BACKWARDS, so an unrevealed future spell cannot leak', () => {
    // The rows render progressively (one per miss); slice(0, i) must reference
    // only already-revealed rungs. A forward-looking check would put "return"
    // on the FIRST Arsenal rung and spoil that a comeback is coming.
    const flamini = TRAIL_PLAYERS.find((p) => p.key === 'FLAMINI');
    expect(returnIndexes(flamini.clubs)).not.toContain(1);
  });
});
