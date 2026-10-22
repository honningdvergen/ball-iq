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
import { STITCH_TAUNTS, makeStitchToken, parseStitchToken, stitchScore, cleanStitchName } from "../lib/stitchToken.js";
import { clubColour, clubAbbr, onColour } from "../lib/clubColour.js";
import { CLUB_PACK_COLOURS, CLUB_PACK_ABBR } from "../data/clubPackColours.js";
import { isNativeShell } from "../lib/inAppBrowser.js";
import { getTrailAnswer, loadTrailDay, finishedBefore } from "../lib/trail.js";
import { isProfaneUsername } from "../lib/profanity.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { t, useT, useLang } from "../i18n/index.js";
import { rich } from "../i18n/rich.jsx";

const NAME_KEY = "biq_stitch_name";
const PLAY_KEY = "biq_stitch_play";
export const STITCH_ORIGIN = "https://balliq.app";
export const stitchUrl = (token) => `${STITCH_ORIGIN}/s/${token}`;

const readName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };
const firstName = (s) => cleanStitchName(String(s || "").split(" ")[0]);
// lib/stitchToken.js stitchHeadline, in the player's language (the server's
// link preview keeps that English one).
const headline = (name) => t("su.headline", { name: cleanStitchName(name) || t("su.aMate") });

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
// The screen is t() too since step 7 (the su.* keys), its taunt chips included.
// The link's preview (api/s.js, api/og.js) is the server's, and English.
export function stitchShareText(taunt) {
  const said = STITCH_TAUNTS[taunt] ? t(`share.taunt.${taunt}`) : t("share.stitchDefault");
  return t("share.stitch", { taunt: said });
}

