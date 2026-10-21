import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Lock, Shirt, Shield, Type, Flame, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import GameTitle from '../components/GameTitle.jsx';
// Same kit the Trail takes (TransferTrail.jsx) — the scouting panel measured
// this file at ZERO haptic/sound/confetti: the hardest, longest-effort daily
// paid off with a mute green panel while Trail and Footle both celebrate.
// ⚠️ NO IMPORT FROM App.jsx: this screen also mounts as an island on the static
// /mystery-player/ page (src/islands/mystery.jsx). The kit arrives through
// `services` — src/games/dailyServices.js.
import { resolveDailyServices } from '../games/dailyServices.js';
import { DailyDone } from '../components/DailyDone.jsx';
import {
  rankPool, bandFor, HOT_SHARE, WARM_SHARE, matchGuess,
  mysteryDayIndex, mysteryNumber, buildMysteryShareText,
  saveMysteryResult, loadMysteryResult, computeMysteryStreak, hintPosition,
  explainGuess, reasonLine, clueLadder, CLUE_AFTER, paidCluesFromSave, topShare,
} from '../lib/mysteryPlayer.js';
import { careerOf, mainClub, spellYears } from '../lib/mysteryCareer.js';
import { usePlayerPool } from '../lib/usePlayerPool.js';
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from '../lib/playerSearch.js';
import { MODE_ACCENT, modeTint } from '../lib/accents.js';
import { dateToYMD } from '../lib/date.js';
import { useKeyboardAwareInput, useDropdownMaxHeight } from '../lib/useKeyboardAwareInput.js';
// The day's answer: from the schedule the SITE serves when an installed app
// has kept a good copy (lib/scheduleRemote.js), else the bundled schedule.
import { mysteryAnswerIds } from '../lib/scheduleRemote.js';
import ROLES from '../data/mysteryRoles.json';
import { t as tNow, useT, useLang } from '../i18n/index.js';
import './mystery.css';

/* ⚠️ `nat` IS NOT RELIABLY NATIONALITY — do not surface it without checking.
   Measured 2026-08-15 against the live pool:

     Lionel Messi     nat "Spain"   (Argentine)
     Vinícius Júnior  nat "Spain"   (Brazilian)
     James Rodríguez  nat "Spain"   (Colombian)

   It collapses toward the CLUB's country for a large share of records —
   `nat === country` holds for 5,277 of 8,489 entries (62%). Separately, 687
   players read "United Kingdom" and ZERO read England / Scotland / Wales /
   Northern Ireland, because Wikidata P27 is citizenship, not the footballing
   nation (P1532).

   Since the rebuild of 14 Oct 2026 it is not shown anywhere on this screen
   and no longer moves a rank either (lib/mysteryPlayer.js): a rank the
   reasons line cannot explain is exactly what the play-tester complained of. */

// Mystery Player — guess the secret footballer. Every guess returns a RANK
// against the whole pool; the answer is 1. Under each guess, one line says why
// it sits there: the clubs it shares with the answer, the same position, the
// era. The ranking pays for those three things and nothing else, so the rank
// and its line always agree.
//
// ⚠️ The ranking is computed ONCE per puzzle and memoised. Ranking nine
// thousand players is cheap, but doing it inside the guess handler would redo
// it on every keystroke of an autocomplete.

/**
 * ⚠️ THE ONLY FEEDBACK A GUESS GAVE WAS A BARE INTEGER (1.7.0 design review).
 * A word, a magnitude and a denominator fixed that; the rebuild adds the
 * fourth thing, the reason.
 * The words are mp.win / mp.hot / mp.warm / mp.cold in src/i18n/en.js.
 */
const bandWord = (t, band) => t(`mp.${band}`);

/**
 * How full the proximity bar is, 0..1. LOG-SCALED: ranks run 1..poolSize and
 * the interesting range is at the bottom; linear would draw rank 40 and rank
 * 900 as the same sliver.
 */
function closeness(rank, poolSize) {
  if (!(rank > 0) || !(poolSize > 1)) return 0;
  if (rank <= 1) return 1;
  return Math.max(0, 1 - Math.log(rank) / Math.log(poolSize));
}

