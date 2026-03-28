import React from "react";
import { useNavigate } from "react-router-dom";
import useCommunitySocket from "../../hooks/useCommunitySocket";
import SOSBroadcastBanner from "../../components/community/SOSBroadcastBanner";

const MODULES = [
    { id: "lostfound",   icon: "🔍", label: "Lost & Found",        desc: "Find or return lost items", path: "/community/lostfound",   color: "#00ff88" },
    { id: "emergency",   icon: "🚨", label: "Emergency Network",    desc: "Blood requests & SOS alerts", path: "/community/emergency",  color: "#ff4444" },
    { id: "tutoring",    icon: "🎓", label: "Peer Tutoring",        desc: "Study buddy & tutoring sessions", path: "/community/tutoring", color: "#a855f7" },
    { id: "skills",      icon: "🤝", label: "Skill Exchange",       desc: "Barter skills with peers", path: "/community/skills",    color: "#ffd700" },
    { id: "qa",          icon: "💬", label: "Academic Q&A",         desc: "Ask & answer course questions", path: "/community/qa",      color: "#00d4ff" },
    { id: "complaints",  icon: "📋", label: "Complaint Box",        desc: "Anonymous campus complaints", path: "/community/complaints", color: "#ff7f50" },
    { id: "mentalhealth",icon: "💚", label: "Mental Health",        desc: "Private mood tracking & counseling", path: "/community/mentalhealth", color: "#00ff88" },
    { id: "notices",     icon: "📌", label: "Campus Notices",       desc: "Announcements & updates", path: "/community/notices",  color: "#00d4ff" },
];

const CommunityHome = () => {
    const navigate = useNavigate();
    useCommunitySocket();

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <SOSBroadcastBanner />
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "50px" }}>
                    <h1 style={{
                        fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: "800",
                        background: "linear-gradient(135deg, #7000ff, #00d4ff)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        margin: "0 0 12px",
                    }}>
                        Community Support
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                        8 ways to connect, help, and grow together on campus
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                    {MODULES.map(mod => (
                        <button
                            key={mod.id}
                            id={`community-card-${mod.id}`}
                            onClick={() => navigate(mod.path)}
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: `1px solid ${mod.color}33`,
                                borderRadius: "18px", padding: "28px 20px",
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.25s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = `${mod.color}0f`;
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = `0 12px 30px ${mod.color}22`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                e.currentTarget.style.transform = "";
                                e.currentTarget.style.boxShadow = "";
                            }}
                        >
                            <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>{mod.icon}</div>
                            <h3 style={{ color: "#fff", margin: "0 0 6px", fontSize: "1rem" }}>{mod.label}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
                                {mod.desc}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityHome;
