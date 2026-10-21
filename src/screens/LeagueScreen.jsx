import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Copy, Check, Crown, TrendingDown, Ghost, Trophy, Users, Share } from "lucide-react";
import "./league.css";
import {
  getLeagueTable, createLeague, joinLeague, leaveLeague, leagueInviteUrl, parseLeagueInviteToken,
  inviteShareText, h2hShareText, finalShareText, whistleLine, rankText, weekOfLabelEnglish, DAY_LETTERS, dayLetters,
  LABEL_COPY, labelText, errorText, membersBucket, markFinalSeen, clearLeagueInvite, h2hLeagueName,
  saveLeagueUi, readLeagueUi, announceLeagueOpen,
} from "../lib/leagues.js";
import { avatarColour } from "../lib/avatarColour.js";
import { isProfaneUsername } from "../lib/profanity.js";
import { useModalA11y } from "../useModalA11y.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { t, useT } from "../i18n/index.js";

// MATES' LEAGUES, PHASE 1 (web only; spec ball-iq-audit/2026-10-16/leagues).
// Three surfaces in one lazy chunk, so Home's eager budget never carries them:
//   LeagueScreen       the week's table
//   LeagueCreateSheet  name it, then share the link
//   LeagueJoinSheet    "Alex invited you to The Lads"
// One solid button per surface; everything else is a hairline link or a tint.
// Lucide icons only, sentence case, no eyebrows.

// The words are t() since i18n step 7 (the lg.* keys; lib/leagues.js has the
// rest). How points work: lg.help.<n> and lg.help.<n>.d.
const POINTS_HELP = [1, 2, 3, 4];

const isMobileWeb = () => { try { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""); } catch { return false; } };

// `text` carries the link already (the share lines end with it).
async function shareOrCopy({ text, files }) {
  try {
    if (files && navigator.canShare?.({ files })) { await navigator.share({ files, text }); return "share"; }
    if (navigator.share) { await navigator.share({ text }); return "share"; }
  } catch (e) {
    if (e && (e.name === "AbortError" || /cancel/i.test(e.message || ""))) return null;
  }
  try { await navigator.clipboard.writeText(text); return "copy"; } catch { return null; }
}

function Avatar({ name }) {
  const c = avatarColour(null, name || "?");
  return <span className="lg-av" style={{ background: c.bg, color: c.ink, WebkitTextFillColor: c.ink }} aria-hidden="true">{String(name || "?").trim().charAt(0).toUpperCase()}</span>;
}

function LabelChip({ label, joint }) {
  if (label === "crown") return <span className="lg-chip is-crown"><Crown size={12} strokeWidth={2.4} aria-hidden="true" />{joint ? t("lg.joint") : labelText("crown")}</span>;
  if (label === "bottled") return <span className="lg-chip"><TrendingDown size={12} strokeWidth={2.4} aria-hidden="true" />{labelText("bottled")}</span>;
  if (label === "ghost") return <span className="lg-chip"><Ghost size={12} strokeWidth={2.4} aria-hidden="true" />{labelText("ghost")}</span>;
  if (label === "spoon") return <span className="lg-chip">{labelText("spoon")}</span>;
  return null;
}

// ── THE TABLE ────────────────────────────────────────────────────────────────
// The fetch, then the view. The view is pure on its data, so it can be drawn
// from fixtures (tests/unit/league-screens.test.js).
export default function LeagueScreen({ leagueId, onBack, track, ...rest }) {
  useT();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const viewed = useRef(false);

  useEffect(() => {
    let alive = true;
    setState("loading");
    getLeagueTable(leagueId).then((t) => {
      if (!alive) return;
      if (!t || !t.meta) { setState("missing"); return; }
      setData(t); setState("ready");
      if (t.meta.is_final) markFinalSeen(t.meta.id, t.meta.week_start);
      if (!viewed.current) { viewed.current = true; track?.("league-table-view", { final: !!t.meta.is_final, members_bucket: membersBucket(t.rows.length) }); }
    });
    return () => { alive = false; };
  }, [leagueId, track]);

  if (state === "loading") {
    return <div className="lg-screen" aria-busy="true"><div className="lg-top"><button type="button" className="lg-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div><div className="lg-skel" /></div>;
  }
  if (state === "missing") {
    return (
      <div className="lg-screen">
        <div className="lg-top"><button type="button" className="lg-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
        <div className="lg-empty"><p className="lg-sub">{t("lg.missing")}</p></div>
      </div>
    );
  }
  return <LeagueTableView data={data} leagueId={leagueId} onBack={onBack} track={track} {...rest} />;
}

