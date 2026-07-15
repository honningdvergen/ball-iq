import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { WORDLE_PLAYERS, getWordleAnswerForDayIndex, gradeWordleGuess } from '../../src/lib/wordle.js'

const DAY_MS = 86400000
const dayIndex = (y, m, d) => Math.floor(Date.UTC(y, m, d) / DAY_MS)
const ANCHOR = dayIndex(2026, 4, 4) // Footle #1

// Keys that deliberately differ from the displayed surname: famous nicknames,
// and keys that keep a particle the display name splits off (van Dijk -> "Dijk").
const INTENTIONAL_MISMATCHES = new Set([
  'GAZZA', 'CARRA', 'SHEVA',        // nicknames — you guess the nickname
  'VOELLER',                        // standard oe transliteration of Völler
  'VANDIJK', 'VANGAAL', 'DEROSSI',  // key keeps the particle
])

const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase()

describe('Footle answer pool', () => {
  // The bug this pins: the pool shipped SNIJDER while the app displayed
  // "Sneijder", and VERATTI while displaying "Verratti". Both puzzles were
  // literally unwinnable — anyone who knew the player typed the spelling the
  // app itself shows, and was marked wrong. Both scored 0 wins in prod.
  it('every puzzle key matches the surname the app displays', () => {
    const src = readFileSync(resolve(__dirname, '../../src/lib/wordle.js'), 'utf8')
    const pattern = /^ {2}([A-Z]+):\s*\["([^"]*)",\s*"([^"]+)"\]/gm
    const mismatches = []
    for (const [, key, , surname] of src.matchAll(pattern)) {
      if (INTENTIONAL_MISMATCHES.has(key)) continue
      if (norm(surname) !== key) mismatches.push(`${key} displays "${surname}"`)
    }
    expect(mismatches).toEqual([])
  })

  it('a correct guess of the answer grades all-green (every answer is winnable)', () => {
    for (const p of WORDLE_PLAYERS) {
      expect(gradeWordleGuess(p, p).every((c) => c === 'green'), `${p} is unwinnable`).toBe(true)
    }
  })

  it('has no duplicate answers', () => {
    expect(new Set(WORDLE_PLAYERS).size).toBe(WORDLE_PLAYERS.length)
  })

  it('every scheduled day resolves to a real pool entry', () => {
    const pool = new Set(WORDLE_PLAYERS)
    for (let d = 0; d < 400; d++) {
      const a = getWordleAnswerForDayIndex(ANCHOR + d)
      expect(pool.has(a), `day ${d + 1} -> "${a}" is not in the pool`).toBe(true)
    }
  })

  it('the two known-bad spellings never come back', () => {
    expect(WORDLE_PLAYERS).not.toContain('SNIJDER')
    expect(WORDLE_PLAYERS).toContain('SNEIJDER')
    expect(WORDLE_PLAYERS).not.toContain('VERATTI')
    expect(WORDLE_PLAYERS).toContain('VERRATTI')
  })
})
