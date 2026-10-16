// mystery-spells.mjs — turn Wikidata P54 statements into club SPELLS, and lay
// newly fetched spells over the shipped careers file.
//
// One module, two callers: fetch-mystery-careers.mjs (statements -> spells)
// and merge-mystery-spells.mjs (spells -> src/data/mysteryCareers.json). The
// unit tests import it too, so the rules below are pinned.
//
// ⚠️ A PLAYER CAN JOIN THE SAME CLUB TWICE (16 Oct 2026). The fetch used to
// keep the first statement per club and throw the rest away, so every second
// stint vanished: Buffon kept Juventus 2019-21 and lost 2001-18, Henry kept
// Arsenal 2012 and lost 1999-2007, Cristiano Ronaldo lost Manchester United
// 2021-22. The reveal then printed holes, "teammates at" missed whole decades
// and the answer bar refused 170 of 648 answers for career gaps.
//
// ⚠️ ONE STATEMENT CAN HOLD TWO STINTS. Some editors put both spells on one
// statement: two P580 starts and two P582 ends. The SPARQL join returns the
// cross product, four rows, and keeping any one of them is a coin toss —
// that is where spells like "Levante 2008-2001" (ending before they start)
// came from. Sorted starts paired with sorted ends recovers the stints.

const year = (v) => {
  if (v == null || v === '') return null;
  const m = /^(-?\d{1,4})/.exec(String(v));
  return m ? +m[1] : null;
};

/**
 * Collect SPARQL rows into statements. Feed it every row for a player (in any
 * order, across chunked queries) and read `.statements()` at the end.
 * Row shape: { st, club, clubLabel, start, end } as plain strings.
 */
export function statementCollector() {
  const byPlayer = new Map(); // pid -> Map(stId -> { id, name, starts:Set, ends:Set })
  return {
    add(pid, { st, club, clubLabel, start, end }) {
      const m = byPlayer.get(pid) || new Map();
      const key = st || `${club}|${start}|${end}`;
      const s = m.get(key) || { id: club, name: clubLabel || club, starts: new Set(), ends: new Set() };
      const a = year(start), b = year(end);
      if (a != null) s.starts.add(a);
      if (b != null) s.ends.add(b);
      m.set(key, s);
      byPlayer.set(pid, m);
    },
    players() { return [...byPlayer.keys()]; },
    statements(pid) { return [...(byPlayer.get(pid)?.values() || [])]; },
  };
}

/**
 * Statements -> spells [{ id, name, start, end }], oldest first.
 *
 *  - one start, one end (or none): one spell, as written.
 *  - n starts and n ends: n spells, sorted starts paired with sorted ends.
 *  - anything else: one spell from the earliest start to the latest end.
 *  - exact duplicates (same club, same years) collapse to one.
 *  - a statement with NO dates at a club that also has a dated statement is
 *    dropped: it is the same membership recorded twice, and careerOf() would
 *    hide it anyway.
 *  - a spell that still ends before it starts has its years swapped and is
 *    marked `reversed: true`. Usually only the order is wrong (Levante
 *    2008-2001), but sometimes the dates are junk (an Argentine forward at
 *    Toulouse "2005-1991", across ten other clubs), so mergeSpells() only
 *    trusts a reversed spell that fits around the rest of the career.
 */
export function spellsFromStatements(statements) {
  const out = [];
  for (const s of statements) {
    const starts = [...s.starts].sort((x, y) => x - y);
    const ends = [...s.ends].sort((x, y) => x - y);
    if (starts.length > 1 && starts.length === ends.length) {
      starts.forEach((a, i) => out.push({ id: s.id, name: s.name, start: a, end: ends[i] }));
    } else {
      out.push({ id: s.id, name: s.name, start: starts[0] ?? null, end: ends.length ? ends[ends.length - 1] : null });
    }
  }
  for (const sp of out) {
    if (sp.start != null && sp.end != null && sp.end < sp.start) {
      [sp.start, sp.end] = [sp.end, sp.start];
      sp.reversed = true;
    }
  }
  const dated = new Set(out.filter((sp) => sp.start != null || sp.end != null).map((sp) => sp.id));
  const seen = new Set();
  const kept = [];
  for (const sp of out) {
    if (sp.start == null && sp.end == null && dated.has(sp.id)) continue;
    const k = `${sp.id}|${sp.start}|${sp.end}`;
    if (seen.has(k)) continue;
    seen.add(k);
    kept.push(sp);
  }
  kept.sort((a, b) => (a.start ?? a.end ?? 9999) - (b.start ?? b.end ?? 9999) || (a.end ?? 9999) - (b.end ?? 9999));
  return kept;
}

