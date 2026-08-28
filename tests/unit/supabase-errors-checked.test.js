import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * EVERY SUPABASE WRITE MUST OPEN {data, error}.
 *
 * A PostgREST query builder and an rpc() call RESOLVE with `{ data, error }`
 * on a database error — they do not throw. So `try { await supabase... }
 * catch {}` is not error handling, it is a catch block that can never run, and
 * the failure sits unread in a property nobody looked at.
 *
 * This has now cost real behaviour four separate times:
 *   · respondFriendRequest bare-awaited an update — accepting a friend request
 *     that failed still showed "✓ Friend added" and dropped it from the list.
 *   · onboarded_at was written with `.then(() => {})` at TWO sites. Onboarding
 *     is otherwise local-only, so a failed write silently costs the player a
 *     second onboarding on their next device.
 *   · sendInvite swallowed an rpc() error behind two layers of silence.
 *
 * The pattern behind all of them: the same operation exists in more than one
 * file, and only one copy was written carefully. This guard watches every copy.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    // Hidden dirs are never product source — .claude/worktrees from
    // background tasks lands inside src/ and duplicates every component.
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.jsx?$/.test(name)) out.push(p);
  }
  return out;
}

// Comments were 4 of the first 9 hits when this scan was written by hand —
// strip them before matching or the guard reports prose as code.
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
     .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));

const WRITE = /\.from\(\s*['"][\w.]+['"]\s*\)\s*\.\s*(update|insert|upsert|delete)\b|\.rpc\(\s*['"]\w+['"]/g;

/** Slice out the whole statement/expression chain around an index. */
function statementAround(text, idx) {
  let i = idx, depth = 0;
  while (i > 0) {
    const c = text[i - 1];
    if (')]}'.includes(c)) depth++;
    else if ('([{'.includes(c)) { if (depth === 0) break; depth--; }
    else if (c === ';' && depth === 0) break;
    i--;
  }
  let j = idx; depth = 0;
  while (j < text.length) {
    const c = text[j];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (--depth < 0) break; }
    else if (c === ';' && depth === 0) { j++; break; }
    j++;
  }
  return text.slice(i, j);
}

const inspectsError = (stmt) =>
  /(const|let|var)\s*\{[^}]*\berror\b/.test(stmt) ||   // const { error } = await ...
  /\.then\(\s*\(?\s*\{[^}]*\berror\b/.test(stmt) ||     // .then(({ error }) => ...
  /\bthrow\b/.test(stmt);

/**
 * DELIBERATE best-effort writes. Each entry must say why the failure is
 * genuinely safe to ignore — "it's minor" is not a reason, a self-correcting
 * mechanism is. Adding to this list is a decision, not a formality.
 */
const ALLOWED = [
  {
    match: /notifications["']\s*\)\s*\.update\(\s*\{\s*read:\s*true/,
    why: 'Marking an invite read. The row is already removed optimistically, and ' +
         'if the write fails the notification simply reappears on the next load — ' +
         'self-correcting, and the player owns no data here.',
  },
];

describe('no supabase write swallows its error', () => {
  const offenders = [];
  const files = walk(SRC);

  for (const file of files) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const m of text.matchAll(WRITE)) {
      const stmt = statementAround(text, m.index);
      if (inspectsError(stmt)) continue;
      if (ALLOWED.some((a) => a.match.test(stmt))) continue;
      const line = text.slice(0, m.index).split('\n').length;
      offenders.push(`${file.replace(SRC, 'src')}:${line}  ${stmt.replace(/\s+/g, ' ').slice(0, 110)}`);
    }
  }

  it('scanned a believable number of writes (guards the guard)', () => {
    // ⚠️ A ZERO HERE WOULD MEAN THE SCANNER BROKE, NOT THAT THE CODE IS CLEAN.
    // A CSSOM walker in this same sweep returned zero rules and looked like a
    // passing check. Pin the floor so a regex that stops matching fails loudly
    // instead of going quiet.
    let writes = 0;
    for (const file of files) {
      writes += [...stripComments(readFileSync(file, 'utf8')).matchAll(WRITE)].length;
    }
    expect(writes).toBeGreaterThan(40);
  });

  it('every write inspects {data, error}', () => {
    expect(
      offenders,
      '\n  A query builder RESOLVES on error — destructure it or use .then(({error})).\n  ' +
      offenders.join('\n  ') + '\n',
    ).toEqual([]);
  });
});
