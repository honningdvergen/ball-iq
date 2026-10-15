import { Flag } from "lucide-react";
import ReportButton from "./ReportButton.jsx";

/**
 * The foot of a finished daily: the way to tell us it is wrong, then the way out.
 *
 * ⚠️ ONE OF THESE, BECAUSE THERE WERE THREE. Footle had a quiet underlined
 * "⚑ Bad answer? Tell us" inside its result card and no way out but the arrow
 * at the top. Transfer Trail and Top 10 each had two full-width outlined pills,
 * "⚑ Career looks wrong? Tell us" and "⚑ List looks wrong? Tell us", over
 * "Back to Home": the rarest action on the screen drawn as large as the exit.
 * Three wordings, two sizes, one glyph that is not an icon (13 Oct 2026).
 *
 * Now: one sentence shape ("<Thing> looks wrong? Tell us"), set as the quiet
 * underlined link Alex chose for Footle on 9 Sept, with the app's own flag
 * icon; and one "Back to Home" button under it. Styles are inline on purpose:
 * Transfer Trail also mounts on a static page that does not load app.css.
 */
export const reportLabel = (thing) => `${thing} looks wrong? Tell us`;

const LINK = {
  margin: "0 auto", padding: "10px 12px", minHeight: 44, display: "flex", alignItems: "center", gap: 6,
  background: "none", border: 0, color: "var(--t3)", WebkitTextFillColor: "var(--t3)",
  textDecoration: "underline", textUnderlineOffset: 3, fontSize: 12.5, fontWeight: 700,
};
const HOME = {
  width: "100%", minHeight: 46, padding: "12px", borderRadius: 999, border: "1px solid var(--border)",
  background: "transparent", color: "var(--t2)", fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer",
};

export function ReportLink({ thing, info, onReport, style }) {
  if (!onReport || !info) return null;
  return (
    <ReportButton
      onReport={onReport}
      info={info}
      idle={<><Flag size={13} strokeWidth={2.4} aria-hidden="true" /> {reportLabel(thing)}</>}
      idleColor="var(--t3)"
      style={{ ...LINK, ...style }}
    />
  );
}

// `more` ({ label, onClick, accent }): one optional next step drawn above the
// exit, in the mode's colour (Top 10's "More Top 10 lists", 15 Oct 2026).
export default function ResultFoot({ thing, info, onReport, onHome, more }) {
  const link = <ReportLink thing={thing} info={info} onReport={onReport} />;
  if (!onHome && !more && (!onReport || !info)) return null;
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2 }}>
      {link}
      {more && <button type="button" onClick={more.onClick} style={{ ...HOME, marginBottom: 8, color: more.accent || "var(--t1)", WebkitTextFillColor: more.accent || "var(--t1)", borderColor: more.accent || "var(--border)" }}>{more.label}</button>}
      {onHome && <button type="button" onClick={onHome} style={HOME}>Back to Home</button>}
    </div>
  );
}
