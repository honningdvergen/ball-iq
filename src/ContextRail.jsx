import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

// Desktop-only right sidebar. Three sub-widgets stacked top to bottom:
// (1) friends mini-leaderboard, (2) streak widget, (3) mode suggestions.
// Plus a reserved ad slot at the bottom (display:none until AdSense ships).
//
// Visible only at >= 1280px viewport in regular browser mode. Hidden
// during active gameplay (focus mode) via the `inGame` prop. CSS-gated
// to mobile/PWA via display:none + standalone killswitch.
export function ContextRail({
  inGame,
  userId,
  currentUserName,
  currentUserScore,
  loginStreak,
  bestLoginStreak,
  streakPulseDays,
  setTab,
  startMode,
}) {
  // Hide during active gameplay so the player isn't distracted by side
  // content. ContextRail is also CSS-hidden below 1280px viewport.
  if (inGame) return null;

  return (
    <aside className="context-rail" aria-label="Context">
      <FriendsLeaderboard
        userId={userId}
        currentUserName={currentUserName}
        currentUserScore={currentUserScore}
        onAddFriends={() => setTab?.('profile')}
      />
      <StreakWidget
        loginStreak={loginStreak}
        bestLoginStreak={bestLoginStreak}
        streakPulseDays={streakPulseDays}
      />
      <ModeSuggestions startMode={startMode} />
      {/* TODO: Reserved for AdSense once approved. Change display:none
          to display:block in CSS once ad code is wired. PWA standalone
          killswitch already defends. */}
      <div className="ad-slot-context" aria-hidden="true" />
    </aside>
  );
}

function FriendsLeaderboard({ userId, currentUserName, currentUserScore, onAddFriends }) {
  const [rows, setRows] = useState(null); // null = loading, [] = settled

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('friendships')
          .select(
            '*,requester:profiles!requester_id(id,username,total_score),' +
            'addressee:profiles!addressee_id(id,username,total_score)'
          )
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .eq('status', 'accepted');
        if (cancelled) return;
        if (error) {
          console.error('[contextrail] friends', error.message);
          setRows([]);
          return;
        }
        const friends = (data || [])
          .map(f => {
            const other = f.requester_id === userId ? f.addressee : f.requester;
            return other
              ? { id: other.id, username: other.username, score: other.total_score || 0, isMe: false }
              : null;
          })
          .filter(Boolean);
        friends.push({
          id: userId,
          username: currentUserName || 'You',
          score: currentUserScore || 0,
          isMe: true,
        });
        friends.sort((a, b) => b.score - a.score);
        setRows(friends.slice(0, 5));
      } catch (e) {
        if (cancelled) return;
        console.error('[contextrail] friends ex', e?.message);
        setRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, currentUserName, currentUserScore]);

  // Render the card shell with a skeleton state while loading so the
  // rail's overall layout is stable on first paint — otherwise the card
  // pops in after streak/modes have rendered, causing visible reflow.
  if (rows === null) {
    return (
      <div className="cr-card">
        <div className="cr-card-title">Leaderboard</div>
        <div className="cr-lb">
          {[0, 1, 2].map(i => (
            <div key={i} className="cr-lb-row cr-lb-skeleton" aria-hidden="true">
              <span className="cr-lb-rank">{i + 1}</span>
              <span className="cr-lb-name" />
              <span className="cr-lb-score" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cr-card">
      <div className="cr-card-title">Leaderboard</div>
      <div className="cr-lb">
        {rows.map((r, i) => (
          <div key={r.id} className={`cr-lb-row${r.isMe ? ' is-me' : ''}`}>
            <span className="cr-lb-rank">{i + 1}</span>
            <span className="cr-lb-name">{r.username}</span>
            <span className="cr-lb-score">{r.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {rows.length < 5 && (
        <button className="cr-card-cta" onClick={onAddFriends}>
          Add more friends →
        </button>
      )}
    </div>
  );
}

function StreakWidget({ loginStreak, bestLoginStreak, streakPulseDays }) {
  return (
    <div className="cr-card">
      <div className="cr-card-title">Streak</div>
      <div className="cr-streak-num">🔥 {loginStreak || 0}</div>
      {(streakPulseDays || []).length > 0 && (
        <div className="cr-streak-dots">
          {streakPulseDays.map((active, i) => (
            <div key={i} className={`cr-streak-dot${active ? ' active' : ''}`} />
          ))}
        </div>
      )}
      {bestLoginStreak > 0 && (
        <div className="cr-streak-best">
          Best: {bestLoginStreak} {bestLoginStreak === 1 ? 'day' : 'days'}
        </div>
      )}
    </div>
  );
}

function ModeSuggestions({ startMode }) {
  // Hardcoded for v1 — three modes that aren't already promoted as heroes
  // on Home (Daily / Wordle / Multiplayer / Classic). Cycling/dynamic
  // suggestion logic is a v2 polish.
  const modes = [
    { id: 'hotstreak', icon: '🔥', name: 'Hot Streak', desc: '60-second sprint' },
    { id: 'survival',  icon: '💀', name: 'Survival',   desc: 'One wrong and out' },
    { id: 'legends',   icon: '📜', name: 'Legends',    desc: 'Pre-2000 greats' },
  ];
  return (
    <div className="cr-card">
      <div className="cr-card-title">Try next</div>
      <div className="cr-modes">
        {modes.map(m => (
          <button
            key={m.id}
            className="cr-mode"
            onClick={() => startMode?.(m.id)}
          >
            <span className="cr-mode-icon">{m.icon}</span>
            <span className="cr-mode-body">
              <span className="cr-mode-name">{m.name}</span>
              <span className="cr-mode-desc">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
