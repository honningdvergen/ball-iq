// The pieces of the Mystery Player play screen (screens/MysteryPlayer.jsx,
// 26 Nov 2026): a guess with its four tiles, the round face, the hint strip,
// the hint sheet, the photo credits sheet and the three starters. Drawn from
// ball-iq-audit/2026-11-24/finish/mystery-guesses-11.png and mystery-hint-7.png
// (measures in mq7.py to mq11.py there). Pure presentation: every fact on them
// comes from lib/mysteryRules.js, which says how each one was checked.
//
// ⚠️ NO IMPORT FROM App.jsx and nothing from app.css: the screen also mounts as
// an island on the static /mystery-player/ page. Its styles are mystery.css.
import React, { useRef } from 'react';
import { Lock, Lightbulb, Users, Shield, CalendarRange, Flag, Cake, ChevronRight, ArrowDown, ArrowUp, Shirt, ExternalLink } from 'lucide-react';
import { photoView } from '../lib/photoCrop.js';
import { useModalA11y } from '../useModalA11y.js';
import '../i18n/en.js'; // the full English table: not on Home's eager path

/** The colour a rank and its band word are drawn in. */
export const BAND_COLOUR = { win: '#8AE042', hot: '#8AE042', warm: '#FFC107', cold: '#9BA0B8' };
/** Tile fill by verdict: green same, yellow close, dark different (and dark when unknown). */
const FILL = { same: 'm', close: 'c', different: 'n', unknown: 'n' };

/** A flag picture from public/flags (lib/mysteryRules.js flagOf), never an emoji. */
export function FlagImg({ src, className = 'mq-flag' }) {
  if (!src) return null;
  return <img className={className} src={`/${src}`} width="20" height="14" alt="" aria-hidden="true" decoding="async" />;
}

/**
 * The round face: the reviewed photo cropped on the head (lib/photoCrop.js), or
 * the shirt in a ring from the guest Profile when there is none. Production has
 * none yet (R15: the reviewed list is empty until the owner approves photos).
 * `entry` is the lean photo file's record for this player, or undefined.
 */
