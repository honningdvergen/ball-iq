#!/usr/bin/env node
/**
 * gsc.mjs — read Google Search Console for balliq.app directly, with our own key.
 *
 * ⚠️ WHY. GSC was read through the AdvisorPPC connector until it lost the
 * entitlement (2026-08-16: `entitlement_required`); on its free plan it now
 * exposes Google Ads reads only. Since then every rankings read — the title
 * tests, "football quiz" position, the AdSense readiness checks — has meant
 * driving Alex's Chrome through the Performance page. This goes straight to
 * the Search Console API from the same GCP project that owns the PageSpeed key
 * (ball-iq-499016), with no middleman and no dependency.
 *
 * ONE-TIME SETUP (Alex does this; the key never passes through a session):
 *   1. console.cloud.google.com, project ball-iq-499016 → APIs & Services →
 *      enable "Google Search Console API".
 *   2. IAM & Admin → Service accounts → create "gsc-reader" (no roles needed)
 *      → Keys → Add key → JSON. Save it as
 *      ~/.config/balliq/gsc-service-account.json  (outside the repo, never committed)
 *   3. search.google.com/search-console → property https://balliq.app/ →
 *      Settings → Users and permissions → Add user → the service account's
 *      e-mail (…@ball-iq-499016.iam.gserviceaccount.com), permission "Restricted".
 *   Then:  node scripts/gsc.mjs queries --days 28
 *
 * ⚠️ The property is URL-PREFIX `https://balliq.app/`, NOT sc-domain:balliq.app
 * (reference_gsc_property). ⚠️ GSC data runs ~3 days behind: a window ending
 * "today" silently under-counts its last days, so the default end is today − 3.
 *
 * Usage:
 *   node scripts/gsc.mjs queries [--days 28] [--page /quiz/arsenal/] [--query "football quiz"] [--limit 50]
 *   node scripts/gsc.mjs pages   [--days 28] [--query "quiz"] [--limit 50]
 *   node scripts/gsc.mjs countries [--days 28]
 *   node scripts/gsc.mjs daily   [--days 28] [--page /quiz/arsenal/]
 *   add --json for raw rows. --start/--end YYYY-MM-DD override --days.
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SITE = 'https://balliq.app/';
const KEY_PATH = process.env.GSC_KEY_FILE || join(homedir(), '.config/balliq/gsc-service-account.json');
const LAG_DAYS = 3;

const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith('--') ? args[0] : 'queries';
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(`--${name}`);

const DIMS = { queries: ['query'], pages: ['page'], countries: ['country'], daily: ['date'] };
if (!DIMS[mode]) {
  console.error(`Unknown mode "${mode}". Use: queries | pages | countries | daily`);
  process.exit(2);
}

let key;
try {
  key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
} catch {
  console.error(`No Search Console key at ${KEY_PATH}.\nOne-time setup is in the header of scripts/gsc.mjs (create a service account in GCP project ball-iq-499016, save its JSON key there, add its e-mail as a user on the https://balliq.app/ property).`);
  process.exit(3);
}

const b64u = (s) => Buffer.from(s).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token exchange failed: ${JSON.stringify(j)}`);
  return j.access_token;
}

const day = (d) => d.toISOString().slice(0, 10);
const end = opt('end', day(new Date(Date.now() - LAG_DAYS * 864e5)));
const start = opt('start', day(new Date(Date.parse(end) - (Number(opt('days', 28)) - 1) * 864e5)));

const filters = [];
const page = opt('page');
if (page) filters.push({ dimension: 'page', operator: page.startsWith('http') ? 'equals' : 'contains', expression: page });
const query = opt('query');
if (query) filters.push({ dimension: 'query', operator: 'contains', expression: query });

const body = {
  startDate: start,
  endDate: end,
  dimensions: DIMS[mode],
  rowLimit: Number(opt('limit', mode === 'daily' ? 500 : 50)),
  ...(filters.length ? { dimensionFilterGroups: [{ filters }] } : {}),
};

const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
  method: 'POST',
  headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const j = await r.json();
if (!r.ok) {
  const hint = r.status === 403 ? `\n→ Add ${key.client_email} as a user on the https://balliq.app/ property (Settings → Users and permissions).` : '';
  console.error(`Search Console API ${r.status}: ${j.error?.message || JSON.stringify(j)}${hint}`);
  process.exit(1);
}
const rows = j.rows || [];
if (flag('json')) {
  // No process.exit() here: exiting straight after a large write cut the output
  // at the 64 KB pipe buffer (seen with --limit 1000 on the first real read).
  process.stdout.write(JSON.stringify({ start, end, mode, filters, rows }, null, 2) + '\n');
} else {

const tot = rows.reduce((a, x) => ({ c: a.c + x.clicks, i: a.i + x.impressions }), { c: 0, i: 0 });
console.log(`balliq.app · ${mode} · ${start} → ${end}${filters.length ? ' · ' + filters.map((f) => `${f.dimension} ${f.operator} "${f.expression}"`).join(', ') : ''}`);
console.log(`${rows.length} rows · ${tot.c} clicks · ${tot.i} impressions (of the rows shown)\n`);
const w = Math.min(60, Math.max(10, ...rows.map((x) => x.keys[0].replace(SITE, '/').length)));
console.log(`${'key'.padEnd(w)}  ${'clicks'.padStart(6)}  ${'impr'.padStart(7)}  ${'ctr'.padStart(6)}  ${'pos'.padStart(5)}`);
for (const x of rows) {
  const k = x.keys[0].replace(SITE, '/');
  console.log(`${(k.length > w ? k.slice(0, w - 1) + '…' : k).padEnd(w)}  ${String(x.clicks).padStart(6)}  ${String(x.impressions).padStart(7)}  ${(x.ctr * 100).toFixed(1).padStart(5)}%  ${x.position.toFixed(1).padStart(5)}`);
}
}
