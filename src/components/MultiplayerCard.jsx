import React, { useCallback } from "react";
import { Globe, ArrowLeftRight, ChevronRight } from "lucide-react";
import { useT } from "../i18n/index.js";
import { rowLine } from "../lib/rowLine.jsx";

// MultiplayerCard — Home tab. One row in the Today-row anatomy (2026-09-06).
//
// It was a standalone hero card: dark-green gradient, a glow, a full-saturation
// "Invite friends" button and a ghost "Same phone" — the loudest control on
// the screen in the seventh position, for a mode with 11 plays in 30 days. The
// critique's rule: loudness and position must agree. So it wears the same row
// shape as Footle / Daily 7 / Trail / Mystery, with green in the icon well and
// ONE quiet pill.
//
// It had two targets: the body opened the Online tab and a quiet "Invite" pill
// created a room at once. "Same phone" left this card; the Online tab carries it.
//
// ONE TARGET, AND AN ARROW (24 Nov 2026, Alex on home-tidy.png: "Mates and
// headings tidied probably"). He counted "6 play buttons under each other" on
// Home. A pill now means "play this now" and belongs to the four dailies; a row
// that takes you somewhere ends in an arrow. So the Invite pill is gone from
// this row and the whole row opens the Multiplayer tab, where creating a room
// is the first button. The cost, known when it was drawn: inviting from Home is
// one tap deeper.
export const MultiplayerCard = React.memo(function MultiplayerCardImpl({ onOpen }) {
  const t = useT();
  const handleOpen = useCallback((e) => {
    e?.stopPropagation();
    onOpen?.();
  }, [onOpen]);

  return (
    <div className="todays-seven-secondary mp-row" role="group" aria-label={t("home.mp.title")}>
      <button type="button" className="mp-row-open" onClick={handleOpen} aria-label={t("home.mp.openAria")}>
        <span className="t7s-icon" aria-hidden="true"><Globe size={22} strokeWidth={2} /></span>
        <span className="t7s-body">
          {/* ONE NAME (Alex, 2026-09-09: "should we call it online or
              multiplayer?"). It was three: "Online" on the tab, "Play with
              Friends" here, "Online Multiplayer" in the FAQ. "Multiplayer" is
              the word people search for and it names the thing, not the
              transport; the tab, this row, the hub heading and the FAQ now
              agree. The tab's id stays `online` — it is in every door URL. */}
          {/* "PLAY ONLINE" ON HOME (27 Nov 2026). With pass and play on the row
              under it, Alex: "maybe we have to call online multiplayer something
              with online so people see we have both?", then "Yes, Play online"
              to the drawing. Only this Home row changes: the tab, the hub's
              heading and the FAQ keep "Multiplayer", since the tab holds both. */}
          <span className="t7s-title"><span className="t7s-name">{t("home.mp.title")}</span></span>
          {/* Capacity, not a question count: Hot Streak and Survival Duel are
              not 10 questions, and "up to 8" is already our claim on the site
              and the store listing. NOT a live count: 4 rooms in the last
              7 days and 0 open at the time of writing — "0 rooms open now"
              reads dead, which is worse than quiet. */}
          <span className="t7s-sub">{rowLine(t("home.mp.sub"))}</span>
        </span>
        <span className="mp-row-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
      </button>
    </div>
  );
});

// PASS AND PLAY ON HOME (27 Nov 2026). Alex: "and we should probably make people
// more aware that we have that pass and play local mode too, it is fun", then
// to the drawing of this row "yeah build it but another icon on home" and, for
// the icon, "The arrows". The third row of the "With your mates" card, under
// Play online: the same row anatomy, the arrows in a purple tile, and an arrow
// at the end because it takes you somewhere (the pass and play setup).
export const PassPlayRow = React.memo(function PassPlayRowImpl({ onOpen }) {
  const t = useT();
  return (
    <div className="todays-seven-secondary mp-row is-pass" role="group" aria-label={t("home.pass.title")}
      style={{ "--mode-rgb": "168,120,240", "--mode": "#B994F5" }}>
      <button type="button" className="mp-row-open" onClick={(e) => { e?.stopPropagation(); onOpen?.(); }} aria-label={t("home.pass.openAria")}>
        <span className="t7s-icon" aria-hidden="true"><ArrowLeftRight size={22} strokeWidth={2} /></span>
        <span className="t7s-body">
          <span className="t7s-title"><span className="t7s-name">{t("home.pass.title")}</span></span>
          <span className="t7s-sub">{rowLine(t("home.pass.sub"))}</span>
        </span>
        <span className="mp-row-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
      </button>
    </div>
  );
});
