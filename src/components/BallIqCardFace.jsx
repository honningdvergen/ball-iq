import { tierPalette } from "../lib/ballIqCard.js";
import { MIN_RATED_ANSWERS } from "../lib/scoring.js";
import { tint, lift } from "../lib/clubColour.js";

/**
 * THE BALL IQ CARD — one implementation, three surfaces.
 *
 * ⚠️ THIS EXISTS BECAUSE THE CARD KEPT FORKING. It was built once on the
 * owner's profile and then re-approximated on a friend's profile, and Alex
 * caught the drift twice in a row:
 *
 *   "why does the card look like this with 2 sections? and not like on my
 *    profile? just use the same card design"
 *   "you see how my friends card still is not exactly like the one on my
 *    profile?"
 *
 * Both times the fix was to copy the markup across, and both times the next
 * restyle forked it again — because two copies of a layout is a promise that
 * somebody will edit one of them. So the layout lives here now, and the two
 * screens pass in only what genuinely differs: the owner's name and avatar are
 * editable controls, a friend's are plain.
 *
 * ⚠️ THE FOURTH SURFACE IS CANVAS AND CANNOT IMPORT THIS. generateShareCard's
 * `type === "iq"` branch in App.jsx draws this same design at 2× into a
 * 1080×1440 bitmap, because a saved PNG cannot be React. It adds a footer strip
 * ("Can you beat me?" / balliq.app) and nothing else — Alex: "that exact card
 * is what we want to see on our profile, we just add the 'can you beat me' and
 * balliq.app to the cards that are saved or shared." Change the geometry here
 * and you MUST change it there; the whole mechanism depends on a card in a
 * WhatsApp thread being recognisable as a place inside the app.
 *
 * Editorial, not a grid of tiles: one big numeral, one big face, and the six
 * competitions as an open list on hairlines. Six bordered chips out-weighed the
 * rating they were meant to support, which is what made the old card read as
 * assembled rather than designed.
 *
 * @param {object}    card     computeCard() result — { ratings, overall, tier }
 * @param {boolean}   played   has this player actually played? see the ⚠️ below
 * @param {ReactNode} avatar   the face, ringed by the caller (96px)
 * @param {ReactNode} name     display name — a button for the owner, text for a friend
 * @param {ReactNode} [subline] level badge, XP, IQ line…
 */
