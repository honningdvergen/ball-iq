import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../useAuth.jsx";
import { supabase } from "../supabase.js";
import { useModalA11y } from "../useModalA11y.js";
import { APP_NAME, LEVELS, getLevelInfo, iqPercentile, computeBadges } from "../lib/scoring.js";
import { isProfaneUsername } from "../lib/profanity.js";
import { listBlockMaskIds, blockUser, unblockUser, submitReport, REPORT_REASONS } from "../lib/userReports.js";
import { computeCard, CARD_TIERS, tierPalette } from "../lib/ballIqCard.js";
import { Pencil, Share2, Download, Sparkles, Milestone, Compass, Target, Medal, Gamepad2, CircleCheck, Search, Flag, Flame, CalendarCheck, Zap, Brain, Star, Gem, Heart, GraduationCap, Repeat, Crown, Globe } from 'lucide-react';
import { avatarColour } from '../lib/avatarColour.js';
// lift() exists because a dark brand colour at low alpha on a dark card is
// invisible — written for Juventus black on the Trail ladder, and the Premier
// League's #3D195B and the Champions League's #123A8F have exactly that
// problem here. Same helper, same reason; no second copy.

// ⚠️ TWELVE OS EMOJI IN ONE VIEWPORT — the densest patch of borrowed art left
// in the product, and it sat on the screen a player opens to feel proud. Every
// other glyph in the chrome had already moved to lucide, so the badge grid read
// as the one place that got skipped. Second Reading called it the single largest
// remaining contributor to an "assembled" impression.
//
// Emoji also render differently on every OS, at a weight and colour nobody here
// chose, and 🔥 was doing double duty for BOTH streak badges — two rewards that
// looked identical in a grid whose whole job is to be scanned.
//
// Icons are components now, not strings. Each is distinct, and each was checked
// against lucide-react 0.383 rather than assumed to exist.
export const BADGE_DEFS = [
  ["first_blood", Flag,          "First Whistle", "Complete your first game"],
  ["roll5",       Flame,         "On a Roll",     "5-day streak"],
  ["roll30",      CalendarCheck, "Obsessed",      "30-day streak"],
  ["speed_demon", Zap,           "Speed Demon",   "Score 600+ Speed Round"],
  ["big_brain",   Brain,         "Big Brain",     `${APP_NAME} 120+`],
  ["goat",        Star,          "The GOAT",      `${APP_NAME} 140+`],
  ["perfect",     Gem,           "Perfectionist", "Score 10/10"],
  ["survivor",    Heart,         "Survivor",      "20+ in Survival"],
  ["scholar",     GraduationCap, "Scholar",       "500 correct answers"],
  ["faithful",    Repeat,        "Faithful",      "Play 50 games"],
  ["legend_xp",   Crown,         "Legend",        "Reach 3000 XP"],
  ["world_class", Globe,         "World Class",   "100 International Qs"]
];

// ── Profile picture ─────────────────────────────────────────────────────────
//
// One concept, one name. The app used to have TWO: an "avatar" (one of 32
// emoji) and a "profile picture" (an uploaded photo), for a single circle —
// which is confusing to explain and was confusing on screen.
//
// The emoji set is gone. Measured in prod 2026-07-29 before removing it:
// of 108 profiles, 102 were still on the untouched "ball" default and only SIX
// people had ever picked an emoji — while TEN had found the photo upload. A
// full-screen grid of 32 options earning 6 users is not carrying its weight,
// and it was the source of the naming muddle.
//
// So: upload a photo, or you get the Ball IQ ball. The "?" on the mark reads as
// unset, which is exactly what a default is. Identity comes from the username.
//
// Fills its container. Every avatar slot has explicit dimensions (.profile-avatar
// 72px, .friends-avatar 32px, .pd-avatar 80px) AND a font-size left over from the
// emoji days — sizing in `em` looked reasonable and put a 32px ball inside a 72px
// ring. Measured in the simulator, not assumed.
const BALL_SRC = "/marketing/ball.png";

