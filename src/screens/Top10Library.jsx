// Top 10 lists: the browser. A fan picks their club once and finds its lists
// first; every other club follows as one tidy row each, opened with a tap, and
// the past dailies sit folded at the end (Alex, 15 Oct 2026: "nice and tidy and
// beautiful and organized", with three to five lists a club coming, a flat
// column of cards would not be). The grouping rules (which lists are open
// here, and why a coming daily is never shown) are in lib/top10Library.js. A
// list opens in the Top 10 screen by name, which saves it under its own key
// and never touches the day.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import GameTitle from "../components/GameTitle.jsx";
import { getTop10Number, TOP10_ANCHOR_DAY } from "../lib/top10.js";
import { groupTop10Lists, listStatus, myTop10Club, setMyTop10Club } from "../lib/top10Library.js";
import { useTop10Data } from "./Top10.jsx";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import "./top10.css";

const SKIN = { "--t10": MODE_ACCENT.top10, "--t10-rgb": MODE_RGB.top10 };
// Which group is open and how far down the page was, kept for this visit, so
// coming back from a list lands where the player left (review, 15 Oct 2026).
const PLACE_KEY = "biq_top10lib_place";
const readPlace = () => { try { return JSON.parse(sessionStorage.getItem(PLACE_KEY)) || {}; } catch { return {}; } };
const writePlace = (p) => { try { sessionStorage.setItem(PLACE_KEY, JSON.stringify(p)); } catch { /* private mode */ } };
const scrollerOf = (el) => { let p = el?.parentElement; while (p && p.scrollHeight <= p.clientHeight + 2) p = p.parentElement; return p || document.scrollingElement; };
const plural = (n) => `${n} ${n === 1 ? "list" : "lists"}`;

// The date a Top 10 number falls on, as "Tue 20 Oct" (the schedule counts UTC days).
const dateOfDay = (day) => new Date((TOP10_ANCHOR_DAY + day - 1) * 86400000)
  .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "");

// A club list that is still to come as the daily: shown, not playable.
function LockedRow({ list }) {
  const when = dateOfDay(list.day);
  return (
    <div className="t10lib-list is-locked" aria-label={`${list.title}: the daily on ${when}`}>
      <span className="t10lib-list-body">
        <span className="t10lib-list-title">{list.title}</span>
        <span className="t10lib-list-sub">The daily on {when}</span>
      </span>
      <span className="t10lib-pill is-locked"><Lock size={12} strokeWidth={2.6} aria-hidden="true" /> {when.split(" ").slice(1).join(" ")}</span>
    </div>
  );
}

// One list: its title, what this phone has done with it, and the way in.
function ListRow({ list, prefix, onPlay }) {
  if (list.locked) return <LockedRow list={list} />;
  const st = listStatus(list.id);
  const sub = st.state === "done" ? "Finished"
    : st.state === "open" ? "In progress"
    : list.note ? list.note : "Name all ten";
  return (
    <button type="button" className="t10lib-list" onClick={() => onPlay(list.id)}
      aria-label={`${list.title}: ${st.state === "done" ? `finished, ${st.score} of 10` : st.state === "open" ? `${st.score} of 10 found, continue` : "play"}`}>
      <span className="t10lib-list-body">
        <span className="t10lib-list-title">{prefix}{list.title}</span>
        <span className="t10lib-list-sub">{sub}</span>
      </span>
      <span className={`t10lib-pill is-${st.state}`}>{st.state === "new" ? "Play" : `${st.score}/10`}</span>
    </button>
  );
}

function ClubMark({ info }) {
  return <span className="t10lib-mark" style={{ background: info.color || "var(--s3)" }} aria-hidden="true">{info.abbr}</span>;
}

// A folded group: one row that opens to its lists.
function Group({ mark, name, lists, open, onToggle, onPlay, prefixOf }) {
  const done = lists.filter((l) => listStatus(l.id).state === "done").length;
  return (
    <div className={`t10lib-group${open ? " is-open" : ""}`}>
      <button type="button" className="t10lib-group-head" onClick={onToggle} aria-expanded={open}>
        {mark}
        <span className="t10lib-group-name">{name}</span>
        <span className="t10lib-group-count">{done ? `${done} of ${lists.length} done` : plural(lists.length)}</span>
        <ChevronDown size={18} strokeWidth={2.4} className="t10lib-chev" aria-hidden="true" />
      </button>
      {open && <div className="t10lib-group-lists">{lists.map((l) => <ListRow key={l.id} list={l} prefix={prefixOf?.(l)} onPlay={onPlay} />)}</div>}
    </div>
  );
}

