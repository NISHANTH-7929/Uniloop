import React from "react";

const ChargeDisplay = ({ chargePerHour, chargeIfAny, label = "hr" }) => {
    const charge = chargePerHour ?? chargeIfAny ?? 0;
    return (
        <span style={{
            background: charge === 0 ? "rgba(0,255,136,0.15)" : "rgba(255,215,0,0.15)",
            color: charge === 0 ? "#00ff88" : "#ffd700",
            border: `1px solid ${charge === 0 ? "rgba(0,255,136,0.3)" : "rgba(255,215,0,0.3)"}`,
            padding: "2px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold",
        }}>
            {charge === 0 ? "Free" : `₹${charge}/${label}`}
        </span>
    );
};

export default ChargeDisplay;
