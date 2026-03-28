import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getComplaints } from "../../api/communityApi";
import ComplaintCard from "../../components/community/ComplaintCard";

const ComplaintFeed = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getComplaints({}).then(r => setItems(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>📋 Anonymous Complaint Box</h1>
                    <button id="complaints-new-btn" onClick={() => navigate("/community/complaints/new")}
                        style={{ padding: "10px 22px", background: "linear-gradient(135deg, #ff7f50, #ff4444)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                        + File Complaint
                    </button>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {items.map(c => <ComplaintCard key={c._id} complaint={c} onClick={() => navigate(`/community/complaints/${c._id}`)} />)}
                  </div>
                }
            </div>
        </div>
    );
};
export default ComplaintFeed;
