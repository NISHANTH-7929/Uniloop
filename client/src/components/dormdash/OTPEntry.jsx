import React, { useState } from 'react';

const OTPEntry = ({ onVerify, loading }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 4) {
      onVerify(otp);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: "30px", textAlign: "center", background: "rgba(112, 0, 255, 0.05)", border: "1px solid rgba(112, 0, 255, 0.2)" }}>
      <h3 style={{ margin: "0 0 10px", color: "var(--accent-purple)", fontSize: "1.2rem", fontWeight: "bold" }}>Confirm Delivery</h3>
      <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Ask the requester for the 4-digit OTP shown on their screen.</p>
      
      <div style={{ marginBottom: "20px" }}>
        <input 
          type="text" 
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          className="neon-input"
          style={{ width: "160px", textAlign: "center", fontSize: "2rem", letterSpacing: "8px", fontWeight: "bold", padding: "10px" }}
          placeholder="••••"
          disabled={loading}
        />
      </div>
      
      <button 
        type="submit"
        disabled={otp.length !== 4 || loading}
        className={`btn-neon ${otp.length === 4 ? 'primary' : ''}`}
        style={{ width: "160px", opacity: otp.length === 4 ? 1 : 0.5 }}
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </form>
  );
};

export default OTPEntry;
