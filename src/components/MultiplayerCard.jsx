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
// The card BODY is also a target. Everything outside the two buttons — the icon,
// the title, the subtitle, the padding — used to be a dead tap on the largest
// card on Home. It now opens the Online tab, which is where a curious tap wants
// to go (joining with a code lives there).
//
// The title row is a real <button> so this is reachable by keyboard and
// announced by VoiceOver; the outer div's handler only exists to catch the
// padding, which no assistive tech targets anyway. Both CTAs stopPropagation —
// without it, "Same phone" would start a local game AND switch tabs behind it.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onLocal, onInvite, onOpen }) {
  const handleInvite = useCallback((e) => {
    e?.stopPropagation();
    onInvite?.();
  }, [onInvite]);
  const handleLocal = useCallback((e) => {
    e?.stopPropagation();
    onLocal?.();
  }, [onLocal]);
  const handleOpen = useCallback((e) => {
    e?.stopPropagation();
    onOpen?.();
  }, [onOpen]);

  return (
    <div className="mp-card" role="group" aria-label="Multiplayer" onClick={handleOpen}>
      <button type="button" className="mp-card-row mp-card-open" onClick={handleOpen}
              aria-label="Open the Online tab">
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
      </button>
      <div className="mp-card-ctas">
        {/* Labels finish "I want to…" rather than naming our internal
            taxonomy, and the second answers the question a first-timer
            actually has: do I need a second phone? */}
        {/* Plural, deliberately. The subtitle one line up says "up to 8
            players" and this said "a friend" — the card contradicted itself,
            and the singular undersold the one thing that makes our
            multiplayer unusual. */}
        <button type="button" className="mp-card-cta" onClick={handleInvite} aria-label="Create a room and invite friends">Invite friends</button>
        <button type="button" className="mp-card-cta ghost local" onClick={handleLocal} aria-label="Play locally on one phone">Same phone</button>
      </div>
    </div>
  );
});
