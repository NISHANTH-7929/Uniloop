import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLostFoundItems } from "../../api/communityApi";
import LostFoundCard from "../../components/community/LostFoundCard";

const LostFoundFeed = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: "", category: "" });
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.type)     params.type     = filters.type;
            if (filters.category) params.category = filters.category;
            const res = await getLostFoundItems(params);
            setItems(res.data.data);
        } catch (_) {}
        setLoading(false);
    };

    useEffect(() => { load(); }, [filters]);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0, fontSize: "1.8rem" }}>🔍 Lost & Found</h1>
                    <button
                        id="lf-new-btn"
                        onClick={() => navigate("/community/lostfound/new")}
                        style={{
                            padding: "10px 22px", background: "linear-gradient(135deg, #7000ff, #00d4ff)",
                            border: "none", borderRadius: "10px", color: "#fff",
                            fontWeight: "bold", cursor: "pointer",
                        }}
                    >
                        + Post Item
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                    {[{ label: "All", val: "" }, { label: "Lost", val: "lost" }, { label: "Found", val: "found" }].map(t => (
                        <button key={t.val} onClick={() => setFilters(f => ({ ...f, type: t.val }))}
                            style={{
                                padding: "6px 16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)",
                                background: filters.type === t.val ? "rgba(112,0,255,0.3)" : "rgba(255,255,255,0.05)",
                                color: "#fff", cursor: "pointer", fontSize: "0.85rem",
                            }}
                        >{t.label}</button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "3rem" }}>📦</div>
                        <p>No items posted yet. Be the first!</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {items.map(item => (
                            <LostFoundCard
                                key={item._id}
                                item={item}
                                onClick={() => navigate(`/community/lostfound/${item._id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LostFoundFeed;
