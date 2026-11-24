import React, { useEffect, useRef, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { useModalA11y } from "../useModalA11y.js";

// THE SHARE SHEET (24 Nov 2026): what the one Share button on a result card
// opens (components/DailyDone.jsx, the "one" layout; Footle first).
//
// Two named choices, each with one grey line saying what it does. Until now
// they were a solid button ("Send it to a mate", crossed swords, which Alex
// read as an X), a note under it and an underlined link ("Just share my
// result"): three things under the card for one decision.
//
// IT BEHAVES LIKE THE APP'S OTHER SHEETS, by the same means as the league
// sheet (screens/LeagueScreen.jsx, Sheet):
//   · useModalA11y: the focus moves in and is held, Escape and the back
//     button close it, and the focus goes back to the Share button after.
//   · a tap on the dimmed page closes it; so does the round close button.
//   · a drag down on the sheet follows the finger and closes past a third of
//     its height. No preventDefault anywhere, so a tap is never swallowed.
//   · neither the scrim nor the sheet pans the page behind (touch-action in
//     dailyDone.css); a sheet taller than its box (.can-scroll) pans itself.
//
// It prints no words of its own: the host passes them, already translated.
// Its own component and its own state on purpose: DailyDone's tests address
// that file's state hooks by their order.
//
// rows: [{ key, Icon, title, note, onClick, disabled? }]
export function ShareSheet({ title, closeLabel, rows = [], onClose }) {
  const ref = useRef(null);
  // The focus goes to the sheet itself, not to the close button: the first
  // thing a screen reader says is the sheet's name.
  useModalA11y({ isOpen: true, onClose, ref, focusContainer: true });
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const measure = () => { const el = ref.current; if (el) setScrolls(el.scrollHeight > el.clientHeight + 1); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [rows.length]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const el = ref.current;
    if (!el || scrolls) return undefined;
    let y0 = null, dy = 0, dragging = false, timer = 0;
    const rest = () => { dragging = false; el.style.transition = "transform .18s ease-out"; el.style.transform = ""; };
    const start = (e) => {
      if (dragging) rest(); // a second finger: the sheet goes back
      y0 = null; dy = 0;
      if (e.touches.length !== 1) return;
      y0 = e.touches[0].clientY;
    };
    const move = (e) => {
      if (y0 == null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (!dragging && dy < 6) return; // a tap that wobbles is still a tap
      dragging = true;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
    };
    const end = () => {
      y0 = null;
      if (!dragging) return;
      if (dy <= Math.min(120, el.offsetHeight / 3)) { rest(); return; }
      dragging = false;
      el.style.transition = "transform .18s ease-out";
      el.style.transform = "translateY(105%)";
      timer = setTimeout(() => onCloseRef.current?.(), 170);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      clearTimeout(timer);
      el.style.transition = ""; el.style.transform = "";
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [scrolls]);
  return (
    <div className="dd-scrim" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`dd-sheet${scrolls ? " can-scroll" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="dd-sheet-grab" aria-hidden="true" />
        <div className="dd-sheet-h">
          <h2 className="dd-sheet-t">{title}</h2>
          <button type="button" className="dd-sheet-x" onClick={onClose} aria-label={closeLabel}><X size={18} strokeWidth={2.4} aria-hidden="true" /></button>
        </div>
        <div className="dd-acts">
          {rows.map((r) => (
            <button key={r.key} type="button" className="dd-act" onClick={r.onClick} disabled={!!r.disabled}>
              <span className="dd-act-ic" aria-hidden="true"><r.Icon size={20} strokeWidth={2.2} /></span>
              <span className="dd-act-t"><span className="dd-act-n">{r.title}</span><span className="dd-act-h">{r.note}</span></span>
              <span className="dd-act-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShareSheet;
