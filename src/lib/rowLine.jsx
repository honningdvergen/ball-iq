import React from "react";

// A t() template with its {placeholders} in <strong>: "Solved in {n}" →
// Solved in <strong>4</strong>. Takes the raw template (t(key) with no vars),
// so the bold lands on the value wherever the language puts it.
export function withStrong(template, vars) {
  return template.split(/\{(\w+)\}/).map((part, i) => (i % 2 ? <strong key={i}>{vars[part]}</strong> : part)).filter((p) => p !== "");
}

/**
 * The grey line under a Home row's title, as PIECES (25 Nov 2026).
 *
 * Alex, on the Spanish and small-phone pictures of Home: "let us try to keep
 * the lines under the game titles just one line too ... looks bad when some
 * pills are longer vertically than others". A line that wrapped made its row
 * 86 or 94 high beside neighbours of 68.
 *
 * The line is cut at " · " and each piece is its own box in a row that is one
 * line high and wraps (app.css, .t7s-sub and .t7s-p): where both pieces fit
 * they read exactly as before; where they do not, the SECOND falls to a line
 * that is not shown and the first stands alone ("Start here"), the way a
 * title's number gives way in components/GameTitle.jsx. A piece too long even
 * alone ends in an ellipsis, the last resort. No script measures anything.
 *
 * So a line that must survive a narrow phone is written as two pieces, the
 * one that matters first. The separator rides with the piece after it, so the
 * text content of the line is the string as it is in the table.
 *
 * `vars`: the values to set in <strong> (withStrong above); the template is
 * cut first, so a value that holds " · " is never split.
 */
export function rowLine(text, vars) {
  return String(text ?? "").split(" · ").map((part, i) => {
    const piece = (i ? " · " : "") + part;
    return <span key={i} className="t7s-p">{vars ? withStrong(piece, vars) : piece}</span>;
  });
}
