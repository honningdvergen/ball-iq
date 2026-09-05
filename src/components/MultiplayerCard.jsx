import React, { useCallback } from "react";
import { Users } from "lucide-react";

// MultiplayerCard — Home tab. One row in the Today-row anatomy (2026-09-06).
//
// It was a standalone hero card: dark-green gradient, a glow, a full-saturation
// "Invite friends" button and a ghost "Same phone" — the loudest control on
// the screen in the seventh position, for a mode with 11 plays in 30 days. The
// critique's rule: loudness and position must agree. So it wears the same row
// shape as Footle / Daily 7 / Trail / Mystery, with green in the icon well and
// ONE quiet pill.
//
// Two targets, not nested (a <button> inside a <button> is invalid): the body
// opens the Online tab (where joining with a code and "Local pass & play" both
// live), the pill runs the invite flow — create a room, land in the lobby with
// the shareable /join/CODE link. "Same phone" left this card; the Online tab
// carries it.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onInvite, onOpen }) {
  const handleInvite = useCallback((e) => {
    e?.stopPropagation();
    onInvite?.();
  }, [onInvite]);
  const handleOpen = useCallback((e) => {
    e?.stopPropagation();
    onOpen?.();
  }, [onOpen]);

  return (
    <div className="todays-seven-secondary mp-row" role="group" aria-label="Multiplayer">
      <button type="button" className="mp-row-open" onClick={handleOpen} aria-label="Open the Online tab">
        <span className="t7s-icon" aria-hidden="true"><Users size={22} strokeWidth={2} /></span>
        <span className="t7s-body">
          <span className="t7s-title">Play with Friends</span>
          {/* Capacity, not a question count: Hot Streak and Survival Duel are
              not 10 questions, and "up to 8" is already our claim on the site
              and the store listing. */}
          <span className="t7s-sub">Live rooms · up to 8 players</span>
        </span>
      </button>
      <button type="button" className="t7s-cta mp-row-invite" onClick={handleInvite} aria-label="Create a room and invite friends">Invite</button>
    </div>
  );
});
