# Web Push (1.4.0 Phase 2) — verified build plan

Locked from adversarially-verified research (2026-07-21, all high-confidence). Reaches the ~23/33
web players the native reminder engine can't touch. Build is ready; two steps are Alex's (VAPID keys).

## The reality that shapes everything
- **Desktop Chrome/Edge/Firefox, macOS Safari, Android Chrome:** web push works in a NORMAL tab, no install.
- **iOS/iPadOS Safari (16.4+):** web push works ONLY when the site is **installed to the Home Screen** (standalone PWA). A plain Safari tab can't receive push and doesn't even expose PushManager. → **iOS web-push is entirely downstream of install-conversion (Phase 1).** Gate the iOS prompt behind `display-mode: standalone`; in a plain iOS tab, show the install explainer, not a dead Subscribe button.
- EU PWAs keep push (Apple reversed the Feb-2024 removal on 1 Mar 2024). Do NOT code EU users out. (Separate from the native App Store DSA delisting.)

## Send side (Supabase Edge, Deno)
- **Library: `jsr:@negrel/webpush` (pinned). NOT `npm:web-push`** — npm:web-push relies on node crypto Sign/ECDH + require('https') and is broken on Deno Deploy (Deno #17257; aes128gcm output Chrome can't decrypt, Deno #23693). `@negrel/webpush` is pure Web Crypto (RFC 8291/8292), the same `crypto.subtle` surface the existing `send-push` APNs function already proves works on the deployed runtime.
- **New function `supabase/functions/send-web-push/index.ts`**, mirroring `send-push`: a SECOND Database Webhook on `public.notifications` (INSERT), reusing the same `PUSH_WEBHOOK_SECRET` header check. Both senders fire off the same notifications row, each targeting its own token store.
- **New table `public.web_push_subscriptions`** `(user_id uuid, subscription jsonb, endpoint text unique, created_at timestamptz default now())`. Follow the migration rules: explicit `REVOKE` on the new table (supabase_admin grants anon DML by default); if an RPC is added, `GRANT` then `REVOKE ... FROM PUBLIC`. RLS: a user reads/writes only their own rows.
- Reuse ONE `ApplicationServer` instance at module scope. **Prune on BOTH 404 and 410** (`.isGone()` only catches 410). Do NOT prune on 400/401/403 (those are payload/VAPID errors). TTL short for time-sensitive pings.

## Client + service worker
- **`src/lib/webpush.js`** — `enablePush()` called ONLY from a user-gesture button (never on load): `Notification.requestPermission()` → `navigator.serviceWorker.ready` → `urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)` → `getSubscription()` (unsubscribe if the stored key differs) → `subscribe({ userVisibleOnly: true, applicationServerKey })` → POST `sub.toJSON()` (upsert by `endpoint`). Mirror `notifications.js`'s eligibility + native guards.
- **`public/sw.js`** (currently caching-only, `balliq-v9`) — add three listeners, **bump CACHE_VERSION**:
  - `push` → ALWAYS `showNotification(title, {body, icon, badge, tag, data:{url}})` inside `waitUntil` (skipping it triggers the silent-push penalty → browser revokes permission).
  - `notificationclick` → `close()`, then focus a matching client or `clients.openWindow(deepLink)` (e.g. `/footle`).
  - `pushsubscriptionchange` → re-subscribe using an **embedded VAPID public-key constant** (the SW cannot read `import.meta.env`) + re-POST. Also re-subscribe on startup when permission is already granted (Safari doesn't fire this event reliably).
- Gotchas: `userVisibleOnly:true` is required (Chrome/Edge reject without it); `renotify` needs a `tag`; keep payload < ~3.9KB.

## Daily-reminder dependency (links to Phase 3)
The `notifications`-row path is for EVENT pushes (invites/rematch). A DAILY "your Footle is up" **web** push needs a SERVER trigger — a Supabase cron that inserts notification rows (or calls send-web-push) for users who haven't played today. So the daily web reminder = Phase 2 (this) + Phase 3 (the cron). Event pushes work with Phase 2 alone.

## Alex's two steps (the only gates)
1. Generate the VAPID keypair: `deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts` → yields `{publicKey, privateKey}` JSON.
2. `supabase secrets set VAPID_KEYS='<the JSON>' VAPID_SUBJECT='mailto:support@balliq.app'`, and give me the **public** key to put in `VITE_VAPID_PUBLIC_KEY` (Vercel env) + the embedded SW constant.

## Build checklist (mine, once keys exist)
- [ ] migration: `web_push_subscriptions` (+ REVOKE) ; RLS own-rows
- [ ] `supabase/functions/send-web-push/index.ts` (jsr:@negrel/webpush, mirror send-push, prune 404/410)
- [ ] 2nd DB webhook on notifications INSERT → send-web-push (with PUSH_WEBHOOK_SECRET)
- [ ] `src/lib/webpush.js` (enablePush, eligibility gate incl. iOS-standalone branch)
- [ ] `public/sw.js` push/notificationclick/pushsubscriptionchange + CACHE_VERSION bump
- [ ] opt-in button at a value moment (mirror the local-reminder pre-prompt timing)
- [ ] ONE live send against a real browser before wiring the trigger
- [ ] verify the whole flow in a desktop browser (fully testable without an iOS device)
