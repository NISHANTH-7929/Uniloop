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
        <div className="page-wrapper container">
            <SOSBroadcastBanner />
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Hero section */}
                <div style={{ textAlign: "center", marginBottom: "80px" }}>
                    <div className="badge" style={{ marginBottom: "24px" }}>
                        <span style={{ width: "8px", height: "8px", background: "var(--primary)", borderRadius: "50%" }}></span>
                        Campus Network
                    </div>
                    <h1 className="text-gradient">Community Hub</h1>
                    <p style={{ fontSize: "1.15rem", maxWidth: "640px", margin: "0 auto" }}>
                        Collaborate, help, and grow together within our specialized student support modules.
                    </p>
                </div>

                {/* Module grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "32px",
                }}>
                    {MODULES.map(mod => (
                        <button
                            key={mod.id}
                            id={`community-card-${mod.id}`}
                            onClick={() => navigate(mod.path)}
                            className="card"
                            style={{
                                padding: "40px 32px",
                                cursor: "pointer", 
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}
                        >
                            <div style={{ fontSize: "3rem", marginBottom: "24px" }}>{mod.icon}</div>
                            <h2 style={{ marginBottom: "12px", fontSize: "1.5rem" }}>
                                {mod.label}
                            </h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "0 0 32px", lineHeight: 1.6, flex: 1 }}>
                                {mod.desc}
                            </p>
                            <div style={{
                                color: "var(--primary)", fontSize: "0.85rem", fontWeight: "700",
                                display: "flex", alignItems: "center", gap: "10px",
                                textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
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
