import React from 'react';

const ChargeDisplay = ({ charge }) => {
  return (
    <div 
      className="inline-flex items-center px-3 py-1 rounded-md shadow-sm"
      style={{ background: "rgba(0, 255, 136, 0.1)", color: "#00ff88", border: "1px solid rgba(0, 255, 136, 0.3)", fontWeight: "bold" }}
    >
      ₹{charge} — pay in person
    </div>
  );
};

export default ChargeDisplay;
