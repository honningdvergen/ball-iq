import { describe, it, expect } from 'vitest';
import {
  TRAIL_ANCHOR_DAY,
  TRAIL_ANSWER_LOG,
  getTrailAnswerForDayIndex,
  guessMatchesPlayer,
} from '../../src/lib/trail.js';

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
 * Whichever way a name happened to be stored, one of the two forms a human
 * would actually type was refused. Five players in the schedule were affected.
 *
 * Trail attempts are limited, so this is not a cosmetic annoyance: it spends a
 * guess belonging to someone who got it right. Deliberately generous — a mode
 * about football knowledge should never test how we store a name.
 */
describe('Trail accepts every natural form of an answer', () => {
  const players = [...new Set(TRAIL_ANSWER_LOG)]
    .map((k) => getTrailAnswerForDayIndex(TRAIL_ANCHOR_DAY + TRAIL_ANSWER_LOG.indexOf(k)))
    .filter((p) => p && Array.isArray(p.display));

  it('has a schedule to check', () => {
    expect(players.length).toBeGreaterThan(50);
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
