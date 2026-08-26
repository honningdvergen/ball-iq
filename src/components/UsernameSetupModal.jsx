import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase.js";
import { isProfaneUsername } from "../lib/profanity.js";
import { useModalA11y } from "../useModalA11y.js";

// 1.0.2 Feature E: one-time "pick your username" step shown right after a NEW
// Apple/Google sign-up. Email sign-ups already choose a username at the Login
// screen; social sign-ups otherwise land on a server default (player_xxxxx via
// the on-signup trigger / deriveUsernameFromIdentity). This makes that choice
// explicit and user-controlled: pre-filled with the best available name so the
// happy path is a single "Continue" tap, but editable, and validated against
// the same profanity + uniqueness rules as the email signup flow.
//
// Trigger + dismissal live in App.jsx; this component just owns the step UI and
// the profiles.username write. onSaved(name) is called once the name is
// committed (or accepted for a guest with no row), letting the host update the
// local profile + clear the biq_needs_username flag.

const isDefaultName = (n) => {
  const t = (n || "").trim();
  return !t || t === "Player" || /^player_/i.test(t);
};

// Mirrors useAuth.tryDeriveUsernameFromUser's candidate order so the pre-fill
// matches what the silent auto-derive would have picked.
function derivePrefill(user, authProfile) {
  const current = (authProfile?.username || "").trim();
  // The server may already have derived a real name from the identity — if so,
  // confirm that rather than re-deriving.
  if (!isDefaultName(current)) return current;
  const m = user?.user_metadata || {};
  const candidates = [
    m.full_name,
    m.name,
    m.preferred_username,
    [m.given_name, m.family_name].filter(Boolean).join(" "),
    m.display_name,
  ].filter((s) => typeof s === "string" && s.trim().length > 0);
  const name = (candidates[0] || "").trim().replace(/\s+/g, " ").slice(0, 24);
  return name.length >= 3 ? name : "";
}

// Mandatory step — there is no dismiss path (App.jsx only unmounts this on
// onSaved), so back/ESC close is a stable no-op: the hook is here for the
// focus trap + focus restore, and so a back gesture consumes the pushed
// history entry instead of exiting the app. Must be module-level — an inline
// arrow would re-run the hook's effect (and push a history entry) on every
// keystroke re-render.
const noDismiss = () => {};

