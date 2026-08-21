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

⚠️ **The probe token must be WELL-FORMED.** The first attempt used
`'fcm-probe-token-not-real'`, which FCM rejects as 400 INVALID_ARGUMENT — and we
prune only on 404 UNREGISTERED, so the row survived and the probe read as a
failure when the key was in fact fine. A token shaped like a real one
(`<22 chars>:APA91b<134 chars>`) but never registered gets the 404 the probe
depends on. Garbage in, wrong verdict out.

```sql
-- 1. give the review demo account a well-formed token that was never registered
insert into public.device_tokens (user_id, token, platform)
values ('7fd9b46c-0593-40a3-85f4-fea32d5da46f',
        'DKRYfmt07CJQXelsz6BIPW:APA91bFQbmx8HSdoz_JUfq1ALWhs3CNYju5EPalw7GRcny9ITep0-KVgr2BMXit4DOZkv6FQbmx8HSdoz_JUfq1ALWhs3CNYju5EPalw7GRcny9ITep0-KVgr2BMXit4DOZkv6FQbmx8',
        'android');

-- 2. fire the webhook the normal way
insert into public.notifications (user_id, type, actor_name, payload)
values ('7fd9b46c-0593-40a3-85f4-fea32d5da46f', 'friend_request', 'FCM probe', '{}'::jsonb);

-- 3. read the verdict (wait ~10s for the round trip first)
select platform, left(token, 24) from public.device_tokens
where user_id = '7fd9b46c-0593-40a3-85f4-fea32d5da46f';
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

## Status

**2026-08-21 — `FCM_SERVICE_ACCOUNT` set and VERIFIED in prod.** The probe token
was pruned, which means the RS256 grant was accepted, the OAuth token came back,
and FCM answered as an authenticated caller. Android push is wired end to end;
the only thing missing is a real device on ≥ 1.6.2 to register a token.

Note for whoever rotates this key: Supabase's log API was down during setup, so
the probe was the only available signal. That is the argument for keeping it —
it works with nothing but SQL.
