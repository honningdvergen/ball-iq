import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { APP_NAME } from '../lib/scoring.js';
import { useMultiplayerRoom } from '../useMultiplayerRoom.js';
import { supabase } from '../supabase.js';
import { useProfilePhotos } from '../lib/profilePhotos.js';
import { useAuth } from '../useAuth.jsx';
import { gameEverStarted } from '../lib/mpRoom.js';
import { useMpRetryStatus, mpCreateRoom, mpClaimRematch, mpJoinRoom, mpRevealQuestion, mpSetPlayerName, mpSetPlayerReady, mpStartNextRound } from '../multiplayerRpc.js';
import { Confetti, LETTERS, QUESTION_DURATION_MS, INVITE_BASE_URL, buildInviteUrl, haptic, playSound, pickMultiplayerQuestions, recordMpQuestionsSeen, readMpHistory, recordMpResult, getMpXP, topicMeta, TopicPickerSheet, setGuestDisplayName, loopEvent} from '../App.jsx';
import { maybeRequestReview } from '../lib/review.js';
import { ProfilePic } from '../components/ProfilePic.jsx';

// ── Online multiplayer (Stage 1) — extracted from App.jsx and lazy-loaded so
// this ~1,700-line subtree stays out of the first-paint bundle. The logic is
// byte-for-byte unchanged from the inline version; only the module moved.

function OnlineEntry({ onBack, onLobbyEnter, defaultName, defaultAvatar, autoJoinCode, onAutoJoinConsumed, autoCreate, onAutoCreateConsumed }) {
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
      p_avatar: defaultAvatar || "",
    });
    if (result.error) {
      // Raw RPC text is console-only; the player gets an action they can take.
      console.warn('[handleCreate] createRoom', result.code || '', result.error);
      setError("Couldn't create the room — check your connection and try again.");
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
      p_avatar: defaultAvatar || "",
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
        console.warn('[handleJoin] joinRoom', result.code || '', result.error);
        setError("Couldn't join the room — check your connection and try again.");
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
            background: "rgba(88, 204, 2, 0.1)",
            border: "1px solid rgba(88, 204, 2, 0.3)",
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
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
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
function MultiplayerLobby({ code, onExit, defaultName, defaultAvatar, onRematch, onReport, onPlayDaily }) {
  const { room, players, myPlayer, isHost, loading, error, errorKind, channelStatus, actions } = useMultiplayerRoom(code);
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
    // Nothing was played, so there is nothing to record, pay or persist. This
    // guard covers all three at once: the head-to-head W/L row, the XP award
    // and the scores insert the listener does. Without it an abandoned lobby
    // minted 50 XP and a phantom win, repeatably.
    if (!gameEverStarted(room, players)) return;
    endedRecordedRef.current = true;
    try {
      const gameMode = room.mode || "race";
      // Rank by the same metric the game-over screen uses per mode: survival →
      // latest elimination (alive beats everyone), race → points. Strict
      // comparison: ties are NOT wins (the old `>=` recorded a draw as a W on
      // both devices and inflated the Online tab).
      const metric = (p) => gameMode === "survival"
        ? (p.eliminated_at_q == null ? Number.MAX_SAFE_INTEGER : p.eliminated_at_q)
        : (p.score || 0);
      const rows = players.map(p => ({ id: p.user_id, name: p.name, avatar: p.avatar || "", score: p.score || 0, m: metric(p) }));
      const mine = rows.find(r => r.id === myPlayer.user_id);
      const opps = rows.filter(r => r.id !== myPlayer.user_id);
      const iWon = !!mine && opps.length > 0 && mine.m > Math.max(...opps.map(o => o.m));
      recordMpResult({
        roomId: room.id,
        at: Date.now(),
        mode: gameMode,
        won: iWon,
        myScore: mine ? mine.score : 0,
        myMetric: mine ? mine.m : 0,
        opponents: opps,
      });
      // Pay the XP from HERE rather than from the game-over screen, because
      // this effect is already the once-per-room gate: ref-latched against
      // realtime 'ended' echoes, and recordMpResult dedupes by roomId behind
      // it. The results screen re-renders and can be revisited; this cannot.
      window.dispatchEvent(new CustomEvent('biq:mp-completed', {
        detail: {
          won: iWon,
          score: mine ? mine.score : 0,
          mode: gameMode,
          // For the scores row the listener writes. Only what is actually
          // known: points and how many questions the room ran. Per-player
          // correct counts don't exist in room_players — null is honest,
          // a fabricated 0 would look like data.
          total: Array.isArray(room.questions) ? room.questions.length : null,
        },
      }));
    } catch {}
  }, [room, players, myPlayer]);

  /* ── THE LOBBY HAD NO INSTRUMENT AT ALL ────────────────────────────────
     Read 2026-09-04, 7 days of game_rooms: 68 rooms, 41 started, 27 not.
     Every one of the 27 is state='ended', so none is a room still sitting
     there waiting — they were left. Thirteen hold ZERO room_players rows,
     and create_room inserts the host's row in the same transaction, so
     those are hosts who opened a lobby and left before anyone arrived:
     48% of the failures and the biggest shape in this funnel.

     What the rows CANNOT say is why — did they try to invite someone and
     get no answer, or never find the invite control? Nothing here fired a
     single event (the only loopEvents in this file are the rival prompt's),
     so the question had no answer at all. Three events, one per decision
     point. Deliberately no per-question chatter: this is about the doorway.

     ⚠️ And "27 lobbies fail" is not what the rest were either: 4 are a Host
     Bot harness pair and 3 are one guest opening rooms in 11 minutes.
     Genuine two-player rooms that never started, in a week: four. */
  const lobbyEnteredRef = useRef(0);
  const invitedRef = useRef(false);
  const lobbyOpenSentRef = useRef(false);
  useEffect(() => {
    if (!room || room.state !== 'lobby' || lobbyOpenSentRef.current) return;
    lobbyOpenSentRef.current = true;
    lobbyEnteredRef.current = Date.now();
    loopEvent('mp-lobby-open', { host: !!isHost, mode: room.mode || 'race' });
  }, [room, isHost]);

  const handleLeave = useCallback(async () => {
    // Fire BEFORE leave(): leave_room ends the room and drops our row, and
    // onExit unmounts this component — after that there is nothing left to
    // describe. `secs` separates "opened it to look" from "waited and gave
    // up", which is the whole question about the thirteen.
    try {
      if (room?.state === 'lobby') {
        loopEvent('mp-lobby-left', {
          host: !!isHost,
          players: Array.isArray(players) ? players.length : null,
          invited: invitedRef.current,
          secs: lobbyEnteredRef.current ? Math.round((Date.now() - lobbyEnteredRef.current) / 1000) : null,
        });
      }
    } catch {}
    try { await actions.leave(); } catch {}
    onExit();
  }, [actions, onExit, room, isHost, players]);

  const handleCopy = useCallback(async () => {
    // Copying the six-letter code is the other way to invite someone, so it
    // counts the same as the share sheet — otherwise a host who read the code
    // out to a friend in the room would be filed under "never tried".
    invitedRef.current = true;
    try { loopEvent('mp-invite-shared', { via: 'code' }); } catch {}
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
    // Pass our own display name so the link unfurls as "<name> wants to play
    // you" (api/join.js -> api/og.js ?t=invite) rather than the generic app
    // card the recipient used to see. Presentation only — the join still keys
    // off the code, so an absent name just falls back to "A mate".
    const url = buildInviteUrl(code, myPlayer?.name);
    const text = `⚽ Play me at ${APP_NAME}! Tap to join:`;
    // Recorded on the TAP, not on a completed share: a sheet that is opened
    // and cancelled still means they found the control and meant to invite
    // someone, which is exactly the half of "why did this lobby die" that
    // the room rows cannot show.
    invitedRef.current = true;
    try {
      loopEvent('mp-invite-shared', {
        via: Capacitor.isNativePlatform?.() ? 'native'
          : (typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'web-share' : 'clipboard'),
      });
    } catch {}
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
      if (err && (err.name === 'AbortError' || /cancel/i.test(err?.message || ''))) return; // user cancelled — silent
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopyToast("Invite copied — paste it to a friend");
      setTimeout(() => setCopyToast(""), 2200);
    } catch {
      setCopyToast("Couldn't share — copy the code instead");
      setTimeout(() => setCopyToast(""), 2200);
    }
  }, [code, myPlayer?.name]);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setStartError("");
    const survival = mode === "survival";
    const questionCount = survival ? 15 : mode === "sprint" ? 5 : 10;
    let questions;
    try {
      const picked = await pickMultiplayerQuestions(questionCount, pack, { escalate: survival });
      questions = picked.questions;
      // Thin-pool fallback is no longer silent: tell the host the topic
      // couldn't fill the game so the lobby card and reality agree.
      if (pack !== "mixed" && picked.effectivePack === "mixed") {
        try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: "Not enough questions in that topic yet — playing Mixed" })); } catch {}
      }
    } catch (e) {
      console.warn('[handleStart]', e?.message || e);
      setStartError("Couldn't load questions — check your connection");
      setStarting(false);
      return;
    }
    const result = await actions.startGame(questions, players.length);
    if (result.error) {
      // result.error is raw plpgsql text ("room is not in lobby (state=playing)")
      // — useful in the console, meaningless to a player. Never render it.
      console.warn('[handleStart] startGame', result.code || '', result.error);
      setStartError("Couldn't start the game — tap Start again.");
      setStarting(false);
      return;
    }
    if (result.started === false) {
      if (result.reason === "roster_changed") {
        setStartError(`Roster changed — now ${result.current_count} players. Tap Start again.`);
      } else {
        console.warn('[handleStart] not started', result.reason);
        setStartError("Couldn't start the game — tap Start again.");
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
  if (error) return <LobbyError error={error} kind={errorKind} onExit={onExit} onRetry={actions.retry} onPlayDaily={onPlayDaily} />;
  if (loading || !room) return <LobbyLoading />;
  if (room.state === "ended") return <LobbyEnded players={players} myPlayer={myPlayer} onExit={onExit} room={room} onRematch={onRematch} onReport={onReport} defaultAvatar={defaultAvatar} onPlayDaily={onPlayDaily} />;
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
      onPlayDaily={onPlayDaily}
    />
  );
}

