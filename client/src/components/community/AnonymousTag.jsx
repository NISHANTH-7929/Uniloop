import React from "react";

const AnonymousTag = () => (
    <span style={{
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
        color: "var(--text-muted)", padding: "2px 8px", borderRadius: "10px",
        fontSize: "0.72rem", fontWeight: "bold",
        display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
        👤 Anonymous
    </span>
);

export default AnonymousTag;
