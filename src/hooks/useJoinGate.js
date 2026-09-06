import { useState, useEffect, useRef, useCallback } from "react";
import { mpLookupRoom } from "../multiplayerRpc.js";
import { loopEvent, normalizeJoinCode } from "../App.jsx";

// Extracted from AppInner on 2026-09-06 (review E16): the pending join code
// read from the URL, the boot-time dead-code drop, the auto-join route, the
// refs the gate modal and the auto-join guard use. The hub join and the modal
// a11y line stay in App: they need state declared after this hook must run.
export function useJoinGate({ user, isGuest, startModeRef }) {
  const [stage1RoomCode, setStage1RoomCode] = useState("");
  const [pendingJoinCode, setPendingJoinCode] = useState(() => {
    try {
      // Sprint #92 GGG3: parse BOTH /join/CODE (new path-based, matches
      // Universal Links) and ?join=CODE (legacy query-based) so previously-
      // shared invite URLs keep routing correctly. Path form takes priority.
      const pathMatch = window.location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
      const fromPath = pathMatch ? pathMatch[1] : null;
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("join");
      const fromUrl = fromPath || fromQuery;
      if (fromUrl) {
        try { localStorage.setItem("biq_pending_join", JSON.stringify({ c: fromUrl, at: Date.now() })) } catch {}
        // Strip the path/query so a refresh doesn't re-trigger the auto-join —
        // but drop ONLY the /join path + join param, preserving any other params
        // (e.g. a co-present ?c= challenge token, read by the next init).
        try {
          const u = new URL(window.location.href);
          u.pathname = "/"; u.searchParams.delete("join");
          window.history.replaceState({}, "", u.pathname + u.search + u.hash);
        } catch {}
        return normalizeJoinCode(fromUrl);
      }
      const stored = localStorage.getItem("biq_pending_join");
      if (stored) {
        // 2026-08-29: stored codes carry a timestamp and yield to explicit
        // deep-link intent. Before this, a code persisted FOREVER and was
        // never validated against room existence — but the cron deletes rooms
        // at 7 days, so an unconsumed invite became a dead "Join the game"
        // modal over every future visit, including SEO deep links with a
        // quiz clock already running underneath. A bare legacy value is
        // stale by construction and dropped on sight.
        let code = null;
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.c && Date.now() - (parsed.at || 0) < 24 * 3600 * 1000) code = parsed.c;
        } catch { /* legacy bare string */ }
        if (!code) { try { localStorage.removeItem("biq_pending_join"); } catch {} return null; }
        const otherIntent = /[?&](club|quiz|c)=/.test(window.location.search) || /^\/c\//.test(window.location.pathname);
        if (otherIntent) return null;
        return normalizeJoinCode(code);
      }
    } catch {}
    return null;
  });
  const clearPendingJoin = useCallback(() => {
    setPendingJoinCode(null);
    loopEvent("join-token-consumed");
    try { localStorage.removeItem("biq_pending_join"); } catch {}
  }, []);
  useEffect(() => {
    const onJoinCode = (e) => {
      const code = String(e?.detail || '').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
      if (code) setPendingJoinCode(code);
    };
    window.addEventListener('biq:join-code', onJoinCode);
    return () => window.removeEventListener('biq:join-code', onJoinCode);
  }, []);
  const joinGateRef = useRef(null);
  const autoJoinRoutedRef = useRef(false);
  useEffect(() => {
    if (!pendingJoinCode) { autoJoinRoutedRef.current = false; return; }
    if (!user || isGuest) return;
    if (autoJoinRoutedRef.current) return;
    autoJoinRoutedRef.current = true;
    startModeRef.current?.("online");
    // Audit Phase 5 (H2): user → user?.id. The effect only checks user
    // for truthiness; `!user` and `!user?.id` are equivalent for Supabase
    // auth (user is null OR has an id). Narrowing prevents re-fire on
    // unrelated auth context updates (token refresh, metadata change).
  }, [pendingJoinCode, user?.id, isGuest]);
  return { pendingJoinCode, setPendingJoinCode, clearPendingJoin, stage1RoomCode, setStage1RoomCode, joinGateRef, autoJoinRoutedRef };
}
