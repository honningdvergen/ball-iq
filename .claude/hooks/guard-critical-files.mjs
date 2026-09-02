#!/usr/bin/env node
/**
 * guard-critical-files — a PreToolUse gate for the files this repo cannot
 * afford to have edited casually.
 *
 * ⚠️ WHY THIS EXISTS. Three rules in this project were documented, agreed, and
 * then broken anyway, because a comment is not a gate:
 *
 *   1. src/questions.js is 2.4MB of hand-verified content under a ZERO ERROR
 *      bar. A bad bulk edit ships wrong answers into the App Store.
 *   2. WORDLE_ANSWER_LOG in src/lib/wordle.js is a FROZEN schedule. Appending
 *      to the player list used to retroactively rewrite every past and future
 *      Footle answer, including the publicly indexed archive.
 *   3. .env* files hold live Supabase and PageSpeed credentials.
 *
 * Decisions, deliberately different per class:
 *   .env*              -> deny. Credentials are never edited by an agent.
 *   questions.js       -> ask.  Legitimate often; must be a conscious choice.
 *   wordle answer log  -> ask.  Legitimate rarely; the trap is invisible.
 *
 * "ask" surfaces a prompt rather than blocking, so real work continues while
 * the dangerous cases stop being silent.
 */
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let file = '';
  try {
    const j = JSON.parse(raw || '{}');
    file = j?.tool_input?.file_path || j?.tool_input?.notebook_path || '';
  } catch { /* unparseable payload: stay out of the way */ }
  if (!file) return void process.exit(0);

  const say = (decision, reason) => {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }));
    process.exit(0);
  };

  const base = file.split('/').pop() || '';

  if (/^\.env($|\.)/.test(base)) {
    say('deny', `${base} holds live credentials (Supabase, PageSpeed). Agents do not edit secrets — ask Alex to change it by hand.`);
  }
  if (file.endsWith('src/questions.js')) {
    say('ask', 'src/questions.js is the question bank — 2.4MB under a ZERO ERROR bar, and wrong answers ship to the App Store. Confirm this edit is verified content, not a bulk rewrite.');
  }
  if (/src\/lib\/wordle\.js$/.test(file)) {
    say('ask', 'src/lib/wordle.js carries WORDLE_ANSWER_LOG — a FROZEN schedule. Appending to the player list has retroactively rewritten every past and future Footle answer before. Confirm the log is being extended deliberately.');
  }
  process.exit(0);
});