export default function BallIqCardFace({ card, played, answered = 0, avatar, name, subline, style }) {
  const t = tierPalette(card.tier);

  // The best of the six PLAYED competitions takes the tier accent, so the eye
  // lands on the player's strongest suit without needing a legend. null when
  // nothing is played, so no prior-seeded number can win a highlight it did
  // not earn.
  const playedRatings = card.ratings.filter(r => r.answered >= MIN_RATED_ANSWERS).map(r => r.rating);
  const best = played && playedRatings.length ? Math.max(...playedRatings) : null;

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: t.bg, border: `1.5px solid ${tint(t.accent, 0.33)}`,
      borderRadius: 22, padding: "22px 20px 18px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.42)",
      ...style,
    }}>
      <div style={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${tint(t.accent, 0.15)} 0%, transparent 70%)`, pointerEvents: "none" }} />
      {/* One diagonal foil sweep across the whole face. A single pass of light
          is what makes the card read as one material rather than parts arranged
          on a ground — the same sweep the canvas render draws. */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(118deg, ${tint(t.accent, 0)} 30%, ${tint(t.accent, 0.12)} 47%, ${tint(t.accent, 0)} 62%)`, pointerEvents: "none" }} />

      {/* Numeral left, face right, both anchored to the TOP edge so they read
          as one composition rather than two separately-centred blocks. */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3.4, color: t.text, opacity: 0.5 }}>BALL IQ</div>
          {/* ⚠️ NO RATING BEFORE THE FIRST GAME. A profile with zero games was
              shown "64 · OVERALL · PROSPECT" as the largest number on the
              screen, directly above "No stats yet — play your first game". And
              64 was not their score, it was everyone's: compRating smooths
              toward a prior, so with no data it resolves to a constant —
              (0 + 0.4*2) / (0 + 2) = 0.4 → 40 + 0.4*59 = 63.6 → 64. Every new
              profile showed the identical number: a placeholder dressed as a
              measurement, attached to the app's central claim. */}
          {played ? (
            <>
              {/* Negative tracking: at this size the default gap between two
                  digits opens a hole in the middle of the card's loudest
                  element. Tightening it makes "87" one object. */}
              <div style={{ fontSize: 86, fontWeight: 900, color: t.accent, lineHeight: 1.02, letterSpacing: -4, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{card.overall}</div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.6, color: t.text, opacity: 0.55, marginTop: 2 }}>OVERALL</div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: t.accent, marginTop: 10 }}>{t.label}</div>
            </>
          ) : (
            <>
              {/* An em-dash set at the full numeral size renders as a long
                  horizontal bar and reads as a LOADING SKELETON, not as "no
                  value" — caught on the simulator, not in the markup. Two-thirds
                  the size reads as a dash again while the block keeps its
                  optical height. */}
              <div style={{ fontSize: 58, fontWeight: 900, color: t.text, opacity: 0.3, lineHeight: 88 / 58, marginTop: 6, fontVariantNumeric: "tabular-nums" }} aria-label="No rating yet">—</div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.6, color: t.text, opacity: 0.55, marginTop: 2 }}>OVERALL</div>
              {/* "UNRATED" over six blank dashes is the first thing a new
                  player sees on their OWN profile, and it reads as broken
                  rather than as something to earn. The card is the app's
                  identity object; its empty state should point at the one
                  action that fills it. The gate is ten answered questions
                  (MIN_RATED_ANSWERS), so say how many are left. */}
              {/* NB: a bare truthiness check, deliberately. The rating gate is
                  MIN_RATED_ANSWERS and lives above; this only picks which of two
                  EMPTY states to show, and writing it as a comparison would trip
                  the guard that stops a rating appearing after one answer. */}
              {answered ? (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: t.text, opacity: 0.7 }}>
                    {MIN_RATED_ANSWERS - answered} MORE TO GET RATED
                  </div>
                  <div aria-hidden="true" style={{ width: 108, height: 4, borderRadius: 999, background: tint(t.text, 0.18), overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((answered / MIN_RATED_ANSWERS) * 100)}%`, height: "100%", background: t.accent, borderRadius: 999 }} />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: t.text, opacity: 0.7, marginTop: 10 }}>
                  ANSWER {MIN_RATED_ANSWERS} TO GET RATED
                </div>
              )}
            </>
          )}
        </div>
        {avatar}
      </div>

      {/* Identity runs the FULL width under both columns — the name is the
          second thing you read, and boxing it under the numeral had it wrapping
          at ten characters. */}
      <div style={{ position: "relative", marginTop: 14 }}>
        {/* ⚠️ EACH ON ITS OWN BLOCK. The name is an inline-flex button (it
            carries an edit pencil) and the level line used to be an inline-flex
            pill, so they rendered SIDE BY SIDE — "Alex ✏️ (Champions League
            1,840 XP)" on one line. Wrapping here rather than asking every
            caller to remember it. */}
        <div>{name}</div>
        {subline ? <div style={{ marginTop: 6 }}>{subline}</div> : null}
      </div>

      {/* ⚠️ AN UNPLAYED COMPETITION STILL SHOWS NO NUMBER. computeCard seeds
          every unplayed comp from the same prior, so printing it would put one
          invented value in six places on the card named after the app's core
          metric. That bug has been fixed here once already.

          ⚠️ AND THE COMPETITION COLOUR IS NOT A PLACEHOLDER. An earlier pass
          tinted played rows with the tier accent and kept the competition
          colour only for empty ones, so the card LOST its colour as it filled
          in. Alex: "i see there are no colors to the 6 categories here". The
          colour says which competition this is; it belongs in both states.
          Played is signalled by the number being there, and the best of the six
          carrying the tier accent. */}
      <div style={{ position: "relative", marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20 }}>
        {card.ratings.map(r => {
          const has = r.answered >= MIN_RATED_ANSWERS;
          return (
            <div key={r.abbr} style={{
              display: "flex", alignItems: "center", gap: 9,
              /* Fixed height for the reason the old chips had one: nothing in
                 the row may decide its own line box. iOS gives some emoji
                 different metrics from others, which made two of six rows
                 shorter on device and identical in Chrome. */
              height: 42, boxSizing: "border-box", minWidth: 0,
              borderTop: `1px solid ${tint(t.text, 0.10)}`,
            }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: lift(r.color) }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, letterSpacing: 1, color: t.text, opacity: 0.72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.abbr}</span>
              {has ? (
                <span style={{ fontSize: 21, fontWeight: 900, color: r.rating === best ? t.accent : t.text, opacity: r.rating === best ? 1 : 0.92, fontVariantNumeric: "tabular-nums" }}>{r.rating}</span>
              ) : (
                /* A short rule, not an em-dash: at this size a dash beside a
                   label reads as a hyphen. This reads as an empty slot. */
                <span aria-label={`${r.name} — not rated yet`} style={{ width: 20, height: 3, borderRadius: 2, background: t.text, opacity: 0.3, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
