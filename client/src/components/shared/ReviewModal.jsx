import React, { useState } from "react";

const STARS = [1, 2, 3, 4, 5];

const ReviewModal = ({ title = "Leave a Review", onClose, onSubmit, isSubmitting }) => {
    const [rating, setRating]   = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit({ rating, comment });
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px",
        }}>
            <div style={{
                background: "rgba(20,20,40,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px", padding: "35px", width: "100%", maxWidth: "460px",
            }}>
                <h2 style={{ color: "#fff", marginTop: 0, marginBottom: "24px" }}>{title}</h2>

                {/* Stars */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    {STARS.map(star => (
                        <button
                            key={star}
                            id={`review-star-${star}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "2rem", lineHeight: 1,
                                color: star <= (hovered || rating) ? "#ffd700" : "rgba(255,255,255,0.2)",
                                transition: "color 0.15s, transform 0.15s",
                                transform: star <= (hovered || rating) ? "scale(1.1)" : "scale(1)",
                            }}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    id="review-comment"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Write a comment (optional)…"
                    rows={3}
                    style={{
                        width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px",
                        color: "#fff", fontSize: "0.95rem", resize: "vertical",
                        boxSizing: "border-box", marginBottom: "20px",
                    }}
                />

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: "12px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px", color: "var(--text-muted)", cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        id="review-submit-btn"
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        style={{
                            flex: 2, padding: "12px",
                            background: rating === 0 || isSubmitting
                                ? "rgba(255,255,255,0.05)"
                                : "linear-gradient(135deg, #7000ff, #00d4ff)",
                            border: "none", borderRadius: "10px",
                            color: rating === 0 ? "var(--text-muted)" : "#fff",
                            fontWeight: "bold", cursor: rating === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        {isSubmitting ? "Submitting…" : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
