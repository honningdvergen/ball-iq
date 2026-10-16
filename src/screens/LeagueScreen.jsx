import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Copy, Check, Crown, TrendingDown, Ghost, Trophy, Users, Share } from "lucide-react";
import "./league.css";
import {
  getLeagueTable, createLeague, joinLeague, leaveLeague, leagueInviteUrl, parseLeagueInviteToken,
  inviteShareText, h2hShareText, finalShareText, whistleLine, rankText, weekOfLabel, DAY_LETTERS,
  LABEL_COPY, ERROR_COPY, membersBucket, markFinalSeen, clearLeagueInvite, h2hLeagueName,
  saveLeagueUi, readLeagueUi, announceLeagueOpen,
} from "../lib/leagues.js";
import { avatarColour } from "../lib/avatarColour.js";
import { isProfaneUsername } from "../lib/profanity.js";
import { useModalA11y } from "../useModalA11y.js";

// MATES' LEAGUES, PHASE 1 (web only; spec ball-iq-audit/2026-10-16/leagues).
// Three surfaces in one lazy chunk, so Home's eager budget never carries them:
//   LeagueScreen       the week's table
//   LeagueCreateSheet  name it, then share the link
//   LeagueJoinSheet    "Alex invited you to The Lads"
// One solid button per surface; everything else is a hairline link or a tint.
// Lucide icons only, sentence case, no eyebrows.

const POINTS_HELP = [
  ["Footle and Transfer Trail", "10 for a first-go solve, down to 5. A miss still scores 1."],
  ["Daily 7", "Your score plus 3. Zero right scores 1."],
  ["Top 10", "A point a name, at least 1."],
  ["A day you skip", "Scores nothing and costs nothing else. Points count from the day you join."],
];

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
  if (label === "crown") return <span className="lg-chip is-crown"><Crown size={12} strokeWidth={2.4} aria-hidden="true" />{joint ? "Joint winners" : LABEL_COPY.crown}</span>;
  if (label === "bottled") return <span className="lg-chip"><TrendingDown size={12} strokeWidth={2.4} aria-hidden="true" />{LABEL_COPY.bottled}</span>;
  if (label === "ghost") return <span className="lg-chip"><Ghost size={12} strokeWidth={2.4} aria-hidden="true" />{LABEL_COPY.ghost}</span>;
  if (label === "spoon") return <span className="lg-chip">{LABEL_COPY.spoon}</span>;
  return null;
}

// ── THE TABLE ────────────────────────────────────────────────────────────────
// The fetch, then the view. The view is pure on its data, so it can be drawn
// from fixtures (tests/unit/league-screens.test.js).
export default function LeagueScreen({ leagueId, onBack, track, ...rest }) {
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
    return <div className="lg-screen" aria-busy="true"><div className="lg-top"><button type="button" className="lg-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button></div><div className="lg-skel" /></div>;
  }
  if (state === "missing") {
    return (
      <div className="lg-screen">
        <div className="lg-top"><button type="button" className="lg-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button></div>
        <div className="lg-empty"><p className="lg-sub">This table isn&rsquo;t available right now.</p></div>
      </div>
    );
  }
  return <LeagueTableView data={data} leagueId={leagueId} onBack={onBack} track={track} {...rest} />;
}

