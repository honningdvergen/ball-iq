# Native Push (APNs) — deploy & test checklist

The code is done (client + DB + edge fn + iOS). These are the steps to turn it on.
Apple key already created: Key ID `83D74N8R2J`, Team ID `A99W5L256P`, bundle `app.balliq`,
`.p8` (Sandbox & Production, Team-Scoped). Keep the `.p8` secret.

## 1. Database
Apply the migration (Supabase dashboard → SQL editor, or `supabase db push`):
- `supabase/migrations/v1_3_push_tokens.sql` — the `device_tokens` table + `register_device_token` RPC.
- (The `notifications` table from `v1_3_notifications.sql` should already be live from Phase 1b — if not, apply it too.)

## 2. Edge function
```
supabase functions deploy send-push
```

## 3. Secrets (the .p8 + IDs)
```
supabase secrets set \
  APNS_KEY_ID=83D74N8R2J \
  APNS_TEAM_ID=A99W5L256P \
  APNS_BUNDLE_ID=app.balliq \
  APNS_HOST=api.sandbox.push.apple.com \
  APNS_KEY_P8="$(cat AuthKey_83D74N8R2J.p8)"
```
- **APNS_HOST matters:** use `api.sandbox.push.apple.com` while testing a build run **directly from Xcode** (development). Switch to `api.push.apple.com` for **TestFlight / App Store** builds. (The one `.p8` works for both — only the host changes.)

## 4. Database Webhook (fires the push)
Supabase dashboard → **Database → Webhooks → Create**:
- Table: `public.notifications`, Events: **Insert**
- Type: **Supabase Edge Function → send-push** (or HTTP POST to `https://<project>.supabase.co/functions/v1/send-push` with the `Authorization: Bearer <service_role>` header)
- That's it — every new notification row (e.g. a play invite) now triggers a push to the recipient's devices.

## 5. iOS build
- Open `ios/App/App.xcworkspace` in Xcode → **App target → Signing & Capabilities → + Capability → Push Notifications** (the `aps-environment` entitlement is already in `App.entitlements`; this just registers the capability in the project).
- **Pods:** the push plugin needs its pod installed:
  ```
  rm -rf dist && npx vite build && npx cap sync ios
  ```
  ⚠️ `cap sync` runs `pod install`, which recently failed on this machine (CocoaPods 1.16.2 vs Ruby 4.0.5). If it errors, install/point at a compatible Ruby (3.x) for CocoaPods, or `sudo gem install cocoapods`, then `cd ios/App && pod install`.
- Bump the build number if archiving.

## 6. Test (real device only — push does NOT work in the simulator)
1. Run on a physical iPhone from Xcode, sign in → accept the iOS push prompt.
2. From a **second** account (another device / the web), send a **play invite** to that user.
3. The device should get a banner "X invited you to a game"; tapping it deep-links into the lobby with the room code.
4. If nothing arrives: check the edge function logs (Supabase → Edge Functions → send-push → Logs). 400/410 responses mean bad/expired token; a JWT/`iss` error means a secret is wrong.

## Follow-ups (not in this pass)
- **Friend-request push:** friend requests currently read live from `friendships` (no `notifications` row), so they don't push yet. A small trigger on `friendships` (insert a `friend_request` notification) will light them up — the edge fn already handles that type.
- Web push (VAPID) if you ever want browser notifications — separate path.
