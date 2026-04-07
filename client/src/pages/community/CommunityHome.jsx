import React from "react";
import { useNavigate } from "react-router-dom";
import useCommunitySocket from "../../hooks/useCommunitySocket";
import SOSBroadcastBanner from "../../components/community/SOSBroadcastBanner";

const MODULES = [
    {
        id: "lostfound", icon: "🔍", label: "Lost & Found",
        desc: "Report lost items or return found ones",
        path: "/community/lostfound", color: "#00ff88",
        stat: "Help reunite items with owners",
    },
    {
        id: "emergency", icon: "🚨", label: "Emergency Network",
        desc: "Blood donation requests & SOS alerts",
        path: "/community/emergency", color: "#ff4444",
        stat: "Real-time campus emergency help",
    },
    {
        id: "tutoring", icon: "🎓", label: "Peer Tutoring",
        desc: "Find a study buddy or offer tutoring",
        path: "/community/tutoring", color: "#a855f7",
        stat: "Learn from your fellow students",
    },
    {
        id: "skills", icon: "🤝", label: "Skill Exchange",
        desc: "Barter skills — teach what you know",
        path: "/community/skills", color: "#ffd700",
        stat: "Exchange expertise, no payment needed",
    },
    {
        id: "qa", icon: "💬", label: "Academic Q&A",
        desc: "Ask course questions, get answers",
        path: "/community/qa", color: "#00d4ff",
        stat: "Crowd-sourced academic support",
    },
    {
        id: "complaints", icon: "📋", label: "Complaint Box",
        desc: "Submit campus complaints anonymously",
        path: "/community/complaints", color: "#ff7f50",
        stat: "Anonymous & secure reporting",
    },

    {
        id: "notices", icon: "📌", label: "Campus Notices",
        desc: "Official announcements & updates",
        path: "/community/notices", color: "#00d4ff",
        stat: "Stay informed on campus news",
    },
];

const CommunityHome = () => {
    const navigate = useNavigate();
    useCommunitySocket();

    return (
        <div className="community-page">
            <SOSBroadcastBanner />
            <div className="community-container">
                {/* Hero section */}
                <div style={{ textAlign: "center", marginBottom: "52px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        background: "rgba(112,0,255,0.12)", border: "1px solid rgba(112,0,255,0.3)",
                        borderRadius: "20px", padding: "6px 16px", marginBottom: "20px",
                        fontSize: "0.82rem", color: "#a855f7", fontWeight: "600",
                    }}>
                        🌐 Campus Super-App
                    </div>
                    <h1 style={{
                        fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: "800",
                        background: "linear-gradient(135deg, #a855f7 0%, #00d4ff 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        margin: "0 0 16px", lineHeight: 1.1,
                        fontFamily: "var(--font-display)",
                    }}>
                        Community Support
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto" }}>
                        7 ways to connect, help, and grow together on campus
                    </p>
                </div>

                {/* Module grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "16px",
                }}>
                    {MODULES.map(mod => (
                        <button
                            key={mod.id}
                            id={`community-card-${mod.id}`}
                            onClick={() => navigate(mod.path)}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${mod.color}28`,
                                borderRadius: "20px", padding: "24px 20px",
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.25s ease",
                                position: "relative", overflow: "hidden",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = `${mod.color}0e`;
                                e.currentTarget.style.borderColor = `${mod.color}55`;
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = `0 16px 40px ${mod.color}18`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                e.currentTarget.style.borderColor = `${mod.color}28`;
                                e.currentTarget.style.transform = "";
                                e.currentTarget.style.boxShadow = "";
                            }}
                        >
                            <div style={{ fontSize: "2.2rem", marginBottom: "14px" }}>{mod.icon}</div>
                            <h3 style={{
                                color: "#fff", margin: "0 0 8px",
                                fontSize: "1rem", fontFamily: "var(--font-display)",
                            }}>
                                {mod.label}
                            </h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "0 0 14px", lineHeight: 1.5 }}>
                                {mod.desc}
                            </p>
                            <div style={{
                                color: mod.color, fontSize: "0.75rem", fontWeight: "600",
                                display: "flex", alignItems: "center", gap: "4px",
                            }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: mod.color, display: "inline-block" }} />
                                {mod.stat}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityHome;
