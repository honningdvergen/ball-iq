// The results screen for Classic, Speed, Survival, Legends, Chaos and the
// Daily 7 — the first screen extracted from App.jsx along its props seam
// (review 2026-09-06, E16). Nothing here reaches into AppInner state: every
// collaborator arrives as a prop, and `haptic` / `Confetti` come from App the
// way the lazy screens already import them.
import { useEffect } from "react";
import { ArrowLeftRight, RotateCcw, Share, Star, Trophy } from "lucide-react";
import { haptic } from "../lib/feedback.js";
import { Confetti } from "../components/Confetti.jsx";
import { DailyDone, DEFAULT_ICON } from "../components/DailyDone.jsx";
import { ResultCard } from "../components/ResultCard.jsx";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { StreakChip } from "../components/StreakChip.jsx";
import GameTitle from "../components/GameTitle.jsx";
import { CountUp } from "../components/CountUp.jsx";
import ResultFoot from "../components/ResultFoot.jsx";
import { WrongAnswersReview } from "../components/WrongAnswersReview.jsx";
import { setDailyMarks } from "../lib/shareDetail.js";
import { dayIndexForDate } from "../lib/date.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";
import { getXPForResult } from "../lib/scoring.js";
import { dailyTierBand, scoreTaglineBand } from "../lib/resultsCopy.js";
import { useT, fmtLocale } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { rich } from "../i18n/rich.jsx";

// TomorrowTeaser (the Daily-7-only return moment) retired 2026-09-06: the
// return loop is one component for all four dailies — components/DailyDone.jsx.
// THE CARD MOVED (2026-09-09). Alex proved the card responds to play — 10
// Champions League rights took him 63 → 65, UCL 56 → 68 — and the results
// screen said nothing about it. This is the cheapest bragging surface the app
// has and it was blank. Three states: unrated (how many more to get rated),
// just rated (the number arrives), rated (before → after, and each face that
// moved). Faces print in their own colour; the arrow is the fact.
function CardDeltaRow({ d }) {
  const t = useT();
  if (!d) return null;
  const Arrow = ({ a, b }) => (
    <span className="rd-num" style={{ color: b > a ? "var(--grn-soft)" : b < a ? "var(--t3)" : "var(--t2)" }}>
      {a} <span aria-hidden="true">→</span> {b}
    </span>
  );
  // ONE CAPTION LINE UNDER THE CARD (25 Nov 2026). It was an outlined box with a
  // spaced "BALL IQ" eyebrow on its own line and the moved faces in a grid under
  // a hairline: a second framed object under the result. Alex chose the quiz
  // finish where the result card is the one object and this is a quiet line of
  // words under it. The two sentences ("3 more answers to get rated", "Rated 65
  // — your card is live") say what they are about; a rating that moved keeps
  // "Ball IQ" as plain words before its numbers, and the faces follow on the
  // same line. Every state and every number is as it was. (His note of 9 Sept
  // on this strip, "i like how we see world going up from 58 to 62", is why the
  // faces stay.)
  const Shell = ({ children, label }) => (
    <div className="results-card-delta" role="status" aria-label={label}>{children}</div>
  );
  if (!d.ratedAfter) {
    return (
      <Shell>
        <span className="rd-body">{rich(t("rs.toRated", { count: d.toRated }), { n: d.toRated, w: t("rs.answers", { count: d.toRated }) })}</span>
      </Shell>
    );
  }
  if (!d.ratedBefore) {
    return (
      <Shell>
        <span className="rd-body">{rich(t("rs.ratedLive"), { n: <span className="rd-num" style={{ color: "var(--grn-soft)" }}>{d.after}</span> })}</span>
      </Shell>
    );
  }
  const moved = d.faces.slice(0, 2);
  return (
    <Shell label={t("rs.deltaAria", { a: d.before, b: d.after })}>
      <span className="rd-head">
        <span className="rd-name">Ball IQ</span>
        {/* ⚠️ NO "69 → 69". An arrow between two identical numbers is the panel
            telling you something happened when nothing did, and it was the
            loudest thing in the row. When the overall held, print it once. */}
        {d.after === d.before
          ? <span className="rd-num rd-flat">{d.after}</span>
          : <Arrow a={d.before} b={d.after} />}
      </span>
      {moved.map(f => (
        <span key={f.abbr} className="rd-face">
          <span className="rd-dot" style={{ background: f.color }} aria-hidden="true" />
          <span className="rd-abbr">{f.abbr}</span>
          <Arrow a={f.before} b={f.after} />
        </span>
      ))}
    </Shell>
  );
}

