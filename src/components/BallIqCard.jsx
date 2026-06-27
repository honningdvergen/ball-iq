import React from "react";
import { computeCard, CARD_TIERS } from "../lib/ballIqCard.js";

// FIFA-style Ball IQ player card. Tier (bronze/silver/gold) is driven by the
// overall, which compiles the six competition ratings from per-category accuracy.
export function BallIqCard({ catStats, name, avatarUrl, avatarEmoji = "⚽", overallAccuracy, showIdentity = true }) {
  const { overall, tier, ratings } = computeCard(catStats || {}, typeof overallAccuracy === "number" ? overallAccuracy : 0.4);
  const t = CARD_TIERS[tier] || CARD_TIERS.bronze;
  return (
    <div style={{
      background: t.bg,
      border: `1.5px solid ${t.accent}55`,
      borderRadius: 18,
      padding: "18px 18px 16px",
      boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* faint accent glow top-left */}
      <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent}22 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Top row — overall block (left) + avatar (right), FIFA-style. */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
        <div>
          <div style={{ fontSize: 48, fontWeight: 900, color: t.accent, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{overall}</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: t.text, opacity: 0.65, marginTop: 3 }}>OVERALL</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: t.accent, marginTop: 7 }}>{t.label}</div>
        </div>
        {showIdentity && (
          <div style={{ width: 78, height: 78, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${t.accent}`, background: "#16181F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : avatarEmoji}
          </div>
        )}
      </div>

      {/* Name (only on the shareable full card — the in-app profile header
          already shows it, so showIdentity={false} hides it to avoid the dupe). */}
      {showIdentity && (
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 10, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name || "Ball IQ Player"}
        </div>
      )}

      <div style={{ height: 1, background: `${t.accent}33`, margin: showIdentity ? "12px 0 14px" : "14px 0 14px" }} />

      {/* Six competition ratings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 12, columnGap: 18 }}>
        {ratings.map(r => (
          <div key={r.abbr} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ fontSize: 17, width: 22, textAlign: "center", flexShrink: 0 }}>{r.icon}</div>
            <div style={{ fontSize: 19, fontWeight: 900, color: t.accent, minWidth: 24, fontVariantNumeric: "tabular-nums" }}>{r.rating}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text, opacity: 0.8, letterSpacing: 0.5 }}>{r.abbr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
