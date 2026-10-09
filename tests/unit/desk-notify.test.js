// scripts/desk-notify.mjs posts the app session's news to Alex's Telegram desk.
// The repo is public and the bot is shared with the social desk, so the tests
// are about what it must never do.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('../../scripts/desk-notify.mjs', import.meta.url).pathname;
const SRC = readFileSync(SCRIPT, 'utf8');
const run = (args, env = {}) => spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

describe('desk-notify', () => {
  it('only ever sends: it never polls for updates, which would steal the social desk\'s replies', () => {
    const code = SRC.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(code).not.toMatch(/getUpdates|setWebhook|deleteMessage|getChat/);
    expect(code).toMatch(/const METHODS = \['sendMessage', 'sendPhoto', 'sendDocument'\];/);
  });

  it('holds no ids and no token: both come from outside the public repo', () => {
    expect(SRC).not.toMatch(/-100\d{6,}/);          // a supergroup chat id
    expect(SRC).not.toMatch(/\d{8,10}:[\w-]{30,}/); // a bot token
    expect(SRC).toMatch(/find-generic-password/);
  });

  it('says the desk is not set up, with its own exit code, rather than failing obscurely', () => {
    const r = run(['hello', '--dry'], { BIQ_DESK_FILE: join(tmpdir(), 'no-such-desk-file.json') });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/not set up yet/);
  });

  it('a dry run resolves the topic and touches neither the Keychain nor the network', () => {
    const dir = mkdtempSync(join(tmpdir(), 'desk-'));
    const file = join(dir, 'desk.json');
    writeFileSync(file, JSON.stringify({ chat_id: -1, topics: { shipped: 12, alerts: null } }));
    const ok = run(['Top 10 is live', '--topic', 'shipped', '--dry'], { BIQ_DESK_FILE: file });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toMatch(/sendMessage to "shipped", 14 characters/);
    const general = run(['red deploy', '--dry'], { BIQ_DESK_FILE: file });
    expect(general.stdout).toMatch(/to "alerts" \(General\)/);
    const bad = run(['x', '--topic', 'nope', '--dry'], { BIQ_DESK_FILE: file });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/unknown topic "nope" \(have: shipped, alerts\)/);
  });

  it('refuses an empty message', () => {
    expect(run(['--dry']).status).toBe(1);
  });
});
