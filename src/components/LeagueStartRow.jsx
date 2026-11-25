import React from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { useT } from "../i18n/index.js";
import { rowLine } from "../lib/rowLine.jsx";

// A way INTO leagues from Home, for a player who is in none (11 Nov 2026).
// Until now the only door was a button on a finish panel, so a player who had
// left a league, or never finished a daily, could not start one at all (found
// on the simulator walk; leagues are the app's growth lever). Same row anatomy
// as Multiplayer beside it: an icon well, a name, one line, and since 24 Nov
// 2026 an arrow where the quiet "Start" pill was (the pill did what a tap on
// the row did; MultiplayerCard.jsx says why the pills left these two rows).
// Eager and tiny, so Home does not jump when it appears; a member sees the
// league card here instead (LeagueHomeCard).
export function LeagueStartRow({ onStart }) {
  const t = useT();
  const start = (e) => { e?.stopPropagation(); onStart?.(); };
  return (
    <div className="todays-seven-secondary mp-row" role="group" aria-label={t("home.league.title")}>
      <button type="button" className="mp-row-open" onClick={start} aria-label={t("home.league.startAria")}>
        <span className="t7s-icon" aria-hidden="true" style={{ background: "rgba(255,170,0,0.10)", borderColor: "rgba(255,170,0,0.32)", color: "var(--gold)" }}><Trophy size={21} strokeWidth={2} /></span>
        <span className="t7s-body">
          <span className="t7s-title"><span className="t7s-name">{t("home.league.title")}</span></span>
          <span className="t7s-sub">{rowLine(t("home.league.sub"))}</span>
        </span>
        <span className="mp-row-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
      </button>
    </div>
  );
}

export default LeagueStartRow;
