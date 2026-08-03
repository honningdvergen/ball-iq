import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import {
  rankPool, bandFor, matchGuess, normaliseName,
  answerIdForDay, mysteryDayIndex, mysteryNumber, buildMysteryShareText,
} from '../lib/mysteryPlayer.js';
import POOL from '../data/mysteryPool.json';
import CAREERS from '../data/mysteryCareers.json';
import SCHEDULE from '../data/mysterySchedule.json';

// Mystery Player — guess the secret footballer. Every guess returns a RANK
// against the whole pool; the answer is 1.
//
// ⚠️ The ranking is computed ONCE per puzzle and memoised. Ranking 1,539
// players is cheap, but doing it inside the guess handler would redo it on
// every keystroke of an autocomplete.

const BAND_STYLE = {
  win:  { bg: 'rgba(88,204,2,0.16)',  bd: '#58CC02', fg: '#8AE042' },
  hot:  { bg: 'rgba(88,204,2,0.10)',  bd: 'rgba(88,204,2,0.45)', fg: '#8AE042' },
  warm: { bg: 'rgba(255,193,7,0.10)', bd: 'rgba(255,193,7,0.40)', fg: '#FFC107' },
  cold: { bg: 'var(--s1)',            bd: 'var(--border)', fg: 'var(--t2)' },
};

export default function MysteryPlayer({ onExit }) {
  const dayIndex = mysteryDayIndex();
  const answerId = answerIdForDay(SCHEDULE, dayIndex);
  const answer = useMemo(() => POOL.find((p) => p.id === answerId) || null, [answerId]);

  // Rank the pool once per puzzle, not per keystroke.
  const ranks = useMemo(
    () => (answer ? rankPool(POOL, answer, CAREERS) : null),
    [answer],
  );

  const [text, setText] = useState('');
  const [guesses, setGuesses] = useState([]); // [{ id, name, club, rank, band }]
  const [error, setError] = useState('');
  const [won, setWon] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Autocomplete over the pool. Capped — a 1,539-item list is unusable, and
  // showing everything on an empty box invites scrolling instead of typing.
  const suggestions = useMemo(() => {
    const q = normaliseName(text);
    if (q.length < 2) return [];
    const guessed = new Set(guesses.map((g) => g.id));
    return POOL
      .filter((p) => !guessed.has(p.id) && normaliseName(p.name).includes(q))
      .slice(0, 6);
  }, [text, guesses]);

  if (!answer || !ranks) {
    // No puzzle scheduled for today. The home card is gated on the same
    // condition, so this is a direct-navigation fallback rather than a state
    // a player reaches by tapping.
    return (
      <div style={{ padding: 20 }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }}>
          <ArrowLeft size={20} /> Back
        </button>
        <p style={{ color: 'var(--t2)', marginTop: 20 }}>No Mystery Player today — check back tomorrow.</p>
      </div>
    );
  }

  const submit = (player) => {
    if (won || !player) return;
    if (guesses.some((g) => g.id === player.id)) { setError(`You already guessed ${player.name}.`); return; }
    const rank = ranks.get(player.id);
    const band = bandFor(rank, POOL.length);
    // Newest guess first, but the LIST stays sorted by rank so a player can
    // see how close they are getting without re-reading everything.
    setGuesses((g) => [{ id: player.id, name: player.name, club: player.club, rank, band }, ...g]
      .sort((a, b) => a.rank - b.rank));
    setText('');
    setError('');
    if (rank === 1) setWon(true);
  };

  const onSubmitText = (e) => {
    e.preventDefault();
    const p = matchGuess(POOL, text);
    if (!p) { setError(`No player called "${text.trim()}" in today's pool.`); return; }
    submit(p);
  };

  const best = guesses.length ? guesses[0].rank : null;

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 6px' }}>
        <button onClick={onExit} aria-label="Back" style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.01em' }}>Mystery Player</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>No. {mysteryNumber()} · unlimited guesses</div>
        </div>
        {best !== null && !won && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Closest</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: BAND_STYLE[guesses[0].band].fg }}>{best}</div>
          </div>
        )}
      </div>

      {!won && (
        <p style={{ margin: '2px 16px 12px', color: 'var(--t2)', fontSize: 13.5, lineHeight: 1.5 }}>
          Guess any player in a top-club squad. Each guess is ranked by how similar they are to the secret player — club, country, position, nationality, age and clubs they have played for. <strong style={{ color: 'var(--t1)' }}>The secret player is 1.</strong>
        </p>
      )}

      {won && (
        <div style={{ margin: '4px 16px 14px', padding: '14px 16px', borderRadius: 14, background: 'rgba(88,204,2,0.12)', border: '1px solid rgba(88,204,2,0.4)' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#8AE042' }}>Got it — {answer.name}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>
            {answer.club} · {answer.position || answer.slot} · {answer.nat} · born {answer.born}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 6 }}>
            Solved in <strong style={{ color: 'var(--t1)' }}>{guesses.length}</strong> {guesses.length === 1 ? 'guess' : 'guesses'}.
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = buildMysteryShareText({ number: mysteryNumber(), guesses, won: true });
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
        </div>
      )}

      {!won && (
        <form onSubmit={onSubmitText} style={{ padding: '0 16px 8px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 14px' }}>
            <Search size={17} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Search a player"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              aria-label="Guess a player"
              /* ⚠️ 16px is a HARD FLOOR — iOS auto-zooms on focusing any input
                 below it and WKWebView never restores the scale on blur. */
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '15px 0', fontSize: 16, color: 'var(--t1)', fontFamily: 'inherit' }}
            />
          </div>
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', left: 16, right: 16, zIndex: 20, marginTop: 6, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {suggestions.map((p) => (
                <button key={p.id} type="button" onClick={() => submit(p)}
                  style={{ display: 'flex', width: '100%', alignItems: 'baseline', gap: 8, padding: '11px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--t1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>{p.club}</span>
                </button>
              ))}
            </div>
          )}
          {error && <div style={{ color: '#FF6B6B', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
        </form>
      )}

      <div style={{ flex: 1, padding: '10px 16px 24px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {guesses.length === 0 && !won && (
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
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: st.fg, fontVariantNumeric: 'tabular-nums' }}>{g.rank}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
