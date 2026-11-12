// Today's unfinished Daily 7, kept so leaving the quiz does not lose it.
//
// 10 Nov 2026: the engine held a run only in React state. Answer question 1,
// see the answer and the "Why?", press back, and Home still said "Play"; going
// back in dealt the same seven from 1/7. Progress was lost, and a player could
// read the answers, back out and replay for a perfect daily score.
//
// One slot, today's run only. `day` is the same local YMD the finished daily is
// stored under (lib/date.js dateToYMD -> biq_daily_<ymd>), so there is one
// notion of "today". Pure and dependency-free: Home imports this file.

export const DAILY_RUN_KEY = 'biq_daily7_run_v1';

// Which seven, in order. Option order is reshuffled per start and is not part
// of the identity; each stored answer record carries its own options.
export function dailyRunFingerprint(questions) {
  return (questions || []).map((q) => String(q?.id || q?.q || '')).join('|');
}

export function clearDailyRun() {
  try { localStorage.removeItem(DAILY_RUN_KEY); } catch { /* storage blocked */ }
}

function readRaw() {
  try {
    const raw = localStorage.getItem(DAILY_RUN_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const n = s?.answered;
    if (!s || typeof s.day !== 'string' || typeof s.fp !== 'string') return null;
    if (!Number.isInteger(n) || n < 1) return null;
    if (!Array.isArray(s.all) || s.all.length !== n || !Array.isArray(s.wrong)) return null;
    if (![s.score, s.streak, s.bestStreak].every((v) => Number.isInteger(v) && v >= 0 && v <= n)) return null;
    return s;
  } catch { return null; }
}

/** state: { answered, score, streak, bestStreak, wrong, all } after an answer. */
export function saveDailyRun(day, questions, state) {
  if (!day || !questions?.length || !state) return;
  try {
    localStorage.setItem(DAILY_RUN_KEY, JSON.stringify({
      day,
      fp: dailyRunFingerprint(questions),
      answered: state.answered,
      score: state.score,
      streak: state.streak,
      bestStreak: state.bestStreak,
      wrong: state.wrong || [],
      all: state.all || [],
    }));
  } catch { /* full or blocked: the run still plays, it just cannot resume */ }
}

/** The snapshot for this day AND these seven, else null. Anything else stored
 *  (another day, another set, corrupt) is removed. */
export function loadDailyRun(day, questions) {
  const s = readRaw();
  const total = questions?.length || 0;
  if (s && day && s.day === day && s.answered <= total && s.fp === dailyRunFingerprint(questions)) return s;
  clearDailyRun();
  return null;
}

/** Home's read: how many of today's seven are answered (0 = nothing to resume).
 *  Never writes; Home does not hold the questions, so it checks the day only. */
export function dailyRunAnswered(day) {
  const s = readRaw();
  return s && s.day === day ? s.answered : 0;
}
