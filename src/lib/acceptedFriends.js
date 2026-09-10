// Accepted friendships, small and read-only — for surfaces that want to ACT on
// a friend rather than manage the relationship.
//
// ⚠️ DELIBERATELY NOT ProfileScreen's FriendsSection loader. That one pages to
// 1,000 rows, carries pending/incoming/outgoing/blocked, subscribes to realtime
// inserts and owns the search box, because it is a relationship MANAGER. The
// Multiplayer tab needs one thing: who can I challenge right now. Reusing the
// manager would have meant mounting the whole thing twice; copying its query
// would have meant two paging loops drifting apart. This is the third option —
// the narrow read, in one place, for anyone who needs it.
import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";

const COLS =
  "requester_id,addressee_id," +
  "requester:profiles!requester_id(id,username,avatar:avatar_id,photo:avatar_url,total_score)," +
  "addressee:profiles!addressee_id(id,username,avatar:avatar_id,photo:avatar_url,total_score)";

/**
 * @param {string|null} userId
 * @param {number} max — a rail, not a list; keep it short.
 * @returns {{friends: Array, loading: boolean}}
 */
export function useAcceptedFriends(userId, max = 12) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!userId) { setFriends([]); return undefined; }
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("friendships")
          .select(COLS)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .eq("status", "accepted")
          .limit(max);
        // ⚠️ rpc()/select() RESOLVE on error — the error arrives in the payload,
        // not as a throw. An unchecked `error` here would render an empty rail
        // and look like "you have no friends" to someone who has plenty.
        if (error) throw error;
        if (!alive) return;
        const out = (data || [])
          .map((f) => (f.requester_id === userId ? f.addressee : f.requester))
          .filter((p) => p && p.id);
        setFriends(out);
      } catch (e) {
        console.error("[acceptedFriends]", e?.message || "Unknown error");
        if (alive) setFriends([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId, max]);
  return { friends, loading };
}
