import React from "react";

const STATUS_COLORS = {
    submitted: "#00d4ff", under_review: "#ffd700",
    resolved: "#00ff88", dismissed: "#888",
};
const CATEGORY_ICONS = {
    canteen: "🍽️", hostel: "🏠", lab: "🔬",
    infrastructure: "🏗️", academic: "📚",
    safety: "🛡️", cleanliness: "🧹", other: "📋",
};

const ComplaintCard = ({ complaint, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", padding: "20px", cursor: "pointer",
            transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>{CATEGORY_ICONS[complaint.category] || "📋"}</span>
                <span style={{
                    background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)",
                    padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem",
                    textTransform: "capitalize",
                }}>
                    {complaint.category}
                </span>
            </div>
            <span style={{
                background: `${STATUS_COLORS[complaint.status] || "#888"}22`,
                color: STATUS_COLORS[complaint.status] || "#888",
                padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold",
            }}>
                {complaint.status?.replace("_", " ")}
            </span>
        </div>
        <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1rem" }}>{complaint.title}</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 12px", lineHeight: 1.4 }}>
            {complaint.description.slice(0, 80)}{complaint.description.length > 80 ? "…" : ""}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                👥 {complaint.meTooVoters?.length || 0} Me Too
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
        </div>
    </div>
);

export default ComplaintCard;
