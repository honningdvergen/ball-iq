import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, UserRoundSearch } from 'lucide-react';
// Same kit the Trail takes (TransferTrail.jsx) — the scouting panel measured
// this file at ZERO haptic/sound/confetti: the hardest, longest-effort daily
// paid off with a mute green panel while Trail and Footle both celebrate.
// ⚠️ NO IMPORT FROM App.jsx: this screen also mounts as an island on the static
// /mystery-player/ page (src/islands/mystery.jsx). The kit arrives through
// `services` — src/games/dailyServices.js.
import { resolveDailyServices } from '../games/dailyServices.js';
import {
  rankPool, bandFor, matchGuess, normaliseName,
  answerIdForDay, mysteryDayIndex, mysteryNumber, buildMysteryShareText,
  saveMysteryResult, loadMysteryResult, computeMysteryStreak,
} from '../lib/mysteryPlayer.js';
import { usePlayerPool } from '../lib/usePlayerPool.js';
import { rankPlayerSuggestions, suggestionSubtitle } from '../lib/playerSearch.js';
import { MODE_ACCENT, modeTint } from '../lib/accents.js';
import { dateToYMD, msToNextLocalMidnight, formatCountdown } from '../lib/date.js';
import { useKeyboardAwareInput, useDropdownMaxHeight } from '../lib/useKeyboardAwareInput.js';
import SCHEDULE from '../data/mysterySchedule.json';

/* ⚠️ `nat` IS NOT RELIABLY NATIONALITY — do not surface it without checking.
   Measured 2026-08-15 against the live pool:

     Lionel Messi     nat "Spain"   (Argentine)
     Vinícius Júnior  nat "Spain"   (Brazilian)
     James Rodríguez  nat "Spain"   (Colombian)

   It collapses toward the CLUB's country for a large share of records —
   `nat === country` holds for 5,277 of 8,489 entries (62%). Some of that is
   honest (1,321 Japanese players at Japanese clubs) but the marquee cases
   above are simply wrong. Separately, 687 players read "United Kingdom" and
   ZERO read England / Scotland / Wales / Northern Ireland, because Wikidata
   P27 is citizenship, not the footballing nation (P1532).

   The guess subtitle therefore shows birth year + club only, which still
   tells the two Ronaldos apart (1976 vs 1985) without asserting anything
   false.

   ⚠️ UPDATED 2026-08-17: the answer reveal used to print `nat` too, described
   here as "left alone deliberately". It no longer does — and neither does it
   print `club`, which turned out to be broken the same way (see the note above
   the reveal panels). A field being wrong "only sometimes" is still wrong on
   the one screen whose entire job is to tell the player the truth.
   ⚠️ The guess subtitle DOES still show `club`, and it carries the same defect.
   It is a lesser harm — a hint next to a name you chose, not the app stating a
   fact — but it is the same data and wants the same re-pull.

   ⚠️ Gameplay impact, not just cosmetic: similarity() scores nationality as a
   signal, so wherever `nat` is wrong the RANKS are wrong too. */

// Mystery Player — guess the secret footballer. Every guess returns a RANK
// against the whole pool; the answer is 1.
//
// ⚠️ The ranking is computed ONCE per puzzle and memoised. Ranking 1,539
// players is cheap, but doing it inside the guess handler would redo it on
// every keystroke of an autocomplete.

/**
 * ⚠️ THE ONLY FEEDBACK A GUESS GAVE WAS A BARE INTEGER.
 *
 * The 1.7.0 design review, playing it cold: Mystery Player answers a guess with
 * `8612` — no bar, no word, no pool size — on a mode Daily advertises as
 * "Warmer or colder". The row colour was already banded, but a COLD row is
 * neutral by design, so the common case really was a number on a grey card.
 * It is also the number a first-time player is least equipped to read: a famous
 * keeper ranking past 1000 read as the game being broken rather than as him
 * simply being unlike the answer.
 *
 * Three things fix it, and all three ride on `bandFor`, which already existed:
 * a word, a magnitude, and a denominator.
 */
const BAND_WORD = { win: 'that\u2019s it', hot: 'boiling', warm: 'warm', cold: 'cold' };

