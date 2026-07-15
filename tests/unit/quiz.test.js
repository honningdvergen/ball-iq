import { describe, it, expect } from 'vitest'
import { seededShuffle, pickDailyQuestions, DAILY_SEED_MULTIPLIER } from '../../src/lib/quiz.js'

// A stand-in bank. Deliberately not the real 4k questions — this pins the
// ALGORITHM, which must hold for any bank.
const mkBank = (n = 300) =>
  Array.from({ length: n }, (_, i) => ({
    id: `q_${i}`,
    type: i % 20 === 0 ? 'tf' : 'mcq',        // some non-MCQ, to prove filtering
    cat: i % 25 === 0 ? 'Legends' : 'PL',      // some Legends, to prove gating
    o: ['a', 'b', 'c', 'd'],
    a: 0,
  }))

const DAY = 20648 // ~2026-07-15

describe('seededShuffle', () => {
  it('is deterministic for a given seed', () => {
    expect(seededShuffle([...Array(50).keys()], 12345)).toEqual(seededShuffle([...Array(50).keys()], 12345))
  })

  it('produces a different order for a different seed', () => {
    expect(seededShuffle([...Array(50).keys()], 1)).not.toEqual(seededShuffle([...Array(50).keys()], 2))
  })

  it('is a permutation — never drops or duplicates', () => {
    const input = [...Array(100).keys()]
    const out = seededShuffle(input, 999)
    expect(out).toHaveLength(input.length)
    expect([...out].sort((x, y) => x - y)).toEqual(input)
  })

  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5]
    seededShuffle(input, 7)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('pickDailyQuestions', () => {
  it('returns exactly 7', () => {
    expect(pickDailyQuestions(mkBank(), DAY)).toHaveLength(7)
  })

  it('is MCQ-only and excludes Legends', () => {
    for (const q of pickDailyQuestions(mkBank(), DAY)) {
      expect(q.type).toBe('mcq')
      expect(q.cat).not.toBe('Legends')
    }
  })

  it('never repeats a question within a day', () => {
    expect(new Set(pickDailyQuestions(mkBank(), DAY).map((q) => q.id)).size).toBe(7)
  })

  it('gives different questions on different days', () => {
    const bank = mkBank()
    expect(pickDailyQuestions(bank, DAY).map((q) => q.id))
      .not.toEqual(pickDailyQuestions(bank, DAY + 1).map((q) => q.id))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// THE REGRESSION GUARDS.
//
// These exist because a first cut of this file had two tests that CANNOT FAIL,
// verified by mutation: reintroducing the Math.sin comparator passed 13/13, and
// smuggling a per-device seen-filter back in as `seen = []` also passed 13/13
// (Function.length stops counting at the first default parameter, so the arity
// check was structurally incapable of failing). Both guards below are
// mutation-checked: they DO fail when the real bug is reintroduced.
// ─────────────────────────────────────────────────────────────────────────────
describe('pickDailyQuestions — regression guards', () => {
  // GUARD 1 — the iOS-vs-Android split.
  //
  // Selection used to sort on Math.sin, which the ECMAScript spec permits engines
  // to approximate. 137/3000 values differ between JavaScriptCore (iOS, Safari)
  // and V8 (Android, Chrome) — enough to flip comparator signs and hand iOS and
  // Android players DIFFERENT questions on the same date, silently, for months.
  //
  // A "same inputs, same output" test can't catch this: Math.sin is perfectly
  // deterministic within one engine, and vitest only runs V8. So instead we FREEZE
  // the expected output. Any change to the algorithm — float maths, a different
  // shuffle, a reordered filter — moves these ids and fails here.
  //
  // If this test fails after an INTENTIONAL algorithm change, understand that you
  // are also changing which questions every past and future day serves.
  it('matches the frozen selection for a known day (golden)', () => {
    expect(pickDailyQuestions(mkBank(), DAY).map((q) => q.id))
      .toEqual(['q_108', 'q_44', 'q_278', 'q_271', 'q_113', 'q_243', 'q_267'])
  })

  it('matches the frozen selection for the following day (golden)', () => {
    expect(pickDailyQuestions(mkBank(), DAY + 1).map((q) => q.id))
      .toEqual(['q_223', 'q_59', 'q_217', 'q_83', 'q_213', 'q_45', 'q_76'])
  })

  // GUARD 2 — no float-approximated maths anywhere in the selection path.
  // The first version of this only inspected seededShuffle, so a mutation that
  // put Math.sin in pickDailyQuestions sailed through. Check BOTH.
  it('uses no engine-approximated maths in either function', () => {
    const forbidden = /Math\.(sin|cos|tan|random|pow|exp|log|atan|asin|acos)/
    expect(seededShuffle.toString()).not.toMatch(forbidden)
    expect(pickDailyQuestions.toString()).not.toMatch(forbidden)
  })

  // GUARD 3 — no per-device state can influence selection.
  //
  // The original bug: selection ran through applySeenFilter, which reads a
  // device-local 14-day play history — so two players with different histories
  // got different questions while /c/ challenge links compared their scores as if
  // they'd played the same quiz.
  //
  // Arity checks don't work here (Function.length ignores defaulted params). So
  // instead: pass extra arguments and assert they're IGNORED. If someone adds a
  // `seen` parameter — defaulted or not — this fails the moment anything is
  // passed for it, which is the only way the bug can actually bite.
  it('ignores any extra argument — selection is (bank, day) and nothing else', () => {
    const bank = mkBank()
    const baseline = pickDailyQuestions(bank, DAY).map((q) => q.id)
    // Every shape a resurrected seen-filter might arrive in:
    expect(pickDailyQuestions(bank, DAY, ['q_108', 'q_44', 'q_278']).map((q) => q.id)).toEqual(baseline)
    expect(pickDailyQuestions(bank, DAY, new Set(['q_108', 'q_44'])).map((q) => q.id)).toEqual(baseline)
    expect(pickDailyQuestions(bank, DAY, { seen: ['q_108'] }).map((q) => q.id)).toEqual(baseline)
  })

  it('is order-independent — no hidden state accumulates between calls', () => {
    const bank = mkBank()
    const first = pickDailyQuestions(bank, DAY).map((q) => q.id)
    pickDailyQuestions(bank, DAY + 1)
    pickDailyQuestions(bank, DAY - 5)
    pickDailyQuestions(bank, DAY + 99)
    expect(pickDailyQuestions(bank, DAY).map((q) => q.id)).toEqual(first)
  })

  it('pins the seed multiplier — changing it reshuffles every past and future day', () => {
    expect(DAILY_SEED_MULTIPLIER).toBe(1013904223)
  })
})