export function LeagueTableView({ data, leagueId, onBack, nextUp = [], isAnon = false, onSave, track, inviter = "" }) {
  useT();
  const [help, setHelp] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const meta = data?.meta;
  const rows = useMemo(() => data?.rows || [], [data]);
  const url = meta ? leagueInviteUrl(meta.code, meta.name, inviter || meta.my_name) : null;
  const flash = (s) => { setNote(s); setTimeout(() => setNote(""), 2200); };
  const playable = nextUp.filter((n) => ["footle", "daily7", "trail", "top10"].includes(n.key === "daily" ? "daily7" : n.key));

  const invite = useCallback(async () => {
    if (!url) return;
    const via = await shareOrCopy({ text: inviteShareText(meta.name, url) });
    if (via) { track?.("league-invite-share", { via }); if (via === "copy") flash(t("lg.copied")); }
  }, [url, meta, track]);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); flash(t("lg.copied")); track?.("league-invite-share", { via: "copy" }); } catch { flash(url); }
  };
  const shareFinal = async () => {
    if (busy || !meta) return;
    setBusy(true);
    const text = finalShareText(meta, rows);
    try {
      let files;
      try {
        const { generateShareCard } = await import("../lib/shareCardRender.js");
        const joint = rows.filter((r) => r.labels?.includes("crown")).length > 1;
        const blob = await generateShareCard("league", {
          // The card image is English by design (lib/shareCardRender.js).
          name: meta.name, weekLine: `${weekOfLabelEnglish(meta.week_start)} · Final table`,
          rows: rows.slice(0, 8).map((r) => ({ rank: rankText(r.rank, r.tied), name: r.name, points: r.points, me: r.is_me,
            tags: (r.labels || []).map((l) => (l === "crown" && joint ? "Joint winners" : LABEL_COPY[l])).filter(Boolean) })),
          link: `balliq.app/l/${meta.code}`,
        });
        files = [new File([blob], "ball-iq-league.png", { type: "image/png" })];
      } catch { files = undefined; }
      const via = await shareOrCopy({ text: url ? `${text} ${url}` : text, files });
      if (via) track?.("league-final-share", { via });
      if (via === "copy") flash(t("lg.copiedShort"));
    } finally { setBusy(false); }
  };
  const leave = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await leaveLeague(leagueId);
    setBusy(false);
    if (ok) { track?.("league-leave"); onBack?.(); } else flash(t("lg.leaveFail"));
  };

  const final = !!meta.is_final;
  const joint = rows.filter((r) => r.labels?.includes("crown")).length > 1;
  const cell = (r, i) => {
    const day = meta.week_start + i;
    const v = r.per_day?.[i];
    if (!final && day > meta.today) return { cls: "is-future", t: "" };
    if (day < (r.joined_day ?? -Infinity)) return { cls: "is-before", t: "" };
    // Today is still open: nothing yet is not a miss.
    if (v == null && !final && day === meta.today) return { cls: "is-future", t: "" };
    if (v == null) return { cls: "is-miss", t: "–" };
    return { cls: v >= 30 ? "is-big" : "", t: String(v) };
  };
  const last = data.last_week;
  const solid = final
    ? <button type="button" className="lg-solid" onClick={shareFinal} disabled={busy}><Share size={18} strokeWidth={2.4} aria-hidden="true" /> {t("lg.shareFinal")}</button>
    : playable.length
      ? <button type="button" className="lg-solid" onClick={() => playable[0].onTap?.()}>{t("lg.playToday")}</button>
      : <button type="button" className="lg-solid" onClick={invite}><Users size={18} strokeWidth={2.4} aria-hidden="true" /> {t("lg.invite")}</button>;

  return (
    <div className="lg-screen">
      <div className="lg-top">
        <button type="button" className="lg-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} /></button>
      </div>
      <header className="lg-head">
        <h1 className="lg-title">{meta.name}</h1>
        <p className="lg-sub">{whistleLine(meta)}</p>
      </header>

      <div className="lg-table" role="table" aria-label={t(final ? "lg.ariaFinal" : "lg.ariaWeek", { name: meta.name })}>
        <div className="lg-days" aria-hidden="true">
          <span /><span />
          <span className="lg-cells">{dayLetters().map((d, i) => <span key={i} className={!final && meta.week_start + i === meta.today ? "is-today" : ""}>{d}</span>)}</span>
          <span className="lg-days-t">{t("lg.ptsHead")}</span>
        </div>
        {rows.map((r, idx) => (
          <div key={idx} className={`lg-row${r.is_me ? " is-me" : ""}`} role="row">
            <span className="lg-rank" role="cell">{rankText(r.rank, r.tied)}</span>
            <Avatar name={r.name} />
            <div className="lg-mid" role="cell">
              <div className="lg-name">{r.name}{r.is_me ? <span className="lg-you">{t("lg.you")}</span> : null}</div>
              {final && r.labels?.length > 0 && (
                <div className="lg-chips">{r.labels.map((l) => <LabelChip key={l} label={l} joint={joint} />)}</div>
              )}
              <div className="lg-cells" aria-label={t("lg.cellsAria")}>
                {DAY_LETTERS.map((_, i) => { const c = cell(r, i); return <span key={i} className={`lg-cell ${c.cls}${!final && meta.week_start + i === meta.today ? " is-today" : ""}`}>{c.t}</span>; })}
              </div>
            </div>
            <span className="lg-total" role="cell">{r.points}</span>
          </div>
        ))}
        {rows.length === 1 && <p className="lg-alone">{t("lg.alone")}</p>}
      </div>

      <div className="lg-actions">
        {solid}
        <div className="lg-links">
          <button type="button" className="lg-link" onClick={copyLink}>{t("lg.copyLink")}</button>
          <button type="button" className="lg-link" onClick={() => setHelp((h) => !h)} aria-expanded={help}>{t("lg.how")}</button>
          <button type="button" className="lg-link" onClick={() => setConfirmLeave(true)}>{t("lg.leave")}</button>
        </div>
        {note && <p className="lg-note" role="status">{note}</p>}
        {confirmLeave && (
          <div className="lg-confirm" role="group" aria-label={t("lg.leaveQ")}>
            <span>{t("lg.leaveBody", { name: meta.name })}</span>
            <span className="lg-confirm-links">
              <button type="button" className="lg-link" onClick={leave} disabled={busy}>{t("lg.leaveYes")}</button>
              <button type="button" className="lg-link" onClick={() => setConfirmLeave(false)}>{t("lg.stay")}</button>
            </span>
          </div>
        )}
        {help && (
          <dl className="lg-help">
            {POINTS_HELP.map((n) => <div key={n}><dt>{t(`lg.help.${n}`)}</dt><dd>{t(`lg.help.${n}.d`)}</dd></div>)}
          </dl>
        )}
      </div>

      <footer className="lg-foot">
        {last && last.winners?.length > 0 && (
          <p className="lg-sub"><Trophy size={13} strokeWidth={2.4} aria-hidden="true" /> {t(last.winners.length > 1 ? "lg.lastShared" : "lg.lastWon", { names: last.winners.join(t("lg.andJoin")), n: last.points })}</p>
        )}
        {isAnon && onSave && (
          <div className="lg-save">
            <span className="lg-sub">{t("lg.phoneOnly")}</span>
            <button type="button" className="lg-pill" onClick={onSave}>{t("lg.save")}</button>
          </div>
        )}
        {isMobileWeb() && <p className="lg-sub lg-quiet">{t("lg.appSoon")}</p>}
      </footer>
    </div>
  );
}

