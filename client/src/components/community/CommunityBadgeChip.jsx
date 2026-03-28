import React from "react";

const BADGE_COLORS = {
    "Good Samaritan": "#00ff88",
    "Campus Hero":    "#ff6464",
    "Verified Tutor": "#a855f7",
    "Skill Sharer":   "#ffd700",
    "Dept. Mentor":   "#00d4ff",
    "Top Contributor":"#ff7f50",
};

const CommunityBadgeChip = ({ badge }) => (
    <span style={{
        background: `${BADGE_COLORS[badge] || "#888"}22`,
        border: `1px solid ${BADGE_COLORS[badge] || "#888"}55`,
        color: BADGE_COLORS[badge] || "#888",
        padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem",
        fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
        🏅 {badge}
    </span>
);

export default CommunityBadgeChip;
