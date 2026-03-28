import React, { useEffect, useState } from "react";
import { logMood, getMoodTrend, getCounselorSlots, bookCounselorSlot } from "../../api/communityApi";
import MoodCheckIn from "../../components/community/MoodCheckIn";
import MoodTrendChart from "../../components/community/MoodTrendChart";
import CounselorSlotPicker from "../../components/community/CounselorSlotPicker";
import { toast } from "react-toastify";

const RESOURCES = [
    { label: "iCall TISS", url: "https://icallhelpline.org/", icon: "📞" },
    { label: "Vandrevala Foundation Helpline", url: "https://vandrevalafoundation.com", icon: "🩺" },
    { label: "NIMHANS Helpline", url: "https://nimhans.ac.in", icon: "🏥" },
    { label: "iCall (1800-599-0019)", url: "tel:18005990019", icon: "📱" },
];

const MentalHealthDashboard = () => {
    const [trend, setTrend]   = useState([]);
    const [slots, setSlots]   = useState([]);
    const [tab, setTab]       = useState("log"); // "log" | "trend" | "book"

    useEffect(() => {
        getMoodTrend().then(r => setTrend(r.data.data)).catch(() => {});
        getCounselorSlots().then(r => setSlots(r.data.data)).catch(() => {});
    }, []);

    const handleLogMood = async (data) => {
        try { await logMood(data); getMoodTrend().then(r => setTrend(r.data.data)).catch(() => {}); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handleBook = async (slot) => {
        try { await bookCounselorSlot({ slotDate: slot.date, slotTime: slot.time }); toast.success("Booking requested!"); }
        catch (err) { toast.error(err.response?.data?.message || "This slot is already booked. Please pick another."); }
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "6px" }}>💚 Mental Health</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "0.9rem" }}>This is a private space. Your data is only visible to you.</p>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
                    {[{id:"log",label:"Log Mood"},{id:"trend",label:"My Trend"},{id:"book",label:"Book Counselor"}].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ padding: "8px 18px", borderRadius: "20px", border: "none", cursor: "pointer",
                                background: tab === t.id ? "linear-gradient(135deg, #00ff88, #00d4ff)" : "rgba(255,255,255,0.07)",
                                color: tab === t.id ? "#000" : "var(--text-muted)", fontWeight: tab === t.id ? "bold" : "normal",
                            }}>{t.label}</button>
                    ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "30px" }}>
                    {tab === "log" && (
                        <>
                            <h2 style={{ color: "#fff", margin: "0 0 20px" }}>How are you feeling today?</h2>
                            <MoodCheckIn onSubmit={handleLogMood} />
                        </>
                    )}
                    {tab === "trend" && (
                        <>
                            <h2 style={{ color: "#fff", margin: "0 0 20px" }}>Your Mood Trend (Last 30 entries)</h2>
                            <MoodTrendChart logs={trend} />
                        </>
                    )}
                    {tab === "book" && (
                        <>
                            <h2 style={{ color: "#fff", margin: "0 0 6px" }}>Book a Counselor Session</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.87rem", marginBottom: "20px" }}>
                                Sessions are confidential. No details are shared with faculty.
                            </p>
                            <CounselorSlotPicker slots={slots} onBook={handleBook} />
                        </>
                    )}
                </div>

                {/* Resources */}
                <div style={{ marginTop: "28px" }}>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Mental Health Resources</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                        {RESOURCES.map(r => (
                            <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer"
                                style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "12px",
                                    padding: "12px 16px", color: "#00ff88", textDecoration: "none", fontSize: "0.87rem",
                                    display: "flex", alignItems: "center", gap: "8px",
                                }}>
                                {r.icon} {r.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MentalHealthDashboard;
