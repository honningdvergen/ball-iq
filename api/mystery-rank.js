// /api/mystery-rank — ranks one guess for an ARCHIVED Mystery Player puzzle.
//
//   GET /api/mystery-rank?n=<puzzle number>&g=<guess>
//   -> { ok, name, rank, total, solved }   |   { ok:false, reason }
//
// ⚠️ WHY A SERVER AT ALL, when Footle and Transfer Trail ship their answer to
// the browser cloaked. Because Mystery Player has no single answer string to
// hide. A guess is ranked against ALL 8,489 players, so ranking in the browser
// means shipping the ranked list — and the ranked list IS the answer, sitting
// at position 1. The only way to keep the mechanic honest on a public page is
// to never send the ordering at all.
//
// The response carries a rank and nothing else. The answer's name is returned
// ONLY when the guess already is the answer, at which point it is not a secret.
//
// ⚠️ NODE RUNTIME, NOT EDGE. The pool (1.73 MB) and careers (0.94 MB) come to
// ~2.7 MB — over the Edge bundle ceiling. Node's limit is far higher, and the
// per-request cost is a Map lookup after the first call.
//
// ⚠️ ARCHIVED PUZZLES ONLY. Serving today's number would turn this endpoint
// into an oracle: a script could walk the pool and read off rank 1 in a few
// thousand requests. Past puzzles are already public in the app's own archive,
// so there is nothing left to protect.
import POOL from '../src/data/mysteryPool.json' with { type: 'json' };
import CAREERS from '../src/data/mysteryCareers.json' with { type: 'json' };
import SCHEDULE from '../src/data/mysterySchedule.json' with { type: 'json' };
import { rankPool, matchGuess, mysteryNumber } from '../src/lib/mysteryPlayer.js';

// Ranking the whole pool is ~8,500 similarity() calls. Cheap, but not per
// keystroke — so each puzzle's ranking is computed once and kept for the life
// of the warm instance.
const RANK_CACHE = new Map();

function ranksFor(puzzleNo) {
  if (RANK_CACHE.has(puzzleNo)) return RANK_CACHE.get(puzzleNo);
  const ids = Array.isArray(SCHEDULE) ? SCHEDULE : (SCHEDULE.days || Object.values(SCHEDULE)[0]);
  const raw = ids[puzzleNo - 1];
  const answerId = typeof raw === 'string' ? raw : (raw && (raw.id || raw.answerId));
  const answer = POOL.find((p) => p.id === answerId);
  if (!answer) return null;
  const entry = { answer, ranks: rankPool(POOL, answer, CAREERS) };
  RANK_CACHE.set(puzzleNo, entry);
  return entry;
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const n = parseInt(String(req.query?.n ?? ''), 10);
  const guess = String(req.query?.g ?? '').slice(0, 60);
  if (!Number.isFinite(n) || n < 1) return res.status(400).end(JSON.stringify({ ok: false, reason: 'bad-puzzle' }));
  if (!guess.trim()) return res.status(400).end(JSON.stringify({ ok: false, reason: 'empty' }));

  // ⚠️ mysteryNumber(), NOT mysteryDayIndex(). The first version used the day
  // index, which is ~20,677 — so "n must be below today" passed for every
  // puzzle in the 400-entry schedule INCLUDING today's, and the archive guard
  // protected nothing. mysteryNumber() subtracts the anchor and returns the
  // real 1-based puzzle number the app shows.
  const today = mysteryNumber(new Date());
  if (n >= today) return res.status(403).end(JSON.stringify({ ok: false, reason: 'not-archived' }));

  const entry = ranksFor(n);
  if (!entry) return res.status(404).end(JSON.stringify({ ok: false, reason: 'no-puzzle' }));

  // matchGuess is the SAME resolver the app uses, so a name the app accepts is
  // accepted here — including the ambiguity refusals that make "Haaland" ask
  // for a first name when the pool holds two of them.
  const player = matchGuess(POOL, guess);
  if (!player) return res.status(200).end(JSON.stringify({ ok: false, reason: 'unknown-player' }));

  const rank = entry.ranks.get(player.id);
  const solved = rank === 1;
  return res.status(200).end(JSON.stringify({
    ok: true,
    name: player.name,
    rank,
    total: POOL.length,
    solved,
    // Only revealed once it is no longer a secret.
    answer: solved ? entry.answer.name : undefined,
  }));
}
