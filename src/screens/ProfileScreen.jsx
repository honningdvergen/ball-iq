import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../useAuth.jsx";
import { supabase } from "../supabase.js";
import { useModalA11y } from "../useModalA11y.js";
import { APP_NAME, LEVELS, getLevelInfo, iqPercentile, computeBadges } from "../lib/scoring.js";

export const BADGE_DEFS = [
  ["first_blood", "🎯", "First Whistle", "Complete your first game"],
  ["roll5",       "🔥", "On a Roll",     "5-day streak"],
  ["roll30",      "🔥", "Obsessed",      "30-day streak"],
  ["speed_demon", "⚡", "Speed Demon",   "Score 600+ Speed Round"],
  ["big_brain",   "🧠", "Big Brain",     `${APP_NAME} 120+`],
  ["goat",        "🐐", "The GOAT",      `${APP_NAME} 140+`],
  ["perfect",     "💎", "Perfectionist", "Score 10/10"],
  ["survivor",    "🏆", "Survivor",      "20+ in Survival"],
  ["scholar",     "📚", "Scholar",       "500 correct answers"],
  ["faithful",    "⚽", "Faithful",      "Play 50 games"],
  ["legend_xp",   "👑", "Legend",        "Reach 3000 XP"],
  ["world_class", "🌍", "World Class",   "100 World Cup Qs"]
];

export const AVATARS = ["⚽","🏆","🔥","⭐","🧠","🎯","👑","🌍","🐐","💎","🦁","🦅","🐺","🐉","🚀","⚡","🏅","🥇","🥈","🥉","🔮","🌟","💫","🌈","🎭","🎨","🦊","🐬","🦋","🎵","🌺","🏄"];

// Map any legacy string IDs (a pre-emoji convention that survives in some
// older profile rows — see useAuth.jsx fallback) onto their emoji equivalent.
// Real emojis pass through unchanged. Unknown legacy strings default to ⚽
// rather than render as plain text "ball" / "lion" / etc.
const LEGACY_AVATAR_IDS = {
  ball: "⚽", trophy: "🏆", fire: "🔥", star: "⭐", brain: "🧠",
  target: "🎯", crown: "👑", world: "🌍", goat: "🐐", diamond: "💎",
  lion: "🦁", eagle: "🦅", wolf: "🐺", dragon: "🐉", rocket: "🚀",
};
export function avatarEmoji(v) {
  if (!v || typeof v !== "string") return "⚽";
  if (LEGACY_AVATAR_IDS[v]) return LEGACY_AVATAR_IDS[v];
  // Plain ASCII looks like an unmapped legacy id — fall back rather than
  // render text. Real emojis are non-ASCII so they sail through.
  if (/^[a-z_-]+$/i.test(v)) return "⚽";
  return v;
}

// ─── IMAGE CROPPER (cropperjs from CDN) ──────────────────────────────────────
let _cropperPromise = null;
function ensureCropperLoaded() {
  if (_cropperPromise) return _cropperPromise;
  const loader = new Promise((resolve, reject) => {
    try {
      if (typeof window !== "undefined" && window.Cropper) {
        resolve(window.Cropper);
        return;
      }
      if (typeof document === "undefined") {
        reject(new Error("No document"));
        return;
      }
      // Inject CSS once
      if (!document.querySelector('link[data-cropperjs]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";
        link.setAttribute("data-cropperjs", "1");
        document.head.appendChild(link);
      }
      // Reuse an existing script tag if present
      let script = document.querySelector('script[data-cropperjs]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
        script.async = true;
        script.setAttribute("data-cropperjs", "1");
        document.head.appendChild(script);
      }
      script.addEventListener("load", () => {
        if (window.Cropper) resolve(window.Cropper);
        else reject(new Error("Cropper global missing after load"));
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("cropper.js failed to load")), { once: true });
      // Already loaded edge case
      if (window.Cropper) resolve(window.Cropper);
    } catch (e) {
      reject(e);
    }
  });
  // 10s ceiling on the CDN fetch — if cdnjs is slow or unreachable the user
  // gets a toast and the modal closes instead of an indefinite spinner.
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("cropper.js load timed out")), 10000)
  );
  _cropperPromise = Promise.race([loader, timeout]).catch((err) => {
    // Allow a retry on the next attempt — leaving the rejected promise cached
    // would mean the crop modal stays broken until a full reload.
    _cropperPromise = null;
    throw err;
  });
  return _cropperPromise;
}

