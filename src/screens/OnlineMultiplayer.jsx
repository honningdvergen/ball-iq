import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { APP_NAME } from '../lib/scoring.js';
import { useMultiplayerRoom } from '../useMultiplayerRoom.js';
import { useMpRetryStatus, mpCreateRoom, mpJoinRoom } from '../multiplayerRpc.js';
import { Confetti, LETTERS, QUESTION_DURATION_MS, INVITE_BASE_URL, pickMultiplayerQuestions, recordMpResult, topicMeta, TopicPickerSheet } from '../App.jsx';
import { maybeRequestReview } from '../lib/review.js';

// ── Online multiplayer (Stage 1) — extracted from App.jsx and lazy-loaded so
// this ~1,700-line subtree stays out of the first-paint bundle. The logic is
// byte-for-byte unchanged from the inline version; only the module moved.

function OnlineEntry({ onBack, onLobbyEnter, defaultName, autoJoinCode, onAutoJoinConsumed, autoCreate, onAutoCreateConsumed }) {
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  // Capacity is 8 — matches the "up to 8 players" marketing (site, store,
  // screenshots). The picker UI was removed (Finding 6.0); a fixed generous cap
  // avoids a wrong default locking out a friend. Server enforces per-room
  // capacity (join_room checks count >= capacity); the lobby list scrolls
  // vertically and the in-game player bar scrolls horizontally, so 8 renders
  // cleanly. NOTE: wants a real 8-way realtime test before heavy promotion.
  const CAPACITY = 8;
  // Show "Reconnecting…" pill while create_room / join_room is in
  // retry territory (the wrapper layer absorbs transient blips silently
  // on the first attempt; this indicator fires once the second attempt
  // is in flight, so a brief blip stays invisible).
  const { retrying: mpRetrying } = useMpRetryStatus();

  const handleCreate = async () => {
    if (creating || joining) return;
    setCreating(true);
    setError("");
    Sentry.addBreadcrumb({ category: 'multiplayer', message: 'create-room initiated', level: 'info', data: { capacity: CAPACITY } });
    // create_room is single-attempt by design (not idempotent — retry
    // could orphan rooms). User manually re-taps Create on failure.
    const result = await mpCreateRoom({
      p_capacity: CAPACITY,
      p_name: defaultName || "Player",
      p_avatar: "⚽",
    });
    if (result.error) {
      setError(result.error || "Couldn't create room");
      setCreating(false);
      return;
    }
    onLobbyEnter(result.code);
    // No setCreating(false) — component unmounts on navigation.
  };

  // handleJoin accepts an optional explicit code so the auto-join
  // useEffect (1F.6 launch) can pass in the deep-link code without
  // first writing it to the input state. Manual taps default to the
  // input state (existing behavior).
  const handleJoin = async (explicitCode) => {
    if (creating || joining) return;
    const candidate = explicitCode ?? code;
    const trimmed = (candidate || "").trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Enter the 6-character room code");
      return;
    }
    setJoining(true);
    setError("");
    Sentry.addBreadcrumb({ category: 'multiplayer', message: 'join-room initiated', level: 'info', data: { code_prefix: trimmed.slice(0, 2) } });
    const result = await mpJoinRoom({
      p_code: trimmed,
      p_name: defaultName || "Player",
      p_avatar: "⚽",
    });
    if (result.error) {
      // Specific copy for known SQLSTATEs (raised by the SQL functions
      // with explicit `using errcode = '...'`). The wrapper preserves
      // PostgrestError.code in result.code on error. Falls back to
      // generic RPC message for anything unexpected.
      if (result.code === "53300") {
        setError("This room is full");
      } else if (result.code === "P0002") {
        setError("No room with that code — check with your friend");
      } else if (result.code === "42P01") {
        setError("This room isn't accepting joins right now");
      } else {
        setError(result.error || "Couldn't join room");
      }
      setJoining(false);
      return;
    }
    onLobbyEnter(result.code);
  };

  // Stage 1F.6 — deep-link auto-join. AppInner sets autoJoinCode from
  // pendingJoinCode (the ?join=ABC123 URL param or balliq.app/join/CODE
  // Universal Link) and routes to this screen. We attempt the join
  // immediately on mount, then mark the code as consumed via
  // onAutoJoinConsumed so re-mounts don't loop. On success, onLobbyEnter
  // navigates to the lobby. On failure, the error renders inline so the
  // user can manually try a different code.
  //
  // Sprint #94 III1: pre-flip showCodeInput + setCode so the user actually
  // SEES the code we're attempting to join. Pre-fix, the auto-attempt
  // fired but the input stayed hidden + empty — when the join failed
  // (bad code, room full, etc.) the user landed back on the two-button
  // screen with an error and had to tap "Join with Code" + retype the
  // whole code from memory. With this prefill, a failed Universal Link
  // attempt leaves the code visible in the input ready to re-tap Join.
  useEffect(() => {
    if (!autoJoinCode) return;
    setCode(autoJoinCode);
    setShowCodeInput(true);
    let cancelled = false;
    (async () => {
      try {
        await handleJoin(autoJoinCode);
      } finally {
        if (!cancelled) onAutoJoinConsumed?.();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoinCode]);

  // 1.1: deep-create. The Home "Invite" button routes here with autoCreate so a
  // room is made immediately and the user lands in the lobby ready to share the
  // working /join/CODE link (you can't invite to a lobby that doesn't exist).
  // Mirrors the autoJoinCode effect: fire once on mount, mark consumed so a
  // re-mount doesn't spawn a second room. handleCreate navigates to the lobby
  // on success or shows an inline error on failure.
  useEffect(() => {
    if (!autoCreate) return;
    // If a deep-link join is also pending this mount, let the join win — don't
    // also create a room. Both effects run in the same commit and handleCreate's
    // creating/joining guard reads a stale render snapshot that can't see the
    // in-flight join, so without this both RPCs would fire.
    if (autoJoinCode) { onAutoCreateConsumed?.(); return; }
    let cancelled = false;
    (async () => {
      try {
        await handleCreate();
      } finally {
        if (!cancelled) onAutoCreateConsumed?.();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate]);

  const busy = creating || joining;

  // Auto-create / deep-link auto-join flows: skip the entry UI entirely — a
  // minimal loading state until the lobby takes over. On failure the auto
  // prop is consumed (parent flips it false), so the full screen returns
  // with the inline error (+ prefilled code for auto-join) for manual retry.
  if ((autoCreate || autoJoinCode) && !error) {
    return (
      <div className="screen">
        <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <span className="avatar-spinner" aria-label={autoJoinCode ? "Joining room" : "Creating room"} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{autoJoinCode ? "Joining room…" : "Setting up your room…"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">Online Multiplayer</div>
      </div>
      <div style={{ maxWidth: 360, margin: "0 auto", padding: "0 4px", minHeight: "66vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 12 }}>⚔️</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.3px" }}>Who's got the better Ball IQ?</div>
          <div style={{ fontSize: 13.5, color: "var(--t2)", lineHeight: 1.5 }}>Create a room, share the code, settle it head-to-head.</div>
        </div>
        {mpRetrying && (
          <div style={{
            padding: "6px 12px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: "var(--accent)",
            textAlign: "center",
          }}>
            Reconnecting…
          </div>
        )}

        <button
          className="btn-3d"
          onClick={handleCreate}
          disabled={busy}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {creating ? "Creating…" : "🎮 Create Room"}
        </button>
        {!showCodeInput ? (
          <button
            className="btn"
            onClick={() => { setError(""); setShowCodeInput(true); }}
            disabled={busy}
            style={{ width: "100%", background: "var(--s2)", border: "1px solid var(--border2)", color: "var(--text)" }}
          >
            🔑 Join with Code
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              maxLength={6}
              disabled={busy}
              style={{
                padding: "14px 16px",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 6,
                textAlign: "center",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--s1)",
                color: "var(--text)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button className="btn-3d" onClick={() => handleJoin()} disabled={busy} style={{ width: "100%" }}>
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        )}
        {error && (
          <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 12 }}>
            {error}
          </div>
        )}

      </div>
    </div>
  );
}

// MultiplayerLobby: post-entry screen for both host (after create_room) and
// joiner (after join_room). Consumes useMultiplayerRoom to subscribe + sync.
// Renders different sub-views based on room.state:
//   loading | error | lobby | playing (1B placeholder) | ended
function MultiplayerLobby({ code, onExit, defaultName }) {
  const { room, players, myPlayer, isHost, loading, error, channelStatus, actions } = useMultiplayerRoom(code);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [copyToast, setCopyToast] = useState("");
  // Host-chosen format. "classic" = 10Q race, "sprint" = 5Q race,
  // "survival" = 15Q escalating elimination (sets room.mode='survival').
  // Lobby-only state (the actual question count lands in startGame's
  // RPC arg). Joiners see the format via the broadcast room.mode line.
  const [mode, setMode] = useState("classic");
  // Host-chosen question pack ("mixed" | "cat:PL" | "club:Arsenal" …).
  // The filtered questions land in start_game's array, so joiners
  // automatically play the same pack — no extra broadcast needed.
  const [pack, setPack] = useState("mixed");

  // "Reconnecting…" indicator only after >2s in a non-subscribed state to
  // avoid flicker on transient drops.
  useEffect(() => {
    if (channelStatus === "closed" || channelStatus === "error") {
      const t = setTimeout(() => setShowReconnecting(true), 2000);
      return () => { clearTimeout(t); };
    } else {
      setShowReconnecting(false);
    }
  }, [channelStatus]);

  // Persist a local head-to-head record once per finished room — powers the
  // Online tab's W/L record, win streak and recent-opponents rail. Ref-guarded
  // so realtime 'ended' echoes can't double-record (recordMpResult also
  // dedupes by roomId as a second line of defence).
  const endedRecordedRef = useRef(false);
  useEffect(() => {
    if (!room || room.state !== "ended" || endedRecordedRef.current) return;
    if (!myPlayer || !players.length) return;
    endedRecordedRef.current = true;
    try {
      const rows = players.map(p => ({ id: p.user_id, name: p.name, avatar: p.avatar || "⚽", score: p.score || 0 }));
      const top = Math.max(...rows.map(r => r.score));
      const mine = rows.find(r => r.id === myPlayer.user_id);
      recordMpResult({
        roomId: room.id,
        at: Date.now(),
        mode: room.mode || "race",
        won: !!mine && mine.score >= top,
        myScore: mine ? mine.score : 0,
        opponents: rows.filter(r => r.id !== myPlayer.user_id),
      });
    } catch {}
  }, [room, players, myPlayer]);

  const handleLeave = useCallback(async () => {
    try { await actions.leave(); } catch {}
    onExit();
  }, [actions, onExit]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyToast("Code copied");
    } catch {
      setCopyToast("Couldn't copy — long-press to copy manually");
    }
    setTimeout(() => setCopyToast(""), 1800);
  }, [code]);

  // Sprint #92 GGG4: share the path-based invite URL via the native iOS
  // share sheet (@capacitor/share) on native, navigator.share on web,
  // clipboard fallback everywhere. The URL is the canonical /join/CODE
  // form so a recipient on iOS with the app installed triggers the
  // Universal Link (Sprint #92 GGG3) and lands directly in the join flow.
  // Recipients without the app open the SPA which path-captures /join/CODE
  // into the same pendingJoinCode flow.
  const handleShareInvite = useCallback(async () => {
    const url = `${INVITE_BASE_URL}/join/${encodeURIComponent(code)}`;
    const text = `⚽ Play me at ${APP_NAME}! Tap to join:`;
    try {
      if (Capacitor.isNativePlatform?.()) {
        await CapShare.share({ title: APP_NAME, text, url, dialogTitle: 'Share invite' });
        return;
      }
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: APP_NAME, text, url });
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user cancelled — silent
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopyToast("Invite copied — paste it to a friend");
      setTimeout(() => setCopyToast(""), 2200);
    } catch {
      setCopyToast("Couldn't share — copy the code instead");
      setTimeout(() => setCopyToast(""), 2200);
    }
  }, [code]);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setStartError("");
    const survival = mode === "survival";
    const questionCount = survival ? 15 : mode === "sprint" ? 5 : 10;
    let questions;
    try {
      questions = await pickMultiplayerQuestions(questionCount, pack, { escalate: survival });
    } catch (e) {
      console.warn('[handleStart]', e?.message || e);
      setStartError("Couldn't load questions — check your connection");
      setStarting(false);
      return;
    }
    const result = await actions.startGame(questions, players.length);
    if (result.error) {
      setStartError(result.error);
      setStarting(false);
      return;
    }
    if (result.started === false) {
      if (result.reason === "roster_changed") {
        setStartError(`Roster changed — now ${result.current_count} players. Tap Start again.`);
      } else {
        setStartError(result.reason || "Could not start game");
      }
      setStarting(false);
      return;
    }
    // Success: keep starting=true. Realtime UPDATE will switch us to the
    // PlayingPlaceholder sub-view, which doesn't render the Start button
    // at all, so the lingering 'starting' state has no UI effect.
  }, [actions, players.length, starting, mode, pack]);

  const isMe = useCallback((p) => myPlayer && p.user_id === myPlayer.user_id, [myPlayer]);

  // Dispatch order matters: explicit error first, THEN loading-or-no-room.
  // The reverse order (1B's bug) caused a one-frame flash of LobbyError on
  // first render after navigation from OnlineEntry — useEffect hadn't yet
  // flipped loading=true, so initial state (loading=false, room=null,
  // error=null) hit `error || !room` → truthy → LobbyError briefly renders
  // with error=null before the next render shows LobbyLoading. Safari's
  // paint timing made the flash visible.
  if (error) return <LobbyError error={error} onExit={onExit} onRetry={actions.retry} />;
  if (loading || !room) return <LobbyLoading />;
  if (room.state === "ended") return <LobbyEnded players={players} myPlayer={myPlayer} onExit={onExit} room={room} />;
  if (room.state === "playing") {
    return (
      <MultiplayerGameplay
        room={room}
        players={players}
        myPlayer={myPlayer}
        isHost={isHost}
        actions={actions}
        onExit={onExit}
      />
    );
  }

  return (
    <LobbyView
      room={room}
      players={players}
      isHost={isHost}
      isMe={isMe}
      onCopy={handleCopy}
      onShareInvite={handleShareInvite}
      onStart={handleStart}
      onLeave={handleLeave}
      starting={starting}
      startError={startError}
      copyToast={copyToast}
      showReconnecting={showReconnecting}
      mode={mode}
      setMode={setMode}
      pack={pack}
      setPack={setPack}
      scoringMode={room.mode || "race"}
      onSetScoringMode={actions.setRoomMode}
    />
  );
}

