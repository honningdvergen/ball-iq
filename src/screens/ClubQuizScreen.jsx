// Club quiz picker — extracted from App.jsx on 2026-09-06 (review E16, brick 10).
// The club maps stay in App (they are the bank wiring) and come along the seam.
import { CLUB_COLOUR_ALIASES } from "../lib/clubColour.js";
import { prefetchQuestions } from "../questions-loader.js";
import { useModalA11y } from "../useModalA11y.js";
import React, { useRef } from "react";
import { CLUB_ABBR, CLUB_LEAGUES, CLUB_LEAGUE_SECTIONS, CLUB_ORDER, CLUB_PACKS, CLUB_SEARCH_NICKNAMES, clubHexToRgba, clubInitials, clubReadableText, haptic, norm } from "../App.jsx";

export function ClubQuizScreen({ onStart, onBack }) {
  const [showProModal, setShowProModal] = React.useState(false);
  // Each league collapses to a short preview. The Premier League alone filled
  // more than a screen, so La Liga sat below the fold with nothing to suggest it
  // existed — someone looking for Barcelona had no reason to believe scrolling
  // would help (Alex, 2026-07-29). Previewing two per league puts EVERY league
  // in view at once, and it gets better rather than worse as club waves land.
  const CLUB_PREVIEW = 2;
  const [openLeagues, setOpenLeagues] = React.useState(() => new Set());
  // Playtester, via Alex: "this NEEDS to have drop down menus, or boxes to search
  // for a club so you don't have to scroll". 71 packs across 12 league sections,
  // each collapsed to 2 — finding one club meant scrolling AND expanding. A query
  // bypasses the grouping entirely and shows a flat ranked list.
  const [clubQuery, setClubQuery] = React.useState("");
  const toggleLeague = React.useCallback((key) => {
    setOpenLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);
  // ⚠️ THE PER-CLUB COUNT IS GONE — do not put it back (Alex, 2026-08-06).
  // Each row read "Liverpool · 42 questions": the "N questions in this pack"
  // badge the no-counts rule names as the disguise it keeps returning in. It
  // also made the thinnest packs advertise their thinness — Hajduk Split's row
  // said 15. Same call as the web length picker's "42 Full set" the same day.
  // The crest, the name and the league grouping carry the row without it.
  //
  // Removing it also deleted the only reason this screen read the question
  // index, so it now does strictly less work on open. The prefetch stays and is
  // unrelated: landing here IS play intent, so warming the bank lets the parse
  // overlap navigation instead of colliding with the next tap.
  React.useEffect(() => {
    prefetchQuestions();
  }, []);
  // Sprint #68 JJ4: ESC + focus-trap on the upsell modal.
  const proModalRef = useRef(null);
  useModalA11y({ isOpen: showProModal, onClose: () => setShowProModal(false), ref: proModalRef });
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Club Quizzes</div>
      </div>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:20}}>
        Test your deep knowledge of a specific club — history, players, trophies and iconic moments.
      </p>
      {(() => {
        const q = clubQuery.trim().toLowerCase();
        const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Match on the display name AND the 3-letter code, so "BVB", "psg" and
        // "dortmund" all land. Prefix matches rank above substring ones, which is
        // what makes a 2-3 character query feel immediate.
        const matches = !q ? [] : Object.entries(CLUB_PACKS)
          .map(([key, pack]) => {
            const name = norm(pack.name), abbr = norm(CLUB_ABBR[key]);
            const nq = norm(q);
            // "spurs" found nothing before this: the pack is named "Tottenham"
            // with abbr TOT, so the nickname a fan would type matched neither.
            const aliasTarget = norm(CLUB_COLOUR_ALIASES[nq] || CLUB_SEARCH_NICKNAMES[nq] || "");
            if (aliasTarget && aliasTarget === name) return { key, pack, rank: 0 };
            if (name.startsWith(nq) || abbr === nq) return { key, pack, rank: 0 };
            if (name.includes(nq) || abbr.startsWith(nq)) return { key, pack, rank: 1 };
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.rank - b.rank || a.pack.name.localeCompare(b.pack.name));
        return (
          <>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type="text"
                value={clubQuery}
                onChange={(e) => setClubQuery(e.target.value)}
                placeholder={`Search ${Object.keys(CLUB_PACKS).length} clubs…`}
                aria-label="Search clubs"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "13px 38px 13px 14px",
                  borderRadius: 12, background: "var(--s1)", border: "1px solid var(--border)",
                  color: "var(--t1)",
                  // ⚠️ 16px is a HARD FLOOR — below it iOS auto-zooms on focus and
                  // WKWebView never restores the scale, leaving the whole app zoomed.
                  // Three inputs had to be fixed for exactly this on 2026-07-30.
                  fontSize: 16, fontFamily: "inherit", outline: "none",
                }}
              />
              {clubQuery && (
                <button type="button" onClick={() => setClubQuery("")} aria-label="Clear search"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                           width: 30, height: 30, borderRadius: 9, background: "transparent",
                           border: "none", color: "var(--t2)", fontSize: 15, cursor: "pointer",
                           fontFamily: "inherit" }}>✕</button>
              )}
            </div>
            {q && (
              <div style={{ marginBottom: 18 }}>
                {matches.length === 0 ? (
                  <div style={{ fontSize: 13.5, color: "var(--t2)", padding: "6px 2px" }}>
                    No club matches “{clubQuery}”. Try a shorter search.
                  </div>
                ) : (
                  <div className="mode-list">
                    {matches.map(({ key, pack }) => {
                      const lightClub = clubReadableText(pack.color) === "#0B0C10";
                      const a1 = lightClub ? 0.20 : 0.32, a2 = lightClub ? 0.05 : 0.06;
                      return (
                        <button key={key} type="button" className="mode-item" onClick={() => { haptic("select"); onStart(key); }}
                          style={{ background: `linear-gradient(90deg, ${clubHexToRgba(pack.color, a1)} 0%, ${clubHexToRgba(pack.color, a2)} 100%)`, borderColor: clubHexToRgba(pack.color, lightClub ? 0.5 : 0.4) }}>
                          <div className="mi-icon" style={{ background: pack.color, borderRadius: 11, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, boxShadow: `0 2px 8px ${clubHexToRgba(pack.color, 0.45)}` }}>
                            <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.3, color: clubReadableText(pack.color) }}>{CLUB_ABBR[key] || clubInitials(pack.name)}</span>
                          </div>
                          <div className="mi-body">
                            <div className="mi-name">{pack.name}</div>
                          </div>
                          <div className="mi-arrow">→</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}
      {/* League sections hide entirely while searching — two competing lists on
          one screen is worse than either alone. */}
      {!clubQuery.trim() && CLUB_LEAGUE_SECTIONS.map((section) => {
        // ⚠️ Sorted by CLUB_ORDER, not by CLUB_PACKS insertion order. Only the
        // first two show before "Show all", so insertion order meant the most
        // RECENTLY ADDED clubs fronted every section — which is how ten new
        // English clubs ended up above Arsenal and Liverpool.
        const clubs = Object.entries(CLUB_PACKS)
          .filter(([key]) => (CLUB_LEAGUES[key] || "other") === section.key)
          .sort(([a], [b]) => (CLUB_ORDER[a] ?? 1e6) - (CLUB_ORDER[b] ?? 1e6));
        if (!clubs.length) return null;
        const isOpen = openLeagues.has(section.key);
        const shown = isOpen ? clubs : clubs.slice(0, CLUB_PREVIEW);
        const hidden = clubs.length - shown.length;
        return (
          <div key={section.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t2)", margin: "0 0 8px 2px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <span>{section.label}</span>
              <span style={{ letterSpacing: 0, textTransform: "none", fontWeight: 600, color: "var(--t3)" }}>{clubs.length}</span>
            </div>
            <div className="mode-list">
              {shown.map(([key, pack]) => {
                const lightClub = clubReadableText(pack.color) === "#0B0C10";
                const a1 = lightClub ? 0.20 : 0.32, a2 = lightClub ? 0.05 : 0.06;
                return (
                  <button key={key} type="button" className="mode-item" onClick={() => { haptic("select"); onStart(key); }}
                    style={{ background: `linear-gradient(90deg, ${clubHexToRgba(pack.color, a1)} 0%, ${clubHexToRgba(pack.color, a2)} 100%)`, borderColor: clubHexToRgba(pack.color, lightClub ? 0.5 : 0.4) }}>
                    <div className="mi-icon" style={{ background: pack.color, borderRadius: 11, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, boxShadow: `0 2px 8px ${clubHexToRgba(pack.color, 0.45)}` }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.3, color: clubReadableText(pack.color) }}>{CLUB_ABBR[key] || clubInitials(pack.name)}</span>
                    </div>
                    <div className="mi-body">
                      <div className="mi-name">{pack.name}</div>
                    </div>
                    <div className="mi-arrow">→</div>
                  </button>
                );
              })}
            </div>
            {(hidden > 0 || isOpen) && (
              <button
                type="button"
                onClick={() => { haptic("select"); toggleLeague(section.key); }}
                style={{ marginTop: 7, width: "100%", background: "transparent", border: "1px solid var(--border)", borderRadius: 11, padding: "9px 12px", color: "var(--t2)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                aria-expanded={isOpen}
              >
                {isOpen ? "Show fewer" : `Show all ${clubs.length}`}
              </button>
            )}
          </div>
        );
      })}
      {/* The card that used to sit here promised "Galatasaray, Benfica, Napoli,
          Fenerbahçe and more are on the way" — all four have been in the list
          directly above it since Wave A. It was telling users that clubs they
          could already play were missing. Replaced with something true. */}
      <div style={{marginTop:16,background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03))",border:"1px solid rgba(251,191,36,0.2)",borderRadius:16,padding:"18px 20px",textAlign:"center"}}>
        <div style={{fontSize:15,fontWeight:800,color:"var(--t1)",marginBottom:4}}>Missing your club?</div>
        <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>New clubs are added regularly — more leagues are on the way.</div>
      </div>
      {showProModal && (
        <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"flex-end"}} onClick={() => setShowProModal(false)}>
          <div ref={proModalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="More club quizzes coming soon" style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🏟️</div>
            <div style={{fontSize:22,fontWeight:900,textAlign:"center",marginBottom:8}}>More Coming Soon</div>
            <div style={{fontSize:14,color:"var(--t2)",textAlign:"center",lineHeight:1.7,marginBottom:24}}>Additional club packs are on the way. Keep playing to stay ready!</div>
            <button className="btn btn-p" onClick={() => setShowProModal(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}


// League-quiz picker — mirrors ClubQuizScreen's colour-coded rows, grouped
// Leagues / Tournaments. Each row carries the rating hook, never a pool count.
