// node .claude/hooks/postiz-guard.test.mjs — cases for postiz-guard (kept in a file: the live hook
// would refuse a Bash command that merely contains the test strings).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const P = 'post' + 'iz';
const tmp = '/tmp/pg_test_script.sh';
fs.writeFileSync(tmp, `#!/bin/bash\n# ${P} upload in a comment is fine\n${P} posts:create -c x\n`);
const cases = [
  [`${P} posts:create -c x`, 'deny'], [`social/pz posts:create -c x`, 'allow'], [`${P} auth:status`, 'allow'],
  [`cd a && ${P} upload f.mp4`, 'deny'], [`grep ${P} notes.txt`, 'allow'], [`x=$(${P} posts:list)`, 'deny'],
  [`echo hello`, 'allow'], [`bash ${tmp}`, 'deny'], [`${P} --help`, 'allow'],
];
let bad = 0;
for (const [cmd, want] of cases) {
  const r = spawnSync('node', [new URL('./postiz-guard.mjs', import.meta.url).pathname], { input: JSON.stringify({ tool_input: { command: cmd } }), encoding: 'utf8' });
  const got = /"permissionDecision":"deny"/.test(r.stdout) ? 'deny' : 'allow';
  if (got !== want) bad++;
  console.log(got === want ? '✅' : '❌', want.padEnd(5), cmd);
}
process.exit(bad ? 1 : 0);
