import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const MODAL = read("../../src/components/UsernameSetupModal.jsx");
const CSS = read("../../src/app.css");
const CAP = read("../../capacitor.config.json");

/**
 * ⚠️ THE KEYBOARD MUST NOT BURY THE ONLY BUTTON.
 *
 * Third bug from one root. `.onboard-wrap` is position:fixed with inset:0 and
 * overflow:hidden, and Capacitor is configured with Keyboard resize:"none" —
 * so when the software keyboard opens, the viewport does NOT shrink and
 * anything at the bottom of the overlay is simply covered. The username step
 * is the mandatory screen every social sign-up passes through, and it had
 * autoFocus on its input, which opens the keyboard on mount.
 *
 * The field is PRE-FILLED (derivePrefill), so the happy path requires no
 * typing at all — the keyboard bought nothing and cost the Continue button.
 */
describe("the onboarding username step cannot trap its own button", () => {
  it("does not autofocus the input", () => {
    // Anchor on the input element, not the whole file — a comment mentioning
    // autoFocus must not fail this, and a real attribute must not pass it.
    const input = MODAL.slice(MODAL.indexOf("<input"), MODAL.indexOf("aria-invalid"));
    expect(input, "autoFocus opens the keyboard over a fixed, non-resizing overlay").not.toMatch(/^\s*autoFocus/m);
  });

  it("the conditions that make autofocus dangerous still hold", () => {
    // If either of these ever changes, the rule above can be revisited — but
    // it must be a decision, not a silent drift. A NEGATIVE here means the
    // premise moved, so re-read the comment in the modal before relaxing it.
    expect(CSS, ".onboard-wrap stopped being a fixed overlay").toMatch(
      /\.onboard-wrap\{[^}]*position:fixed/
    );
    expect(CSS, ".onboard-wrap stopped clipping its overflow").toMatch(
      /\.onboard-wrap\{[^}]*overflow:hidden/
    );
    expect(JSON.parse(CAP)?.plugins?.Keyboard?.resize,
      "Keyboard.resize changed — the viewport may now shrink on its own").toBe("none");
  });
});
