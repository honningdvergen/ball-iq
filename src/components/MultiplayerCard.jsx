import React, { useCallback } from "react";
import { Share, Users } from "lucide-react";

// MultiplayerCard — Home tab. Replaces the old .util-rail.hero-online
// rail. Two primary CTAs (Online + Local) and a corner Invite pill.
// Online checks guest state via the parent's onOnline handler (sign-in
// toast fallback). Local jumps straight into pass-and-play. Invite uses
// Web Share API where available, otherwise copies the URL to clipboard
// with a toast.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onOnline, onLocal, onInvite }) {
  // 1.1: "Invite" used to share a code-less balliq.app link — a dead end for the
  // recipient (no room to join). It now defers to the parent, which routes into
  // the online flow, auto-creates a room, and lands you in the lobby where the
  // real /join/CODE invite link lives.
  const handleInvite = useCallback((e) => {
    e?.stopPropagation();
    onInvite?.();
  }, [onInvite]);

  return (
    <div className="mp-card" role="group" aria-label="Multiplayer">
      <button type="button" className="mp-card-invite" onClick={handleInvite} aria-label="Invite a friend">
        <Share size={13} strokeWidth={2.25} aria-hidden="true" />
        <span>Invite</span>
      </button>
      <div className="mp-card-row">
        <span className="mp-card-icon" aria-hidden="true"><Users size={22} strokeWidth={2} /></span>
        <div className="mp-card-titles">
          <div className="mp-card-title">Play with Friends</div>
          {/* The subtitle here read "Race friends online or play locally." — it
              restated the two button labels sitting directly beneath it, which
              is the same dead-text pattern cut from the Home greeting earlier
              today. The buttons say it better because they are tappable. */}
          <div className="mp-card-sub">Head-to-head, 10 questions.</div>
        </div>
      </div>
      <div className="mp-card-ctas">
        {/* "Online" and "Local" named our internal taxonomy, not what happens.
            A label should finish the sentence "I want to…" — and the second one
            also answers the question a first-time user actually has, which is
            whether they need a second phone. */}
        <button type="button" className="mp-card-cta" onClick={onOnline} aria-label="Play a friend online">Play a friend</button>
        <button type="button" className="mp-card-cta ghost local" onClick={onLocal} aria-label="Play locally on one phone">Same phone</button>
      </div>
    </div>
  );
});
