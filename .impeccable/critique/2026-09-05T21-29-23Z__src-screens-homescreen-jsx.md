---
target: iOS app home (src/screens/HomeScreen.jsx)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-05T21-29-23Z
slug: src-screens-homescreen-jsx
---
# App home (iOS, guest state) — 2026-09-05
Method: dual-agent (isolated design review + isolated detector/measurement).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Daily-tab red dot unexplained |
| 2 | Match System / Real World | 3 | "Die on wrong" telegraphic |
| 3 | User Control and Freedom | 2 | "Set your name" leaves Home; Invite opens auth unannounced for guests |
| 4 | Consistency and Standards | 1 | radii 14/18/20, wells 30/34/40/46, four title styles, Play in four colours vs website green |
| 5 | Error Prevention | 3 | |
| 6 | Recognition Rather Than Recall | 3 | two routes to Daily; "No. 34" twice |
| 7 | Flexibility and Efficiency | 2 | fixed row order ignores done state |
| 8 | Aesthetic and Minimalist Design | 1 | 9 hues, 3 section idioms, a banner explaining a row on the same screen |
| 9 | Error Recovery | 3 | search empty state good |
| 10 | Help and Documentation | 2 | banner IS the help and contradicts the two blocks under it |
| **Total** | | **23/40** | |

Specificity: content authored, frame generic. Detector: 3 in-scope findings (1 false positive: <img> in a comment; 1 literal ink hex HomeScreen.jsx:373; 1 side-tab rule on the banner). Measured: PWF CTAs 799–845pt fully behind the bar 792–852pt; .t7s-sub painted --t1 via inherited -webkit-text-fill-color (15.4:1 vs spec 6.4:1); inactive tab labels 2.7:1 after opacity .6; 17 targets above the fold; 9 accent hues.

Priority issues:
- [P0] Top third is not the product (~275pt of banner + greeting + name link + search + chips before the first Play). Fix: delete banner; finder below Today; header = greeting + gear.
- [P1] Play is four colours. Fix: green Play on all rows, Review quiet grey, mode colour on the well only, no wash, subline --t2 (fixes the text-fill inheritance).
- [P1] Three section idioms, two left edges, off-scale radii. Fix: rows on the page edge under a "Today" head styled like "More modes"; cards 14, wells 40; one head style.
- [P2] Play with Friends styled as hero, placed 7th (11 plays/30d). Fix: row anatomy, one quiet Invite pill, stays after Today.
- [P2] Club chips full colour at rest. Fix: grey badge on home.
- [P3] Emoji glyphs beside Lucide; done rows above open; duplicate "No. 34"; five sizes under 12px; inactive tab labels fail AA.

Full verbatim reviews: .audit/critique-2026-09-05-app-home/NOTES.md
