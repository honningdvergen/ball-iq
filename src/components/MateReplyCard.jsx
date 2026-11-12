import React, { useEffect, useState } from "react";
import { Swords, X } from "lucide-react";
import "./mateReply.css";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useT } from "../i18n/index.js";
import { rich } from "../i18n/rich.jsx";
import { compareScores, scoreLabel } from "../lib/gameChallenge.js";
import { fetchNewReplies, markReplySeen, replyKey } from "../lib/challengeReplies.js";
import { loopEvent } from "../lib/funnel.js";

// "Jonas played your Footle" (12 Nov 2026). The sender of a challenge link was
// never told what happened to it: the mate saw the head-to-head, the sender saw
// nothing unless the mate sent one back. This is the news, at the top of Home,
// and only when there is some: no reply, no card, and Home is exactly as it
// was. Lazy, so Home's eager budget carries only the import() and only for a
// device that has sent a challenge in the last three days.
//
// TWO HOMES SHOW IT. A browser never sees the app's Home (main.jsx sends bare
// /play to the front door), so the website mounts this in FrontDoor.jsx and
// the installed apps in HomeScreen.jsx. Same card, same library.
//
// No solid button: Home's stays the next daily's Play, right under this. The
// two things here are quiet, a league pill and a way to put the card away.
const WHAT = { footle: "Footle", trail: "Transfer Trail", top10: "Top 10" };
const counted = new Set();
const inLeague = () => { try { return localStorage.getItem("biq_league_member") === "1"; } catch { return false; } };

export default function MateReplyCard({ onStartLeague }) {
  const t = useT();
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    let alive = true;
    const load = () => fetchNewReplies().then((l) => { if (alive) setQueue(l); }).catch(() => {});
    load();
    // Back from the share sheet or another app: the mate may have played by now.
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVis); };
  }, []);
  // Newest first: the reply that just landed is the news.
  const reply = queue.length ? queue[queue.length - 1] : null;
  const shownKey = reply ? replyKey(reply) : "";
  useEffect(() => {
    if (!reply || counted.has(shownKey)) return;
    // Once per reply per page life: the card stays up until it is put away.
    counted.add(shownKey);
    loopEvent("mate-reply-shown", { game: reply.game, r: compareScores(reply.game, reply.mine, reply.theirs) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);
  if (!reply) return null;

  const name = reply.name || t("gc.aMate");
  const r = compareScores(reply.game, reply.mine, reply.theirs);
  const putAway = () => { markReplySeen(reply); setQueue((q) => q.filter((x) => replyKey(x) !== shownKey)); };
  const league = () => {
    loopEvent("mate-reply-league", { game: reply.game });
    putAway();
    const opts = { h2hGame: reply.game, vs: reply.name || "", from: "reply", h2h: { game: reply.game, edition: reply.edition, mine: reply.mine, theirs: reply.theirs } };
    try {
      if (typeof window.__biqOpenLeague === "function") { window.__biqOpenLeague(opts); return; }
    } catch { /* fall through */ }
    if (onStartLeague) { onStartLeague(); return; }
    // The website's front door has no league sheet: the app's boot opens it
    // from the link, the same hand-off the finish panel uses on the islands.
    try {
      const q = new URLSearchParams({ leaguenew: `h2h_${reply.game}` });
      if (reply.name) q.set("vs", reply.name);
      q.set("h2h", [reply.game, reply.edition, reply.mine, reply.theirs].join("."));
      window.location.assign(`/play?${q.toString()}`);
    } catch { /* nothing to do */ }
  };
  return (
    <section className={`mr-card${r > 0 ? " is-win" : ""}`} aria-label={t("mr.played", { name, what: WHAT[reply.game] })}>
      <div className="mr-top">
        <span className="mr-kicker"><Swords size={14} strokeWidth={2.4} aria-hidden="true" /> {t("mr.played", { name, what: WHAT[reply.game] })}</span>
        <button type="button" className="mr-x" onClick={putAway} aria-label={t("mr.close")}><X size={16} strokeWidth={2.4} aria-hidden="true" /></button>
      </div>
      {/* No name is the common case (an installed app sends none, and most
          web players have never set one): "Level with A mate" read wrong on
          the first live run, so the nameless card has its own words. */}
      <div className="mr-head">{reply.name
        ? t(r > 0 ? "dd.beat" : r < 0 ? "dd.lost" : "dd.level", { name })
        : t(r > 0 ? "mr.beatAnon" : r < 0 ? "mr.lostAnon" : "mr.levelAnon")}</div>
      <div className="mr-vs">{rich(t(reply.name ? "dd.h2h" : "mr.h2hAnon"), { me: <strong>{scoreLabel(reply.game, reply.mine, t)}</strong>, name, them: <strong>{scoreLabel(reply.game, reply.theirs, t)}</strong> })}</div>
      {!inLeague() && (
        <div className="mr-acts">
          <button type="button" className="mr-league" onClick={league}>{t("mr.league")}</button>
        </div>
      )}
    </section>
  );
}
