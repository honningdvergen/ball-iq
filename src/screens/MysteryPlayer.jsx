import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, CircleHelp, Search } from 'lucide-react';
// Same kit the Trail takes (TransferTrail.jsx) — the scouting panel measured
// this file at ZERO haptic/sound/confetti: the hardest, longest-effort daily
// paid off with a mute green panel while Trail and Footle both celebrate.
// ⚠️ NO IMPORT FROM App.jsx: this screen also mounts as an island on the static
// /mystery-player/ page (src/islands/mystery.jsx). The kit arrives through
// `services` — src/games/dailyServices.js.
import { resolveDailyServices } from '../games/dailyServices.js';
import { DailyDone } from '../components/DailyDone.jsx';
import { StreakChip } from '../components/StreakChip.jsx';
import ResultFoot from '../components/ResultFoot.jsx';
import {
  rankPool, bandFor, matchGuess,
  mysteryDayIndex, mysteryNumber, buildMysteryShareText,
  saveMysteryResult, loadMysteryResult, computeMysteryStreak, puzzleYear, mysteryXp,
} from '../lib/mysteryPlayer.js';
import { careerOf, spellYears } from '../lib/mysteryCareer.js';
import {
  tileVerdicts, hintCards, heldHints, openRounds, hintsFromSave, saveHintFields, startersForDay, starterLine,
  primaryNation, flagOf, SLOT_WORD,
} from '../lib/mysteryRules.js';
import { loadMysteryRulesData, peekMysteryRulesData } from '../lib/mysteryRulesData.js';
import { photoView } from '../lib/photoCrop.js';
import { usePlayerPool } from '../lib/usePlayerPool.js';
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from '../lib/playerSearch.js';
import { MODE_ACCENT } from '../lib/accents.js';
import { dateToYMD } from '../lib/date.js';
import { useKeyboardAwareInput } from '../lib/useKeyboardAwareInput.js';
// The day's answer: from the schedule the SITE serves when an installed app
// has kept a good copy (lib/scheduleRemote.js), else the bundled schedule.
import { mysteryAnswerIds } from '../lib/scheduleRemote.js';
import { t as tNow, useT, fmtLocale } from '../i18n/index.js';
import '../i18n/en.js'; // the full English table: not on Home's eager path
import './mystery.css';
import ANSWER_IDS from "../data/mysteryAnswers.json";
import { GuessRow, HintStrip, HintSheet, CreditsSheet, Face, FlagImg } from './mysteryParts.jsx';

// Mystery Player — guess the secret footballer. Every guess returns a RANK
// against the whole pool; the answer is 1. Under each guess, four tiles say how
// it compares with the secret player (lib/mysteryRules.js tileVerdicts): a club
// both played for, the position, the nation and the birth year, each green
// (the same), yellow (close) or dark (different).
//
// THE PLAY SCREEN OF 26 NOV 2026 (Job B of the Mystery rebuild; the drawings
// Alex approved are ball-iq-audit/2026-11-24/finish/mystery-guesses-11.png and
// mystery-hint-7.png, the brief mystery-build-brief.md in 2026-11-26):
//   · the green pitch card holds "Who am I?", the rule line until the first
//     guess and "Closest so far · rank N" after it, the hint strip and the
//     search field as a pill;
//   · NO FREE CLUES (R5): the position and the birth decade are no longer
//     given, before or during play. The tiles teach them;
//   · two rounds of hints (R1), each CHOSEN on a sheet, never shown unasked:
//     after 4 guesses something sideways, after 8 a step closer. A card whose
//     fact a green tile already gives is greyed (R4);
//   · every guess open, closest first, no card round the list (B3);
//   · three starters before the first guess, chosen without looking at the
//     answer's position or era (R5, R7);
//   · no "Yesterday it was" in any state.
//
// ⚠️ The ranking is computed ONCE per puzzle and memoised. Ranking nine
// thousand players is cheap, but doing it inside the guess handler would redo
// it on every keystroke of an autocomplete.
//
// ⚠️ `nat` IN THE POOL IS NOT A NATIONALITY (it collapses toward the club's
// country for many records). The Nation tile and hint read the senior national
// teams of lib/mysteryRules.js (mysteryNations.json), never `nat`.

/** The band words are mp.win / mp.hot / mp.warm / mp.cold in src/i18n/en.js. */
const bandWord = (t, band) => t(`mp.${band}`);

