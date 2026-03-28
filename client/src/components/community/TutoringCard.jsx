import React from "react";
import ChargeDisplay from "../shared/ChargeDisplay";

const TutoringCard = ({ session, onClick }) => {
    const isOffer = session.sessionType === "offer";
    return (
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
                <span style={{
                    background: isOffer ? "rgba(112,0,255,0.2)" : "rgba(0,212,255,0.2)",
                    color: isOffer ? "#a855f7" : "#00d4ff",
                    padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem",
                    fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px",
                }}>
                    {isOffer ? "Offer" : "Request"}
                </span>
                <ChargeDisplay chargePerHour={session.chargePerHour} />
            </div>
            <h3 style={{ color: "#fff", margin: "0 0 4px", fontSize: "1rem" }}>{session.subject}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0 0 8px" }}>
                {session.department} · Sem {session.semester}
            </p>
            {session.description && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 12px", lineHeight: 1.4 }}>
                    {session.description.slice(0, 80)}{session.description.length > 80 ? "…" : ""}
                </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    🎓 {session.tutor?.email?.split("@")[0] || "Unknown"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {session.mode === "online" ? "💻 Online" : "🏛️ In-person"}
                </span>
            </div>
        </div>
    );
};

export default TutoringCard;
