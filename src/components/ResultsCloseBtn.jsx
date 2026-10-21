
// The way out of a results screen: a back arrow at the top LEFT, where every
// other screen in the app has its back button. It was an X at the top right
// (Alex's recording of his Daily 7, 12 Oct 2026: the one screen that closes
// from the other corner). 44×44px. All result screens use this.
import { useT } from "../i18n/index.js";

export function ResultsCloseBtn({ onClose }) {
  const t = useT();
  return (
    <button
      onClick={onClose}
      aria-label={t("quiz.backHome")}
      style={{
        position: "absolute",
        top: 8,
        left: 0,
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--s1)",
        color: "var(--t2)",
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      ←
    </button>
  );
}

// ── Stump-a-mate: one-question challenge screen (balliq.app/q?id=… link) ────

export default ResultsCloseBtn;
