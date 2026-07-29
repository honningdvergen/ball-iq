import React, { useCallback } from "react";
import { Users } from "lucide-react";

// MultiplayerCard — Home tab.
//
// TWO controls, one job each. It had three, and the hierarchy was inverted
// against what they actually did:
//
//   "Invite"        (small outlined pill, top-right)  -> creates a room and
//                    lands you in the lobby holding a shareable /join/CODE
//                    link. That is the WHOLE journey.
//   "Play a friend" (big green button)                -> setTab("online").
//                    Switches tab; you then create a room anyway.
//
// So the quiet corner pill did the real work while the loud green button took
// the slower route to the same place. Merged: the primary CTA now runs the
// invite flow directly. The Online tab is still one tap away in the nav for
// anyone joining with a code, so nothing became unreachable.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onLocal, onInvite }) {
  const handleInvite = useCallback((e) => {
    e?.stopPropagation();
    onInvite?.();
  }, [onInvite]);

  return (
    <div className="mp-card" role="group" aria-label="Multiplayer">
      <div className="mp-card-row">
        <span className="mp-card-icon" aria-hidden="true"><Users size={22} strokeWidth={2} /></span>
        <div className="mp-card-titles">
          <div className="mp-card-title">Play with Friends</div>
          {/* Two wrong versions before this. It first restated the buttons
              below it; then said "10 questions", which is false — Hot Streak
              and Survival Duel are not 10 questions. What it carries now is the
              capacity, which is already our claim on the site, the store
              listing and the screenshots. The app was the only place silent. */}
          <div className="mp-card-sub">Live rooms, up to 8 players.</div>
        </div>
      </div>
      <div className="mp-card-ctas">
        {/* Labels finish "I want to…" rather than naming our internal
            taxonomy, and the second answers the question a first-timer
            actually has: do I need a second phone? */}
        <button type="button" className="mp-card-cta" onClick={handleInvite} aria-label="Create a room and invite a friend">Invite a friend</button>
        <button type="button" className="mp-card-cta ghost local" onClick={onLocal} aria-label="Play locally on one phone">Same phone</button>
      </div>
    </div>
  );
});
