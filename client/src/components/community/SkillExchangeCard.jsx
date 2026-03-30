import React from "react";
import ChargeDisplay from "../shared/ChargeDisplay";

const CATEGORY_ICONS = {
    academic: "📚", music: "🎵", art: "🎨", sports: "⚽",
    tech: "💻", language: "🌐", other: "✨",
};

const SkillExchangeCard = ({ skill, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,165,0,0.2)",
            borderRadius: "14px", padding: "20px", cursor: "pointer",
            transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.3rem" }}>{CATEGORY_ICONS[skill.category] || "✨"}</span>
            <ChargeDisplay chargeIfAny={skill.chargeIfAny} label="session" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ color: "#00ff88", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>I OFFER</div>
                <div style={{ color: "#fff", fontSize: "0.9rem" }}>{skill.offerSkill}</div>
            </div>
            <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ color: "#00d4ff", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>I WANT</div>
                <div style={{ color: "#fff", fontSize: "0.9rem" }}>{skill.wantSkill}</div>
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                👤 {skill.poster?.email?.split("@")[0] || "Unknown"}
            </span>
            {skill.duration && (
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>⏱️ {skill.duration}</span>
            )}
        </div>
    </div>
);

export default SkillExchangeCard;
