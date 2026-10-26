// The guess-autocomplete pool (mysteryPool.json, ~410 KB gzipped) and, for
// Mystery Player, the careers it ranks against (~300 KB gzipped) — loaded ON
// DEMAND rather than with the screen.
//
// ⚠️ WHY LAZY (2026-09-05). Transfer Trail and Mystery Player now also mount as
// islands on the static /transfer-trail/ and /mystery-player/ pages, where most
// visitors arrive from a search and leave without typing. Shipping 700 KB of
// JSON to every one of them for a box they never focus is the wrong trade, so
// the data arrives on the first focus of the guess box (or the first keystroke,
// whichever the browser fires first). In the app the player taps the box within
// a second or two of the screen opening, so the difference there is a few
// hundred milliseconds moved from before-first-paint to after-first-tap.
//
// Both screens import() the SAME module, so Vite still hoists the pool into
// one shared chunk a player who does both dailies downloads once — the
// property the old static imports were chosen for.
import { useCallback, useRef, useState } from 'react';

const EMPTY = [];

/** The pool plus guessExtra.json: its `add` rows, and its `aka` second spellings
 *  set on COPIES of the pool's own records (the imported module stays as is). */
export function withExtras(pool, { add = [], aka = {} } = {}) {
  return pool.map((p) => (aka[p.id] ? { ...p, aka: aka[p.id] } : p)).concat(add);
}

// `extras` (26 Oct 2026): also the ~2,600 players the Draft and today's squads
// hold but the pool does not (John Barnes, Mkhitaryan), from guessExtra.json.
// ⚠️ ONLY FOR SCREENS THAT JUDGE A GUESS BY ITS NAME (Transfer Trail, Top 10).
// Mystery Player ranks a guess by its career and these rows have none, so it
// never asks for them. See scripts/gen-guess-extra.mjs.
export function usePlayerPool({ careers = false, extras = false } = {}) {
  const [data, setData] = useState(null);
  const inflight = useRef(null);
  const ensure = useCallback(() => {
    if (data) return Promise.resolve(data);
    if (inflight.current) return inflight.current;
    const loads = [
      extras
        ? Promise.all([import('../data/mysteryPool.json'), import('../data/guessExtra.json')])
          .then(([p, x]) => withExtras(p.default || p, x.default || x))
        : import('../data/mysteryPool.json').then((p) => p.default || p),
    ];
    if (careers) loads.push(Promise.all([import('../data/mysteryCareers.json'), import('../data/mysteryCareerFixes.json'), import('./mysteryCareer.js')])
      .then(([c, f, m]) => m.withCareerFixes(c.default || c, f.default || f)));
    inflight.current = Promise.all(loads)
      .then(([pool, c]) => {
        const d = { pool, careers: c ? (c.default || c) : null };
        setData(d);
        return d;
      })
      .catch(() => { inflight.current = null; return null; });
    return inflight.current;
  }, [data, careers, extras]);
  return { pool: data?.pool || EMPTY, careers: data?.careers || null, ready: !!data, ensure };
}