// topicMeta + TopicPickerSheet moved to App.jsx (shared with LocalSetup).

function LobbyView({ room, players, isHost, isMe, onCopy, onShareInvite, onStart, onLeave, starting, startError, copyToast, showReconnecting, mode, setMode, pack, setPack, scoringMode, onSetScoringMode }) {
  // Optimistic mode highlight: reflect the host's tap instantly, then let the
  // realtime room.mode echo confirm it. Revert + toast if the RPC fails so the
  // picker never silently no-ops or sticks on a value the server didn't accept.
  const [pendingMode, setPendingMode] = useState(null);
  const activeMode = pendingMode ?? scoringMode;
  useEffect(() => {
    if (pendingMode !== null && scoringMode === pendingMode) setPendingMode(null);
  }, [scoringMode, pendingMode]);
  const pickMode = useCallback(async (m) => {
    setPendingMode(m);
    const r = await onSetScoringMode?.(m);
    if (!r || r.ok === false) {
      setPendingMode(null);
      try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: 'Could not change mode — try again' })); } catch {}
    }
  }, [onSetScoringMode]);
  // Single "Format" axis: Classic/Sprint are race-scored lengths; Survival is
  // the elimination mode. Picking a format sets the local length AND syncs
  // room.mode (race|survival) so joiners see what they're about to play.
  const pickFormat = useCallback((fmt) => {
    setMode(fmt);
    const target = fmt === "survival" ? "survival" : "race";
    if (activeMode !== target) pickMode(target);
  }, [setMode, activeMode, pickMode]);
  // Topic picker sheet (host taps Change on the topic card).
  const [topicOpen, setTopicOpen] = useState(false);
  // Host-left detection (mirrors the gameplay banner at the MultiplayerGameplay
  // level): if the host's row has vanished from the realtime player list, the
  // room can never start (start_game rejects non-hosts), so surface an explicit
  // dead-end + Leave instead of a normal-looking lobby that silently never starts.
  const hostStillPresent = !!room && players.some(p => p.user_id === room.host_id);
  return (
    <div className="screen">
      <div className="page-hdr" style={{ position: "relative" }}>
        <button className="back-btn" onClick={onLeave} aria-label="Leave room">←</button>
        <div className="page-title">Lobby</div>
        {showReconnecting && (
          <div style={{ position: "absolute", right: 16, top: 18, fontSize: 11, color: "var(--t3)" }}>
            Reconnecting…
          </div>
        )}
      </div>
      <div style={{ padding: "16px 4px", maxWidth: 480, margin: "0 auto" }}>
        {!isHost && !hostStillPresent && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--text)",
            textAlign: "center",
          }}>
            ⚠️ The host left — this room is closed.{" "}
            <button
              onClick={onLeave}
              style={{
                background: "none", border: "none", color: "var(--accent)",
                textDecoration: "underline", cursor: "pointer", fontSize: 13,
                padding: 0, fontFamily: "inherit",
              }}
            >
              Leave
            </button>
          </div>
        )}
        {/* Room-code card (design handoff lobby.dc.html): eyebrow + mono code
            + share pill in one compact card. Tapping the code still copies. */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--t3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Room Code
          </div>
          <button
            onClick={onCopy}
            style={{
              background: "transparent", border: "none",
              padding: "6px 0 0",
              fontSize: 36, fontWeight: 800, letterSpacing: "0.2em",
              color: "var(--text)", fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",
              cursor: "pointer", display: "inline-block",
            }}
            aria-label={`Copy room code ${room.code} — tap to copy`}
          >
            {room.code}
          </button>
          {/* Sprint #92 GGG4: native share sheet for the canonical /join/CODE
              URL. Recipient with the app installed triggers the Universal
              Link and lands in the join flow; without the app, the SPA
              path-captures /join/CODE into the same pendingJoinCode flow. */}
          <button
            type="button"
            onClick={onShareInvite}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid var(--accent-b)",
              borderRadius: 10,
              color: "var(--accent)",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Share invite link"
          >
            🔗 Share invite link
          </button>
          {copyToast && (
            <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 6 }}>{copyToast}</div>
          )}
        </div>

        {/* Player list */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--t2)", letterSpacing: 0.4, textTransform: "uppercase" }}>Players</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{players.length} / {room.capacity}</div>
          </div>
          {players.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--t2)", fontSize: 13 }}>
              Waiting for players…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {players.map(p => (
                <div key={`${p.room_id}:${p.user_id}`} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "var(--s1)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 24 }}>{p.avatar || "⚽"}</div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                    {p.name}
                    {isMe(p) && <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500, marginLeft: 6 }}>(you)</span>}
                    {p.user_id === room.host_id && <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginLeft: 6 }} aria-label="Host">HOST</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoring mode — shown to EVERYONE (room.mode broadcasts) so joiners
            know what they're playing before the host hits Start. */}
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--t2)", marginBottom: 16 }}>
          {activeMode === "hotstreak"
            ? "🔥 Hot Streak — longest correct streak wins"
            : activeMode === "survival"
            ? "💀 Survival — one wrong answer and you're out"
            : "🏁 Race — fastest correct answers win"}
        </div>

        {/* Host-only TOPIC card (design handoff lobby.dc.html) — Change opens
            the full-screen picker. The chosen pack's questions land in
            start_game's array, so joiners automatically play the same pack. */}
        {isHost && (() => {
          const t = topicMeta(pack);
          return (
            <>
              <div className="ds-eyebrow" style={{ margin: "12px 0 8px" }}>Topic</div>
              <div style={{borderRadius:16,background:"var(--s1)",border:"1px solid var(--border)",padding:"13px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <span style={{width:46,height:46,borderRadius:13,background:t.color || "var(--s2)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:t.abbr ? 12 : 21,fontWeight:t.abbr ? 900 : 400,letterSpacing:t.abbr ? "0.04em" : 0,color:t.fg || "var(--t1)",flexShrink:0,boxShadow:t.color ? `0 2px 8px ${t.color}55` : undefined}}>{t.abbr || t.icon}</span>
                <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:2}}>
                  <span style={{fontSize:15,fontWeight:800,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                  <span style={{fontSize:12,color:"var(--t3)"}}>{t.sub}</span>
                </div>
                <button onClick={() => setTopicOpen(true)} disabled={starting} style={{border:"none",borderRadius:999,padding:"9px 16px",fontSize:13,fontWeight:800,color:"#07240D",background:"var(--accent)",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Change</button>
              </div>
            </>
          );
        })()}

        {/* Host-only FORMAT cards. Classic/Sprint are race-scored; Survival
            flips room.mode to the escalating elimination game (easy → hard,
            one wrong = out, last standing wins). */}
        {isHost && (
          <>
            <div className="ds-eyebrow" style={{ margin: "12px 0 8px" }}>Format</div>
            <div style={{display:"flex",gap:9,marginBottom:16}}>
              {[
                { id: "classic",  title: "🎯 Classic",  sub: "10 questions" },
                { id: "sprint",   title: "⚡ Sprint",   sub: "5 questions" },
                { id: "survival", title: "💀 Survival", sub: "Until you miss" },
              ].map(f => {
                const sel = mode === f.id;
                return (
                  <button key={f.id} type="button" onClick={() => pickFormat(f.id)} disabled={starting} aria-pressed={sel}
                    style={{flex:1,borderRadius:14,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",fontFamily:"inherit",
                      ...(sel ? {background:"rgba(88,204,2,0.08)",border:"1.5px solid rgba(88,204,2,0.5)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
                    <span style={{fontSize:14,fontWeight:800,color:sel ? "#8AE042" : "var(--t2)"}}>{f.title}</span>
                    <span style={{fontSize:11.5,color:sel ? "#5F9E3B" : "var(--t3)",fontVariantNumeric:"tabular-nums"}}>{f.sub}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {topicOpen && (
          <TopicPickerSheet
            value={pack}
            onClose={() => setTopicOpen(false)}
            onDone={(id) => { setPack(id); setTopicOpen(false); }}
          />
        )}

        {/* Host start button. Stage 1F.3: gate at 2+ players (1 was a
            useless solo "multiplayer" game where the host played alone
            and saw a one-row scoreboard). The gate uses room.code in the
            wait copy as actionable context — host knows what to share. */}
        {isHost && (
          <>
            <button
              className="btn-3d"
              onClick={onStart}
              disabled={starting || players.length < 2}
              style={{ width: "100%", marginBottom: 12 }}
            >
              {starting ? "Starting…" : "Start Game"}
            </button>
            {!starting && players.length < 2 && (
              <div style={{ color: "var(--t3)", fontSize: 12, textAlign: "center", marginBottom: 12, lineHeight: 1.4 }}>
                Waiting for at least one more player — share your room code: <strong style={{ color: "var(--t1)", letterSpacing: 1 }}>{room.code}</strong>
              </div>
            )}
          </>
        )}
        {startError && (
          <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
            {startError}
          </div>
        )}

        {/* Leave footer */}
        <button
          className="btn"
          onClick={onLeave}
          style={{ width: "100%", background: "var(--s2)", border: "1px solid var(--border2)", color: "var(--text)" }}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}

function LobbyLoading() {
  return (
    <div className="screen">
      <div className="page-hdr">
        <div className="page-title">Lobby</div>
      </div>
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--t3)" }}>
        Connecting to room…
      </div>
    </div>
  );
}

function LobbyError({ error, onExit, onRetry }) {
  // Sprint #92 GGG1-#2: previously this screen was a dead end — "Back to Home"
  // discarded the joiner's intent + the user had to navigate back through
  // OnlineEntry to reattempt. Adds an explicit Retry that re-runs the initial
  // fetch in-place. Retry is the primary action (green); Back is the secondary
  // escape hatch. Common case (flaky network) resolves on tap.
  const retryable = !!onRetry;
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onExit} aria-label="Back">←</button>
        <div className="page-title">Lobby</div>
      </div>
      <div style={{ padding: "40px 20px", textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Couldn't load room
        </div>
        <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 20, lineHeight: 1.5 }}>
          {error || "Room not found or no longer active"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {retryable && (
            <button className="btn-3d" onClick={onRetry} style={{ padding: "12px 24px", minWidth: 180 }}>
              Try again
            </button>
          )}
          <button
            onClick={onExit}
            style={{
              padding: "10px 24px", minWidth: 180,
              background: "none", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--t2)",
              fontFamily: "inherit", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function LobbyEnded({ players, myPlayer, onExit, room }) {
  const isHotStreak = room?.mode === 'hotstreak';
  const isSurvival = room?.mode === 'survival';
  // Survival ranks by who lasted longest (alive > later elimination); Hot Streak
  // ranks by best streak; Race ranks by points. All fall back to joined_at asc
  // so ties stay stable (earliest joiner wins).
  const sorted = (players || []).slice().sort((a, b) => {
    if (isSurvival) {
      const ae = a.eliminated_at_q == null ? Infinity : a.eliminated_at_q;
      const be = b.eliminated_at_q == null ? Infinity : b.eliminated_at_q;
      if (ae !== be) return be - ae;
    }
    if (isHotStreak) {
      const bs = (b.best_streak || 0) - (a.best_streak || 0);
      if (bs !== 0) return bs;
    }
    if (b.score !== a.score) return b.score - a.score;
    const ta = a.joined_at || '';
    const tb = b.joined_at || '';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });

  const myUserId = myPlayer?.user_id || null;
  const myRank = myUserId ? sorted.findIndex(p => p.user_id === myUserId) + 1 : 0;
  const winner = sorted[0];
  const isWinner = !!myUserId && !!winner && winner.user_id === myUserId;
  // Survival: if everyone got eliminated, the "winner" is whoever lasted
  // longest — frame it as that rather than "You won!" beside their own 💀 row.
  const survivalLastStanding = isSurvival && !!winner && winner.eliminated_at_q != null;
  // A survival draw: everyone was eliminated on the SAME question — no one
  // lasted longer, so it's a tie, not a win. (Only a full draw, so a clear
  // last-place player in a 3-way isn't told "it's a draw".)
  const survivalDraw = survivalLastStanding && sorted.length > 1 && sorted.every(p => p.eliminated_at_q === winner.eliminated_at_q);

  // ⭐ 5-star ask at a multiplayer emotional peak — winning a LIVE game (>=2
  // players, not a draw) is a genuine high, the same caliber moment solo wins
  // get. Fires once; maybeRequestReview keeps its 45-day cooldown + lifetime cap
  // + native-only gating, and shares one budget with the quiz/Footle nudges.
  const reviewAskedRef = useRef(false);
  useEffect(() => {
    if (reviewAskedRef.current) return;
    if (isWinner && !survivalDraw && (players?.length || 0) >= 2) {
      reviewAskedRef.current = true;
      const t = setTimeout(() => { maybeRequestReview(); }, 3500);
      return () => clearTimeout(t);
    }
  }, [isWinner, survivalDraw, players]);

  // Medal emoji for podium positions; numeric rank thereafter.
  function rankBadge(idx) {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return String(idx + 1);
  }

  // Highlight the user's own row with an accent border. Winner row gets a
  // gold accent regardless of whether the viewer is the winner.
  function rowStyle(player, idx) {
    const isMe = !!myUserId && player.user_id === myUserId;
    const isFirst = idx === 0 && !survivalDraw;
    let borderColor = 'var(--border)';
    let background = 'var(--s1)';
    if (isFirst) {
      borderColor = 'rgba(234,179,8,0.45)'; // gold
      background = 'rgba(234,179,8,0.06)';
    } else if (isMe) {
      borderColor = 'rgba(34,197,94,0.45)'; // accent green
      background = 'rgba(34,197,94,0.06)';
    }
    return {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background,
      border: '1px solid ' + borderColor,
      borderRadius: 12,
    };
  }

  return (
    <div className="screen">
      {/* Multiplayer winners deserve the same celebration solo wins get.
          (Not for a draw — nobody outlasted anybody.) */}
      {isWinner && !survivalDraw && <Confetti />}
      <div className="page-hdr">
        <div className="page-title">Game over</div>
      </div>
      <div style={{ padding: '12px 4px', maxWidth: 480, margin: '0 auto' }}>
        {/* Headline — winner / your-result framing */}
        <div style={{ textAlign: 'center', padding: '8px 12px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{survivalDraw ? '🤝' : isWinner ? (survivalLastStanding ? '🏅' : '🏆') : '👋'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {survivalDraw ? "It's a draw!" : winner ? (isWinner ? (survivalLastStanding ? 'You lasted longest!' : 'You won!') : `${winner.name || 'Player'} ${survivalLastStanding ? 'lasted longest' : 'wins'}`) : 'Game over'}
          </div>
          {survivalDraw ? (
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              Everyone knocked out on Q{(winner.eliminated_at_q ?? 0) + 1}
            </div>
          ) : myRank > 0 && !isWinner && (
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              You finished {rankBadge(myRank - 1)}{myRank >= 4 ? ' place' : ''}
            </div>
          )}
        </div>

        {/* Final scores list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: 'var(--t2)',
            letterSpacing: 0.4, textTransform: 'uppercase',
            marginBottom: 2, paddingLeft: 4,
          }}>
            {isSurvival ? 'Last standing' : isHotStreak ? 'Best streaks' : 'Final scores'}
          </div>
          {(isSurvival || isHotStreak) && !survivalDraw && (
            <div style={{ fontSize: 11, color: 'var(--t3)', paddingLeft: 4, marginBottom: 6 }}>
              {isSurvival ? 'Knocked out later = ranked higher' : 'Longest correct streak wins'}
            </div>
          )}
          {sorted.map((p, idx) => {
            const isMe = !!myUserId && p.user_id === myUserId;
            return (
              <div key={`${p.room_id}:${p.user_id}`} style={rowStyle(p, idx)}>
                <div style={{
                  fontSize: idx < 3 ? 24 : 14,
                  fontWeight: 700,
                  width: 32, textAlign: 'center',
                  color: 'var(--text)',
                }}>
                  {rankBadge(idx)}
                </div>
                <div style={{ fontSize: 22 }}>{p.avatar || '⚽'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.name || 'Player'}
                    {isMe && (
                      <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500, marginLeft: 8 }}>
                        (you)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",
                  fontSize: 18, fontWeight: 800,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {isSurvival
                    ? (p.eliminated_at_q == null ? '❤️' : `💀 Q${p.eliminated_at_q + 1}`)
                    : isHotStreak ? `🔥 ${p.best_streak ?? 0}` : (p.score ?? 0)}
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--t2)', fontSize: 13 }}>
              No players in room
            </div>
          )}
        </div>

        <button className="btn-3d" onClick={onExit} style={{ width: '100%' }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

// MultiplayerGameplay: replaces PlayingPlaceholder once room.state ===
// 'playing'. Reads question + players from props (passed down from
// MultiplayerLobby's single useMultiplayerRoom hook instance — no remount,
// channel preserved across the lobby→playing transition). Stage 1C.1 is
// scaffold only: question + 4 buttons render, but tap is a no-op (handler
// wires in 1C.2). Timer, optimistic locking, scores, host controls land
// in 1C.3 / 1C.4 / 1C.5.
// 2-second reveal pause between answer-locked moment and next-question fire.
// Hardcoded for Stage 1C.6; tunable via this constant if friend testing
// surfaces "too fast" / "too slow" feedback. Stage 1F may make per-mode.
const REVEAL_PAUSE_MS = 2000;

function MultiplayerGameplay({ room, players, myPlayer, isHost, actions, onExit }) {
  const question = room.questions?.[room.current_question];

  // mountedRef: gates setState calls inside async paths so post-unmount
  // resolutions don't trigger React warnings.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Stage 1C.7.4 fix: advanceInFlightRef guarantees single-fire of
  // actions.advance() per 'advancing' phase transition. Without this,
  // the advance fire effect was re-running on every re-render where
  // `actions` identity changed (which is EVERY render — actions object
  // is recreated each useMultiplayerRoom render because `advance`
  // callback's useCallback deps include `room`, so advance recreates on
  // every room update). While revealPhase stays 'advancing' in the
  // stale closure (between realtime UPDATE arriving and the question-
  // advance useEffect resetting phase to 'answering'), each re-fire
  // called advance() again — cascading through all remaining questions
  // in <1s, which is what the user observed as "rocketing through Q2,
  // Q3, Q5, Q6 with each only mounted ~500ms".
  //
  // Reset on transition out of 'advancing' so subsequent advances work.
  const advanceInFlightRef = useRef(false);

  // Local optimistic answer lock.
  const [myAnswer, setMyAnswer] = useState(null);

  // Reveal phase state machine (Stage 1C.6):
  //   answering → revealing → advancing → (back to answering on next Q)
  //                                     → (stuck on advance error)
  // Each client runs its own machine. Server's expected_mismatch gate
  // (Spike 2 validated) handles concurrent advance RPCs from multiple
  // clients — first wins, others no-op silently.
  const [revealPhase, setRevealPhase] = useState('answering');

  // R2: track whether 'advancing' phase has been active for >15s without
  // resolving. Likely cause is host session expired or host's network
  // silently dropped without leave_room firing — joiners would otherwise
  // sit on a dimmed UI indefinitely. The flag drives an explicit Leave
  // banner (rendered below) so joiners aren't trapped.
  const [advancingTooLong, setAdvancingTooLong] = useState(false);

  // Retry-status subscription. Renders a "Reconnecting…" pill at the top
  // of the gameplay screen while any multiplayer RPC is in retry territory.
  const { retrying: mpRetrying } = useMpRetryStatus();

  // Sprint #91 FFF2: captures Date.now() (wall-clock) at the moment the
  // current question first rendered. performance.now() pauses on iOS
  // WKWebView background-suspend — a player who backgrounds mid-question
  // would resume with a stale offset, letting them submit "fast" answers
  // long after the wall-clock window closed. Date.now() advances during
  // background so the server-side lock_time validation reflects real
  // elapsed time. Used to compute lock_time_ms on submit.
  const questionStartedAtRef = useRef(Date.now());

  // Question-advance reset. Fires on initial mount AND each subsequent
  // realtime UPDATE that lifts room.current_question. Resets myAnswer,
  // revealPhase back to 'answering', and the timer ref.
  useEffect(() => {
    setMyAnswer(null);
    setRevealPhase('answering');
    questionStartedAtRef.current = Date.now();
  }, [room.current_question]);

  const handleLeave = useCallback(async () => {
    try { await actions.leave(); } catch {}
    onExit();
  }, [actions, onExit]);

  const currentQuestionIdx = room.current_question;

  // Server-confirmed "did I answer this question already" — survives a
  // page refresh that wipes local myAnswer state.
  const serverConfirmedAnswered = (myPlayer?.answered_question ?? -1) >= currentQuestionIdx;

  const myAnswerForCurrent = myAnswer && myAnswer.questionIdx === currentQuestionIdx
    ? myAnswer
    : null;
  const hasAnswered = !!myAnswerForCurrent || serverConfirmedAnswered;
  const lockedAnswerIdx = myAnswerForCurrent?.answerIdx ?? null;

  const handleAnswerPick = useCallback(async (answerIdx) => {
    if (myAnswer || serverConfirmedAnswered) return;

    const lockTimeMs = Date.now() - questionStartedAtRef.current;
    const submittedQuestionIdx = currentQuestionIdx;

    setMyAnswer({ questionIdx: submittedQuestionIdx, answerIdx, lockTimeMs });

    const result = await actions.submitAnswer(submittedQuestionIdx, answerIdx, lockTimeMs);
    if (!mountedRef.current) return;

    if (result.error) {
      // Network/server failure (post-retry exhaustion). Rollback the
      // optimistic state — server doesn't have the answer, so the UI
      // shouldn't lock the option as "answered". Without rollback, the
      // user appears stuck on the answered-locked banner while other
      // players see them as not-yet-answered.
      console.warn('[mp] submit_answer failed:', result.error);
      setMyAnswer(null);
      // Sprint #91 FFF3: surface the failure so the user knows to re-tap.
      // Without this the rollback was silent — option tiles re-clickable,
      // but no signal that something went wrong, so users assumed their
      // first tap registered and didn't realise they needed to act again.
      // 4200ms duration since they need time to read + re-decide before
      // the question advances.
      try {
        window.dispatchEvent(new CustomEvent('biq:show-toast', {
          detail: { msg: "⚠️ Answer didn't go through — pick again", duration: 4200 },
        }));
      } catch {}
      return;
    }
    if (result.accepted === false) {
      if (result.reason === 'question_idx_mismatch') setMyAnswer(null);
      // already_answered: silent — server has our answer, optimistic stays
      return;
    }
  }, [myAnswer, serverConfirmedAnswered, currentQuestionIdx, actions]);

  // Host-disconnect detection.
  const hostStillPresent = !!room && players.some(p => p.user_id === room.host_id);

  // Timeout auto-submit. Submits -1 (wrong, score 0, but answered_question
  // gets set so the all-answered check unblocks). Fired by handleTimerExpire
  // below alongside the phase transition.
  const handleTimeoutAutoSubmit = useCallback(async () => {
    if (myAnswer || serverConfirmedAnswered) return;
    const submittedQuestionIdx = currentQuestionIdx;
    setMyAnswer({ questionIdx: submittedQuestionIdx, answerIdx: -1, lockTimeMs: QUESTION_DURATION_MS });
    const result = await actions.submitAnswer(submittedQuestionIdx, -1, QUESTION_DURATION_MS);
    if (!mountedRef.current) return;
    if (result.error) {
      // Network/server failure on the timeout submit. Rollback so
      // hasAnswered doesn't show as true when the server doesn't agree.
      setMyAnswer(null);
      return;
    }
    if (result.accepted === false && result.reason === "question_idx_mismatch") {
      setMyAnswer(null);
    }
  }, [myAnswer, serverConfirmedAnswered, currentQuestionIdx, actions]);

  // ── Phase machine (Stage 1C.6) ──────────────────────────────────────
  //
  // Trigger A: all players answered → revealing
  // Each client computes from its own (realtime-synced) view of players.
  // Stays sticky once entered (a late-joiner's -1 answered_question
  // won't bounce us back to 'answering' — we're already past).
  // In Survival, eliminated players are spectators — their QuestionView is
  // disabled so they never tap, and their answered_question only advances when
  // their own 20s timer fires. Gating the reveal on them would force the living
  // to wait the full timer every post-elimination question. So only living
  // players gate the reveal in survival (all players in race/hotstreak).
  const allAnswered = players.length > 0 && players
    .filter(p => room?.mode !== 'survival' || p.eliminated_at_q == null)
    .every(p => p.answered_question >= currentQuestionIdx);
  useEffect(() => {
    if (revealPhase === 'answering' && allAnswered) {
      setRevealPhase('revealing');
    }
  }, [revealPhase, allAnswered]);

  // R2: advancing-too-long timer. If we're stuck in 'advancing' for >15s,
  // surface an explicit Leave banner. 15s is intentionally well past the
  // RPC retry budget (~5s worst case) so retry-eligible failures resolve
  // before the banner appears. Resets on any phase change out of
  // 'advancing'.
  useEffect(() => {
    if (revealPhase !== 'advancing') {
      setAdvancingTooLong(false);
      return;
    }
    const t = setTimeout(() => setAdvancingTooLong(true), 15000);
    return () => clearTimeout(t);
  }, [revealPhase]);

  // Trigger B: local timer expired → revealing (regardless of who answered)
  // Combined with auto-submit so each client's timer expiry is one event.
  const handleTimerExpire = useCallback(() => {
    handleTimeoutAutoSubmit(); // fire-and-forget; its own promise chain handles errors
    setRevealPhase(prev => prev === 'answering' ? 'revealing' : prev);
  }, [handleTimeoutAutoSubmit]);

  // 2s pause: revealing → advancing
  useEffect(() => {
    if (revealPhase !== 'revealing') return;
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      setRevealPhase('advancing');
    }, REVEAL_PAUSE_MS);
    return () => clearTimeout(t);
  }, [revealPhase]);

  // Advance fire: ONLY the host fires advance_question. Joiners stay in
  // 'advancing' phase silently and wait for realtime UPDATE on
  // game_rooms.current_question (handled by question-advance useEffect
  // which resets revealPhase back to 'answering').
  //
  // Why host-only (Stage 1C.6.2 fix): the SQL function checks host_id
  // and rejects non-host callers (errcode 42501). Joiner advance
  // attempts always failed and used to flash a red "Couldn't advance"
  // banner every transition. Now joiners passively wait for the host's
  // advance to ripple via realtime.
  //
  // Single-fire guard (Stage 1C.7.4 fix): advanceInFlightRef gates
  // execution to ONCE per 'advancing' transition. Without this, the
  // effect re-ran on every render where deps changed — and `actions`
  // is recreated every useMultiplayerRoom render (because the inner
  // `advance` callback's useCallback deps include `room`, which
  // updates on every realtime event). The stale closure had
  // revealPhase='advancing' for several renders between the realtime
  // UPDATE arriving and the question-advance useEffect resetting
  // phase to 'answering'. Each stale-closure run of this effect
  // called advance() again, cascading through all remaining questions
  // in <1s.
  //
  // Why `actions` is excluded from deps: even with the in-flight guard,
  // re-running the effect on every actions identity change is wasted
  // work. The closure's actions reference is stale-but-fine: the
  // `advance` callback inside it reads room.current_question at CALL
  // time via its own closure, which is whatever room reference the
  // callback was created with. Server's expected_question check tolerates
  // either fresh or one-step-stale current_question (returns
  // expected_mismatch on stale, silent no-op).
  //
  // Edge case — host's network drops without leave_room: joiners stay
  // in 'advancing' indefinitely (UI dimmed, no banner since
  // hostStillPresent stays true). User can exit via wordmark home
  // button. Stage 1F may add a "advancing too long" timeout fallback.
  useEffect(() => {
    if (revealPhase !== 'advancing') {
      advanceInFlightRef.current = false;  // reset on phase transition out
      return;
    }
    if (!isHost) return;  // joiners wait for realtime UPDATE
    if (advanceInFlightRef.current) return;  // single-fire guard
    advanceInFlightRef.current = true;

    let cancelled = false;
    (async () => {
      // Survival: once everyone is eliminated, end the game now rather than
      // auto-advancing through the remaining questions (nothing left to play for).
      if (room.mode === 'survival' && players.length > 0 && players.every(p => p.eliminated_at_q != null)) {
        const endRes = await actions.end();
        if (cancelled || !mountedRef.current) return;
        if (endRes.error) { console.warn('[mp] end failed (all eliminated):', endRes.error); setRevealPhase('stuck'); }
        return;
      }
      const result = await actions.advance();
      if (cancelled || !mountedRef.current) return;
      if (result.error) {
        // Host-side genuine failure (network, server). No retry —
        // settle in 'stuck' so the indicator below gives the host
        // an actionable explanation.
        console.warn('[mp] advance failed (entering stuck state):', result.error);
        setRevealPhase('stuck');
      }
      // expected_mismatch / success: silent. Realtime UPDATE on
      // game_rooms.current_question (or state='ended' for last Q)
      // triggers re-render via parent's MultiplayerLobby render switch.
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealPhase, isHost]);

  // Host-tap handlers for the phase-aware advance button.
  // Next/End Game during answering: trigger reveal phase (consistent
  // rhythm — host's manual advance still has the 2s pause; if they want
  // instant they can Skip during the pause).
  const handleTriggerReveal = useCallback(() => {
    setRevealPhase(prev => prev === 'answering' ? 'revealing' : prev);
  }, []);
  // Skip during reveal: jump straight to advancing (cancels the 2s pause).
  const handleSkipAhead = useCallback(() => {
    setRevealPhase(prev => prev === 'revealing' ? 'advancing' : prev);
  }, []);

  if (!question) {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={handleLeave} aria-label="Leave">←</button>
          <div className="page-title">Game</div>
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "var(--t2)" }}>
          Question data missing — leave room and rejoin.
        </div>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIdx + 1 >= room.questions.length;
  const showRevealBanner = revealPhase === 'revealing';
  // Survival spectator state — once eliminated, the player watches the round
  // resolve (no answer-timer pressure, no answering).
  const iAmEliminated = room.mode === 'survival' && myPlayer?.eliminated_at_q != null;
  const aliveCount = room.mode === 'survival' ? players.filter(p => p.eliminated_at_q == null).length : 0;
  // Stage 1C.7.1: derived `revealing` instead of raw `revealPhase !==
  // 'answering'`. Guards against the brief render between realtime UPDATE
  // arriving (room.current_question increments) and the question-advance
  // useEffect resetting revealPhase to 'answering'. In that intermediate
  // frame, `revealPhase` is stale ('advancing') but `room.current_question`
  // is the new question — without this gate, QuestionView would briefly
  // render the new question with its correct answer pre-highlighted in
  // green, looking to the user like a "different question with the answer
  // pre-revealed" flash.
  //
  // Logic: trust revealPhase only if either (a) myAnswer is null (late
  // joiner / pre-tap state — no stale tracking concern) OR (b)
  // myAnswer.questionIdx matches currentQuestionIdx (reveal state is for
  // the current question, not a stale prior one). After the question-
  // advance useEffect runs and clears myAnswer + resets revealPhase, the
  // derived value naturally settles.
  const revealing = revealPhase !== 'answering' && (
    myAnswer === null || myAnswer.questionIdx === currentQuestionIdx
  );
  const dimContent = revealing;

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={handleLeave} aria-label="Leave game">←</button>
        <div className="page-title">
          Question {currentQuestionIdx + 1}/{room.questions.length}
        </div>
      </div>
      <div style={{ padding: "12px 4px", maxWidth: 480, margin: "0 auto" }}>
        {mpRetrying && (
          <div style={{
            padding: "6px 12px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 12,
            color: "var(--accent)",
            textAlign: "center",
          }}>
            Reconnecting…
          </div>
        )}

        <ScoreBar
          players={players}
          myUserId={myPlayer?.user_id}
          hostId={room.host_id}
          mode={room.mode}
        />

        {!hostStillPresent && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 13,
            color: "var(--text)",
            textAlign: "center",
          }}>
            ⚠️ Host disconnected — game can't advance.{" "}
            <button
              onClick={handleLeave}
              style={{
                background: "none", border: "none", color: "var(--accent)",
                textDecoration: "underline", cursor: "pointer", fontSize: 13,
                padding: 0, fontFamily: "inherit",
              }}
            >
              Leave game
            </button>
          </div>
        )}

        {advancingTooLong && hostStillPresent && revealPhase === 'advancing' && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 13,
            color: "var(--text)",
            textAlign: "center",
          }}>
            Game seems stuck — host may be unresponsive.{" "}
            <button
              onClick={handleLeave}
              style={{
                background: "none", border: "none", color: "var(--accent)",
                textDecoration: "underline", cursor: "pointer", fontSize: 13,
                padding: 0, fontFamily: "inherit",
              }}
            >
              Leave game
            </button>
          </div>
        )}

        {/* Reserved phase-banner slot: reveal / stuck / advancing-too-long
            are mutually exclusive (driven by revealPhase). Reserving 50px
            keeps content below stable when these appear/disappear. Empty
            slot is invisible (no border/background) when no banner shows. */}
        <div style={{ minHeight: 50, marginBottom: 12 }}>
          {showRevealBanner && (
            <div style={{
              padding: "10px 14px",
              background: "var(--s2)",
              border: "1px solid var(--accent)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              textAlign: "center",
            }}>
              {isLastQuestion ? "Game ending in 2s" : "Next question in 2s"}
            </div>
          )}

          {revealPhase === 'stuck' && hostStillPresent && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--text)",
              textAlign: "center",
            }}>
              Couldn't advance — leave the room and rejoin to retry.
            </div>
          )}
        </div>

        {/* Stage 1C.7: dim wrapper scopes only the timer. QuestionView dims
            its own prompt internally when revealing=true. Hidden for eliminated
            survival spectators — a ticking answer timer over dead buttons reads
            like answer pressure on a question they can't touch. */}
        {!iAmEliminated && (
          <div style={{ opacity: dimContent ? 0.6 : 1 }}>
            <QuestionTimer
              durationMs={QUESTION_DURATION_MS}
              onExpire={handleTimerExpire}
              questionIdx={currentQuestionIdx}
            />
          </div>
        )}

        {/* No `key` on QuestionView/QuestionTimer (Stage 1F follow-up):
            previously remounted via key={currentQuestionIdx} for clean
            state reset, but the unmount-mount caused visible layout
            collapse during transitions. Now passes questionIdx as a prop;
            internal effects reset state in-place. The derived `revealing`
            gate (above) handles the stale-revealPhase frame. */}
        <QuestionView
          question={question}
          lockedAnswerIdx={lockedAnswerIdx}
          disabled={hasAnswered || revealPhase !== 'answering' || iAmEliminated}
          onPick={handleAnswerPick}
          revealing={revealing}
          questionIdx={currentQuestionIdx}
        />

        {/* Reserved answer-locked banner slot — reserves space so
            HostAdvanceControls below stays anchored regardless of whether
            the banner is showing. */}
        <div style={{ minHeight: 45, marginTop: 16 }}>
          {iAmEliminated ? (
            <div style={{
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, textAlign: "center",
              fontSize: 13, fontWeight: 600, color: "var(--text)",
            }}>
              💀 You're out — {aliveCount === 1 ? "1 player still alive" : `${aliveCount} players still alive`}.{" "}
              <button onClick={handleLeave} style={{ background: "none", border: "none", color: "var(--accent)", textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit", fontWeight: 600 }}>
                Leave game
              </button>
            </div>
          ) : hasAnswered && revealPhase === 'answering' && (
            <div style={{
              padding: "10px 14px",
              background: "var(--s1)", border: "1px solid var(--border)",
              borderRadius: 10, textAlign: "center",
              fontSize: 13, color: "var(--t2)",
            }}>
              ✓ Answer locked — waiting for others
            </div>
          )}
        </div>

        {isHost && (
          <HostAdvanceControls
            phase={revealPhase}
            players={players}
            currentQuestion={currentQuestionIdx}
            totalQuestions={room.questions.length}
            onTriggerReveal={handleTriggerReveal}
            onSkipAhead={handleSkipAhead}
          />
        )}
      </div>
    </div>
  );
}

// useQuestionTimer: countdown hook. Internal setInterval ticks every 100ms,
// computing remaining = max(0, durationMs - elapsed). Calls onExpire once
// when remaining hits 0. The onExpire ref pattern (vs putting onExpire in
// the useEffect deps) avoids restarting the timer when the parent passes a
// fresh callback identity each render — common case since handleTimeout-
// AutoSubmit's useCallback recreates on question advance.
//
// resetKey is an opaque value (typically currentQuestionIdx) — when it
// changes, the timer restarts. Replaces the old key={currentQuestionIdx}
// remount pattern, which caused visible layout collapse during transitions.
function useQuestionTimer(durationMs, resetKey) {
  const [remainingMs, setRemainingMs] = useState(durationMs);

  useEffect(() => {
    setRemainingMs(durationMs);
    // Sprint #91 FFF2: Date.now() (wall-clock) instead of performance.now().
    // On iOS WKWebView the perf clock freezes during background-suspend;
    // a player who backgrounds for 10s of a 20s question would return with
    // a timer that hadn't ticked, gifting them free seconds. Date.now()
    // keeps advancing, so on resume the next setInterval tick computes a
    // truthful elapsed value (collapses to 0 / fires onExpire if the
    // background window outlasted the question — fair behaviour for a
    // timed trivia app).
    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);
      if (remaining === 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [durationMs, resetKey]);

  return remainingMs;
}

// QuestionTimer: shrinking-bar countdown + seconds number. Color shifts to
// red below 5s. Pass questionIdx to reset on question advance — replaces
// the previous parent-side key={currentQuestionIdx} remount pattern (the
// remount caused a visible layout collapse during transitions; in-place
// reset via effect dep eliminates that without losing reset semantics).
function QuestionTimer({ durationMs, onExpire, questionIdx }) {
  const remainingMs = useQuestionTimer(durationMs, questionIdx);
  const expiredRef = useRef(false);

  // Reset expired-once guard when question changes.
  useEffect(() => {
    expiredRef.current = false;
  }, [questionIdx]);

  // Trigger onExpire exactly once when timer hits 0. Using effect (not
  // direct call inside the hook) so onExpire receives the latest callback
  // closure from the parent — onExpire identity may change between renders
  // (e.g., handleTimeoutAutoSubmit's deps change with currentQuestionIdx).
  useEffect(() => {
    if (remainingMs === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [remainingMs, onExpire]);

  const seconds = Math.ceil(remainingMs / 1000);
  const pct = (remainingMs / durationMs) * 100;
  const isLow = remainingMs > 0 && remainingMs < 5000;

  return (
    <div style={{
      position: "relative",
      height: 28,
      borderRadius: 8,
      background: "var(--s1)",
      border: "1px solid var(--border)",
      overflow: "hidden",
      marginBottom: 16,
    }}>
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: `${pct}%`,
        background: isLow ? "#ef4444" : "var(--accent)",
        transition: "width 0.1s linear",
      }} />
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: 0.4,
      }}>
        {seconds}s
      </div>
    </div>
  );
}

// Stage 1C.7 reveal-coloring constants. Hardcoded inline; Stage 1F may
// promote to CSS theme tokens if more multiplayer-styling work happens.
const MP_LOCK_COLOR    = "#64748b"; // slate-500 — neutral "this is my pick, not yet judged"
const MP_CORRECT_COLOR = "#22c55e"; // green-500 — the right answer (and your pick if you got it)
const MP_WRONG_COLOR   = "#ef4444"; // red-500 — your wrong pick (already used elsewhere for errors)
const MP_CORRECT_BG    = "rgba(34, 197, 94, 0.15)";
const MP_WRONG_BG      = "rgba(239, 68, 68, 0.15)";

// QuestionView: presentational. prompt + 4 option buttons.
//
// Props:
//   question         — { prompt, options, correct } from server
//   lockedAnswerIdx  — int (0-3) for player's pick, -1 for timeout, null
//                      for late-joiners or pre-tap state
//   disabled         — boolean: gates the onPick (no tapping post-lock OR
//                      during reveal/advance/stuck phases)
//   onPick(idx)      — fires when an enabled, no-lock button is tapped
//   revealing        — boolean (Stage 1C.7): true during 'revealing',
//                      'advancing', AND 'stuck' phases. Switches options
//                      from neutral lock-color to correct/wrong reveal
//                      coloring; dims the prompt only (NOT the options —
//                      colors are the visual signal).
//
// Reveal coloring per option (when revealing=true):
//   - The correct option: green border + filled green letter circle + ✓
//   - Player's wrong pick: red border + filled red letter circle + ✗
//   - Player's correct pick: same as "correct" row (implicit "you got it")
//   - Untouched wrong options: default style, full opacity (no judgment)
//
// Late-joiner null-safety: when lockedAnswerIdx is null, `idx === null`
// is false for all valid idx (0,1,2,3), so isLocked stays false → no
// "your wrong" path fires → late joiner sees only the green-correct
// highlight during reveal, no red anywhere. Same for timeout (-1):
// `idx === -1` is false for all valid idx → no spurious red.
function QuestionView({ question, lockedAnswerIdx, disabled, onPick, revealing, questionIdx }) {
  // Stage 1C.7.5 + Stage 1F follow-up: suppress option-button color
  // transitions on the first frame after a question change. Stale color
  // transitions from the prior question's reveal state would bleed into
  // the new question's first paint, making transitions feel chaotic.
  // After the first frame (via rAF in useLayoutEffect), enable the
  // targeted color transitions for subsequent in-mount state changes.
  //
  // Previously this was guaranteed by key={currentQuestionIdx} remount
  // (fresh useState init each question). The remount caused a visible
  // layout collapse during transitions, so the key was dropped — the
  // dep on questionIdx now drives the same flag-reset behavior in place.
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);
  useLayoutEffect(() => {
    setTransitionsEnabled(false);
    const id = requestAnimationFrame(() => setTransitionsEnabled(true));
    return () => cancelAnimationFrame(id);
  }, [questionIdx]);

  return (
    <div className="mp-question">
      <div style={{
        fontSize: 18, fontWeight: 700, color: "var(--text)",
        textAlign: "center", padding: "16px 8px 24px", lineHeight: 1.4,
        opacity: revealing ? 0.6 : 1,
        // Stage 1C.7.6: transition removed — opacity snaps when phase
        // changes. Was animating in parallel with option color reveal,
        // contributing to the stuttery feel.
      }}>
        {question.prompt}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => {
          const isLocked = lockedAnswerIdx === idx;
          const isCorrect = idx === question.correct;
          // Reveal-state classifications. Late-joiner (null) and timeout
          // (-1) cases short-circuit naturally — `null === idx` and
          // `-1 === idx` are both false for all valid idx.
          const isRevealCorrect = revealing && isCorrect;
          const isYourWrong = revealing && isLocked && !isCorrect;
          // Dim other unselected options ONLY during answering (not during
          // reveal — colors carry the message instead). Also requires a
          // valid pick (>=0), excluding null/timeout cases.
          const isOtherLocked = !revealing && lockedAnswerIdx !== null && lockedAnswerIdx >= 0 && !isLocked;

          // Visual state derivation
          let borderColor, borderWidth, bgColor, letterBg, letterColor, marker;
          if (isRevealCorrect) {
            borderColor = MP_CORRECT_COLOR;
            borderWidth = 2;
            bgColor = MP_CORRECT_BG;
            letterBg = MP_CORRECT_COLOR;
            letterColor = "#fff";
            marker = "✓";
          } else if (isYourWrong) {
            borderColor = MP_WRONG_COLOR;
            borderWidth = 2;
            bgColor = MP_WRONG_BG;
            letterBg = MP_WRONG_COLOR;
            letterColor = "#fff";
            marker = "✗";
          } else if (!revealing && isLocked) {
            // Locked during answering — neutral slate (not green) so the
            // pre-reveal state doesn't suggest correctness.
            borderColor = MP_LOCK_COLOR;
            borderWidth = 2;
            bgColor = "var(--s2)";
            letterBg = MP_LOCK_COLOR;
            letterColor = "#fff";
            marker = null;
          } else {
            // Default: untouched (during answering OR untouched-wrong
            // during reveal).
            borderColor = "var(--border)";
            borderWidth = 1;
            bgColor = "var(--s1)";
            letterBg = "var(--s2)";
            letterColor = "var(--text)";
            marker = null;
          }

          return (
            <button
              key={idx}
              onClick={() => { if (!disabled && lockedAnswerIdx === null) onPick(idx); }}
              disabled={disabled}
              aria-pressed={isLocked}
              style={{
                padding: "14px 16px",
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                border: `${borderWidth}px solid ${borderColor}`,
                background: bgColor,
                color: "var(--text)",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: disabled || lockedAnswerIdx !== null ? "default" : "pointer",
                opacity: isOtherLocked ? 0.5 : 1,
                fontFamily: "inherit",
                // Stage 1C.7.5: explicit color-only transitions (was "all
                // 0.2s ease"). Limits animation to border + background;
                // layout/opacity/transform changes snap instantly.
                // Suppressed entirely on first-frame-after-mount via
                // transitionsEnabled gate (see useLayoutEffect above).
                // Stage 1C.7.6: 0.15s → 0.1s for snappier feel. Now the
                // ONLY animated element in the gameplay screen — every
                // other element (dim wrapper, prompt opacity, banners)
                // snaps instantly per the "one source of motion" principle.
                transition: transitionsEnabled ? "border-color 0.1s ease, background-color 0.1s ease" : "none",
                // a11y bundle: paired with viewport user-scalable removal.
                // Disables double-tap-zoom on this element only so rapid
                // answer-lock taps on iOS don't get hijacked. Pinch-zoom
                // still works elsewhere.
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: "50%",
                background: letterBg,
                color: letterColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {LETTERS[idx]}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {marker && (
                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: borderColor,
                  flexShrink: 0,
                  marginLeft: 8,
                }}>
                  {marker}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ScoreBar: compact horizontal strip showing all players + scores. Stable
// order (by joined_at; the hook already sorts) — NOT score-based shuffle,
// which would be confusing UX as numbers move around. Self-chip highlighted
// (accent border + slightly brighter background). Host marker = small star.
// Score updates flow in via realtime room_players UPDATE → useMultiplayerRoom
// state update → re-render.
function ScoreBar({ players, myUserId, hostId, mode }) {
  return (
    <div style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      padding: "0 0 4px",
      marginBottom: 12,
    }}>
      {players.map(p => {
        const isMe = p.user_id === myUserId;
        const isHostPlayer = p.user_id === hostId;
        return (
          <div
            key={p.user_id}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: isMe ? "var(--s2)" : "var(--s1)",
              border: isMe ? "1px solid var(--accent)" : "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 18 }}>{p.avatar || "⚽"}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "var(--t2)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 90,
              }}>
                {p.name}
                {isHostPlayer && <span style={{ color: "var(--accent)", marginLeft: 4 }}>★</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
                {mode === "hotstreak" ? `🔥 ${p.streak ?? 0}`
                  : mode === "survival" ? <span role="img" aria-label={p.eliminated_at_q != null ? "eliminated" : "still alive"}>{p.eliminated_at_q != null ? "💀" : "❤️"}</span>
                  : p.score}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// HostAdvanceControls: visible only when isHost. Phase-aware (Stage 1C.6):
//
//   answering  → "Next Question →" / "End Game"   tap → onTriggerReveal
//                (sets revealPhase to 'revealing'; same path as auto-trigger
//                 when all answered or timer expires; consistent 2s rhythm)
//                Enabled when 1+ answered (disconnect-resilient).
//   revealing  → "Skip ahead"                     tap → onSkipAhead
//                (cancels the 2s pause, jumps to advancing immediately)
//   advancing  → "Advancing…" / "Ending…" disabled
//   stuck      → component returns null (banner above explains; user leaves)
//
// Status text in the eyebrow is the answered count for situational
// awareness — informational, not a gate (the 1+ enable rule is the gate).
function HostAdvanceControls({ phase, players, currentQuestion, totalQuestions, onTriggerReveal, onSkipAhead }) {
  if (phase === 'stuck') return null;

  const answeredCount = players.filter(p => p.answered_question >= currentQuestion).length;
  const total = players.length;
  const allAnswered = answeredCount === total && total > 0;
  const isLastQuestion = currentQuestion + 1 >= totalQuestions;

  let buttonLabel;
  let buttonOnClick;
  let buttonDisabled;
  let statusText;

  if (phase === 'answering') {
    buttonLabel = isLastQuestion ? "End Game" : "Next Question →";
    buttonOnClick = onTriggerReveal;
    buttonDisabled = answeredCount < 1;
    statusText = `${answeredCount}/${total} answered`;
    if (!allAnswered && answeredCount > 0) statusText += " — waiting for the rest";
  } else if (phase === 'revealing') {
    buttonLabel = "Skip ahead";
    buttonOnClick = onSkipAhead;
    buttonDisabled = false;
    statusText = `${answeredCount}/${total} answered`;
  } else { // 'advancing'
    buttonLabel = isLastQuestion ? "Ending…" : "Advancing…";
    buttonOnClick = undefined;
    buttonDisabled = true;
    statusText = `${answeredCount}/${total} answered`;
  }

  return (
    <div style={{
      marginTop: 16,
      padding: "12px 14px",
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: 10,
    }}>
      <div style={{
        fontSize: 11, color: "var(--t3)", textAlign: "center", marginBottom: 10,
        letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        {statusText}
      </div>
      <button
        className="btn-3d"
        onClick={buttonOnClick}
        disabled={buttonDisabled}
        style={{ width: "100%" }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ─── LOCAL MULTIPLAYER SETUP ──────────────────────────────────────────────────

export { OnlineEntry, MultiplayerLobby };
