import React from "react";
import { useCommunity } from "../../context/CommunityContext";

const SOSBroadcastBanner = () => {
    const { state, clearActiveSOS } = useCommunity();
    const sos = state.activeSOS;
    if (!sos) return null;

    return (
        <div id="sos-broadcast-banner" style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
            background: "linear-gradient(90deg, #1E293B, #991B1B)",
            color: "#F8FAFC", padding: "12px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.3rem" }}>🚨</span>
                <div>
                    <strong style={{ fontSize: "0.9rem" }}>CAMPUS ALERT: {sos.title}</strong>
                    <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>📍 {sos.location}</div>
                </div>
            </div>
            <button
                onClick={clearActiveSOS}
                aria-label="Dismiss SOS alert"
                style={{
                    background: "rgba(255,255,255,0.2)", border: "none",
                    color: "#fff", padding: "4px 12px", borderRadius: "8px",
                    cursor: "pointer", fontSize: "0.8rem",
                }}
            >
                Dismiss
            </button>
        </div>
    );
};

export default SOSBroadcastBanner;