// ── SHEET FRAME ──────────────────────────────────────────────────────────────
function Sheet({ label, onClose, full = false, children }) {
  const ref = useRef(null);
  // Focus trap, Escape and the back button, as every other sheet in the app.
  useModalA11y({ isOpen: true, onClose, ref });
  return (
    <div className={`lg-scrim${full ? " is-full" : ""}`} onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="lg-sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// The step a sheet reached, kept across the app's remount (lib/leagues.js).
function useLeagueUi() {
  const [ui, setUi] = useState(() => readLeagueUi());
  useEffect(() => {
    const on = () => setUi(readLeagueUi());
    window.addEventListener("biq:league-ui", on);
    return () => window.removeEventListener("biq:league-ui", on);
  }, []);
  return ui;
}

const nameOk = (s, max) => { const v = String(s || "").replace(/\s+/g, " ").trim(); return v.length >= 1 && v.length <= max && !isProfaneUsername(v) ? v : null; };

// ── CREATE AND INVITE ────────────────────────────────────────────────────────
export function LeagueCreateSheet({ seed = "manual", vs = "", h2h = null, displayName = "", ensureSession, onClose, onOpenTable, track }) {
  useT();
  const ui = useLeagueUi();
  const [name, setName] = useState(() => (ui?.kind === "create" && ui.name) || (vs ? h2hLeagueName(vs, displayName) : t("lg.matesLeague")).slice(0, 32));
  const [made, setMade] = useState(() => (ui?.kind === "create" && ui.made) || null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(() => !!(ui?.kind === "create" && ui.creating));
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (ui?.kind === "create" && ui.made) { setMade(ui.made); setBusy(false); }
    else if (ui?.kind === "create" && !ui.creating) setBusy(false);
  }, [ui]);
  useEffect(() => { if (!busy) return undefined; const timer = setTimeout(() => setBusy(false), 15000); return () => clearTimeout(timer); }, [busy]);
  const close = () => { saveLeagueUi(null); onClose?.(); };
  const url = made ? leagueInviteUrl(made.code, made.name, displayName) : "";
  const text = made ? (h2h ? h2hShareText(h2h, url) : inviteShareText(made.name, url)) : "";

  const create = async () => {
    if (busy) return;
    const n = nameOk(name, 32);
    if (!n) { setErr(errorText("bad_name")); return; }
    setBusy(true); setErr("");
    saveLeagueUi({ kind: "create", seed, vs, h2h, name: n, creating: true });
    if (!(await ensureSession?.())) { setBusy(false); saveLeagueUi({ kind: "create", seed, vs, h2h, name: n }); return; }
    const r = await createLeague({ name: n, displayName: nameOk(displayName, 22) || "Player", seed });
    setBusy(false);
    if (r?.error) { saveLeagueUi({ kind: "create", seed, vs, h2h, name: n }); setErr(errorText(r.error)); return; }
    track?.("league-created", { seed });
    saveLeagueUi({ kind: "create", seed, vs, h2h, made: r });
    setMade(r);
  };
  const share = async () => {
    const via = await shareOrCopy({ text });
    if (via) { track?.("league-invite-share", { via }); if (via === "copy") { setCopied(true); setTimeout(() => setCopied(false), 2200); } }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); track?.("league-invite-share", { via: "copy" }); } catch { /* the field shows it */ }
  };

  return (
    <Sheet label={made ? t("lg.inviteTitle") : t("lg.start")} onClose={close}>
      <span className="lg-well" aria-hidden="true"><Trophy size={22} strokeWidth={2.2} /></span>
      {!made ? (
        <>
          <h2 className="lg-sheet-title">{t("lg.start")}</h2>
          <label className="lg-field">
            <span className="lg-field-k">{t("lg.nameK")}</span>
            <input className="lg-input" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); }} autoComplete="off" enterKeyHint="go" />
          </label>
          <p className="lg-sub">{t("lg.rules")}</p>
          {err && <p className="lg-err" role="alert">{err}</p>}
          <button type="button" className="lg-solid" onClick={create} disabled={busy}>{busy ? t("lg.creating") : t("lg.create")}</button>
          <button type="button" className="lg-link lg-link-c" onClick={close}>{t("lg.notNow")}</button>
        </>
      ) : (
        <>
          <h2 className="lg-sheet-title">{t("lg.ready", { name: made.name })}</h2>
          <div className="lg-linkbox">
            {/* Out of the tab order, so the sheet's first focus is the Copy
                button rather than a field that selects itself on open. */}
            <input className="lg-input" value={url} readOnly tabIndex={-1} aria-label={t("lg.linkAria")} onFocus={(e) => e.target.select()} />
            <button type="button" className="lg-copy" onClick={copy} aria-label={t("lg.copyLink")}>{copied ? <Check size={18} strokeWidth={2.6} /> : <Copy size={18} strokeWidth={2.2} />}</button>
          </div>
          <p className="lg-sub">{t("lg.rules")}</p>
          <button type="button" className="lg-solid" onClick={share}><Share size={18} strokeWidth={2.4} aria-hidden="true" /> {copied ? t("lg.linkCopied") : t("lg.shareInvite")}</button>
          <div className="lg-links">
            <a className="lg-link" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => track?.("league-invite-share", { via: "wa" })}>{t("lg.wa")}</a>
            <button type="button" className="lg-link" onClick={() => { announceLeagueOpen(made.id); onOpenTable?.(made.id); }}>{t("lg.open")}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