// ProfilePic moved to ../components/ProfilePic.jsx so App.jsx can render an
// avatar WITHOUT pulling this 72 kB lazy module into the main bundle.
// Re-exported here because other modules already import it from this file.
// ⚠️ IMPORT, then re-export. A bare `export { X } from '…'` does NOT bring the
// name into local scope, so this file's own eight <ProfilePic /> usages broke
// the moment the component moved out — invisible to no-undef, and caught only
// by react/jsx-no-undef, which was enabled minutes earlier for exactly this.
import { ProfilePic } from '../components/ProfilePic.jsx';
import BallIqCardFace from '../components/BallIqCardFace.jsx';
export { ProfilePic };


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
      // Inject CSS once. Sprint #73 OO6: SRI hashes harden against
      // CDN compromise — if cdnjs is hijacked, the browser refuses to
      // execute mismatched content. Computed from the actual 1.6.2
      // payload at cdnjs (sha384, base64). When bumping cropper.js
      // versions, recompute both hashes — they're build-pinned to the
      // version above.
      if (!document.querySelector('link[data-cropperjs]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";
        link.integrity = "sha384-6LFfkTKLRlzFtgx8xsWyBdKGpcMMQTkv+dB7rAbugeJAu1Ym2q1Aji1cjHBG12Xh";
        link.crossOrigin = "anonymous";
        link.referrerPolicy = "no-referrer";
        link.setAttribute("data-cropperjs", "1");
        document.head.appendChild(link);
      }
      // Reuse an existing script tag if present
      let script = document.querySelector('script[data-cropperjs]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
        script.integrity = "sha384-jrOgQzBlDeUNdmQn3rUt/PZD+pdcRBdWd/HWRqRo+n2OR2QtGyjSaJC0GiCeH+ir";
        script.crossOrigin = "anonymous";
        script.referrerPolicy = "no-referrer";
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
function FriendsSection({ userId, currentUserScore, currentUserName, currentUserAvatar, currentUserPhoto, onChallenge, onToast, onOpenFriend, onShareProfile }) {
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
  // Sprint #84 AAA3: symmetric block mask — user_ids that should be hidden
  // from search + friend list because either side blocked. Pulled via
  // SECURITY DEFINER RPC (get_block_mask) since the table's SELECT RLS
  // only exposes outgoing blocks.
  const [blockMask, setBlockMask] = useState(() => new Set());
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
      const cols = "*,requester:profiles!requester_id(id,username,avatar:avatar_id,photo:avatar_url,total_score),addressee:profiles!addressee_id(id,username,avatar:avatar_id,photo:avatar_url,total_score)";
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

  // Sprint #84 AAA3: refresh block mask whenever the user changes or the
  // friend section mounts. Refreshed again from FriendProfileScreen via
  // window event after a block/unblock so the list updates without a
  // full reload.
  const refreshBlockMask = useCallback(async () => {
    if (!userId) { setBlockMask(new Set()); return; }
    const mask = await listBlockMaskIds();
    setBlockMask(mask);
  }, [userId]);
  useEffect(() => { refreshBlockMask(); }, [refreshBlockMask]);
  useEffect(() => {
    const onChange = () => refreshBlockMask();
    window.addEventListener('biq:blocks-changed', onChange);
    return () => window.removeEventListener('biq:blocks-changed', onChange);
  }, [refreshBlockMask]);

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

  // Derived lists — Sprint #84 AAA3: filter by symmetric block mask so
  // blocked users disappear from incoming requests, outgoing requests,
  // and accepted-friends list. Block ≠ unfriend at the data layer; the
  // friendship row stays so unblock restores the relationship.
  const blockedOther = (f) => blockMask.has(f.requester_id) || blockMask.has(f.addressee_id);
  const incoming = friendships.filter(f => f.status === "pending" && f.addressee_id === userId && !blockedOther(f));
  const outgoing = friendships.filter(f => f.status === "pending" && f.requester_id === userId && !blockedOther(f));
  const accepted = friendships.filter(f => f.status === "accepted" && !blockedOther(f));

  // Set of user ids we shouldn't show in search (already friended or pending,
  // OR symmetrically blocked).
  const excludedIds = useMemo(() => {
    const s = new Set([userId]);
    blockMask.forEach(id => s.add(id));
    friendships.forEach(f => {
      if (f.status === "declined") return;
      s.add(f.requester_id); s.add(f.addressee_id);
    });
    return s;
  }, [friendships, userId, blockMask]);

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
          // v1.6 guest entry: select("*") instead of a column list — naming
          // is_anon explicitly would 400 the whole query until the migration
          // adds the column, and this code deploys (auto, on push) before the
          // migration is applied. With *, is_anon is simply absent pre-
          // migration and present after. Aliases the old list provided are
          // re-mapped below.
          .select("*")
          .ilike("username", `%${q}%`)
          .limit(10);
        if (cancelled) return;
        if (error) throw error;
        // Filter out self + already-friended/pending users so search
        // surfaces only addable players. v1.6 guest entry: also hide
        // anonymous (invite-link guest) accounts — throwaway identities
        // that can't meaningfully accept a friendship. undefined passes the
        // check pre-migration, when no anon accounts can exist anyway.
        setResults((data || [])
          .filter(p => !excludedIds.has(p.id) && !p.is_anon)
          .map(p => ({ id: p.id, username: p.username, avatar: p.avatar_id, photo: p.avatar_url, total_score: p.total_score })));
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
        return other ? { id: other.id, username: other.username, avatar: other.avatar, photo: other.photo, score: other.total_score || 0, isMe: false } : null;
      })
      .filter(Boolean)
      // Sprint #84 AAA3: blocked users disappear from the leaderboard too.
      .filter(r => !blockMask.has(r.id));
    rows.push({ id: userId, username: currentUserName || "You", avatar: currentUserAvatar, photo: currentUserPhoto, score: currentUserScore || 0, isMe: true });
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [friendships, userId, currentUserScore, currentUserName, currentUserAvatar, currentUserPhoto, blockMask]);

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
          {/* ⚠️ THE "usernames don't contain spaces" TIP WAS A LIE, and it was
              the five-star sign-up blocker wearing a different hat.
              UsernameSetupModal used to reject its own pre-filled suggestion
              for containing a space; that was fixed. This half was not.

              Measured in prod 2026-08-24: profiles has NO check constraint on
              username, and 27 of 218 named accounts (12.4%) carry something
              the tip called impossible — 17 with a space, 10 with a special
              character. deriveUsernameFromIdentity writes them deliberately
              (`fullName.trim().replace(/\s+/g, " ")`, collision suffix
              `${cleaned} ${n}` — another space).

              Search itself is fine: `.ilike("username", "%q%")` matches a
              spaced name correctly. The tip only ever appeared on ZERO
              results, i.e. exactly when someone was already failing to find a
              friend — and it sent them off to retype the name WITHOUT the
              space, which is the one spelling guaranteed not to match. On the
              loop whose k-factor is already 0.23. */}
          {!searching && results.length === 0 && (
            <div className="friends-muted" style={{display:"flex",flexDirection:"column",gap:4}}>
              <div>No players found — try a different username</div>
              <div style={{fontSize:12,color:"var(--t3)"}}>Make sure you've typed their username exactly — spaces included</div>
            </div>
          )}
          {results.map(r => (
            <div key={r.id} className="friends-row">
              <div className="friends-avatar"><ProfilePic value={r.avatar} url={r.photo} name={r.username} /></div>
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
                <div className="friends-avatar"><ProfilePic value={p.avatar} url={p.photo} name={p.username} /></div>
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
                <div className="friends-avatar"><ProfilePic value={p.avatar} url={p.photo} name={p.username} /></div>
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
        {loading && accepted.length === 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:8}} aria-busy="true" aria-label="Loading friends">
            {[0,1,2].map(i => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px"}}>
                <div className="skeleton" style={{width:38,height:38,borderRadius:"50%",flexShrink:0}} />
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <div className="skeleton" style={{height:12,width:`${55-i*10}%`,borderRadius:6}} />
                  <div className="skeleton" style={{height:9,width:`${35-i*5}%`,borderRadius:6}} />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Sprint #62 fix 2: error state takes precedence over the empty
            state. A failed network load is otherwise indistinguishable
            from "no friends" — users with real friends were being told
            they had none on a flaky connection. */}
        {!loading && loadError && (
          <div className="friends-muted" style={{display:"flex",flexDirection:"column",gap:6}}>
            <div>Couldn't load your friends — check your connection.</div>
            <button
              onClick={loadFriendships}
              style={{background:"transparent",border:"1px solid var(--accent)",color:"var(--accent)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",alignSelf:"flex-start",fontFamily:"inherit"}}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !loadError && accepted.length === 0 && (
          <div style={{
            background:"var(--s1)",
            border:"1px solid var(--border)",
            borderRadius:14,
            padding:"22px 16px",
            textAlign:"center",
          }}>
            <div style={{fontSize:32, marginBottom:8}}>👥</div>
            <div style={{fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4}}>No friends yet</div>
            <div style={{fontSize:12, color:"var(--t2)", lineHeight:1.5, marginBottom:14}}>Search above to add friends — or share your profile to invite them.</div>
            <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShareProfile}>Invite a friend</button>
          </div>
        )}
        {accepted.map(f => {
          const p = otherOf(f);
          if (!p) return null;
          return (
            <div key={f.id} className="friends-row">
              <button className="friends-row-tap" onClick={() => onOpenFriend && onOpenFriend(p)} aria-label={`View ${p.username}'s profile`}>
                <div className="friends-avatar"><ProfilePic value={p.avatar} url={p.photo} name={p.username} /></div>
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
                  <div className="friends-avatar"><ProfilePic value={row.avatar} url={row.photo} name={row.username} /></div>
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
function FriendProfileScreenImpl({ friendId, onBack, onChallenge, onToast }) {
  const [data, setData] = useState(null); // null = loading, false = error, object = loaded
  // Sprint #84 AAA3: 3-dot menu + Report + Block surfaces.
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportMessage, setReportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = onToast || (() => {});
  // Focus-trap + ESC-close + focus-restore for the 3-dot / Report / Block
  // dialogs (medical accessibility: they declared role=dialog without the
  // trap, so keyboard users could Tab out of these safety flows and ESC did
  // nothing). Same one-line pattern as the crop modal in this file.
  const menuRef = useRef(null);
  const reportRef = useRef(null);
  const blockRef = useRef(null);
  useModalA11y({ isOpen: menuOpen, onClose: () => setMenuOpen(false), ref: menuRef });
  useModalA11y({ isOpen: reportOpen, onClose: () => !submitting && setReportOpen(false), ref: reportRef });
  useModalA11y({ isOpen: blockConfirmOpen, onClose: () => !submitting && setBlockConfirmOpen(false), ref: blockRef });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_id, avatar_url, total_score, games_played, correct_answers, xp, stats')
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

  const handleReportSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await submitReport({ reportedId: friendId, reason: reportReason, message: reportMessage });
    setSubmitting(false);
    if (error) {
      // Postgres/RLS text is console-only — a reporter gets copy, not a SQLSTATE.
      console.warn('[handleReportSubmit]', error.code || '', error.message);
      toast("⚠️ Couldn't submit the report — check your connection and try again.");
      return;
    }
    setReportOpen(false);
    setReportMessage("");
    toast("Report received. We review these within 24 hours.");
  };
  const handleBlock = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await blockUser(friendId);
    setSubmitting(false);
    if (error) {
      console.warn('[handleBlock]', error.code || '', error.message);
      toast("⚠️ Couldn't block this player — check your connection and try again.");
      return;
    }
    setBlockConfirmOpen(false);
    window.dispatchEvent(new Event('biq:blocks-changed'));
    toast("Blocked.");
    // Bounce out of this profile — viewer no longer has reason to be here.
    if (typeof onBack === 'function') onBack();
  };

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
  const avatar = <ProfilePic value={data.avatar_id} url={data.avatar_url} name={data.username} />;
  const username = data.username || 'Player';
  const hasAnyStats = gamesPlayed > 0 || totalCorrect > 0 || (friendStats.bestScore || 0) > 0;

  return (
    <div className="screen">
      <div className="page-hdr" style={{position:"relative"}}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        {/* The name lives on the card, at 20px, right under the rating. Repeating
            it in the header put it on screen twice within 200px — Alex: "it is
            enough to have the username on the card and not above the card".
            Kept as an accessible heading so the screen is still announced and
            still has a landmark; only the visual duplicate goes. */}
        <div className="page-title sr-only">{username}</div>
        {/* Sprint #84 AAA3: 3-dot menu opens an action sheet with
            Report + Block. Absolute-positioned to the header's right
            edge so it doesn't disturb the centered title layout. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={`More options for ${username}`}
          style={{
            position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            width:36, height:36, borderRadius:10,
            background:"transparent", border:"1px solid var(--border)",
            color:"var(--t1)", fontSize:20, lineHeight:1, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent",
          }}
        >⋮</button>
      </div>
      {/* ⚠️ ONE CARD, AND THE SAME ONE. Alex: "why does the card look like
          this with 2 sections? and not like on my profile? just use the same
          card design". Two mistakes, both mine: I built a bespoke card instead
          of reusing the owner's, and I hardcoded gold when the owner's is
          themed by CARD_TIERS[tier] — which is why his read green and this read
          gold for the same PRO tier. Identity is folded in, so the friend
          profile shows ONE object like yours does, not an identity card with a
          rating card bolted under it. */}
      {(() => {
        const fCat = friendStats.catStats || {};
        const played = Object.values(fCat).some((c) => (c?.a || 0) > 0);
        const acc = (totalAnswered > 0 && totalCorrect <= totalAnswered) ? totalCorrect / totalAnswered : 0.4;
        const card = computeCard(fCat, acc);
        const t = tierPalette(card.tier);
        return (
          // ⚠️ THE OWNER'S CARD, NOT A COPY OF IT. Alex, twice: "why does the
          // card look like this with 2 sections? and not like on my profile?
          // just use the same card design", then "you see how my friends card
          // still is not exactly like the one on my profile?" Both times I
          // fixed it by pasting the markup across, and both times the next
          // restyle forked it again. It is now literally the same component —
          // the only difference a friend's card carries is that the name and
          // the face are not editable here.
          <BallIqCardFace
            card={card}
            played={played}
            style={{ marginBottom: 16 }}
            avatar={
              <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: "50%", border: `2.5px solid ${t.accent}`, overflow: "hidden" }}>{avatar}</div>
            }
            name={
              <div style={{ fontSize: 30, fontWeight: 900, color: t.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
            }
            subline={
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.2, color: t.text, opacity: 0.55, display: "flex", alignItems: "center", gap: 6 }}>
                <level.Icon size={13} strokeWidth={2.3} aria-hidden="true" /> {level.name} · {friendXp.toLocaleString()} XP
              </div>
            }
          />
        );
      })()}
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
            <div className="journey-title"><Milestone size={17} strokeWidth={2.2} /> {username}'s Journey</div>
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
                    <div className="journey-dot">{isDone ? "✓" : <tier.Icon size={17} strokeWidth={2.1} />}</div>
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
        // Bottom clearance: 8px put the button nearly flush with the screen
        // edge on devices with a home indicator (Alex, from a live screenshot,
        // 2026-09-01: "slightly too low... could be a bit further up"). 16px
        // plus the safe-area inset keeps it clear of the indicator on notched
        // phones and still only nudges it ~20px on older ones.
        style={{marginTop:16,marginBottom:"calc(16px + env(safe-area-inset-bottom, 12px))"}}
        onClick={() => onChallenge && onChallenge({ id: data.id, username, avatar: data.avatar_id })}
      >
        Challenge {username}
      </button>

      {/* Sprint #84 AAA3 — 3-dot action sheet */}
      {menuOpen && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"flex-end"}}
          onClick={() => setMenuOpen(false)}
        >
          <div
            ref={menuRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Actions for ${username}`}
            style={{width:"100%",background:"var(--bg)",borderRadius:"16px 16px 0 0",padding:"12px 12px calc(20px + env(safe-area-inset-bottom, 20px))"}}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setReportOpen(true); }}
              style={{display:"block",width:"100%",padding:"16px",background:"transparent",border:"none",color:"var(--t1)",fontSize:16,fontWeight:600,textAlign:"left",cursor:"pointer",borderRadius:10}}
            >🚩 Report</button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setBlockConfirmOpen(true); }}
              style={{display:"block",width:"100%",padding:"16px",background:"transparent",border:"none",color:"#ff6b6b",fontSize:16,fontWeight:600,textAlign:"left",cursor:"pointer",borderRadius:10}}
            >⛔ Block</button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{display:"block",width:"100%",padding:"14px",marginTop:6,background:"var(--s2)",border:"1px solid var(--border)",color:"var(--t2)",fontSize:15,fontWeight:600,cursor:"pointer",borderRadius:12}}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Sprint #84 AAA3 — Report modal */}
      {reportOpen && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"flex-end"}}
          onClick={() => !submitting && setReportOpen(false)}
        >
          <div
            ref={reportRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Report ${username}`}
            style={{width:"100%",background:"var(--bg)",borderRadius:"16px 16px 0 0",padding:"20px 20px calc(28px + env(safe-area-inset-bottom, 20px))"}}
            onClick={e => e.stopPropagation()}
          >
            <div style={{fontSize:18,fontWeight:800,marginBottom:6,color:"var(--t1)"}}>Report {username}</div>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:16}}>Reports go to the Ball IQ team. We review within 24 hours.</div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Reason</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              style={{width:"100%",padding:"12px 14px",fontSize:15,borderRadius:10,border:"1px solid var(--border)",background:"var(--s2)",color:"var(--t1)",marginBottom:14,WebkitAppearance:"none"}}
            >
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label style={{fontSize:12,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Details <span style={{fontWeight:400,textTransform:"none",color:"var(--t3)"}}>(optional, max 500 chars)</span></label>
            <textarea
              value={reportMessage}
              onChange={e => setReportMessage(e.target.value.slice(0, 500))}
              rows={3}
              // fontSize 16, not 14 — iOS auto-zooms on focus below 16 and never
              // restores the scale on blur. Same floor as .typed-inp / .player-inp.
              style={{width:"100%",padding:"12px 14px",fontSize:16,borderRadius:10,border:"1px solid var(--border)",background:"var(--s2)",color:"var(--t1)",resize:"vertical",fontFamily:"inherit",marginBottom:16}}
            />
            <div style={{display:"flex",gap:8}}>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={submitting}
                style={{flex:1,padding:"14px",background:"var(--s2)",border:"1px solid var(--border)",color:"var(--t2)",fontSize:15,fontWeight:600,cursor:submitting?"not-allowed":"pointer",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",opacity:submitting?0.5:1}}
              >Cancel</button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={submitting}
                style={{flex:1,padding:"14px",background:"var(--accent)",border:"none",color:"#000",fontSize:15,fontWeight:700,cursor:submitting?"not-allowed":"pointer",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",opacity:submitting?0.6:1}}
              >{submitting ? "Submitting…" : "Submit report"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sprint #84 AAA3 — Block confirm modal */}
      {blockConfirmOpen && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"flex-end"}}
          onClick={() => !submitting && setBlockConfirmOpen(false)}
        >
          <div
            ref={blockRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Confirm blocking ${username}`}
            style={{width:"100%",background:"var(--bg)",borderRadius:"16px 16px 0 0",padding:"24px 20px calc(28px + env(safe-area-inset-bottom, 20px))"}}
            onClick={e => e.stopPropagation()}
          >
            <div style={{fontSize:18,fontWeight:800,marginBottom:8,color:"var(--t1)"}}>Block {username}?</div>
            <div style={{fontSize:14,color:"var(--t3)",marginBottom:20,lineHeight:1.5}}>They won't see you in search or leaderboards. You won't see them either. You can unblock from Settings → Account → Blocked users.</div>
            <div style={{display:"flex",gap:8}}>
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(false)}
                disabled={submitting}
                style={{flex:1,padding:"14px",background:"var(--s2)",border:"1px solid var(--border)",color:"var(--t2)",fontSize:15,fontWeight:600,cursor:submitting?"not-allowed":"pointer",borderRadius:12,opacity:submitting?0.5:1}}
              >Cancel</button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={submitting}
                style={{flex:1,padding:"14px",background:"#d32f2f",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:submitting?"not-allowed":"pointer",borderRadius:12,opacity:submitting?0.6:1}}
              >{submitting ? "Blocking…" : "Block"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export const FriendProfileScreen = React.memo(FriendProfileScreenImpl);

// ─── BLOCKED USERS SCREEN ─────────────────────────────────────────────────────
// Sprint #84 AAA3. Settings → Account → Blocked users. Lists everyone the
// current user has blocked, with an Unblock button per row. Empty state
// shows "No blocked users." The RLS on user_blocks already restricts the
// SELECT to blocker_id = auth.uid(), so the raw query is safe.
function BlockedUsersScreenImpl({ onBack, onToast }) {
  const [rows, setRows] = useState(null); // null = loading, [] = empty, [...] = list
  const toast = onToast || (() => {});
  const load = useCallback(async () => {
    setRows(null);
    const { data: blocks, error: bErr } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at')
      .order('created_at', { ascending: false });
    if (bErr || !Array.isArray(blocks) || blocks.length === 0) {
      setRows([]);
      return;
    }
    const ids = blocks.map(b => b.blocked_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_id')
      .in('id', ids);
    const map = new Map((profiles || []).map(p => [p.id, p]));
    setRows(blocks.map(b => ({
      id: b.blocked_id,
      username: map.get(b.blocked_id)?.username || 'Unknown',
      avatar: map.get(b.blocked_id)?.avatar_id,
    })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleUnblock = async (id) => {
    const { error } = await unblockUser(id);
    if (error) { toast("⚠️ Couldn't unblock — try again"); return; }
    window.dispatchEvent(new Event('biq:blocks-changed'));
    toast("Unblocked.");
    load();
  };

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">Blocked users</div>
      </div>
      {rows === null ? (
        // Same skeleton pattern as the friends list above — this screen is one
        // tap away from it on the same journey, so the loading states match.
        <div style={{padding:"4px 16px 24px"}} aria-busy="true" aria-label="Loading blocked users">
          {[0,1,2].map(i => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0"}}>
              <div className="skeleton" style={{width:28,height:28,borderRadius:"50%",flexShrink:0}} />
              <div className="skeleton" style={{height:12,width:`${55-i*10}%`,borderRadius:6}} />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div style={{padding:"40px 20px",color:"var(--t3)",textAlign:"center"}}>No blocked users.</div>
      ) : (
        <div style={{padding:"4px 16px 24px"}}>
          {rows.map(row => (
            <div
              key={row.id}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:"1px solid var(--border)"}}
            >
              <div style={{width:28,height:28,flexShrink:0}}><ProfilePic value={row.avatar} url={row.photo} name={row.username} /></div>
              <div style={{flex:1,fontSize:15,fontWeight:600,color:"var(--t1)"}}>{row.username}</div>
              <button
                type="button"
                onClick={() => handleUnblock(row.id)}
                style={{padding:"8px 14px",fontSize:13,fontWeight:600,borderRadius:8,border:"1px solid var(--border)",background:"var(--s2)",color:"var(--t1)",cursor:"pointer"}}
              >Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export const BlockedUsersScreen = React.memo(BlockedUsersScreenImpl);

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreenImpl({ profile, setProfile, stats, xp, loginStreak, bestLoginStreak, level: levelProp, earnedBadges, onShareProfile, onSaveCard, onShowWeekly, onToast, onChallenge, onOpenFriend, onPlayDaily, nameEditNonce, isActiveTab = true }) {
  const { user, profile: authProfile, isGuest, isAnonUser, uploadAvatar, exitGuestMode, openAuthPrompt } = useAuth();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingCrop, setPendingCrop] = useState(null); // File awaiting crop
  // 1.0.2: when a user picks an emoji avatar while a previously-uploaded photo
  // (avatar_url) still exists on authProfile, the photo would keep winning the
  // display and the emoji "wouldn't change". This flag flips the card to show
  // the freshly-picked emoji immediately; we also clear avatar_url server-side
  // so it stays consistent after the next authProfile refetch. Reset to false
  // when a new photo upload succeeds.
  // ── "HERE IS WHAT YOU ARE PLAYING FOR" ─────────────────────────────────────
  // Alex's idea, and a better answer to the empty profile than anything I
  // proposed: a first-timer sees an EXAMPLE elite card before they see their own
  // blank one, and can X it away.
  //
  // ⚠️ The one rule this must not break. The bug fixed earlier today was a
  // fabricated 64 presented as the visitor's OWN rating. A sample card that looks
  // like a real card recreates that in a worse form, so this one is unmistakably
  // an example: it carries an EXAMPLE ribbon, a name that is obviously not yours,
  // and a line saying whose it is. Aspiration, never a claim about you.
  //
  // The dismiss flag is a UX flag, not user data, so per
  // feedback_phase_b_clear_list_principle it stays OUT of
  // USER_SCOPED_STATIC_KEYS — same treatment as biq_modes_seen and
  // biq_install_dismissed. Signing out should not re-pitch it on your own phone.
  const SAMPLE_KEY = 'biq_sample_card_dismissed';
  const [sampleDismissed, setSampleDismissed] = useState(() => {
    try { return localStorage.getItem(SAMPLE_KEY) === '1'; } catch { return true; }
  });
  const dismissSample = useCallback(() => {
    setSampleDismissed(true);
    try { localStorage.setItem(SAMPLE_KEY, '1'); } catch { /* Safari private mode */ }
  }, []);
  // "Start building mine" used to be wired to dismissSample — byte-identical to
  // the X button beside it. A first-timer pressed a button promising to start
  // something and got a closed dialog and a blank card. Same defect as the
  // onboarding "Let's play", found the same day on the simulator.
  //
  // It launches DAILY 7, not Footle, because of what the modal just promised:
  // "every answer you get right moves a rating". The six ratings are fed by
  // catStats, which only MCQ answers write — Footle writes wordle_state and
  // would move nothing. Routing the retention engine here would be the better
  // growth bet and the worse honesty bet; the copy decides it.
  const startBuildingCard = useCallback(() => {
    dismissSample();
    onPlayDaily?.();
  }, [dismissSample, onPlayDaily]);
  // ⚠️ This dialog was the odd one out: 19 of the app's 20 role="dialog" nodes
  // already run useModalA11y, and this one declared aria-modal="true" without
  // it — which is the worst of both worlds. aria-modal tells assistive tech to
  // hide everything else on the page, so a screen-reader user was left inside
  // a dialog that never received focus, with no Escape and no Tab trap: the
  // rest of the document hidden and nothing reachable.
  const sampleRef = useRef(null);

  useModalA11y({ isOpen: !sampleDismissed, onClose: dismissSample, ref: sampleRef });

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  // Optimistic name override — the card normally shows the SERVER username
  // (authProfile), which lags a save by a Supabase round-trip + auth refresh;
  // this makes the new name appear instantly on save.
  const [pendingName, setPendingName] = useState(null);
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
  // Sprint #100 follow-up (1.0.2): mirror HomeScreen's isDefaultName so the two
  // screens agree on what counts as a "real" name. The server's default
  // usernames (Player, player_xxxxx from Apple Hide-My-Email / missing-name
  // sign-ups) are NOT real names — they must still trigger the set-your-name
  // CTA and open the editor pre-filled blank. Before this, ProfileScreen
  // treated player_xxxxx as a valid username, so the home "Tap to set your
  // name" CTA navigated here but the editor never opened (the nonce effect's
  // showNameCTA gate saw hasUsername=true and bailed).
  const isDefaultName = (n) => { const t = (n || "").trim(); return !t || t === "Player" || /^player_/i.test(t); };
  const realUsername = !isDefaultName(authProfile?.username) ? authProfile.username : null;
  const realLocalName = !isDefaultName(localName) ? localName : null;
  // What we show on the card + pre-fill into the editor. Server name wins over
  // a local one; both fall back to "" so a default-named user edits from blank.
  const currentName = pendingName || realUsername || realLocalName || "";
  const hasUsername = !!realUsername || !!pendingName;
  // Drop the optimistic override once the server echoes the new name back (or
  // keep it if offline — local-first, the name still shows).
  useEffect(() => {
    if (pendingName != null && authProfile?.username === pendingName) setPendingName(null);
  }, [authProfile?.username, pendingName]);
  const showNameCTA = !authLoading && !hasUsername && !realLocalName;
  const startNameEdit = () => {
    // Pre-fill with the current real name so a signed-in user *edits* their
    // username instead of retyping from scratch; default names start blank.
    setNameDraft(currentName);
    setEditingName(true);
  };
  /**
   * @param {boolean} fromBlur  true when the user tapped away rather than
   *   confirming. A rejected value must never be able to trap them in the
   *   editor — see the note below.
   *
   * ⚠️ TWO BUGS HERE, both found by scouting report #4 and both live.
   *
   * 1. THIS EDITOR AND THE SIGNUP MODAL DISAGREED ABOUT SPACES.
   *    UsernameSetupModal accepts them and collapses internal runs
   *    (`draft.trim().replace(/\s+/g, " ")`), deliberately, so the stored value
   *    matches what the silent auto-derive would have written. This screen
   *    rejected them outright. So the modal would hand someone "Alex Brynolsen"
   *    and their own profile would then refuse it — while the modal's body copy
   *    promises "You can change it later in your profile." Now normalised the
   *    same way, in one place, so the two cannot drift again.
   *
   * 2. EVERY REJECTION PATH TRAPPED THE USER. The whitespace and profanity
   *    branches returned WITHOUT `setEditingName(false)`, and both inputs wire
   *    `onBlur={() => saveName(true)}` — so tapping away re-ran the validation, re-toasted,
   *    and put focus straight back. Escape is wired, but a phone has no Escape
   *    key: on mobile this was inescapable short of leaving the screen. A
   *    rejection now still CLOSES on blur (reverting the draft), and only holds
   *    the editor open when the user actively pressed Enter and can see why.
   */
  const saveName = (fromBlur = false) => {
    // Collapse internal runs to match UsernameSetupModal exactly.
    const v = nameDraft.trim().replace(/\s+/g, " ");
    // Empty draft = cancel, never blank-save the name. Protects against a
    // stray tap-away/blur (onBlur fires saveName) wiping an existing username.
    if (!v) { setEditingName(false); return; }
    // A rejected value must not hold the editor hostage on tap-away.
    const reject = (msg) => {
      toast(msg);
      if (fromBlur) { setNameDraft(currentName); setEditingName(false); }
    };
    // Sprint #84 AAA2: username profanity gate. SQL trigger
    // profiles_profanity_check is the bypass-proof backstop; the client
    // check just gives a fast inline error without a Supabase round-trip
    // (the local profile name update is skipped too so the bad value
    // doesn't appear in the UI for a frame before the toast fires).
    if (v && isProfaneUsername(v)) {
      reject("⚠️ That username isn't allowed — please choose another");
      return;
    }
    setPendingName(v);
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
  // Same best-streak rule as AppInner's earnedBadges memo — streak badges never un-earn.
  const earned = earnedBadges || computeBadges(stats, xp, Math.max(bestLoginStreak || 0, loginStreak || 0));
  const iq = stats.bestIQ || null;
  const pctile = iq ? iqPercentile(iq) : null;
  const avatarUrl = authProfile?.avatar_url || null;
  // Show the uploaded photo only when it hasn't been overridden by a fresh
  // emoji pick this session. Emoji itself is local-first (the just-picked value
  // in `profile.avatar`) with the server's avatar_id as the fallback.
  // Was `!!avatarUrl && !emojiOverridesPhoto` — the override existed so a
  // chosen emoji could beat an uploaded photo. With the emoji set gone there
  // is nothing left to beat it.
  const showPhoto = !!avatarUrl;
  const displayEmoji = <ProfilePic value={profile?.avatar || authProfile?.avatar_id} url={authProfile?.avatar_url || profile?.photo} name={profile?.name || authProfile?.username} />;
  // Sprint #71 MM1: fall back to the app-wide toast bus instead of the
  // native window.alert dialog if no onToast prop was provided. In
  // practice every caller passes onToast — this is defensive.
  const toast = onToast || ((m) => { try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: String(m) })); } catch {} });

  const openAvatarPicker = () => {
    if (uploading || authLoading) return;
    if (user && !isGuest) { setShowAvatarMenu(true); return; }
    // Guests have nowhere to upload TO — the photo is stored against a user id.
    // But a control that does NOTHING when tapped is just a broken control, and
    // this one is tapped by someone actively trying to personalise their
    // profile. That is the best possible moment to ask them to sign up, so it
    // opens the auth prompt instead of silently swallowing the tap.
    try { openAuthPrompt?.('save'); } catch { /* auth UI is optional here */ }
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
    <div className="tab-content profile-screen" style={{background:"var(--bg)"}}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        style={{display:"none"}}
      />
      {/* desktop-web-refresh (mock #04): the whole Profile reflows into a
          1.15fr/0.85fr grid at >=1024. Mobile stays byte-identical — the column
          wrappers are display:contents below 1024 (no box), the desktop-only
          cards (.pd-hdr/.pd-left/.profile-col-right) are display:none until the
          reveal, and the mobile identity block hides only at desktop. The
          PWA-standalone killswitch resets all of it. */}
      {/* Desktop (>=1024) page header — hidden on mobile via the .pd-hdr base rule. */}
      <div className="pd-hdr">Profile</div>
      {/* MAIN column — display:contents on mobile (children flow exactly as
          before), grid-area "main" (left) at desktop. */}
      <div className="profile-col-main">
      {/* ── DESKTOP (>=1024) LEFT column — mock #04. Rating card + League
          ratings grid. Hidden on mobile via the .pd-left base display:none;
          the mobile merged card below carries these on phones instead. Every
          value is wired to the SAME computeCard(stats.catStats, acc) model the
          mobile card + Home rail use — nothing hardcoded. ── */}
      <div className="pd-left">
        {(() => {
          const acc = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered) ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
          const card = computeCard(stats?.catStats || {}, acc);
          const tierLabel = tierPalette(card.tier).label;
          const hasPlayed = (stats?.gamesPlayed || 0) > 0 || (stats?.totalAnswered || 0) > 0;
          return (
            <div className="pd-rating">
              <div className="pd-rating-eyebrow">Ball IQ rating</div>
              <div className="pd-rating-row">
                <button type="button" className="pd-avatar" onClick={openAvatarPicker} aria-label="Edit profile photo">
                  {uploading ? (
                    <span className="avatar-spinner" aria-label="Uploading…" />
                  ) : showPhoto ? (
                    <img crossOrigin="anonymous" src={avatarUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    displayEmoji
                  )}
                </button>
                <div className="pd-idcol">
                  <div className="pd-nrow">
                    {(authLoading && !currentName) ? (
                      <span className="pd-name" style={{opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"}}>Loading…</span>
                    ) : editingName ? (
                      <span style={{display:"inline-flex", alignItems:"center", gap:6, maxWidth:"100%"}}>
                        <input className="profile-name-input" style={{textAlign:"left", flex:1, minWidth:0, color:"#fff"}} value={nameDraft} onChange={e => setNameDraft(e.target.value.slice(0, 24))} onKeyDown={e => { if (e.key === "Enter") saveName(); else if (e.key === "Escape") setEditingName(false); }} onBlur={() => saveName(true)} placeholder="Your name" autoFocus aria-label="Your display name" />
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={saveName} aria-label="Save name" style={{flexShrink:0, width:32, height:32, borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", border:"none", background:"var(--accent)", color:"var(--grn-ink)", fontSize:15, fontWeight:900, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1}}>✓</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setEditingName(false)} aria-label="Cancel name edit" style={{flexShrink:0, width:32, height:32, borderRadius:9, border:"1px solid var(--border)", background:"var(--s2)", color:"var(--t2)", fontSize:14, fontWeight:800, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1}}>✕</button>
                      </span>
                    ) : (
                      <button type="button" onClick={startNameEdit} aria-label={showNameCTA ? "Set your name" : "Edit your name"} style={{display:"inline-flex", alignItems:"center", background:"none", border:"none", padding:0, fontFamily:"inherit", cursor:"pointer", maxWidth:"100%"}}>
                        <span className="pd-name">{showNameCTA ? "Set your name" : (currentName || authProfile?.username || profile?.name || "Player")}</span>
                        <svg className="pd-name-pencil" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
                      </button>
                    )}
                  </div>
                  <div className="pd-levelpill"><level.Icon size={13} strokeWidth={2.3} /> {level.name} · {xp.toLocaleString()} XP</div>
                </div>
                <div className="pd-score">
                  {hasPlayed ? (
                    <>
                      <div className="pd-overall-num">{card.overall}</div>
                      <div className="pd-overall-cap">OVERALL</div>
                      <div className="pd-tier">{tierLabel}</div>
                    </>
                  ) : (
                    <div className="pd-coldstart">Play a game to get your Ball IQ</div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {(() => {
          const acc = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered) ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
          const card = computeCard(stats?.catStats || {}, acc);
          const hasPlayed = (stats?.gamesPlayed || 0) > 0 || (stats?.totalAnswered || 0) > 0;
          // Green-highlight the single strongest PLAYED league (same "strongest"
          // the scouting report names); everything else reads white. Cold-start
          // (nothing played) → em-dashes, no highlight.
          const strongestAbbr = [...card.ratings].filter(r => r.answered > 0).sort((a, b) => b.rating - a.rating)[0]?.abbr || null;
          return (
            <div className="pd-leagues">
              <div className="pd-leagues-title">League ratings</div>
              <div className="pd-leagues-grid">
                {card.ratings.map(r => (
                  <div key={r.abbr} className="pd-league">
                    <span className="pd-league-flag">{r.icon}</span>
                    <span className="pd-league-name">{r.abbr === "UCL" ? "Champions Lg" : r.name}</span>
                    <span className={`pd-league-rating${r.abbr === strongestAbbr ? " is-top" : ""}`}>{hasPlayed ? r.rating : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
      {/* MOBILE identity blocks (merged card + secondary actions + scouting).
          display:contents on mobile, display:none at desktop. */}
      <div className="profile-mobile-identity">
      {/* Merged Ball IQ card — the player-rating card IS the profile header:
          editable avatar (tap → change photo) + editable name (tap → rename) +
          level, fused with the overall, tier and six competition ratings. */}
      {/* ── THE EXAMPLE CARD, AS A POPUP ────────────────────────────────────────
          Alex: "maybe guests or first timers should see what a 85 rated card
          looks like the first time they enter the profile tab, and then they can
          x it out" — then, on seeing it inline: "I was thinking more like a popup
          graphic that they x out."

          A modal is the better call, and not only because he asked for it. The
          bug fixed earlier today was a fabricated 64 presented as the visitor's
          OWN rating; an inline example card sits in the same slot the real one
          does, so it inherits that ambiguity no matter how it is labelled. An
          overlay cannot be mistaken for your profile — it is obviously a thing
          shown TO you. It also gets a real moment instead of competing with the
          card underneath it.

          Uses the app's own .modal-overlay so it dims, animates and respects the
          safe area exactly like every other sheet. */}
      {/* isActiveTab (2026-09-03): the popup is portalled to document.body, so
          it used to appear over HOME on a first visit — stacked with the
          first-session tip and the consent bar, three overlays at once (seen
          in the critique's play-through). It is the Profile tab's "here is
          what you are playing for"; it waits for the Profile tab. */}
      {isActiveTab && (stats?.gamesPlayed || 0) === 0 && !sampleDismissed && (() => {
        // tierPalette, not a raw key: the bronze/silver/gold rename left
        // CARD_TIERS.elite undefined, and t.bg then crashed the WHOLE Profile
        // tab — but only for gamesPlayed === 0, i.e. precisely the guests and
        // first-timers this popup exists for, which is why no signed-in
        // account could ever see it. Found live by a guest session 2026-08-28.
        const t = tierPalette("gold");
        const rows = [
          { icon: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", abbr: "EPL", v: 88 }, { icon: "\u2B50", abbr: "UCL", v: 91 },
          { icon: "\u{1F30D}", abbr: "INT", v: 84 }, { icon: "\u{1F1EA}\u{1F1F8}", abbr: "LAL", v: 83 },
          { icon: "\u{1F1E9}\u{1F1EA}", abbr: "BUN", v: 80 }, { icon: "\u{1F1EE}\u{1F1F9}", abbr: "SEA", v: 84 },
        ];
        // ⚠️ PORTALLED TO document.body, and it must stay that way.
        // `.tab-pane { contain: content }` (app.css) is a real perf win — it
        // stopped a tab tap relaying out 406 of 454 nodes — but containment
        // makes the pane a containing block for FIXED descendants. Rendered in
        // place, this overlay's `position:fixed; inset:0` resolved against the
        // Profile pane, not the viewport: measured 1579px tall starting 60px
        // down, so the card landed below the fold with the tab bar over it.
        // There is no containment value that keeps the win and fixes this —
        // BOTH layout and paint containment establish the fixed containing
        // block — so the modal moves out of the pane instead.
        return createPortal(
          <div ref={sampleRef} tabIndex={-1} className="modal-overlay" role="dialog" aria-modal="true" aria-label="What an elite card looks like"
               onClick={dismissSample}>
            <div onClick={(e) => e.stopPropagation()}
                 style={{ position: "relative", background: t.bg, border: `1.5px solid ${t.accent}66`, borderRadius: 22, padding: "20px 22px 18px", width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: t.accent, border: `1px solid ${t.accent}66`, borderRadius: 999, padding: "3px 9px" }}>EXAMPLE</span>
                <button type="button" onClick={dismissSample} aria-label="Close"
                        style={{ width: 32, height: 32, borderRadius: 999, border: "none", background: "rgba(255,255,255,0.10)", color: t.text, fontSize: 16, fontWeight: 800, cursor: "pointer", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>&#10005;</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 54, fontWeight: 900, color: t.accent, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>85</div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: t.text, opacity: 0.65, marginTop: 4 }}>OVERALL</div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: t.accent, marginTop: 7 }}>{t.label}</div>
                </div>
                <div style={{ fontSize: 50, opacity: 0.9 }} aria-hidden="true">&#127942;</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 16px", marginTop: 16, paddingTop: 13, borderTop: `1px solid ${t.accent}22` }}>
                {rows.map((r) => (
                  <div key={r.abbr} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{r.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: t.accent, fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.text, opacity: 0.6 }}>{r.abbr}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: t.text, opacity: 0.8, marginTop: 16, lineHeight: 1.45 }}>
                This is an elite card. Yours starts blank &mdash; every answer you get right moves a rating.
              </div>
              <button type="button" onClick={startBuildingCard}
                      style={{ width: "100%", marginTop: 16, padding: 13, borderRadius: 13, border: "none", background: t.accent, color: "#241B00", fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
                Start building mine
              </button>
            </div>
          </div>,
          document.body,
        );
      })()}
      {(() => {
        const _acc = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered) ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
        const _card = computeCard(stats?.catStats || {}, _acc);
        // The single source of truth for "is there anything real to show here".
        // Same expression the empty state and the share/weekly buttons use, so the
        // whole screen agrees with itself — see the rating block below.
        const hasPlayed = (stats?.gamesPlayed || 0) > 0;
        const t = tierPalette(_card.tier);
        return (
          // ⚠️ ONE CARD, THREE SURFACES. The layout lives in
          // components/BallIqCardFace.jsx — read the header there before
          // touching anything visual. This card forked twice (friend profile,
          // then the share PNG) and Alex caught both, so there is exactly one
          // copy of it now and the screens pass in only what genuinely differs:
          // here the name and the face are editable controls.
          <BallIqCardFace
            card={_card}
            played={hasPlayed}
            style={{ marginBottom: 14 }}
            avatar={
                <div className="profile-avatar-wrap" style={{ flexShrink: 0, ...(authLoading ? {opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"} : null) }}>
                  <button type="button" className="profile-avatar" onClick={openAvatarPicker} aria-label="Edit profile photo" style={showPhoto
                    ? {width:96, height:96, padding:0, overflow:"hidden", background:"var(--s2)", border:`2.5px solid ${t.accent}`, appearance:"none", WebkitAppearance:"none", font:"inherit"}
                    : {width:96, height:96, fontSize:44, border:`2.5px solid ${t.accent}`, appearance:"none", WebkitAppearance:"none", font:"inherit"}}>
                    {uploading ? (
                      <span className="avatar-spinner" aria-label="Uploading…" />
                    ) : showPhoto ? (
                      <img crossOrigin="anonymous" src={avatarUrl} alt={currentName ? `${currentName}'s avatar` : "Profile avatar"} onError={(e) => { e.currentTarget.style.display = "none"; }} style={{width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%", display:"block"}} />
                    ) : (
                      displayEmoji
                    )}
                  </button>
                  <button type="button" className="profile-avatar-edit" onClick={openAvatarPicker} aria-label="Edit profile photo" style={{appearance:"none", WebkitAppearance:"none", font:"inherit", display:"inline-flex", alignItems:"center", justifyContent:"center"}}><Pencil size={14} strokeWidth={2.5} aria-hidden="true" /></button>
                </div>
            }
            name={
                    (authLoading && !currentName) ? (
                      <span className="profile-name" style={{opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite", color:t.text}}>Loading…</span>
                    ) : editingName ? (
                      <span style={{display:"inline-flex", alignItems:"center", gap:6, maxWidth:"100%"}}>
                        <input className="profile-name-input" style={{textAlign:"left", flex:1, minWidth:0, color:t.text}} value={nameDraft} onChange={e => setNameDraft(e.target.value.slice(0, 24))} onKeyDown={e => { if (e.key === "Enter") saveName(); else if (e.key === "Escape") setEditingName(false); }} onBlur={() => saveName(true)} placeholder="Your name" autoFocus aria-label="Your display name" />
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={saveName} aria-label="Save name"
                          style={{flexShrink:0, width:34, height:34, borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", border:"none", background:"var(--accent)", color:"var(--bg)", fontSize:16, fontWeight:900, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1}}>✓</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setEditingName(false)} aria-label="Cancel name edit"
                          style={{flexShrink:0, width:34, height:34, borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", border:"1px solid var(--border)", background:"var(--s2)", color:"var(--t2)", fontSize:15, fontWeight:800, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", lineHeight:1}}>✕</button>
                      </span>
                    ) : showNameCTA ? (
                      <button className="profile-name" onClick={startNameEdit} style={{background:"none",border:"none",padding:0,fontFamily:"inherit",color:t.text,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}} aria-label="Set your name">
                        Set your name <Pencil size={13} strokeWidth={2.5} aria-hidden="true" style={{display:"inline",verticalAlign:"-2px",marginLeft:3,opacity:0.7}} />
                      </button>
                    ) : (
                      <button className="profile-name" onClick={startNameEdit} style={{background:"none",border:"none",padding:0,fontFamily:"inherit",color:t.text,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}} aria-label="Edit your name">
                        {currentName || authProfile?.username || profile?.name || "Player"}
                        <Pencil size={13} strokeWidth={2.5} aria-hidden="true" style={{display:"inline",verticalAlign:"-2px",marginLeft:3,opacity:0.65}} />
                      </button>
                    )
            }
            /* ⚠️ NOT `.profile-level-badge` HERE. That class is a GREEN pill,
               and a green pill on a gold card puts the app's "correct / go"
               colour in direct competition with the tier it is supposed to sit
               quietly beneath — the same reason the tiers stopped being green
               at all. The class is untouched and still used by the desktop
               pane and the journey list; this card just does not wear it. */
            subline={<>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.2, color: t.text, opacity: 0.55, display: "flex", alignItems: "center", gap: 6 }}>
                <level.Icon size={13} strokeWidth={2.3} aria-hidden="true" /> {level.name} · {xp.toLocaleString()} XP
              </div>
              {iq ? <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, color: t.text, opacity: 0.42 }}>{APP_NAME}: {iq} — Top {100 - pctile}%</div> : null}
            </>}
          />
        );
      })()}
      {/* GUEST-FIRST (2026-09-06): the account ask comes AFTER the player's own
          card, not above it, and names what it does — the tab used to open on a
          glowing "Save your progress" slab over a rating card of dashes. Same
          row anatomy as the Today rows; a quiet pill. Anonymous (invite-link)
          players already HAVE a server account — for them it is "attach an
          email so it can't be lost". */}
      {(isGuest || isAnonUser) && (
        <div className="todays-seven-secondary mp-row" role="group" aria-label="Save your progress" style={{marginBottom:14}}>
          <button type="button" className="mp-row-open" onClick={() => { try { openAuthPrompt?.(isAnonUser ? 'upgrade' : 'save'); } catch {} }} aria-label={isAnonUser ? 'Save my account' : 'Sign in or create a free account'}>
            <span className="t7s-icon" aria-hidden="true"><Sparkles size={20} strokeWidth={2.1} /></span>
            <span className="t7s-body">
              <span className="t7s-title">{isAnonUser ? 'Save this account' : 'Your progress lives on this phone'}</span>
              <span className="t7s-sub">
                {isAnonUser
                  ? 'Add an email and password so your stats, games and XP can\'t be lost.'
                  : (stats?.gamesPlayed || 0) > 0
                    ? 'A free account keeps your stats, streak and rating — and unlocks online 1v1.'
                    : 'A free account saves everything across devices and unlocks online 1v1.'}
              </span>
            </span>
          </button>
          <button type="button" className="t7s-cta mp-row-invite" onClick={() => { try { openAuthPrompt?.(isAnonUser ? 'upgrade' : 'save'); } catch {} }}>{isAnonUser ? 'Save' : 'Sign in'}</button>
        </div>
      )}
      {/* Two peer secondary actions. Both are ghost buttons; the gap-based
          flex container replaces the previous marginTop:-4 hack that was
          overlapping the .share-profile-btn bottom margins. Sprint #34
          BB1 F-P4: `.profile-secondary-actions` class lets desktop CSS
          flip to side-by-side and cap each button to 280px so the pair
          reads as secondary, not as two competing primary actions. */}
      {/* ⚠️ BOTH OF THESE ARE MEANINGLESS BEFORE THE FIRST GAME, and they were
          rendering directly above the "No stats yet — play your first game"
          card. So the most prominent thing on a brand-new profile was an
          invitation to share an empty scorecard, and a weekly summary of a
          week with nothing in it. Gated on the SAME condition the empty state
          uses, so the two can never disagree. */}
      {(stats.gamesPlayed || 0) > 0 && (
        <div className="profile-secondary-actions" style={{display:"flex", flexDirection:"column", gap:8, marginBottom:12}}>
          {/* A LINK and an IMAGE are different jobs, so both are offered, but
              they are not equals: sharing is the action this app most wants
              taken, so it carries the go colour and saving sits beside it as a
              quieter sibling. shareProfile sends /p?... — tappable, unfurls the
              card, right for a group chat; onSaveCard hands over an actual PNG,
              the only useful thing in a story or a camera roll. */}
          <div className="card-actions">
            <button className="card-action-primary" onClick={onShareProfile}>
              <Share2 size={16} strokeWidth={2.6} aria-hidden="true" /> Share card
            </button>
            {onSaveCard && (
              <button className="card-action-secondary" onClick={onSaveCard}>
                <Download size={16} strokeWidth={2.6} aria-hidden="true" /> Save image
              </button>
            )}
          </div>
          {onShowWeekly && (
            <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShowWeekly}>Weekly Summary</button>
          )}
        </div>
      )}
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
        (() => {
          // Scouting Report — turns the old stat dashboard into a verdict on the
          // player: strongest + weakest competition (from the card data), a
          // skill comparison (percentile), records, and a specialist title.
          const acc = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered) ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
          const card = computeCard(stats?.catStats || {}, acc);
          // Base the verdict only on competitions the player has actually
          // answered — computeCard prior-seeds unplayed comps from overall
          // accuracy, so ranking the raw six would name "Strongest"/"Needs work"
          // for leagues with zero data.
          const played = [...card.ratings].filter(r => r.answered > 0).sort((a, b) => b.rating - a.rating);
          const strongest = played[0] || null;
          const weakest = played.length >= 2 ? played[played.length - 1] : null;
          const spread = strongest && weakest ? strongest.rating - weakest.rating : 0;
          const title = strongest && spread >= 5 ? `${strongest.name} Specialist`
            : played.length >= 3 ? "Versatile All-Rounder"
            : "Rising Talent";
          const accPct = (stats.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered)
            ? `${Math.round(100 * (stats.totalCorrect || 0) / stats.totalAnswered)}%` : "—";
          const rows = [];
          if (strongest) rows.push({ icon: strongest.icon, label: "Strongest", value: `${strongest.name} · ${strongest.rating}`, color: "var(--accent)" });
          if (weakest) rows.push({ icon: weakest.icon, label: "Needs work", value: `${weakest.name} · ${weakest.rating}`, color: "var(--t1)" });
          else rows.push({ Icon: Compass, label: "Next up", value: "Play more to build your card", color: "var(--t2)" });
          // Only show "Top X%" when it's actually a flex — iqPercentile floors
          // at 15, so a weak player would otherwise read "Top 85%" (sounds great,
          // means bottom-ish). Show it only for genuine top-half players.
          rows.push({ Icon: Target, label: "Accuracy", value: accPct, sub: (pctile && pctile >= 50) ? `Top ${100 - pctile}%` : null, color: "var(--accent)" });
          // Suppress a 0 day-streak (gold flame next to 0 reads as broken, and
          // the rest of the app hides a zero streak).
          if (loginStreak >= 1) rows.push({ Icon: Flame, label: "Day streak", value: String(loginStreak), color: "var(--gold)" });
          rows.push({ Icon: Medal, label: "Best run", value: `${stats.bestStreak || 0} in a row`, color: "var(--text)" });
          if (stats.bestScore > 0) rows.push({ Icon: Gamepad2, label: "Best score", value: `${stats.bestScore}/10`, color: "var(--text)" });
          if (stats.bestHotStreak > 0) rows.push({ Icon: Zap, label: "Hot Streak", value: String(stats.bestHotStreak), color: "var(--gold)" });
          if (stats.bestTrueFalse > 0) rows.push({ Icon: CircleCheck, label: "True/False", value: `${stats.bestTrueFalse}/20`, color: "var(--t1)" });
          return (
            <div className="scouting-report" style={{ marginBottom: 16 }}>
              <div className="ds-eyebrow" style={{ marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><Search size={13} strokeWidth={2.4} /> Scouting Report</div>
              <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 14, padding: "2px 16px" }}>
                {rows.map((r, i) => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                    <div style={{ width: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {r.Icon ? <r.Icon size={17} strokeWidth={2.2} color={r.color} /> : r.icon}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{r.label}</div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 7 }}>
                      {r.sub ? <span style={{ fontSize: 11.5, color: "var(--t3)", fontWeight: 700 }}>{r.sub}</span> : null}
                      <span style={{ fontSize: 15, fontWeight: 800, color: r.color }}>{r.value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 14, fontWeight: 800, color: "var(--accent)", fontStyle: "italic" }}>
                "{title}"
              </div>
            </div>
          );
        })()
      )}
      </div>
      </div>
      {/* ── DESKTOP (>=1024) RIGHT column — mock #04. Scouting report + a
          green-outline Share button. Hidden on mobile via the .profile-col-right
          base display:none (the mobile scouting card above covers phones). All
          rows use real stats fields; cold-start shows em-dashes. ── */}
      <div className="profile-col-right">
        {(() => {
          const acc = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered) ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
          const card = computeCard(stats?.catStats || {}, acc);
          const strongest = [...card.ratings].filter(r => r.answered > 0).sort((a, b) => b.rating - a.rating)[0] || null;
          const accPct = (stats?.totalAnswered > 0 && (stats.totalCorrect || 0) <= stats.totalAnswered)
            ? `${Math.round(100 * (stats.totalCorrect || 0) / stats.totalAnswered)}%` : "—";
          const DASH = "—";
          const rows = [
            { label: "Strongest", value: strongest ? `${strongest.name} · ${strongest.rating}` : DASH, cls: "is-green" },
            { label: "Accuracy", value: accPct, cls: "is-mono" },
            { label: "Day streak", value: (loginStreak || 0) >= 1 ? `🔥 ${loginStreak}` : DASH, cls: "is-amber" },
            { label: "Best run", value: (stats?.bestStreak || 0) > 0 ? `${stats.bestStreak} in a row` : DASH, cls: "is-mono" },
            { label: "Best score", value: (stats?.bestScore || 0) > 0 ? `${stats.bestScore} / 10` : DASH, cls: "is-mono" },
          ];
          return (
            <div className="pd-scout">
              <div className="pd-scout-head">
                <span className="pd-scout-ico" aria-hidden="true">🔍</span>
                <span className="pd-scout-title">Scouting report</span>
              </div>
              <div className="pd-scout-rows">
                {rows.map((r, i) => (
                  <div key={r.label} className={`pd-scout-row${i === rows.length - 1 ? " is-last" : ""}`}>
                    <span className="pd-scout-k">{r.label}</span>
                    <span className={`pd-scout-v ${r.value === DASH ? "is-dash" : r.cls}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        <button type="button" className="pd-share" onClick={onShareProfile} aria-label="Share profile card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M12 15V4M8 8l4-4 4 4"></path></svg>
          Share profile card
        </button>
      </div>
      {/* BELOW column — Journey + Friends + Badges. display:contents on mobile,
          full-width grid-area "below" at desktop (kept reachable per handoff). */}
      <div className="profile-col-below">
      {(() => {
        const currentIdx = LEVELS.indexOf(level);
        const topIdx = LEVELS.length - 1;
        // Ascending order: current level lands at the top so the user
        // immediately sees "you are here" without scrolling, with progression
        // reading top→bottom toward the ultimate-goal tier.
        const ordered = LEVELS.map((l, i) => ({ ...l, idx: i }));
        return (
          <div className="journey-section">
            <div className="journey-title"><Milestone size={17} strokeWidth={2.2} /> Your Journey</div>
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
                    <div className="journey-dot">{isDone ? "✓" : <tier.Icon size={17} strokeWidth={2.1} />}</div>
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
          currentUserAvatar={profile?.avatar || authProfile?.avatar_id}
          currentUserPhoto={authProfile?.avatar_url || profile?.photo}
          onChallenge={onChallenge}
          onToast={onToast}
          onOpenFriend={onOpenFriend}
          onShareProfile={onShareProfile}
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
          }).map(([id, Icon, name]) => {
            const isEarned = earned.has(id);
            const isSelected = selectedBadgeId === id;
            const baseStyle = isEarned ? {background:"rgba(88,204,2,0.1)",borderColor:"rgba(88,204,2,0.25)"} : {};
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
                {/* grayscale() did the dimming when this was emoji; an SVG has
                    no colour to remove, so the locked state now uses the muted
                    token directly. The tile itself is no longer dimmed — that
                    was the 1.71:1 label bug. */}
                <span className="badge-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2.1} color={isEarned ? "var(--accent)" : "var(--t3)"} />
                </span>
                <span className="badge-name" style={{color:isEarned?"var(--t1)":"var(--t3)"}}>{name}</span>
              </button>
            );
          })}
        </div>
        {selectedBadgeId && (() => {
          const def = BADGE_DEFS.find(b => b[0] === selectedBadgeId);
          if (!def) return null;
          const [id, Icon, name, desc] = def;
          const isEarned = earned.has(id);
          return (
            <div className="badge-detail-card">
              <div className="bd-icon" aria-hidden="true">
                <Icon size={26} strokeWidth={2.1} color={isEarned ? "var(--accent)" : "var(--t3)"} />
              </div>
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
      </div>
      {/* BELOW column ends. */}
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
              {/* The "Choose emoji avatar" row lived here. Removed 2026-07-29:
                  6 of 108 profiles had ever used it, and having both an "avatar"
                  and a "profile picture" for one circle was the confusing part.
                  Upload a photo, or keep the ball. */}
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
