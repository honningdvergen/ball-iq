// First-run onboarding — extracted from App.jsx on 2026-09-06 (review E16, brick 7).
import { supabase } from "../supabase.js";
import * as Sentry from "@sentry/react";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { haptic, loopEvent } from "../App.jsx";

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
// ONE step, shown once per device after auth. Persists:
//   biq_onboarded    — "1" once completed OR skipped
//
// It has been trimmed twice, both times by deleting a screen that talked ABOUT
// the app instead of being it:
//
//   1. A pure-copy "Welcome to Ball IQ" step (which also had no skip control).
//   2. A "How's your football knowledge?" self-assessment. Its entire payload
//      was seeding biq_settings.defaultDiff — a setting that already lives in
//      Settings, only affects Classic, and that people are bad at choosing for
//      themselves before they have played a single question. Everyone now
//      starts on medium (what skippers already got) and moves it once they have
//      an opinion worth having. Activation, not configuration, is the thing
//      this screen is fighting for: it sits between "opened the app" and
//      "played anything", which is exactly where our funnel leaks.
//
// What survives is a question, because a question is the product.
//
// Legacy note: biq_skill_level is no longer written. It is still in the
// sign-out clear list in useAuth.jsx so devices carrying the old value shed it.
//
// One easy, universally-fun taster so a brand-new player tastes the trivia
// within seconds — kept deliberately light (still fully skippable, no login).
// Reviewer-facing first impression (App Review sees this screen on every fresh
// install) — keep it 100% free of competition/tournament branding.
export const ONBOARD_SAMPLE = { q: "Who has scored the most goals in men's international football?", o: ["Lionel Messi", "Cristiano Ronaldo", "Pelé", "Neymar"], a: 1 };

// Whatever the player already did to index.html's pre-boot shell.
//
// ⚠️ READ, NEVER CONSUME. This deleted the value on read for one revision, on
// the reasoning that a second adoption would replay a stale tap. It does the
// opposite: StrictMode mounts, unmounts and REMOUNTS, and the remount gets a
// fresh ref — so mount #1 ate the pick and mount #2, the one that stays on
// screen, found nothing and rendered unanswered. Caught by driving a real
// browser; every unit assertion still passed, because both halves were
// individually correct and only their ORDER was wrong.
//
// Re-reading is harmless: the value describes a tap made seconds ago in this
// same page load, so adopting it twice adopts the same truth twice. The one
// thing that must not repeat is the side-effecting skip/start replay, which
// carries its own module-level latch below.
export function readPrebootPick() {
  try {
    return (typeof window !== 'undefined' ? window.__biqPreboot : null) || null;
  } catch { return null; }
}

// The skip/start replay writes localStorage, fires a funnel event and leaves
// the screen — once per page load, no matter how many times React mounts it.
export let prebootActReplayed = false;

