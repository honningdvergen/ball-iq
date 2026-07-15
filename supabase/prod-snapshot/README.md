# Prod schema snapshot — blcisypmngimqkwxrrdm

Captured **2026-07-14** via the Supabase MCP connector (read-only catalog queries).
Until this snapshot existed, **prod was the only copy** of ~9 migrations' worth of
schema: the repo had 23 migration files against 31 applied in prod, and the
`reap-stale-rooms` pg_cron job existed only in the dashboard. See
`migrations-ledger.md` for the exact reconciliation.

## What this is / is not
- **IS**: a faithful, reviewable copy of every public-schema object — function
  source (`functions.sql`), tables/policies/grants/indexes/triggers/cron
  (`schema.md`). Good enough to rebuild the schema and to review future
  migrations against (REVOKE discipline, RLS coverage).
- **IS NOT**: a byte-perfect `pg_dump`. Column order, comments, and storage
  parameters come from catalog reconstruction. For a canonical baseline, Alex
  runs (needs the DB password from Dashboard → Settings → Database; do not
  paste the password into chat — put it in the connection string yourself):
  `pg_dump "postgresql://postgres:<PW>@db.blcisypmngimqkwxrrdm.supabase.co:5432/postgres" --schema-only --schema=public > supabase/prod-snapshot/pg_dump-baseline.sql`

## SECURITY — redactions
The `send_push_on_notification` trigger definition embeds two live secrets in
its headers (this is Supabase's standard webhook mechanism — the values live in
`pg_trigger` in prod): the **service_role JWT** and the **x-webhook-secret**.
Both are REDACTED in `schema.md`. Consequences:
1. Never commit an UNREDACTED dump of this trigger (a raw `pg_dump` will
   contain both — scrub before committing the baseline above).
2. If the service_role key is ever rotated (it's on the deferred hardening
   list), this trigger must be RECREATED with the new key or push silently dies.

## Refresh
Re-run the catalog queries via the Supabase connector (functions via
`pg_get_functiondef`, policies via `pg_policies`, cron via `cron.job`, etc.)
and overwrite these files. Refresh after ANY dashboard-side change — the whole
point is that the dashboard is no longer the only copy.
