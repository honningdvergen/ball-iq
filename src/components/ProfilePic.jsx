import { avatarColour } from '../lib/avatarColour.js';

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

/**
 * The letter to draw.
 *
 * ⚠️ FIRST LETTER, NOT FIRST CHARACTER. Alex, 2026-08-24: *"i can only see it
 * being a problem if the user has a number as the first character"* — and he is
 * right that it happens, but the real spread is wider than digits. Real
 * usernames in this table start with `_`, with a digit, and with an emoji, and
 * every one of those makes a worse avatar than the letter sitting right behind
 * it. So: skip to the first actual letter, and only fall back to the raw first
 * character when a name has no letters at all ("99", "1907" — a numeral avatar
 * is perfectly legible, it is just not the first choice).
 *
 * Unicode-aware on purpose: `Ø`, `Ä`, `Ć` and Cyrillic/Greek names are letters
 * and must be treated as such, so this tests \p{L} rather than A-Z.
 */
export function firstLetter(name) {
  const s = String(name || '').trim();
  if (!s) return '';
  const m = s.match(/\p{L}/u);
  return (m ? m[0] : Array.from(s)[0]).toUpperCase();
}

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
  const initial = firstLetter(name);
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", borderRadius: "50%", background: c.bg,
               overflow: "hidden", display: "block",
               /* Any fill can land against any ring — the profile and Online VS
                  circles are ringed in brand green, and a green colourway inside
                  a green ring reads as one blob with a rim light rather than a
                  face in a frame. A hairline of the ground colour separates the
                  two for EVERY colourway instead of special-casing the greens. */
               boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.30)",
               ...style }}
    >
      {/* ⚠️ SVG, BECAUSE `fontSize: "42%"` DOES NOT MEAN WHAT IT LOOKS LIKE.
          A percentage font-size resolves against the PARENT'S FONT-SIZE, never
          against the element's own box — so this drew a letter at 42% of
          whatever text happened to surround it. Inside `.profile-avatar` that
          parent is large and it looked correct; in the Online VS hero the
          parent is body text, so an 84px circle rendered a ~7px letter. Alex,
          2026-08-24: *"this tiny Y in the online tab looks horrendus"*. It was,
          and the comment here previously claimed the opposite — that it "scales
          with the container" — which is exactly the kind of wrong note that
          keeps a bug alive.
          An SVG with a viewBox scales its contents to the box by definition, at
          every one of the sizes this ships at (20px ready-up rows through the
          96px profile hero), with no container queries and no size prop to
          thread through eight call sites. */}
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}
           aria-hidden="true" focusable="false">
        {initial ? (
          <text
            x="50" y="50" textAnchor="middle" dominantBaseline="central"
            fill={c.ink} fontSize="46" fontWeight="800" letterSpacing="-1"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          >{initial}</text>
        ) : (
          /* No letter to take — a guest who has not set a name, or a row still
             loading. Lucide's `user` path, inlined so it inherits the viewBox
             rather than needing its own sizing.
             ⚠️ THIS WAS `/marketing/ball.png` AND IT LOOKED LIKE GARBAGE. Alex,
             2026-08-24: *"what the hell is this profile picture now? that is
             complete garbage"*. One property explains it: that PNG has NO ALPHA
             CHANNEL — `sips -g hasAlpha` says no and its corners are an opaque
             #09131C — so an opaque dark SQUARE was being dropped inside a
             coloured CIRCLE. It is app-icon artwork drawn for a rounded-rect
             tile; it was never a transparent sprite. */
          <g transform="translate(50 50) scale(2.3) translate(-12 -12)"
             fill="none" stroke={c.ink} strokeWidth="2.25"
             strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default ProfilePic;