export function UsernameSetupModal({ user, authProfile, onSaved, onEvent }) {
  const initial = useMemo(() => derivePrefill(user, authProfile), [user, authProfile]);
  const modalRef = useRef(null);
  useModalA11y({ isOpen: true, onClose: noDismiss, ref: modalRef });
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ⚠️ This was the ONLY mandatory first-run screen with zero instrumentation,
  // which is precisely why a wall that rejected its own pre-filled value could
  // sit here for eight weeks — through report #2, through a two-device
  // playtest, and invisible to the experience audit (which seeds
  // biq_onboarded and so never reaches any first-run surface).
  // Fire-and-forget, and never allowed to break the step it is measuring.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const track = useCallback((name, meta) => {
    try { onEventRef.current?.(name, meta); } catch { /* never block the wall */ }
  }, []);
  // In an effect, not in the render body: a side effect during render fires
  // twice under StrictMode and would double-count every impression.
  useEffect(() => {
    track("username-step-shown", { prefilled: initial.length > 0, hadSpace: /\s/.test(initial) });
    // Once per mount. `initial` is memoised on user/authProfile and this step
    // is unmounted on save, so a re-derive mid-step is not a new impression.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    // ⚠️ SPACES ARE ALLOWED, and removing this rule is the fix — not a
    // loosening. This screen is MANDATORY and non-dismissible, it pre-fills
    // the provider's real name, and derivePrefill deliberately KEEPS the space
    // (`.replace(/\s+/g, " ")`). It then rejected its own suggestion with
    // "Usernames can't contain spaces". Tap the button the app pre-filled for
    // you and it calls you wrong — live for eight weeks on every Apple/Google
    // sign-up, and the exact shape of the Transfer Trail bug found the same
    // day: the product offering a value and then refusing it.
    //
    // The rest of the system had already settled this question the other way.
    // useAuth.deriveUsernameFromIdentity writes `fullName.trim().replace(
    // /\s+/g, " ")` straight into profiles.username, and its collision suffix
    // is `${cleaned} ${suffix + 1}` — another space. Measured in prod
    // 2026-08-23: 17 of 215 profiles already carry a username with a space,
    // live on leaderboards and in friend search. This modal was the ONLY
    // place that disagreed, so it is the one that was wrong.
    //
    // Safe in URLs: the profile share builds with URLSearchParams
    // (App.jsx:10789), which percent-encodes.
    //
    // Collapse internal runs so the stored value matches what the silent
    // auto-derive would have written for the same person.
    const v = draft.trim().replace(/\s+/g, " ");
    if (v.length < 3) {
      setError("Username must be at least 3 characters");
      track("username-step-rejected", { reason: "too-short" });
      return;
    }
    if (isProfaneUsername(v)) {
      setError("This username isn't allowed. Please choose another.");
      track("username-step-rejected", { reason: "profanity" });
      return;
    }
    // Defensive: no signed-in row to write to → accept locally and move on.
    if (!user?.id) {
      track("username-step-saved", { path: "local" });
      onSaved(v);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ username: v })
        .eq("id", user.id);
      if (updErr) {
        // Same dup-username mapping as the email signup path (Login.jsx).
        const raw = updErr.message || "";
        const isDup = /profiles_username_key|duplicate key|already (?:registered|taken)/i.test(raw);
        setError(
          isDup
            ? `"${v}" is already taken — try another.`
            : "Couldn't save — check your connection and try again."
        );
        track("username-step-rejected", { reason: isDup ? "duplicate" : "write-failed" });
        setSaving(false);
        return;
      }
      track("username-step-saved", { path: "profile", changed: v !== initial });
      onSaved(v);
    } catch {
      setError("Couldn't save — check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <div ref={modalRef} tabIndex={-1} className="onboard-wrap" role="dialog" aria-modal="true" aria-label="Choose your username">
      <div className="onboard-viewport">
        <div className="onboard-step" style={{ width: "100%" }}>
          <div className="onboard-step-top">
            <div className="onboard-icon" aria-hidden="true">⚽️</div>
            <div className="onboard-title">Pick your username</div>
            <div className="onboard-body">
              This is how you'll show up on leaderboards and to friends. You can
              change it later in your profile.
            </div>
            <input
              className="profile-name-input"
              style={{ width: "100%", maxWidth: 340, textAlign: "center", marginBottom: 10 }}
              value={draft}
              onChange={(e) => { setDraft(e.target.value.slice(0, 24)); if (error) setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !saving) handleContinue(); }}
              placeholder="Your username"
              /* ⚠️ NO autoFocus. THIS IS THE THIRD BUG FROM THIS ROOT.
                 The happy path here needs ZERO typing — derivePrefill() has
                 already filled the field and the player only has to press
                 Continue. autoFocus opened the keyboard anyway, and this
                 overlay cannot get out of its way: `.onboard-wrap` is
                 position:fixed; inset:0; overflow:hidden (app.css) and
                 capacitor.config.json sets Keyboard "resize":"none", so the
                 viewport never shrinks and `.onboard-actions` — the Continue
                 button — ends up UNDER the keyboard. Nothing in the app does
                 visualViewport handling to rescue it.
                 Same root as the Trail and Footle keyboard bugs: content laid
                 out around a focused input, in a container that will not
                 resize. It is the mandatory screen every social sign-up must
                 pass, which is how it became the sign-up dead end.
                 A player who WANTS to change the name still taps the field. */
              maxLength={24}
              aria-label="Your username"
              aria-invalid={!!error}
            />
            {error && (
              <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, maxWidth: 340, marginBottom: 6 }} role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="onboard-actions">
            <button
              className="onboard-btn"
              onClick={handleContinue}
              disabled={saving || draft.trim().length < 3}
              style={(saving || draft.trim().length < 3) ? { opacity: 0.55 } : undefined}
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
