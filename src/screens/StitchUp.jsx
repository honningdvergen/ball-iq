// Stitch-up: build a Transfer Trail for your mate (web only, 16 Oct 2026).
//
// Return research, 16 Oct 2026, "Three new modes" #1: a player picks a
// footballer from the VERIFIED careers (lib/stitch.js), chooses how many clubs
// his mate sees at the start, picks one of twelve fixed taunts and sends a
// link (balliq.app/s/TOKEN, lib/stitchToken.js). The mate plays it in the
// Trail's own engine (TransferTrail with `stitch`), which never touches the
// daily's save, streak, scores row or the day bar, then sees the head-to-head
// and "Send one back".
//
// Three views in one lazy chunk, so Home's eager budget never carries them:
//   build    pick a player, set the clubs shown, pick a taunt, your name
//   share    the link, ready to send
//   play     the receiver's board, then the head-to-head
// One solid button per view; everything else is a hairline, a tint or a link.
// Lucide icons only, sentence case, no eyebrows.
//
// ⚠️ HIDDEN IN THE NATIVE APPS. Installed builds carry the web code they were
// built with, and this ships web first: App.jsx only routes here outside the
// native shell, and the screen itself refuses to draw inside one.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Minus, Plus, EyeOff, Check, Share, Copy, Swords, Quote } from "lucide-react";
import "./stitch.css";
import TransferTrail from "./TransferTrail.jsx";
import { stitchPlayers, findStitchPlayer, stitchHashOf, stitchShownRange, searchStitchPlayers, stitchIdeas } from "../lib/stitch.js";
import { STITCH_TAUNTS, makeStitchToken, parseStitchToken, stitchHeadline, stitchScore, cleanStitchName } from "../lib/stitchToken.js";
import { clubColour, clubAbbr, onColour } from "../lib/clubColour.js";
import { CLUB_PACK_COLOURS, CLUB_PACK_ABBR } from "../data/clubPackColours.js";
import { isNativeShell } from "../lib/inAppBrowser.js";
import { getTrailAnswer, loadTrailDay, finishedBefore } from "../lib/trail.js";
import { isProfaneUsername } from "../lib/profanity.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { t } from "../i18n/index.js";

const NAME_KEY = "biq_stitch_name";
const PLAY_KEY = "biq_stitch_play";
export const STITCH_ORIGIN = "https://balliq.app";
export const stitchUrl = (token) => `${STITCH_ORIGIN}/s/${token}`;

const readName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };
const firstName = (s) => cleanStitchName(String(s || "").split(" ")[0]);

async function shareOrCopy(text, url) {
  try {
    if (navigator.share) { await navigator.share({ text, url }); return "sent"; }
  } catch (e) {
    if (e && (e.name === "AbortError" || /cancel/i.test(e.message || ""))) return null;
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return "copied"; } catch { return null; }
}

// The sharer's language (i18n step 6): the taunt too, as share.taunt.<index>
// (en.js holds STITCH_TAUNTS' English, pinned by tests/unit/i18n-last-english.test.js).
// The screen itself is still English.
export function stitchShareText(taunt) {
  const said = STITCH_TAUNTS[taunt] ? t(`share.taunt.${taunt}`) : t("share.stitchDefault");
  return t("share.stitch", { taunt: said });
}

