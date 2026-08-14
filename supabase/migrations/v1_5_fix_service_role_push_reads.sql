-- ⚠️ iOS PUSH HAS BEEN SILENTLY DEAD. send-push reads device_tokens with the
-- service role and service_role had no SELECT on it, so every APNs delivery
-- failed at the lookup. 31 device tokens are registered; the trigger is
-- enabled; nobody has received anything.
--
-- PROVEN BY EXECUTION, not by reading privilege tables: a throwaway edge
-- function using the same runtime and the same SUPABASE_SERVICE_ROLE_KEY the
-- sender uses reported device_tokens readable:false, notifications
-- readable:false — and, after this migration, 31 and 7 rows respectively.
--
-- Nothing in the app was wrong. A hardening pass revoked more than it meant to
-- and the failure was silent: an edge function logging "lookup failed" into a
-- log nobody reads, for a feature that fires six times a month. It was found
-- only because the SAME mistake appeared in a table created hours earlier and
-- was caught by asserting has_table_privilege after the REVOKE.
--
-- MINIMAL grants, matching what each function actually does:
--   device_tokens  SELECT (find the recipient's devices)
--                  DELETE (prune tokens APNs reports gone — the sender already
--                          does this and would have failed too)
--   notifications  SELECT
-- No INSERT/UPDATE: users write their own rows through RLS, and service_role
-- has bypassrls, so anything wider is a footgun with no upside.
grant select, delete on table public.device_tokens  to service_role;
grant select          on table public.notifications to service_role;

-- Restate the boundary that must never move. anon holds zero table grants
-- across this project, and these two are the ones a leak would hurt most:
-- device_tokens is a list of push capabilities, notifications is personal.
revoke all on table public.device_tokens  from anon;
revoke all on table public.notifications  from anon;

-- ⚠️ RULE THIS COST US TWICE IN ONE DAY: after any REVOKE, ASSERT with
-- has_table_privilege() rather than re-reading the SQL. information_schema
-- .role_table_grants does NOT show privileges inherited via PUBLIC, so a table
-- can look correctly granted there and still be unreadable in practice.
