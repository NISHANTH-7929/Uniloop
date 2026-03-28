import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTutoringSessions } from "../../api/communityApi";
import TutoringCard from "../../components/community/TutoringCard";

const TutoringFeed = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState("open");
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getTutoringSessions({ status: filter }).then(r => setSessions(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, [filter]);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>🎓 Peer Tutoring</h1>
                    <button id="tutoring-new-btn" onClick={() => navigate("/community/tutoring/new")}
                        style={{ padding: "10px 22px", background: "linear-gradient(135deg, #a855f7, #7000ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                        + Post Session
                    </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {loading ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                    : sessions.map(s => <TutoringCard key={s._id} session={s} onClick={() => navigate(`/community/tutoring/${s._id}`)} />)}
                </div>
            </div>
        </div>
    );
};
export default TutoringFeed;