// ── BUILD ─────────────────────────────────────────────────────────────────
export function StitchBuilder({ onBack, onMade, back = null, defaultName = "", now = null, initial = null, rnd }) {
  const [at] = useState(() => now || new Date());
  const list = useMemo(() => stitchPlayers(at), [at]);
  const ideas = useMemo(() => stitchIdeas(list, 5, rnd), [list, rnd]);
  const [q, setQ] = useState("");
  const [player, setPlayer] = useState(initial?.player || null);
  const range = stitchShownRange(player);
  const [shown, setShown] = useState(initial?.shown || 2);
  const [taunt, setTaunt] = useState(initial?.taunt || 0);
  const [name, setName] = useState(() => firstName(readName() || defaultName));
  const [err, setErr] = useState("");
  const results = useMemo(() => searchStitchPlayers(list, q), [list, q]);

  const pick = (p) => { setPlayer(p); setShown(2); setQ(""); try { window.scrollTo?.(0, 0); } catch { /* fine */ } };
  const make = () => {
    const n = cleanStitchName(name);
    if (n && isProfaneUsername(n)) { setErr("Pick a different name."); return; }
    const token = makeStitchToken({ hash: stitchHashOf(player), shown, taunt, name: n, tally: back?.tally || [0, 0] });
    if (!token) return;
    try { if (n) localStorage.setItem(NAME_KEY, n); } catch { /* private mode */ }
    onMade?.({ token, player, shown, taunt, name: n, back: !!back });
  };

  if (!player) {
    return (
      <div className="st-screen">
        <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
        <div className="st-head">
          <h1 className="st-title">{back?.to ? `Send one back to ${back.to}` : "Stitch up a mate"}</h1>
          <p className="st-sub">Pick a footballer. You choose how much of his career your mate sees, and they name him.</p>
        </div>
        <div className="st-search">
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <input className="st-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a player" aria-label="Search a player"
            autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="search" />
        </div>
        {q.trim().length >= 2 ? (
          <div className="st-list" role="list" aria-label="Players">
            {results.length ? results.map((p) => (
              <button key={p.id} type="button" role="listitem" className="st-pick" onClick={() => pick(p)}>
                <span className="st-pick-name">{p.name}</span>
                <span className="st-pick-meta">{p.clubs.length} clubs</span>
                <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )) : <p className="st-empty">No checked career for that name yet. Only careers we have checked by hand are in here.</p>}
          </div>
        ) : (
          <div>
            <p className="st-label">A few to start with</p>
            <div className="st-list" role="list" aria-label="Ideas">
              {ideas.map((p) => (
                <button key={p.id} type="button" role="listitem" className="st-pick" onClick={() => pick(p)}>
                  <span className="st-pick-name">{p.name}</span>
                  <span className="st-pick-meta">{p.clubs.length} clubs</span>
                  <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="st-sub st-quiet" style={{ marginTop: 10 }}>{list.length} checked careers to choose from.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="st-screen">
      <div className="st-top"><button type="button" className="st-back" onClick={() => setPlayer(null)} aria-label="Pick someone else"><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">{player.name}</h1>
        <p className="st-sub">Your mate sees the clubs above the line, then one more for every miss. Five guesses.</p>
      </div>

      <div className="st-career" aria-label={`${player.name}'s career`}>
        {player.clubs.map((club, i) => {
          const col = clubColour(club, CLUB_PACK_COLOURS);
          const hidden = i >= shown;
          return (
            <React.Fragment key={i}>
              {i === shown && <div className="st-cut" role="separator">Hidden at the start</div>}
              <div className={`st-club${hidden ? " is-hidden" : ""}`}>
                <span className="st-club-n">{i + 1}</span>
                <span className="st-crest" aria-hidden="true" style={{ background: col || "var(--s3)", color: col ? onColour(col) : "var(--t3)" }}>{clubAbbr(club, CLUB_PACK_ABBR)}</span>
                <span className="st-club-name">{club}</span>
                {player.loans?.[i] && <span className="st-club-tag" style={{ color: "var(--gold)", WebkitTextFillColor: "var(--gold)" }}>loan</span>}
                {hidden && <span className="st-club-tag"><EyeOff size={13} strokeWidth={2.3} aria-hidden="true" /> hidden</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="st-step">
        <span className="st-step-tx">They start with <strong>{shown}</strong> of {player.clubs.length}</span>
        <span className="st-step-btns">
          <button type="button" className="st-round" onClick={() => setShown((s) => Math.max(range.min, s - 1))} disabled={shown <= range.min} aria-label="Show one club fewer"><Minus size={18} strokeWidth={2.4} /></button>
          <button type="button" className="st-round" onClick={() => setShown((s) => Math.min(range.max, s + 1))} disabled={shown >= range.max} aria-label="Show one club more"><Plus size={18} strokeWidth={2.4} /></button>
        </span>
      </div>

      <div>
        <p className="st-label">Your taunt</p>
        <div className="st-taunts" role="radiogroup" aria-label="Your taunt">
          {STITCH_TAUNTS.map((t, i) => (
            <button key={i} type="button" role="radio" aria-checked={taunt === i} className="st-taunt" onClick={() => setTaunt(i)}>
              {taunt === i && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}{t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="st-label" htmlFor="st-name" style={{ display: "block" }}>Your first name</label>
        <input id="st-name" className="st-input" value={name} maxLength={22} onChange={(e) => { setErr(""); setName(e.target.value); }}
          placeholder="So they know who to blame" autoCapitalize="words" autoComplete="given-name" enterKeyHint="done" />
        {err && <p className="st-err" role="alert">{err}</p>}
      </div>

      <div className="st-actions">
        <button type="button" className="st-solid" onClick={make}>Get the link</button>
      </div>
    </div>
  );
}

// ── SHARE ─────────────────────────────────────────────────────────────────
export function StitchShare({ made, onAnother, onBack, track }) {
  const [state, setState] = useState("");
  const url = stitchUrl(made.token);
  const text = stitchShareText(made.taunt);
  const send = async () => {
    const r = await shareOrCopy(text, url);
    if (r) { setState(r); track?.("stitch-sent", { via: r === "sent" ? "share" : "copy" }); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setState("copied"); } catch { /* nothing to do */ }
  };
  return (
    <div className="st-screen">
      <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">Ready to send</h1>
        <p className="st-sub">The link never names him. Your mate gets five guesses.</p>
      </div>
      <div className="st-card">
        <p className="st-card-line">{stitchHeadline(made.name)}</p>
        <p className="st-card-taunt">“{STITCH_TAUNTS[made.taunt]}”</p>
        <p className="st-card-meta">{made.shown} clubs to start · {made.player.clubs.length - made.shown} hidden</p>
      </div>
      <span className="st-url" aria-label="Your link">{url}</span>
      <div className="st-actions">
        <button type="button" className="st-solid" onClick={send}>
          {state === "sent" ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> Sent</> : state === "copied" ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> Link copied</> : <><Share size={18} strokeWidth={2.4} aria-hidden="true" /> Send it</>}
        </button>
        <div className="st-links">
          <button type="button" className="st-link" onClick={copy}><Copy size={14} strokeWidth={2.4} aria-hidden="true" /> Copy link</button>
          <button type="button" className="st-link" onClick={onAnother}>Stitch up someone else</button>
        </div>
      </div>
    </div>
  );
}

// ── PLAY ──────────────────────────────────────────────────────────────────
function loadPlay(token) {
  try {
    const s = JSON.parse(localStorage.getItem(PLAY_KEY) || "null");
    return s && s.t === token && Array.isArray(s.attempts) ? s : null;
  } catch { return null; }
}
function savePlay(token, state) {
  try { localStorage.setItem(PLAY_KEY, JSON.stringify({ t: token, ...state })); } catch { /* private mode */ }
}

/** "You 1, Alex 0": the receiver's side first. */
export function h2hLine(tally, won, sender) {
  const s = stitchScore(tally, won);
  const who = sender || "Your mate";
  return { ...s, score: `You ${s.me}, ${who} ${s.them}` };
}

export function StitchPlay({ token, parsed, player, onBack, onReport, services, track, onSendBack, onPlayTrail, trailOpen = false }) {
  const sender = firstName(parsed.name) || "";
  const who = sender || "Your mate";
  const finished = useRef(false);
  const stitch = useMemo(() => ({
    opening: parsed.shown,
    sub: `${who} stitched you up`,
    load: () => loadPlay(token),
    save: (state) => savePlay(token, state),
    onFinish: ({ won, clubsUsed }) => {
      if (finished.current) return;
      finished.current = true;
      track?.("stitch-finished", { won: !!won, clubs: clubsUsed, shown: parsed.shown, src: player.src });
    },
    Banner: () => (
      <div className="st-taunt-in">
        <Quote size={16} strokeWidth={2.4} aria-hidden="true" />
        <div><b>{STITCH_TAUNTS[parsed.taunt]}</b><span>{who} picked him and shows you {parsed.shown} clubs.{parsed.tally[0] + parsed.tally[1] > 0 ? ` ${who} ${parsed.tally[0]}, you ${parsed.tally[1]} so far.` : ""}</span></div>
      </div>
    ),
    Done: ({ won, clubsUsed }) => {
      const h = h2hLine(parsed.tally, won, sender);
      return (
        <>
          <div className={`st-h2h ${won ? "is-win" : "is-loss"}`} role="status">
            <span className="st-h2h-score">{h.score}</span>
            <span className="st-h2h-line">{won
              ? `Got him on ${clubsUsed} ${clubsUsed === 1 ? "club" : "clubs"}. ${who} gave you ${parsed.shown}.`
              : `Stitched up. ${who} wins this one.`}</span>
          </div>
          <div className="st-actions" style={{ marginTop: 14 }}>
            {trailOpen
              ? <button type="button" className="st-solid" onClick={onPlayTrail}>Play today's Transfer Trail</button>
              : <button type="button" className="st-solid" onClick={onBack}>Back to Ball IQ</button>}
            <div className="st-links">
              <button type="button" className="st-link" onClick={() => onSendBack?.({ tally: h.backTally, to: sender })}><Swords size={14} strokeWidth={2.4} aria-hidden="true" /> Send one back</button>
            </div>
          </div>
        </>
      );
    },
  }), [token, parsed, player, who, sender, track, trailOpen, onPlayTrail, onBack, onSendBack]);
  return <TransferTrail key={token} player={player} onBack={onBack} onReport={onReport} services={services} stitch={stitch} />;
}

/** A link that does not open: a broken token, or a career no longer listed. */
export function StitchBroken({ onBack, onBuild }) {
  return (
    <div className="st-screen">
      <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">This stitch-up has come apart</h1>
        <p className="st-sub">The link is broken or cut short. Ask your mate to send it again, or make one of your own.</p>
      </div>
      <div className="st-actions">
        <button type="button" className="st-solid" onClick={onBuild}>Stitch up a mate</button>
        <div className="st-links"><button type="button" className="st-link" onClick={onBack}>Back to Ball IQ</button></div>
      </div>
    </div>
  );
}

// ── THE SCREEN ────────────────────────────────────────────────────────────
export default function StitchUp({ token = null, onBack, onReport, services, track, defaultName, onPlayTrail }) {
  const native = useMemo(() => isNativeShell(), []);
  // Today's Trail still to play: then that is the one solid button after a
  // stitch-up (here, not in App.jsx, to keep Home's eager bytes where they are).
  const trailOpen = useMemo(() => !!onPlayTrail && !!getTrailAnswer(new Date()) && !finishedBefore(loadTrailDay(new Date())?.status), [onPlayTrail]);
  const parsed = useMemo(() => (token ? parseStitchToken(token) : null), [token]);
  const player = useMemo(() => (parsed ? findStitchPlayer(parsed.hash) : null), [parsed]);
  const valid = !!(parsed && player && parsed.shown < player.clubs.length);
  const [view, setView] = useState(token ? "play" : "build");
  const [made, setMade] = useState(null);
  const [back, setBack] = useState(null);
  const nameDefault = useMemo(() => { try { return typeof defaultName === "function" ? defaultName() || "" : defaultName || ""; } catch { return ""; } }, [defaultName]);

  const opened = useRef(false);
  useEffect(() => {
    if (!token || opened.current) return;
    opened.current = true;
    track?.("stitch-opened", valid ? { valid: true, shown: parsed.shown, src: player.src, back: parsed.tally[0] + parsed.tally[1] > 0 } : { valid: false });
  }, [token, valid, parsed, player, track]);

  const onMade = useCallback((m) => {
    track?.("stitch-made", { shown: m.shown, of: m.player.clubs.length, taunt: m.taunt, src: m.player.src, back: m.back, named: !!m.name });
    setMade(m); setView("share");
  }, [track]);
  const onSendBack = useCallback((b) => { setBack(b); setView("build"); }, []);
  // Each view starts at its top: "Get the link" sits low on the builder, and
  // the share view opened scrolled past its own title.
  useEffect(() => { try { window.scrollTo(0, 0); } catch { /* fine */ } }, [view, back]);

  if (native) return null;
  if (view === "play") {
    if (!valid) return <StitchBroken onBack={onBack} onBuild={() => setView("build")} />;
    return <StitchPlay token={token} parsed={parsed} player={player} onBack={onBack} onReport={onReport} services={services} track={track} onSendBack={onSendBack} onPlayTrail={onPlayTrail} trailOpen={trailOpen} />;
  }
  if (view === "share" && made) return <StitchShare made={made} track={track} onBack={() => setView("build")} onAnother={() => { setMade(null); setBack(null); setView("build"); }} />;
  // Back from the share view keeps the stitch-up as it was (`initial`).
  return <StitchBuilder key={made ? "edit" : back ? "back" : "new"} onBack={onBack} onMade={onMade} back={back} defaultName={nameDefault} initial={made} />;
}