/** The curated answers: the starters and teammate hints draw only from them. */
const KNOWN_PLAYERS = new Set(ANSWER_IDS);

export default function MysteryPlayer({ onExit, date = new Date(), services, embedded = false }) {
  const t = useT();
  // Ranks are grouped the language's way (3,571 / 3571); English keeps the
  // device default, except on a Spanish device, where it is British English
  // (fmtLocale).
  const num = (v) => v.toLocaleString(fmtLocale());
  const { haptic, playSound, Confetti, GetAppCTA, dailyDone, shareCard, paysXp } = resolveDailyServices(services);
  // `date` drives EVERYTHING dated in here — the answer, the saved result, the
  // puzzle number — so an archive replay of yesterday reads and writes
  // yesterday's slot and cannot overwrite today's board.
  const dayIndex = mysteryDayIndex(date);
  const isArchive = dayIndex !== mysteryDayIndex();
  // A running spell ("2023–now") counts up to the PUZZLE's year, not the
  // clock's: tiles, hints and ranks of a 2027 day count 2027.
  const year = puzzleYear(dayIndex);
  // Best first: the kept site copy's id, then the bundled one. Read once per
  // day, so a fetch landing mid-game never swaps the answer under the board.
  const answerIds = useMemo(() => mysteryAnswerIds(dayIndex), [dayIndex]);
  // The pool and the careers it is ranked against arrive on the first focus of
  // the guess box (usePlayerPool), or on open in the app; the nations, regions,
  // flags table and photo file the tiles read arrive with them
  // (lib/mysteryRulesData.js). None of it is on Home.
  const { pool: POOL, careers: CAREERS, ready, ensure: ensurePool } = usePlayerPool({ careers: true });
  const [rulesData, setRulesData] = useState(() => peekMysteryRulesData());
  const ensureData = useCallback(() => {
    ensurePool();
    if (!rulesData) loadMysteryRulesData().then(setRulesData).catch(() => { /* tiles wait; a later focus retries */ });
  }, [ensurePool, rulesData]);
  // The first id this build's pool holds: a player added to the pool after
  // this build cannot be played here, so that one day falls back to the bundle.
  const answer = useMemo(() => {
    for (const id of answerIds) { const p = POOL.find((x) => x.id === id); if (p) return p; }
    return null;
  }, [POOL, answerIds]);
  const byId = useMemo(() => new Map(POOL.map((p) => [p.id, p])), [POOL]);
  // Everything lib/mysteryRules.js reads, once all of it is here.
  const ctx = useMemo(() => (CAREERS && rulesData && POOL.length ? {
    careers: CAREERS, byId, answers: ANSWER_IDS, nations: rulesData.nations,
    regions: rulesData.regions, flags: rulesData.flags, year,
  } : null), [CAREERS, rulesData, byId, POOL.length, year]);
  const photos = rulesData?.photos || null;

  // Rank the pool once per puzzle, not per keystroke.
  const ranks = useMemo(
    () => (answer && CAREERS ? rankPool(POOL, answer, CAREERS, year) : null),
    [POOL, CAREERS, answer, year],
  );

  // Restore today's game. Without this a refresh — or backgrounding the PWA
  // long enough for iOS to evict it — silently wipes a solved puzzle, and the
  // player cannot re-solve it because they already know the answer.
  const saved = useMemo(() => loadMysteryResult(date), [date]);
  // In the app everyone gets the data on open: the starters and the tiles read
  // it. On the static page (`embedded`) it waits for the guess box, for readers
  // who never play, unless there is a game to show.
  useEffect(() => {
    if (!embedded || saved?.guesses?.length || saved?.won || saved?.gaveUp) ensureData();
  }, [saved, ensureData, embedded]);
  const [text, setText] = useState('');
  const [guesses, setGuesses] = useState(() => saved?.guesses || []); // [{ id, name, club, rank, band, at? }]
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  // The guess made in this visit, for "Latest guess" when an old save carries
  // no order (`at`, written since 26 Nov 2026).
  const [lastId, setLastId] = useState(null);
  const [won, setWon] = useState(() => !!saved?.won);
  const [wonNow, setWonNow] = useState(false);
  // ⚠️ THE TERMINAL STATE THIS MODE NEVER HAD (added 2026-08-17): without a
  // give-up, the hardest daily was the one where not solving cost the streak.
  const [gaveUp, setGaveUp] = useState(() => !!saved?.gaveUp);
  const [giveUpArmed, setGiveUpArmed] = useState(false);
  const rootRef = useRef(null);
  // HINTS (R1). One may be CHOSEN per round: after 4 guesses and after 8.
  // `taken` is what this game chose; an old-ladder save (the club and the
  // initials) keeps its count for the result line and shows no card
  // (hintsFromSave in lib/mysteryRules.js).
  const savedHints = useMemo(() => hintsFromSave(saved), [saved]);
  const [taken, setTaken] = useState(() => savedHints.taken);
  const legacyHints = savedHints.legacyCount;
  const hintCount = taken.length + legacyHints;
  const [sheet, setSheet] = useState(null); // 'hints' | 'credits' | null
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
  // returning player would see old numbers above new tiles. The save keeps
  // its numbers as a fallback for the moment before the pool has loaded.
  const rows = useMemo(() => {
    const live = guesses.map((g) => {
      const rank = ranks?.get(g.id) ?? g.rank;
      return { ...g, rank, band: ranks ? bandFor(rank, POOL.length) : g.band };
    });
    return live.sort((a, b) => a.rank - b.rank);
  }, [guesses, ranks, POOL.length]);
  const n = guesses.length;
  // The newest guess: by the order saved with it, else the one made this visit.
  const latestId = useMemo(() => {
    let best = null;
    for (const g of guesses) if (g.at && (!best || g.at > best.at)) best = g;
    return best ? best.id : lastId;
  }, [guesses, lastId]);

  // The six cards for today's answer, what the player already holds (R4), and
  // which round may be chosen from now.
  const cards = useMemo(() => (answer && ctx ? hintCards(answer, ctx) : null), [answer, ctx]);
  const guessPlayers = useMemo(() => guesses.map((g) => byId.get(g.id)).filter(Boolean), [guesses, byId]);
  const held = useMemo(() => (cards ? heldHints(cards, guessPlayers, answer, ctx) : {}), [cards, guessPlayers, answer, ctx]);
  const open = done ? [] : openRounds(n, taken);

  // What every save writes besides the board: the hints in today's shape.
  const persist = ({ taken: tk = taken, ...state }) => saveMysteryResult(date, {
    ...state, ...saveHintFields(tk, legacyHints), ...(isArchive ? { arc: 1 } : {}),
  });
  const takeHint = (card) => {
    const round = open[0];
    if (round == null || card?.round !== round || !card.available || held[card.key]) return;
    const next = [...taken, { round, key: card.key }];
    setTaken(next);
    setSheet(null);
    haptic('select');
    // Persist at once: a hint taken and then the tab closed must not come back
    // unspent, or the count on the result lies.
    persist({ won, gaveUp, guesses, taken: next });
  };
  const closeSheet = useCallback(() => setSheet(null), []);

  // THREE FIRST MOVES (R5, R7). Three well-known curated answers, one from each
  // of three different lines, a different three each day, chosen WITHOUT
  // reading the answer's position or era; never the answer itself. The grey
  // line is the birth year and the club the player is known for (mainClub).
  const starters = useMemo(() => {
    if (!answer || !POOL.length) return [];
    const known = POOL.filter((p) => KNOWN_PLAYERS.has(p.id));
    return startersForDay(dayIndex, answer.id, known);
  }, [POOL, answer, dayIndex]);

  /* Ranked autocomplete. The scorer lives in lib/playerSearch.js because
     Transfer Trail uses the SAME one. */
  const suggestions = useMemo(
    () => rankPlayerSuggestions(POOL, text, { limit: SUGGEST_MAX, exclude: new Set(guesses.map((g) => g.id)) }),
    // POOL is a dependency now that it arrives after mount.
    [POOL, text, guesses],
  );

  // The finish: the senior career, oldest first, club and years.
  const career = useMemo(() => (answer && CAREERS ? careerOf(answer, CAREERS, year) : []), [answer, CAREERS, year]);

  // "Photo credits": every photo on screen, with its author and licence.
  const credits = useMemo(() => {
    if (!photos) return [];
    return rows.filter((g) => photoView(photos[g.id], 52)).map((g) => ({ id: g.id, name: g.name, a: photos[g.id].a, l: photos[g.id].l, pg: photos[g.id].pg }));
  }, [rows, photos]);

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
  const canGiveUp = !done && n >= GIVE_UP_AFTER;

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
    persist({ won: false, gaveUp: true, guesses });
    // Same archive guard as the win path: replaying an old puzzle must never
    // touch today's habit metrics.
    if (!isArchive) {
      try {
        window.dispatchEvent(new CustomEvent('biq:daily-completed', {
          detail: { positive: false, game: 'mystery', won: false, attempts: n },
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
    const at = guesses.reduce((m, g) => Math.max(m, g.at || 0), 0) + 1;
    const next = [{ id: player.id, name: player.name, club: player.club, rank, band, at }, ...rows]
      .sort((a, b) => a.rank - b.rank);
    setGuesses(next);
    setLastId(player.id);
    setText('');
    setError('');
    const isWin = rank === 1;
    // The warmth signal, made physical: a near miss should not sound like a
    // shrug. Cold guesses stay silent so the signal is not flattened to noise.
    if (isWin) { haptic('hardCorrect'); playSound('correct'); }
    else if (rank <= 25) { haptic('correct'); playSound('correct'); }
    else { haptic('select'); playSound('soft'); }
    if (isWin) { setWon(true); setWonNow(true); }
    // Persist EVERY guess, not just the win.
    persist({ won: isWin, guesses: next });
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

  // "no hints", "1 hint": the finish line and the share text say the same.
  const hintWords = hintCount > 0 ? t('mq.hints', { count: hintCount }) : t('mq.noHints');
  // One share path for win and give-up. ⚠️ `date`, not today: an ARCHIVE win
  // must share under its own puzzle number. Dismissing the sheet REJECTS.
  const shareResult = async (w) => {
    const text = buildMysteryShareText({ number: mysteryNumber(date), guesses: rows, won: w, streak: w ? streak : 0, hintWords: w ? hintWords : '' });
    // In the app the result goes as a picture (shareCardRender "mystery"),
    // the guesses coldest first as in the text's grid (23 Oct).
    if (shareCard) {
      const toast = (m) => window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: m }));
      const bands = [...rows].sort((a, b) => b.rank - a.rank).map((g) => g.band);
      return shareCard('mystery', { num: mysteryNumber(date), won: w, bands, streak: w ? streak : 0, deepLink: '/mystery' }, { textFallback: text, onToast: toast });
    }
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: tNow('game.copiedShort') })); } catch {} }
    } catch { return false; /* dismissed or blocked — nothing to recover */ }
  };
  // The finish card's facts. The position is the tiles' word for the line
  // (lib/mysteryRules.js SLOT_WORD), the nation the first senior national team
  // (never the pool's `nat`), the XP the app's rule (mysteryXp) and only where
  // the host really pays it: not on the static page, not on an archive day.
  const finishStreak = won ? (dailyDone?.streak || { count: streak, label: t('dd.l.mystery') }) : (dailyDone?.streak || { count: 0, label: t('dd.l.mystery') });
  const xp = won && paysXp && !isArchive ? mysteryXp(true, n) : 0;
  const nation = answer && rulesData ? primaryNation(answer, rulesData.nations) : null;
  const finishCard = answer ? {
    render: (action) => (
      <section className="mq-card mq-fin" aria-label={t('mp.answer')}>
        <div className="mq-fin-face"><Face entry={photos?.[answer.id]} px={104} ring /></div>
        <h2 className="mq-fin-name">{answer.name}</h2>
        <p className="mq-fin-meta">
          {[
            SLOT_WORD[answer.slot] ? t(`mq.slot.${answer.slot}`) : null,
            nation ? <span key="n" className="mq-fin-nat"><FlagImg src={flagOf(nation, rulesData.flags)} />{nation}</span> : null,
            answer.born ? t('mp.bornIn', { y: answer.born }) : null,
          ].filter(Boolean).map((part, i) => <React.Fragment key={i}>{i > 0 ? ' · ' : ''}{part}</React.Fragment>)}
        </p>
        <p className="mq-fin-res">
          {won ? `${t('mp.solved', { count: n })} · ${hintWords}` : t('mq.revealed', { count: n })}
          {xp > 0 && <> · <b>{t('rs.xp', { n: xp })}</b></>}
        </p>
        {career.length > 0 && (
          <ol className="mq-fin-career" aria-label={t('mp.career')}>
            {career.map((sp, i) => (
              <li key={`${sp.club}-${sp.from}-${i}`}><b>{sp.club}</b><i>{spellYears(sp)}</i></li>
            ))}
          </ol>
        )}
        {action}
      </section>
    ),
  } : null;
  const typing = focused && !done;
  const q = text.trim();
  const noMatch = !done && ready && q.length >= 2 && suggestions.length === 0;
  return (
    <div ref={rootRef} className={`mp mq${embedded ? ' is-embedded' : ''}`} style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', paddingBottom: kbInset ? 24 + kbInset : undefined }}>
      {/* The header: the back tile, the name over "No. N · Unlimited guesses",
          the help tile. On the static page the page's H1 names the game, so
          the line is the number alone, as it was. */}
      <div className={`mq-top${done && answer ? ' is-over' : ''}`}>
        {onExit && (
          <button type="button" onClick={onExit} aria-label={t('game.back')} className="mq-tile"><ArrowLeft size={22} strokeWidth={2.2} aria-hidden="true" /></button>
        )}
        <div className="mq-title">
          {!embedded && <div className="mq-name">Mystery Player</div>}
          <div className="mq-sub">
            {embedded && <b style={{ color: MODE_ACCENT.mystery }}>{t('game.no', { n: mysteryNumber(date) })}</b>}
            {!embedded && `${t('game.no', { n: mysteryNumber(date) })} · ${t('mp.unlimited')}`}
            {isArchive ? ` · ${t('mp.archive')}` : ''}
          </div>
        </div>
        {/* Once the result is up the streak has this corner, as on the other finishes. */}
        {done && answer && <StreakChip streak={finishStreak} isArchive={isArchive} floor />}
        {!done && (
          <button type="button" className="mq-tile" onClick={() => setShowRules((v) => !v)}
            aria-label={t('game.howTo')} aria-expanded={showRules} title={t('game.howTo')}><CircleHelp size={22} strokeWidth={2.1} aria-hidden="true" /></button>
        )}
      </div>

      {!done && showRules && <p className="mq-rules">{t('mq.rules')}</p>}

      {/* Only for a solve made now, as on the Trail: not on every look at a solved day. */}
      {wonNow && Confetti ? <Confetti /> : null}
      {done && !answer && (
        <p style={{ margin: '4px 0 14px', color: 'var(--t3)', fontSize: 13 }}>{t('mp.loadingAnswer')}</p>
      )}
      {/* THE FINISH (Job C, 26 Nov 2026; the drawing mystery-finish-7, approved,
          measures in mf1.py). One green card: the face (the photo cropped on
          the head, or the shirt in a ring), the name, "Position · flag Nation ·
          born YEAR", one white line with only the XP in yellow, the career
          club by club, and the one Share button. No row of guesses. Under it,
          as on the other built finishes (DailyDone's layout "one"): the day's
          count and the countdown, the other games with their Play pills, the
          save line, Back to Home. A give-up reads "Revealed after N guesses". */}
      {done && answer && (
        <div className="mq-fin-wrap">
          <DailyDone game="mystery" edition={mysteryNumber(date)} won={won} bucket={won ? n : 0} isArchive={isArchive}
            layout="one" card={finishCard} streak={finishStreak} onShare={() => shareResult(won)}
            remind={dailyDone?.remind} nextUp={dailyDone?.nextUp || []} day={dailyDone?.day} save={dailyDone?.save} GetAppCTA={GetAppCTA} track={dailyDone?.track} promoted={dailyDone?.promoted} />
          <ResultFoot onHome={onExit} pill />
        </div>
      )}

      {/* THE PITCH CARD (B1). Before the first guess the rule line; after it
          the closest rank in yellow. While the field has focus the hint strip
          steps out so three suggestions fit above the keyboard (B5). */}
      {!done && (
        <section className="mq-card" aria-label={t('mq.who')}>
          <h2 className="mq-who">{t('mq.who')}</h2>
          {rows.length === 0
            ? <p className="mq-rule">{t('mq.rule')}</p>
            : <p className="mq-best">{t('mq.closest', { r: num(rows[0].rank) })}</p>}
          {!typing && (
            <HintStrip n={n} taken={taken} cards={cards} held={held} open={open} t={t}
              onChoose={() => { ensureData(); setSheet('hints'); }} />
          )}
          <form onSubmit={onSubmitText} className={`mq-search${typing ? ' is-on' : ''}`} role="search">
            <Search size={20} strokeWidth={2.2} aria-hidden="true" />
            <input
              ref={inputRef}
              value={text}
              onFocus={() => { ensureData(); setFocused(true); }}
              onBlur={() => setFocused(false)}
              onChange={(e) => { ensureData(); setText(e.target.value); setError(''); }}
              placeholder={t('mp.search')}
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              aria-label={t('mp.guessAria')}
              /* ⚠️ 16px is a HARD FLOOR — iOS auto-zooms on focusing any input
                 below it and WKWebView never restores the scale on blur. */
            />
          </form>
        </section>
      )}

      {!done && q && (suggestions.length > 0 || !ready) && (
        <div className="mq-list-card mq-sug">
          {!ready && <div className="mq-loading" role="status">{t('mp.loadingPlayers')}</div>}
          {suggestions.map((p) => (
            /* Birth year then club: tells namesakes apart (the two Ronaldos). */
            <button key={p.id} type="button" className="mq-row" onClick={() => submit(p)}
              // The keyboard stays up between guesses: refuse the focus change,
              // the click still fires (Top 10 since 9 Oct, Trail since 12 Oct).
              onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()}>
              <span className="mq-row-t"><b>{p.name}</b><i>{suggestionSubtitle(p)}</i></span>
            </button>
          ))}
        </div>
      )}
      {/* A NAME THAT MATCHES NOBODY (B5): the app's own sentence in a card. */}
      {noMatch && (
        <div className="mq-nf" role="status">
          <b>{t('mp.noSuch', { q })}</b>
          <span>{t('mq.noSuchHelp')}</span>
        </div>
      )}
      {error && !noMatch && <div className="mq-err" role="alert">{error}</div>}

      {/* THREE FIRST MOVES, as kit rows with a soft Guess pill (B5). */}
      {!done && rows.length === 0 && !q && starters.length > 0 && (
        <>
          <div className="mq-label">{t('mq.startK')}</div>
          <div className="mq-list-card">
            {starters.map((p) => {
              const line = CAREERS ? starterLine(p, { careers: CAREERS, year }) : { born: p.born, club: null };
              return (
                <div key={p.id} className="mq-row is-start">
                  <span className="mq-row-t"><b>{p.name}</b><i>{[line.born, line.club].filter(Boolean).join(' · ')}</i></span>
                  <button type="button" className="mq-go" onClick={() => submit(p)} aria-label={t('mq.guessAria', { name: p.name })}>{t('mq.guess')}</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* EVERY GUESS OPEN, closest first (B3): no folding, no table, no card
          round the list. One key line under the label says what the three
          fills mean. */}
      {!done && rows.length > 0 && (
        <>
          <div className="mq-label">{t('mq.yourGuesses', { n })}</div>
          <div className="mq-key" aria-hidden="true">
            <span><i className="is-m" />{t('mq.keySame')}</span>
            <span><i className="is-c" />{t('mq.keyClose')}</span>
            <span><i className="is-n" />{t('mq.keyDiff')}</span>
          </div>
          <ol className="mq-list" aria-label={t('mq.yourGuesses', { n })}>
            {rows.map((g) => {
              const p = byId.get(g.id);
              return (
                <GuessRow key={g.id} g={g} t={t} num={num} bandWord={(b) => bandWord(t, b)}
                  v={p && answer && ctx ? tileVerdicts(p, answer, ctx) : null}
                  photo={photos?.[g.id]} latest={rows.length > 1 && g.id === latestId} />
              );
            })}
          </ol>
        </>
      )}

      {/* Below the guess list, not beside the input: a give-up at eye level
          competes with playing. */}
      {canGiveUp && (
        <button type="button" onClick={giveUp} className={`mq-give${giveUpArmed ? ' is-armed' : ''}`}>
          {t(giveUpArmed ? 'mp.giveUpArmed' : 'mp.giveUp')}
        </button>
      )}
      {!done && credits.length > 0 && (
        <button type="button" className="mq-credits" onClick={() => setSheet('credits')} aria-haspopup="dialog">{t('mq.credits')}</button>
      )}

      {sheet === 'hints' && open.length > 0 && cards && (
        <HintSheet round={open[0]} cards={cards} held={held} roundTwoOpen={open.includes(2)} onTake={takeHint} onClose={closeSheet} t={t} />
      )}
      {sheet === 'credits' && <CreditsSheet items={credits} onClose={closeSheet} t={t} />}
    </div>
  );
}
