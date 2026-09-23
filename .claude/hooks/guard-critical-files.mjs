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
  // ⚠️ EVERY TOOL THAT CAN WRITE, NOT JUST Edit/Write (2026-09-23). A setup
  // audit found this guard watched only the built-in editors, so Serena
  // (relative_path), desktop-commander (path / file_path) and Serena's
  // project-wide replace_in_files walked straight past it. Each field name is
  // checked; a replace_in_files with no path scope touches the whole project,
  // questions.js included, so it is treated as touching the bank.
  let files = [];
  let wholeProject = false;
  try {
    const j = JSON.parse(raw || '{}');
    const t = j?.tool_input || {};
    files = [t.file_path, t.notebook_path, t.relative_path, t.path, t.paths_include_glob].filter(Boolean).map(String);
    wholeProject = /replace_in_files$/.test(j?.tool_name || '') && !t.relative_path && !t.paths_include_glob;
  } catch { /* unparseable payload: stay out of the way */ }
  if (wholeProject) files.push('src/questions.js');
  if (!files.length) return void process.exit(0);

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

  for (const file of files) {
    const base = file.split('/').pop() || '';
    if (/^\.env($|\.)/.test(base)) {
      say('deny', `${base} holds live credentials (Supabase, PageSpeed). Agents do not edit secrets — ask Alex to change it by hand.`);
    }
  }
  for (const file of files) {
    // a glob like src/**/*.js reaches questions.js too
    if (/(^|\/)questions\.js$/.test(file) || /(^|\/)src\/(\*\*\/)?\*\.js$/.test(file)) {
      say('ask', 'src/questions.js is the question bank — 2.4MB under a ZERO ERROR bar, and wrong answers ship to the App Store. Confirm this edit is verified content, not a bulk rewrite.');
    }
    if (/(^|\/)src\/lib\/wordle\.js$/.test(file)) {
      say('ask', 'src/lib/wordle.js carries WORDLE_ANSWER_LOG — a FROZEN schedule. Appending to the player list has retroactively rewritten every past and future Footle answer before. Confirm the log is being extended deliberately.');
    }
  }
  process.exit(0);
});
