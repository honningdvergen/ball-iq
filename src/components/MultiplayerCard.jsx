import React, { useCallback } from "react";
import { Share } from "lucide-react";
import { APP_NAME } from "../lib/scoring.js";

// MultiplayerCard — Home tab. Replaces the old .util-rail.hero-online
// rail. Two primary CTAs (Online + Local) and a corner Invite pill.
// Online checks guest state via the parent's onOnline handler (sign-in
// toast fallback). Local jumps straight into pass-and-play. Invite uses
// Web Share API where available, otherwise copies the URL to clipboard
// with a toast.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onOnline, onLocal, showToast }) {
  const onInvite = useCallback(async (e) => {
    // Stop the click from reaching the card-level handlers (none here, but
    // future-proof against being wrapped in a tappable parent).
    e?.stopPropagation();
    const url = (typeof window !== 'undefined' && window.location?.origin) || 'https://balliq.app';
    const shareData = {
      title: APP_NAME,
      text: `Play ${APP_NAME} with me — daily football trivia + multiplayer.`,
      url,
    };
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      // User-cancelled share is reported as AbortError on iOS Safari — silent.
      if (err && err.name === 'AbortError') return;
      // Otherwise fall through to clipboard fallback.
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast?.('🔗 Link copied — paste it to a friend');
        return;
      }
    } catch {}
    // Last-resort fallback: announce that we couldn't share. Should be very rare.
    showToast?.(`Share ${url}`);
  }, [showToast]);

  return (
    <div className="mp-card" role="group" aria-label="Multiplayer">
      <button type="button" className="mp-card-invite" onClick={onInvite} aria-label="Invite a friend">
        <Share size={13} strokeWidth={2.25} aria-hidden="true" />
        <span>Invite</span>
      </button>
      <div className="mp-card-row">
        <span className="mp-card-icon" aria-hidden="true">👥</span>
        <div className="mp-card-titles">
          <div className="mp-card-title">Play with Friends</div>
          <div className="mp-card-sub">Race friends online or play locally.</div>
        </div>
      </div>
      <div className="mp-card-ctas">
        <button type="button" className="mp-card-cta" onClick={onOnline} aria-label="Play online multiplayer">Online</button>
        <button type="button" className="mp-card-cta ghost local" onClick={onLocal} aria-label="Play local multiplayer">Local</button>
      </div>
    </div>
  );
});
