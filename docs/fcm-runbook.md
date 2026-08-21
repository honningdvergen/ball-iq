# Android push (FCM) — setup and how to prove it works

Firebase project **ball-iq-499016**, Android app **app.balliq** ("Ball IQ Android").
`android/app/google-services.json` ships in the build and is **gitignored** — this
repo is public. Lost it? Re-download from the Firebase console; nothing else needs
to change.

`send-push` routes by `device_tokens.platform`: `ios` → APNs (unchanged since
2026-07), `android` → FCM HTTP v1. Each platform is gated independently, so a
missing FCM secret skips Android sends and **never** blocks iOS.

## The one secret

`FCM_SERVICE_ACCOUNT` — the full service-account key JSON.

- Generate: Firebase console → Project settings → **Service accounts** →
  *Generate new private key*. The download is a real credential.
- Store: Supabase dashboard → Edge Functions → **Secrets** → name
  `FCM_SERVICE_ACCOUNT`, value = the entire JSON file contents.
- Never commit it, never paste it into a chat, never put it in an env file in
  the repo. The dashboard is the only home it needs.

No redeploy is required after setting it — edge functions read `Deno.env` at
cold start and Supabase restarts instances when secrets change.

## Proving the key works — without a real device

The useful trick: a **fake** Android token separates "is the key good" from
"is there a device", because the two failures produce different responses.

```sql
-- 1. give the review demo account a token that cannot exist
insert into public.device_tokens (user_id, token, platform)
values ('7fd9b46c-0593-40a3-85f4-fea32d5da46f', 'fcm-probe-token-not-real', 'android');

-- 2. fire the webhook the normal way
insert into public.notifications (user_id, type, actor_name, payload)
values ('7fd9b46c-0593-40a3-85f4-fea32d5da46f', 'friend_request', 'FCM probe', '{}'::jsonb);

-- 3. read the verdict
select token, platform from public.device_tokens
where token = 'fcm-probe-token-not-real';
```

**The probe token is GONE** → FCM authenticated us, rejected the bogus token with
404 `UNREGISTERED`, and `sendOneFcm` pruned it. The OAuth handshake worked, which
is the only thing in doubt. Self-cleaning: nothing to tidy up.

**The probe token REMAINS** → `fcmAccessToken()` threw, the Android branch was
skipped entirely, and the key is missing or malformed. Delete the row by hand and
re-check the secret.

Use the **demo review account** (`balliq.app.dev+rev@gmail.com`), never a real
player — step 2 writes a genuine notification row.

## Then the real check

Sign in on an Android device running ≥ 1.6.2, allow notifications, and confirm a
row appears:

```sql
select platform, count(*) from public.device_tokens group by platform;
```

Baseline before Android shipped: 35 ios, 0 android.