function CropModal({ file, onCancel, onConfirm, onLoadError }) {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);
  const modalRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useModalA11y({ isOpen: true, onClose: onCancel, ref: modalRef });
  // Audit Phase 5 (F2): handleUse catch could fire setError/setBusy on the
  // unmounted component if onConfirm closes the modal then throws.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Build an object URL for the selected file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Audit Phase 5 (F1): ref-stabilize onLoadError so the cropper-load
  // effect doesn't re-fire on every parent render. Caller passes an
  // inline arrow at the CropModal site, so the prop identity changes
  // every parent re-render. The effect is a one-shot CDN load — its
  // re-fire was wasteful (ensureCropperLoaded is module-cached so no
  // observable network re-load, but the chained promise + cancelled
  // dance still ran on each render). The ref pattern means the effect
  // runs once per mount; onLoadErrorRef.current always returns the
  // freshest callback at fire time.
  const onLoadErrorRef = useRef(onLoadError);
  useEffect(() => { onLoadErrorRef.current = onLoadError; });

  // Load cropperjs from CDN (cached after first call)
  useEffect(() => {
    let cancelled = false;
    ensureCropperLoaded()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => {
        if (cancelled) return;
        const isTimeout = /timed out/i.test(e?.message || "");
        setError(isTimeout ? "Couldn't load image editor" : "Something went wrong — try again");
        onLoadErrorRef.current?.();
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize Cropper once the library is loaded AND the image element is in the DOM
  useEffect(() => {
    if (!ready || !imgUrl || !imgRef.current) return;
    const Cropper = window.Cropper;
    if (!Cropper) return;
    const node = imgRef.current;
    const init = () => {
      try {
        cropperRef.current = new Cropper(node, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          background: false,
          responsive: true,
          restore: false,
          zoomable: true,
          scalable: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          guides: false,
          center: true,
          movable: true,
        });
      } catch (e) {
        setError("Something went wrong — try again");
      }
    };
    if (node.complete && node.naturalWidth > 0) init();
    else {
      const onLoad = () => init();
      node.addEventListener("load", onLoad, { once: true });
      node.addEventListener("error", () => setError("Image failed to load"), { once: true });
      // Cleanup listener if the effect tears down before load
      return () => {
        node.removeEventListener("load", onLoad);
        if (cropperRef.current) { try { cropperRef.current.destroy(); } catch {} cropperRef.current = null; }
      };
    }
    return () => {
      if (cropperRef.current) { try { cropperRef.current.destroy(); } catch {} cropperRef.current = null; }
    };
  }, [ready, imgUrl]);

  const handleUse = async () => {
    if (!cropperRef.current || busy) return;
    setBusy(true);
    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!canvas) throw new Error("Could not get cropped canvas");
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob returned null"))),
          "image/jpeg",
          0.9
        );
      });
      await onConfirm?.(blob);
    } catch (e) {
      if (mountedRef.current) {
        setError("Something went wrong — try again");
        setBusy(false);
      }
    }
  };

  return (
    <div ref={modalRef} tabIndex={-1} className="crop-overlay" role="dialog" aria-modal="true" aria-label="Crop your photo">
      <div className="crop-header">Crop your photo</div>
      <div className="crop-stage crop-circle-mask">
        {imgUrl && (
          <img
            ref={imgRef}
            src={imgUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }}
          />
        )}
        {!ready && !error && (
          <div className="crop-status">Loading cropper…</div>
        )}
        {error && <div className="crop-status crop-status-err">{error}</div>}
      </div>
      <div className="crop-actions">
        <button
          className="crop-btn secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          className="crop-btn primary"
          onClick={handleUse}
          disabled={!ready || busy || !!error}
        >
          {busy ? "Uploading…" : "Use Photo"}
        </button>
      </div>
    </div>
  );
}

