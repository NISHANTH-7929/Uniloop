import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmergencies } from "../../api/communityApi";
import EmergencyCard from "../../components/community/EmergencyCard";

const EmergencyFeed = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getEmergencies({ status: "active" }).then(r => setItems(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>🚨 Emergency Network</h1>
                    <button id="emergency-new-btn" onClick={() => navigate("/community/emergency/new")}
                        style={{ padding: "10px 22px", background: "linear-gradient(135deg, #ff4444, #ff7f50)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                        + Post Emergency
                    </button>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                : items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "3rem" }}>✅</div><p>No active emergencies. Campus is safe!</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {items.map(item => <EmergencyCard key={item._id} item={item} onClick={() => navigate(`/community/emergency/${item._id}`)} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyFeed;
