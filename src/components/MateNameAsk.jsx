import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import "../i18n/en.js"; // the full English table: this panel is not on Home's eager path
import { useT } from "../i18n/index.js";
import { replyName, saveReplyName, cleanMateName } from "../lib/gameChallenge.js";

// "Say it was you" (12 Nov 2026). A mate who finishes a puzzle they were sent
// reports the result at once, usually with no name: most web players have never
// set one, so the sender's card read "A mate played your Footle" and a sender
// who had sent it to three people could not tell which one played.
//
// ONE LINE, INSIDE THE HEAD-TO-HEAD (Alex: "clear and tidy … one line"). A
// first-name field and one quiet button, joined to the box that says who won;
// no sheet, no question above it, nothing to dismiss. Skipping it costs
// nothing, because the result has already gone.
//
// IT ONLY SAYS WHAT IS TRUE. "Alex will see it was Jonas" is shown when the
// server has that name for this device's reply to this link (the library's
// replyNamed), never because a name is merely stored here: a send that failed
// keeps the ask, with the name still in the field.
//
// ⚠️ THE WEBSITE ONLY, FOR NOW. In an installed app this draws nothing and no
// name is sent. The store listings say the apps collect no name, and an
// optional name field has to be declared there first; that is Alex's call, not
// a default. The library's sendsNameUnasked() is the switch (false in an app).
//
// Its own component and its own state on purpose: DailyDone's tests address
// that file's state hooks by their order.
const loadLib = () => import("../lib/challengeReplies.js").catch(() => null);

export function MateNameAsk({ rival, game, edition, score }) {
  const t = useT();
  const [lib, setLib] = useState(null);
  const [draft, setDraft] = useState(() => replyName());
  const [state, setState] = useState("");   // "" | "busy" | "retry"
  const [told, setTold] = useState("");
  const rid = rival?.rid || "";
  useEffect(() => {
    let alive = true;
    loadLib().then((m) => { if (alive && m) { setLib(m); setTold(m.replyNamed(rid)); } });
    // The result's own send (and the other mounted copy of this panel) may
    // land a name after this has drawn.
    const onNamed = (e) => { if (e?.detail?.rid === rid) setTold(e.detail.name || ""); };
    window.addEventListener("biq:reply-named", onNamed);
    return () => { alive = false; window.removeEventListener("biq:reply-named", onNamed); };
  }, [rid]);
  // Not until the library is in; never in an installed app; never on a link
  // this device sent itself (nobody to tell).
  if (!lib || !lib.sendsNameUnasked() || lib.isOwnLink(rid)) return null;
  const them = rival?.name || "";
  if (told) {
    return (
      <p className="dd-name is-told" role="status">
        <Check size={14} strokeWidth={2.6} aria-hidden="true" /> {them ? t("mn.told", { them, name: told }) : t("mn.toldAnon", { name: told })}
      </p>
    );
  }
  const clean = cleanMateName(draft);
  const submit = async (e) => {
    e.preventDefault();
    if (state === "busy" || !clean) return;
    saveReplyName(clean);
    setState("busy");
    const ok = await lib.recordChallengeReply({ rid, game, edition, score, name: clean, explicit: true });
    // On success the library's event sets `told` here and in the other copy.
    setState(ok ? "" : "retry");
  };
  return (
    <form className="dd-name" onSubmit={submit}>
      <input
        className="dd-name-in" type="text" inputMode="text" autoComplete="given-name" autoCapitalize="words" enterKeyHint="send"
        maxLength={22} value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder={t("mn.placeholder")} aria-label={them ? t("mn.nameAria", { them }) : t("mn.placeholder")}
      />
      <button type="submit" className="dd-name-go" disabled={state === "busy" || !clean}>{them ? t("mn.tell", { them }) : t("mn.tellAnon")}</button>
      {state === "retry" && <span className="dd-name-err" role="alert">{t("mn.retry")}</span>}
    </form>
  );
}

export default MateNameAsk;