export function OnboardingScreen({ onDone }) {
  // ⚠️ ADOPT THE TAP THE SHELL ALREADY TOOK.
  //
  // The pre-boot shell paints this exact screen from static HTML so LCP lands
  // at first paint instead of waiting for the lazy chunk — which means for the
  // seconds before this component exists, the player is looking at a real
  // onboarding question they can tap. They now CAN tap it (index.html answers
  // and records it); this is the other half, without which the answer would
  // vanish the instant React took over and the screen would reset to unanswered
  // in front of them — a worse bug than the dead tap, because it looks like the
  // app forgot.
  const prebootRef = useRef(null);
  if (prebootRef.current === null) prebootRef.current = readPrebootPick() || {};
  const [sampleAnswered, setSampleAnswered] = useState(
    typeof prebootRef.current.opt === 'number' ? prebootRef.current.opt : null,
  );

  const persistAndFinish = (startGame) => {
    try {
      localStorage.setItem("biq_onboarded", "1");
    } catch {}
    // The other end of the activation chain: onboard-done-answered vs
    // onboard-done-skipped → first-game-started (fired in the app shell).
    // Split by taster engagement because "answered the taster" is the
    // panel's hypothesis for what predicts a first game — now measurable.
    loopEvent(sampleAnswered !== null ? "onboard-done-answered" : "onboard-done-skipped");
    // Sprint #26 X2: persist to profile so the flag survives across devices.
    // Guest users (no signed-in session) stay local-only; the migration on
    // first sign-in propagates the local flag to their profile.
    try {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          supabase.from('profiles')
            .update({ onboarded_at: new Date().toISOString() })
            .eq('id', data.user.id)
            .then(({ error }) => {
              // Local storage already carries the flag, so there is nothing to
              // roll back and nothing worth interrupting the player for — but
              // it must not vanish. A silent failure here costs them a second
              // onboarding on their next device.
              if (error) {
                console.warn('[onboarding] onboarded_at write failed', error.message || error);
                Sentry.captureException(error, { tags: { area: 'onboarding-flag', site: 'onboard-done' } });
              }
            })
            .catch((e) => Sentry.captureException(e, { tags: { area: 'onboarding-flag', site: 'onboard-done' } }));
        }
      });
    } catch {}
    onDone?.(startGame === true);
  };

  // Both controls now do the same thing, and that is the point: with a single
  // step there is no flow left to skip THROUGH, only one to leave. Skip is kept
  // so a player who does not want to answer is never trapped.
  // persistAndFinish() writes biq_onboarded + profiles.onboarded_at, so neither
  // path is ever re-prompted.
  // ⚠️ "LET'S PLAY" MUST ACTUALLY PLAY SOMETHING.
  // Measured 2026-09-01: 48% of the last 30 days' accounts never played a
  // single game, and the web funnel says the drop is not a wall — 18 reached
  // acct-home and only 5 ever started (`home → first-play: NOT blocked, they
  // saw the app and did not start`). Watching it as a stranger showed why.
  // Onboarding spends three interactions building intent — asks a real
  // question, marks it right, says "Nice — you're a natural" — then the button
  // labelled "Let's play" dismissed to a Home screen offering FOURTEEN
  // choices, and asked them to decide all over again. The momentum died on a
  // menu.
  // So an ANSWERED sample now hands the player straight into Footle, which is
  // where the habit actually forms: 94% of players who reach three active days
  // got there through Footle (62 of 66). Skip still goes to Home untouched —
  // someone who declined to answer has told us they want to look around, and
  // launching a game at them would be the opposite of listening.
  const next = () => {
    haptic("soft");
    persistAndFinish(sampleAnswered !== null);
  };
  const skip = () => {
    haptic("soft");
    persistAndFinish(false);
  };

  // They already pressed Skip or Start playing on the shell. Honour it instead
  // of showing them the screen they just dismissed and asking again.
  //
  // No haptic on this path: the tap happened seconds ago, so a buzz now reads
  // as the phone doing something on its own. The analytics stay honest because
  // sampleAnswered was seeded above — a player who answered AND pressed start
  // still counts as onboard-done-answered.
  //
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount;
  // persistAndFinish closes over the seeded sampleAnswered, which is what we want.
  //
  // ⚠️ The ARGUMENT is the whole point. persistAndFinish(startGame) ends with
  // `onDone?.(startGame === true)`, so calling it bare passed undefined,
  // `undefined === true` was false, and the shell path landed on Home — the
  // exact menu this change exists to bypass. The React path got the Footle
  // handoff; anyone quick enough to tap the shell (a ~0.9s window on 4G, ~8.6s
  // on Slow 3G — i.e. precisely the impatient cohort the shell was built for)
  // still had their momentum die on a menu. Mirror `next`/`skip` instead:
  // act 'start' + an answered sample starts the game, 'skip' correctly does not.
  useEffect(() => {
    if (!prebootRef.current?.act || prebootActReplayed) return;
    prebootActReplayed = true;
    persistAndFinish(prebootRef.current.act === 'start' && sampleAnswered !== null);
  }, []);

  return (
    <div className="onboard-wrap">
      <div className="onboard-viewport">
        <div className="onboard-track">
          {/* Taste it — one quick question (the casual hook). */}
          <div className="onboard-step">
            <div className="onboard-step-top">
              <div className="onboard-title" style={{ marginTop: 16 }}>Quick one — give it a go ⚽</div>
              <div className="onboard-body" style={{ marginBottom: 14 }}>{ONBOARD_SAMPLE.q}</div>
              <div className="onboard-sample-opts">
                {ONBOARD_SAMPLE.o.map((opt, i) => {
                  const answered = sampleAnswered !== null;
                  const isCorrect = i === ONBOARD_SAMPLE.a;
                  let cls = "onboard-sample-opt";
                  if (answered && isCorrect) cls += " correct";
                  else if (answered && sampleAnswered === i) cls += " wrong";
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={answered}
                      onClick={() => { haptic(isCorrect ? "heavy" : "soft"); setSampleAnswered(i); }}
                    >
                      {opt}
                      {/* Glyphs, not just colour (scouting panel, a11y): the green
                          and red states are indistinguishable for red-green colour
                          blindness — the same reason every .opt in the real quiz
                          carries its ✓. First thing a new player ever answers
                          should not be the one place feedback is colour-only. */}
                      {answered && isCorrect && <span aria-hidden="true"> ✓</span>}
                      {answered && !isCorrect && sampleAnswered === i && <span aria-hidden="true"> ✗</span>}
                    </button>
                  );
                })}
              </div>
              {/* ⚠️ THIS IS THE THREE SECONDS THAT DECIDE RETENTION, and it
                  was one line of grey-weight text. 36% of accounts never play a
                  single game, and this is the last thing they see before the
                  app opens — the review graded it as the app's weakest reward
                  moment and it was right.
                  A correct answer now lands: a green tick, accent ink, and a
                  short pop. The WRONG branch deliberately gets none of it — it
                  is a teaching moment, and dressing a miss up as a celebration
                  is the kind of false cheer that reads as condescending.
                  The global prefers-reduced-motion killswitch at the top of
                  app.css neutralises the animation without needing a rule here. */}
              <div className={`onboard-sample-fb${sampleAnswered === ONBOARD_SAMPLE.a ? " is-correct" : ""}`}>
                {sampleAnswered === null ? "" : (sampleAnswered === ONBOARD_SAMPLE.a
                  ? (<><span className="onboard-fb-tick" aria-hidden="true"><Check size={13} strokeWidth={3.5} /></span>Nice — you’re a natural</>)
                  : `It's ${ONBOARD_SAMPLE.o[ONBOARD_SAMPLE.a]} — the all-time record holder. You'll pick these up fast!`)}
              </div>
            </div>
            {/* The label is the exit, so it names the destination rather than
                a step number — there is no next step to go to. */}
            <div className="onboard-actions">
              <button className="onboard-skip" onClick={skip}>Skip</button>
              <button className="onboard-btn onboard-btn-inline" onClick={next}>{sampleAnswered === null ? "Start playing" : "Let's play"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



