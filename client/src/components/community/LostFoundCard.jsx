import React from "react";

const STATUS_COLORS = { active: "#00ff88", claimed: "#a855f7", archived: "#888" };
const CATEGORY_ICONS = {
    wallet: "👛", phone: "📱", keys: "🔑", "id-card": "🪪", bag: "🎒",
    clothing: "👕", stationery: "✏️", electronics: "💻", jewellery: "💍", other: "📦",
};

const LostFoundCard = ({ item, onClick }) => {
    const isLost  = item.type === "lost";
    const accent  = isLost ? "#ff6464" : "#00ff88";
    const icon    = CATEGORY_ICONS[item.category] || "📦";

    return (
        <div
            onClick={onClick}
            style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${accent}22`,
                borderRadius: "18px", padding: "22px",
                cursor: "pointer", position: "relative", overflow: "hidden",
                transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 35px rgba(0,0,0,0.35)`;
                e.currentTarget.style.borderColor = `${accent}55`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.borderColor = `${accent}22`;
            }}
        >
            {/* Subtle gradient top bar */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                background: `linear-gradient(90deg, ${accent}, transparent)`,
                borderRadius: "18px 18px 0 0",
            }} />

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{
                    background: `${accent}18`,
                    color: accent,
                    padding: "4px 12px", borderRadius: "20px",
                    fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px",
                }}>
                    {isLost ? "😟 Lost" : "📦 Found"}
                </span>
                <span style={{ fontSize: "1.6rem", opacity: 0.9 }} title={item.category}>{icon}</span>
            </div>

            {/* Title */}
            <h3 style={{
                color: "#fff", margin: "0 0 8px", fontSize: "1rem",
                fontFamily: "var(--font-display)", fontWeight: "600",
                lineHeight: 1.3,
            }}>
                {item.title}
            </h3>

            {/* Description excerpt */}
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "0 0 14px", lineHeight: 1.5 }}>
                {item.description.length > 80 ? item.description.slice(0, 80) + "…" : item.description}
            </p>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    📍 {item.locationTag}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {item.isAnonymous && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "10px" }}>
                            👤 Anon
                        </span>
                    )}
                    <span style={{
                        background: `${STATUS_COLORS[item.status] || "#888"}18`,
                        color: STATUS_COLORS[item.status] || "#888",
                        padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "700",
                        textTransform: "capitalize",
                    }}>
                        {item.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LostFoundCard;
