#!/usr/bin/env node
// stamp-gsc — PostToolUse on the Search Console tools: record when GSC was last read, so
// session-start can say how stale that is. Why: the 20 Oct Google drop is watched by a
// "read GSC daily" rule, and a rule nobody sees on screen is the one that gets skipped.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(raw || '{}');
    const dir = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude/state');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'gsc-last-read.json'), JSON.stringify({ time: Date.now(), tool: String(j.tool_name || '').split('__').pop() }) + '\n');
  } catch { /* never in the way */ }
  process.exit(0);
});
