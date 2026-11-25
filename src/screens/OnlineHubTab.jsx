// The Multiplayer tab: the pitch card, join by code, your people, the other ways to play.
// Extracted from App.jsx on 2026-09-06 (review E16, brick 3).
import React, { useMemo } from "react";
import { ChevronRight, Flame, Gamepad2, KeyRound, Settings } from "lucide-react";
import { ProfilePic } from "../components/ProfilePic.jsx";
import { LeagueStartRow } from "../components/LeagueStartRow.jsx";
import { useProfilePhotos } from "../lib/profilePhotos.js";
import { useAcceptedFriends } from "../lib/acceptedFriends.js";
import { rowLine } from "../lib/rowLine.jsx";
import { readMpHistory } from "../App.jsx";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useT } from "../i18n/index.js";
import "./onlineHub.css";

// The league row is Home's own (a table, a league of one, or the way in), so
// the two tabs cannot drift. Lazy for the reason Home gives: it carries a fetch.
const LeagueHomeCard = React.lazy(() => import("../components/LeagueHomeCard.jsx"));

// ─── MULTIPLAYER TAB (hub) ────────────────────────────────────────────────────
// REBUILT ON THE KIT, 25 Nov 2026. Alex, on the live tab: "and you can also tell
// we can do better on the multiplayer tab here". A first redraw that only tidied
// the same three boxes: "That is not better". The second, a pitch card as the
// centre with the other ways to play as one list under it: "Yes, better", then
// "Yes, build it"; of his own signed-in tab drawn the same way: "Online tab
// upgrade looks good". Drawings: ball-iq-audit/2026-11-24/finish/
// multiplayer-tab-4.png (a guest) and multiplayer-signed-in.png.
//
// What was wrong on his screen, and is gone: two heading styles (a white "Join a
// room" over grey capitals), every friend an outlined card of its own, a round
// face inside a square green well, an outline round everything, and the solid
// green with a glow under it. What the tab DOES has not changed: every control
// calls what it called. All game entry still goes through startMode so the
// auth gate stays in one place; Create and Rematch use the one-tap auto-create
// path into a lobby.
//
// Top to bottom:
//   1. The title, with the bell and the gear as two tiles in its row (they sat
//      in a strip of their own above it; App.jsx no longer draws that strip
//      over this tab, as it never did over Home).
//   2. The pitch card, the one loud thing: a guest gets the question, one line
//      and a podium over "Challenge your friends"; an account gets itself
//      against its latest rival, its record, and "Create room".
//   3. "Got a code?": the field and Join straight on the page, one fill each
//      (Alex, on a field inside a card: "probably do not need 2 different
//      shadows in this field though"). Always on the screen, his choice
//      ("On the screen"); for an account it comes before the lists, for a
//      guest after them, as each was drawn.
//   4. The people: recent opponents once there are any, else friends. One card
//      of rows.
//   5. "More ways to play": the mates' league (Home's row; new on this tab,
//      in both drawings) and local pass and play, which ends in an arrow where
//      it had a grey Play.
export function OnlineHubTab({ startMode, setOnlineAutoCreate, onJoinCode, displayName, avatarUrl, avatarId, onChallenge, onOpenFriend, needsAccount, userId, showSettings, onOpenSettings, onOpenNotifs, notifCount = 0, hasSession = false, onOpenLeague, onStartLeague }) {
  // The words are t() since i18n step 7 (the oh.* keys; the title is tab.online).
  const t = useT();
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
  // Only loaded when there is nobody to rematch — see the block below.
  const { friends } = useAcceptedFriends(stats.recent.length === 0 ? userId : null);
  const friendPhotos = useProfilePhotos(useMemo(() => friends.map(f => f.id), [friends]));
  const createRoom = () => { setOnlineAutoCreate?.(true); startMode("online"); };

  // The league row, decided as Home decides it (HomeScreen.jsx says why each
  // flag is read): the card for a member or a signed-in player not yet
  // checked, the way in for everyone else, and something of the same height
  // in its place until the card has answered.
  const [, leaguesChanged] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    window.addEventListener("biq:leagues-changed", leaguesChanged);
    return () => window.removeEventListener("biq:leagues-changed", leaguesChanged);
  }, []);
  const leagueMember = (() => { try { return localStorage.getItem("biq_league_member") === "1"; } catch { return false; } })();
  const leagueCardOn = !!onOpenLeague && (leagueMember || (() => {
    try { return hasSession && sessionStorage.getItem("biq_league_checked") !== "1"; } catch { return false; }
  })());
  const leagueSeen = leagueMember && (() => { try { return !!localStorage.getItem("biq_league_home"); } catch { return false; } })();
  const leagueWait = leagueMember ? (leagueSeen ? <div className="lg-home-wait" aria-hidden="true" /> : null)
    : onStartLeague ? <LeagueStartRow onStart={onStartLeague} /> : null;

  // "Who knows more, / you or your mates?": the line breaks at its comma, in
  // either language, so the question stands on two even lines.
  const pitch = t("oh.pitch").split(", ");

  // GOT A CODE? The field and Join, one row. Join is quiet until there is a
  // code, then it is the green thing to press.
  const joinBlock = (
    <>
      <div className="home-section-title">{t("oh.codeHead")}</div>
      <div className="oh-join">
        <div className={`oh-field${joinFocus ? " is-focus" : ""}`}>
          <span className="oh-field-ic" aria-hidden="true"><KeyRound size={17} strokeWidth={2} /></span>
          {/* ⚠️ 16px is a HARD FLOOR for this input (onlineHub.css) — see the
              same note in Login.jsx. iOS auto-zooms the page on focusing any
              input below it, and WKWebView never restores the scale on blur,
              so ONE tap on this field left the whole app zoomed until relaunch
              (reported on device 2026-07-30: the Lobby's room code and Leave
              Room button were pushed off-screen afterwards). The empty state
              was 14.5 and only grew to 17 once you typed — by which point the
              zoom had already fired. Never drop a focusable field below 16. */}
          <input
            type="text"
            className={joinCode ? "is-code" : undefined}
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); if (joinError) setJoinError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && joinCode.length > 0) submitJoin(); }}
            onFocus={() => setJoinFocus(true)}
            onBlur={() => setJoinFocus(false)}
            placeholder={t("oh.codePh")}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            disabled={joining}
            enterKeyHint="go"
            aria-label={t("oh.codeAria")}
          />
        </div>
        <button type="button" className={`oh-join-btn${joinCode.length > 0 && !joining ? " is-on" : ""}`} onClick={submitJoin} disabled={joining || joinCode.length === 0}>
          {joining ? "…" : t("oh.join")}
        </button>
      </div>
      {joinError
        ? <div className="oh-join-note is-error">{joinError}</div>
        : (joinFocus || joinCode) ? <div className="oh-join-note">{t("oh.codeHint")}</div> : null}
    </>
  );

  return (
    <div className="screen tab-content online-hub">
      {/* The title row. In a browser the app bar above carries notifications
          and Settings, so neither tile is drawn there (showSettings is false);
          the bell comes only with a session, as on Home. */}
      <div className="oh-top">
        <div className="oh-h1">{t("tab.online")}</div>
        {showSettings && (
          <div className="oh-tools">
            {onOpenNotifs && (
              <button type="button" onClick={onOpenNotifs} className="icon-btn hdr-ic oh-tile" aria-label={notifCount > 0 ? t("nav.notificationsNew", { count: notifCount }) : t("nav.notifications")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                {notifCount > 0 && <span className="notif-dot" aria-hidden="true" />}
              </button>
            )}
            <button type="button" onClick={onOpenSettings} className="icon-btn hdr-ic oh-tile" aria-label={t("nav.settings")}><Settings size={20} strokeWidth={2} aria-hidden="true" /></button>
          </div>
        )}
      </div>

      {/* desktop-web-refresh (Friends #06 lean): two-column reflow at >=1024.
          The wrappers are display:contents on mobile (no box, one column) and a
          grid at desktop: the pitch card (left) + everything else (right). */}
      <div className="online-cols">
      <div className="online-col-a">
      {needsAccount ? (
        // A GUEST (Alex, 2026-09-06: "the online tab should tempt players more
        // to sign up and test their football knowledge against their
        // friends"). The picture first, what a room IS, then the one green
        // button, which is the sign-up: the account step comes after the tap,
        // from the wall startMode puts up. Nothing here is a number we cannot
        // back: ten questions, live, up to eight.
        <section className="oh-pitch">
          <h2 className="oh-q">{pitch.length === 2 ? <>{pitch[0]},<br />{pitch[1]}</> : t("oh.pitch")}</h2>
          <p className="oh-line">{t("oh.pitchSub")}</p>
          <div className="oh-pod" aria-hidden="true">
            <div className="oh-pod-2"><u /><i>2</i></div>
            <div className="oh-pod-1"><u /><i>1</i></div>
            <div className="oh-pod-3"><u /><i>3</i></div>
          </div>
          <button type="button" className="oh-go" onClick={createRoom}>{t("oh.challenge")}</button>
        </section>
      ) : (
        // AN ACCOUNT: you against your latest rival, your record, and the room.
        <section className="oh-pitch">
          <div className="oh-vs">
            <div className="oh-vs-side">
              {avatarUrl
                ? <img className="oh-vs-face" src={avatarUrl} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : <span className="oh-vs-face"><ProfilePic value={avatarId} name={displayName} /></span>}
              <span className="oh-vs-name">{displayName}</span>
            </div>
            <span className="oh-vs-mark" aria-hidden="true">VS</span>
            <div className="oh-vs-side">
              {/* No rival yet is a plain dark disc: it was a dashed ring round a question mark. */}
              {stats.rival
                ? <span className="oh-vs-face"><ProfilePic value={stats.rival.avatar} url={oppPhotos[stats.rival.id]} name={stats.rival.name} /></span>
                : <span className="oh-vs-face is-empty" />}
              <span className={`oh-vs-name${stats.rival ? "" : " is-empty"}`}>{stats.rival ? stats.rival.name : t("oh.rival")}</span>
            </div>
          </div>
          {/* Before a first match this row read "0 · 0 · —" in 24px — an empty
              scoreboard posing as a record, and the biggest thing on the card.
              Say what to do instead; the scoreboard appears once there's one. */}
          {(stats.wins + stats.losses) === 0 ? (
            <p className="oh-line oh-line-vs">{t("oh.noMatches")}</p>
          ) : (
            <>
              {/* The win streak sat beside the title, where the bell and the gear are now. */}
              {stats.streak >= 2 && (
                <p className="oh-streak"><Flame size={15} strokeWidth={2.4} aria-hidden="true" />{t("oh.streak", { n: stats.streak })}</p>
              )}
              <div className="oh-rec">
                {[
                  { v: stats.wins, label: t("oh.wins") },
                  { v: stats.losses, label: t("oh.losses") },
                  { v: stats.winRate == null ? "—" : t("oh.pct", { n: stats.winRate }), label: t("oh.winRate") },
                ].map((s) => (
                  <div key={s.label} className="oh-rec-cell">
                    {/* Inter for stat numbers (mono is codes-only — its dotted zero reads like an 8 in stats) */}
                    <b>{s.v}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button type="button" className="oh-go" onClick={createRoom}>{t("oh.create")}</button>
        </section>
      )}
      </div>{/* /.online-col-a */}
      <div className="online-col-b">
      {!needsAccount && joinBlock}

      {/* Recent opponents — appears once real games have been recorded. It was
          a rail of three outlined cards; it is one card of rows, each with the
          score on its grey line and a quiet Rematch. */}
      {stats.recent.length > 0 && (
        <>
          <div className="home-section-title">{t("oh.recent")}</div>
          <div className="oh-list">
            {stats.recent.map((o) => (
              <div key={o.name} className="todays-seven-secondary mp-row">
                <span className="oh-face" aria-hidden="true"><ProfilePic value={o.avatar} url={oppPhotos[o.id]} name={o.name} /></span>
                <span className="t7s-body">
                  <span className="t7s-title"><span className="t7s-name">{o.name}</span></span>
                  <span className="t7s-sub">{rowLine(t(o.won ? "oh.won" : "oh.lost", { line: o.line }))}</span>
                </span>
                <button type="button" className="t7s-cta oh-pill" onClick={() => (o.id && onChallenge) ? onChallenge({ id: o.id, username: o.name }) : createRoom()}>{t("oh.rematch")}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CHALLENGE A FRIEND ──────────────────────────────────────────────
          ⚠️ THE ONE TAB ABOUT PLAYING PEOPLE SHOWED NONE OF YOUR PEOPLE. The
          recent-opponents list above only appears once you have finished a
          live game, so a player with friends and no match history saw a "?"
          rival card and ~400pt of empty space — while their friends sat behind
          two taps on Profile, under a 1,000pt XP ladder, each with a Challenge
          button. 24% of signups come from room invites, so this is the
          k-factor's own surface.
          Shown only when the list above is empty: once you have opponents,
          rematching them is the stronger offer and two lists of people would
          be noise. Four at most; the whole list is on Profile. */}
      {stats.recent.length === 0 && friends.length > 0 && (
        <>
          <div className="home-section-title">{t("oh.challengeFriend")}</div>
          <div className="oh-list mp-friend-list">
            {friends.slice(0, 4).map((f) => (
              // ⚠️ THE NAME AND FACE MUST OPEN THE PROFILE, like every other
              // person-row in the app. This was a plain <div> whose only
              // interactive child was Challenge, so tapping a friend here did
              // nothing — while the SAME friend in the Profile tab's list
              // opens their card. Alex: "i am unable to tap their profile from
              // the multiplayer tab, only from my profile tab where my friends
              // list is." mp-row-open wraps the body, the pill stays its own
              // button.
              <div key={f.id} className="todays-seven-secondary mp-row">
                <button type="button" className="mp-row-open"
                  // ⚠️ AN OBJECT, NOT AN ID. openFriendProfile does
                  // `if (!friend?.id) return` — handing it a bare string is a
                  // SILENT no-op, which is the very bug this row is fixing.
                  onClick={() => onOpenFriend?.({ id: f.id, username: f.username, avatar: f.avatar })}
                  aria-label={t("oh.viewProfile", { name: f.username })}>
                  {/* A round face on the row itself: it sat inside a square green well. */}
                  <span className="oh-face" aria-hidden="true"><ProfilePic value={f.avatar} url={friendPhotos[f.id]} name={f.username} /></span>
                  <span className="t7s-body">
                    <span className="t7s-title"><span className="t7s-name">{f.username}</span></span>
                  </span>
                </button>
                <button type="button" className="t7s-cta oh-pill" onClick={() => onChallenge?.({ id: f.id, username: f.username })}>{t("oh.challengeBtn")}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MORE WAYS TO PLAY ── the league, then one phone passed round. */}
      <div className="home-section-title">{t("oh.more")}</div>
      <div className="oh-list">
        {leagueCardOn ? (
          <React.Suspense fallback={leagueWait}><LeagueHomeCard onOpen={onOpenLeague} onStart={onStartLeague} wait={leagueWait} from="multiplayer" /></React.Suspense>
        ) : onStartLeague ? (
          <LeagueStartRow onStart={onStartLeague} />
        ) : null}
        {/* Local pass & play: the whole row is the tap and it ends in an arrow,
            as every row that takes you somewhere does (it had a grey Play
            beside a row that did the same thing). */}
        <div className="todays-seven-secondary mp-row" role="group" aria-label={t("oh.localAria")}>
          <button type="button" className="mp-row-open" onClick={() => startMode("local")} aria-label={t("oh.localOpen")}>
            <span className="t7s-icon" aria-hidden="true"><Gamepad2 size={22} strokeWidth={2} /></span>
            <span className="t7s-body">
              <span className="t7s-title"><span className="t7s-name">{t("oh.local")}</span></span>
              <span className="t7s-sub">{rowLine(t("oh.localSub"))}</span>
            </span>
            <span className="mp-row-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
          </button>
        </div>
      </div>

      {needsAccount && joinBlock}
      </div>{/* /.online-col-b */}
      </div>{/* /.online-cols */}
    </div>
  );
}

// Password-recovery overlay — mounts app-wide when AuthProvider sees the
// PASSWORD_RECOVERY event (the balliq.app/reset email link). The recovery
// session is already active at that point, so updateUser only needs the new
// password. Renders above everything at z 1200.
