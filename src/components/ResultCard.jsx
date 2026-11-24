// THE RESULT, AS ONE OBJECT (22 Nov 2026).
//
// The moment a daily ends was text: "1/7. A tough set today." The 21 Nov audit
// found nothing on it to look at and nothing worth a screenshot, and it is the
// moment a player decides whether to come back and whether to show someone.
// Alex steered four drawn rounds of this card on 22 Nov ("we went from 5/10 to
// 7.5/10", then: a smaller score, nothing decorative, the name alone as the
// brand). What is here is round four.
//
//   top row    the game and its day on the left, balliq.app on the right
//   the score  about 72px, with the verdict BESIDE it, not under it
//   the strip  the game's own picture. Daily 7: its seven questions as a
//              row of filled dots, green for right and red for wrong (the
//              marks Alex agreed on 24 Nov 2026; until then a white disc and
//              an empty ring). No ticks or crosses: six crosses on a bad day
//              is noise.
//   one line   the best true thing to say, also on a bad day
//
// WHAT THE STRIP SAYS ABOUT EACH QUESTION, in order of preference:
//   `shares`  how many players got each one (0 to 100). No server sends it
//             yet (supabase/migrations/v3_7_daily_result_marks.sql, waiting on
//             Alex's yes, and then on phones running a build that reports it).
//             Each disc gets its number; the hardest one the player got wears
//             the gold ring and is named in the line.
//   `levels`  the bank's own difficulty for each question (easy, medium,
//             hard), which every answer already carries. Only the HARD ones
//             are marked: a label under seven discs was noise, a label under
//             two is information. A hard one the player got is the same
//             green dot with a gold ring round it; a hard one missed is red
//             like any miss, with the quiet label under it.
// Alex on the first built card, which had neither: "no percentages on this
// one, looks a bit more dull". With nothing to go on the strip is the player's
// own seven and the line is not drawn.
//
// Everything on the card means something. Do not add ornament to it (the
// chalk half-circle in round three read as clutter and was cut).
//
// TWO SLOTS A HOST MAY ASK FOR (24 Nov 2026, Footle first). Alex on the Footle
// finish, where the board sat above the card: "thrown together … a divorced
// couple". The result was on screen twice.
//   `picture`  the game's own picture, between the headline and the line:
//              Footle hands over its played rows, so the board IS the card.
//   `action`   one control at the foot of the card (the finish panel puts its
//              quiet Share button there).
// A host that passes neither gets exactly the card it had.
//
// THE XP ON THE CARD (24 Nov 2026, the Daily 7 only). `xp` is what this finish
// earned. It is drawn in yellow under the verdict, where the host's sentence
// was, and the verdict and the XP then stand against the foot of the big
// number instead of being centred on it (.rc-hero.is-foot). The sentence it
// displaced is not thrown away: on a day with no line under the marks it IS
// that line. A host that passes no `xp` gets exactly the card it had, which is
// what keeps Footle, Transfer Trail and Top 10 where they were.
import React from "react";
import { useT } from "../i18n/index.js";
import { rich } from "../i18n/rich.jsx";
import "../i18n/en.js";
import "./resultCard.css";

/** The hardest question the player got right, or -1. Ties go to the earlier one. */
export function starIndex(marks, shares) {
  if (!Array.isArray(marks) || !Array.isArray(shares)) return -1;
  let best = -1;
  for (let i = 0; i < marks.length; i++) {
    const p = shares[i];
    if (!marks[i] || !Number.isFinite(p)) continue;
    if (best < 0 || p < shares[best]) best = i;
  }
  // Something most players got is not a moment worth a gold disc.
  return best >= 0 && shares[best] <= 50 ? best : -1;
}

/** "You got number 6. Only 12% did." Up to a third it counts who did; above that, who missed. */
export function noteFor(t, marks, shares) {
  const i = starIndex(marks, shares);
  if (i < 0) return null;
  const p = Math.max(1, Math.round(shares[i]));
  const hard = p <= 33 ? t("rc.noteOnly", { p }) : t("rc.noteMiss", { miss: 100 - p });
  return rich(t("rc.note"), { q: i + 1, hard: <strong>{hard}</strong> });
}