export function LeagueTableView({ data, leagueId, onBack, nextUp = [], isAnon = false, onSave, track, inviter = "" }) {
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
    if (via) { track?.("league-invite-share", { via }); if (via === "copy") flash("Invite link copied"); }
  }, [url, meta, track]);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); flash("Invite link copied"); track?.("league-invite-share", { via: "copy" }); } catch { flash(url); }
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
          name: meta.name, weekLine: `${weekOfLabel(meta.week_start)} · Final table`,
          rows: rows.slice(0, 8).map((r) => ({ rank: rankText(r.rank, r.tied), name: r.name, points: r.points, me: r.is_me,
            tags: (r.labels || []).map((l) => (l === "crown" && joint ? "Joint winners" : LABEL_COPY[l])).filter(Boolean) })),
          link: `balliq.app/l/${meta.code}`,
        });
        files = [new File([blob], "ball-iq-league.png", { type: "image/png" })];
      } catch { files = undefined; }
      const via = await shareOrCopy({ text: url ? `${text} ${url}` : text, files });
      if (via) track?.("league-final-share", { via });
      if (via === "copy") flash("Copied");
    } finally { setBusy(false); }
  };
  const leave = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await leaveLeague(leagueId);
    setBusy(false);
    if (ok) { track?.("league-leave"); onBack?.(); } else flash("Couldn't leave just now");
  };

  const final = !!meta.is_final;
  const joint = rows.filter((r) => r.labels?.includes("crown")).length > 1;
  const cell = (r, i) => {
    const day = meta.week_start + i;
    const v = r.per_day?.[i];
    if (!final && day > meta.today) return { cls: "is-future", t: "" };
    if (day < (r.joined_day ?? -Infinity)) return { cls: "is-before", t: "" };
    if (v == null) return { cls: "is-miss", t: "–" };
    return { cls: v >= 30 ? "is-big" : "", t: String(v) };
  };
  const last = data.last_week;
  const solid = final
    ? <button type="button" className="lg-solid" onClick={shareFinal} disabled={busy}><Share size={18} strokeWidth={2.4} aria-hidden="true" /> Share final table</button>
    : playable.length
      ? <button type="button" className="lg-solid" onClick={() => playable[0].onTap?.()}>Play today&rsquo;s</button>
      : <button type="button" className="lg-solid" onClick={invite}><Users size={18} strokeWidth={2.4} aria-hidden="true" /> Invite mates</button>;

  return (
    <div className="lg-screen">
      <div className="lg-top">
        <button type="button" className="lg-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} strokeWidth={2.4} /></button>
      </div>
      <header className="lg-head">
        <h1 className="lg-title">{meta.name}</h1>
        <p className="lg-sub">{whistleLine(meta)}</p>
      </header>

      <div className="lg-table" role="table" aria-label={`${meta.name}, ${final ? "final table" : "this week"}`}>
        <div className="lg-days" aria-hidden="true">
          <span /><span />
          <span className="lg-cells">{DAY_LETTERS.map((d, i) => <span key={i} className={!final && meta.week_start + i === meta.today ? "is-today" : ""}>{d}</span>)}</span>
          <span className="lg-days-t">Pts</span>
        </div>
        {rows.map((r, idx) => (
          <div key={idx} className={`lg-row${r.is_me ? " is-me" : ""}`} role="row">
            <span className="lg-rank" role="cell">{rankText(r.rank, r.tied)}</span>
            <Avatar name={r.name} />
            <div className="lg-mid" role="cell">
              <div className="lg-name">{r.name}{r.is_me ? <span className="lg-you"> (you)</span> : null}</div>
              {final && r.labels?.length > 0 && (
                <div className="lg-chips">{r.labels.map((l) => <LabelChip key={l} label={l} joint={joint} />)}</div>
              )}
              <div className="lg-cells" aria-label="Points per day, Monday to Sunday">
                {DAY_LETTERS.map((_, i) => { const c = cell(r, i); return <span key={i} className={`lg-cell ${c.cls}${!final && meta.week_start + i === meta.today ? " is-today" : ""}`}>{c.t}</span>; })}
              </div>
            </div>
            <span className="lg-total" role="cell">{r.points}</span>
          </div>
        ))}
        {rows.length === 1 && <p className="lg-alone">Just you so far. Send the link to the group.</p>}
      </div>

      <div className="lg-actions">
        {solid}
        <div className="lg-links">
          <button type="button" className="lg-link" onClick={copyLink}>Copy invite link</button>
          <button type="button" className="lg-link" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How points work</button>
          <button type="button" className="lg-link" onClick={() => setConfirmLeave(true)}>Leave league</button>
        </div>
        {note && <p className="lg-note" role="status">{note}</p>}
        {confirmLeave && (
          <div className="lg-confirm" role="group" aria-label="Leave this league?">
            <span>Leave {meta.name}? Your points stay on this week&rsquo;s table.</span>
            <span className="lg-confirm-links">
              <button type="button" className="lg-link" onClick={leave} disabled={busy}>Leave</button>
              <button type="button" className="lg-link" onClick={() => setConfirmLeave(false)}>Stay</button>
            </span>
          </div>
        )}
        {help && (
          <dl className="lg-help">
            {POINTS_HELP.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )}
      </div>

      <footer className="lg-foot">
        {last && last.winners?.length > 0 && (
          <p className="lg-sub"><Trophy size={13} strokeWidth={2.4} aria-hidden="true" /> Last week: {last.winners.join(" and ")} {last.winners.length > 1 ? "shared it" : "won"} on {last.points}</p>
        )}
        {isAnon && onSave && (
          <div className="lg-save">
            <span className="lg-sub">Your points live on this phone</span>
            <button type="button" className="lg-pill" onClick={onSave}>Save</button>
          </div>
        )}
        {isMobileWeb() && <p className="lg-sub lg-quiet">Playing in the app? League points arrive in the next update.</p>}
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
  const ui = useLeagueUi();
  const [name, setName] = useState(() => (ui?.kind === "create" && ui.name) || (vs ? h2hLeagueName(vs, displayName) : "Mates' league").slice(0, 32));
  const [made, setMade] = useState(() => (ui?.kind === "create" && ui.made) || null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(() => !!(ui?.kind === "create" && ui.creating));
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (ui?.kind === "create" && ui.made) { setMade(ui.made); setBusy(false); }
    else if (ui?.kind === "create" && !ui.creating) setBusy(false);
  }, [ui]);
  useEffect(() => { if (!busy) return undefined; const t = setTimeout(() => setBusy(false), 15000); return () => clearTimeout(t); }, [busy]);
  const close = () => { saveLeagueUi(null); onClose?.(); };
  const url = made ? leagueInviteUrl(made.code, made.name, displayName) : "";
  const text = made ? (h2h ? h2hShareText(h2h, url) : inviteShareText(made.name, url)) : "";

  const create = async () => {
    if (busy) return;
    const n = nameOk(name, 32);
    if (!n) { setErr(ERROR_COPY.bad_name); return; }
    setBusy(true); setErr("");
    saveLeagueUi({ kind: "create", seed, vs, h2h, name: n, creating: true });
    if (!(await ensureSession?.())) { setBusy(false); saveLeagueUi({ kind: "create", seed, vs, h2h, name: n }); return; }
    const r = await createLeague({ name: n, displayName: nameOk(displayName, 22) || "Player", seed });
    setBusy(false);
    if (r?.error) { saveLeagueUi({ kind: "create", seed, vs, h2h, name: n }); setErr(ERROR_COPY[r.error] || ERROR_COPY.offline); return; }
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
    <Sheet label={made ? "Invite your mates" : "Start a league"} onClose={close}>
      <span className="lg-well" aria-hidden="true"><Trophy size={22} strokeWidth={2.2} /></span>
      {!made ? (
        <>
          <h2 className="lg-sheet-title">Start a league</h2>
          <label className="lg-field">
            <span className="lg-field-k">League name</span>
            <input className="lg-input" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); }} autoComplete="off" enterKeyHint="go" />
          </label>
          <p className="lg-sub">Points from today, Monday to Sunday. Anyone with the link can join.</p>
          {err && <p className="lg-err" role="alert">{err}</p>}
          <button type="button" className="lg-solid" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create league"}</button>
          <button type="button" className="lg-link lg-link-c" onClick={close}>Not now</button>
        </>
      ) : (
        <>
          <h2 className="lg-sheet-title">{made.name} is ready</h2>
          <div className="lg-linkbox">
            <input className="lg-input" value={url} readOnly aria-label="Invite link" onFocus={(e) => e.target.select()} />
            <button type="button" className="lg-copy" onClick={copy} aria-label="Copy invite link">{copied ? <Check size={18} strokeWidth={2.6} /> : <Copy size={18} strokeWidth={2.2} />}</button>
          </div>
          <p className="lg-sub">Points from today, Monday to Sunday. Anyone with the link can join.</p>
          <button type="button" className="lg-solid" onClick={share}><Share size={18} strokeWidth={2.4} aria-hidden="true" /> {copied ? "Link copied" : "Share invite"}</button>
          <div className="lg-links">
            <a className="lg-link" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => track?.("league-invite-share", { via: "wa" })}>Send on WhatsApp</a>
            <button type="button" className="lg-link" onClick={() => { announceLeagueOpen(made.id); onOpenTable?.(made.id); }}>Open the table</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

