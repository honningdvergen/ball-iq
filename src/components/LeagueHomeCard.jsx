import React, { useEffect, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import "../screens/league.css";
import { getMyLeagues, homeCardLine } from "../lib/leagues.js";

// The league on Home (mates' leagues, phase 1, web only). One hairline card,
// the whole card is the tap; no solid button, Home's stays the daily. Lazy, so
// Home's eager budget carries only the import() that loads it, and only for a
// player who is in a league or signed in. No league (or the migration not
// applied): it draws nothing.
//
// Several leagues: the one with the latest activity, and a quiet "+1 more".
export default function LeagueHomeCard({ onOpen }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    let alive = true;
    getMyLeagues().then((l) => {
      if (!alive) return;
      // Checked once a session for a signed-in player who is in none.
      if (Array.isArray(l) && l.length === 0) { try { sessionStorage.setItem("biq_league_checked", "1"); } catch { /* private mode */ } }
      setList(l);
    });
    return () => { alive = false; };
  }, []);
  if (!Array.isArray(list) || list.length === 0) return null;
  const l = list[0];
  const todayAt = (l.today ?? 0) - (l.week_start ?? 0);
  const days = Array.from({ length: 7 }, (_, i) => l.my_days?.[i] != null);
  const line = homeCardLine(l);
  return (
    <button type="button" className="lg-home" onClick={() => onOpen?.(l.id)} aria-label={`${l.name}: ${line}. Open the table`}>
      <span className="lg-home-ic" aria-hidden="true"><Trophy size={20} strokeWidth={2.2} /></span>
      <span className="lg-home-body">
        <span className="lg-home-name">{l.name}</span>
        <span className="lg-home-line">{line}</span>
        {list.length > 1 && <span className="lg-home-more">+{list.length - 1} more {list.length === 2 ? "league" : "leagues"}</span>}
      </span>
      <span className="lg-dots" aria-hidden="true">
        {days.map((on, i) => <i key={i} className={`${on ? "is-on" : ""}${i === todayAt && !l.is_final ? " is-today" : ""}`} />)}
      </span>
      <ChevronRight size={18} strokeWidth={2.4} className="lg-home-chev" aria-hidden="true" />
    </button>
  );
}
