import React, { useState } from 'react';

const ReviewModal = ({ isOpen, onClose, onSubmit, role }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "30px", borderRadius: "20px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
        <h2 style={{ color: "#fff", marginBottom: "10px", marginTop: 0 }}>Rate your {role}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>Your review is blind—it won't be revealed until both of you submit one.</p>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star} 
              onClick={() => setRating(star)} 
              style={{ fontSize: "2rem", background: "none", border: "none", cursor: "pointer", color: star <= rating ? "#ffd700" : "rgba(255,255,255,0.2)", transition: "color 0.2s" }}
            >
              ★
            </button>
          ))}
        </div>

        <textarea 
          className="neon-input"
          rows={3}
          placeholder="Leave a comment (optional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ marginBottom: "20px", resize: "none" }}
        />

        <button 
          disabled={rating === 0}
          onClick={() => onSubmit({ rating, comment })}
          className={`btn-neon ${rating > 0 ? 'primary' : ''}`}
          style={{ width: "100%", opacity: rating > 0 ? 1 : 0.5 }}
        >
          Submit Review
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;
