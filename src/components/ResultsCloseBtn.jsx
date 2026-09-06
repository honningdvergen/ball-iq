
// Shared close button for result screens. Absolutely positioned in the screen's
// top-right so it doesn't compete with the global wordmark on the left. 44×44px
// touch target. All result screens use this so the affordance is consistent.
export function ResultsCloseBtn({ onClose }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close results"
      style={{
        position: "absolute",
        top: 8,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--s1)",
        color: "var(--t2)",
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      ×
    </button>
  );
}

// ── Stump-a-mate: one-question challenge screen (balliq.app/q?id=… link) ────

export default ResultsCloseBtn;