/** Spells overlap when they share more than a boundary year. Open end = now. */
function overlaps(a, b, now) {
  if (a.start == null || b.start == null) return false;
  return Math.max(a.start, b.start) < Math.min(a.end ?? now, b.end ?? now);
}

/**
 * Same club, any shared year (inclusive): the same stint, cut differently.
 * Wikidata often splits one stint into one-year pieces (Świerczewski's
 * Cracovia reads 2004, 2004-05 and 2005), and a piece that shares only a
 * boundary year never "overlaps" by the rule above, so the full merge of 16
 * Oct 2026 added 38 such shards. A real return has a year elsewhere between.
 */
function sharesYear(a, b, now) {
  const s1 = a.start ?? a.end, s2 = b.start ?? b.end;
  if (s1 == null || s2 == null) return false;
  return Math.max(s1, s2) <= Math.min(a.end ?? now, b.end ?? now);
}

/**
 * Lay fetched spells over the shipped careers file WITHOUT rebuilding it.
 *
 * ⚠️ WHY A MERGE AND NOT A REBUILD. build-mystery-pool-v2.mjs rewrites
 * mysteryPool.json and mysteryAnswers.json as well, and the careers file has
 * been edited since it was built (relabel-pool-from-squads.mjs, fix-pool-names
 * .mjs). A rebuild would move the answer list and undo those edits. The merge
 * only ADDS the missing stints, at clubs the player already has on record,
 * under the label the file already uses for that club, so nothing else moves.
 *
 * Per player, per club (matched by `sameClub` on the label):
 *  - a fetched spell already present (same years) is skipped;
 *  - a fetched spell that shares any year with a present one is skipped
 *    (same stint, dated or cut differently: the shipped dates stay);
 *  - a shipped spell that ends before it starts is REMOVED and the fetched
 *    spells at that club take its place;
 *  - a fetched spell marked `reversed` (its dates were written backwards) is
 *    added only if it overlaps no other club on the career by more than a
 *    year; otherwise its dates are junk and it is dropped;
 *  - everything else is added.
 * Clubs the player has no spell at are left out and counted: a brand-new club
 * is a transfer, not a lost second stint, and needs its own review.
 *
 * `okYear` filters years the same way the build does. Returns counts; mutates
 * `careers` in place.
 */
export function mergeSpells(careers, fetched, { sameClub, okYear = () => true, now = 2026 } = {}) {
  const yr = (v) => (v != null && okYear(v) ? v : null);
  const stats = { players: 0, added: 0, repaired: 0, newClubsSkipped: 0, overlapsSkipped: 0, reversedDropped: 0 };
  for (const [pid, spells] of Object.entries(fetched)) {
    const mine = careers.p[pid];
    if (!mine || !Array.isArray(spells)) continue;
    let touched = false;
    const byClub = new Map();
    for (const sp of spells) {
      const list = byClub.get(sp.id) || [];
      list.push({ name: sp.name, start: yr(sp.start), end: yr(sp.end), reversed: !!sp.reversed });
      byClub.set(sp.id, list);
    }
    for (const list of byClub.values()) {
      const at = mine.filter(([i]) => sameClub(careers.c[i], list[0].name));
      if (!at.length) { stats.newClubsSkipped++; continue; }
      const label = at[0][0];
      // A backwards shipped spell is a misread of this club's statements: the
      // fetched ones replace it.
      const bad = at.filter(([, a, b]) => a != null && b != null && b < a);
      if (bad.length) {
        careers.p[pid] = careers.p[pid].filter((s) => !bad.includes(s));
        stats.repaired += bad.length;
        touched = true;
      }
      for (const sp of list) {
        if (sp.start == null && sp.end == null) continue;
        const present = careers.p[pid].filter(([i]) => i === label || sameClub(careers.c[i], sp.name))
          .map(([, a, b]) => ({ start: a, end: b }));
        if (present.some((p) => p.start === sp.start && p.end === sp.end)) continue;
        if (present.some((p) => sharesYear(p, sp, now))) { stats.overlapsSkipped++; continue; }
        if (sp.reversed) {
          const clash = careers.p[pid].some(([i, a, b]) => i !== label && !sameClub(careers.c[i], sp.name)
            && a != null && Math.min(b ?? now, sp.end ?? now) - Math.max(a, sp.start) > 1);
          if (clash) { stats.reversedDropped++; continue; }
        }
        careers.p[pid].push([label, sp.start, sp.end]);
        stats.added++;
        touched = true;
      }
    }
    if (touched) {
      careers.p[pid].sort((x, y) => (x[1] ?? x[2] ?? 9999) - (y[1] ?? y[2] ?? 9999) || (x[2] ?? 9999) - (y[2] ?? 9999));
      stats.players++;
    }
  }
  return stats;
}
