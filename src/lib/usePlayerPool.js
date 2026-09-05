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

export function usePlayerPool({ careers = false } = {}) {
  const [data, setData] = useState(null);
  const inflight = useRef(null);
  const ensure = useCallback(() => {
    if (data) return Promise.resolve(data);
    if (inflight.current) return inflight.current;
    const loads = [import('../data/mysteryPool.json')];
    if (careers) loads.push(import('../data/mysteryCareers.json'));
    inflight.current = Promise.all(loads)
      .then(([p, c]) => {
        const d = { pool: p.default || p, careers: c ? (c.default || c) : null };
        setData(d);
        return d;
      })
      .catch(() => { inflight.current = null; return null; });
    return inflight.current;
  }, [data, careers]);
  return { pool: data?.pool || EMPTY, careers: data?.careers || null, ready: !!data, ensure };
}
