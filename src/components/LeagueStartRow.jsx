import React from "react";
import { Trophy } from "lucide-react";
import { useT } from "../i18n/index.js";

// A way INTO leagues from Home, for a player who is in none (11 Nov 2026).
// Until now the only door was a button on a finish panel, so a player who had
// left a league, or never finished a daily, could not start one at all (found
// on the simulator walk; leagues are the app's growth lever). Same row anatomy
// as Multiplayer beside it: an icon well, a name, one line, one quiet pill.
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
          <span className="t7s-title">{t("home.league.title")}</span>
          <span className="t7s-sub">{t("home.league.sub")}</span>
        </span>
      </button>
      <button type="button" className="t7s-cta mp-row-invite" onClick={start} aria-label={t("home.league.startAria")}>{t("home.league.start")}</button>
    </div>
  );
}

export default LeagueStartRow;