// ── JOIN ─────────────────────────────────────────────────────────────────────
export function LeagueJoinSheet({ token, displayName = "", isGuest = false, ensureSession, onClose, onJoined, track }) {
  const invite = useMemo(() => parseLeagueInviteToken(token), [token]);
  const ui = useLeagueUi();
  const [name, setName] = useState(() => String((ui?.kind === "join" && ui.name) || displayName || "").slice(0, 22));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(() => !!(ui?.kind === "join" && ui.joining));
  useEffect(() => { if (ui?.kind === "join" && !ui.joining) setBusy(false); }, [ui]);
  useEffect(() => { if (!busy) return undefined; const t = setTimeout(() => setBusy(false), 15000); return () => clearTimeout(t); }, [busy]);
  const seen = useRef(false);
  useEffect(() => { if (!seen.current) { seen.current = true; track?.("league-join-view", { guest: !!isGuest }); } }, [track, isGuest]);

  const join = async () => {
    if (busy || !invite) return;
    const n = nameOk(name, 22);
    if (!n) { setErr(ERROR_COPY.bad_display_name); return; }
    setBusy(true); setErr("");
    saveLeagueUi({ kind: "join", token, name: n, joining: true });
    if (!(await ensureSession?.())) { setBusy(false); saveLeagueUi({ kind: "join", token, name: n }); track?.("league-join-fail", { reason: "session" }); return; }
    const r = await joinLeague({ code: invite.code, displayName: n });
    setBusy(false);
    if (r?.error) { saveLeagueUi({ kind: "join", token, name: n }); setErr(ERROR_COPY[r.error] || ERROR_COPY.offline); track?.("league-join-fail", { reason: r.error }); return; }
    clearLeagueInvite();
    track?.("league-joined", { guest: !!isGuest, seed: r.seed || "manual" });
    // Opens the table now, or on the app's next mount if this one has gone.
    announceLeagueOpen(r.id);
    onJoined?.(r);
  };
  const dismiss = () => { clearLeagueInvite(); saveLeagueUi(null); onClose?.(); };

  if (!invite) {
    return (
      <Sheet label="League invite" onClose={dismiss} full>
        <h2 className="lg-sheet-title">That link doesn&rsquo;t open a league</h2>
        <p className="lg-sub">Ask whoever sent it for a fresh one.</p>
        <button type="button" className="lg-solid" onClick={dismiss}>Back to Ball IQ</button>
      </Sheet>
    );
  }
  return (
    <Sheet label={`Join ${invite.name || "the league"}`} onClose={dismiss} full>
      <span className="lg-well" aria-hidden="true"><Trophy size={24} strokeWidth={2.2} /></span>
      <p className="lg-sub lg-c">{invite.inviter || "A mate"} invited you to</p>
      <h2 className="lg-join-name">{invite.name || "a league"}</h2>
      <ul className="lg-facts">
        <li>The four dailies: Footle, Daily 7, Transfer Trail and Top 10</li>
        <li>Monday to Sunday, final whistle Sunday midnight</li>
        <li>Points start today</li>
      </ul>
      <label className="lg-field">
        <span className="lg-field-k">Your name in the table</span>
        <input className="lg-input" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") join(); }} autoComplete="nickname" enterKeyHint="go" />
      </label>
      {err && <p className="lg-err" role="alert">{err}</p>}
      <button type="button" className="lg-solid" onClick={join} disabled={busy}>{busy ? "Joining…" : "Join league"}</button>
      <button type="button" className="lg-link lg-link-c" onClick={dismiss}>Not now</button>
    </Sheet>
  );
}
