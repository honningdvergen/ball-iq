import { avatarColour } from '../lib/avatarColour.js';

const BALL_SRC = "/marketing/ball.png";

/**
 * ⚠️ `value` USED TO BE IGNORED. This read `url || BALL_SRC` and dropped the
 * avatar_id on the floor, so 204 of 219 accounts (93.2% — everyone without an
 * uploaded photo) rendered as the SAME ball, and the six players who had picked
 * an emoji avatar were shown a ball anyway.
 *
 * Names were never the problem: only 5.9% carry an auto-generated
 * `player_xxxx`. The anonymity was entirely this component.
 *
 * An uploaded photo still wins outright. Without one, the stored colourway
 * gives every player a distinct ground — persisted in avatar_id, so your
 * friends see the same colour you do rather than a per-surface hash.
 */
export function ProfilePic({ value, url, name, seed, className, style }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%",
                 display: "block", ...style }}
        /* A dead photo URL must not fall back to the shared ball — that is the
           thing being fixed. Hide the broken image and let the coloured ground
           behind it show through. */
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
    );
  }
  const c = avatarColour(value, seed);
  // ⚠️ INITIAL, NOT THE BALL. Both were built and compared side by side at real
  // avatar size; Alex chose the initial. The ball is on-brand but its panel
  // detail turns to mush at 28-44px, and every avatar still reading as "a ball"
  // is most of the problem this change exists to solve. The app already uses
  // initials as the fallback for missing player photos, so this is the house
  // pattern rather than a new one.
  const initial = String(name || '').trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", borderRadius: "50%", display: "flex",
               alignItems: "center", justifyContent: "center", background: c.bg,
               color: c.ink, WebkitTextFillColor: c.ink, overflow: "hidden",
               fontWeight: 800, letterSpacing: "-0.02em",
               // Scales with the container: these render from 28px to 96px.
               fontSize: "42%", lineHeight: 1, ...style }}
    >
      {initial || (
        /* No name to take a letter from — 5.9% of accounts, and any row still
           loading. The ball keeps them from being a blank disc. */
        <img src={BALL_SRC} alt="" aria-hidden="true"
             style={{ width: "62%", height: "62%", objectFit: "contain", display: "block" }} />
      )}
    </div>
  );
}

export default ProfilePic;
