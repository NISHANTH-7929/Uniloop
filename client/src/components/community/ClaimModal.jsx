import React, { useState } from "react";

const ClaimModal = ({ item, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit(answer);
        setLoading(false);
        setStep(3);
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px",
        }}>
            <div style={{
                background: "rgba(20,20,40,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px", padding: "35px", width: "100%", maxWidth: "480px",
                position: "relative",
            }}>
                <button onClick={onClose} style={{
                    position: "absolute", top: "15px", right: "20px",
                    background: "none", border: "none", color: "#fff",
                    fontSize: "1.4rem", cursor: "pointer",
                }}>×</button>

                <h2 style={{ color: "#fff", marginTop: 0, marginBottom: "20px" }}>
                    {step === 1 && "📦 Verify Your Claim"}
                    {step === 2 && "✏️ Answer the Question"}
                    {step === 3 && "✅ Request Sent!"}
                </h2>

                {step === 1 && (
                    <>
                        <div style={{
                            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                            borderRadius: "12px", padding: "20px", marginBottom: "20px",
                        }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 8px" }}>
                                The finder set a verification question. Answer correctly to claim this item.
                            </p>
                            <p style={{ color: "#fff", fontWeight: "bold", margin: 0 }}>
                                Q: {item.claimVerification?.question}
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            style={{
                                width: "100%", padding: "12px", background: "linear-gradient(135deg, #7000ff, #00d4ff)",
                                border: "none", borderRadius: "10px", color: "#fff",
                                fontWeight: "bold", fontSize: "1rem", cursor: "pointer",
                            }}
                        >
                            I Know the Answer →
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <input
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            style={{
                                width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px",
                                color: "#fff", fontSize: "1rem", marginBottom: "16px", boxSizing: "border-box",
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!answer.trim() || loading}
                            style={{
                                width: "100%", padding: "12px",
                                background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #7000ff, #00d4ff)",
                                border: "none", borderRadius: "10px", color: "#fff",
                                fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                            }}
                        >
                            {loading ? "Sending…" : "Submit Claim"}
                        </button>
                    </>
                )}

                {step === 3 && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📬</div>
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            Claim request sent — the finder will confirm. You'll be notified when they approve.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: "20px", padding: "10px 30px",
                                background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)",
                                borderRadius: "10px", color: "#00ff88",
                                fontWeight: "bold", cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClaimModal;
