import { useState } from "react";
import { clubInitials, clubReadableText, catLabel } from "../App.jsx";
import { CLUB_PACK_TO_QB, CLUB_PACKS, CLUB_ABBR } from "../data/clubPacks.js";
import { swatchEdge } from "../lib/colourMath.js";
import "../i18n/en.js";
import { t as tNow, useT } from "../i18n/index.js";

// Moved out of App.jsx on 2026-10-16 with the club tables (see
// src/data/clubPacks.js): both readers, the online lobby and local setup,
// are lazy screens, so the picker and its 144 club topics load with them
// instead of with Home.

// Multiplayer/local topics — the "what you play" axis. ids are "mixed" |
// "cat:<QB cat>" | "club:<CLUB_PACK key>"; consumed by TopicPickerSheet (used
// by the online lobby AND local setup) and by pickMultiplayerQuestions.
// Tab split (Leagues · Clubs · Tournaments) per the design handoff; clubs
// carry their real colours (same treatment as the Club Quiz picker).
export const MP_TOPICS = {
  mixed: { id: "mixed", label: "Mixed — all topics", icon: "🎲" },
  leagues: [
    { id: "cat:PL", label: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: "cat:LaLiga", label: "La Liga", icon: "🇪🇸" },
    { id: "cat:SerieA", label: "Serie A", icon: "🇮🇹" },
    { id: "cat:Bundesliga", label: "Bundesliga", icon: "🇩🇪" },
    { id: "cat:Ligue1", label: "Ligue 1", icon: "🇫🇷" },
    { id: "cat:SuperLig", label: "Süper Lig", icon: "🇹🇷" },
    { id: "cat:Primeira", label: "Primeira Liga", icon: "🇵🇹" },
  ],
  tournaments: [
    { id: "cat:UCL", label: "Champions League", icon: "⭐" },
    { id: "cat:WorldCup", label: "International", icon: "🌍" },
    { id: "cat:Euros", label: "Euros", icon: "🏆" },
  ],
  clubs: Object.entries(CLUB_PACK_TO_QB)
    .map(([key, name]) => {
      const color = CLUB_PACKS[key]?.color || null;
      return {
        id: `club:${key}`, label: name,
        abbr: CLUB_ABBR[key] || clubInitials(name),
        color, fg: color ? clubReadableText(color) : null,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label)),
};

// A topic's name in the player's language (i18n step 6): the mixed row and a
// competition through catLabel (International → Selecciones, Euros →
// Eurocopa; the rest read the same), a club as it is.
function topicLabel(it, t = tNow) {
  if (it.id === "mixed") return t("tp.mixed");
  return it.id.startsWith("cat:") ? catLabel(t, it.id.slice(4)) : it.label;
}

// Resolve a pack id to its display treatment (icon or club-coloured monogram
// + copy) for the topic cards (online lobby + local setup) and the picker's
// Done bar. In the player's language: callers render under useT().
export function topicMeta(packId, t = tNow) {
  const mixed = { label: topicLabel(MP_TOPICS.mixed, t), icon: MP_TOPICS.mixed.icon, sub: t("tp.mixedSub") };
  if (!packId || packId === "mixed") return mixed;
  const comp = [...MP_TOPICS.leagues, ...MP_TOPICS.tournaments].find(x => x.id === packId);
  if (comp) return { label: topicLabel(comp, t), icon: comp.icon, sub: t("tp.compSub") };
  const club = MP_TOPICS.clubs.find(x => x.id === packId);
  if (club) return { label: club.label, abbr: club.abbr, color: club.color, fg: club.fg, sub: t("tp.clubSub") };
  return mixed;
}
const SEARCH_KEY = { leagues: "tp.searchLeagues", clubs: "tp.searchClubs", tournaments: "tp.searchTournaments" };
const NONE_KEY = { leagues: "tp.noLeagues", clubs: "tp.noClubs", tournaments: "tp.noTournaments" };

// Full-screen topic picker (design handoff topics-leagues/clubs.dc.html):
// Mixed pinned above Leagues · Clubs · Tournaments tabs, single-select radio
// behaviour, pinned Done bar echoing the current selection. Local draft state
// — nothing commits until Done. Shared by the online lobby and local setup.
export function TopicPickerSheet({ value, onDone, onClose }) {
  const t = useT();
  const [draft, setDraft] = useState(value || "mixed");
  const [tab, setTab] = useState(() =>
    String(value || "").startsWith("club:") ? "clubs"
    : MP_TOPICS.tournaments.some(t => t.id === value) ? "tournaments"
    : "leagues");
  const meta = topicMeta(draft, t);
  const doneLabel = draft === "mixed" ? t("tp.doneMixed") : t("tp.done", { label: meta.label });
  // Clubs is 61 entries in a 2-column grid. The array IS alphabetical, but a
  // row-major grid means scanning DOWN a column skips every second club
  // (AC Milan, Anderlecht, Aston Villa, Atletico...), so it reads as random —
  // exactly the "chaotic and shuffled" report. Sorting differently can't fix a
  // scan-direction illusion; being able to type "man" can. Matches abbr too,
  // so MUN/PSG/BVB work.
  const [q, setQ] = useState("");
  const allItems = MP_TOPICS[tab] || [];
  const needle = q.trim().toLowerCase();
  const items = needle
    ? allItems.filter(it =>
        topicLabel(it, t).toLowerCase().includes(needle) ||
        (it.abbr || "").toLowerCase().includes(needle))
    : allItems;
  return (
    <div style={{position:"fixed",inset:0,zIndex:999,background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"calc(14px + env(safe-area-inset-top, 0px)) 20px 0",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} aria-label={t("game.back")} style={{width:38,height:38,borderRadius:12,background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t1)",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>←</button>
        <span style={{fontSize:24,fontWeight:800,letterSpacing:"-0.02em",color:"var(--t1)"}}>{t("tp.title")}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 20px"}}>
        <button onClick={() => setDraft("mixed")} style={{width:"100%",marginTop:14,borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:11,padding:"13px 15px",
          ...(draft === "mixed" ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
          <span style={{fontSize:19}}>🎲</span>
          <span style={{fontSize:14.5,fontWeight:draft === "mixed" ? 800 : 700,color:draft === "mixed" ? "var(--grn-soft)" : "var(--t1)"}}>{t("tp.mixed")}</span>
          <span style={{marginLeft:"auto",width:19,height:19,borderRadius:"50%",...(draft === "mixed"
            ? {background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--grn-ink)",fontWeight:900}
            : {border:"1.5px solid #3E4150"})}}>{draft === "mixed" ? "✓" : ""}</span>
        </button>
        <div style={{display:"flex",gap:6,marginTop:16,padding:4,borderRadius:14,background:"var(--s1)",border:"1px solid var(--border)"}}>
          {[{ id: "leagues", label: t("tp.leagues") }, { id: "clubs", label: t("tp.clubs") }, { id: "tournaments", label: t("tp.tournaments") }].map(tb => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setQ(""); }} style={{flex:1,borderRadius:10,padding:9,textAlign:"center",fontSize:13,cursor:"pointer",fontFamily:"inherit",
              ...(tab === tb.id ? {background:"var(--s2)",border:"1px solid #3E4150",fontWeight:800,color:"var(--t1)"} : {background:"transparent",border:"1px solid transparent",fontWeight:700,color:"var(--t2)"})}}>{tb.label}</button>
          ))}
        </div>
        {allItems.length > 12 && (
          <div style={{position:"relative",marginTop:12}}>
            <span aria-hidden="true" style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.65,pointerEvents:"none"}}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${t(SEARCH_KEY[tab])}…`}
              aria-label={t(SEARCH_KEY[tab])}
              autoComplete="off"
              spellCheck={false}
              style={{width:"100%",boxSizing:"border-box",padding:"12px 38px",borderRadius:13,background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t1)",fontSize:16,fontFamily:"inherit",outline:"none"}}
            />
            {q && (
              <button onClick={() => setQ("")} aria-label={t("tp.clear")}
                style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:30,height:30,borderRadius:9,background:"transparent",border:"none",color:"var(--t2)",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
            )}
          </div>
        )}
        {needle && items.length === 0 && (
          <div style={{marginTop:18,textAlign:"center",color:"var(--t2)",fontSize:13.5}}>
            {t(NONE_KEY[tab], { q: q.trim() })}
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}>
          {items.map(it => {
            const sel = draft === it.id;
            return (
              <button key={it.id} onClick={() => setDraft(it.id)} style={{borderRadius:16,padding:14,display:"flex",flexDirection:"column",gap:6,textAlign:"left",cursor:"pointer",fontFamily:"inherit",
                ...(sel ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                  {it.abbr
                    ? <span style={{width:34,height:34,borderRadius:10,background:it.color || (sel ? "rgba(88,204,2,0.14)" : "var(--s2)"),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,letterSpacing:"0.04em",color:it.fg || (sel ? "var(--grn-soft)" : "var(--t1)"),boxShadow:[swatchEdge(it.color), it.color ? `0 2px 8px ${it.color}55` : ""].filter(Boolean).join(", ") || undefined}}>{it.abbr}</span>
                    : <span style={{fontSize:24}}>{it.icon}</span>}
                  {sel && <span style={{width:19,height:19,borderRadius:"50%",background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--grn-ink)",fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:14.5,fontWeight:sel ? 800 : 700,color:sel ? "var(--grn-soft)" : "var(--t1)",marginTop:2}}>{topicLabel(it, t)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{borderTop:"1px solid var(--s1)",background:"#0C0E14",padding:"12px 20px calc(12px + env(safe-area-inset-bottom, 0px))"}}>
        <button onClick={() => onDone(draft)} style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:15,fontSize:15.5,fontWeight:800,color:"var(--grn-ink)",cursor:"pointer",fontFamily:"inherit"}}>{doneLabel}</button>
      </div>
    </div>
  );
}