/** From the bank's difficulties: which were hard, which of those the player got, and the line. */
export function hardStory(t, marks, levels) {
  if (!Array.isArray(marks) || !Array.isArray(levels) || levels.length !== marks.length) return null;
  const hard = levels.map((l) => l === "hard");
  const total = hard.filter(Boolean).length;
  if (!total) return { hard, got: [], note: null };
  const got = hard.map((h, i) => h && !!marks[i]);
  const n = got.filter(Boolean).length;
  const note = n === 0 ? null
    : n === 1 ? rich(t("rc.note"), { q: got.indexOf(true) + 1, hard: <strong>{t("rc.hardOne")}</strong> })
    : rich(t("rc.noteMany"), { hard: <strong>{n === total ? t("rc.hardAll") : t("rc.hardMany", { n, total })}</strong> });
  return { hard, got, note };
}

export function ResultCard({ title, tag = null, score, scoreNode = null, outOf, verdict, sub = null, xp = null, marks = null, shares = null, levels = null, note: hostNote = null, picture = null, action = null }) {
  const t = useT();
  const withShares = Array.isArray(shares) && Array.isArray(marks) && shares.length === marks.length && shares.every((p) => Number.isFinite(p));
  const star = withShares ? starIndex(marks, shares) : -1;
  const story = withShares ? null : hardStory(t, marks, levels);
  const anyHard = !!story && story.hard.some(Boolean);
  // Nothing earned is not announced: there is no "+0 XP".
  const xpOn = Number.isFinite(xp) && xp > 0;
  // A game with no strip (its board is the picture) may hand over its own line.
  // With the XP under the verdict, the sentence it displaced is the line on a
  // day that has no other.
  const note = hostNote ?? (withShares ? noteFor(t, marks, shares) : story ? story.note : null) ?? (xpOn ? sub : null);
  const right = Array.isArray(marks) ? marks.filter(Boolean).length : 0;
  const ringed = (i) => i === star || !!(story && story.got[i]);
  // Two ringed marks side by side (a day with several hard questions, both
  // got): on a narrow phone their rings would touch, so the row steps its dots
  // down a size there (.is-close in the stylesheet). Every other row is as drawn.
  const close = Array.isArray(marks) && marks.some((_, i) => ringed(i) && ringed(i + 1));
  return (
    <section className="rc" aria-label={score != null ? t("rc.aria", { title, score, total: outOf }) : title}>
      <div className="rc-eye">
        <span>{tag ? `${title} · ${tag}` : title}</span>
        <span className="rc-site">balliq.app</span>
      </div>
      <div className={`rc-hero${score == null ? " is-name" : ""}${xpOn ? " is-foot" : ""}`}>
        {/* No score on a lost guess game: the answer is the headline then. */}
        {score != null && <div className="rc-num"><b>{scoreNode ?? score}</b><span>/{outOf}</span></div>}
        {/* Keyed by its words: when the day's numbers land about a second
            after the card, the new sentence fades in rather than snapping, and
            the hero keeps its height (min-height in the stylesheet). */}
        <div className="rc-say" key={xpOn ? `${verdict}|xp` : `${verdict}|${sub ?? ""}`}>
          <div className="rc-v">{verdict}</div>
          {xpOn ? <div className="rc-xp">{rich(t("rs.xp"), { n: xp })}</div>
            : sub && <div className="rc-sub">{sub}</div>}
        </div>
      </div>
      {Array.isArray(marks) && marks.length > 0 && (
        <div className={`rc-kicks${withShares ? " has-shares" : ""}${close ? " is-close" : ""}`} role="img" aria-label={t("rc.kicksAria", { n: right, total: marks.length })}>
          {marks.map((ok, i) => (
            <span key={i} className={`rc-k${ok ? " is-in" : ""}${ringed(i) ? " is-star" : ""}`}>
              <i />
              {withShares ? <em>{Math.round(shares[i])}%</em>
                // Every column keeps the label's line once one has it, so the discs stay level.
                : anyHard ? <em>{story.hard[i] ? t("rc.hard") : "\u00a0"}</em> : null}
            </span>
          ))}
        </div>
      )}
      {picture && <div className="rc-pic">{picture}</div>}
      {note && <p className="rc-note">{note}</p>}
      {action}
    </section>
  );
}

export default ResultCard;
