import React from 'react';

const OrderStatusStepper = ({ currentStatus }) => {
  const steps = ["open", "accepted", "picked_up", "in_transit", "delivered"];
  
  const getStepLabels = (step) => {
    switch(step) {
      case "open": return "Posted";
      case "accepted": return "Accepted";
      case "picked_up": return "Picked Up";
      case "in_transit": return "In Transit";
      case "delivered": return "Delivered";
      default: return step;
    }
  };

  const currentIndex = steps.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div style={{ padding: "15px 20px", background: "rgba(255, 68, 68, 0.1)", border: "1px solid rgba(255, 68, 68, 0.3)", borderRadius: "8px", color: "#ff4444", fontWeight: "bold", textAlign: "center" }}>
        This order was cancelled.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", margin: "20px 0 40px" }}>
      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "100%", height: "2px", background: "var(--border-glass)", zIndex: 0 }}></div>
      
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;
        
        let bgColor = "var(--bg-secondary)";
        let borderColor = "var(--border-glass)";
        let textColor = "var(--text-muted)";
        let textShadow = "none";
        let shadow = "none";

        if (isCompleted) {
          bgColor = "var(--accent-purple)";
          borderColor = "var(--accent-purple)";
          textColor = "#fff";
        } else if (isCurrent) {
          bgColor = "var(--accent-cyan)";
          borderColor = "var(--accent-cyan)";
          textColor = "#000";
          shadow = "0 0 10px rgba(0, 212, 255, 0.5)";
        }

        return (
          <div key={step} style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
                width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: "0.85rem",
                background: bgColor, border: `2px solid ${borderColor}`, color: textColor,
                boxShadow: shadow,
                transition: "all 0.3s ease"
              }}
            >
              {index + 1}
            </div>
            <span style={{
                position: "absolute", top: "40px", fontSize: "0.75rem", fontWeight: "600", whiteSpace: "nowrap",
                color: isCompleted ? "var(--accent-purple)" : isCurrent ? "var(--accent-cyan)" : "var(--text-muted)",
                textShadow: isCurrent ? "0 0 5px rgba(0, 212, 255, 0.5)" : "none"
              }}
            >
              {getStepLabels(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
