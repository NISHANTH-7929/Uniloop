import React from "react";
import AnonymousTag from "./AnonymousTag";

const STATUS_COLORS = { active: "#00ff88", claimed: "#ffd700", archived: "#888" };
const CATEGORY_ICONS = {
    wallet: "👛", phone: "📱", keys: "🔑", "id-card": "🪪", bag: "🎒",
    clothing: "👕", stationery: "✏️", electronics: "💻", jewellery: "💍", other: "📦",
};

const LostFoundCard = ({ item, onClick }) => {
    const isLost = item.type === "lost";
    return (
        <div
            onClick={onClick}
            style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${isLost ? "rgba(255,100,100,0.3)" : "rgba(0,255,136,0.3)"}`,
                borderRadius: "14px", padding: "20px", cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{
                    background: isLost ? "rgba(255,100,100,0.2)" : "rgba(0,255,136,0.2)",
                    color: isLost ? "#ff6464" : "#00ff88",
                    padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem",
                    fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px",
                }}>
                    {item.type}
                </span>
                <span style={{ fontSize: "1.4rem" }}>{CATEGORY_ICONS[item.category] || "📦"}</span>
            </div>

            <h3 style={{ color: "#fff", margin: "0 0 6px", fontSize: "1rem" }}>{item.title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 10px", lineHeight: 1.4 }}>
                {item.description.slice(0, 80)}{item.description.length > 80 ? "…" : ""}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>📍 {item.locationTag}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {item.isAnonymous && <AnonymousTag />}
                    <span style={{
                        background: `${STATUS_COLORS[item.status]}22`,
                        color: STATUS_COLORS[item.status],
                        padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem",
                    }}>{item.status}</span>
                </div>
            </div>
        </div>
    );
};

export default LostFoundCard;