// ── BUILD ─────────────────────────────────────────────────────────────────
export function StitchBuilder({ onBack, onMade, back = null, defaultName = "", now = null, initial = null, rnd }) {
  useT();
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
    if (n && isProfaneUsername(n)) { setErr(t("su.badName")); return; }
    const token = makeStitchToken({ hash: stitchHashOf(player), shown, taunt, name: n, tally: back?.tally || [0, 0] });
    if (!token) return;
    try { if (n) localStorage.setItem(NAME_KEY, n); } catch { /* private mode */ }
    onMade?.({ token, player, shown, taunt, name: n, back: !!back });
  };

  if (!player) {
    return (
      <div className="st-screen">
        <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
        <div className="st-head">
          <h1 className="st-title">{back?.to ? t("su.backTo", { name: back.to }) : t("dd.stitch")}</h1>
          <p className="st-sub">{t("su.sub")}</p>
        </div>
        <div className="st-search">
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <input className="st-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("su.search")} aria-label={t("su.search")}
            autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="search" />
        </div>
        {q.trim().length >= 2 ? (
          <div className="st-list" role="list" aria-label={t("su.players")}>
            {results.length ? results.map((p) => (
              <button key={p.id} type="button" role="listitem" className="st-pick" onClick={() => pick(p)}>
                <span className="st-pick-name">{p.name}</span>
                <span className="st-pick-meta">{t("su.clubs", { n: p.clubs.length })}</span>
                <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )) : <p className="st-empty">{t("su.none")}</p>}
          </div>
        ) : (
          <div>
            <p className="st-label">{t("su.ideasLabel")}</p>
            <div className="st-list" role="list" aria-label={t("su.ideas")}>
              {ideas.map((p) => (
                <button key={p.id} type="button" role="listitem" className="st-pick" onClick={() => pick(p)}>
                  <span className="st-pick-name">{p.name}</span>
                  <span className="st-pick-meta">{t("su.clubs", { n: p.clubs.length })}</span>
                  <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="st-sub st-quiet" style={{ marginTop: 10 }}>{t("su.count", { n: list.length })}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="st-screen">
      <div className="st-top"><button type="button" className="st-back" onClick={() => setPlayer(null)} aria-label={t("su.pickOther")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">{player.name}</h1>
        <p className="st-sub">{t("su.how")}</p>
      </div>

      <div className="st-career" aria-label={t("su.careerAria", { name: player.name })}>
        {player.clubs.map((club, i) => {
          const col = clubColour(club, CLUB_PACK_COLOURS);
          const hidden = i >= shown;
          return (
            <React.Fragment key={i}>
              {i === shown && <div className="st-cut" role="separator">{t("su.cut")}</div>}
              <div className={`st-club${hidden ? " is-hidden" : ""}`}>
                <span className="st-club-n">{i + 1}</span>
                <span className="st-crest" aria-hidden="true" style={{ background: col || "var(--s3)", color: col ? onColour(col) : "var(--t3)" }}>{clubAbbr(club, CLUB_PACK_ABBR)}</span>
                <span className="st-club-name">{club}</span>
                {player.loans?.[i] && <span className="st-club-tag" style={{ color: "var(--gold)", WebkitTextFillColor: "var(--gold)" }}>{t("su.loan")}</span>}
                {hidden && <span className="st-club-tag"><EyeOff size={13} strokeWidth={2.3} aria-hidden="true" /> {t("su.hidden")}</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="st-step">
        <span className="st-step-tx">{rich(t("su.start", { total: player.clubs.length }), { n: <strong>{shown}</strong> })}</span>
        <span className="st-step-btns">
          <button type="button" className="st-round" onClick={() => setShown((s) => Math.max(range.min, s - 1))} disabled={shown <= range.min} aria-label={t("su.fewer")}><Minus size={18} strokeWidth={2.4} /></button>
          <button type="button" className="st-round" onClick={() => setShown((s) => Math.min(range.max, s + 1))} disabled={shown >= range.max} aria-label={t("su.more")}><Plus size={18} strokeWidth={2.4} /></button>
        </span>
      </div>

      <div>
        <p className="st-label">{t("su.taunt")}</p>
        <div className="st-taunts" role="radiogroup" aria-label={t("su.taunt")}>
          {/* The chips in the player's language: the very words the share will send (share.taunt.<i>). */}
          {STITCH_TAUNTS.map((_, i) => (
            <button key={i} type="button" role="radio" aria-checked={taunt === i} className="st-taunt" onClick={() => setTaunt(i)}>
              {taunt === i && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}{t(`share.taunt.${i}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="st-label" htmlFor="st-name" style={{ display: "block" }}>{t("su.name")}</label>
        <input id="st-name" className="st-input" value={name} maxLength={22} onChange={(e) => { setErr(""); setName(e.target.value); }}
          placeholder={t("su.namePh")} autoCapitalize="words" autoComplete="given-name" enterKeyHint="done" />
        {err && <p className="st-err" role="alert">{err}</p>}
      </div>

      <div className="st-actions">
        <button type="button" className="st-solid" onClick={make}>{t("su.get")}</button>
      </div>
    </div>
  );
}

// ── SHARE ─────────────────────────────────────────────────────────────────
export function StitchShare({ made, onAnother, onBack, track }) {
  useT();
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
      <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">{t("su.ready")}</h1>
        <p className="st-sub">{t("su.readySub")}</p>
      </div>
      <div className="st-card">
        <p className="st-card-line">{headline(made.name)}</p>
        <p className="st-card-taunt">“{t(`share.taunt.${made.taunt}`)}”</p>
        <p className="st-card-meta">{t("su.meta", { n: made.shown, h: made.player.clubs.length - made.shown })}</p>
      </div>
      <span className="st-url" aria-label={t("su.linkAria")}>{url}</span>
      <div className="st-actions">
        <button type="button" className="st-solid" onClick={send}>
          {state === "sent" ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> {t("su.sent")}</> : state === "copied" ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> {t("su.copied")}</> : <><Share size={18} strokeWidth={2.4} aria-hidden="true" /> {t("su.send")}</>}
        </button>
        <div className="st-links">
          <button type="button" className="st-link" onClick={copy}><Copy size={14} strokeWidth={2.4} aria-hidden="true" /> {t("su.copy")}</button>
          <button type="button" className="st-link" onClick={onAnother}>{t("su.another")}</button>
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
  const who = sender || t("su.yourMate");
  return { ...s, score: t("su.score", { me: s.me, who, them: s.them }) };
}

export function StitchPlay({ token, parsed, player, onBack, onReport, services, track, onSendBack, onPlayTrail, trailOpen = false }) {
  const lang = useLang();
  const sender = firstName(parsed.name) || "";
  const who = sender || t("su.yourMate");
  const finished = useRef(false);
  const stitch = useMemo(() => ({
    opening: parsed.shown,
    sub: t("su.stitchedYou", { who }),
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
        <div><b>{STITCH_TAUNTS[parsed.taunt] ? t(`share.taunt.${parsed.taunt}`) : ""}</b><span>{t("su.banner", { who, n: parsed.shown })}{parsed.tally[0] + parsed.tally[1] > 0 ? t("su.soFar", { who, a: parsed.tally[0], b: parsed.tally[1] }) : ""}</span></div>
      </div>
    ),
    Done: ({ won, clubsUsed }) => {
      const h = h2hLine(parsed.tally, won, sender);
      return (
        <>
          <div className={`st-h2h ${won ? "is-win" : "is-loss"}`} role="status">
            <span className="st-h2h-score">{h.score}</span>
            <span className="st-h2h-line">{won
              ? t("su.got", { count: clubsUsed, n: clubsUsed, who, shown: parsed.shown })
              : t("su.lost", { who })}</span>
          </div>
          <div className="st-actions" style={{ marginTop: 14 }}>
            {trailOpen
              ? <button type="button" className="st-solid" onClick={onPlayTrail}>{t("su.playTrail")}</button>
              : <button type="button" className="st-solid" onClick={onBack}>{t("su.backApp")}</button>}
            <div className="st-links">
              <button type="button" className="st-link" onClick={() => onSendBack?.({ tally: h.backTally, to: sender })}><Swords size={14} strokeWidth={2.4} aria-hidden="true" /> {t("su.sendBack")}</button>
            </div>
          </div>
        </>
      );
    },
  // `lang`: the words above are read when this is built, so a language switch rebuilds it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [token, parsed, player, who, sender, track, trailOpen, onPlayTrail, onBack, onSendBack, lang]);
  return <TransferTrail key={token} player={player} onBack={onBack} onReport={onReport} services={services} stitch={stitch} />;
}

/** A link that does not open: a broken token, or a career no longer listed. */
export function StitchBroken({ onBack, onBuild }) {
  useT();
  return (
    <div className="st-screen">
      <div className="st-top"><button type="button" className="st-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
      <div className="st-head">
        <h1 className="st-title">{t("su.broken")}</h1>
        <p className="st-sub">{t("su.brokenSub")}</p>
      </div>
      <div className="st-actions">
        <button type="button" className="st-solid" onClick={onBuild}>{t("dd.stitch")}</button>
        <div className="st-links"><button type="button" className="st-link" onClick={onBack}>{t("su.backApp")}</button></div>
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
