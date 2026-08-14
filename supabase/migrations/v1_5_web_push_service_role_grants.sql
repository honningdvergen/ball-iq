-- The sender reads and prunes web_push_subscriptions as service_role. The
-- blanket `revoke all ... from public` in the create migration stripped
-- service_role's inherited DML along with anon's, so
-- has_table_privilege(service_role, …, 'SELECT') came back FALSE and every send
-- would have failed with a vague "lookup failed" and nothing else to go on.
--
-- SELECT to read the subscriptions, DELETE to prune dead endpoints. No INSERT
-- or UPDATE: only the owning user ever writes their own subscription, through
-- RLS. service_role has bypassrls, so this is the whole of its access.
grant select, delete on table public.web_push_subscriptions to service_role;

-- anon must stay at zero. Restated as an assertion rather than a comment: if a
-- future change re-grants it, this migration is the record of the intent.
revoke all on table public.web_push_subscriptions from anon;
