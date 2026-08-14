-- The native reminder fires at 7pm LOCAL. To match that on web we need each
-- subscriber's offset, and we have nowhere to get it server-side — so capture
-- it at subscribe time, when the browser can just tell us. Captured now rather
-- than later on purpose: retrofitting would mean re-prompting people who have
-- already opted in, which we cannot do silently.
alter table public.web_push_subscriptions
  add column if not exists tz_offset_minutes int not null default 0;

comment on column public.web_push_subscriptions.tz_offset_minutes is
  'Minutes EAST of UTC (Oslo summer = +120). Inverted from JS getTimezoneOffset() '
  'at the client boundary so the sign matches intuition everywhere server-side.';