/**
 * How full the proximity bar is, 0..1.
 *
 * ⚠️ LOG-SCALED, NOT LINEAR. Ranks run 1..poolSize over a few thousand players
 * and the interesting range is entirely at the bottom: linear would render
 * rank 40 and rank 900 as the same sliver of bar, which is precisely the
 * distinction a player is trying to read. On a log scale rank 1 is full, rank
 * 40 still shows real progress, and the long cold tail compresses.
 */
function closeness(rank, poolSize) {
  if (!(rank > 0) || !(poolSize > 1)) return 0;
  if (rank <= 1) return 1;
  return Math.max(0, 1 - Math.log(rank) / Math.log(poolSize));
}

const BAND_STYLE = {
  win:  { bg: 'rgba(88,204,2,0.16)',  bd: '#58CC02', fg: '#8AE042' },
  hot:  { bg: 'rgba(88,204,2,0.10)',  bd: 'rgba(88,204,2,0.45)', fg: '#8AE042' },
  warm: { bg: 'rgba(255,193,7,0.10)', bd: 'rgba(255,193,7,0.40)', fg: '#FFC107' },
  cold: { bg: 'var(--s1)',            bd: 'var(--border)', fg: 'var(--t2)' },
};

export default function MysteryPlayer({ onExit, date = new Date(), services }) {
  const { haptic, playSound, Confetti, GetAppCTA } = resolveDailyServices(services);
  // `date` drives EVERYTHING dated in here — the answer, the saved result, the
  // puzzle number — so an archive replay of yesterday reads and writes
  // yesterday's slot and cannot overwrite today's board.
  const dayIndex = mysteryDayIndex(date);
  const isArchive = dayIndex !== mysteryDayIndex();
  const answerId = answerIdForDay(SCHEDULE, dayIndex);
  // The pool and the careers it is ranked against arrive on the first focus of
  // the guess box (usePlayerPool) — ~700 KB gzipped that a visitor who only
  // reads the static page never needs. Until then `answer` and `ranks` are
  // null and the board renders its header, rules and an empty guess box; the
  // "no puzzle today" fallback below waits for `ready` so a loading pool is
  // never mistaken for a missing schedule.
  const { pool: POOL, careers: CAREERS, ready, ensure: ensureData } = usePlayerPool({ careers: true });
  const answer = useMemo(() => POOL.find((p) => p.id === answerId) || null, [POOL, answerId]);

  // Rank the pool once per puzzle, not per keystroke.
  const ranks = useMemo(
    () => (answer && CAREERS ? rankPool(POOL, answer, CAREERS) : null),
    [POOL, CAREERS, answer],
  );

  // Restore today's game. Without this a refresh — or backgrounding the PWA
  // long enough for iOS to evict it — silently wipes a solved puzzle, and the
  // player cannot re-solve it because they already know the answer.
  const saved = useMemo(() => loadMysteryResult(date), [date]);
  // A returning player — guesses on the board, or a finished puzzle whose
  // reveal needs the answer's name — gets the data straight away rather than
  // on a focus that may never come.
  useEffect(() => {
    if (saved?.guesses?.length || saved?.won || saved?.gaveUp) ensureData();
  }, [saved, ensureData]);
  const [text, setText] = useState('');
  const [guesses, setGuesses] = useState(() => saved?.guesses || []); // [{ id, name, club, rank, band }]
  // Rules collapse after the first guess (they occupied ~90pt of a game
  // screen) but stay one tap away — see the `?` in the header.
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [won, setWon] = useState(() => !!saved?.won);
  // ⚠️ THE TERMINAL STATE THIS MODE NEVER HAD (added 2026-08-17).
  // Mystery has no lose condition — guesses are unlimited — so until now the
  // ONLY way it ended was a solve. Consequences, both measured:
  //   · a scores row meant SOLVED, so "1 play ever" was really "1 SOLVE ever"
  //     and we had no measurement of how many people opened it and stopped;
  //   · it was the one daily mode where failing to solve cost you the streak,
  //     while A0 deliberately ticks Footle and Trail on ANY completion, win or
  //     loss. The hardest of the four modes had the harshest rule.
  // `gaveUp` gives it the `done` that Trail and Footle already have.
  const [gaveUp, setGaveUp] = useState(() => !!saved?.gaveUp);
  // ⚠️ Player-reported 2026-08-22: a friend guessed Cahill, was ranked #5, and
  // then "could not get any lower". Rank alone is a dead end — it tells you
  // that you are close without telling you which direction to move, so a
  // stuck player's only remaining options were guessing blindly or giving up.
  // Opt-in, one at a time: the player asks for help, help is never forced on
  // someone still enjoying the hunt.
  const [hintsUsed, setHintsUsed] = useState(() => saved?.hintsUsed || 0);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(() => computeMysteryStreak());
  // ⚠️ Player-reported 2026-08-22: the keyboard sat on top of the board and the
  // page would not scroll. Same root as Trail's two reports — every guess adds
  // a row and pushes the field down, iOS only scrolls a field into view when it
  // GAINS focus, and the shrunken viewport then reads as scroll-locked. This
  // mode had NO handling at all. See lib/useKeyboardAwareInput.js.
  const { inputRef, kbInset, keepInputVisible } = useKeyboardAwareInput();
  const done = won || gaveUp;
  // ⚠️ Alex, device-testing 2026-08-23: "we need a result screen here then until
  // the next mystery player loads you know". The result screen already existed —
  // he had never SEEN it, because a temporal-dead-zone crash took the whole
  // screen down before it could render. What was genuinely missing is the
  // second half: how long until there is a new one.
  // Ticks per minute, not per second: the wait is measured in hours, and a
  // second hand would re-render sixty times to say the same thing.
  const [nextIn, setNextIn] = useState(() => msToNextLocalMidnight());
  useEffect(() => {
    if (!done) return undefined;
    setNextIn(msToNextLocalMidnight());
    const t = setInterval(() => setNextIn(msToNextLocalMidnight()), 60000);
    return () => clearInterval(t);
  }, [done]);
  // Each guess inserts a row above the field. Pull it back into view rather
  // than dropping the keyboard — staying focused is what lets a player guess
  // repeatedly without re-tapping, which this mode depends on.
  useEffect(keepInputVisible, [guesses.length, done, keepInputVisible]);

  // ⚠️ HINTS DELIBERATELY AVOID `nat` AND `club`. Both come from Wikidata P27
  // (citizenship, not footballing nation) and are wrong often enough that the
  // reveal panel stopped printing them — today's own pool has Tim Cahill as
  // "Samoa". A hint the player cannot trust is worse than no hint, because it
  // sends them confidently in the wrong direction.
  //
  // These three are the fields the reveal panel already stands behind, ordered
  // least- to most-revealing: what he does, roughly when, then a number that
  // narrows hard.
  const HINTS = useMemo(() => {
    if (!answer) return [];
    const out = [];
    const pos = answer.position || answer.slot;
    if (pos) out.push({ label: 'Position', text: `The answer is a ${String(pos).toLowerCase()}.` });
    if (answer.born) out.push({ label: 'Era', text: `Born in the ${Math.floor(answer.born / 10) * 10}s.` });
    if (answer.clubCount > 0) {
      out.push({ label: 'Clubs', text: `Played for ${answer.clubCount} clubs.` });
    }
    return out;
  }, [answer]);
  // Unlocks BEFORE the give-up option (5). A player who is stuck should meet
  // help first and surrender second, not the other way round.
  const HINTS_AFTER = 3;
  const hintsAvailable = !done && guesses.length >= HINTS_AFTER && hintsUsed < HINTS.length;
  const revealHint = () => {
    const next = Math.min(hintsUsed + 1, HINTS.length);
    setHintsUsed(next);
    haptic('select');
    // Persist immediately — a hint taken and then the tab closed must not come
    // back unspent, or the count in the result panel lies.
    saveMysteryResult(date, {
      won, gaveUp, guesses, hintsUsed: next, ...(isArchive ? { arc: 1 } : {}),
    });
  };


  // Autocomplete over the pool. Capped — a 1,539-item list is unusable, and
  // showing everything on an empty box invites scrolling instead of typing.
  /* Ranked autocomplete. The scorer lives in lib/playerSearch.js because
     Transfer Trail uses the SAME one — two copies would drift the first time
     either was touched, which is this codebase's most repeated failure. */
  const suggestions = useMemo(
    () => rankPlayerSuggestions(POOL, text, { exclude: new Set(guesses.map((g) => g.id)) }),
    // POOL is a dependency now that it arrives after mount: without it, the
    // first word typed while the pool was loading showed nothing until the
    // next keystroke (measured on the local build, 2026-09-05).
    [POOL, text, guesses],
  );

  // ⚠️ MUST STAY BELOW `suggestions`. This block first went in ABOVE it, and
  // the dependency array `[suggestions.length, …]` is evaluated during render —
  // so it read a `const` declared 48 lines later and threw "Cannot access
  // 'suggestions' before initialization" on EVERY render. Mystery Player was
  // dead in build 72; the error boundary added the same day is the only reason
  // it showed a recoverable screen instead of taking the app down.
  //
  // Fourth temporal-dead-zone bug in this codebase and the second I have
  // caused. ESLint does not catch it: the identifier IS defined, just later,
  // so no-undef stays quiet and exhaustive-deps only warns.
  //
  // Space between the input and the top of the keyboard. visualViewport.height
  // already excludes the keyboard, so no guess about its height is needed.
  // Shared with Transfer Trail — see useDropdownMaxHeight.
  const dropMax = useDropdownMaxHeight(inputRef, { gap: 26, kbInset });

  if (ready && (!answer || !ranks)) {
    // No puzzle scheduled for today. The home card is gated on the same
    // condition, so this is a direct-navigation fallback rather than a state
    // a player reaches by tapping.
    return (
      <div style={{ padding: "20px 0" }}>
        {onExit && (
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }}>
            <ArrowLeft size={20} /> Back
          </button>
        )}
        <p style={{ color: 'var(--t2)', marginTop: 20 }}>No Mystery Player today — check back tomorrow.</p>
      </div>
    );
  }

  // ⚠️ GIVE UP IS GATED ON REAL ENGAGEMENT, not available from guess zero.
  // The streak now ticks on a give-up, so an ungated button would be a one-tap
  // way to farm it — strictly worse than the win-only rule it replaces. Footle
  // sets the precedent for where the line sits: its streak ticks after six
  // guesses however poor they were, so the bar is "a genuine attempt", not
  // "a good one". Five is the same order of magnitude for a mode with
  // unlimited guesses.
  const GIVE_UP_AFTER = 5;
  const canGiveUp = !done && guesses.length >= GIVE_UP_AFTER;

  const giveUp = () => {
    if (done) return;
    setGaveUp(true);
    saveMysteryResult(date, { won: false, gaveUp: true, guesses, hintsUsed, ...(isArchive ? { arc: 1 } : {}) });
    // Same archive guard as the win path and for the same reason: replaying an
    // old puzzle must never touch today's habit metrics.
    if (!isArchive) {
      try {
        window.dispatchEvent(new CustomEvent('biq:daily-completed', {
          detail: { positive: false, game: 'mystery', won: false, attempts: guesses.length },
        }));
      } catch { /* best effort; never block the reveal */ }
    } else {
      try { window.dispatchEvent(new CustomEvent('biq:archive-completed', { detail: { game: 'mystery', ymd: dateToYMD(date) } })); } catch {}
    }
  };

  const submit = (player) => {
    if (done || !player) return;
    if (guesses.some((g) => g.id === player.id)) { setError(`You already guessed ${player.name}.`); return; }
    const rank = ranks.get(player.id);
    const band = bandFor(rank, POOL.length);
    // Newest guess first, but the LIST stays sorted by rank so a player can
    // see how close they are getting without re-reading everything.
    const next = [{ id: player.id, name: player.name, club: player.club, rank, band }, ...guesses]
      .sort((a, b) => a.rank - b.rank);
    setGuesses(next);
    setText('');
    setError('');
    const isWin = rank === 1;
    // The warmth signal, made physical. Rank IS the game — a guess landing
    // hot deserves a different pulse than a cold one, and the win gets the
    // same hardCorrect + confetti the Trail earns. Cold guesses stay silent
    // on purpose: every guess buzzing would flatten the signal into noise.
    // ⚠️ SOUND DEFAULTS ON FOR NATIVE IN 1.7.0 (App.jsx:8791), which is exactly
    // when this mode's silence starts being felt. Scouting report #4: App.jsx
    // carries 19 playSound calls and Trail / Mystery / Stadiums carried ZERO
    // between them. Paired with the haptics already here so the two channels
    // always agree — including the three-way split, which is the whole feel of
    // this mode: a near miss should not sound like a shrug.
    if (isWin) { haptic('hardCorrect'); playSound('correct'); }
    else if (rank <= 25) { haptic('correct'); playSound('correct'); }   // burning hot — you are close
    else { haptic('select'); playSound('soft'); }                       // registered, keep hunting
    if (isWin) setWon(true);
    // Persist EVERY guess, not just the win — a player who closes the tab
    // three guesses in should come back to those three guesses.
    saveMysteryResult(date, { won: isWin, guesses: next, hintsUsed, ...(isArchive ? { arc: 1 } : {}) });
    if (isWin) {
      setStreak(computeMysteryStreak());
      // ⚠️ Mystery shipped WITHOUT this and recorded nothing for its whole
      // life: no XP, no scores row, so a solved Mystery paid the player
      // nothing and the mode read as unplayed in every query. Exactly the
      // mistake TransferTrail.jsx's dispatch comment warns about.
      //
      // `attempts` is guesses-to-solve, matching how Footle and the Trail
      // report theirs, so the three daily modes stay comparable.
      // ⚠️ ARCHIVE PLAYS DO NOT COUNT. Solving an old puzzle must not tick the
      // streak or award XP — otherwise the archive becomes a way to farm a
      // streak and the number stops meaning "I showed up every day", which is
      // the entire point of it. NYT draws the same line for the same reason.
      // The board still fills in, because that IS a true record of the puzzle
      // being solved; only the habit metrics are protected.
      if (!isArchive) {
        try {
          window.dispatchEvent(new CustomEvent('biq:daily-completed', {
            detail: { positive: true, game: 'mystery', won: true, attempts: next.length },
          }));
        } catch { /* best effort; never block the reveal */ }
      } else {
        try { window.dispatchEvent(new CustomEvent('biq:archive-completed', { detail: { game: 'mystery', ymd: dateToYMD(date) } })); } catch {}
      }
    }
  };

  const onSubmitText = (e) => {
    e.preventDefault();
    if (!ready) { ensureData(); setError('Loading the player list — one moment.'); return; }
    const p = matchGuess(POOL, text);
    if (!p) { setError(`No player called "${text.trim()}" in today's pool.`); return; }
    submit(p);
  };

  const best = guesses.length ? guesses[0].rank : null;

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 6px' }}>
        {/* ⚠️ .back-btn, not a bare glyph. The touch target was already legal
            (hit44 supplies 44pt via ::after) — the defect was that this was
            the only back control in the app WITHOUT the chromed well, so the
            product shipped two different back buttons. */}
        {onExit && (
          <button onClick={onExit} aria-label="Back" className="back-btn">
            <ArrowLeft size={22} />
          </button>
        )}
        {/* ⚠️ THE MODE HAD NO COLOUR ON ITS OWN SCREEN. The Daily row sells
            Mystery in violet — tinted well, violet button, violet label — and
            then opening it landed on a neutral grey page that looked like any
            other. The promise and the room have to match, so the same well and
            the same accent come with it. */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginRight: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: modeTint('mystery', 0.12), border: `1px solid ${modeTint('mystery', 0.3)}`,
        }} aria-hidden="true">
          <UserRoundSearch size={19} strokeWidth={2.1} color={MODE_ACCENT.mystery} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.01em' }}>Mystery Player</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            <span style={{ color: MODE_ACCENT.mystery, fontWeight: 700 }}>No. {mysteryNumber(date)}</span>
            {' · '}unlimited guesses{isArchive ? ' · archive' : ''}
          </div>
        </div>
        {/* ⚠️ AVAILABLE FROM THE FIRST SECOND. This used to appear only after a
            guess had been made, which is backwards: the player who needs the
            rules is the one who has not played yet, and they had no way to
            dismiss the wall or bring it back. Footle's ? is always there. */}
        {!done && (
          <button type="button" className="icon-btn" onClick={() => setShowRules((v) => !v)}
            aria-label="How to play" aria-expanded={showRules} title="How to play"
            style={{ marginRight: 8, color: MODE_ACCENT.mystery, borderColor: modeTint('mystery', 0.35) }}>?</button>
        )}
        {best !== null && !done && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Closest</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: BAND_STYLE[guesses[0].band].fg }}>{best}</div>
          </div>
        )}
      </div>

      {/* ⚠️ SIXTY WORDS ON A VOID WAS THE FIRST THING A NEW PLAYER SAW. The
          rules did collapse — but only after guess one, so the person being
          decided got the wall and everyone else got the clean screen, exactly
          inverted. Now the load-bearing sentence is always visible as one line
          and the full explanation lives behind the ?, which is the pattern
          Footle already set. */}
      {!done && !showRules && guesses.length === 0 && (
        <p style={{ margin: '2px 0 14px', color: 'var(--t2)', fontSize: 13.5, lineHeight: 1.5 }}>
          Guess any player — each one is ranked by similarity.{' '}
          <strong style={{ color: MODE_ACCENT.mystery }}>Lower is closer: the secret player is rank 1.</strong>
        </p>
      )}
      {!done && showRules && (
        <p style={{ margin: '2px 0 12px', color: 'var(--t2)', fontSize: 13.5, lineHeight: 1.5 }}>
          {/* ⚠️ THIS LINE READ "The secret player is 1." — a sentence that stops
              before it explains anything. It is trying to teach the rank scale:
              every guess gets a position, and the answer sits at 1. Without that
              spelled out the numbers look arbitrary, which is exactly how they
              landed on the first person to play it: a famous Brazilian keeper
              ranking past 1000 read as the game being broken rather than as him
              simply being unlike the answer. Say what the number means. */}
          Guess any player in a top-club squad. Each guess is ranked by how similar they are to the secret player — the clubs they have played for, their era, position, nationality, age and current club. <strong style={{ color: 'var(--t1)' }}>Lower is closer: the secret player is rank 1.</strong>
        </p>
      )}

      {/* ⚠️ THE REVEAL NO LONGER PRINTS `club` OR `nat` (2026-08-17). Both are
          wrong often enough that stating them as fact was misinforming players
          on the one screen that exists to tell them the truth.
          · `nat` was already documented at the top of this file — Messi,
            Vinícius and James Rodríguez all read "Spain".
          · `club` broke the same way: four distinct QIDs render as the label
            "Barcelona". Q1492 is the CITY (Edwin van der Sar, who never played
            in Spain, and he was the answer the day this was found); Q172803 is
            a CROATIAN club carrying 23 players. `country` is what exposes it.
          ⚠️ The CAREER data is NOT a safe substitute — it shares the dictionary
          and the same defect: van der Sar's career literally reads
          "Barcelona 1990-1999" where Ajax belongs.
          What is left is what survives checking: position, number of clubs (a
          COUNT, unaffected by the label bug) and birth year. Thin and true beats
          rich and wrong. Restore the fields when the pull is re-run with a P31
          class filter — see reference_wikidata_traps. */}
      {won && Confetti ? <Confetti /> : null}
      {done && !answer && (
        <p style={{ margin: '4px 0 14px', color: 'var(--t3)', fontSize: 13 }}>Loading today's answer…</p>
      )}
      {won && answer && (
        <div style={{ margin: '4px 0 14px', padding: '14px 16px', borderRadius: 14, background: 'rgba(88,204,2,0.12)', border: '1px solid rgba(88,204,2,0.4)' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#8AE042' }}>Got it — {answer.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>
            {answer.position || answer.slot} · {answer.clubCount > 0 ? `${answer.clubCount} clubs · ` : ''}born {answer.born}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}>
            Solved in <strong style={{ color: 'var(--t1)' }}>{guesses.length}</strong> {guesses.length === 1 ? 'guess' : 'guesses'}{hintsUsed > 0 ? ` · ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}` : ''}.
            {streak > 1 && <> · 🔥 <strong style={{ color: 'var(--t1)' }}>{streak}-day Mystery streak</strong></>}
          </div>
          <button
            type="button"
            onClick={async () => {
              // ⚠️ `date`, not today. Without it an ARCHIVE win shared
              // yesterday's board under today's puzzle number — the one number
              // in the message a reader would use to compare with their own.
              const text = buildMysteryShareText({ number: mysteryNumber(date), guesses, won: true, streak });
              try {
                // Native share sheet where there is one; clipboard otherwise.
                // Both paths are wrapped because a user dismissing the sheet
                // REJECTS, and an unhandled rejection here would surface as a
                // crash on a screen the player has just won.
                if (navigator.share) await navigator.share({ text });
                else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
              } catch { /* dismissed or blocked — nothing to recover */ }
            }}
            style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 12, background: 'var(--accent)', color: '#06230C', padding: '12px 16px', fontSize: 14.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? 'Copied!' : 'Share result'}
          </button>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--t3)', textAlign: 'center' }}>
            Next Mystery Player in <strong style={{ color: 'var(--t2)' }}>{formatCountdown(nextIn)}</strong>
          </div>
          {/* The island passes a phone-only app link here; the app passes nothing. */}
          {GetAppCTA ? <div style={{ marginTop: 12 }}><GetAppCTA /></div> : null}
        </div>
      )}

      {gaveUp && answer && (
        /* Deliberately NOT the green win panel. The player did not solve it, and
           dressing a give-up as a success is the kind of dishonest flourish that
           makes the win itself worth less. Neutral surface, same information. */
        <div style={{ margin: '4px 0 14px', padding: '14px 16px', borderRadius: 14, background: 'var(--s1)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--t1)' }}>It was {answer.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>
            {answer.position || answer.slot} · {answer.clubCount > 0 ? `${answer.clubCount} clubs · ` : ''}born {answer.born}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}>
            Gave up after <strong style={{ color: 'var(--t1)' }}>{guesses.length}</strong> {guesses.length === 1 ? 'guess' : 'guesses'}{hintsUsed > 0 ? ` · ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}` : ''}. Back tomorrow.
          </div>
          <button
            type="button"
            onClick={async () => {
              const shareText = buildMysteryShareText({ number: mysteryNumber(date), guesses, won: false, streak: 0 });
              try {
                if (navigator.share) await navigator.share({ text: shareText });
                else { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
              } catch { /* dismissed or blocked — nothing to recover */ }
            }}
            style={{ marginTop: 12, width: '100%', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--s2)', color: 'var(--t1)', padding: '12px 16px', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? 'Copied!' : 'Share result'}
          </button>
          {GetAppCTA ? <div style={{ marginTop: 12 }}><GetAppCTA /></div> : null}
        </div>
      )}

      {!done && (
        <form onSubmit={onSubmitText} style={{ padding: '0 16px 8px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 14px' }}>
            <Search size={17} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={text}
              onFocus={ensureData}
              onChange={(e) => { ensureData(); setText(e.target.value); setError(''); }}
              placeholder="Search a player"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              aria-label="Guess a player"
              /* ⚠️ 16px is a HARD FLOOR — iOS auto-zooms on focusing any input
                 below it and WKWebView never restores the scale on blur. */
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '15px 0', fontSize: 16, color: 'var(--t1)', fontFamily: 'inherit' }}
            />
          </div>
          {(suggestions.length > 0 || (!ready && text.trim())) && (
            /* ⚠️ SAME DEFECT AS TRANSFER TRAIL, found by grepping for the second
               implementation rather than waiting for a second report. This list
               is position:absolute with overflow:hidden and no height bound, so
               on a phone the keyboard covers most of it and there is nothing to
               scroll — the page has no content below it, because the list floats
               over the keyboard rather than sitting in the layout.
               Mystery already took both halves of useKeyboardAwareInput; the
               hook cannot help here, because kbInset pads the PAGE and this is
               not on the page. Bounded to the space the visual viewport actually
               reports, and scrollable inside it. */
            <div style={{ position: 'absolute', left: 16, right: 16, zIndex: 20, marginTop: 6, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 14, maxHeight: dropMax, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {!ready && text.trim() && (
                <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--t3)' }} role="status">Loading players…</div>
              )}
              {suggestions.map((p) => (
                /* The subtitle used to be p.club alone, which failed at the one
                   job it has. Searching "Ronaldo" offered "Cristiano Ronaldo —
                   Real Madrid" above "Ronaldo — Real Madrid": same label, two
                   different players, no way to tell which you were picking.
                   Wikidata gives every pool entry its truthy-rank club, so any
                   two team-mates past or present collide the same way.
                   Nationality and birth year separate them, and they lead here
                   ON PURPOSE — the row ellipsizes on a narrow phone, so the
                   club (least distinguishing, and by far the longest string:
                   "Real Madrid Club de Fútbol") is what gets eaten first. */
                <button key={p.id} type="button" onClick={() => submit(p)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: '100%', padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--t1)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)', fontWeight: 600, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {suggestionSubtitle(p)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {error && <div style={{ color: '#FF6B6B', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
        </form>
      )}

      {/* Hints sit between the input and the guess list — where a stuck player
          is already looking, and where they cannot be mistaken for part of the
          board. Revealed hints STAY on screen: making someone remember a clue
          they have already spent is its own small cruelty. */}
      {!done && (hintsUsed > 0 || hintsAvailable) && (
        <div style={{ margin: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HINTS.slice(0, hintsUsed).map((h) => (
            <div
              key={h.label}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 11,
                       background: 'var(--gold-l)', border: '1px solid rgba(255,193,7,0.28)' }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                             color: 'var(--gold)', flexShrink: 0 }}>{h.label}</span>
              <span style={{ fontSize: 13.5, color: 'var(--t1)' }}>{h.text}</span>
            </div>
          ))}
          {hintsAvailable && (
            <button
              type="button"
              onClick={revealHint}
              style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13,
                       fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 6 }}
            >
              {hintsUsed === 0 ? 'Stuck? Reveal a hint' : `Reveal another hint (${HINTS.length - hintsUsed} left)`}
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, padding: `10px 16px ${24 + kbInset}px`, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {guesses.length === 0 && !done && (
          <p style={{ color: 'var(--t3)', fontSize: 13, textAlign: 'center', marginTop: 26 }}>
            Your guesses appear here, closest first.
          </p>
        )}
        {guesses.map((g) => {
          const st = BAND_STYLE[g.band];
          return (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: st.bg, border: `1px solid ${st.bd}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>{g.club}</div>
                {/* The magnitude the number alone could not carry. */}
                <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }} aria-hidden="true">
                  <div style={{ width: `${Math.round(closeness(g.rank, POOL.length) * 100)}%`, height: '100%', borderRadius: 2, background: st.fg }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: st.fg, fontVariantNumeric: 'tabular-nums' }}>{g.rank}</div>
                {/* The denominator, so the number means something on sight, and
                    the word, so "warmer or colder" is finally true. */}
                {POOL.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>of {POOL.length.toLocaleString()}</div>
                )}
                <div style={{ fontSize: 10, fontWeight: 800, color: st.fg, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{BAND_WORD[g.band]}</div>
              </div>
            </div>
          );
        })}

        {/* Sits BELOW the guess list, not beside the input. A give-up offered at
            eye level next to the search box competes with playing; down here it
            is found by someone who has scrolled their guesses and decided. */}
        {canGiveUp && (
          <button
            type="button"
            onClick={giveUp}
            style={{ marginTop: 10, alignSelf: 'center', background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 8 }}
          >
            Give up and reveal
          </button>
        )}
      </div>
    </div>
  );
}
