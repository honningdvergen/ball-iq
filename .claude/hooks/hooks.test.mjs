// node .claude/hooks/hooks.test.mjs — cases for guard-critical-files and bash-gates.
// Kept in a file for the same reason as postiz-guard.test.mjs: the live hooks would
// react to a Bash command that merely contains the test strings.
// The release-gate cases need a dirty/clean tree, so they run against a throwaway
// git repo in /tmp rather than this checkout.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const hook = (name, payload, env = {}) => {
  const r = spawnSync('node', [new URL(`./${name}`, import.meta.url).pathname], {
    input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ...env },
  });
  const m = r.stdout.match(/"permissionDecision":"(\w+)"/);
  return m ? m[1] : 'allow';
};

// a throwaway repo on branch main, and one on a side branch
const mk = (dir, branch, dirty) => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const g = (...a) => spawnSync('git', a, { cwd: dir });
  g('init', '-q', '-b', branch); g('config', 'user.email', 't@t'); g('config', 'user.name', 't');
  fs.writeFileSync(`${dir}/f.txt`, 'a'); g('add', '.'); g('commit', '-qm', 'x');
  if (dirty) fs.writeFileSync(`${dir}/f.txt`, 'b');
};
mk('/tmp/hk_clean', 'main', false);
mk('/tmp/hk_dirty', 'main', true);
mk('/tmp/hk_branch', 'feature-x', false);

const B = 'bash-gates.mjs';
const G = 'guard-critical-files.mjs';
const cases = [
  // ── guard-critical-files: built-in editors (unchanged behaviour)
  [G, { tool_name: 'Edit', tool_input: { file_path: '/r/.env.local' } }, {}, 'deny'],
  [G, { tool_name: 'Edit', tool_input: { file_path: '/r/src/questions.js' } }, {}, 'ask'],
  [G, { tool_name: 'Write', tool_input: { file_path: '/r/src/App.jsx' } }, {}, 'allow'],
  // ── the bypasses the audit found, now closed
  [G, { tool_name: 'mcp__plugin_serena_serena__replace_content', tool_input: { relative_path: 'src/questions.js' } }, {}, 'ask'],
  [G, { tool_name: 'mcp__plugin_serena_serena__create_text_file', tool_input: { relative_path: '.env' } }, {}, 'deny'],
  [G, { tool_name: 'mcp__plugin_desktop-commander_desktop-commander__write_file', tool_input: { path: '/r/.env.local' } }, {}, 'deny'],
  [G, { tool_name: 'mcp__plugin_desktop-commander_desktop-commander__edit_block', tool_input: { file_path: '/r/src/lib/wordle.js' } }, {}, 'ask'],
  [G, { tool_name: 'mcp__plugin_serena_serena__replace_in_files', tool_input: { needle: 'a', repl: 'b' } }, {}, 'ask'],
  [G, { tool_name: 'mcp__plugin_serena_serena__replace_in_files', tool_input: { needle: 'a', repl: 'b', paths_include_glob: 'src/**/*.js' } }, {}, 'ask'],
  [G, { tool_name: 'mcp__plugin_serena_serena__replace_in_files', tool_input: { needle: 'a', repl: 'b', relative_path: 'scripts/seo' } }, {}, 'allow'],
  // ── bash-gates 1: gate piped away from its exit code
  [B, { tool_input: { command: 'npm run build 2>&1 | tail -20' } }, {}, 'ask'],
  [B, { tool_input: { command: 'npx vitest run | grep passed' } }, {}, 'ask'],
  [B, { tool_input: { command: 'npm run build 2>&1 | tail -20; echo "EXIT=${PIPESTATUS[0]}"' } }, {}, 'allow'],
  [B, { tool_input: { command: 'npm run build > /tmp/b.log 2>&1; echo EXIT=$?; grep Tests /tmp/b.log' } }, {}, 'allow'],
  [B, { tool_input: { command: 'git log --oneline | head -5' } }, {}, 'allow'],
  // ── bash-gates 2/3: release commands
  [B, { tool_input: { command: 'npx cap sync ios' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'allow'],
  [B, { tool_input: { command: 'npx cap sync ios' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_dirty' }, 'ask'],
  [B, { tool_input: { command: 'npx cap sync android' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_branch' }, 'ask'],
  [B, { tool_input: { command: 'xcodebuild -workspace x -scheme App archive' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_dirty' }, 'ask'],
  [B, { tool_input: { command: './android/gradlew -p android bundleRelease' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_dirty' }, 'ask'],
  [B, { tool_input: { command: 'xcodebuild -workspace x -scheme App build' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_dirty' }, 'allow'],
  // ── the other shell tools are covered too (same field name)
  [B, { tool_name: 'mcp__plugin_serena_serena__execute_shell_command', tool_input: { command: 'npm run build | tail' } }, {}, 'ask'],
];

// ── bash-gates 4: simulator runtime vs SDK — only if this Mac has both runtimes
const sims = spawnSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' });
const sdk = parseFloat(spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version'], { encoding: 'utf8' }).stdout);
if (sims.status === 0 && sdk) {
  const devs = JSON.parse(sims.stdout).devices;
  const pick = (pred) => Object.entries(devs).flatMap(([rt, l]) => l.map((d) => ({ rt, d }))).find(({ rt }) => pred(parseInt((rt.match(/iOS-(\d+)/) || [])[1], 10)));
  const old = pick((major) => major && major < Math.floor(sdk));
  const cur = pick((major) => major === Math.floor(sdk));
  if (old) cases.push([B, { tool_input: { command: `xcrun simctl boot ${old.d.udid}` } }, {}, 'ask']);
  if (cur) cases.push([B, { tool_input: { command: `xcrun simctl boot ${cur.d.udid}` } }, {}, 'allow']);
  if (!old || !cur) console.log('ℹ️  simulator cases partly skipped: need one device on an older runtime and one on the SDK\'s');
}

let bad = 0;
for (const [name, payload, env, want] of cases) {
  const got = hook(name, payload, env);
  if (got !== want) bad++;
  const what = payload.tool_input.command || payload.tool_input.file_path || payload.tool_input.relative_path || payload.tool_input.path || JSON.stringify(payload.tool_input);
  console.log(got === want ? '✅' : '❌', want.padEnd(5), name.padEnd(24), String(what).slice(0, 70));
}
console.log(bad ? `\n${bad} case(s) FAILED` : `\nall ${cases.length} cases pass`);
process.exit(bad ? 1 : 0);