const BAND_STYLE = {
  win:  { bg: 'rgba(88,204,2,0.16)',  bd: 'var(--accent)', fg: 'var(--grn-soft)' },
  hot:  { bg: 'rgba(88,204,2,0.10)',  bd: 'rgba(88,204,2,0.45)', fg: 'var(--grn-soft)' },
  warm: { bg: 'rgba(255,193,7,0.10)', bd: 'rgba(255,193,7,0.40)', fg: 'var(--gold)' },
  cold: { bg: 'var(--s1)',            bd: 'var(--border)', fg: 'var(--t2)' },
};

// The clue rungs, before the answer has loaded and once it has. The first two
// are free from guess one (the warm start, lib/mysteryPlayer.js). A rung's
// label is printed from its key (mp.position … in src/i18n/en.js), so it is
// the same word before and after the answer loads, in either language.
const CLUE_ICON = { position: Shirt, born: Calendar, club: Shield, initials: Type };
const CLUE_PLACEHOLDER = [
  { key: 'position', after: 0, free: true },
  { key: 'born', after: 0, free: true },
  { key: 'club', after: CLUE_AFTER[0], free: false },
  { key: 'initials', after: CLUE_AFTER[1], free: false },
];

export default function MysteryPlayer({ onExit, date = new Date(), services, embedded = false }) {
  const t = useT();
  // Ranks are grouped the language's way (3,571 / 3571); English keeps the
  // device default it always had.
  const lang = useLang();
  const num = (v) => (lang === 'en' ? v.toLocaleString() : v.toLocaleString(lang));
  const { haptic, playSound, Confetti, GetAppCTA, dailyDone } = resolveDailyServices(services);
  // `date` drives EVERYTHING dated in here — the answer, the saved result, the
  // puzzle number — so an archive replay of yesterday reads and writes
  // yesterday's slot and cannot overwrite today's board.
  const dayIndex = mysteryDayIndex(date);
  const isArchive = dayIndex !== mysteryDayIndex();
  // Best first: the kept site copy's id, then the bundled one. Read once per
  // day, so a fetch landing mid-game never swaps the answer under the board.
  const answerIds = useMemo(() => mysteryAnswerIds(dayIndex), [dayIndex]);
  // The pool and the careers it is ranked against arrive on the first focus of
  // the guess box (usePlayerPool) — ~700 KB gzipped that a visitor who only
  // reads the static page never needs. Until then `answer` and `ranks` are
  // null and the board renders its header, rules and an empty guess box; the
  // "no puzzle today" fallback below waits for `ready` so a loading pool is
  // never mistaken for a missing schedule.
  const { pool: POOL, careers: CAREERS, ready, ensure: ensureData } = usePlayerPool({ careers: true });
  // The first id this build's pool holds: a player added to the pool after
  // this build cannot be played here, so that one day falls back to the bundle.
  const answer = useMemo(() => {
    for (const id of answerIds) { const p = POOL.find((x) => x.id === id); if (p) return p; }
    return null;
  }, [POOL, answerIds]);
  const byId = useMemo(() => new Map(POOL.map((p) => [p.id, p])), [POOL]);

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
  // ⚠️ AND IN THE APP, EVERYONE, ON OPEN (16 Oct 2026): the starting clues
  // (position, birth decade) are read from the answer's pool record, and they
  // are the first thing a player should see. On the static page (`embedded`)
  // the data still waits for the guess box, for readers who never play.
  useEffect(() => {
    if (!embedded || saved?.guesses?.length || saved?.won || saved?.gaveUp) ensureData();
  }, [saved, ensureData, embedded]);
  const [text, setText] = useState('');
  const [guesses, setGuesses] = useState(() => saved?.guesses || []); // [{ id, name, club, rank, band }]
  // Rules collapse after the first guess but stay one tap away — the `?`.
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  // The last guess and the best rank before it: "warmer" or "colder" is said
  // against the player's OWN closest guess, not against nine thousand.
  const [last, setLast] = useState(null); // { id, rank, prevBest }
  const [won, setWon] = useState(() => !!saved?.won);
  // ⚠️ THE TERMINAL STATE THIS MODE NEVER HAD (added 2026-08-17): without a
  // give-up, the hardest daily was the one where not solving cost the streak.
  const [gaveUp, setGaveUp] = useState(() => !!saved?.gaveUp);
  const [giveUpArmed, setGiveUpArmed] = useState(false);
  const rootRef = useRef(null);
  // Clues revealed, in ladder order. Opt-in: a clue that has unlocked waits for
  // a tap, so help is never forced on someone still enjoying the hunt, and the
  // count on the result is the number the player chose to take.
  // Counts PAID clues only (club, initials); position and decade are free.
  // ⚠️ Saves from the older ladders count differently: paidCluesFromSave reads
  // them. New saves carry `clues: 3`.
  const [hintsUsed, setHintsUsed] = useState(() => paidCluesFromSave(saved));
  const [streak, setStreak] = useState(() => computeMysteryStreak());
  // ⚠️ Player-reported 2026-08-22: the keyboard sat on top of the board and the
  // page would not scroll. See lib/useKeyboardAwareInput.js.
  const { inputRef, kbInset, keepInputVisible } = useKeyboardAwareInput();
  const done = won || gaveUp;
  // Each guess inserts a row. Pull the field back into view rather than
  // dropping the keyboard — staying focused is what lets a player guess
  // repeatedly without re-tapping, which this mode depends on.
  useEffect(keepInputVisible, [guesses.length, done, keepInputVisible]);

  // ⚠️ RANK AND BAND ARE READ LIVE, NOT FROM THE SAVE. A saved row carries the
  // rank it was given; when the ranking changes (it did on 14 Oct 2026) a
  // returning player would see old numbers above new reasons. The save keeps
  // its numbers as a fallback for the moment before the pool has loaded.
  const rows = useMemo(() => {
    const live = guesses.map((g) => {
      const rank = ranks?.get(g.id) ?? g.rank;
      return { ...g, rank, band: ranks ? bandFor(rank, POOL.length) : g.band };
    });
    return live.sort((a, b) => a.rank - b.rank);
  }, [guesses, ranks, POOL.length]);

  // The clue ladder: position and birth decade free, then the club he gave
  // most years to after 4 guesses and his initials after 8. ⚠️ Never
  // nationality (see above), and never `answer.position` directly:
  // hintPosition prints only a checked role.
  // `lang`: the initials rung's "(one name)" is worded by clueLadder.
  const CLUES = useMemo(() => (answer && CAREERS ? clueLadder(answer, CAREERS, ROLES) : CLUE_PLACEHOLDER), [answer, CAREERS, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const PAID = CLUES.filter((c) => !c.free);
  const nextClue = PAID[hintsUsed];
  const clueReady = !done && !!answer && !!nextClue && guesses.length >= nextClue.after;
  const revealHint = () => {
    if (!clueReady) return;
    const next = hintsUsed + 1;
    setHintsUsed(next);
    haptic('select');
    // Persist immediately — a clue taken and then the tab closed must not come
    // back unspent, or the count on the result lies.
    saveMysteryResult(date, {
      won, gaveUp, guesses, hintsUsed: next, clues: 3, ...(isArchive ? { arc: 1 } : {}),
    });
  };

  /* Ranked autocomplete. The scorer lives in lib/playerSearch.js because
     Transfer Trail uses the SAME one. */
  const suggestions = useMemo(
    () => rankPlayerSuggestions(POOL, text, { limit: SUGGEST_MAX, exclude: new Set(guesses.map((g) => g.id)) }),
    // POOL is a dependency now that it arrives after mount.
    [POOL, text, guesses],
  );

  // ⚠️ MUST STAY BELOW `suggestions` (a temporal-dead-zone crash took the
  // whole screen down in build 72 when it sat above). Space between the input
  // and the top of the keyboard; shared with Transfer Trail.
  const dropMax = useDropdownMaxHeight(inputRef, { gap: 26, kbInset });

  // The reveal: his senior career, oldest first, with the club the clue named.
  const career = useMemo(() => (answer && CAREERS ? careerOf(answer, CAREERS) : []), [answer, CAREERS]);
  const keyClub = useMemo(() => (answer && CAREERS ? mainClub(answer, CAREERS) : null), [answer, CAREERS]);

  if (ready && (!answer || !ranks)) {
    // No puzzle scheduled for today. The home card is gated on the same
    // condition, so this is a direct-navigation fallback.
    return (
      <div style={{ padding: "20px 0" }}>
        {onExit && (
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }}>
            <ArrowLeft size={20} /> {t('game.back')}
          </button>
        )}
        <p style={{ color: 'var(--t2)', marginTop: 20 }}>{t('mp.none')}</p>
      </div>
    );
  }

  // ⚠️ GIVE UP IS GATED ON REAL ENGAGEMENT: the streak ticks on a give-up, so
  // an ungated button would be a one-tap way to farm it.
  const GIVE_UP_AFTER = 5;
  const canGiveUp = !done && guesses.length >= GIVE_UP_AFTER;

  // ⚠️ GIVING UP TAKES TWO TAPS AND LANDS ON THE ANSWER. One tap ended the
  // day's puzzle, and the reveal was drawn above the screen: the player was
  // left at the bottom of their guess list (play-test, 14 Oct 2026).
  const giveUp = () => {
    if (done) return;
    if (!giveUpArmed) { setGiveUpArmed(true); return; }
    setGaveUp(true);
    // To the top of the game, not the page: on the static /mystery-player/ page
    // the game sits below the site's own header.
    try { if (rootRef.current?.scrollIntoView) rootRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* old WebView */ }
    saveMysteryResult(date, { won: false, gaveUp: true, guesses, hintsUsed, clues: 3, ...(isArchive ? { arc: 1 } : {}) });
    // Same archive guard as the win path: replaying an old puzzle must never
    // touch today's habit metrics.
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
    setGiveUpArmed(false); // a guess means they are still playing
    if (done || !player) return;
    if (guesses.some((g) => g.id === player.id)) { setError(t('mp.already', { name: player.name })); return; }
    const rank = ranks.get(player.id);
    const band = bandFor(rank, POOL.length);
    setLast({ id: player.id, rank, prevBest: rows.length ? rows[0].rank : null });
    const next = [{ id: player.id, name: player.name, club: player.club, rank, band }, ...rows]
      .sort((a, b) => a.rank - b.rank);
    setGuesses(next);
    setText('');
    setError('');
    const isWin = rank === 1;
    // The warmth signal, made physical: a near miss should not sound like a
    // shrug. Cold guesses stay silent so the signal is not flattened to noise.
    if (isWin) { haptic('hardCorrect'); playSound('correct'); }
    else if (rank <= 25) { haptic('correct'); playSound('correct'); }
    else { haptic('select'); playSound('soft'); }
    if (isWin) setWon(true);
    // Persist EVERY guess, not just the win.
    saveMysteryResult(date, { won: isWin, guesses: next, hintsUsed, clues: 3, ...(isArchive ? { arc: 1 } : {}) });
    if (isWin) {
      setStreak(computeMysteryStreak());
      // ⚠️ ARCHIVE PLAYS DO NOT COUNT toward the streak or XP; `attempts` is
      // guesses-to-solve, matching Footle and the Trail.
      if (!isArchive) {
        try {
          window.dispatchEvent(new CustomEvent('biq:daily-completed', {
            detail: { positive: true, game: 'mystery', won: true, attempts: next.length },
          }));
        } catch { /* best effort; never block the reveal */ }
      } else {
        try { window.dispatchEvent(new CustomEvent('biq:archive-completed', { detail: { game: 'mystery', ymd: dateToYMD(date) } })); } catch {}
      }
      try { if (rootRef.current?.scrollIntoView) rootRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch { /* old WebView */ }
    }
  };

  const onSubmitText = (e) => {
    e.preventDefault();
    if (!ready) { ensureData(); setError(t('mp.loadingList')); return; }
    const p = matchGuess(POOL, text);
    if (!p) { setError(t('mp.noSuch', { q: text.trim() })); return; }
    submit(p);
  };

  const best = rows.length ? rows[0].rank : null;

  // One share path for win and give-up. ⚠️ `date`, not today: an ARCHIVE win
  // must share under its own puzzle number. Dismissing the sheet REJECTS.
  const shareResult = async (w) => {
    const text = buildMysteryShareText({ number: mysteryNumber(date), guesses: rows, won: w, streak: w ? streak : 0 });
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: tNow('game.copiedShort') })); } catch {} }
    } catch { /* dismissed or blocked — nothing to recover */ }
  };
  // The header row is at its widest when CLOSEST is present; the title block
  // budgets itself down for it (see the note on the title below).
  const tight = !embedded && best !== null && !done;
  const revealPos = hintPosition(answer, ROLES);
  const n = guesses.length;
  return (
    <div ref={rootRef} className="mp" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: embedded ? '2px 0 8px' : '8px 4px' }}>
        {onExit && (
          <button onClick={onExit} aria-label={t('game.back')} className="back-btn">←</button>
        )}
        {/* ⚠️ THIS ROW HOLDS FIVE THINGS AND THE FIFTH ARRIVES LATE. CLOSEST
            only appears after the first guess, so once it is there the title
            steps down a size and the subtitle drops its tail. Nothing wraps,
            nothing truncates, nothing disappears (simulator, 2026-09-09). */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {!embedded && <GameTitle no={tight ? 0 : mysteryNumber(date)} style={tight ? { fontSize: 16 } : undefined}>Mystery Player</GameTitle>}
          <div style={{ fontSize: embedded ? 13.5 : 12.5, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(embedded || tight) && <span style={{ color: MODE_ACCENT.mystery, fontWeight: 800 }}>{t('game.no', { n: mysteryNumber(date) })}</span>}
            {tight ? '' : `${embedded ? ' · ' : ''}${t(embedded ? 'mp.unlimitedLc' : 'mp.unlimited')}`}{isArchive ? ` · ${t('mp.archive')}` : ''}
          </div>
        </div>
        {!done && (
          <button type="button" className="icon-btn" onClick={() => setShowRules((v) => !v)}
            aria-label={t('game.howTo')} aria-expanded={showRules} title={t('game.howTo')}
            style={{ marginRight: 8, color: MODE_ACCENT.mystery, borderColor: modeTint('mystery', 0.35) }}>?</button>
        )}
        {best !== null && !done && (
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('mp.closest')}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: BAND_STYLE[rows[0].band].fg }}>{num(best)}</div>
          </div>
        )}
      </div>

      {/* One line of rules is always visible; the full version is behind the ?. */}
      {!done && !showRules && n === 0 && (
        <p className="mp-intro">
          {t('mp.intro')}{' '}
          <strong style={{ color: MODE_ACCENT.mystery }}>{t('mp.lower')}</strong>
        </p>
      )}
      {!done && showRules && (
        <p className="mp-intro">
          {t('mp.rules', { a: CLUE_AFTER[0], b: CLUE_AFTER[1] })}{' '}
          <strong style={{ color: 'var(--t1)' }}>{t('mp.lower')}</strong>
        </p>
      )}

      {won && Confetti ? <Confetti /> : null}
      {done && !answer && (
        <p style={{ margin: '4px 0 14px', color: 'var(--t3)', fontSize: 13 }}>{t('mp.loadingAnswer')}</p>
      )}
      {/* THE REVEAL (rebuilt 14 Oct 2026). It used to be a name, a position, a
          club COUNT and a birth year: the play-tester's answer was a journeyman
          and the screen never showed who he had played for. Now it is the
          career, club by club with years, from the careers file. The club the
          second clue named is marked. Win and give-up share the card; only the
          tint and the first line differ — dressing a give-up as a success
          would make the win worth less. */}
      {done && answer && (
        <section className={`mp-reveal ${won ? 'is-win' : 'is-gaveup'}`} aria-label={t('mp.answer')}>
          <div className="mp-reveal-eyebrow">
            {t(won ? 'mp.solved' : 'mp.gaveUp', { count: n })}
            {hintsUsed > 0 ? ` · ${t('mp.clues', { count: hintsUsed })}` : ''}
          </div>
          <h2 className="mp-reveal-name">{won ? answer.name : t('mp.itWas', { name: answer.name })}</h2>
          <div className="mp-reveal-meta">
            {[revealPos ? revealPos.charAt(0).toUpperCase() + revealPos.slice(1) : null, answer.born ? t('mp.bornIn', { y: answer.born }) : null].filter(Boolean).join(' · ')}
          </div>
          {won && streak > 1 && (
            <div className="mp-reveal-streak"><Flame size={13} aria-hidden="true" />{t('mp.streak', { n: streak })}</div>
          )}
          {career.length > 0 && (
            <ol className="mp-career" aria-label={t('mp.career')}>
              {career.map((s, i) => (
                <li key={`${s.club}-${s.from}-${i}`} className={s.club === keyClub ? 'is-key' : undefined}>
                  <span className="mp-career-years">{spellYears(s)}</span>
                  <span className="mp-career-club">{s.club}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      {won && answer && (
        <div style={{ margin: '0 0 14px' }}>
          <DailyDone game="mystery" edition={mysteryNumber(date)} won bucket={n} isArchive={isArchive}
            streak={dailyDone?.streak || { count: streak, label: t('dd.l.mystery') }} onShare={() => shareResult(true)}
            remind={dailyDone?.remind} nextUp={dailyDone?.nextUp || []} day={dailyDone?.day} save={dailyDone?.save} GetAppCTA={GetAppCTA} track={dailyDone?.track} promoted={dailyDone?.promoted} />
        </div>
      )}
      {gaveUp && answer && (
        <div style={{ margin: '0 0 14px' }}>
          <DailyDone game="mystery" edition={mysteryNumber(date)} won={false} bucket={0} isArchive={isArchive}
            streak={dailyDone?.streak || { count: 0, label: t('dd.l.mystery') }} onShare={() => shareResult(false)}
            remind={dailyDone?.remind} nextUp={dailyDone?.nextUp || []} day={dailyDone?.day} save={dailyDone?.save} GetAppCTA={GetAppCTA} track={dailyDone?.track} promoted={dailyDone?.promoted} />
        </div>
      )}

      {!done && (
        <form onSubmit={onSubmitText} style={{ padding: '0 0 8px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 14px' }}>
            <Search size={17} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={text}
              onFocus={ensureData}
              onChange={(e) => { ensureData(); setText(e.target.value); setError(''); }}
              placeholder={t('mp.search')}
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              aria-label={t('mp.guessAria')}
              /* ⚠️ 16px is a HARD FLOOR — iOS auto-zooms on focusing any input
                 below it and WKWebView never restores the scale on blur. */
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '15px 0', fontSize: 16, color: 'var(--t1)', fontFamily: 'inherit' }}
            />
          </div>
          {(suggestions.length > 0 || (!ready && text.trim())) && (
            /* ⚠️ Bounded to the space the visual viewport reports, and
               scrollable inside it: the list floats over the keyboard, so page
               padding cannot reach it (Transfer Trail had the same defect). */
            <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 20, marginTop: 6, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 14, maxHeight: dropMax, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {!ready && text.trim() && (
                <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--t3)' }} role="status">{t('mp.loadingPlayers')}</div>
              )}
              {suggestions.map((p) => (
                /* Birth year then club: tells namesakes apart (the two
                   Ronaldos) without printing the unreliable nationality. */
                <button key={p.id} type="button" onClick={() => submit(p)}
                  // The keyboard stays up between guesses: refuse the focus change,
                  // the click still fires (Top 10 since 9 Oct, Trail since 12 Oct).
                  onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}
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

      {/* THE CLUE LADDER (14 Oct 2026; warm start 16 Oct). Four rungs in two
          rows, always in view so a stuck player can see help is coming and
          when. The top row is free from guess one: his position and the
          decade he was born in. The bottom row waits: a club he played for
          after 4 guesses, his initials after 8, each revealed by a tap. */}
      {!done && (
        <div className="mp-clues" role="group" aria-label={t('mp.clues')}>
          {CLUES.map((c) => {
            const Icon = CLUE_ICON[c.key] || Type;
            const i = PAID.indexOf(c);
            const label = t(`mp.${c.key}`);
            if (c.free) {
              return (
                <div key={c.key} className={`mp-clue ${c.value ? 'is-shown' : 'is-pending'}`}>
                  <span className="mp-clue-label"><Icon size={12} aria-hidden="true" />{label}</span>
                  <span className="mp-clue-value">{c.value || t('mp.whenStart')}</span>
                </div>
              );
            }
            const shown = i < hintsUsed;
            const isNext = i === hintsUsed && clueReady;
            const left = Math.max(0, c.after - n);
            if (shown) {
              return (
                <div key={c.key} className="mp-clue is-shown">
                  <span className="mp-clue-label"><Icon size={12} aria-hidden="true" />{label}</span>
                  <span className="mp-clue-value">{c.value}</span>
                </div>
              );
            }
            if (isNext) {
              return (
                <button key={c.key} type="button" className="mp-clue is-ready" onClick={revealHint}
                  onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}>
                  <span className="mp-clue-label"><Icon size={12} aria-hidden="true" />{label}</span>
                  <span className="mp-clue-value">{t('mp.tapReveal')}</span>
                </button>
              );
            }
            return (
              <div key={c.key} className="mp-clue is-locked" aria-label={`${label}: ${left > 0 ? t('mp.unlocksIn', { count: left }) : t('mp.readyAfter')}`}>
                <span className="mp-clue-label"><Lock size={11} aria-hidden="true" />{label}</span>
                <span className="mp-clue-value">{left > 0 ? t('mp.inN', { count: left }) : t('mp.readyNext')}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1, padding: `10px 0 ${24 + kbInset}px`, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* WARMER OR COLDER THAN YOUR OWN BEST (16 Oct 2026). A rank in the
            thousands says "hopeless"; measured against the player's closest
            guess so far it says which way they are going. The row it talks
            about carries the same outline. */}
        <div className="mp-trend" role="status" aria-live="polite">
          {!done && last && last.prevBest != null && last.rank !== 1 && (
            last.rank < last.prevBest
              ? <><TrendingUp size={14} aria-hidden="true" /><span>{t('mp.warmer')}</span></>
              : <><TrendingDown size={14} aria-hidden="true" /><span>{t('mp.colder', { r: num(last.prevBest) })}</span></>
          )}
        </div>
        {/* The key to the colours, where the guesses will stand (13 Oct 2026).
            ⚠️ IN SHARES, NOT RANKS: the pool's size is not known yet. */}
        {n === 0 && !done && (
          <div role="group" aria-label={t('mp.rankMeans')} style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.8 }}>
            {[
              ['win', t('mp.thePlayer'), t('mp.rank1')],
              ['hot', bandWord(t, 'hot'), t('mp.top', { n: Math.round(HOT_SHARE * 100) })],
              ['warm', bandWord(t, 'warm'), t('mp.top', { n: Math.round(WARM_SHARE * 100) })],
              ['cold', bandWord(t, 'cold'), t('mp.everyoneElse')],
            ].map(([band, word, range]) => (
              <div key={band} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 12, background: BAND_STYLE[band].bg, border: `1px dashed ${BAND_STYLE[band].bd}` }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: BAND_STYLE[band].fg }}>{word}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>{range}</span>
              </div>
            ))}
          </div>
        )}
        {rows.map((g) => {
          const st = BAND_STYLE[g.band];
          // WHY it is here: shared clubs, position, era. The same three things
          // the rank is computed from (lib/mysteryPlayer.js), so they agree.
          const why = g.rank === 1 ? t('mp.secret') : (answer && CAREERS ? reasonLine(explainGuess(byId.get(g.id), answer, CAREERS)) : '');
          return (
            <div key={g.id} className={`mp-guess${!done && last?.id === g.id && rows.length > 1 ? ' is-latest' : ''}`} style={{ background: st.bg, border: `1px solid ${st.bd}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mp-guess-name">{g.name}</div>
                {/* Each reason holds together, and the dot stays at the end of
                    the line it closes, so a wrap never starts a line with "·". */}
                {why && (
                  <div className="mp-guess-why">
                    {why.split(' · ').map((part, i, all) => (
                      <React.Fragment key={part}>
                        <span className="mp-why-part">{part}{i < all.length - 1 ? ' ·' : ''}</span>{i < all.length - 1 ? ' ' : ''}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <div className="mp-guess-bar" aria-hidden="true">
                  <div style={{ width: `${Math.round(closeness(g.rank, POOL.length || 1) * 100)}%`, background: st.fg }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: st.fg, fontVariantNumeric: 'tabular-nums' }}>{num(g.rank)}</div>
                {/* In proportion, not "of 9,030": see topShare. */}
                {POOL.length > 0 && g.rank > 1 && (
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{topShare(g.rank, POOL.length)}</div>
                )}
                <div style={{ fontSize: 10, fontWeight: 800, color: st.fg, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{bandWord(t, g.band)}</div>
              </div>
            </div>
          );
        })}

        {/* Below the guess list, not beside the input: a give-up at eye level
            competes with playing. */}
        {canGiveUp && (
          <button
            type="button"
            onClick={giveUp}
            style={{ marginTop: 10, alignSelf: 'center', background: 'none', border: 'none', color: giveUpArmed ? 'var(--t1)' : 'var(--t3)', fontSize: 13, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', padding: 8 }}
          >
            {t(giveUpArmed ? 'mp.giveUpArmed' : 'mp.giveUp')}
          </button>
        )}
      </div>
    </div>
  );
}