export function Face({ entry, px, ring = false }) {
  const v = photoView(entry, px);
  const size = { width: px, height: px };
  if (!v) {
    return (
      <span className={`mq-face is-none${ring ? ' is-ring' : ''}`} style={size} aria-hidden="true">
        <Shirt size={Math.round(px * 0.42)} strokeWidth={1.9} />
      </span>
    );
  }
  return (
    <span className={`mq-face${ring ? ' is-ring' : ''}`} style={size} aria-hidden="true">
      <img src={v.src} alt="" decoding="async" referrerPolicy="no-referrer"
        style={{ width: v.box.width, height: v.box.height, left: v.box.left, top: v.box.top }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </span>
  );
}

function Tile({ label, value, state, pre = null, post = null, sr = '', t }) {
  return (
    <div className={`mq-t is-${FILL[state] || 'n'}`}>
      <span className="mq-t-l">{label}</span>
      <span className="mq-t-v">{pre}<span className="mq-t-x">{value}</span>{post}</span>
      <span className="mq-sr">{`, ${t(`mq.st.${state}`)}${sr ? `, ${sr}` : ''}`}</span>
    </div>
  );
}

/**
 * One guess: the face, the name ("Latest guess" under the newest only), the
 * rank with its band word, then four tiles two by two. `v` is tileVerdicts()
 * for this guess, or null while the rules data loads (the tiles wait).
 */
export function GuessRow({ g, v, photo, latest, t, num, bandWord }) {
  return (
    <li className="mq-g" style={{ '--c': BAND_COLOUR[g.band] || BAND_COLOUR.cold }}>
      <div className="mq-gh">
        <Face entry={photo} px={52} />
        <div className="mq-gn">
          <b>{g.name}</b>
          {latest && <em>{t('mq.latest')}</em>}
        </div>
        <div className="mq-gr">
          <b>{num(g.rank)}</b>
          <i>{bandWord(g.band)}</i>
        </div>
      </div>
      {v && (
        <div className="mq-tiles">
          <Tile t={t} label={t('mq.t.club')} state={v.club.state}
            value={v.club.club || (v.club.state === 'different' ? t('mq.none') : '—')} />
          <Tile t={t} label={t('mq.t.pos')} state={v.position.state}
            value={v.position.slot ? t(`mq.slot.${v.position.slot}`) : '—'} />
          <Tile t={t} label={t('mq.t.nation')} state={v.nation.state}
            pre={<FlagImg src={v.nation.flag} />} value={v.nation.nation || '—'} />
          <Tile t={t} label={t('mq.t.born')} state={v.born.state} value={v.born.year || '—'}
            post={v.born.arrow === 'down' ? <ArrowDown size={13} strokeWidth={2.8} aria-hidden="true" />
              : v.born.arrow === 'up' ? <ArrowUp size={13} strokeWidth={2.8} aria-hidden="true" /> : null}
            sr={v.born.arrow === 'down' ? t('mq.bornEarlier') : v.born.arrow === 'up' ? t('mq.bornLater') : ''} />
        </div>
      )}
    </li>
  );
}

/** What a taken card says, as the strip's value. */
export function hintValue(card, t) {
  if (!card?.available) return '—';
  const v = card.value;
  switch (card.key) {
    case 'teammate': case 'teammateMain': return v.name;
    case 'club': return v.oneClub ? t('mq.oneClub') : v.club;
    case 'careerYears': return `${v.from}–${v.to ?? t('mq.now')}`;
    case 'nation': return <><FlagImg src={v.flag} />{v.nation}</>;
    case 'birthYear': return String(v.year);
    default: return '—';
  }
}

/**
 * The strip on the card (B2, R1, R4). Taken hints as rows (label, value); then
 * one more row: "Hint ready" with Choose while a round is open, the round's
 * state when it offers nothing, or the next round's fixed words while it waits
 * ("Hint · After 4 guesses", no countdown). `cards` is null until the rules
 * data has loaded; the Choose pill waits for it.
 */
export function HintStrip({ n, taken, cards, held, open, onChoose, t }) {
  const findCard = (h) => cards?.[h.round]?.find((c) => c.key === h.key);
  const rows = [...taken].sort((a, b) => a.round - b.round).map((h) => (
    <div key={`${h.round}-${h.key}`} className="mq-lk is-taken">
      <span className="mq-lk-l"><Lightbulb size={16} strokeWidth={2.2} aria-hidden="true" />{t(`mq.k.${h.key}`)}</span>
      <b className="mq-lk-v">{cards ? hintValue(findCard(h), t) : '…'}</b>
    </div>
  ));
  const round = open[0];
  if (round != null) {
    const list = cards?.[round] || null;
    const offered = list ? list.filter((c) => c.available) : null;
    if (offered && !offered.length) {
      rows.push(<div key="r" className="mq-lk"><span className="mq-lk-l"><Lock size={14} strokeWidth={2.2} aria-hidden="true" />{t('mq.noneRound')}</span></div>);
    } else if (offered && offered.every((c) => held[c.key])) {
      rows.push(<div key="r" className="mq-lk"><span className="mq-lk-l"><Lightbulb size={16} strokeWidth={2.2} aria-hidden="true" />{t('mq.heldRound')}</span></div>);
    } else {
      rows.push(
        /* The whole row is the button, not only the small pill (26 Nov 2026). */
        <button key="r" type="button" className="mq-lk is-ready" onClick={onChoose} disabled={!list} aria-haspopup="dialog">
          <span className="mq-lk-l"><Lightbulb size={16} strokeWidth={2.2} aria-hidden="true" />{t('mq.hintReady')}</span>
          <span className="mq-pill">{t('mq.choose')}</span>
        </button>,
      );
    }
  } else {
    const next = [{ round: 1, after: 4 }, { round: 2, after: 8 }].find((r) => !taken.some((h) => h.round === r.round) && n < r.after);
    if (next) {
      rows.push(
        <div key="r" className="mq-lk">
          <span className="mq-lk-l"><Lock size={14} strokeWidth={2.2} aria-hidden="true" />{t(taken.length ? 'mq.nextHint' : 'mq.hint')}</span>
          <i className="mq-lk-w">{t('mq.after', { n: next.after })}</i>
        </div>,
      );
    }
  }
  if (!rows.length) return null;
  return <div className="mq-strip">{rows}</div>;
}

const CARD_LOOK = {
  teammate: { cls: 'a', Icon: Users }, club: { cls: 'b', Icon: Shield }, careerYears: { cls: 'c', Icon: CalendarRange },
  teammateMain: { cls: 'a', Icon: Users }, nation: { cls: 'b', Icon: Flag }, birthYear: { cls: 'c', Icon: Cake },
};

/**
 * A bottom sheet: the dim behind it closes it; the app's modal hook gives it
 * focus on open, Escape, the Tab trap, focus back on close and the back gesture.
 */
function Sheet({ labelId, onClose, className = '', children }) {
  const ref = useRef(null);
  useModalA11y({ isOpen: true, onClose, ref });
  return (
    <div className="mq-sheet-wrap">
      <div className="mq-dim" onClick={onClose} aria-hidden="true" />
      <section ref={ref} className={`mq-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <i className="mq-grab" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

/**
 * "Choose a hint" (B2, R1, R4): the round's cards that can be offered, each a
 * gradient card; a card whose fact a green tile already gives is greyed with
 * "You already have this" and cannot be taken. Then "Keep guessing" and the
 * line about a clean solve.
 */
export function HintSheet({ round, cards, held, roundTwoOpen, onTake, onClose, t }) {
  const list = (cards?.[round] || []).filter((c) => c.available);
  const sub = round === 2 ? t('mq.sheetSub2') : roundTwoOpen ? t('mq.sheetSub1Now') : t('mq.sheetSub1');
  return (
    <Sheet labelId="mq-sheet-h" onClose={onClose} className="is-hints">
      <h2 id="mq-sheet-h">{t('mq.sheetH')}</h2>
      <p className="mq-sheet-sub">{sub}</p>
      {list.map((c) => {
        const look = CARD_LOOK[c.key] || CARD_LOOK.club;
        const isHeld = !!held[c.key];
        return (
          <button key={c.key} type="button" className={`mq-o is-${look.cls}${isHeld ? ' is-held' : ''}`}
            onClick={() => { if (!isHeld) onTake(c); }} disabled={isHeld} aria-disabled={isHeld || undefined}>
            <span className="mq-o-i" aria-hidden="true"><look.Icon size={20} strokeWidth={2.2} /></span>
            <span className="mq-o-t">
              <b>{t(`mq.c.${c.key}`)}</b>
              <i>{isHeld ? t('mq.held') : t(`mq.c.${c.key}Sub`)}</i>
            </span>
            {!isHeld && <ChevronRight size={20} strokeWidth={2.2} className="mq-o-c" aria-hidden="true" />}
          </button>
        );
      })}
      <button type="button" className="mq-keep" onClick={onClose}>{t('mq.keep')}</button>
      <p className="mq-sheet-foot">{t('mq.sheetFoot')}</p>
    </Sheet>
  );
}

/** Each shown photo's author and licence, with a link to its Commons page (CC BY-SA asks for it). */
export function CreditsSheet({ items, onClose, t }) {
  return (
    <Sheet labelId="mq-credits-h" onClose={onClose} className="is-credits">
      <h2 id="mq-credits-h">{t('mq.credits')}</h2>
      <p className="mq-sheet-sub">{t('mq.creditsSub')}</p>
      <ul className="mq-cr">
        {items.map((it) => (
          <li key={it.id}>
            <b>{it.name}</b>
            <span>{[it.a, it.l].filter(Boolean).join(' · ')}</span>
            {it.pg && (
              <a href={it.pg} target="_blank" rel="noopener noreferrer">
                {t('mq.commonsPage')}<ExternalLink size={13} strokeWidth={2.2} aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="mq-keep" onClick={onClose}>{t('mq.close')}</button>
    </Sheet>
  );
}
