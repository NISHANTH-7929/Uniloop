import React, { useMemo } from "react";

const NoticeCard = ({ notice, onClick }) => {
    const msLeft = useMemo(() => {
        return new Date(notice.expiresAt).getTime() - Date.now();
    }, [notice.expiresAt]);

    const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));

    const ROLE_COLORS = { admin: "#ff6464", dept: "#00d4ff", club: "#a855f7", student: "#00ff88" };

    return (
        <div
            onClick={onClick}
            style={{
                background: notice.pinned ? "rgba(112,0,255,0.07)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${notice.pinned ? "rgba(112,0,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "14px", padding: "20px", cursor: "pointer",
                transition: "transform 0.2s", position: "relative",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
        >
            {notice.pinned && (
                <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "1rem" }} title="Pinned">📌</div>
            )}
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
                <span style={{
                    background: `${ROLE_COLORS[notice.posterRole] || "#888"}22`,
                    color: ROLE_COLORS[notice.posterRole] || "#888",
                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem",
                    fontWeight: "bold", textTransform: "capitalize",
                }}>
                    {notice.posterRole}
                </span>
                <span style={{
                    background: daysLeft <= 2 ? "rgba(255,100,100,0.15)" : "rgba(255,255,255,0.06)",
                    color: daysLeft <= 2 ? "#ff6464" : "var(--text-muted)",
                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem",
                }}>
                    ⏳ {daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft}d`}
                </span>
            </div>
            <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1rem" }}>{notice.title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0, lineHeight: 1.4 }}>
                {notice.body.slice(0, 100)}{notice.body.length > 100 ? "…" : ""}
            </p>
        </div>
    );
};

export default NoticeCard;
