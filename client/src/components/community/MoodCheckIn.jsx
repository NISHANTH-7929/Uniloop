import React, { useState } from "react";

const EMOJIS = ["😔", "😟", "😐", "🙂", "😊"];

const MoodCheckIn = ({ onSubmit }) => {
    const [selected, setSelected] = useState(null);
    const [done, setDone]         = useState(false);
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        await onSubmit({ score: selected });
        setLoading(false);
        setDone(true);
    };

    if (done) {
        return (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✓</div>
                <p style={{ color: "#00ff88", fontWeight: "bold" }}>Logged ✓</p>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
                {EMOJIS.map((emoji, idx) => {
                    const score = idx + 1;
                    return (
                        <button
                            key={score}
                            id={`mood-emoji-${score}`}
                            onClick={() => setSelected(score)}
                            style={{
                                background: "none", border: "none",
                                fontSize: selected === score ? "3rem" : "2.2rem",
                                cursor: "pointer",
                                filter: selected && selected !== score ? "grayscale(0.7) opacity(0.5)" : "none",
                                transform: selected === score ? "scale(1.2)" : "scale(1)",
                                transition: "all 0.2s",
                            }}
                        >
                            {emoji}
                        </button>
                    );
                })}
            </div>
            <button
                id="mood-submit-btn"
                onClick={handleSubmit}
                disabled={!selected || loading}
                style={{
                    padding: "10px 30px",
                    background: selected ? "linear-gradient(135deg, #7000ff, #00d4ff)" : "rgba(255,255,255,0.06)",
                    border: "none", borderRadius: "10px",
                    color: selected ? "#fff" : "var(--text-muted)",
                    fontWeight: "bold", cursor: selected ? "pointer" : "not-allowed",
                }}
            >
                {loading ? "Logging…" : "Log Mood"}
            </button>
        </div>
    );
};

export default MoodCheckIn;
