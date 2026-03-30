import React from "react";
import VerifiedSeniorTag from "./VerifiedSeniorTag";
import { useAuth } from "../../context/AuthContext";

const AnswerItem = ({ answer, questionAuthorId, solvedAnswerId, questionId, onUpvote, onMarkSolved }) => {
    const { user } = useAuth();
    const userId    = user?._id || user?.id;
    const isOwnAnswer  = answer.author?._id === userId || answer.author === userId;
    const hasUpvoted   = answer.upvotes?.some(uid => (uid?._id || uid) === userId);
    const isSolved     = solvedAnswerId?.toString() === answer._id?.toString();
    const isQAuthor    = questionAuthorId === userId;

    return (
        <div style={{
            background: isSolved ? "rgba(0,255,136,0.05)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${isSolved ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: "12px", padding: "18px", marginBottom: "12px",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        {answer.author?.email?.split("@")[0] || "User"}
                    </span>
                    {answer.isVerifiedSenior && <VerifiedSeniorTag />}
                    {isSolved && (
                        <span style={{
                            background: "rgba(0,255,136,0.2)", color: "#00ff88",
                            padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem",
                            fontWeight: "bold",
                        }}>✓ Solution</span>
                    )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {/* Upvote button */}
                    <button
                        id={`upvote-btn-${answer._id}`}
                        onClick={() => onUpvote(answer._id)}
                        disabled={isOwnAnswer}
                        title={isOwnAnswer ? "Can't upvote your own answer" : "Upvote"}
                        style={{
                            background: hasUpvoted ? "rgba(112,0,255,0.2)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${hasUpvoted ? "rgba(112,0,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                            color: hasUpvoted ? "#a855f7" : "var(--text-muted)",
                            padding: "4px 12px", borderRadius: "8px",
                            cursor: isOwnAnswer ? "not-allowed" : "pointer",
                            fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px",
                        }}
                    >
                        👍 {answer.upvotes?.length || 0}
                    </button>
                    {/* Mark as solved — only question author, not their own post */}
                    {isQAuthor && !isSolved && !isOwnAnswer && (
                        <button
                            id={`solve-btn-${answer._id}`}
                            onClick={() => onMarkSolved(answer._id)}
                            style={{
                                background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)",
                                color: "#00ff88", padding: "4px 12px", borderRadius: "8px",
                                cursor: "pointer", fontSize: "0.85rem",
                            }}
                        >
                            ✓ Accept
                        </button>
                    )}
                </div>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{answer.body}</p>
        </div>
    );
};

export default AnswerItem;
