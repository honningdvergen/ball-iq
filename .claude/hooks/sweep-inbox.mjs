#!/usr/bin/env node
/**
 * sweep-inbox — deliver each new trend-sweep report to the sessions doing social work.
 *
 * ⚠️ WHY. Alex 09-24 wanted every sweep report sent to the "Ball IQ social media growth
 * strategy" session. The sweep runs as a scheduled task, and scheduled runs are not
 * allowed to message other sessions (send_message is refused in unattended sessions).
 * So the delivery happens on the receiving side instead: on each prompt, if a report
 * newer than the one this session last saw exists, its full text is added to the turn.
 *
 * Only sessions whose transcript already shows social work (Shithousery / social/pz /
 * Postiz) receive it — a website or app session must not get 3k tokens of banter plans.
 * Never blocks; any error exits 0 with no output.
 */
import fs from 'node:fs';
import path from 'node:path';

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const dir = path.join(root, 'social', 'state', 'sweeps');
  const reports = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  const newest = reports[0];
  if (!newest || Date.now() - newest.t > 36 * 3600e3) process.exit(0);

  // Is this a social session? Check the tail of its transcript (bounded read).
  const tp = input.transcript_path;
  if (!tp || !fs.existsSync(tp)) process.exit(0);
  const size = fs.statSync(tp).size, len = Math.min(size, 8e6);
  const fd = fs.openSync(tp, 'r'); const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, size - len); fs.closeSync(fd);
  if (!/shithousery|social\/pz|postiz/i.test(buf.toString('utf8'))) process.exit(0);
  // The sweep itself writes the report — don't echo it back into the sweep run.
  if (/<scheduled-task name=\\?"shq-trend-sweep/.test(buf.toString('utf8'))) process.exit(0);

  const seenFile = path.join(root, 'social', 'state', '.sweep-seen.json');
  const seen = fs.existsSync(seenFile) ? JSON.parse(fs.readFileSync(seenFile, 'utf8')) : {};
  const key = input.session_id || tp;
  const last = seen[key] || { t: 0 };
  const fresh = reports.filter((r) => r.t > last.t && Date.now() - r.t < 36 * 3600e3).reverse();
  if (!fresh.length) process.exit(0);

  const body = fresh.map((r) => `### ${r.f}\n\n${fs.readFileSync(path.join(dir, r.f), 'utf8')}`).join('\n\n---\n\n');
  seen[key] = { t: newest.t, f: newest.f };
  fs.writeFileSync(seenFile, JSON.stringify(seen, null, 1));
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `📋 NEW TREND-SWEEP REPORT(S) from the scheduled shq-trend-sweep (files in social/state/sweeps/; media copies in social/state/media/sweeps/). Mention to Alex that a new sweep report arrived and what it asks of him, alongside answering his message:\n\n${body}`,
    },
  }));
} catch { /* never block a prompt */ }
process.exit(0);
