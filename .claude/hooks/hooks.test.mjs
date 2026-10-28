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
  const m = r.stdout.match(/"permissionDecision":"(\w+)"/) || r.stdout.match(/"decision":"(\w+)"/);
  if (m) return m[1];
  return /additionalContext/.test(r.stdout) ? 'note' : 'allow';
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
  [B, { tool_input: { command: 'npm run build 2>&1 | tail -20' } }, {}, 'note'],
  [B, { tool_input: { command: 'npx vitest run | grep passed' } }, {}, 'note'],
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
  [B, { tool_name: 'mcp__plugin_serena_serena__execute_shell_command', tool_input: { command: 'npm run build | tail' } }, {}, 'note'],
];

// ── fixtures for rules 5 and 9: a repo with an origin, one app commit ahead, and a service worker
const sh = (dir, ...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
const P = '/tmp/hk_push', R = '/tmp/hk_push_remote.git', SW = '/tmp/hk_sw';
fs.rmSync(P, { recursive: true, force: true }); fs.rmSync(R, { recursive: true, force: true });
spawnSync('git', ['init', '-q', '--bare', '-b', 'main', R]);
fs.mkdirSync(`${P}/src`, { recursive: true }); fs.mkdirSync(`${P}/docs`, { recursive: true });
sh(P, 'init', '-q', '-b', 'main'); sh(P, 'config', 'user.email', 't@t'); sh(P, 'config', 'user.name', 't');
fs.writeFileSync(`${P}/src/a.js`, '1'); fs.writeFileSync(`${P}/docs/n.md`, '1');
sh(P, 'add', 'src/a.js', 'docs/n.md'); sh(P, 'commit', '-qm', 'x'); sh(P, 'remote', 'add', 'origin', R); sh(P, 'push', '-q', 'origin', 'main');
const P2 = '/tmp/hk_push_docs';
fs.rmSync(P2, { recursive: true, force: true }); spawnSync('git', ['clone', '-q', R, P2]);
sh(P2, 'config', 'user.email', 't@t'); sh(P2, 'config', 'user.name', 't');
fs.writeFileSync(`${P2}/docs/n.md`, '2'); sh(P2, 'commit', '-qam', 'docs only');
fs.writeFileSync(`${P}/src/a.js`, '2'); sh(P, 'commit', '-qam', 'app change');
const P3 = '/tmp/hk_push_built';
fs.rmSync(P3, { recursive: true, force: true }); spawnSync('git', ['clone', '-q', R, P3]);
sh(P3, 'config', 'user.email', 't@t'); sh(P3, 'config', 'user.name', 't');
fs.writeFileSync(`${P3}/src/a.js`, '3'); sh(P3, 'commit', '-qam', 'app change');
fs.writeFileSync(`${P3}/.build-ok`, JSON.stringify({ time: Date.now() + 1000 }));

fs.rmSync(SW, { recursive: true, force: true }); fs.mkdirSync(`${SW}/public`, { recursive: true });
sh(SW, 'init', '-q', '-b', 'main'); sh(SW, 'config', 'user.email', 't@t'); sh(SW, 'config', 'user.name', 't');
fs.writeFileSync(`${SW}/public/sw.js`, "const CACHE_VERSION = 'v1';\nconst A = 1;\n"); sh(SW, 'add', 'public/sw.js'); sh(SW, 'commit', '-qm', 'x');
const swCase = (content) => { fs.writeFileSync(`${SW}/public/sw.js`, content); sh(SW, 'add', 'public/sw.js'); };

const KEY = '~/.appstoreconnect/private_keys/AuthKey_TEST1234.p8';
cases.push(
  // ── 5. push to main without a green build
  [B, { tool_input: { command: 'git push origin main' } }, { CLAUDE_PROJECT_DIR: P }, 'deny'],
  [B, { tool_input: { command: 'git push' } }, { CLAUDE_PROJECT_DIR: P }, 'deny'],
  [B, { tool_input: { command: 'BALLIQ_OVERRIDE=1 git push origin main' } }, { CLAUDE_PROJECT_DIR: P }, 'ask'],
  [B, { tool_input: { command: 'git push --dry-run origin main' } }, { CLAUDE_PROJECT_DIR: P }, 'allow'],
  [B, { tool_input: { command: 'git push origin claude/feature-x' } }, { CLAUDE_PROJECT_DIR: P }, 'allow'],
  [B, { tool_input: { command: 'git push origin main' } }, { CLAUDE_PROJECT_DIR: P2 }, 'allow'],
  [B, { tool_input: { command: 'git push origin main' } }, { CLAUDE_PROJECT_DIR: P3 }, 'allow'],
  // ── 6. sweeping stages and amend on main
  [B, { tool_input: { command: 'git add -A' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'deny'],
  [B, { tool_input: { command: 'git add .' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'deny'],
  [B, { tool_input: { command: 'git add -u' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'deny'],
  [B, { tool_input: { command: 'git add src/App.jsx src/app.css && git commit -m "fix: add -A flag note"' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'allow'],
  [B, { tool_input: { command: 'git add -A social/' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'allow'],
  [B, { tool_input: { command: 'git commit -am "x"' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'deny'],
  [B, { tool_input: { command: "git commit -m \"$(cat <<'EOF'\nUse -a in the docs\nEOF\n)\"" } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'allow'],
  [B, { tool_input: { command: 'git commit --amend --no-edit' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_clean' }, 'deny'],
  [B, { tool_input: { command: 'git add -A' } }, { CLAUDE_PROJECT_DIR: '/tmp/hk_branch' }, 'allow'],
  // ── 7. App Store Connect keys
  [B, { tool_input: { command: `cat ${KEY}` } }, {}, 'deny'],
  [B, { tool_input: { command: `base64 < ${KEY} | pbcopy` } }, {}, 'deny'],
  [B, { tool_input: { command: `xcodebuild -exportArchive -archivePath a.xcarchive -authenticationKeyPath ${KEY} -authenticationKeyID TEST1234` } }, {}, 'allow'],
  [B, { tool_input: { command: 'ls ~/.appstoreconnect/private_keys' } }, {}, 'allow'],
  // ── 8. reading a sim script is not a boot
  [B, { tool_input: { command: 'sed -n 1,12p ~/ball-iq-release/sim-probe.sh' } }, {}, 'allow'],
);
// ── 9. service worker: run in order, each restages the file
const swCases = [
  ["const CACHE_VERSION = 'v1';\nconst A = 2;\n", 'deny'],
  ["const CACHE_VERSION = 'v2';\nconst A = 2;\n", 'allow'],
  ["const CACHE_VERSION = 'v1';\nconst A = 1;\n// a note\n", 'allow'],
];

// ── bash-gates 4: simulator runtime vs SDK — only if this Mac has both runtimes
const sims = spawnSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' });
const sdk = parseFloat(spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version'], { encoding: 'utf8' }).stdout);
if (sims.status === 0 && sdk) {
  const devs = JSON.parse(sims.stdout).devices;
  const pick = (pred) => Object.entries(devs).flatMap(([rt, l]) => l.map((d) => ({ rt, d }))).find(({ rt }) => pred(parseInt((rt.match(/iOS-(\d+)/) || [])[1], 10)));
  const old = pick((major) => major && major < Math.floor(sdk));
  const cur = pick((major) => major === Math.floor(sdk));
  // rule 8 runs first: with another simulator up, any boot is refused; otherwise a boot carries the Tide HQ note
  const booted = Object.values(devs).flat().filter((d) => d.state === 'Booted');
  const other = (d) => booted.some((b) => b.udid !== d.udid);
  if (old) cases.push([B, { tool_input: { command: `xcrun simctl boot ${old.d.udid}` } }, {}, other(old.d) ? 'deny' : 'ask']);
  if (cur) cases.push([B, { tool_input: { command: `xcrun simctl boot ${cur.d.udid}` } }, {}, other(cur.d) ? 'deny' : 'note']);
  if (!old || !cur) console.log('ℹ️  simulator cases partly skipped: need one device on an older runtime and one on the SDK\'s');
}

const S = 'supabase-guard.mjs', V = 'stop-visual-proof.mjs';
const MIG = 'mcp__7f7042ac-454f-4386-81df-c1e7aef2bb6f__apply_migration', XSQL = 'mcp__7f7042ac-454f-4386-81df-c1e7aef2bb6f__execute_sql';
cases.push(
  [S, { tool_name: MIG, tool_input: { query: 'create or replace function public.f(a int) returns int language sql as $$ select 1 $$; grant execute on function public.f(int) to authenticated;' } }, {}, 'deny'],
  [S, { tool_name: MIG, tool_input: { query: 'create or replace function public.f(a int) returns int language sql as $$ select 1 $$; grant execute on function public.f(int) to authenticated; revoke execute on function public.f(int) from public;' } }, {}, 'allow'],
  [S, { tool_name: MIG, tool_input: { query: 'create table public.t (id int); revoke all on public.t from anon;' } }, {}, 'deny'],
  [S, { tool_name: MIG, tool_input: { query: 'create table if not exists public.t (id int); alter table public.t enable row level security; revoke all on table public.t from anon, authenticated;' } }, {}, 'allow'],
  [S, { tool_name: MIG, tool_input: { query: '-- grants: kept on purpose, replace only\ncreate or replace function public.f() returns int language sql as $$ select 1 $$;' } }, {}, 'ask'],
  [S, { tool_name: XSQL, tool_input: { query: 'select count(*) from scores' } }, {}, 'allow'],
  [S, { tool_name: XSQL, tool_input: { query: 'create index scores_uid on scores(user_id)' } }, {}, 'note'],
);

// stop-visual-proof: fake transcripts
const T = (name, tools) => {
  const f = `/tmp/hk_tr_${name}.jsonl`;
  const rows = [{ type: 'user', message: { content: 'fix the button' } },
    ...tools.map(([n, input]) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', name: n, input }] } }))];
  fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n'));
  return f;
};
const edit = ['Edit', { file_path: '/r/src/screens/Home.jsx' }], push = ['Bash', { command: 'git push origin main' }];
const shot = ['mcp__Claude_Browser__computer', { action: 'screenshot' }];
cases.push(
  [V, { transcript_path: T('noshot', [edit, push]), tool_input: { file_path: 'noshot' } }, {}, 'block'],
  [V, { transcript_path: T('shot', [edit, shot, push]), tool_input: { file_path: 'shot' } }, {}, 'allow'],
  [V, { transcript_path: T('shotfirst', [shot, edit, push]), tool_input: { file_path: 'shot before edit' } }, {}, 'block'],
  [V, { transcript_path: T('docs', [['Edit', { file_path: '/r/docs/x.md' }], push]), tool_input: { file_path: 'docs edit' } }, {}, 'allow'],
  [V, { transcript_path: T('nopush', [edit]), tool_input: { file_path: 'no push' } }, {}, 'allow'],
  [V, { stop_hook_active: true, transcript_path: T('again', [edit, push]), tool_input: { file_path: 'second stop' } }, {}, 'allow'],
);

let bad = 0;
for (const [content, want] of swCases) {
  swCase(content);
  const got = hook(B, { tool_input: { command: 'git commit -m "sw"' } }, { CLAUDE_PROJECT_DIR: SW });
  if (got !== want) bad++;
  console.log(got === want ? '✅' : '❌', want.padEnd(5), B.padEnd(24), `sw.js commit: ${content.split('\n')[1]}${content.split('\n')[2] ? ' + ' + content.split('\n')[2] : ''}`);
}
for (const [name, payload, env, want] of cases) {
  const got = hook(name, payload, env);
  if (got !== want) bad++;
  const what = payload.tool_input?.command || payload.tool_input?.query || payload.tool_input?.file_path || payload.tool_input?.relative_path || payload.tool_input?.path || JSON.stringify(payload.tool_input);
  console.log(got === want ? '✅' : '❌', want.padEnd(5), name.padEnd(24), String(what).slice(0, 70));
}
console.log(bad ? `\n${bad} case(s) FAILED` : `\nall ${cases.length} cases pass`);
process.exit(bad ? 1 : 0);
