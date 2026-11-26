// Pass and play's small parts (screens/LocalPlay.jsx): the player's disc, the
// picker sheet and the two score tables. The drawings Alex approved on 26 Nov
// 2026 are ball-iq-audit/2026-11-24/finish/pass-play-setup-2.png,
// pass-play-badges-scores-3.png (wins where they differ), the right phone of
// pass-play-handover-table-2.png, pass-play-steal-1.png and pass-play-draw-4.png;
// the measures are lp4.py and lp5.py there. Styles: passPlay.css.
import { useRef } from "react";
import { Crown, Flame, Zap, Star, Shield, Ghost, Heart, Moon, Check } from "lucide-react";
import { useT } from "../i18n/index.js";
import { useModalA11y } from "../useModalA11y.js";
import { COLOURS, BADGES, colourOf, heldByOthers } from "../lib/passPlay.js";

const BADGE_ICONS = { crown: Crown, flame: Flame, bolt: Zap, star: Star, shield: Shield, ghost: Ghost, heart: Heart, moon: Moon };

/** The player's colour as CSS variables: --pc the colour, --pr its r,g,b for tints. */
export const playerVars = (p) => {
  const c = colourOf(p?.colour);
  return { "--pc": c.hex, "--pr": c.rgb };
};

/**
 * THE disc: solid in the player's colour, their badge on it, never a number.
 * Decorative beside a name (the default); pass `label` (the player's name)
 * where it stands alone and must be read.
 */
export function PlayerDisc({ p, size = 36, label, glow = false }) {
  if (!p) return null;
  const Icon = BADGE_ICONS[p.badge] || Crown;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };
  return (
    <span className={`pp-disc${glow ? " is-glow" : ""}`} style={{ ...playerVars(p), width: size, height: size }} {...a11y}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.3} aria-hidden="true" />
    </span>
  );
}

/**
 * The sheet: a name, six colours, eight badges. What another player in the
 * game holds is dimmed and cannot be picked; a taken badge wears its holder's
 * colour dot. One solid Done.
 */
export function PickerSheet({ slots, count, seat, onName, onPick, onClose }) {
  const t = useT();
  const ref = useRef(null);
  useModalA11y({ isOpen: true, onClose, ref });
  const s = slots[seat];
  const me = { colour: s.colour, badge: s.badge };
  const takenC = heldByOthers(slots, count, seat, "colour");
  const takenB = heldByOthers(slots, count, seat, "badge");
  const placeholder = t("lp.player", { n: seat + 1 });
  return (
    <div className="pp-sheet-wrap">
      <div className="pp-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="pp-sheet" role="dialog" aria-modal="true" aria-label={t("lp.sheetLabel")} tabIndex={-1}>
        <i className="pp-grab" aria-hidden="true" />
        <div className="pp-sh-top">
          <PlayerDisc p={me} size={64} />
          <input className="pp-sh-in" value={s.name} placeholder={placeholder} maxLength={16} autoComplete="off" autoCorrect="off" spellCheck={false}
            aria-label={t("lp.nameField")} style={playerVars(me)} onChange={(e) => onName(e.target.value)} />
        </div>
        <h3 className="pp-label" id="pp-c-l">{t("lp.colour")}</h3>
        <div className="pp-sws" role="radiogroup" aria-labelledby="pp-c-l">
          {COLOURS.map((c) => {
            const on = c.id === s.colour;
            const holder = takenC.get(c.id);
            const taken = holder != null;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={on} disabled={taken}
                className={`pp-sw${on ? " on" : ""}${taken ? " tk" : ""}`} style={{ "--pc": c.hex }}
                aria-label={taken ? t("lp.takenBy", { thing: t(`lp.c.${c.id}`), name: slots[holder].name.trim() || t("lp.player", { n: holder + 1 }) }) : t(`lp.c.${c.id}`)}
                onClick={() => onPick("colour", c.id)}>
                {on && <Check size={22} strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <h3 className="pp-label" id="pp-b-l">{t("lp.badge")}</h3>
        <div className="pp-bgs" role="radiogroup" aria-labelledby="pp-b-l" style={playerVars(me)}>
          {BADGES.map((b) => {
            const Icon = BADGE_ICONS[b];
            const on = b === s.badge;
            const holder = takenB.get(b);
            const taken = holder != null;
            return (
              <button key={b} type="button" role="radio" aria-checked={on} disabled={taken}
                className={`pp-bg${on ? " on" : ""}${taken ? " tk" : ""}`}
                aria-label={taken ? t("lp.takenBy", { thing: t(`lp.b.${b}`), name: slots[holder].name.trim() || t("lp.player", { n: holder + 1 }) }) : t(`lp.b.${b}`)}
                onClick={() => onPick("badge", b)}>
                <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
                {taken && <i style={{ background: colourOf(slots[holder].colour).hex }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <p className="pp-sh-n">{t("lp.dimmed")}</p>
        <button type="button" className="pp-go pp-sh-done" onClick={onClose}>{t("lp.done")}</button>
      </div>
    </div>
  );
}

/**
 * A table of players: one row each, a bar in the player's colour as long as
 * their points (against the most anyone has), the points at the right. The
 * hand-over's "Scores so far" (small rows, "Up now" on whoever is up) and the
 * end's "Final table" (a line under each name).
 */
export function PlayerTable({ rows, scores, size = "sm", upId, outIds = [], line, bars = true, winnerId }) {
  const t = useT();
  const max = Math.max(0, ...rows.map((p) => scores[p.id] || 0));
  return (
    <section className={`pp-card pp-tbl is-${size}`}>
      {rows.map((p) => {
        const pts = scores[p.id] || 0;
        const out = outIds.includes(p.id);
        const w = bars && max > 0 ? Math.round((pts / max) * 100) : 0;
        const sub = line ? line(p) : null;
        return (
          <div key={p.id} className={`pp-tr${p.id === upId ? " is-up" : ""}${out ? " is-out" : ""}${!bars ? " no-bar" : ""}${winnerId != null && p.id !== winnerId ? " is-quiet" : ""}`} style={{ ...playerVars(p), "--w": `${w}%` }}>
            <PlayerDisc p={p} size={size === "sm" ? 32 : bars ? 40 : 36} />
            {sub != null ? (
              <span className="pp-tr-t"><b>{p.name}</b><i>{sub}</i></span>
            ) : (
              <b className="pp-tr-n">{p.name}</b>
            )}
            {p.id === upId && <u>{t("lp.upNow")}</u>}
            {out && <u className="is-out">{t("lp.out")}</u>}
            <strong>{pts}</strong>
          </div>
        );
      })}
    </section>
  );
}
