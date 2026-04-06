import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotices } from "../../api/communityApi";
import NoticeCard from "../../components/community/NoticeCard";
import { useAuth } from "../../context/AuthContext";

const NoticesFeed = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getNotices({}).then(r => setNotices(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>📌 Campus Notices</h1>
                    {user?.role === "admin" && (
                        <button id="notices-new-btn" onClick={() => navigate("/community/notices/new")}
                            style={{ padding: "10px 22px", background: "linear-gradient(135deg, #00d4ff, #7000ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                            + Post Notice
                        </button>
                    )}
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {notices.map(n => <NoticeCard key={n._id} notice={n} onClick={() => navigate(`/community/notices/${n._id}`)} />)}
                  </div>
                }
            </div>
        </div>
    );
};
export default NoticesFeed;
