import React, { useEffect, useRef, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import "../screens/league.css";
import { getMyLeagues, homeCardLine, leagueInviteUrl, inviteShareText, isLeagueMember, cachedLeagues } from "../lib/leagues.js";
import { loopEvent } from "../lib/funnel.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { t, useT } from "../i18n/index.js";
import { LeagueStartRow } from "./LeagueStartRow.jsx";
import { rowLine } from "../lib/rowLine.jsx";

// The league on Home (mates' leagues, phase 1, web only). One hairline card,
// the whole card is the tap; no solid button, Home's stays the daily. Lazy, so
// Home's eager budget carries only the import() that loads it, and only for a
// player who is in a league or signed in. No league (or the migration not
// applied): it draws nothing.
//
// Several leagues: the one with the latest activity, and a quiet "+1 more".
//
// A LEAGUE OF ONE ASKS FOR A MATE (15 Nov 2026). In the first three days of
// leagues in the installed apps, 14 were created and 12 still had one member;
// two invites were sent in all. Mates who did get a link joined (6 of 14 who
// opened one). The card for a league with nobody else in it said "Points from
// today, Monday to Sunday" and gave no hint that anything was missing. It now
// says so and carries the invite itself, one tap from Home: the share sheet
// where there is one, the link on the clipboard where there is not.
async function shareInvite(text) {
  try { if (navigator.share) { await navigator.share({ text }); return "share"; } }
  catch (e) { if (e && (e.name === "AbortError" || /cancel/i.test(e.message || ""))) return null; }
  try { await navigator.clipboard.writeText(text); return "copy"; } catch { return null; }
}

// `from`: where the card stands, for the invite's count ("home"; "multiplayer"
// since that tab carries the same row, 25 Nov 2026).
export default function LeagueHomeCard({ onOpen, onStart, wait = null, from = "home" }) {
  useT();
  // undefined: not answered yet. null: the fetch failed. An array: the answer,
  // or, until it comes, the last answer this phone had (a member's card is
  // then on Home from the first frame, and stays if the fetch fails).
  const [list, setList] = useState(() => cachedLeagues() ?? undefined);
  const [copied, setCopied] = useState(false);
  // One share sheet at a time: a second tap while it is open throws, and the
  // fallback would then claim "Link copied" and count a second invite.
  const sharing = useRef(false);
  useEffect(() => {
    let alive = true;
    // Only the newest fetch may answer: a slow first one must not put an
    // empty list back over the league that was just made.
    let asked = 0;
    const load = () => { const mine = ++asked; return getMyLeagues().then((l) => {
      if (!alive || mine !== asked) return;
      // Checked once a session for a signed-in player who is in none.
      if (Array.isArray(l) && l.length === 0) { try { sessionStorage.setItem("biq_league_checked", "1"); } catch { /* private mode */ } }
      // A refetch that failed keeps what is on screen.
      setList((was) => (l == null && was != null ? was : l));
    }); };
    load();
    // A league made, joined or left while Home is up (lib/leagues.js).
    window.addEventListener("biq:leagues-changed", load);
    return () => { alive = false; window.removeEventListener("biq:leagues-changed", load); };
  }, []);
  // Checked and in none: the way in, where the card would have been.
  if (Array.isArray(list) && list.length === 0 && onStart) return <LeagueStartRow onStart={onStart} />;
  // Not answered yet: whatever Home put in the row's place stays there, so
  // nothing below it moves when the answer lands (HomeScreen, leagueWait).
  if (list === undefined) return wait;
  // The fetch failed with nothing remembered: the way in stays for a phone in
  // no league (it was already on screen); a member gets nothing, as before.
  if (!Array.isArray(list)) return isLeagueMember() ? null : wait;
  if (list.length === 0) return null;
  // A league with mates in it comes first: a just-made league of one sorts to
  // the top by activity and would otherwise hide a real table behind it.
  const solo = (x) => x.members === 1 && !x.is_final;
  const l = list.find((x) => !solo(x)) ?? list[0];
  const todayAt = (l.today ?? 0) - (l.week_start ?? 0);
  const days = Array.from({ length: 7 }, (_, i) => l.my_days?.[i] != null);
  const line = homeCardLine(l);
  if (solo(l)) {
    const invite = async () => {
      const url = leagueInviteUrl(l.code, l.name, "");
      if (!url || sharing.current) return;
      sharing.current = true;
      let via = null;
      try { via = await shareInvite(inviteShareText(l.name, url)); } finally { sharing.current = false; }
      if (!via) return;
      loopEvent("league-invite-share", { via, from });
      if (via === "copy") { setCopied(true); setTimeout(() => setCopied(false), 2200); }
    };
    return (
      <div className="lg-solo" role="group" aria-label={l.name}>
        <button type="button" className="lg-solo-open" onClick={() => onOpen?.(l.id)} aria-label={t("lg.cardAria", { name: l.name, line: t("lg.soloLine") })}>
          <span className="lg-home-ic" aria-hidden="true"><Trophy size={20} strokeWidth={2.2} /></span>
          <span className="lg-home-body">
            <span className="lg-home-name"><span className="t7s-name">{l.name}</span></span>
            <span className="lg-home-line">{rowLine(t("lg.soloLine"))}</span>
          </span>
        </button>
        <button type="button" className="lg-solo-invite" onClick={invite}>{t(copied ? "lg.linkCopied" : "lg.soloInvite")}</button>
      </div>
    );
  }
  return (
    <button type="button" className="lg-home" onClick={() => onOpen?.(l.id)} aria-label={t("lg.cardAria", { name: l.name, line })}>
      <span className="lg-home-ic" aria-hidden="true"><Trophy size={20} strokeWidth={2.2} /></span>
      <span className="lg-home-body">
        {/* One line of name and one grey line, like every row on Home (25 Nov
            2026; lib/rowLine.jsx and app.css say how). "+1 more league" was a
            third line that made this card taller than the row under it: it
            sits beside the name now and gives way to it, as a game's number
            does; "2nd · 13 behind Jo" drops to "2nd" where both do not fit. */}
        <span className="lg-home-name"><span className="t7s-name">{l.name}</span>{list.length > 1 && <span className="lg-home-more">{t("lg.more", { count: list.length - 1, n: list.length - 1 })}</span>}</span>
        <span className="lg-home-line">{rowLine(line)}</span>
      </span>
      <span className="lg-dots" aria-hidden="true">
        {days.map((on, i) => <i key={i} className={`${on ? "is-on" : ""}${i === todayAt && !l.is_final ? " is-today" : ""}`} />)}
      </span>
      <ChevronRight size={18} strokeWidth={2.4} className="lg-home-chev" aria-hidden="true" />
    </button>
  );
}