// ── JOIN ─────────────────────────────────────────────────────────────────────
export function LeagueJoinSheet({ token, displayName = "", isGuest = false, ensureSession, onClose, onJoined, track }) {
  useT();
  const invite = useMemo(() => parseLeagueInviteToken(token), [token]);
  const ui = useLeagueUi();
  const [name, setName] = useState(() => String((ui?.kind === "join" && ui.name) || displayName || "").slice(0, 22));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(() => !!(ui?.kind === "join" && ui.joining));
  useEffect(() => { if (ui?.kind === "join" && !ui.joining) setBusy(false); }, [ui]);
  useEffect(() => { if (!busy) return undefined; const timer = setTimeout(() => setBusy(false), 15000); return () => clearTimeout(timer); }, [busy]);
  const seen = useRef(false);
  useEffect(() => { if (!seen.current) { seen.current = true; track?.("league-join-view", { guest: !!isGuest }); } }, [track, isGuest]);

  const join = async () => {
    if (busy || !invite) return;
    const n = nameOk(name, 22);
    if (!n) { setErr(errorText("bad_display_name")); return; }
    setBusy(true); setErr("");
    saveLeagueUi({ kind: "join", token, name: n, joining: true });
    if (!(await ensureSession?.())) { setBusy(false); saveLeagueUi({ kind: "join", token, name: n }); track?.("league-join-fail", { reason: "session" }); return; }
    const r = await joinLeague({ code: invite.code, displayName: n });
    setBusy(false);
    if (r?.error) { saveLeagueUi({ kind: "join", token, name: n }); setErr(errorText(r.error)); track?.("league-join-fail", { reason: r.error }); return; }
    clearLeagueInvite();
    track?.("league-joined", { guest: !!isGuest, seed: r.seed || "manual" });
    // Opens the table now, or on the app's next mount if this one has gone.
    announceLeagueOpen(r.id);
    onJoined?.(r);
  };
  const dismiss = () => { clearLeagueInvite(); saveLeagueUi(null); onClose?.(); };

  if (!invite) {
    return (
      <Sheet label={t("lg.inviteAria")} onClose={dismiss} full>
        <h2 className="lg-sheet-title">{t("lg.badLink")}</h2>
        <p className="lg-sub">{t("lg.badLinkSub")}</p>
        <button type="button" className="lg-solid" onClick={dismiss}>{t("su.backApp")}</button>
      </Sheet>
    );
  }
  return (
    <Sheet label={t("lg.joinAria", { name: invite.name || t("lg.theLeague") })} onClose={dismiss} full>
      <span className="lg-well" aria-hidden="true"><Trophy size={24} strokeWidth={2.2} /></span>
      <p className="lg-sub lg-c">{t("lg.invited", { name: invite.inviter || t("su.aMate") })}</p>
      <h2 className="lg-join-name">{invite.name || t("lg.aLeague")}</h2>
      <ul className="lg-facts">
        <li>{t("lg.f1")}</li>
        <li>{t("lg.f2")}</li>
        <li>{t("lg.f3")}</li>
      </ul>
      <label className="lg-field">
        <span className="lg-field-k">{t("lg.yourName")}</span>
        <input className="lg-input" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") join(); }} autoComplete="nickname" enterKeyHint="go" />
      </label>
      {err && <p className="lg-err" role="alert">{err}</p>}
      <button type="button" className="lg-solid" onClick={join} disabled={busy}>{busy ? t("lg.joining") : t("lg.join")}</button>
      <button type="button" className="lg-link lg-link-c" onClick={dismiss}>{t("lg.notNow")}</button>
    </Sheet>
  );
}
