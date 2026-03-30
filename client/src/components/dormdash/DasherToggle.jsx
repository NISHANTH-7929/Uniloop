import React, { useState } from 'react';
import api from '../../api/dormdashApi';

const DasherToggle = ({ isOnline, onToggle, hasActiveOrder }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (isOnline && hasActiveOrder) {
      const confirm = window.confirm("You have an active order. Going offline won't cancel it. Proceed?");
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const { data } = await api.patch('/dormdash/dasher/toggle', { isOnline: !isOnline });
      if (data.success) {
        onToggle(data.isOnline);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to toggle status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h3 style={{ margin: "0 0 5px", color: "#fff", fontSize: "1.2rem" }}>Dasher Status</h3>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {isOnline ? "You are visible to receive requests." : "You are currently offline."}
        </p>
      </div>
      <button 
        onClick={handleToggle}
        disabled={loading}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: "50px",
          height: "26px",
          borderRadius: "15px",
          border: "none",
          cursor: "pointer",
          background: isOnline ? "rgba(0, 255, 136, 0.8)" : "rgba(255, 255, 255, 0.1)",
          transition: "background 0.3s"
        }}
      >
        <span 
          style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#fff",
            transform: isOnline ? "translateX(26px)" : "translateX(3px)",
            transition: "transform 0.3s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
        />
      </button>
    </div>
  );
};

export default DasherToggle;
