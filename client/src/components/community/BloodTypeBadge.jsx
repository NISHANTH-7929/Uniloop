import React from "react";

const BLOOD_COLORS = {
    "A+": "#e74c3c", "A-": "#c0392b",
    "B+": "#e67e22", "B-": "#d35400",
    "AB+": "#9b59b6", "AB-": "#8e44ad",
    "O+": "#3498db", "O-": "#2980b9",
};

const BloodTypeBadge = ({ bloodType }) => {
    if (!bloodType) return null;
    return (
        <span style={{
            background: BLOOD_COLORS[bloodType] || "#e74c3c",
            color: "#fff", padding: "4px 12px", borderRadius: "20px",
            fontSize: "0.85rem", fontWeight: "bold", letterSpacing: "0.5px",
        }}>
            🩸 {bloodType}
        </span>
    );
};

export default BloodTypeBadge;
