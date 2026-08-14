-- Clone the APNs webhook trigger to also fire send-web-push.
--
-- A Supabase "Database Webhook" IS a trigger calling
-- supabase_functions.http_request(url, method, headers, body, timeout), and the
-- headers argument embeds the service-role JWT and PUSH_WEBHOOK_SECRET as
-- literals. So this derives the new trigger from the existing one ENTIRELY
-- INSIDE the database: the definition is read, rewritten and executed without
-- ever being selected out. Nobody has to look up a secret, and no secret is
-- printed anywhere — including into a migration file that lives in git.
--
-- That last point is why this is a DO block rather than a plain CREATE TRIGGER:
-- writing the trigger literally would commit the service-role JWT to the repo.
--
-- Idempotent: drops any previous version of the new trigger first.
do $$
declare
  src  text;
  dest text;
begin
  select pg_get_triggerdef(t.oid) into src
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal
    and c.relname = 'notifications'
    and t.tgname  = 'send_push_on_notification';

  if src is null then
    raise exception 'send_push_on_notification not found — nothing to clone';
  end if;

  -- Two substitutions, both anchored so they cannot hit anything else:
  --  1. the trigger's own name
  --  2. the target function in the URL path (NOT a bare 'send-push', which
  --     would also match inside the trigger name)
  dest := replace(src, 'send_push_on_notification', 'send_web_push_on_notification');
  dest := replace(dest, 'functions/v1/send-push', 'functions/v1/send-web-push');

  if dest = src then
    raise exception 'substitution produced no change — the URL shape is not what was expected';
  end if;
  if position('functions/v1/send-web-push' in dest) = 0 then
    raise exception 'rewritten trigger does not point at send-web-push';
  end if;

  drop trigger if exists send_web_push_on_notification on public.notifications;
  execute dest;
end $$;
