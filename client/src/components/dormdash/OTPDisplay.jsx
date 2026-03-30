import React, { useState, useEffect } from 'react';

const OTPDisplay = ({ otp, expiresAt, onRegenerate }) => {
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!otp) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otp]);

  if (!otp) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="glass-panel" style={{ padding: "30px", textAlign: "center", background: "rgba(0, 212, 255, 0.05)", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
      <h3 style={{ margin: "0 0 10px", color: "var(--accent-cyan)", fontSize: "1.2rem" }}>Delivery OTP</h3>
      <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Show this to your dasher to confirm delivery.</p>
      
      {timeLeft > 0 ? (
        <>
          <div style={{ display: "inline-block", padding: "15px 30px", background: "rgba(0, 0, 0, 0.5)", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "15px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "bold", letterSpacing: "10px", color: "#fff", fontFamily: "monospace" }}>
              {otp}
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: "600" }}>Auto-hides in {minutes}:{seconds < 10 ? '0' : ''}{seconds}</p>
        </>
      ) : (
        <div style={{ padding: "20px 0" }}>
          <p style={{ color: "#ff4444", fontWeight: "bold", marginBottom: "15px" }}>OTP Window Expired</p>
          {onRegenerate && (
            <button onClick={onRegenerate} className="btn-neon primary">
              Regenerate OTP
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OTPDisplay;