export default function Top10Library({ onBack, onPlay, clubInfo }) {
  const { data, failed } = useTop10Data(new Date(), null, { library: true });
  const [mine, setMine] = useState(myTop10Club);
  const [openKey, setOpenKey] = useState(() => readPlace().open || null);
  const rootRef = useRef(null);
  const chipsRef = useRef(null);
  const groups = useMemo(() => (data ? groupTop10Lists(data, getTop10Number()) : null), [data]);
  const info = (slug) => clubInfo?.(slug) || { name: slug, abbr: slug.slice(0, 3).toUpperCase() };
  const clubSlugs = groups ? [...groups.clubs.keys()].sort((a, b) => info(a).name.localeCompare(info(b).name)) : [];
  const pick = (slug) => {
    const next = slug === mine ? null : slug;
    setMine(next); setMyTop10Club(next);
    // The chosen chip moves to the front: bring the row back to show it.
    try { chipsRef.current?.scrollTo({ left: 0, behavior: "smooth" }); } catch { /* old WebKit */ }
  };
  const toggle = (key) => setOpenKey((k) => (k === key ? null : key));
  const myLists = mine ? groups?.clubs.get(mine) : null;
  // Keep the place: the open group now, the scroll as the player leaves.
  useEffect(() => { writePlace({ ...readPlace(), open: openKey }); }, [openKey]);
  useLayoutEffect(() => {
    if (!groups) return undefined;
    const sc = scrollerOf(rootRef.current);
    const y = readPlace().y;
    if (y && sc) sc.scrollTop = y;
    return () => { if (sc) writePlace({ ...readPlace(), y: sc.scrollTop }); };
  }, [groups]);

  return (
    <div ref={rootRef} className="t10 t10lib" style={SKIN}>
      <div className="t10-head">
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <GameTitle no={0} className="t10-head-title">Top 10 lists</GameTitle>
          <div className="t10-head-sub">Your club’s lists, and every past daily</div>
        </div>
      </div>

      {failed && <p className="t10lib-empty">The lists did not load. Check your connection and try again.</p>}
      {!data && !failed && <p className="t10lib-empty">Loading the lists…</p>}

      {groups && (
        <>
          <div className="t10lib-h">Your club</div>
          <div ref={chipsRef} className="t10lib-chips" role="group" aria-label="Pick your club">
            {/* The chosen club first, so the chip that says whose lists these are is never off screen. */}
            {[...clubSlugs].sort((a, b) => (b === mine) - (a === mine)).map((slug) => {
              const i = info(slug);
              return (
                <button key={slug} type="button" className={`t10lib-chip${slug === mine ? " is-on" : ""}`}
                  aria-pressed={slug === mine} onClick={() => pick(slug)}>
                  <ClubMark info={i} />{i.name}
                </button>
              );
            })}
          </div>
          {myLists ? (
            <div className="t10lib-card is-mine" style={{ "--club": info(mine).color || "var(--t10)" }}>
              <div className="t10lib-card-head"><ClubMark info={info(mine)} /><span>{info(mine).name}</span><em>{plural(myLists.length)}</em></div>
              {myLists.map((l) => <ListRow key={l.id} list={l} onPlay={onPlay} />)}
            </div>
          ) : (
            <p className="t10lib-empty">Tap your club above and its lists sit here, first, every time.</p>
          )}

          <div className="t10lib-h">Every club</div>
          <div className="t10lib-card">
            {clubSlugs.filter((s) => s !== mine).map((slug) => (
              <Group key={slug} mark={<ClubMark info={info(slug)} />} name={info(slug).name} lists={groups.clubs.get(slug)}
                open={openKey === slug} onToggle={() => toggle(slug)} onPlay={onPlay} />
            ))}
          </div>

          {groups.past.length > 0 && (
            <>
              <div className="t10lib-h">Past dailies</div>
              <div className="t10lib-card">
                <Group mark={<span className="t10lib-mark is-daily" aria-hidden="true">#</span>} name="Every past Top 10" lists={groups.past}
                  open={openKey === "past"} onToggle={() => toggle("past")} onPlay={onPlay} prefixOf={(l) => `No. ${l.day} · `} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
