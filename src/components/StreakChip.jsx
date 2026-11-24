// THE STREAK, IN THE HEADER OF A FINISHED DAILY (24 Nov 2026, round two of the
// finish: Footle and the Daily 7).
//
// Until now the streak sat in the caption under the result card, beside the XP.
// On the drawing Alex chose it is a small filled chip at the right of the
// screen's header, where Home has its own, and the caption under the card says
// when the next puzzles come instead. Everything the caption's streak carried
// came along:
//   · the flame is a shield on a lost puzzle that kept the streak (a host whose
//     streak counts any finish, `keepsOnLoss`, from day 2);
//   · banked shields ride the chip: one gold shield, with their number beside
//     it from two up. Three drawn side by side pushed the puzzle number out of
//     the header on a 393pt phone, so they are counted, not repeated;
//   · which streak it is ("12-day daily streak", or a game's own) is the
//     chip's title, in the classic panel's words.
// Under 360pt the chip is the flame and the number; the words stay for a
// screen reader. With no streak there is no chip.
import { Flame, ShieldCheck } from "lucide-react";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import "./dailyDone.css";

export function StreakChip({ streak, won = true, isArchive = false }) {
  const t = useT();
  const n = streak?.count || 0;
  if (n < 1) return null;
  const label = streak?.label || t("dd.l.none");
  const safe = !isArchive && won === false && !!streak?.keepsOnLoss && n >= 2;
  const shields = isArchive ? 0 : Math.max(0, streak?.shields || 0);
  const Icon = safe ? ShieldCheck : Flame;
  return (
    <span className="dd-stk" title={n >= 2 ? t("dd.streakN", { n, label }) : t("dd.streak1", { label })}>
      <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
      <span className="dd-stk-w">{t("dd.capStreak", { n })}</span>
      <span className="dd-stk-n" aria-hidden="true">{n}</span>
      {shields > 0 && (
        <span className="dd-shields" role="img" aria-label={t("dd.shieldsAria", { count: shields })} title={t("dd.shieldTitle")}>
          <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" />{shields > 1 ? shields : null}
        </span>
      )}
    </span>
  );
}

export default StreakChip;
