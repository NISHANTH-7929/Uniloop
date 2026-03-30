import React from "react";

const ReviewReveal = ({ finderReview, claimerReview, tutorReview, learnerReview, giverReview, takerReview }) => {
    const pairs = [
        { label: "Finder / Returner", review: finderReview },
        { label: "Claimer",           review: claimerReview },
        { label: "Tutor",             review: tutorReview },
        { label: "Learner",           review: learnerReview },
        { label: "Skill Giver",       review: giverReview },
        { label: "Skill Taker",       review: takerReview },
    ].filter(p => p.review?.submitted);

    const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

    if (pairs.length === 0) return null;

    return (
        <div style={{ display: "grid", gap: "14px", gridTemplateColumns: pairs.length > 1 ? "1fr 1fr" : "1fr" }}>
            {pairs.map(({ label, review }) => (
                <div key={label} style={{
                    background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)",
                    borderRadius: "12px", padding: "16px",
                }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "6px" }}>{label}</div>
                    <div style={{ color: "#ffd700", fontSize: "1.2rem", letterSpacing: "2px" }}>
                        {renderStars(review.rating || 0)}
                    </div>
                    {review.comment && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "8px 0 0", lineHeight: 1.5 }}>
                            "{review.comment}"
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReviewReveal;
