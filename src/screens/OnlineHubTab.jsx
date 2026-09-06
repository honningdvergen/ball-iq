// The Online tab — guest pitch, live rooms, join-by-code, local pass & play row.
// Extracted from App.jsx on 2026-09-06 (review E16, brick 3).
import React, { useMemo } from "react";
import { Gamepad2, KeyRound, Users, Zap } from "lucide-react";
import { ProfilePic } from "../components/ProfilePic.jsx";
import { useProfilePhotos } from "../lib/profilePhotos.js";
import { readMpHistory } from "../App.jsx";

// ─── ONLINE TAB (hub) ─────────────────────────────────────────────────────────
// Head-to-head direction from the Claude Design handoff (Online Tab.dc.html):
// VS hero (you vs latest rival), W/L/win-rate stat row, flat green Create
// Room CTA (no 3D rim per spec), Join with Code, recent-opponents rail with
// Rematch. All game entry goes through startMode so auth-gating stays in one
// place; Create/Rematch use the one-tap auto-create path into a lobby.
export function OnlineHubTab({ startMode, setOnlineAutoCreate, onJoinCode, displayName, avatarUrl, avatarId, onChallenge, needsAccount }) {
  // Inline join-with-code — the code row lives ON the tab (no intermediate
  // entry screen). onJoinCode handles auth-gating, the RPC and navigation.
  const [joinCode, setJoinCode] = React.useState("");
  const [joining, setJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState("");
  const [joinFocus, setJoinFocus] = React.useState(false);
  const submitJoin = async () => {
    if (joining) return;
    setJoining(true); setJoinError("");
    try {
      const res = await onJoinCode?.(joinCode);
      if (res && !res.ok && res.error) setJoinError(res.error);
    } finally { setJoining(false); }
  };
  // Re-read on mount: the pane unmounts during gameplay (screen !== "home"),
  // so returning from a finished game always re-mounts with fresh history.
  const [history] = React.useState(() => readMpHistory());
  const stats = React.useMemo(() => {
    const games = history.length;
    const wins = history.filter(h => h.won).length;
    let streak = 0;
    for (const h of history) { if (h.won) streak++; else break; }
    const recent = [];
    const seen = new Set();
    for (const h of history) {
      for (const o of (h.opponents || [])) {
        if (!o || seen.has(o.id || o.name)) continue;
        seen.add(o.id || o.name);
        recent.push({ id: o.id, name: o.name, avatar: o.avatar || "", won: (h.myScore ?? 0) >= (o.score ?? 0), line: `${h.myScore ?? 0}–${o.score ?? 0}` });
        if (recent.length >= 3) break;
      }
      if (recent.length >= 3) break;
    }
    return { games, wins, losses: games - wins, winRate: games ? Math.round(100 * wins / games) : null, streak, recent, rival: recent[0] || null };
  }, [history]);
  // ⚠️ THE SCREEN ALEX WAS ACTUALLY LOOKING AT. The first photo fix went into
  // the lobby and podium; the Online hub — the VS card and Recent opponents —
  // kept showing monograms, which is what he reported twice.
  const oppPhotos = useProfilePhotos(useMemo(() => stats.recent.map(r => r.id), [stats.recent]));
  const createRoom = () => { setOnlineAutoCreate?.(true); startMode("online"); };
  return (
    <div className="screen tab-content online-hub">
      {/* Title + win-streak pill (no local gear — the global header has one) */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 16px"}}>
        <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.02em",color:"var(--t1)"}}>Online</div>
        {stats.streak >= 2 && (
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 13px",borderRadius:999,background:"rgba(255,193,7,0.08)",border:"1px solid rgba(255,193,7,0.3)"}}>
            <span style={{fontSize:12}}>🔥</span>
            <span style={{fontSize:13,fontWeight:800,color:"var(--gold)",fontVariantNumeric:"tabular-nums"}}>{stats.streak} win streak</span>
          </div>
        )}
      </div>

      {/* desktop-web-refresh (Friends #06 lean): two-column reflow at >=1024.
          The wrappers are display:contents on mobile (no box → byte-identical
          single-column flow) and a grid at desktop: your record (left) + the
          private-match actions (right). Leaderboard deferred to a bigger user
          base, so the left column holds the app's real head-to-head record. */}
      <div className="online-cols">
      <div className="online-col-a">
      {/* VS hero card — signed-in only (2026-09-06 guest-first): for a guest it
          was "You vs ? · No matches yet" as the first thing on the tab, an empty
          scoreboard above a sign-up wall. Guests get what they CAN do first. */}
      {!needsAccount && (
      <div style={{borderRadius:22,background:"var(--s1)",border:"1px solid var(--border)",padding:"22px 18px",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:22}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:110}}>
            {avatarUrl
              ? <img src={avatarUrl} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{width:84,height:84,borderRadius:"50%",objectFit:"cover",border:"2.5px solid var(--accent)",boxShadow:"0 0 0 5px rgba(88,204,2,0.14)"}} />
              : <span style={{width:84,height:84,borderRadius:"50%",border:"2.5px solid var(--accent)",boxShadow:"0 0 0 5px rgba(88,204,2,0.14)",display:"inline-flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"var(--s2)"}}><ProfilePic value={avatarId} name={displayName} /></span>}
            <span style={{fontSize:14,fontWeight:800,color:"var(--t1)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:800,color:"var(--t3)"}}>VS</span>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:110}}>
            {stats.rival
              ? <span style={{width:84,height:84,borderRadius:"50%",border:`2.5px solid ${stats.rival.won ? "var(--accent)" : "#FF6B6B"}`,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"var(--s2)",overflow:"hidden"}}><ProfilePic value={stats.rival.avatar} url={oppPhotos[stats.rival.id]} name={stats.rival.name} /></span>
              : <span style={{width:84,height:84,borderRadius:"50%",border:"2.5px dashed #3E4150",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"var(--t3)"}}>?</span>}
            <span style={{fontSize:13,fontWeight:stats.rival ? 700 : 600,color:stats.rival ? "var(--t1)" : "var(--t3)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stats.rival ? stats.rival.name : "Your rival here"}</span>
          </div>
        </div>
        {/* Before a first match this row read "0 · 0 · —" in 24px — an empty
            scoreboard posing as a record, and the biggest thing on the card.
            Say what to do instead; the scoreboard appears once there's one. */}
        {(stats.wins + stats.losses) === 0 ? (
          <div style={{marginTop:20,borderTop:"1px solid var(--border)",paddingTop:14,textAlign:"center",fontSize:13,fontWeight:600,color:"var(--t2)",lineHeight:1.5}}>
            No matches yet — win one and your record starts here.
          </div>
        ) : (
        <div style={{display:"flex",alignItems:"stretch",marginTop:20,borderTop:"1px solid var(--border)",paddingTop:14}}>
          {[
            { v: stats.wins, label: "Wins", color: "var(--grn-soft)" },
            { v: stats.losses, label: "Losses", color: "var(--t1)" },
            { v: stats.winRate == null ? "—" : `${stats.winRate}%`, label: "Win rate", color: "var(--gold)" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{width:1,background:"var(--border)"}} />}
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                {/* Inter for stat numbers (mono is codes-only — its dotted zero reads like an 8 in stats) */}
                <span style={{fontSize:24,fontWeight:800,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.v}</span>
                <span style={{fontSize:11,fontWeight:600,color:"var(--t2)"}}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        )}
      </div>
      )}

      </div>{/* /.online-col-a */}
      <div className="online-col-b">
      {/* Flat green CTA (no 3D rim per design spec) + secondary join.
          Signed out, this button used to read "Create Room" and then hit a
          sign-up wall AFTER the tap — the tab advertised a game it wouldn't
          let you start. Say it before the tap instead: the label now matches
          the wall's own heading, so the account step is expected rather than
          a bait-and-switch. The gate itself is correct and stays — a room
          needs a real user id to host or join. */}
      {/* ⚠️ color HERE, not only on the label span. The button set no color at all,
          so the two children resolved differently: the label overrode it inline,
          while the lucide icon — which paints with currentColor — inherited iOS
          WebKit's DEFAULT BUTTON COLOR and rendered blue. The app has no blue
          anywhere, so the most important CTA on the Online tab carried the one
          off-palette hue in the product, and only on iOS. Setting it on the button
          makes both children inherit the same ink. */}
      {/* GUEST PITCH (Alex, 2026-09-06: "the online tab should tempt players
          more to sign up and test their football knowledge against their
          friends"). A guest gets the picture first — what a room IS — then the
          one green button, which is the sign-up. Nothing here is a number we
          cannot back; the three steps are literally the flow. */}
      {needsAccount && (
        <div style={{borderRadius:14,background:"var(--s1)",border:"1px solid var(--border)",padding:"18px 16px 16px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
            <span className="t7s-icon" style={{"--mode":"var(--accent)","--mode-rgb":"88,204,2",width:46,height:46,marginTop:2}} aria-hidden="true"><Users size={24} strokeWidth={2} /></span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:19,fontWeight:800,letterSpacing:"-0.3px",color:"var(--t1)",lineHeight:1.15}}>Who knows more — you or your mates?</div>
              <div style={{fontSize:13.5,color:"var(--t2)",marginTop:5,lineHeight:1.45}}>Ten questions, everyone answers live, the podium settles it. Up to 8 players, any phone.</div>
            </div>
          </div>
          <button onClick={createRoom} style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",color:"var(--grn-ink)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:15,display:"flex",alignItems:"center",justifyContent:"center",gap:9,cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{display:"flex",alignItems:"center"}} aria-hidden="true"><Zap size={17} strokeWidth={2.4} /></span><span style={{fontSize:16,fontWeight:800,color:"var(--grn-ink)"}}>Challenge your friends</span>
          </button>
          <div style={{marginTop:8,textAlign:"center",fontSize:12.5,color:"var(--t3)",lineHeight:1.45}}>Free account, takes seconds — then invite anyone with a link.</div>
        </div>
      )}
      {!needsAccount && (
      <button onClick={createRoom} style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",color:"var(--grn-ink)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:17,display:"flex",alignItems:"center",justifyContent:"center",gap:9,cursor:"pointer",fontFamily:"inherit"}}>
        <span style={{display:"flex",alignItems:"center"}} aria-hidden="true"><Gamepad2 size={17} strokeWidth={2.2} /></span><span style={{fontSize:17,fontWeight:800,color:"var(--grn-ink)"}}>Create Room</span>
      </button>
      )}
      {/* The join field and the local row used to float loose under the pitch,
          the only block in the app without a section head — Home has "Today",
          "Find a quiz", "More modes". Naming them also tells a guest that the
          two things they CAN do without an account are right here. */}
      <div className="home-section-title" style={{marginTop:18, marginBottom:2}}>No account needed</div>
      {/* Inline join row (design 7a/7b): code field + Join in ONE row. Join
          sits dimmed until there's input, lights green once typing starts. */}
      <div style={{display:"flex",gap:9,marginTop:10}}>
        <div style={{flex:1,minWidth:0,borderRadius:999,background:"var(--s1)",padding:"0 15px",display:"flex",alignItems:"center",gap:10,
          border:joinFocus ? "1.5px solid rgba(88,204,2,0.55)" : "1px solid var(--border)",
          boxShadow:joinFocus ? "0 0 0 4px rgba(88,204,2,0.12)" : undefined}}>
          <span style={{flexShrink:0,display:"flex",color:"var(--t3)"}} aria-hidden="true"><KeyRound size={15} strokeWidth={2} /></span>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); if (joinError) setJoinError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && joinCode.length > 0) submitJoin(); }}
            onFocus={() => setJoinFocus(true)}
            onBlur={() => setJoinFocus(false)}
            placeholder="Got a code? Type it here"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            disabled={joining}
            enterKeyHint="go"
            aria-label="Room code"
            style={{flex:1,minWidth:0,border:"none",background:"transparent",outline:"none",padding:"15px 0",
              // ⚠️ 16px is a HARD FLOOR — see the same note in Login.jsx. iOS
              // auto-zooms the page on focusing any input below it, and
              // WKWebView never restores the scale on blur, so ONE tap on this
              // field left the whole app zoomed until relaunch (reported on
              // device 2026-07-30: the Lobby's room code and Leave Room button
              // were pushed off-screen afterwards). The empty state was 14.5
              // and only grew to 17 once you typed — by which point the zoom
              // had already fired. Never drop a focusable field below 16.
              fontSize:joinCode ? 17 : 16,fontWeight:joinCode ? 800 : 500,
              letterSpacing:joinCode ? "0.22em" : "normal",
              color:"var(--text)",
              fontFamily:joinCode ? "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace" : "inherit"}}
          />
        </div>
        <button onClick={submitJoin} disabled={joining || joinCode.length === 0}
          style={{borderRadius:999,padding:"15px 24px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0,
            ...(joinCode.length > 0 && !joining
              ? {border:"none",background:"var(--accent)",color:"var(--grn-ink)",boxShadow:"0 8px 24px rgba(88,204,2,0.25)"}
              : {background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t3)"})}}>
          {joining ? "…" : "Join"}
        </button>
      </div>
      {joinError
        ? <div style={{color:"#FF6B6B",fontSize:12,marginTop:9,paddingLeft:4}}>{joinError}</div>
        : (joinFocus || joinCode) ? <div style={{color:"var(--t3)",fontSize:11.5,marginTop:9,paddingLeft:4}}>Codes are 6 characters — ask your friend for theirs.</div> : null}

      {/* Recent opponents — appears once real games have been recorded */}
      {stats.recent.length > 0 && (
        <>
          <div style={{fontSize:11.5,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--t2)",marginTop:24}}>Recent opponents</div>
          <div style={{display:"flex",gap:9,marginTop:12}}>
            {stats.recent.map((o) => (
              <div key={o.name} style={{flex:1,borderRadius:16,background:"var(--s1)",border:"1px solid var(--border)",padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
                <span style={{width:46,height:46,borderRadius:"50%",background:"var(--s2)",border:`2px solid ${o.won ? "var(--accent)" : "#FF6B6B"}`,display:"inline-flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><ProfilePic value={o.avatar} url={oppPhotos[o.id]} name={o.name} /></span>
                <span style={{fontSize:13,fontWeight:700,color:"var(--t1)",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</span>
                {/* Scores are variable-width — "Won 3241–2055" wraps to two lines
                    in a third-of-screen card while "Lost 3329–5274" fits on one.
                    Centred so a wrapped second line doesn't sit ragged-left. */}
                <span style={{fontSize:11,fontWeight:800,textAlign:"center",color:o.won ? "var(--grn-soft)" : "#FF6B6B"}}>{o.won ? "Won" : "Lost"} {o.line}</span>
                {/* marginTop:auto pins Rematch to the bottom of the card. The
                    cards are flex siblings and already stretch to equal height,
                    but the button used to flow straight after the score — so a
                    card whose score wrapped pushed its button a line lower than
                    its neighbours' (Alex, 2026-08-03: "the rematch buttons are
                    not aligned"). Bottom-anchoring is wrap-count-independent,
                    which a fixed height or a nowrap score would not be. */}
                <button onClick={() => (o.id && onChallenge) ? onChallenge({ id: o.id, username: o.name }) : createRoom()} style={{marginTop:"auto",border:"1.5px solid rgba(88,204,2,0.5)",borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:800,color:"var(--accent)",background:"rgba(88,204,2,0.06)",cursor:"pointer",fontFamily:"inherit"}}>Rematch</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Local pass & play — same row anatomy as the rest of the app (2026-09-06).
          Filled Play for a guest (the one thing on the tab they can start
          alone); quiet for an account, where online is the point. */}
      <div className="todays-seven-secondary mp-row" role="group" aria-label="Local pass and play" style={{marginTop:16, marginBottom:0}}>
        <button type="button" className="mp-row-open" onClick={() => startMode("local")} aria-label="Play locally on one phone">
          <span className="t7s-icon" aria-hidden="true"><Gamepad2 size={20} strokeWidth={2} /></span>
          <span className="t7s-body">
            <span className="t7s-title">Local pass &amp; play</span>
            <span className="t7s-sub">Same couch, one phone · up to 6 players</span>
          </span>
        </button>
        <button type="button" className="t7s-cta mp-row-invite" onClick={() => startMode("local")}>Play</button>
      </div>
      </div>{/* /.online-col-b */}
      </div>{/* /.online-cols */}
    </div>
  );
}

// Password-recovery overlay — mounts app-wide when AuthProvider sees the
// PASSWORD_RECOVERY event (the balliq.app/reset email link). The recovery
// session is already active at that point, so updateUser only needs the new
// password. Renders above everything at z 1200.
