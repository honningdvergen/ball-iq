// THE STREAK, IN THE HEADER OF A FINISHED DAILY (24 Nov 2026, round two of the
// finish: Footle and the Daily 7).
//
// Until now the streak sat in the caption under the result card, beside the XP.
// On the drawing Alex chose it is a small filled chip at the right of the
// screen's header, where Home has its own, and the caption under the card says
// when the next puzzles come instead. Everything the caption's streak carried
// came along:
//   · the chip's first icon is ALWAYS the flame (25 Nov 2026). For a day it
//     turned into a shield on a lost puzzle that kept the streak, so with a
//     shield banked the chip read shield, number, shield. "Streak safe" is
//     said in the caption under the card (DailyDone.jsx), in words;
//   · banked shields ride the chip: one gold shield, with their number beside
//     it from two up. Three drawn side by side pushed the puzzle number out of
//     the header on a 393pt phone, so they are counted, not repeated;
//   · which streak it is ("12-day daily streak", or a game's own) is the
//     chip's title, in the classic panel's words.
// THE CHIP NEVER COSTS THE HEADER ITS PUZZLE NUMBER (review, 24 Nov 2026). The
// card no longer names the game, so the header is the only place that says
// "No. 204" or "23 Nov", and a wide chip ("Day 12 streak" plus shields) pushed
// it out on a 375pt phone. The chip sits in a slot that takes what the title
// leaves, and is the flame and the number by default; the words appear only
// when the slot has room for them (a container query in dailyDone.css, so a
// phone that predates container queries keeps the short chip). The words stay
// for a screen reader either way. With no streak there is no chip.
import { Flame, ShieldCheck } from "lucide-react";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import "./dailyDone.css";

// A host may still say whether the puzzle was won (Footle does): the chip no
// longer reads it.
//
// `floor` (25 Nov 2026, Transfer Trail and Top 10): the slot is a size
// container, so by itself it is as narrow as the title lets it be, and the
// chip, which never shrinks, then stands out of it to the left. Beside a short
// title (Footle No. 204) there is always room. Beside "Transfer Trail No. 113"
// on a 320pt phone there is not, and the chip would lie over the puzzle number.
// With `floor` the slot is never narrower than the short chip (the flame, the
// number, the shield), so the title gives way instead: its number drops to the
// hidden second line, as GameTitle already does when a name needs the room.
export function StreakChip({ streak, isArchive = false, floor = false }) {
  const t = useT();
  const n = streak?.count || 0;
  if (n < 1) return null;
  const label = streak?.label || t("dd.l.none");
  const shields = isArchive ? 0 : Math.max(0, streak?.shields || 0);
  // The short chip: 12 + flame 16 + 7 + the digits (about 8.5 each) + 12, and
  // with shields 7 + 13 more, and 10 for their count from two up.
  const min = floor ? 48 + 9 * String(n).length + (shields > 0 ? 20 + (shields > 1 ? 10 : 0) : 0) : null;
  return (
    <span className="dd-stk-slot" style={min ? { minWidth: min } : undefined}><span className={`dd-stk${shields > 0 ? " has-sh" : ""}`} title={n >= 2 ? t("dd.streakN", { n, label }) : t("dd.streak1", { label })}>
      <Flame size={16} strokeWidth={2.2} aria-hidden="true" />
      <span className="dd-stk-w">{t("dd.capStreak", { n })}</span>
      <span className="dd-stk-n" aria-hidden="true">{n}</span>
      {shields > 0 && (
        <span className="dd-shields" role="img" aria-label={t("dd.shieldsAria", { count: shields })} title={t("dd.shieldTitle")}>
          <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" />{shields > 1 ? shields : null}
        </span>
      )}
    </span></span>
  );
}

export default StreakChip;
