import { useState, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "../supabase.js";
import { loopEvent } from "../App.jsx";

// Extracted from AppInner on 2026-09-06 (review E16). Inputs: the signed-in
// user, the guest flag, the toast, and the pending-join setter the play-invite
// path routes through. Everything else is this hook's own state.
export function useNotificationCenter({ user, isGuest, showToast, setPendingJoinCode }) {
  // ── Notification center (Phase 1: friend requests) ──────────────────────
  // Surfaces INCOMING pending friend requests globally (a bell + badge + inbox
  // overlay) using the EXISTING friendships table — no new schema. Accept/Decline
  // flip the same status column FriendsSection uses. The badge count is simply
  // the number of pending incoming requests, so it self-clears as they're
  // actioned — no read-state to persist. Play-invites (which need a server
  // record) and native push land in later phases alongside a generic
  // notifications table. Guests have no friendships, so this stays empty for them.
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRequests, setNotifRequests] = useState([]);   // incoming friend requests (from friendships)
  const [notifInvites, setNotifInvites] = useState([]);     // play invites (from notifications table)
  const loadNotifs = useCallback(async () => {
    if (!user?.id) { setNotifRequests([]); setNotifInvites([]); return; }
    // Friend requests — incoming pending rows from friendships.
    try {
      const cols = "id,requester_id,requester:profiles!requester_id(id,username,avatar:avatar_id,photo:avatar_url)";
      const { data } = await supabase
        .from("friendships")
        .select(cols)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .limit(50);
      setNotifRequests(Array.isArray(data) ? data : []);
    } catch { /* soft-fail: the bell just shows no badge */ }
    // Play invites — unread rows from the notifications table (v1_3 migration).
    try {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,actor_name,actor_avatar,payload,created_at")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifInvites(Array.isArray(data) ? data : []);
    } catch { /* table may not exist yet on older deploys — soft-fail */ }
  }, [user?.id]);
  useEffect(() => { loadNotifs(); }, [loadNotifs]);
  // Refresh when the tab regains focus (an event may have arrived while away).
  // Cheap indexed queries; no realtime dependency (free-tier realtime doesn't
  // reliably deliver postgres_changes — see the Stage-1 spike notes).
  useEffect(() => {
    const onFocus = () => loadNotifs();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadNotifs]);
  // Interval poll while signed in + tab visible (2026-07-16). Free-tier realtime
  // doesn't deliver postgres_changes, and focus-only refresh means the bell stays
  // silent for a friend request / play invite that arrives while the app is open
  // and focused. A cheap 30s indexed re-fetch closes that gap on web — the only
  // delivery channel until native APNs banners land in build 45. Skips guests and
  // pauses when hidden so it costs nothing in the background.
  useEffect(() => {
    if (!user?.id || isGuest) return;
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") loadNotifs();
    }, 30000);
    return () => clearInterval(id);
  }, [user?.id, isGuest, loadNotifs]);
  const notifCount = notifRequests.length + notifInvites.length;
  const respondFriendRequest = useCallback(async (id, accept) => {
    setNotifRequests(prev => prev.filter(r => r.id !== id)); // optimistic
    try {
      // ⚠️ DESTRUCTURE `error`. A supabase query builder RESOLVES on an RLS or
      // Postgres failure — it does not reject — so the bare `await` below made
      // this catch unreachable for the only failure that actually happens. The
      // row was removed from the list optimistically and the user was told
      // "✓ Friend added" while the friendship stayed `pending` forever, with
      // no way back: the request had gone from their bell.
      // ⚠️ The identical operation in ProfileScreen.setStatus has always done
      // this correctly. Two implementations, one safe, one not — the recurring
      // shape in this codebase. Fixed to match its sibling.
      const { error } = await supabase
        .from("friendships")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", id);
      if (error) throw error;
      showToast(accept ? "✓ Friend added" : "Request declined");
    } catch (e) {
      console.warn("[friends] respondFriendRequest", e?.message || "Unknown error");
      showToast("Couldn't update — try again");
      loadNotifs();   // put the request back so it can be retried
    }
  }, [showToast, loadNotifs]);
  // Play-invite actions. Join sets pendingJoinCode — the auto-join effect above
  // then routes into the lobby. Both mark the notification read so it clears.
  const joinInvite = useCallback(async (inv) => {
    const code = inv?.payload?.code;
    setNotifInvites(prev => prev.filter(n => n.id !== inv.id)); // optimistic
    setNotifOpen(false);
    try { await supabase.from("notifications").update({ read: true }).eq("id", inv.id); } catch { /* best-effort */ }
    if (code) setPendingJoinCode(String(code).toUpperCase());
    else showToast("This invite's room has expired");
  }, [showToast]);
  const dismissInvite = useCallback(async (inv) => {
    setNotifInvites(prev => prev.filter(n => n.id !== inv.id)); // optimistic
    try { await supabase.from("notifications").update({ read: true }).eq("id", inv.id); } catch { /* best-effort */ }
  }, []);
  // A specific friend can be invited to play: challengeFriend stashes their id;
  // once the auto-created room's code is known (onLobbyEnter) we fire the invite.
  // Returns whether the invite actually landed.
  //
  // It used to return nothing and swallow everything, and the swallow was worse
  // than it looked: supabase.rpc() RESOLVES with {data, error} on a Postgres
  // error rather than throwing, so the try/catch never ran and the real failure
  // sat unread in `error`. Two layers of silence over the same fact.
  //
  // And it fails often, by design. send_play_invite raises 'not friends' unless
  // the two accounts are accepted friends — reasonable, or anyone could ping a
  // stranger by joining their room. But online opponents usually arrive via a
  // shared LINK, not a friendship, so the common case for Rematch is that
  // nobody is notified at all. Callers need to know that to say something true.
  const sendPlayInvite = useCallback(async (addresseeId, code) => {
    loopEvent("share-join");
    if (!addresseeId || !code) return false;
    try {
      const { error } = await supabase.rpc("send_play_invite", { p_addressee: addresseeId, p_code: code });
      if (error) {
        // 'not friends' is expected and not worth Sentry noise; anything else is.
        if (!/not friends/i.test(error.message || '')) {
          console.warn('[sendPlayInvite]', error.message);
          Sentry.captureException(error, { tags: { area: 'play-invite' } });
        }
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[sendPlayInvite]', e?.message || e);
      return false;
    }
  }, []);
  const openNotifs = useCallback(() => { setNotifOpen(true); loadNotifs(); }, [loadNotifs]);
  return { notifOpen, setNotifOpen, notifRequests, notifInvites, notifCount, loadNotifs, respondFriendRequest, joinInvite, dismissInvite, sendPlayInvite, openNotifs };
}
