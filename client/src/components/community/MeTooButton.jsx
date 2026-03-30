import React, { useState } from "react";

const MeTooButton = ({ count, hasVoted, onToggle, disabled }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        await onToggle();
        setLoading(false);
    };

    return (
        <button
            id="metoo-toggle-btn"
            onClick={handleClick}
            disabled={disabled || loading}
            style={{
                background: hasVoted ? "rgba(255,100,100,0.15)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${hasVoted ? "rgba(255,100,100,0.4)" : "rgba(255,255,255,0.12)"}`,
                color: hasVoted ? "#ff6464" : "var(--text-muted)",
                padding: "8px 18px", borderRadius: "10px",
                cursor: disabled || loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                fontSize: "0.9rem", fontWeight: "bold",
                transition: "all 0.2s",
            }}
        >
            {loading ? "…" : "✋"} {hasVoted ? "Me Too!" : "Me Too"} ({count})
        </button>
    );
};

export default MeTooButton;