// ─── FRIENDS SECTION ──────────────────────────────────────────────────────────
// Lives inside ProfileScreen. Requires an authenticated user (userId). When
// isActive is true the section loads friendships on mount and after any action
// so counts + lists stay fresh when the user returns to the Profile tab.
function FriendsSection({ userId, currentUserScore, currentUserName, currentUserAvatar, onChallenge, onToast, onOpenFriend }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [loading, setLoading] = useState(false);
  // Sprint #62 fix 2: track load error separately. Previously a network
  // failure during loadFriendships() was logged but not surfaced — the UI
  // fell through to the empty-state "No friends yet" copy, telling users
  // with real friends that they had none. Now we render an error message
  // with a retry instead.
  const [loadError, setLoadError] = useState(false);
  const toast = onToast || (() => {});
  // Sprint #70 LL1: per-key in-flight guard on friend actions. Without it,
  // a double-tap on Add fires two INSERTs; the second hits the unique
  // constraint and surfaces a misleading "Couldn't send request" toast
  // immediately after a successful send. Same race surface on Cancel/
  // Accept/Decline. Key shape: `${verb}:${id}`.
  const inFlightRef = useRef(new Set());

  const loadFriendships = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(false);
    // Sprint #61 DD1: paginate. PostgREST caps single-request rows at 1000.
    // Same class of silent-truncation bug fixed in ReviewScreen (Sprint #37):
    // popular users could exceed 1000 friendship rows (accepted + pending +
    // declined combined), and the unpaged SELECT would drop the overflow.
    try {
      const PAGE = 1000;
      const rows = [];
      const cols = "*,requester:profiles!requester_id(id,username,avatar:avatar_id,total_score),addressee:profiles!addressee_id(id,username,avatar:avatar_id,total_score)";
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("friendships")
          .select(cols)
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE) break;
      }
      setFriendships(rows);
    } catch (e) {
      console.error("[friends] load", e?.message || "Unknown error");
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadFriendships();
  }, [userId, loadFriendships]);

  // Realtime: surface incoming friend requests as soon as they're inserted on
  // Supabase, so the user doesn't have to leave and re-enter Friends to see
  // them. Subscribed only while the section is mounted.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`friendships:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friendships", filter: `addressee_id=eq.${userId}` },
        async (payload) => {
          const requesterId = payload?.new?.requester_id;
          let name = "someone";
          if (requesterId) {
            try {
              const { data } = await supabase.from("profiles").select("username").eq("id", requesterId).maybeSingle();
              if (data?.username) name = data.username;
            } catch {}
          }
          toast(`📩 New friend request from ${name}`);
          loadFriendships();
        }
      )
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [userId, loadFriendships, toast]);

  // Derived lists
  const incoming = friendships.filter(f => f.status === "pending" && f.addressee_id === userId);
  const outgoing = friendships.filter(f => f.status === "pending" && f.requester_id === userId);
  const accepted = friendships.filter(f => f.status === "accepted");

  // Set of user ids we shouldn't show in search (already friended or pending)
  const excludedIds = useMemo(() => {
    const s = new Set([userId]);
    friendships.forEach(f => {
      if (f.status === "declined") return;
      s.add(f.requester_id); s.add(f.addressee_id);
    });
    return s;
  }, [friendships, userId]);

  // Debounced search
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,username,avatar:avatar_id,total_score")
          .ilike("username", `%${q}%`)
          .limit(10);
        if (cancelled) return;
        if (error) throw error;
        // Filter out self + already-friended/pending users so search
        // surfaces only addable players.
        setResults((data || []).filter(p => !excludedIds.has(p.id)));
      } catch (e) {
        console.error("[friends] search", e?.message || "Unknown error", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, excludedIds]);

  const sendRequest = async (target) => {
    if (!userId) return;
    const key = `send:${target.id}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({ requester_id: userId, addressee_id: target.id });
      if (error) throw error;
      toast(`Friend request sent to ${target.username} ✉️`);
      setResults(prev => prev.filter(p => p.id !== target.id));
      loadFriendships();
    } catch (e) {
      console.error("[friends] sendRequest", e?.message || "Unknown error");
      toast("Couldn't send request — try again");
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  const setStatus = async (friendshipId, status) => {
    const key = `status:${friendshipId}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", friendshipId);
      if (error) throw error;
      loadFriendships();
    } catch (e) {
      console.error("[friends] setStatus", e?.message || "Unknown error");
      toast("Couldn't update — try again");
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  const cancelRequest = async (friendshipId) => {
    const key = `cancel:${friendshipId}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
      loadFriendships();
    } catch (e) {
      console.error("[friends] cancel", e?.message || "Unknown error");
      toast("Couldn't cancel — try again");
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  // Mini-leaderboard: accepted friends + me, sorted by total_score desc.
  // Depend on `friendships` (stable state ref) not on derived `accepted` which
  // is a fresh array every render — otherwise the memo never actually hits.
  const leaderboard = useMemo(() => {
    const rows = friendships
      .filter(f => f.status === "accepted")
      .map(f => {
        const other = f.requester_id === userId ? f.addressee : f.requester;
        return other ? { id: other.id, username: other.username, avatar: other.avatar, score: other.total_score || 0, isMe: false } : null;
      })
      .filter(Boolean);
    rows.push({ id: userId, username: currentUserName || "You", avatar: avatarEmoji(currentUserAvatar), score: currentUserScore || 0, isMe: true });
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [friendships, userId, currentUserScore, currentUserName, currentUserAvatar]);

  const otherOf = (f) => f.requester_id === userId ? f.addressee : f.requester;

  return (
    <div className="friends-section">
      {/* Search */}
      <div className="friends-search-wrap">
        <input
          className="friends-search-inp"
          type="search"
          inputMode="search"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="Find a friend by username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {search.trim().length >= 2 && (
        <div className="friends-results">
          {searching && <div className="friends-muted">Searching…</div>}
          {!searching && results.length === 0 && (() => {
            const term = search.trim();
            const hasSpace = /\s/.test(term);
            const hasSpecial = /[^A-Za-z0-9_-]/.test(term.replace(/\s/g, ""));
            return (
              <div className="friends-muted" style={{display:"flex",flexDirection:"column",gap:4}}>
                <div>No players found — try a different username</div>
                <div style={{fontSize:12,color:"var(--t3)"}}>Make sure you've typed their username exactly</div>
                {(hasSpace || hasSpecial) && (
                  <div style={{fontSize:12,color:"var(--t3)"}}>Tip: usernames don't contain spaces</div>
                )}
              </div>
            );
          })()}
          {results.map(r => (
            <div key={r.id} className="friends-row">
              <div className="friends-avatar">{avatarEmoji(r.avatar)}</div>
              <div className="friends-meta">
                <div className="friends-name">{r.username}</div>
                <div className="friends-sub numeric-mono">Score {(r.total_score || 0).toLocaleString()}</div>
              </div>
              <button className="friends-action" onClick={() => sendRequest(r)}>Add</button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming pending */}
      {incoming.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">Incoming requests</div>
          {incoming.map(f => {
            const p = otherOf(f);
            if (!p) return null;
            return (
              <div key={f.id} className="friends-row">
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub numeric-mono">Score {(p.total_score || 0).toLocaleString()}</div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button className="friends-action accept" onClick={() => setStatus(f.id, "accepted")}>Accept</button>
                  <button className="friends-action decline" onClick={() => setStatus(f.id, "declined")}>Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">Pending</div>
          {outgoing.map(f => {
            const p = otherOf(f);
            if (!p) return null;
            return (
              <div key={f.id} className="friends-row">
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub">Pending…</div>
                </div>
                <button className="friends-action decline" onClick={() => cancelRequest(f.id)} aria-label="Cancel friend request">Cancel</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Friends list */}
      <div className="friends-block">
        <div className="friends-block-title">Your friends{accepted.length > 0 ? ` · ${accepted.length}` : ""}</div>
        {loading && accepted.length === 0 && <div className="friends-muted">Loading…</div>}
        {/* Sprint #62 fix 2: error state takes precedence over the empty
            state. A failed network load is otherwise indistinguishable
            from "no friends" — users with real friends were being told
            they had none on a flaky connection. */}
        {!loading && loadError && (
          <div className="friends-muted" style={{display:"flex",flexDirection:"column",gap:6}}>
            <div>Couldn't load your friends.</div>
            <button
              onClick={loadFriendships}
              style={{background:"transparent",border:"1px solid var(--accent)",color:"var(--accent)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",alignSelf:"flex-start",fontFamily:"inherit"}}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !loadError && accepted.length === 0 && <div className="friends-muted">No friends yet — search above to add some.</div>}
        {accepted.map(f => {
          const p = otherOf(f);
          if (!p) return null;
          return (
            <div key={f.id} className="friends-row">
              <button className="friends-row-tap" onClick={() => onOpenFriend && onOpenFriend(p)} aria-label={`View ${p.username}'s profile`}>
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub numeric-mono">Score {(p.total_score || 0).toLocaleString()}</div>
                </div>
              </button>
              <button className="friends-action challenge" onClick={() => onChallenge && onChallenge(p)}>Challenge</button>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <div className="friends-block">
          <div className="friends-block-title">Friends leaderboard</div>
          <div className="friends-lb">
            {leaderboard.map((row, i) => {
              const inner = (
                <>
                  <div className="friends-lb-rank numeric-mono">#{i + 1}</div>
                  <div className="friends-avatar">{avatarEmoji(row.avatar)}</div>
                  <div className="friends-name" style={{flex:1}}>{row.username}{row.isMe && <span className="friends-you-pill" aria-label="You">YOU</span>}</div>
                  <div className="friends-lb-score numeric-mono">{row.score.toLocaleString()}</div>
                </>
              );
              if (row.isMe) {
                return <div key={row.id} className="friends-lb-row you">{inner}</div>;
              }
              return (
                <button key={row.id} className="friends-lb-row" onClick={() => onOpenFriend && onOpenFriend(row)}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FRIEND PROFILE SCREEN ────────────────────────────────────────────────────
// Read-only profile screen for viewing another user. Mirrors the user's own
// Profile layout but: no avatar/name edit affordances, no friends list, no
// badges grid (those are personal). Day Streak tile is intentionally omitted
// because login streak is local-only and never persisted to Supabase.
function FriendProfileScreenImpl({ friendId, onBack, onChallenge }) {
  const [data, setData] = useState(null); // null = loading, false = error, object = loaded
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_id, total_score, games_played, correct_answers, xp, stats')
          .eq('id', friendId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !row) { setData(false); return; }
        setData(row);
      } catch {
        if (!cancelled) setData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [friendId]);

  if (data === null) {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
          <div className="page-title">Loading…</div>
        </div>
        <div style={{padding:"40px 20px",color:"var(--t3)",textAlign:"center"}}>Loading profile…</div>
      </div>
    );
  }
  if (data === false) {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
          <div className="page-title">Profile</div>
        </div>
        <div style={{padding:"40px 20px",color:"var(--t3)",textAlign:"center"}}>Couldn't load this profile.</div>
      </div>
    );
  }

  const friendXp = data.xp || 0;
  const { level } = getLevelInfo(friendXp);
  const friendStats = (data.stats && typeof data.stats === 'object') ? data.stats : {};
  const totalCorrect = data.correct_answers || 0;
  const totalAnswered = friendStats.totalAnswered || 0;
  const gamesPlayed = data.games_played || 0;
  const avatar = avatarEmoji(data.avatar_id);
  const username = data.username || 'Player';
  const hasAnyStats = gamesPlayed > 0 || totalCorrect > 0 || (friendStats.bestScore || 0) > 0;

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">{username}</div>
      </div>
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" style={{cursor:'default'}}>{avatar}</div>
        </div>
        <div className="profile-name" style={{cursor:'default'}}>{username}</div>
        <div className="profile-level-badge">{level.icon} {level.name} <span style={{fontSize:11,color:"var(--t3)",marginLeft:4}}>{friendXp.toLocaleString()} XP</span></div>
      </div>
      {hasAnyStats && (
        <div className="stat-grid" style={{marginBottom:16}}>
          <div className="stat-tile"><div className="st-val">{gamesPlayed}</div><div className="ds-eyebrow st-key">Games</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{totalCorrect}</div><div className="ds-eyebrow st-key">Correct</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestScore||0}<span style={{fontSize:12,color:"var(--t3)"}}>/10</span></div><div className="ds-eyebrow st-key">Best Score</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestStreak||0}</div><div className="ds-eyebrow st-key">Best Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{(() => {
            if (totalAnswered === 0 || totalCorrect > totalAnswered) return "—";
            return `${Math.round(100 * totalCorrect / totalAnswered)}%`;
          })()}</div><div className="ds-eyebrow st-key">Accuracy</div></div>
          {friendStats.bestIQ > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{friendStats.bestIQ}</div><div className="ds-eyebrow st-key">Best IQ</div></div>}
          {friendStats.bestHotStreak > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>{friendStats.bestHotStreak}</div><div className="ds-eyebrow st-key">⚡ Hot Streak</div></div>}
          {friendStats.bestTrueFalse > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestTrueFalse}<span style={{fontSize:12,color:"var(--t3)"}}>/20</span></div><div className="ds-eyebrow st-key">✅ T/F Best</div></div>}
        </div>
      )}
      {(() => {
        const currentIdx = LEVELS.indexOf(level);
        const topIdx = LEVELS.length - 1;
        const ordered = LEVELS.map((l, i) => ({ ...l, idx: i }));
        return (
          <div className="journey-section">
            <div className="journey-title">🏆 {username}'s Journey</div>
            <div className="journey-list">
              <div className="journey-line" />
              {ordered.map(tier => {
                const isCurrent = tier.idx === currentIdx;
                const isDone = tier.idx < currentIdx;
                const isNext = tier.idx === currentIdx + 1;
                const isTop = tier.idx === topIdx;
                const state = isCurrent ? "current" : isDone ? "done" : "";
                const xpToGo = Math.max(0, tier.xpNeeded - friendXp);
                return (
                  <div key={tier.name} className={`journey-row ${state}`}>
                    <div className="journey-dot">{isDone ? "✓" : tier.icon}</div>
                    <div className="journey-body">
                      <div className="journey-name">{tier.name}</div>
                      <div className="journey-sub">{tier.xpNeeded.toLocaleString()} XP</div>
                    </div>
                    {isCurrent && <div className="journey-badge current" aria-label="Current level">CURRENT</div>}
                    {isNext && <div className="journey-badge next">{xpToGo.toLocaleString()} XP to go</div>}
                    {!isCurrent && !isNext && !isDone && isTop && (
                      <div className="journey-badge goal">Ultimate goal</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      <button
        className="btn-3d"
        style={{marginTop:16,marginBottom:8}}
        onClick={() => onChallenge && onChallenge({ id: data.id, username, avatar: data.avatar_id })}
      >
        Challenge {username}
      </button>
    </div>
  );
}
export const FriendProfileScreen = React.memo(FriendProfileScreenImpl);

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreenImpl({ profile, setProfile, stats, xp, loginStreak, level: levelProp, earnedBadges, onShareProfile, onShowWeekly, onToast, onChallenge, onOpenFriend, nameEditNonce }) {
  const { user, profile: authProfile, isGuest, uploadAvatar, exitGuestMode } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingCrop, setPendingCrop] = useState(null); // File awaiting crop
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const fileInputRef = useRef(null);
  // Self-review (K2): handleCropConfirm could fire setUploading on the
  // unmounted component if upload completes after the user navigates
  // away from the Profile tab. Same pattern as CropModal F2.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  // Auth profile is fetched async after `user` resolves — show a skeleton in
  // that gap so a returning user doesn't briefly see "Player".
  const authLoading = !!user && !authProfile;
  const localName = (profile?.name || "").trim();
  const hasUsername = !!authProfile?.username && authProfile.username !== "Player";
  const showNameCTA = !authLoading && !hasUsername && (!localName || localName.toLowerCase() === "player");
  const startNameEdit = () => {
    setNameDraft(localName);
    setEditingName(true);
  };
  const saveName = () => {
    const v = nameDraft.trim();
    setProfile(p => ({ ...p, name: v }));
    setEditingName(false);
    // Mirror the change up to Supabase so leaderboards and other devices
    // see the new username. Guests stay local-only.
    if (v && user && !isGuest) {
      supabase.from('profiles').update({ username: v }).eq('id', user.id).then(({ error }) => {
        if (error) toast("⚠️ Couldn't sync name change — check your connection");
      }).catch(() => {
        toast("⚠️ Couldn't sync name change — check your connection");
      });
    }
  };
  // Open the inline editor when the home greeting tells us to.
  useEffect(() => {
    if (nameEditNonce && showNameCTA) startNameEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameEditNonce]);
  // Phase 6a Item 4: tap a badge to expand its detail card below the
  // grid. Tap the same badge again to close. State is local to this
  // screen — no persistence across navigations.
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);
  // Prefer memoized values from the parent; fall back for any legacy caller.
  const level = levelProp || getLevelInfo(xp).level;
  const earned = earnedBadges || computeBadges(stats, xp, loginStreak);
  const iq = stats.bestIQ || null;
  const pctile = iq ? iqPercentile(iq) : null;
  const avatarUrl = authProfile?.avatar_url || null;
  // Sprint #71 MM1: fall back to the app-wide toast bus instead of the
  // native window.alert dialog if no onToast prop was provided. In
  // practice every caller passes onToast — this is defensive.
  const toast = onToast || ((m) => { try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: String(m) })); } catch {} });

  const openAvatarPicker = () => {
    if (uploading) return;
    // Guests can only use emoji — logged-in users get the full menu
    if (user && !isGuest) setShowAvatarMenu(true);
    else setShowEmojiPicker(true);
  };

  const pickFromLibrary = () => {
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileChosen = (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input so selecting the same file again still triggers onChange
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!uploadAvatar) { toast("Photo upload unavailable"); return; }
    // Primary gate against tab-crashes on low-RAM devices: reject large
    // files before CropModal opens, since URL.createObjectURL + <img>
    // decode + cropperjs canvas operate at full source resolution and
    // can OOM on a 30-50MB iPhone "Original" photo. uploadAvatar has a
    // matching defensive check for any caller that bypasses cropping.
    if (file.size > 10 * 1024 * 1024) {
      toast("Photo is too large — please pick one under 10MB");
      return;
    }
    // Defer upload — route through the crop modal first
    setPendingCrop(file);
  };

  const handleCropCancel = () => {
    setPendingCrop(null);
  };

  const handleCropConfirm = async (blob) => {
    setPendingCrop(null);
    if (!blob) return;
    setUploading(true);
    try {
      const result = await uploadAvatar(blob);
      if (result?.error) {
        toast("Could not upload photo — try again");
      } else {
        toast("Profile photo updated ✓");
      }
    } catch {
      toast("Could not upload photo — try again");
    } finally {
      // K2: guard setUploading against post-unmount fires.
      if (mountedRef.current) setUploading(false);
    }
  };

  return (
    <div className="tab-content" style={{background:"var(--bg)"}}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        style={{display:"none"}}
      />
      {isGuest && (stats?.gamesPlayed || 0) > 0 && (
        <div style={{
          background:"linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.06))",
          border:"1px solid var(--accent-b)",
          borderRadius:16,
          padding:"18px 18px 16px",
          marginBottom:14,
          display:"flex",
          flexDirection:"column",
          alignItems:"flex-start",
          gap:6,
        }}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>🌟 Save your progress</div>
          <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.4}}>Sign up to keep your stats, friends and IQ across devices.</div>
          <button
            onClick={() => { try { exitGuestMode?.(); } catch {} }}
            style={{marginTop:8,alignSelf:"stretch",padding:"12px 18px",background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",transition:"opacity 120ms ease"}}
          >
            Sign up free
          </button>
        </div>
      )}
      <div className="profile-card">
        <div className="profile-avatar-wrap" style={authLoading ? {opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"} : undefined}>
          {/* Self-review (K1): div+onClick → button. Both the avatar and
              the edit-pencil affordance trigger the same picker — keeping
              both as separate tap targets matches the visual design.
              Inline reset (appearance/font) overrides UA button defaults
              while preserving the existing .profile-avatar CSS sizing
              and border. */}
          <button
            type="button"
            className="profile-avatar"
            onClick={openAvatarPicker}
            aria-label="Edit profile photo"
            style={avatarUrl
              ? {padding:0, overflow:"hidden", background:"var(--s2)", appearance:"none", WebkitAppearance:"none", font:"inherit"}
              : {appearance:"none", WebkitAppearance:"none", font:"inherit"}}
          >
            {uploading ? (
              <span className="avatar-spinner" aria-label="Uploading…" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.username ? `${profile.username}'s avatar` : "Profile avatar"}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                style={{width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%", display:"block"}}
              />
            ) : (
              avatarEmoji(profile?.avatar)
            )}
          </button>
          <button type="button" className="profile-avatar-edit" onClick={openAvatarPicker} aria-label="Edit profile photo" style={{appearance:"none", WebkitAppearance:"none", font:"inherit"}}>✏️</button>
        </div>
        {authLoading ? (
          <div className="profile-name" style={{opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"}}>
            Loading…
          </div>
        ) : editingName ? (
          <input
            className="profile-name-input"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value.slice(0, 24))}
            onKeyDown={e => {
              if (e.key === "Enter") saveName();
              else if (e.key === "Escape") setEditingName(false);
            }}
            onBlur={saveName}
            placeholder="Your name"
            autoFocus
            aria-label="Your display name"
          />
        ) : showNameCTA ? (
          <>
            <button
              className="profile-name"
              onClick={startNameEdit}
              style={{background:"none",border:"none",padding:0,fontFamily:"inherit",color:"var(--t2)"}}
              aria-label="Set your name"
            >
              Player
            </button>
            <button
              onClick={startNameEdit}
              style={{background:"none",border:"none",padding:"4px 8px",marginTop:2,fontSize:12,fontWeight:600,color:"var(--accent)",cursor:"pointer",fontFamily:"inherit"}}
              aria-label="Set your name"
            >
              ✏️ Tap to set your name
            </button>
          </>
        ) : (
          <div className="profile-name" style={{cursor:"default"}}>
            {authProfile?.username || profile?.name || "Player"}
          </div>
        )}
        <div className="profile-level-badge">{level.icon} {level.name} <span style={{fontSize:11,color:"var(--t3)",marginLeft:4}}>{xp.toLocaleString()} XP</span></div>
        {iq && <div className="profile-iq-line">{APP_NAME}: <strong>{iq}</strong> — Top <strong>{100-pctile}%</strong> of players</div>}
      </div>
      {/* Two peer secondary actions. Both are ghost buttons; the gap-based
          flex container replaces the previous marginTop:-4 hack that was
          overlapping the .share-profile-btn bottom margins. Sprint #34
          BB1 F-P4: `.profile-secondary-actions` class lets desktop CSS
          flip to side-by-side and cap each button to 280px so the pair
          reads as secondary, not as two competing primary actions. */}
      <div className="profile-secondary-actions" style={{display:"flex", flexDirection:"column", gap:8, marginBottom:12}}>
        <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShareProfile}>Share Profile Card</button>
        {onShowWeekly && (
          <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShowWeekly}>Weekly Summary</button>
        )}
      </div>
      {(stats.gamesPlayed || 0) === 0 ? (
        <div style={{
          background:"var(--s1)",
          border:"1px solid var(--border)",
          borderRadius:14,
          padding:"22px 16px",
          marginBottom:16,
          textAlign:"center",
        }}>
          <div style={{fontSize:32, marginBottom:8}}>⚽</div>
          <div style={{fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4}}>No stats yet</div>
          <div style={{fontSize:12, color:"var(--t2)", lineHeight:1.5}}>Play your first game to see your stats here</div>
        </div>
      ) : (
        <div className="stat-grid" style={{marginBottom:16}}>
          <div className="stat-tile"><div className="st-val">{stats.gamesPlayed||0}</div><div className="ds-eyebrow st-key">Games</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>🔥 {loginStreak}</div><div className="ds-eyebrow st-key">Day Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{stats.totalCorrect||0}</div><div className="ds-eyebrow st-key">Correct</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestScore||0}<span style={{fontSize:12,color:"var(--t3)"}}>/10</span></div><div className="ds-eyebrow st-key">Best Score</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestStreak||0}</div><div className="ds-eyebrow st-key">Best Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{(() => {
            const c = stats.totalCorrect || 0;
            const t = stats.totalAnswered || 0;
            // Hide when no data, or when totalCorrect > totalAnswered (legacy
            // data from before totalAnswered was tracked, or cross-device
            // hydration drift) — better to show "—" than nonsense like 528%.
            if (t === 0 || c > t) return "—";
            return `${Math.round(100 * c / t)}%`;
          })()}</div><div className="ds-eyebrow st-key">Accuracy</div></div>
          {stats.bestIQ > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{stats.bestIQ}</div><div className="ds-eyebrow st-key">Best IQ</div></div>}
          {stats.bestHotStreak > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>{stats.bestHotStreak}</div><div className="ds-eyebrow st-key">⚡ Hot Streak</div></div>}
          {stats.bestTrueFalse > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestTrueFalse}<span style={{fontSize:12,color:"var(--t3)"}}>/20</span></div><div className="ds-eyebrow st-key">✅ T/F Best</div></div>}
        </div>
      )}
      {(() => {
        const currentIdx = LEVELS.indexOf(level);
        const topIdx = LEVELS.length - 1;
        // Ascending order: current level lands at the top so the user
        // immediately sees "you are here" without scrolling, with progression
        // reading top→bottom toward the ultimate-goal tier.
        const ordered = LEVELS.map((l, i) => ({ ...l, idx: i }));
        return (
          <div className="journey-section">
            <div className="journey-title">🏆 Your Journey</div>
            <div className="journey-list">
              <div className="journey-line" />
              {ordered.map(tier => {
                const isCurrent = tier.idx === currentIdx;
                const isDone = tier.idx < currentIdx;
                const isNext = tier.idx === currentIdx + 1;
                const isTop = tier.idx === topIdx;
                const state = isCurrent ? "current" : isDone ? "done" : "";
                const xpToGo = Math.max(0, tier.xpNeeded - xp);
                return (
                  <div key={tier.name} className={`journey-row ${state}`}>
                    <div className="journey-dot">{isDone ? "✓" : tier.icon}</div>
                    <div className="journey-body">
                      <div className="journey-name">{tier.name}</div>
                      <div className="journey-sub">{tier.xpNeeded.toLocaleString()} XP</div>
                    </div>
                    {isCurrent && <div className="journey-badge current">YOU ARE HERE</div>}
                    {isNext && <div className="journey-badge next">{xpToGo.toLocaleString()} XP to go</div>}
                    {!isCurrent && !isNext && !isDone && isTop && (
                      <div className="journey-badge goal">Ultimate goal</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {user && !isGuest && (
        <FriendsSection
          userId={user.id}
          currentUserScore={authProfile?.total_score || 0}
          currentUserName={authProfile?.username || profile?.name || "You"}
          currentUserAvatar={avatarEmoji(authProfile?.avatar_id || profile?.avatar)}
          onChallenge={onChallenge}
          onToast={onToast}
          onOpenFriend={onOpenFriend}
        />
      )}
      <div className="badges-section">
        <div className="badges-title">Badges — {earned.size}/{BADGE_DEFS.length} earned</div>
        {earned.size === 0 && (
          <div style={{textAlign:"center",padding:"12px 0",color:"var(--t3)",fontSize:13,marginBottom:8}}>
            Play games to unlock your first badge 🎖️
          </div>
        )}
        <div className="badges-grid">
          {/* Earned badges sort to the front so the user's accomplishments
              read first. Locked tiles still show, just demoted. Within each
              group the original BADGE_DEFS order is preserved. */}
          {[...BADGE_DEFS].sort((a, b) => {
            const aE = earned.has(a[0]);
            const bE = earned.has(b[0]);
            if (aE === bE) return 0;
            return aE ? -1 : 1;
          }).map(([id,icon,name]) => {
            const isEarned = earned.has(id);
            const isSelected = selectedBadgeId === id;
            const baseStyle = isEarned ? {background:"rgba(34,197,94,0.1)",borderColor:"rgba(34,197,94,0.25)"} : {};
            const selectedStyle = isSelected ? {boxShadow:"0 0 0 2px var(--accent)", transform:"scale(0.97)"} : {};
            return (
              <button
                key={id}
                type="button"
                className={`badge-tile ${isEarned?"earned":"locked"}`}
                style={{...baseStyle, ...selectedStyle, cursor:"pointer", fontFamily:"inherit"}}
                onClick={() => setSelectedBadgeId(prev => prev === id ? null : id)}
                aria-label={`${name} — ${isEarned ? "earned" : "locked"}. Tap for details.`}
                aria-expanded={isSelected}
              >
                <span className="badge-icon" style={{filter:isEarned?"none":"grayscale(1) opacity(0.35)"}}>{icon}</span>
                <span className="badge-name" style={{color:isEarned?"var(--t1)":"var(--t3)"}}>{name}</span>
              </button>
            );
          })}
        </div>
        {selectedBadgeId && (() => {
          const def = BADGE_DEFS.find(b => b[0] === selectedBadgeId);
          if (!def) return null;
          const [id, icon, name, desc] = def;
          const isEarned = earned.has(id);
          return (
            <div className="badge-detail-card">
              <div className="bd-icon" style={{filter:isEarned?"none":"grayscale(1) opacity(0.4)"}}>{icon}</div>
              <div className="bd-body">
                <div className="bd-name">{name}</div>
                <div className="bd-desc">{desc}</div>
                <div className={`bd-status ${isEarned?"bd-status-earned":"bd-status-locked"}`}>
                  {isEarned ? "✓ Earned" : "Locked"}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      {showAvatarMenu && (
        <div className="emoji-picker-overlay" onClick={() => setShowAvatarMenu(false)}>
          <div className="emoji-picker-sheet" onClick={e => e.stopPropagation()}>
            <div className="emoji-picker-title">Profile photo</div>
            <div className="avatar-menu">
              <button className="avatar-menu-row" onClick={pickFromLibrary}>
                <span style={{fontSize:22}}>🖼️</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:700, color:"var(--t1)"}}>Choose from library</div>
                  <div style={{fontSize:12, color:"var(--t3)"}}>Upload a photo from your device</div>
                </div>
              </button>
              <button className="avatar-menu-row" onClick={() => { setShowAvatarMenu(false); setShowEmojiPicker(true); }}>
                <span style={{fontSize:22}}>😀</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:700, color:"var(--t1)"}}>Choose emoji avatar</div>
                  <div style={{fontSize:12, color:"var(--t3)"}}>Pick from the emoji set</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showEmojiPicker && (
        <div className="emoji-picker-overlay" onClick={() => setShowEmojiPicker(false)}>
          <div className="emoji-picker-sheet" onClick={e => e.stopPropagation()}>
            <div className="emoji-picker-title">Choose your avatar</div>
            <div className="emoji-grid">
              {AVATARS.map(em => (
                <button key={em} className={`emoji-opt${profile?.avatar===em?" selected":""}`}
                  onClick={() => {
                    setProfile(p => ({...p, avatar:em}));
                    setShowEmojiPicker(false);
                    // Sync emoji choice to Supabase so friend lists and
                    // leaderboards see the new avatar across devices.
                    if (user && !isGuest) {
                      supabase.from('profiles').update({ avatar_id: em }).eq('id', user.id).then(({ error }) => {
                        if (error) toast("⚠️ Couldn't sync avatar — check your connection");
                      }).catch(() => {
                        toast("⚠️ Couldn't sync avatar — check your connection");
                      });
                    }
                  }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {pendingCrop && (
        <CropModal
          file={pendingCrop}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          onLoadError={() => {
            onToast?.("⚠️ Couldn't load image editor — check your connection");
            handleCropCancel();
          }}
        />
      )}
    </div>
  );
}
export const ProfileScreen = React.memo(ProfileScreenImpl);
