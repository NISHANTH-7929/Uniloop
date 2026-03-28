import React from "react";
import BloodTypeBadge from "./BloodTypeBadge";

const URGENCY_COLORS = { critical: "#ff4444", normal: "#ffd700" };
const TYPE_ICONS = {
    blood: "🩸", medical: "🏥", safety: "🚨", fire: "🔥", infrastructure: "🏗️",
};

const EmergencyCard = ({ item, onClick }) => {
    const isBlood = item.type === "blood";
    return (
        <div
            onClick={onClick}
            style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${item.urgency === "critical" ? "rgba(255,68,68,0.4)" : "rgba(255,215,0,0.3)"}`,
                borderRadius: "14px", padding: "20px", cursor: "pointer",
                transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>{TYPE_ICONS[item.type]}</span>
                    <div>
                        <div style={{
                            color: URGENCY_COLORS[item.urgency],
                            fontSize: "0.7rem", textTransform: "uppercase",
                            letterSpacing: "1px", fontWeight: "bold",
                        }}>
                            {item.urgency} • {item.type}
                        </div>
                        <h3 style={{ color: "#fff", margin: 0, fontSize: "1rem" }}>{item.title}</h3>
                    </div>
                </div>
                {isBlood && <BloodTypeBadge bloodType={item.bloodType} />}
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 10px" }}>
                {item.description.slice(0, 90)}{item.description.length > 90 ? "…" : ""}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>📍 {item.location}</span>
                <span style={{
                    color: item.status === "active" ? "#00ff88" : "var(--text-muted)",
                    fontSize: "0.75rem",
                }}>
                    {item.responses?.length || 0} response{item.responses?.length !== 1 ? "s" : ""}
                </span>
            </div>
        </div>
    );
};

export default EmergencyCard;
