#!/usr/bin/env node
/**
 * supabase-guard — PreToolUse gate on the Supabase MCP SQL tools (apply_migration, execute_sql).
 *
 * ⚠️ WHY. The ball-iq-supabase-migration skill calls these "two rules the user has taught more
 * than once", because the failure is silent: supabase_admin's defaults grant anon execute on new
 * functions (through PUBLIC) and full DML on new tables. Nothing errors; the data is just exposed.
 *   1. Every CREATE FUNCTION ends with `revoke execute on function … from public`.
 *   2. Every CREATE TABLE enables RLS and revokes from anon (and authenticated where intended).
 *
 * DENY when a created function or table has no matching revoke, so the agent fixes the SQL
 * itself. A deliberate exception (e.g. `create or replace` of a function whose grants are being
 * kept on purpose) carries a `-- grants: <reason>` comment, which turns the deny into an ask.
 * DDL sent through execute_sql gets a reminder: migrations go through apply_migration so prod
 * keeps a record (the snapshot in supabase/prod-snapshot/ drifted exactly that way).
 */
let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let tool = '', sql = '';
  try { const j = JSON.parse(raw || '{}'); tool = String(j.tool_name || ''); sql = String(j.tool_input?.query || ''); } catch { /* stay out */ }
  if (!sql) return void process.exit(0);
  const out = (o) => { process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...o } })); process.exit(0); };

  const body = sql.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const name = (s) => s.replace(/"/g, '').replace(/^public\./, '');
  const missing = [];

  for (const m of body.matchAll(/create (?:or replace )?function ((?:"?\w+"?\.)?"?\w+"?)\s*\(/g)) {
    const fn = name(m[1]);
    const re = new RegExp(`revoke [^;]*on function (?:public\\.)?"?${fn}"?\\b[^;]*from [^;]*\\bpublic\\b`);
    if (!re.test(body)) missing.push(`function ${fn}: no \`revoke execute on function public.${fn}(…) from public\``);
  }
  for (const m of body.matchAll(/create table (?:if not exists )?((?:"?\w+"?\.)?"?\w+"?)/g)) {
    const t = name(m[1]);
    const revoke = new RegExp(`revoke [^;]*on (?:table )?(?:public\\.)?"?${t}"?\\b[^;]*from [^;]*\\banon\\b`);
    const rls = new RegExp(`alter table (?:public\\.)?"?${t}"? enable row level security`);
    if (!revoke.test(body)) missing.push(`table ${t}: no \`revoke all on public.${t} from anon\``);
    if (!rls.test(body)) missing.push(`table ${t}: no \`alter table public.${t} enable row level security\``);
  }

  if (missing.length) {
    const reason = `Supabase grants rule (ball-iq-supabase-migration skill): ${missing.join('; ')}. The defaults silently give anon access. Add the revoke/RLS lines at the end of the SQL.`;
    if (/--\s*grants:/i.test(sql)) out({ permissionDecision: 'ask', permissionDecisionReason: `${reason}\n\nThe SQL says the grants are deliberate (-- grants: …), so this asks instead of refusing.` });
    out({ permissionDecision: 'deny', permissionDecisionReason: `${reason}\n\nIf the grants are deliberate, add a \`-- grants: <reason>\` comment and Alex will be asked.` });
  }
  if (/execute_sql$/.test(tool) && /\b(create|alter|drop|grant|revoke)\s+(table|function|policy|index|trigger|view|schema|extension|on)\b/.test(body)) {
    out({ additionalContext: 'Reminder: this is schema-changing SQL through execute_sql. Migrations go through apply_migration so prod keeps a migration record, and refresh supabase/prod-snapshot/ afterwards.' });
  }
  process.exit(0);
});
