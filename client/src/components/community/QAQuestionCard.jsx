import React from "react";

const QAQuestionCard = ({ post, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${post.status === "solved" ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: "14px", padding: "20px", cursor: "pointer",
            transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{
                    background: "rgba(112,0,255,0.2)", color: "#a855f7",
                    padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem",
                }}>
                    {post.subjectCode}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: "1.6rem" }}>
                    Sem {post.semester}
                </span>
            </div>
            {post.status === "solved" && (
                <span style={{
                    background: "rgba(0,255,136,0.15)", color: "#00ff88",
                    padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold",
                }}>
                    ✓ Solved
                </span>
            )}
        </div>
        <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1rem", lineHeight: 1.4 }}>{post.title}</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    💬 {post.answers?.length || 0} answers
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    👁️ {post.viewCount || 0} views
                </span>
            </div>
            {post.tags?.length > 0 && (
                <div style={{ display: "flex", gap: "4px" }}>
                    {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text-muted)", padding: "1px 6px",
                            borderRadius: "8px", fontSize: "0.72rem",
                        }}>#{tag}</span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default QAQuestionCard;
