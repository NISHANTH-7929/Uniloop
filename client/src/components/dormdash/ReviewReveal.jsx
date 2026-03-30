import React from 'react';

const ReviewReveal = ({ myReview, theirReview }) => {
  if (!myReview?.submitted || !theirReview?.submitted) return null;

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} style={{ color: i < rating ? "#ffd700" : "rgba(255,255,255,0.2)", fontSize: "1.2rem" }}>★</span>
    ));
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", marginTop: "20px" }}>
      <h3 style={{ margin: "0 0 15px", color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", textAlign: "center", fontSize: "1.2rem" }}>🎉 Reviews Revealed!</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
          <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>You wrote</p>
          <div style={{ marginBottom: "5px" }}>{renderStars(myReview.rating)}</div>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem", fontStyle: "italic" }}>"{myReview.comment || "No comment provided."}"</p>
        </div>
        
        <div style={{ background: "rgba(0, 212, 255, 0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
          <p style={{ margin: "0 0 5px", color: "var(--accent-cyan)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>They wrote</p>
          <div style={{ marginBottom: "5px" }}>{renderStars(theirReview.rating)}</div>
          <p style={{ margin: 0, color: "#fff", fontSize: "0.9rem", fontStyle: "italic" }}>"{theirReview.comment || "No comment provided."}"</p>
        </div>
        
      </div>
    </div>
  );
};

export default ReviewReveal;