// The dailies by how much they are played, most first: real play counts read on
// 25 Nov 2026 (Transfer Trail, Top 10, Footle, the Daily 7). The quiz finish
// offers the first of these the player has not played today. Mystery Player is
// a daily only on a day Top 10 has no list; Ballpark, a test-build prototype,
// would come last.
const DAILY_ORDER = ["trail", "top10", "footle", "daily7", "mystery", "ballpark"];
const modeOf = (k) => (k === "daily" ? "daily7" : k);

export function Results({ result, mode, onHome, onRetry, onShare, onPlayFootle, onPlayDaily, dailyOpen, survivalBest, wrongAnswers, classicBest, label, badge, onReport, photoNudge, dailyDone, cardDelta, onPassPlay }) {
  const t = useT();
  const isPerfect = result && result.score === result.total && result.total >= 10;
  const pct = Math.round((result.score / result.total) * 100);
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const isSurvival = mode === "survival";
  const isDaily = mode === "daily";


  const xpEarned = getXPForResult(result.score, result.total, mode);
  const showConfetti = isSurvival ? result.score >= 10 : pct >= 80;

  // Daily 7 is one-shot: "Play Again" would just re-call startMode('daily')
  // and toast "Already done today" — a dead primary button. Point the CTA at
  // the OTHER daily loop (Footle) while it's still open; when both dailies
  // are done, show a non-button "come back tomorrow" state instead.
  /* ⚠️ READ FOR EVERY MODE, not just the daily. This was isDaily-gated, which
     meant the daily cross-sell could only ever appear on the ONE results screen
     whose players are already inside the daily loop. Measured 2026-08-31: 77%
     of players who enter through a non-daily door never reach a daily game, and
     of everyone who has ever finished a club quiz, the number whose first app
     event came on a later day is zero. The door has to exist where the people
     without it actually are. */
  const footleToday = readWordleTodayStatus();
  const footleOpen = footleToday && (footleToday.kind === "ready" || footleToday.kind === "in-progress");
  const footleCta = t(footleToday?.kind === "in-progress" ? "rs.contFootle" : "rs.playFootle");

  // Personal best detection
  const eligibleForPB = mode === "classic" && result.total === 10;
  const isNewBest = eligibleForPB && result.score > (classicBest || 0) && result.score > 0;

  const survivalNewBest = isSurvival && result.score > (survivalBest || 0) && result.score >= 3;
  const isNewPersonalBest = isNewBest || survivalNewBest;

  // The caption the wide-screen card prints under a zero.
  const scoreCaption = isSurvival
    ? (result.score === 0 ? t("rs.out1") : t("rs.runMiss", { count: result.score, n: result.score }))
    : t("rs.correctOf", { count: result.score, n: result.score, total: result.total });
  // Best run rides the card's line (review C: the amber pill was a third accent
  // on a screen that already has green and gold). Hidden below 3: noise.
  const bestRun = !isSurvival && result.bestStreak != null && result.bestStreak >= 3 && result.bestStreak < result.total ? result.bestStreak : 0;
  // Green is the app's "this went well" signal — earned, not automatic.
  const rdZero = result.score === 0;

  // ── desktop-web-refresh (Results #03): values for the >=1024 card (circular
  //  score badge · per-question dots · stat tiles). Render-always / CSS-revealed
  //  via the .rd-desktop wrapper; the mobile results is wrapped in .rd-mobile
  //  (display:contents→none at desktop) so it stays byte-identical. ──
  const RD_MODE_LABEL = { classic:"quiz.mode.classic", survival:"home.mode.survival", legends:"quiz.mode.legends", chaos:"quiz.mode.chaos" };
  const rdSubtitle = [mode === "daily" ? "Daily 7" : t(RD_MODE_LABEL[mode] || "home.quiz.title"), label].filter(Boolean).join(" · ");
  const rdDots = (() => {
    const arr = Array.isArray(result.allAnswers) ? result.allAnswers.map(a => a.isCorrect === true) : [];
    while (arr.length < result.total) arr.push(false); // timed-out / unanswered → miss
    return arr.slice(0, result.total);
  })();
  // The Daily 7's link is made in hooks/useShare.js, which knows the score only: today's seven
  // marks are left for it here, so the picture a mate sees can show them in order (lib/shareDetail.js).
  if (mode === "daily" && !result.dailyArchive) setDailyMarks(rdDots);
  // The Daily 7's result card (phone layout). The seven marks are the player's
  // own answers in order; the verdict and the line under it are what the card
  // says before there is a crowd to compare with (the tier copy the text
  // header used). The day is the edition's own, so an archive day shows its date.
  const cardFinish = isDaily && !!dailyDone;
  const dailyCard = cardFinish ? (() => {
    const band = dailyTierBand(result.score, result.total);
    const ed = result.dailyEdition ?? dayIndexForDate(new Date());
    let tag = null;
    try { tag = new Date(ed * 86400000).toLocaleDateString(fmtLocale(), { day: "numeric", month: "short", timeZone: "UTC" }); } catch { /* no date on the card */ }
    return {
      // The strip is drawn only when the answers on hand add up to the score:
      // a result restored without them must not show seven empty rings.
      title: "Daily 7", tag, score: result.score, outOf: result.total, marks: rdDots.filter(Boolean).length === result.score ? rdDots : null,
      scoreNode: <CountUp value={result.score} duration={900} delay={200} triggerHaptic />,
      verdict: t(`d7.h${band}`), sub: t(`d7.s${band}`), xp: xpEarned,
      // The Share button says the score ("Share my 5/7"), except in the lowest
      // band (0 or 1 of 7, "A tough set today."): there it is "Share my result".
      plainShare: band === 4,
      // The bank's difficulty for each of the seven, in order (every answer carries it).
      levels: Array.isArray(result.allAnswers) && result.allAnswers.length === result.total ? result.allAnswers.map((a) => a.diff || "medium") : null,
    };
  })() : null;
  const rdTier = isDaily ? t(`d7.h${dailyTierBand(result.score, result.total)}`) : t(`tag.${scoreTaglineBand(pct)}`);

  // ── THE ORDINARY QUIZ ENDS ON THE CARD TOO (25 Nov 2026) ─────────────────────
  // Classic, Speed, Legends, Chaos, a club or league quiz and Survival ended on
  // the old layout: "Final score" over an 88px number, an outlined rating box,
  // a solid green button, two outlined ghosts and an underlined exit. Alex
  // wants the whole app on one kit; of the drawn rounds he chose variant B ("B
  // but even better i think") and then: "Yeah go ahead".
  //
  //   the card      the game named once on its top line (the back arrow above
  //                 it stands alone: "the quiz ten questions is redundant next
  //                 to the back"), the score, the verdict, the XP in yellow,
  //                 the ten answers in order as green and red marks, and ONE
  //                 quiet Share button that shares exactly what Share shared.
  //   one caption   the rating strip, as a line of words (CardDeltaRow above).
  //   one list      the most played daily the player has not played today,
  //                 with a soft Play in that game's colour ("always mention our
  //                 most popular unplayed mode"), then "Play again".
  //   the way out   the small filled pill of the other finishes.
  //
  // What the drawing does not show and still has a place: a club's name and
  // badge ride the card's top line; a personal best and the best run are the
  // line under the marks; a winner (pass-and-play) keeps its line under the
  // card; a Survival run has no denominator and no marks ("12", "in a row").
  const quizCard = cardFinish ? null : (() => {
    const pb = isNewPersonalBest
      ? <strong>{t("rs.pb")}{isNewBest && classicBest ? t("rs.was", { n: classicBest }) : survivalNewBest && survivalBest ? t("rs.was", { n: survivalBest }) : ""}</strong>
      : null;
    const run = bestRun > 0 ? rich(t("rs.bestRun"), { n: bestRun }) : null;
    return {
      title: isDaily ? "Daily 7" : isSurvival ? t("home.mode.survival") : mode === "legends" || mode === "chaos" ? t(RD_MODE_LABEL[mode]) : t("home.quiz.title"),
      tag: label || null,
      badge: label && badge ? <span className="rc-badge" aria-hidden="true" style={{ background: badge.color, color: badge.fg, WebkitTextFillColor: badge.fg }}>{badge.abbr}</span> : null,
      // A Survival run has no denominator: the number, then what it counts.
      outOf: isSurvival ? null : result.total,
      verdict: isDaily ? rdTier : isSurvival ? t(rdZero ? "rs.runOver" : "rs.inARow") : rdTier,
      // The marks are drawn only for a round of fixed length whose answers on
      // hand add up to the score (a run could spray dozens across the card).
      marks: !isSurvival && result.total <= 12 && rdDots.filter(Boolean).length === result.score ? rdDots : null,
      note: isSurvival && rdZero ? t("rs.survZero") : pb || run ? <>{pb}{pb && run ? " · " : null}{run}</> : null,
    };
  })();
  // "Share my 7/10". At 30 percent or under, and for a Survival run, it is
  // "Share my result": the rule the Daily 7's button has for its lowest band.
  const quizShare = quizCard && !isDaily && onShare ? (
    <button type="button" className="rc-act" onClick={onShare}>
      <Share size={18} strokeWidth={2.4} aria-hidden="true" />
      {isSurvival || !(result.total > 0) || result.score / result.total <= 0.3 ? t("dd.shareMine") : t("dd.shareMy", { score: `${result.score}/${result.total}` })}
    </button>
  ) : null;
  // The dailies still open today: the app's own list (the one the dailies'
  // finishes draw); a host that hands over none gets the two this screen can
  // see for itself, as before.
  const stillOpen = dailyDone ? (dailyDone.nextUp || []) : [
    ...(footleOpen ? [{ key: "footle", name: t(footleToday.kind === "in-progress" ? "dd.contToday" : "dd.today", { g: "Footle" }), open: footleToday.kind === "in-progress" }] : []),
    ...(dailyOpen && onPlayDaily ? [{ key: "daily7", name: t("dd.today", { g: "Daily 7" }) }] : []),
  ];
  const nextDaily = DAILY_ORDER.map((k) => stillOpen.find((n) => modeOf(n.key) === k)).find(Boolean) || null;
  // The two this screen has always opened keep the handlers they had.
  const playNext = !nextDaily ? null
    : modeOf(nextDaily.key) === "daily7" && onPlayDaily ? onPlayDaily
      : modeOf(nextDaily.key) === "footle" && onPlayFootle ? onPlayFootle
        : nextDaily.onTap;
  const dailyRow = nextDaily && playNext ? (() => {
    const m = modeOf(nextDaily.key);
    return (
      <button key="daily" type="button" className="dd-li" style={{ "--dd-rgb": MODE_RGB[m] || "88,204,2", "--dd-c": MODE_ACCENT[m] || "var(--accent)" }} onClick={playNext}>
        <span className="dd-li-ic" aria-hidden="true">{nextDaily.icon || DEFAULT_ICON[m] || null}</span>
        <span className="dd-li-t">
          <span className="dd-li-n">{nextDaily.name}</span>
          <span className="dd-li-h">{t(`dd.hook.${m}`).split("·")[0].trim()}</span>
        </span>
        <span className="dd-li-go">{t(nextDaily.open ? "home.row.continue" : "common.play")}</span>
      </button>
    );
  })() : null;
  const againRow = onRetry ? (
    <button key="again" type="button" className="dd-li is-quiet" onClick={onRetry}>
      <span className="dd-li-ic" aria-hidden="true"><RotateCcw size={18} strokeWidth={2.2} /></span>
      <span className="dd-li-t">
        <span className="dd-li-n">{t(isSurvival ? "rs.goAgain" : "rs.playAgain")}</span>
        <span className="dd-li-h">{isSurvival ? t("quiz.survRule") : t("rs.againSub", { n: result.total })}</span>
      </span>
      <span className="dd-li-go">{t("common.play")}</span>
    </button>
  ) : null;
  // PASS AND PLAY AFTER A QUIZ (27 Nov 2026). Alex wanted people to know the
  // couch mode exists ("it is fun"); to the drawing of this row on the quiz's
  // results he said "Yes, build it". The last row of the card, in pass and
  // play's purple with the arrows he chose for Home, and a Play pill: it opens
  // the pass and play setup.
  const passRow = onPassPlay ? (
    <button key="pass" type="button" className="dd-li" style={{ "--dd-rgb": "168,120,240", "--dd-c": "#B994F5" }} onClick={onPassPlay}>
      <span className="dd-li-ic" aria-hidden="true"><ArrowLeftRight size={18} strokeWidth={2.2} /></span>
      <span className="dd-li-t">
        <span className="dd-li-n">{t("home.pass.title")}</span>
        <span className="dd-li-h">{t("rs.passSub")}</span>
      </span>
      <span className="dd-li-go">{t("common.play")}</span>
    </button>
  ) : null;
  // The other daily leads, except after a Survival death on the first question,
  // where the only honest next step is the same run again.
  const nextRows = [...(isSurvival && rdZero ? [againRow, dailyRow] : [dailyRow, againRow]), passRow].filter(Boolean);
  const rdBestStreak = result.bestStreak != null ? result.bestStreak : 0;

  return (
    <div className="screen foot-clear" style={{paddingTop:8, position:"relative"}}>
      {(isPerfect || showConfetti) && <Confetti />}
      <div className="rd-mobile">
      {/* THE DAILY 7'S FINISH HAS FOOTLE'S HEADER (round two, 24 Nov 2026): the
          back arrow, the game named once with its day, one line under it, and
          the streak as a chip on the right. So the card below starts at the
          score. Every other mode has the arrow alone (25 Nov 2026: its card
          names the game on its own top line). */}
      {cardFinish ? (
        <div className="dd-hd">
          <button type="button" className="back-btn" onClick={onHome} aria-label={t("quiz.backHome")}>←</button>
          <div className="dd-hd-t">
            <GameTitle tag={dailyCard.tag}>Daily 7</GameTitle>
            {/* "7 questions": the list row's line for this game, without its minutes. */}
            <div className="dd-hd-sub">{t("dd.hook.daily7").split("·")[0].trim()}</div>
          </div>
          <StreakChip streak={dailyDone.streak} isArchive={!!result.dailyArchive} />
        </div>
      ) : (
        /* Every other mode: the back arrow alone, in the same row and at the
           same size, so the card starts where the Daily 7's does. */
        <div className="dd-hd">
          <button type="button" className="back-btn" onClick={onHome} aria-label={t("quiz.backHome")}>←</button>
        </div>
      )}

      {/* THE DAILY 7 ENDS ON A CARD (22 Nov 2026, components/ResultCard.jsx):
          the score, the standing and the seven questions as one object, drawn
          by the finish panel below because it holds the day's numbers. Every
          other mode's card is drawn here (25 Nov 2026; quizCard above). */}
      {quizCard && (
        <ResultCard title={quizCard.title} tag={quizCard.tag} badge={quizCard.badge} score={result.score} outOf={quizCard.outOf}
          scoreNode={<CountUp value={result.score} duration={900} delay={200} triggerHaptic />}
          verdict={quizCard.verdict} xp={xpEarned} marks={quizCard.marks} note={quizCard.note} action={quizShare} />
      )}

      {result.winner && (
        <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:6, margin:"14px 0", fontSize:15, fontWeight:700, color:"var(--gold)"}}><Trophy size={16} strokeWidth={2.4} aria-hidden="true" />{rich(t("rs.wins"), { name: result.winner })}</div>
      )}

      {/* Daily 7: the return loop, one component for all the dailies
          (components/DailyDone.jsx); the edition is the day index. Since 24 Nov
          2026 it asks for the panel's "one" layout, as Footle does: the card
          carries Share (it was a solid green button under the card), and under
          it sit one caption line and the other dailies as one list. */}
      {cardFinish && (
        <DailyDone game="daily7" edition={result.dailyEdition ?? dayIndexForDate(new Date())} isArchive={!!result.dailyArchive} won bucket={result.score}
          streak={dailyDone.streak} onShare={onShare} remind={dailyDone.remind} nextUp={dailyDone.nextUp} day={dailyDone.day}
          save={dailyDone.save} track={dailyDone.track} promoted={dailyDone.promoted} card={dailyCard} layout="one" />
      )}
      {/* The profile-picture nudge sat between the back arrow and the card.
          It is after the finish now, with the other quiet asks. */}
      {cardFinish && photoNudge}

      {isDaily ? (
        cardFinish ? (
          <>
            {/* The way out, as Footle's quiet filled pill; then the review of what got you. */}
            <ResultFoot onHome={onHome} pill />
            <WrongAnswersReview wrongAnswers={wrongAnswers} allAnswers={result.allAnswers} onReport={onReport} mode={mode} />
            {/* The same way out again under the last missed question (25 Nov
                2026): after a long list the first pill is screens above, and
                the bottom of the page had no exit. Only with a list to scroll. */}
            {wrongAnswers?.length > 0 && <ResultFoot onHome={onHome} pill />}
          </>
        ) : (
          <>
            <WrongAnswersReview wrongAnswers={wrongAnswers} allAnswers={result.allAnswers} onReport={onReport} mode={mode} />
            <ResultFoot onHome={onHome} />
          </>
        )
      ) : (
        <>
          {/* One caption line, then one filled list: what to play next. Nothing
              here is outlined and nothing is solid green: the card is the one
              loud thing. */}
          <section className="dd-one">
            <CardDeltaRow d={cardDelta} />
            {nextRows.length > 0 && <div className="dd-list rs-list">{nextRows}</div>}
          </section>
          {/* The profile-picture nudge, with the other quiet asks after the result.
              ⚠️ AFTER the game, never before it. Alex asked for a nudge to set a
              profile picture "the first time they open the app"; the measurement
              argued it down to here and he agreed. 36.2% of accounts never play
              a single game, and the five-star sign-up blocker was LITERALLY a
              mandatory step in that same gap — the username wall rejecting Apple
              and Google's own pre-filled names. Another step before the first
              game is the same bet, placed again. Here they have just finished
              something, there is a score to attach a face to, and it costs zero
              activation. */}
          {photoNudge}
          {/* The way out, as the other finishes' quiet filled pill; then the
              review of what got you, and the same way out again under a list. */}
          <ResultFoot onHome={onHome} pill />
          <WrongAnswersReview wrongAnswers={wrongAnswers} allAnswers={result.allAnswers} onReport={onReport} mode={mode} />
          {wrongAnswers?.length > 0 && <ResultFoot onHome={onHome} pill />}
        </>
      )}
      </div>{/* /.rd-mobile */}

      {/* ── desktop-web-refresh (Results #03): centered card. display:none <1024;
          revealed at desktop where .rd-mobile is hidden. Standalone PWA resets
          both so installed desktop shells keep the mobile results. ── */}
      <div className="rd-desktop">
        <div className="rd-card">
          {/* ⚠️ SURVIVAL IS NOT A ROUND. This card was added in the desktop
              refresh and inherited none of the survival handling the mobile
              results above had already worked out, so a sudden-death run ended
              on "Round complete · 0/1 · 0% accuracy · Tough round." — a
              denominator for a mode whose whole point is that there isn't one,
              and a first-timer's very first Survival death reading 0/1/0%/+0/0.
              The Daily tab now routes finished days straight into Survival, so
              this is a first impression, not an edge case.
              Every branch below mirrors a decision the mobile hero already
              made: no denominator, the run caption instead of a percentage
              tier, and the personal-best callout. */}
          {/* A zero is not a celebration here either (review C10). Mobile drops
              the green and the glow when the score is 0; this card kept a green
              eyebrow, a green radial-glow badge and a green tier line, so a
              Survival first-question death was congratulated on desktop and
              consoled on mobile. One modifier, so the two cannot diverge again. */}
          <div className={`rd-eyebrow${rdZero ? " is-zero" : ""}`}>{t(isSurvival ? "rs.runOver" : "rs.roundDone")}</div>
          <div className="rd-sub">{rdSubtitle}</div>
          {rdZero && <div className="rd-soft">{scoreCaption}</div>}
          <div className={`rd-badge${rdZero ? " is-zero" : ""}`}>
            <div className="rd-badge-score">
              {result.score}
              {!isSurvival && <span className="rd-badge-total">/{result.total}</span>}
            </div>
            {/* Mobile deliberately skips the percentage tagline for survival —
                the caption and the PB carry the moment, and a percentage of a
                run you died in is noise. Kept SHORT here rather than reusing
                mobile's full scoreCaption: this sits inside a circular badge,
                and the long form wrapped to two lines and pushed against the
                curve. The number already says how many; this says of what. */}
            <div className={`rd-badge-tier${rdZero ? " is-zero" : ""}`}>{isSurvival ? t("rs.inARow") : rdTier}</div>
          </div>
          {/* Dots are a per-question map of a fixed-length round. A survival run
              has no fixed length — a long one would spray dozens of them across
              the card — and the streak number is already the whole story. */}
          {!isSurvival && (
            <div className="rd-dots" aria-hidden="true">
              {rdDots.map((ok, i) => (
                <span key={i} className={`rd-dot ${ok ? "ok" : "no"}`}>{ok ? "✓" : "✗"}</span>
              ))}
            </div>
          )}
          {isNewPersonalBest && (
            <div className="rd-pb">
              <Star size={14} strokeWidth={2.4} aria-hidden="true" />
              <span>
                {t("rs.pb")}
                {isNewBest && classicBest ? t("rs.was", { n: classicBest })
                  : survivalNewBest && survivalBest ? t("rs.was", { n: survivalBest }) : ""}
              </span>
            </div>
          )}
          <div className="rd-tiles">
            {/* Accuracy on a sudden-death run is always "everything until the one
                that ended it", so it carries no information. What a survival
                player actually wants is the number to beat. */}
            {isSurvival ? (
              // "—" not "0" with no PB yet. A first run already shows +0 XP and
              // best streak 0; a third hard zero reads like the app failed to
              // record something rather than like a record waiting to be set.
              <div className="rd-tile"><div className="rd-tile-v">{survivalBest > 0 ? survivalBest : "—"}</div><div className="rd-tile-k">{t("rs.bestEver")}</div></div>
            ) : (
              <div className="rd-tile"><div className="rd-tile-v">{pct}%</div><div className="rd-tile-k">{t("home.rail.accuracy")}</div></div>
            )}
            <div className="rd-tile"><div className="rd-tile-v rd-amber">+{xpEarned}</div><div className="rd-tile-k">{t("rs.xpEarnedK")}</div></div>
            <div className="rd-tile"><div className="rd-tile-v rd-green">{rdBestStreak}</div><div className="rd-tile-k">{t("rs.bestStreak")}</div></div>
          </div>
          {isDaily && dailyDone && (
            <div style={{margin:"18px 0"}}>
              <DailyDone game="daily7" edition={result.dailyEdition ?? dayIndexForDate(new Date())} isArchive={!!result.dailyArchive} won bucket={result.score}
                streak={dailyDone.streak} onShare={onShare} remind={dailyDone.remind} nextUp={dailyDone.nextUp} day={dailyDone.day}
                save={dailyDone.save} track={dailyDone.track} promoted={dailyDone.promoted} />
            </div>
          )}
          <div className="rd-actions">
            {!isDaily && dailyOpen && onPlayDaily && (
              <button className="rd-btn rd-btn-primary" onClick={onPlayDaily}>{t("rs.playDaily")}</button>
            )}
            {!isDaily && !dailyOpen && footleOpen && (
              <button className="rd-btn rd-btn-primary" onClick={onPlayFootle}>{footleCta}</button>
            )}
            {!isDaily && <button className={`rd-btn ${(dailyOpen && onPlayDaily) || footleOpen ? "rd-btn-ghost" : "rd-btn-primary"}`} onClick={onRetry}>{t(isSurvival ? "rs.goAgain" : "rs.playAgain")}</button>}
            {!isDaily && <button className="rd-btn rd-btn-ghost" onClick={onShare}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M12 15V4M8 8l4-4 4 4"></path></svg>
              {t("rs.share")}
            </button>}
          </div>
          <button className="rd-exit" onClick={onHome}>{t("quiz.backHome")}</button>
        </div>
        {/* Same review loop as mobile — constrained to the rd-card column. */}
        <div style={{maxWidth:560, margin:"0 auto"}}>
          <WrongAnswersReview wrongAnswers={wrongAnswers} allAnswers={result.allAnswers} onReport={onReport} mode={mode} />
        </div>
      </div>
    </div>
  );
}


export default Results;