// topicMeta + TopicPickerSheet moved to App.jsx (shared with LocalSetup).

function LobbyView({ room, players, isHost, isMe, onCopy, onShareInvite, onStart, onLeave, starting, startError, copyToast, showReconnecting, mode, setMode, pack, setPack, scoringMode, onSetScoringMode, onPlayDaily }) {
  const photos = useProfilePhotos(useMemo(() => (players || []).map(p => p.user_id), [players]));
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
  // v1.6 guest entry — anonymous players join under a generated name
  // ("Turbo Poacher 87") and can fix it while the room is still in the
  // lobby (set_player_name is lobby-only by design; renaming mid-game
  // would desync the scoreboard). The room_players UPDATE broadcasts via
  // realtime, so everyone's list refreshes without extra plumbing.
  const { isAnonUser } = useAuth();
  const myRow = players.find(p => isMe(p));
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const saveName = useCallback(async () => {
    const v = nameDraft.trim();
    if (savingName) return;
    if (v.length < 1 || v.length > 20) { setNameError("1–20 characters"); return; }
    setSavingName(true);
    setNameError("");
    const result = await mpSetPlayerName({ p_code: room?.code, p_name: v });
    setSavingName(false);
    if (!result.ok) {
      console.warn('[saveName] setPlayerName', result.code || '', result.error);
      setNameError(result.code === "23514" ? "That name isn't allowed" : "Couldn't save — try again");
      return;
    }
    setGuestDisplayName(v); // same name next room
    setEditingName(false);
  }, [nameDraft, savingName, room?.code]);
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
        {/* ⚠️ THE MEASURED DEAD END. Of 26 guests who arrived on an invite link
            in the 30 days to 2026-09-01, 18 successfully joined a room and only
            THREE ever played a multiplayer game — and 21 of the 26 never played
            anything at all, not the match, not Footle, not a Daily 7. This
            banner is where a good number of them stopped: an invited stranger
            reaches a closed room and is offered one action, "Leave", which
            returns them to a Home screen they have no reason to trust yet.
            They came to play a football game with a friend and the product's
            entire answer was an apology.
            So the closed room now offers today's puzzle instead of only an
            exit — the same daily-door pattern already proven on every other
            finish screen. Rendered only when the room is genuinely closed, so
            it never competes with a live lobby's Start button. */}
        {/* ⚠️ THIS USED TO REQUIRE !hostStillPresent AND NEVER FIRED. A host who
            LEAVES politely triggers leave_room, which sets state='ended' and
            unmounts LobbyView entirely — so the condition could not be true
            while this rendered. And the realistic abandonment, a host closing
            their tab, leaves their room_players row behind, so hostStillPresent
            stays TRUE: measured 70s after a hard close, the joiner's lobby
            still read "PLAYERS 2/8 · HOST". The rescue was unreachable from
            both directions.
            A guest with nothing to do is the same dead end whether the host is
            there or not — they cannot press Start either way — so it now shows
            for any non-host, and only the wording changes. */}
        {!isHost && onPlayDaily && (
          <button
            onClick={onPlayDaily}
            style={{ width: '100%', marginBottom: 16, padding: 14, borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(88,204,2,0.5)', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
          >
            {hostStillPresent ? 'Waiting? Play today\u2019s Daily 7 \u2192' : 'Play today\u2019s Daily 7 instead \u2192'}
          </button>
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
          {/* Alex, device test 2026-08-29: the tap-to-copy was invisible —
              "it does not say tap to copy or anything which it probably
              should". An affordance nobody can see is half a feature. */}
          <div aria-hidden="true" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--t3)", marginTop: 2 }}>
            tap to copy
          </div>
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
            <div className="ds-eyebrow">Players</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: players.length >= 2 ? "var(--accent)" : "var(--t3)", fontVariantNumeric: "tabular-nums" }}>{players.length} / {room.capacity}</div>
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
                  <div style={{ width: 30, height: 30, flexShrink: 0 }}><ProfilePic value={p.avatar} url={photos[p.user_id]} name={p.name} /></div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                    {p.name}
                    {isMe(p) && <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500, marginLeft: 6 }}>(you)</span>}
                    {p.user_id === room.host_id && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: "var(--accent)", background: "rgba(88,204,2,0.12)", border: "1px solid rgba(88,204,2,0.3)", borderRadius: 999, padding: "2px 8px", marginLeft: 8, verticalAlign: "middle" }} aria-label="Host">HOST</span>}
                  </div>
                </div>
              ))}
              {/* Facelift 2026-08-29 (Alex: "give the lobby a facelift, make
                  it more modern looking"): an open seat is the lobby's whole
                  job — render ONE as a dashed ghost row that shares the
                  invite, instead of leaving the capacity implicit. */}
              {players.length < room.capacity && (
                <button
                  type="button"
                  onClick={onShareInvite}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "1.5px dashed var(--border2)", borderRadius: 12, padding: "10px 14px", width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                >
                  <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px dashed var(--border2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--t3)", fontSize: 16, flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--t3)" }}>
                    Open seat — invite a friend
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* v1.6 guest entry — rename row, anonymous players only (signed-in
            players already own their username via Profile). */}
        {isAnonUser && myRow && (
          <div style={{ marginBottom: 14 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={20}
                    autoFocus
                    onChange={(e) => { setNameDraft(e.target.value); setNameError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                    aria-label="Your display name"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--s1)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}
                  />
                  {nameError && <div role="alert" style={{ fontSize: 11.5, color: "var(--red)", marginTop: 4 }}>{nameError}</div>}
                </div>
                <button
                  onClick={saveName}
                  disabled={savingName}
                  style={{ padding: "10px 14px", borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", background: "var(--accent)", color: "#0a1a00", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer", WebkitTextFillColor: "#0a1a00", opacity: savingName ? 0.6 : 1 }}
                >
                  {savingName ? "…" : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNameDraft(myRow.name || ""); setNameError(""); setEditingName(true); }}
                style={{ background: "none", border: "none", padding: "4px 0", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--t2)", cursor: "pointer" }}
              >
                ✏️ Playing as <span style={{ color: "var(--text)" }}>{myRow.name}</span> — tap to change
              </button>
            )}
          </div>
        )}

        {/* Scoring mode — shown to EVERYONE (room.mode broadcasts) so joiners
            know what they're playing before the host hits Start. */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "7px 14px", borderRadius: 999, background: "var(--s1)", border: "1px solid var(--border)", fontSize: 12.5, fontWeight: 700, color: "var(--t2)" }}>
            {activeMode === "survival"
              ? "💀 Survival — one wrong answer and you're out"
              : "🏁 Race — fastest correct answers win"}
          </span>
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
                <button onClick={() => setTopicOpen(true)} disabled={starting} style={{border:"none",borderRadius:999,padding:"9px 16px",fontSize:13,fontWeight:800,color:"#06230C",background:"var(--accent)",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Change</button>
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

function LobbyError({ error, kind, onExit, onRetry, onPlayDaily }) {
  // Sprint #92 GGG1-#2: previously this screen was a dead end — "Back to Home"
  // discarded the joiner's intent + the user had to navigate back through
  // OnlineEntry to reattempt. Adds an explicit Retry that re-runs the initial
  // fetch in-place. Retry is the primary action (green); Back is the secondary
  // escape hatch. Common case (flaky network) resolves on tap.
  //
  // ⚠️ 2026-09-04: THAT WAS ONE FAILURE WEARING TWO FACES. A room that has
  // ended is gone — the initial select filters state='ended' — so a guest who
  // taps an invite after the host left got "⚠️ Couldn't load room" and a Try
  // again that can never succeed. Measured the same day: 13 rooms in a week
  // were opened by a host who left before anyone arrived, and 12 of the 33
  // anonymous guests who never played anything had joined a room that never
  // started. An invite outliving its room is the normal case.
  //
  // So the 'gone' branch is not an error screen at all. It says what happened
  // in plain words, drops the retry, and offers the one thing this person can
  // still do — the same decision LobbyEnded already made for the guest who
  // was IN the room when it died. The wave, not the warning triangle: nothing
  // here is their fault.
  const gone = kind === 'gone';
  const retryable = !!onRetry && !gone;
  useEffect(() => {
    if (!gone) return;
    // How often an invite outlives its room, and whether the door gets used.
    try { loopEvent('mp-join-dead', { hadDoor: !!onPlayDaily }); } catch {}
  }, [gone, onPlayDaily]);
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onExit} aria-label="Back">←</button>
        <div className="page-title">Lobby</div>
      </div>
      <div style={{ padding: "40px 20px", textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{gone ? "\u{1F44B}" : "⚠️"}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          {gone ? "That room has closed" : "Couldn't load room"}
        </div>
        <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 20, lineHeight: 1.5 }}>
          {gone
            ? "Whoever set it up ended it before you arrived. Ask them for a fresh link \u2014 or play today\u2019s puzzle while you\u2019re here."
            : (error || "Room not found or no longer active")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {gone && onPlayDaily && (
            <button className="btn-3d" onClick={onPlayDaily} style={{ padding: "12px 24px", minWidth: 180 }}>
              Play today&rsquo;s Daily 7 &rarr;
            </button>
          )}
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

// Scoreboard count-up for the Game Over reveal — numbers tick 0→final like a
// broadcast full-time graphic. Lands instantly for reduced-motion users.
function useCountUp(target, { duration = 850, delay = 400 } = {}) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const [val, setVal] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) { setVal(target); return; }
    let raf;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      if (now < t0) { raf = requestAnimationFrame(tick); return; }
      const p = Math.min(1, (now - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, delay, duration]);
  return val;
}

/* ── Add-friend offer on the Game Over screen ──────────────────────────────
   MEASURED 2026-08-21: 15 distinct opponent PAIRS played each other in the
   last 7 days and ZERO of them are friends or have a request pending. The
   friend graph had exactly one on-ramp — searching a username you already
   know — while the one moment two people demonstrably want to play each
   other again offered Rematch, Share and Back to Home. Fifteen warm
   introductions a week, discarded.

   Deliberately quiet: it renders nothing at all unless there is somebody
   real to offer. Guests are sent to the upgrade prompt instead of a dead
   button, since an anonymous account cannot hold a friend graph worth
   having. Existing friends and already-pending requests are filtered out
   BEFORE paint, so nobody is ever offered a button that will fail. */

function AddFriendRow({ players, myUserId, isAnonUser, openAuthPrompt }) {
  const opponents = useMemo(
    () => (players || []).filter(p => p.user_id && p.user_id !== myUserId),
    [players, myUserId],
  );
  const [offerable, setOfferable] = useState([]);
  const [sent, setSent] = useState(() => new Set());
  const [busy, setBusy] = useState(() => new Set());
  // ⚠️ THE RELATIONSHIP ALREADY EXISTS; THE DATABASE DOES NOT KNOW.
  // Measured in prod 2026-08-26: 36 distinct pairings, 32 of them played each
  // other AGAIN, 18 are five games deep, one pair has played FORTY times — and
  // the friendships table holds four rows in total. Not four pending, four
  // rows: almost nobody has ever sent a request.
  //
  // This row was the affordance, and it was a generic "Add friend" under the
  // heading "Good game — keep playing them" — a stranger's button. It says
  // nothing about the forty games. Leading with the head-to-head turns an
  // administrative ask into a statement of something the player already knows
  // is true, at the one moment they care about it.
  const [h2h, setH2h] = useState({});

  useEffect(() => {
    let alive = true;
    if (!myUserId || isAnonUser || opponents.length === 0) { setOfferable([]); return () => {}; }
    (async () => {
      const ids = opponents.map(o => o.user_id);
      try {
        // Any row in either direction disqualifies: accepted, pending, even
        // declined — re-offering a declined request is worse than silence.
        const { data, error } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`and(requester_id.eq.${myUserId},addressee_id.in.(${ids.join(',')})),and(addressee_id.eq.${myUserId},requester_id.in.(${ids.join(',')}))`);
        if (error) throw error;
        const known = new Set();
        for (const r of data || []) { known.add(r.requester_id); known.add(r.addressee_id); }
        const remaining = opponents.filter(o => !known.has(o.user_id));
        if (alive) setOfferable(remaining);
        // How many times have we actually played each of them? Rooms I was in,
        // intersected with rooms they were in. Cheap, and it is the whole point.
        if (remaining.length && myUserId) {
          try {
            const { data: mine } = await supabase
              .from('room_players').select('room_id').eq('user_id', myUserId);
            const myRooms = (mine || []).map(r => r.room_id);
            if (myRooms.length) {
              const { data: theirs } = await supabase
                .from('room_players')
                .select('user_id, room_id')
                .in('user_id', remaining.map(o => o.user_id))
                .in('room_id', myRooms);
              const counts = {};
              for (const r of theirs || []) counts[r.user_id] = (counts[r.user_id] || 0) + 1;
              if (alive) setH2h(counts);
            }
          } catch { /* the prompt still works without a number */ }
        }
      } catch (e) {
        // Never block the results screen on this. A failed lookup means we
        // simply do not offer, rather than offering a button that may 409.
        Sentry.addBreadcrumb({ category: 'friends', message: 'mp add-friend precheck failed', level: 'warning' });
        if (alive) setOfferable([]);
      }
    })();
    return () => { alive = false; };
  }, [myUserId, isAnonUser, opponents]);

  // ⚠️ ABOVE THE EARLY RETURNS. This component returns null three times
  // (no user, no opponents, nothing offerable); a hook below any of them
  // changes hook order between renders and React throws.
  // ⚠️ MEASURE THE ASK, NOT JUST THE OUTCOME. Four friendships exist and we do
  // not know whether that is because the prompt is never seen, never tapped, or
  // tapped and failing. Three separate events, so the next read distinguishes
  // them instead of guessing again.
  useEffect(() => {
    if (!offerable.length) return;
    const rivals = offerable.filter(o => (h2h[o.user_id] || 0) >= 2).length;
    loopEvent('rival-prompt-shown', { offerable: offerable.length, rivals });
  }, [offerable, h2h]);

  const send = useCallback(async (p) => {
    if (busy.has(p.user_id) || sent.has(p.user_id)) return;
    loopEvent('rival-add-tapped', { h2h: h2h[p.user_id] || 0 });
    setBusy(prev => new Set(prev).add(p.user_id));
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: myUserId, addressee_id: p.user_id });
      if (error) throw error;
      haptic('correct');
      loopEvent('rival-add-sent', { h2h: h2h[p.user_id] || 0 });
      setSent(prev => new Set(prev).add(p.user_id));
    } catch (e) {
      // ⚠️ THE PLAYER USED TO BE TOLD NOTHING. The error reached Sentry and
      // stopped there: `sent` never updated, `busy` cleared, and the button
      // slid back to "Add friend" exactly as if it had never been tapped. Its
      // twin in ProfileScreen.sendRequest has always toasted "Couldn't send
      // request — try again"; this copy was written without it.
      //
      // That matters more here than anywhere else in the app. The MP game-over
      // screen is the highest-intent moment for adding a friend — you just
      // played them — and the friend loop is the measured weak link (k = 0.23,
      // 24% of signups arriving through room invites). A request that fails
      // invisibly at this exact moment is the worst place to lose one.
      haptic('wrong');
      loopEvent('rival-add-failed', { h2h: h2h[p.user_id] || 0 });
      try {
        window.dispatchEvent(new CustomEvent('biq:show-toast', {
          detail: "Couldn't send request — try again",
        }));
      } catch { /* toast host absent — Sentry still has it */ }
      Sentry.captureException(e, { tags: { area: 'friends', from: 'mp-gameover' } });
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(p.user_id); return n; });
    }
  }, [busy, sent, myUserId]);

  if (!myUserId || opponents.length === 0) return null;

  if (isAnonUser) {
    return (
      <button
        type="button"
        onClick={openAuthPrompt}
        style={{ width: '100%', marginTop: 14, padding: '12px 14px', borderRadius: 12,
                 background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--t2)',
                 fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
      >
        Save your account to add {opponents.length === 1 ? (opponents[0].name || 'them') : 'these players'} as a friend
      </button>
    );
  }

  if (offerable.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {/* Rivals first: the person you have played eleven times is a different
          proposition from someone you just met once, and the list should not
          bury them in arrival order. */}
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                    color: 'var(--t3)', marginBottom: 8 }}>
        {offerable.some(o => (h2h[o.user_id] || 0) >= 2) ? 'Your rivals' : 'Good game — keep playing them'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[...offerable].sort((a, b) => (h2h[b.user_id] || 0) - (h2h[a.user_id] || 0)).map(p => {
          const done = sent.has(p.user_id);
          const played = h2h[p.user_id] || 0;
          const rival = played >= 2;
          return (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                   padding: rival ? '12px 12px' : '10px 12px', borderRadius: 11,
                   background: rival ? 'rgba(88,204,2,0.07)' : 'var(--s2)',
                   border: `1px solid ${rival ? 'rgba(88,204,2,0.32)' : 'var(--border)'}` }}>
              <span style={{ width: rival ? 32 : 26, height: rival ? 32 : 26, flexShrink: 0 }}><ProfilePic value={p.avatar} name={p.name} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name || 'Player'}
                </span>
                {rival && (
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginTop: 1 }}>
                    You&apos;ve played {played} times
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => send(p)}
                disabled={done || busy.has(p.user_id)}
                aria-label={done ? `Friend request sent to ${p.name || 'player'}` : `Add ${p.name || 'player'} as a friend`}
                style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none',
                         background: done ? 'var(--s3)' : 'var(--accent)',
                         color: done ? 'var(--t2)' : '#06230C',
                         fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                         cursor: done ? 'default' : 'pointer' }}
              >
                {done ? 'Request sent' : busy.has(p.user_id) ? '…' : 'Add friend'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LobbyEnded({ players, myPlayer, onExit, room, onRematch, onReport, defaultAvatar, onPlayDaily }) {
  const photos = useProfilePhotos(useMemo(() => (players || []).map(p => p.user_id), [players]));
  // v1.6 guest entry — upgrade CTA in the actions column below.
  const { isAnonUser, openAuthPrompt } = useAuth();
  const isSurvival = room?.mode === 'survival';
  // Survival ranks by who lasted longest (alive > later elimination); Race
  // ranks by points. All fall back to joined_at asc so ties stay stable
  // (earliest joiner wins).
  const sorted = (players || []).slice().sort((a, b) => {
    if (isSurvival) {
      const ae = a.eliminated_at_q == null ? Infinity : a.eliminated_at_q;
      const be = b.eliminated_at_q == null ? Infinity : b.eliminated_at_q;
      if (ae !== be) return be - ae;
    }
    if (b.score !== a.score) return b.score - a.score;
    const ta = a.joined_at || '';
    const tb = b.joined_at || '';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });

  // See gameEverStarted: 'ended' does NOT imply a match happened. When it
  // didn't, this screen must congratulate nobody — no trophy, no confetti, no
  // XP line, no share — and offer the one thing the visitor can actually do.
  const gamePlayed = gameEverStarted(room, players);
  const myUserId = myPlayer?.user_id || null;
  const myRank = myUserId ? sorted.findIndex(p => p.user_id === myUserId) + 1 : 0;
  const winner = sorted[0];
  const isWinner = !!myUserId && !!winner && winner.user_id === myUserId;
  const [reportedQs, setReportedQs] = useState(() => new Set());
  // Review collapsed by default — the rematch board owns the screen.
  const [reviewOpen, setReviewOpen] = useState(false);
  // Joiners usually have NO room.questions: their initial room select ran
  // before start_game wrote them, and realtime UPDATE payloads omit
  // unchanged TOASTed columns — so the review section silently never
  // rendered for the non-host side (found on the 2026-08-29 web e2e; the
  // host device always had it, which is why nobody noticed). One refetch
  // when the ended screen mounts closes the gap.
  const [fetchedQuestions, setFetchedQuestions] = useState(null);
  useEffect(() => {
    if (Array.isArray(room?.questions) && room.questions.length > 0) return;
    if (!room?.code) return;
    let dead = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('game_rooms').select('questions').eq('code', room.code).limit(1);
        if (error) return;
        if (!dead && Array.isArray(data?.[0]?.questions) && data[0].questions.length > 0) setFetchedQuestions(data[0].questions);
      } catch { /* review is optional — fail to absent, not to broken */ }
    })();
    return () => { dead = true; };
  }, [room?.code]);
  const reviewQuestions = (Array.isArray(room?.questions) && room.questions.length > 0)
    ? room.questions
    : (fetchedQuestions || []);
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
    if (gamePlayed && isWinner && !survivalDraw && (players?.length || 0) >= 2) {
      reviewAskedRef.current = true;
      const t = setTimeout(() => { maybeRequestReview(); }, 3500);
      return () => clearTimeout(t);
    }
  }, [gamePlayed, isWinner, survivalDraw, players]);

  // The winner's sensory beat: confetti already falls (below), but the screen
  // was silent to the hand and ear while every SOLO win pulses + chords —
  // beating a real human deserves at least what beating the question bank
  // gets. Once per game-over via the same ref pattern as the review ask;
  // playSound self-gates on the sound setting.
  const winBeatRef = useRef(false);
  useEffect(() => {
    if (winBeatRef.current) return;
    if (gamePlayed && isWinner && !survivalDraw) {
      winBeatRef.current = true;
      haptic("hardCorrect");
      try { playSound("daily_complete"); } catch { /* audio unavailable */ }
    }
  }, [gamePlayed, isWinner, survivalDraw]);

  // ── STAY IN THE ROOM AND READY UP ─────────────────────────────────────────
  //
  // ⚠️ THE LOOP USED TO END HERE. Measured 2026-08-24: 136 rooms in prod, every
  // one 'ended', rematch_code null on all of them — not one rematch had ever
  // completed, across 90 rooms that had 2+ real players in ten days. Rematch
  // minted a NEW room and stood you in it alone while everyone else was left to
  // follow a push notification. Now nobody moves: the same room resets.
  //
  // No local ready state. `players` comes from useMultiplayerRoom, which
  // already subscribes to postgres_changes on room_players with select('*'),
  // so `ready` arrives live for free and the board is the same truth for
  // everyone. Mirroring it into component state would give each device its own
  // slightly-wrong copy — the class of bug that made two players tap Rematch
  // and land in rival rooms.
  const iAmReady = !!myPlayer?.ready;
  const readyCount = (players || []).filter(p => p.ready).length;
  const totalHere = (players || []).length;
  const hostPresent = (players || []).some(p => p.user_id === room?.host_id);
  const iAmHost = !!myPlayer?.user_id && myPlayer.user_id === room?.host_id;
  // Matches start_next_round's escape hatch: if the host closed the app, the
  // room must not be stuck forever, so anyone left can start it.
  const iCanStart = iAmHost || !hostPresent;
  const [readyBusy, setReadyBusy] = useState(false);
  const [nextBusy, setNextBusy] = useState(false);
  const [nextError, setNextError] = useState("");

  const toggleReady = async () => {
    if (readyBusy) return;
    setReadyBusy(true);
    setNextError("");
    haptic("soft");
    // try/finally, not politeness: a throw between the busy-set and the
    // busy-clear wedges the button into a silent no-op forever — exactly
    // how the missing retry-config entry presented on device (2026-08-29).
    try {
      const res = await mpSetPlayerReady({ p_code: room?.code, p_ready: !iAmReady });
      if (res?.error) {
        console.warn('[toggleReady]', res.error);
        setNextError("Couldn't update — check your connection.");
      }
    } catch (e) {
      console.warn('[toggleReady]', e);
      setNextError("Couldn't update — check your connection.");
    } finally {
      setReadyBusy(false);
    }
  };

  const startNextRound = async () => {
    if (nextBusy) return;
    setNextBusy(true);
    setNextError("");
    // Same shape the first start uses. The topic pack is NOT stored on the room
    // (game_rooms has no pack column), so a second round is Mixed — worth
    // persisting the pack later, but silently replaying a topic we cannot prove
    // was chosen would be worse than an honest Mixed.
    const survival = room?.mode === 'survival';
    let questions;
    try {
      const picked = await pickMultiplayerQuestions(survival ? 15 : 10, "mixed", { escalate: survival });
      questions = picked.questions;
    } catch (e) {
      console.warn('[startNextRound] questions', e?.message || e);
      setNextError("Couldn't load questions — check your connection.");
      setNextBusy(false);
      return;
    }
    let res;
    try {
      res = await mpStartNextRound({ p_code: room?.code, p_questions: questions });
    } catch (e) {
      console.warn('[startNextRound]', e);
      setNextError("Couldn't start the next round — try again.");
      setNextBusy(false);
      return;
    }
    if (res?.started) {
      // No navigation here on purpose: the room flips to 'playing' and the
      // game_rooms subscription moves EVERY device, including this one, down
      // the same path the first start uses. Pushing this client ahead manually
      // is how you get one player a question in front of the others.
      haptic("hardCorrect");
      setNextBusy(false);
      return;
    }
    // ⚠️ Render the REASON. "Waiting for one more player" and "only the host can
    // start" are different problems, and a generic failure sends the player
    // tapping the same dead button.
    const why = {
      need_two_ready:   "Need two players ready to go again.",
      starter_not_ready:"Tap Ready first.",
      not_host:         "Only the host can start the next round.",
      not_ended:        "That round is still going.",
    }[res?.reason];
    console.warn('[startNextRound]', res?.reason || res?.error || 'unknown');
    setNextError(why || "Couldn't start the next round — try again.");
    setNextBusy(false);
  };

  // Game Over is the emotional peak of the Online loop — it used to dead-end
  // at "Back to Home". Rematch spins up a fresh room (the parent swaps the
  // lobby to the new code; share the invite link from there) and Share sends
  // the result out while the adrenaline is still up.
  const [rematching, setRematching] = useState(false);
  const [rematchError, setRematchError] = useState("");
  const handleRematch = async () => {
    if (rematching) return;
    setRematching(true);
    setRematchError("");
    // ⚠️ NOT a create. Player-reported 2026-08-22: both players tapped Rematch
    // and each landed ALONE in a different room, because this used to call
    // create_room() unconditionally — A made a room and invited B while B made
    // a room and invited A. claim_rematch() makes the finished room the
    // rendezvous, so the second tapper JOINS the first one's room instead of
    // opening a rival lobby. Serialised server-side; simultaneous taps cannot
    // both create.
    const result = await mpClaimRematch({
      p_code: room?.code,
      p_name: myPlayer?.name || "Player",
      p_avatar: myPlayer?.avatar || defaultAvatar || "",
    });
    if (result?.error || !result?.code) {
      console.warn('[handleRematch] claimRematch', result?.code || '', result?.error);
      setRematchError("Couldn't set up the rematch — check your connection and try again.");
      setRematching(false);
      return;
    }
    // Only the player who actually CREATED the room invites the others. The
    // joiner must not re-invite, or the person who tapped first gets a
    // notification pulling them toward the room they are already standing in.
    const opponentIds = result.created
      ? players.map((p) => p.user_id).filter((id) => id && id !== myUserId)
      : [];
    onRematch?.(result.code, opponentIds);
  };
  const handleShareResult = async () => {
    if (rematching) return; // a rematch room is already being created via the other button
    const opp = sorted.find(p => p.user_id !== myUserId);
    const oppBit = opp?.name ? ` against ${opp.name}` : "";
    const text = survivalDraw
      ? `🤝 Dead level${oppBit} on ${APP_NAME} — settling it in the rematch. Join us!`
      : isWinner
      ? `🏆 Just won an online match${oppBit} on ${APP_NAME}! Think you can take me?`
      : `⚔️ Just went down${oppBit} on ${APP_NAME} — rematch incoming. Join us!`;
    // The copy promises a rematch but the link used to be the bare homepage —
    // an ended room isn't joinable, so spin up the rematch room FIRST (same
    // create as handleRematch) and share its canonical /join/CODE link.
    // Create failure, or no onRematch wired, falls back to the generic-URL
    // share — never block the share on the rematch.
    let url = INVITE_BASE_URL;
    let rematchCode = null;
    let rematchCreated = false;
    if (onRematch) {
      setRematching(true);
      // Same handshake as the Rematch button, and for the same reason: if the
      // opponent has already tapped Rematch, this must SHARE THEIR ROOM rather
      // than open a second one. Otherwise the share link advertises a lobby
      // the opponent is not in — the exact split that was reported, arriving
      // by a different button.
      const claimed = await mpClaimRematch({
        p_code: room?.code,
        p_name: myPlayer?.name || "Player",
        p_avatar: myPlayer?.avatar || defaultAvatar || "",
      });
      if (claimed?.code && !claimed?.error) {
        rematchCode = claimed.code;
        rematchCreated = !!claimed.created;
        url = buildInviteUrl(rematchCode, myPlayer?.name);
      } else {
        setRematching(false);
      }
    }
    // Land the sharer in the lobby they just advertised — even on a cancelled
    // sheet: the room exists and they're its host; stranding it leaves a
    // zombie room and a share link pointing at a lobby nobody is waiting in.
    // Same as handleRematch: whoever was in the match gets a play_invite, so
    // the share sheet is a bonus rather than the only way anyone finds out.
    const enterRematch = () => {
      if (!rematchCode) return;
      // Only invite if we are the one who opened the room. Joining someone
      // else's rematch and then "inviting" them pulls them toward a lobby they
      // are already sitting in.
      const opponentIds = rematchCreated
        ? players.map((p) => p.user_id).filter((id) => id && id !== myUserId)
        : [];
      onRematch?.(rematchCode, opponentIds);
    };
    try {
      if (Capacitor.isNativePlatform?.()) {
        await CapShare.share({ title: APP_NAME, text, url, dialogTitle: "Share result" });
        enterRematch();
        return;
      }
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: APP_NAME, text, url });
        enterRematch();
        return;
      }
    } catch (err) {
      if (err && (err.name === "AbortError" || /cancel/i.test(err?.message || ""))) { enterRematch(); return; }
    }
    try { await navigator.clipboard.writeText(`${text} ${url}`); } catch {}
    enterRematch();
  };

  // ⚠️ ONLY FROM THE ENDED SCREEN. Opening a card navigates away from Online,
  // which in a LOBBY or mid-question would pull the player out of a live room —
  // so this lives in LobbyEnded and nowhere else. Here room.state is already
  // "ended", so leaving costs nothing.
  //
  // The whole card already exists: FriendProfileScreen takes a friendId and
  // fetches the avatar, level, XP, stat grid, badges and Ball IQ ratings itself.
  // This is the wire, not a new screen. Guests carry no user_id and your own row
  // would just be your profile, so both are left inert rather than tappable.
  const openCard = (p) => {
    if (!p?.user_id || p.user_id === myUserId) return;
    haptic('soft');
    try {
      window.dispatchEvent(new CustomEvent('biq:open-friend', {
        detail: { id: p.user_id, username: p.name, avatar: p.avatar },
      }));
    } catch { /* host absent — the row simply does nothing */ }
  };
  const cardProps = (p) => {
    const can = !!p?.user_id && p.user_id !== myUserId;
    return can ? {
      onClick: () => openCard(p),
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(p); } },
      'aria-label': `View ${p.name || 'player'}'s profile`,
      style: { cursor: 'pointer' },
    } : {};
  };

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
    } else if (idx === 1 && !survivalDraw) {
      borderColor = 'rgba(148,163,184,0.4)'; // silver
      background = 'rgba(148,163,184,0.05)';
    } else if (idx === 2 && !survivalDraw) {
      borderColor = 'rgba(196,132,72,0.4)'; // bronze
      background = 'rgba(196,132,72,0.05)';
    }
    if (isMe && !isFirst) borderColor = 'rgba(88,204,2,0.45)'; // my row always reads green
    return {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: idx === 0 ? '15px 14px' : '12px 14px',
      background,
      border: '1px solid ' + borderColor,
      borderRadius: 12,
    };
  }

  // ── Head-to-head scoreboard: 1v1 is the overwhelmingly common Online case,
  //    and a plain ranked list read as flat/"dull". For exactly two players we
  //    render a big VS board (avatars + the mode metric + winner accent); 3+
  //    players keep the podium list below. All from existing player fields —
  //    no new data. ──
  const MONO = "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace";
  const twoPlayer = sorted.length === 2;
  const meP = myUserId ? sorted.find(p => p.user_id === myUserId) : sorted[0];
  const oppP = twoPlayer ? sorted.find(p => p !== meP) : null;
  const metricOf = (p) => isSurvival ? (p?.eliminated_at_q == null ? Infinity : p.eliminated_at_q) : (p?.score || 0);
  const metricText = (p) => isSurvival ? (p?.eliminated_at_q == null ? '❤️' : `Q${p.eliminated_at_q + 1}`) : `${p?.score ?? 0}`;
  const metricUnit = isSurvival ? 'survived' : 'points';
  const boardDraw = twoPlayer && (survivalDraw || metricOf(meP) === metricOf(oppP));
  const iWonBoard = twoPlayer && !boardDraw && metricOf(meP) > metricOf(oppP);

  // Count-up values (hooks stay unconditional; targets are 0 when the
  // corresponding board isn't rendered). Survival metrics are non-numeric
  // (❤️ / 💀 Qn) and render directly without a count.
  const meCount = useCountUp(!isSurvival && twoPlayer ? (meP?.score || 0) : 0, { delay: 700 });
  const oppCount = useCountUp(!isSurvival && twoPlayer ? (oppP?.score || 0) : 0, { delay: 700 });
  const showPodium = !twoPlayer && sorted.length >= 3 && !survivalDraw;
  const p1Count = useCountUp(!isSurvival && showPodium ? (sorted[0]?.score || 0) : 0, { delay: 950 });
  const p2Count = useCountUp(!isSurvival && showPodium ? (sorted[1]?.score || 0) : 0, { delay: 750 });
  const p3Count = useCountUp(!isSurvival && showPodium ? (sorted[2]?.score || 0) : 0, { delay: 550 });
  const podiumCounts = [p1Count, p2Count, p3Count];

  // Margin line ("You won by 3") — numeric modes only; survival margins mix
  // question indexes with the alive-Infinity sentinel, so it gets a phrase.
  const boardMargin = (() => {
    if (!twoPlayer || boardDraw) return null;
    if (isSurvival) {
      const w = iWonBoard ? meP : oppP;
      return w?.eliminated_at_q == null
        ? (iWonBoard ? 'You survived to the end' : `${oppP?.name || 'They'} survived to the end`)
        : (iWonBoard ? 'You lasted longer' : `${oppP?.name || 'They'} lasted longer`);
    }
    const diff = Math.abs(metricOf(meP) - metricOf(oppP));
    const unit = diff === 1 ? ' point' : ' points';
    return iWonBoard ? `You won by ${diff}${unit}` : `Beaten by ${diff}${unit}`;
  })();

  // Lifetime head-to-head vs this opponent, from the local biq_mp_history
  // ledger PLUS the game just played.
  //
  // ⚠️ THE CURRENT ROOM IS ADDED EXPLICITLY, NOT READ FROM THE LEDGER. The
  // previous version's comment claimed "this finished room is already
  // recorded by the parent's ended effect, so the chip includes it" — the
  // exact opposite is true. That effect runs AFTER render, and this memo's
  // deps never change once the screen is up, so it computed ONCE, before the
  // write, and stayed frozen there. Measured against prod (2026-08-03): Alex
  // and Johannes had played four games, Alex leading 3–1, and both devices
  // showed "3–0" — every prior game counted, the one just finished missing.
  // Reading live board state removes the race entirely.
  const h2h = useMemo(() => {
    if (!twoPlayer || !oppP?.user_id) return null;
    try {
      const prior = readMpHistory().filter(e =>
        e.roomId !== room?.id && (e.opponents || []).some(o => o.id === oppP.user_id));
      let w = 0, d = 0, l = 0;
      for (const g of prior) {
        const best = Math.max(...(g.opponents || []).map(o => o.m ?? 0));
        if (g.won) w++; else if ((g.myMetric ?? 0) === best) d++; else l++;
      }
      // The game on screen, from the board itself — same metric the result
      // uses, so the chip can never disagree with the scoreline above it.
      if (boardDraw) d++; else if (iWonBoard) w++; else l++;
      if (w + d + l < 2) return null; // first meeting — the board says it all
      const name = oppP.name || 'them';
      // Each branch names the opponent AT MOST once. The old code appended
      // "vs ${name}" to every branch, including the one that already opened
      // with it — which is why the losing device read "Alex leads 3–0 vs Alex".
      return {
        line: w > l ? `You lead ${w}–${l} vs ${name}`
          : l > w ? `${name} leads ${l}–${w}`
            : `All square at ${w}–${l} vs ${name}`,
        draws: d,
      };
    } catch { return null; }
  }, [twoPlayer, oppP?.user_id, oppP?.name, room?.id, iWonBoard, boardDraw]);
  const vsSide = (p, mine, won, display, cls) => (
    <div className={cls} style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '20px 10px', borderRadius: 16,
      background: won ? 'rgba(88,204,2,0.08)' : 'var(--s1)',
      border: `1.5px solid ${won ? 'rgba(88,204,2,0.5)' : 'var(--border)'}`,
      opacity: (!won && !boardDraw && !mine) ? 0.9 : 1,
    }}>
      <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto' }}>
        {/* Crown the 1v1 winner — the headline says "You won!", but the board
            itself should show WHO. Sits inside the card's 20px top padding. */}
        {won && (
          <span aria-hidden="true" style={{
            position: 'absolute', top: -17, left: '50%',
            transform: 'translateX(-50%) rotate(-12deg)', fontSize: 19,
            filter: 'drop-shadow(0 1px 5px rgba(234,179,8,0.55))',
          }}>👑</span>
        )}
        <span style={{
          width: 62, height: 62, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          background: 'var(--s2)',
          border: `2.5px solid ${won ? 'var(--accent)' : mine ? 'rgba(88,204,2,0.4)' : 'var(--border)'}`,
          boxShadow: won ? '0 0 0 5px rgba(88,204,2,0.12)' : 'none',
          overflow: 'hidden',
        }}><ProfilePic value={p?.avatar} name={p?.name} /></span>
      </span>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {mine ? 'You' : (p?.name || 'Player')}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, lineHeight: 1, color: won ? '#8AE042' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {display ?? metricText(p)}
      </span>
      <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{metricUnit}</span>
    </div>
  );

  return (
    <div className="screen">
      {/* Multiplayer winners deserve the same celebration solo wins get.
          (Not for a draw — nobody outlasted anybody.) */}
      {gamePlayed && isWinner && !survivalDraw && <Confetti />}
      <div className="page-hdr">
        <div className="page-title">Game over</div>
      </div>
      <div style={{ padding: '12px 4px', maxWidth: 480, margin: '0 auto' }}>
        {/* Headline — winner / your-result framing */}
        <div style={{ textAlign: 'center', padding: '8px 12px 20px' }}>
          <div className={'mp-go-emoji' + (gamePlayed && isWinner && !survivalDraw ? ' mp-go-winner' : '')} style={{ fontSize: 48, marginBottom: 8 }}>{!gamePlayed ? '\u{1F44B}' : survivalDraw ? '\u{1F91D}' : isWinner ? (survivalLastStanding ? '\u{1F3C5}' : '\u{1F3C6}') : '\u{1F44B}'}</div>
          <div className="mp-go-headline" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {!gamePlayed ? 'Your mate left before kick-off' : survivalDraw ? "It's a draw!" : winner ? (isWinner ? (survivalLastStanding ? 'You lasted longest!' : 'You won!') : `${winner.name || 'Player'} ${survivalLastStanding ? 'lasted longest' : 'wins'}`) : 'Game over'}
          </div>
          {!gamePlayed ? (
            <div className="mp-go-sub" style={{ fontSize: 13, color: 'var(--t2)' }}>
              The room closed before a question was asked — nothing was scored.
            </div>
          ) : survivalDraw ? (
            <div className="mp-go-sub" style={{ fontSize: 13, color: 'var(--t2)' }}>
              Everyone knocked out on Q{(winner.eliminated_at_q ?? 0) + 1}
            </div>
          ) : myRank > 0 && !isWinner && (
            <div className="mp-go-sub" style={{ fontSize: 13, color: 'var(--t2)' }}>
              You finished {rankBadge(myRank - 1)}{myRank >= 4 ? ' place' : ''}
            </div>
          )}
          {/* The progression payoff every other ending has and this one did
              not. Same "+N XP earned ⚡" line as the solo result screens, so a
              live win visibly counts toward the same level as everything else.
              Recomputed from getMpXP rather than passed down — the award itself
              fires from the once-per-room effect in MultiplayerLobby, and this
              must never be the thing that pays it. */}
          {gamePlayed && myPlayer && (
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
              +{getMpXP(isWinner && !survivalDraw, myPlayer.score || 0)} XP earned ⚡
            </div>
          )}
        </div>

        {/* Head-to-head VS board (1v1, the common case) or the ranked list (3+). */}
        {twoPlayer && meP && oppP && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
              {vsSide(meP, true, iWonBoard, isSurvival ? undefined : meCount, 'mp-go-left')}
              <div className="mp-go-vs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: 'var(--t3)' }}>VS</span>
              </div>
              {vsSide(oppP, false, !iWonBoard && !boardDraw, isSurvival ? undefined : oppCount, 'mp-go-right')}
            </div>
            {(boardMargin || h2h) && (
              <div className="mp-go-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 12 }}>
                {boardMargin && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{boardMargin}</div>
                )}
                {h2h && (
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--t2)',
                    padding: '5px 12px', borderRadius: 999,
                    background: 'var(--s1)', border: '1px solid var(--border)',
                  }}>
                    ⚔️ {h2h.line}{h2h.draws > 0 ? ` · ${h2h.draws} draw${h2h.draws === 1 ? '' : 's'}` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Final scores (3+ players): stepped podium for the top 3, list for the rest.
            Draws and tiny rooms keep the flat list — a podium implies separation. */}
        {!twoPlayer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: 'var(--t2)',
            letterSpacing: 0.4, textTransform: 'uppercase',
            marginBottom: 2, paddingLeft: 4,
          }}>
            {isSurvival ? 'Last standing' : 'Final scores'}
          </div>
          {isSurvival && !survivalDraw && (
            <div style={{ fontSize: 11, color: 'var(--t3)', paddingLeft: 4, marginBottom: 6 }}>
              Knocked out later = ranked higher
            </div>
          )}
          {showPodium && (
            <div className="mp-podium">
              {[1, 0, 2].map((rank) => {
                const p = sorted[rank];
                if (!p) return <div key={rank} className="mp-podium-col" />;
                const isMe = !!myUserId && p.user_id === myUserId;
                return (
                  <div key={`${p.room_id}:${p.user_id}`} {...cardProps(p)} className={`mp-podium-col mp-podium-${rank + 1}`}>
                    <div className="mp-podium-who">
                      <span style={{
                        width: 40, height: 40, borderRadius: '50%', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        background: 'var(--s2)', border: `2px solid ${rank === 0 ? 'rgba(234,179,8,0.55)' : isMe ? 'rgba(88,204,2,0.45)' : 'var(--border)'}`,
                        overflow: 'hidden',
                      }}><ProfilePic value={p.avatar} url={photos[p.user_id]} name={p.name} /></span>
                      <span style={{
                        fontSize: 12.5, fontWeight: 800, color: 'var(--text)', maxWidth: '100%',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{p.name || 'Player'}{isMe ? ' (you)' : ''}</span>
                      <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, lineHeight: 1, color: rank === 0 ? '#EAB308' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {isSurvival ? metricText(p) : podiumCounts[rank]}
                      </span>
                    </div>
                    <div className="mp-podium-block">{['🥇', '🥈', '🥉'][rank]}</div>
                  </div>
                );
              })}
            </div>
          )}
          {showPodium && sorted.length > 3 && (
            <div style={{
              fontSize: 11, color: 'var(--t3)',
              letterSpacing: 0.4, textTransform: 'uppercase',
              margin: '4px 0 2px', paddingLeft: 4,
            }}>
              The chasing pack
            </div>
          )}
          {(showPodium ? sorted.slice(3) : sorted).map((p, i) => {
            const idx = showPodium ? i + 3 : i;
            const isMe = !!myUserId && p.user_id === myUserId;
            return (
              <div key={`${p.room_id}:${p.user_id}`} {...cardProps(p)} style={{ ...rowStyle(p, idx), ...(cardProps(p).style || {}) }}>
                <div style={{
                  fontSize: idx < 3 ? 24 : 14,
                  fontWeight: 700,
                  width: 32, textAlign: 'center',
                  color: 'var(--text)',
                }}>
                  {rankBadge(idx)}
                </div>
                <div style={{ width: 28, height: 28, flexShrink: 0 }}><ProfilePic value={p.avatar} url={photos[p.user_id]} name={p.name} /></div>
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",
                    fontSize: 18, fontWeight: 800,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {isSurvival
                      ? (p.eliminated_at_q == null ? '❤️' : `💀 Q${p.eliminated_at_q + 1}`)
                      : (p.score ?? 0)}
                  </div>
                  {/* Secondary stat: survival ranks on its own metric, so
                      surface raw points as the tie-breaker context. */}
                  {isSurvival && (
                    <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, marginTop: 1 }}>
                      {(p.score ?? 0)} pts
                    </div>
                  )}
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
        )}

        {/* Sits ABOVE the action stack on purpose: Rematch and Back to Home
            are both exits, and an offer placed after them is an offer made
            to someone already leaving. */}
        <AddFriendRow
          players={players}
          myUserId={myUserId}
          isAnonUser={isAnonUser}
          openAuthPrompt={openAuthPrompt}
        />
        <div className="mp-go-actions">
          {/* v1.6 guest entry — the moment a guest most wants their stats to
              persist is right after seeing them. Upgrading keeps the same
              auth.uid(), so this game's score/XP carry into the account. */}
          {isAnonUser && (
            <button
              onClick={() => { try { openAuthPrompt?.('upgrade'); } catch {} }}
              style={{ width: '100%', marginBottom: 10, padding: 14, borderRadius: 999, background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              💾 Playing as a guest — save your stats with a free account
            </button>
          )}
          {/* ── PLAY AGAIN, WITHOUT ANYONE LEAVING ─────────────────────────
              The board is the point: you can see who is coming back before you
              commit. Previously this was a single Rematch button that moved you
              to a new empty room and left the others behind a notification. */}
          <div style={{ marginBottom: 12, padding: '12px 12px 10px', borderRadius: 14, background: 'var(--s1)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.2px' }}>Play again</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: readyCount >= 2 ? 'var(--accent)' : 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                {readyCount}/{totalHere} ready
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {(players || []).map(p => (
                <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 20, height: 20, flexShrink: 0 }}><ProfilePic value={p.avatar} url={photos[p.user_id]} name={p.name} /></span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: p.ready ? 'var(--t1)' : 'var(--t3)', fontWeight: p.ready ? 700 : 600 }}>
                    {p.name}{p.user_id === myPlayer?.user_id ? ' (you)' : ''}
                  </span>
                  {/* Glyph as well as colour — the same rule the quiz options
                      follow, so this reads for red-green colour blindness. */}
                  <span style={{ fontSize: 12, fontWeight: 800, color: p.ready ? 'var(--accent)' : 'var(--t3)' }}>
                    {p.ready ? '✓ ready' : 'waiting'}
                  </span>
                </div>
              ))}
            </div>
            <button
              className={iAmReady ? undefined : 'btn-3d'}
              onClick={toggleReady}
              disabled={readyBusy}
              aria-pressed={iAmReady}
              style={iAmReady
                ? { width: '100%', padding: 13, borderRadius: 999, background: 'transparent', border: '1.5px solid var(--accent)', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: 'pointer' }
                : { width: '100%', marginBottom: 0 }}
            >
              {iAmReady ? "✓ You're ready — tap to cancel" : "I'm ready"}
            </button>
            {iCanStart && readyCount >= 2 && (
              <button
                onClick={startNextRound}
                disabled={nextBusy || !iAmReady}
                style={{ width: '100%', marginTop: 8, padding: 13, borderRadius: 999, background: (readyCount >= 2 && iAmReady) ? 'var(--accent)' : 'var(--s2)', border: 'none', color: (readyCount >= 2 && iAmReady) ? '#06230C' : 'var(--t3)', boxShadow: (readyCount >= 2 && iAmReady) ? '0 8px 22px -8px rgba(88,204,2,0.55)' : 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: (readyCount >= 2 && iAmReady) ? 'pointer' : 'not-allowed' }}
              >
                {nextBusy ? 'Starting…'
                  : readyCount < totalHere ? `Start next round (${totalHere - readyCount} not ready)`
                  : 'Start next round'}
              </button>
            )}
            {!iCanStart && iAmReady && (
              <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 8 }}>
                Waiting for the host to start…
              </div>
            )}
            {/* ⚠️ Says so out loud. start_next_round DROPS players who are not
                ready, and finding that out by disappearing is not acceptable. */}
            {iCanStart && readyCount >= 2 && readyCount < totalHere && (
              <div style={{ fontSize: 11.5, color: 'var(--t3)', textAlign: 'center', marginTop: 6, lineHeight: 1.4 }}>
                Anyone not ready will sit this one out.
              </div>
            )}
            {nextError && (
              <div style={{ color: '#FF6B6B', fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>{nextError}</div>
            )}
          </div>
          {/* Fallback for a room somebody has actually left — mints a fresh room
              and pulls them back by notification. Demoted below the board: it is
              the answer to "they're gone", not to "let's go again". */}
          {onRematch && (
            <button
              onClick={handleRematch}
              disabled={rematching}
              style={{ width: '100%', marginBottom: 6, padding: '8px 12px', minHeight: 36, background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {rematching ? 'Setting up…' : 'Opponent gone? Start a new room'}
            </button>
          )}
          {rematchError && (
            <div style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{rematchError}</div>
          )}
          {/* Nothing happened, so there is no result. Offering "Share result"
              on a 0-0 abandoned lobby asks someone to broadcast their own
              disappointment under our name. */}
          {gamePlayed && (
          <button
            onClick={handleShareResult}
            style={{ width: '100%', marginBottom: 10, padding: 14, borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(88,204,2,0.5)', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
          >
            📣 Share result
          </button>
          )}
{/* ⚠️ THE ONLY ROUTE OUT OF MULTIPLAYER THAT IS NOT AN EXIT. Measured
              2026-08-31: of the 17 players whose FIRST game was multiplayer,
              76.5% never played a second day and ZERO reached 8 active days —
              the worst first-mode in the product — and exactly one of them ever
              played the Daily 7. A room needs a second person, so it cannot be
              a daily habit on its own; the daily games can. Offered only when
              the parent says a daily is still open, so it never points at
              something already done. */}
          {/* When no game happened this is the ONLY thing worth offering, so it
              becomes the solid primary rather than an outline also-ran — the
              screen's whole job is turning a dead room into a first play. */}
          {onPlayDaily && (
            <button
              onClick={onPlayDaily}
              style={gamePlayed
                ? { width: '100%', marginBottom: 10, padding: 14, borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(88,204,2,0.5)', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }
                : { width: '100%', marginBottom: 10, padding: 14, borderRadius: 14, background: 'var(--accent)', border: 'none', color: '#06230C', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
            >
              {gamePlayed ? 'Not done yet? Play today\u2019s Daily 7 \u2192' : 'Play today\u2019s Daily 7 \u2192'}
            </button>
          )}
          <button
            onClick={onExit}
            style={{ width: '100%', padding: '10px 12px', minHeight: 40, background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </div>
        {/* The round's questions, with a report on each — MOVED BELOW the
            action stack and collapsed (Alex, device test 2026-08-29: "all the
            10 questions are in the way… a shame we have to scroll down all
            this way to play again"). The rematch board is the screen's job;
            the review is reference material for whoever wants it. */}
        {reviewQuestions.length > 0 && onReport && (
          <div style={{ marginTop: 18, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setReviewOpen(o => !o)}
              aria-expanded={reviewOpen}
              style={{ width: '100%', padding: '10px 12px', minHeight: 40, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em' }}
            >
              {reviewOpen ? 'HIDE THE QUESTIONS ▴' : `REVIEW THIS ROUND'S ${reviewQuestions.length} QUESTIONS ▾`}
            </button>
            {reviewOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviewQuestions.map((q, i) => {
                  const rkey = q?.id != null ? String(q.id) : `idx:${i}`;
                  const done = reportedQs.has(rkey);
                  return (
                    <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--border)',
                                          borderRadius: 11, padding: '11px 13px' }}>
                      <div style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--t3)', fontWeight: 700 }}>{i + 1}. </span>{q?.prompt}
                      </div>
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => {
                          if (done) return;
                          onReport({ id: q?.id, q: q?.prompt, picked: null, correct: null,
                                     mode: `mp-${room?.mode || 'race'}` });
                          setReportedQs(prev => new Set(prev).add(rkey));
                        }}
                        style={{ marginTop: 8, padding: '6px 10px', minHeight: 34,
                                 background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                                 cursor: done ? 'default' : 'pointer',
                                 color: done ? 'var(--accent)' : 'var(--t3)',
                                 fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit',
                                 WebkitAppearance: 'none', appearance: 'none',
                                 WebkitTextFillColor: 'currentColor' }}>
                        {done ? '✓ Reported' : '⚑ This looks wrong'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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

  // Feed the round into the 14-day seen history so the next pick avoids it.
  // Runs for BOTH players, which is the whole point: hosting alternates over a
  // rematch, and a host-only record would leave the new host picking blind
  // against the round they just finished. Keyed on room.id so it fires once
  // per room rather than on every question advance.
  useEffect(() => {
    recordMpQuestionsSeen(room?.questions);
  }, [room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Hold the scoreboard still until the reveal. The server credits a correct
  // answer the moment it accepts it, so the strip used to tick upward WHILE
  // everyone was still answering — silently confirming you were right before
  // the correct answer appeared, and draining the reveal of its whole point.
  // Alex: "your points instantly go up after you answer correctly, should it
  // not wait until everyone has answered?" — yes.
  //
  // Scoring itself is untouched (speed bonuses still need instant server
  // credit); only the DISPLAY is frozen. We snapshot at the start of each
  // question and render that snapshot while answering, then switch back to
  // live values from 'revealing' onward so the jump lands with the reveal.
  const [frozenScores, setFrozenScores] = useState(null);
  useEffect(() => {
    setFrozenScores(Object.fromEntries(
      (players || []).map(p => [p.user_id, { score: p.score, streak: p.streak, best_streak: p.best_streak }])
    ));
    // Snapshot per question only — re-running on every `players` update would
    // defeat the freeze by re-capturing the already-credited score.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.current_question]);
  const displayPlayers = (revealPhase === 'answering' && frozenScores)
    ? (players || []).map(p => (frozenScores[p.user_id] ? { ...p, ...frozenScores[p.user_id] } : p))
    : players;

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
    haptic('select'); // lock-in ack — same beat as solo's option-tap buzz

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
  // players gate the reveal in survival (all players in race).
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

  // Answer-key hardening (Phase 1, 2026-07-13): once Phase 2 strips `correct`
  // from the stored questions jsonb, the reveal's green highlight comes from
  // the member-gated reveal_question RPC (discloses the index only after the
  // question closes server-side). Pre-Phase-2 rooms still embed the key, so
  // this fetch no-ops for them (question.correct !== undefined). Serves ALL
  // reveal viewers — answerers, timeout players, eliminated spectators and
  // late joiners — none of whom can rely on submit_answer's response.
  const [revealCorrectIdx, setRevealCorrectIdx] = useState(null);
  // What each opponent picked, as {user_id: answer_idx}. Comes from the SAME
  // gated RPC as the answer key, so a pick can never be learned earlier than
  // the correct index already can. Stays null until v1_3_mp_reveal_picks is
  // applied — the RPC simply omits `picks` and the UI renders nothing.
  const [revealPicks, setRevealPicks] = useState(null);
  useEffect(() => { setRevealCorrectIdx(null); setRevealPicks(null); }, [currentQuestionIdx]);
  useEffect(() => {
    if (revealPhase === 'answering') return;
    // NOTE: deliberately NOT skipped when question.correct is embedded. That
    // early-out meant pre-Phase-2 rooms — i.e. every room today — never called
    // this at all, so picks would never arrive. The embedded key still wins for
    // instant paint below; this call is now also the picks transport.
    if (!question) return;
    let alive = true;
    mpRevealQuestion({ p_code: room.code, p_question_idx: currentQuestionIdx })
      .then((r) => {
        if (!alive || !r?.revealed) return;
        if (question.correct === undefined) setRevealCorrectIdx(r.correct);
        if (r.picks && typeof r.picks === 'object') setRevealPicks(r.picks);
      })
      .catch(() => { /* best-effort — reveal renders without highlight or picks */ });
    return () => { alive = false; };
  }, [revealPhase, question, currentQuestionIdx, room.code]);

  // Reveal verdict haptic — the solo engines buzz correct/wrong the moment the
  // green highlight lands; MP reveals were silent. Keyed on the EFFECTIVE
  // correct index because Phase-2 rooms learn it async via reveal_question,
  // with a per-question ref so reveal re-renders (and the late-arriving RPC
  // result) don't re-buzz. lockedAnswerIdx == null skips: eliminated
  // spectators and refresh-restored players have no local pick, so no verdict.
  const revealHapticQRef = useRef(-1);
  useEffect(() => {
    if (revealPhase === 'answering') return;
    const correctIdx = question?.correct ?? revealCorrectIdx;
    if (correctIdx == null || lockedAnswerIdx == null) return;
    if (revealHapticQRef.current === currentQuestionIdx) return;
    revealHapticQRef.current = currentQuestionIdx;
    haptic(lockedAnswerIdx === correctIdx ? 'correct' : 'wrong');
  }, [revealPhase, question, revealCorrectIdx, currentQuestionIdx, lockedAnswerIdx]);

  // Survival spectator flag — hoisted ABOVE the early return so the headless
  // advance clock below can depend on it without tripping the hooks-order rule.
  const iAmEliminated = room.mode === 'survival' && myPlayer?.eliminated_at_q != null;

  // Elimination MOMENT overlay — the knockout is Survival's signature beat and
  // a one-line banner undersold it (playtester feedback). Fires once when
  // iAmEliminated flips true, then hands back to the persistent banner.
  const [elimOverlay, setElimOverlay] = useState(false);
  const elimSeenRef = useRef(false);
  useEffect(() => {
    if (iAmEliminated && !elimSeenRef.current) {
      elimSeenRef.current = true;
      setElimOverlay(true);
      haptic('heavy'); // the knockout is Survival's signature beat — pair the overlay with a thud
    }
  }, [iAmEliminated]);

  // Headless advance clock for eliminated survival spectators. The VISIBLE
  // QuestionTimer is unmounted for them (a live answer-timer over dead buttons
  // reads as answer pressure) — but advance_question is HOST-ONLY, so an
  // eliminated HOST with no timer would never fire it and the round would STALL
  // for every still-alive player (only a risk with 3+ players; a 2-player duel
  // ends on the host's elimination via the sole-survivor rule). This runs the
  // same countdown invisibly and, once expired, rolls the phase machine forward
  // (answering → revealing → [2s pause] → advancing → the host's advance effect
  // fires). Fully inert for non-eliminated players and non-survival modes — the
  // visible QuestionTimer owns onExpire there, so there is no double-fire.
  const spectatorRemainingMs = useQuestionTimer(QUESTION_DURATION_MS, currentQuestionIdx);
  useEffect(() => {
    if (!iAmEliminated) return;             // alive players: visible timer drives it
    if (spectatorRemainingMs > 0) return;   // not expired yet
    setRevealPhase(prev => prev === 'answering' ? 'revealing' : prev);
  }, [iAmEliminated, spectatorRemainingMs]);

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
      // Survival: end once the outcome is SETTLED — everyone out (draw) OR a
      // sole survivor remains (winner decided; previously the room ground
      // through every remaining question, forcing a Q2-eliminated loser to
      // spectate ~4 minutes — most just quit instead).
      const aliveCount = players.filter(p => p.eliminated_at_q == null).length;
      if (room.mode === 'survival' && players.length > 0 && (aliveCount === 0 || (players.length >= 2 && aliveCount === 1))) {
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
  // Survival spectator state — iAmEliminated is hoisted above the early return
  // (the headless advance clock depends on it). Once eliminated, the player
  // watches the round resolve (no answer-timer pressure, no answering).
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
            background: "rgba(88, 204, 2, 0.1)",
            border: "1px solid rgba(88, 204, 2, 0.3)",
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
          players={displayPlayers}
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
          revealCorrectIdx={revealCorrectIdx}
          revealPicks={revealPicks}
          players={players}
          myUserId={myPlayer?.user_id || null}
        />

        {/* Elimination moment — one dramatic beat, then the persistent banner
            below takes over for the spectator phase. */}
        {elimOverlay && (
          <div
            onClick={() => setElimOverlay(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(11,12,16,0.88)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{
              width: '100%', maxWidth: 340, textAlign: 'center',
              background: 'var(--s1)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 20, padding: '30px 22px 22px',
            }}>
              <div style={{ fontSize: 54, marginBottom: 10 }}>💀</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                Knocked out on Q{(myPlayer?.eliminated_at_q ?? 0) + 1}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
                {aliveCount === 1 ? '1 player still alive' : `${aliveCount} players still alive`} — stick around to see who takes it.
              </div>
              <button className="btn-3d" onClick={() => setElimOverlay(false)} style={{ width: '100%', marginBottom: 8 }}>
                👀 Keep watching
              </button>
              <button
                onClick={handleLeave}
                style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Leave game
              </button>
            </div>
          </div>
        )}

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
      {/* SR countdown at thresholds only — same pattern as QuizEngine/HotStreak. */}
      <div className="sr-only" role="timer" aria-live="assertive" aria-atomic="true">
        {seconds === 10 ? "10 seconds left" : seconds === 5 ? "5 seconds left" : seconds === 0 ? "Time's up" : ""}
      </div>
    </div>
  );
}

// Stage 1C.7 reveal-coloring constants. Hardcoded inline; Stage 1F may
// promote to CSS theme tokens if more multiplayer-styling work happens.
const MP_LOCK_COLOR    = "#64748b"; // slate-500 — neutral "this is my pick, not yet judged"
const MP_CORRECT_COLOR = "#58CC02"; // green-500 — the right answer (and your pick if you got it)
const MP_WRONG_COLOR   = "#ef4444"; // red-500 — your wrong pick (already used elsewhere for errors)
const MP_CORRECT_BG    = "rgba(88, 204, 2, 0.15)";
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
function QuestionView({ question, lockedAnswerIdx, disabled, onPick, revealing, questionIdx, revealCorrectIdx, revealPicks, players, myUserId }) {
  // Opponent avatars grouped by the option they chose. Built only during the
  // reveal, and only once the gated RPC has actually returned picks — before
  // the v1_3_mp_reveal_picks migration lands, revealPicks is null and every
  // lookup below yields an empty list, so nothing renders.
  const picksByOption = useMemo(() => {
    if (!revealing || !revealPicks) return null;
    const byId = new Map((players || []).map(p => [p.user_id, p]));
    const out = {};
    for (const [uid, idx] of Object.entries(revealPicks)) {
      if (uid === myUserId) continue; // your own pick is already highlighted
      const p = byId.get(uid);
      if (!p) continue;              // player left the room mid-question
      (out[idx] ||= []).push(p);
    }
    return out;
  }, [revealing, revealPicks, players, myUserId]);
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
          // Embedded key (pre-Phase-2 rooms) wins for instant paint; the
          // RPC-disclosed index covers Phase-2 rooms where questions no
          // longer carry `correct`. `?? null` keeps undefined===undefined
          // from ever counting as a match.
          const isCorrect = idx === (question.correct ?? revealCorrectIdx ?? null);
          // Reveal-state classifications. Late-joiner (null) and timeout
          // (-1) cases short-circuit naturally — `null === idx` and
          // `-1 === idx` are both false for all valid idx.
          const isRevealCorrect = revealing && isCorrect;
          // Only mark your pick wrong once the correct index is actually
          // known — otherwise a Phase-2 room would flash a correct pick red
          // during the reveal RPC round-trip.
          const correctKnown = (question.correct ?? revealCorrectIdx) != null;
          const isYourWrong = revealing && isLocked && correctKnown && !isCorrect;
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
              {/* Who else picked this. Renders only at reveal and only when the
                  gated RPC supplied picks; the avatar itself carries the
                  meaning, with the name in the title for a11y/hover. */}
              {picksByOption?.[idx]?.length > 0 && (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: 6 }}
                  aria-label={`Also picked by ${picksByOption[idx].map(p => p.name).join(", ")}`}
                >
                  {picksByOption[idx].slice(0, 4).map(p => (
                    <span
                      key={p.user_id}
                      title={p.name}
                      style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "var(--s2)",
                        border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, lineHeight: 1, overflow: "hidden",
                      }}
                    >
                      <ProfilePic value={p.avatar} name={p.name} />
                    </span>
                  ))}
                  {picksByOption[idx].length > 4 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", marginLeft: 2 }}>
                      +{picksByOption[idx].length - 4}
                    </span>
                  )}
                </span>
              )}
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
            <span style={{ width: 24, height: 24, flexShrink: 0 }}><ProfilePic value={p.avatar} name={p.name} /></span>
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
                {mode === "survival"
                  ? <span role="img" aria-label={p.eliminated_at_q != null ? "eliminated" : "still alive"}>{p.eliminated_at_q != null ? "💀" : "❤️"}</span>
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
    // Always enabled: an ELIMINATED host has no timer (Trigger B) and a
    // ghost opponent never trips allAnswered (Trigger A) — the old
    // answeredCount<1 gate hard-deadlocked survival rooms in that state.
    buttonDisabled = false;
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
