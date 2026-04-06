import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLostFoundItems } from "../../api/communityApi";
import LostFoundCard from "../../components/community/LostFoundCard";

const TYPES = [
    { label: "All", val: "" },
    { label: "🔍 Lost", val: "lost" },
    { label: "📦 Found", val: "found" },
];

const LostFoundFeed = () => {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const navigate = useNavigate();

    const load = async (type) => {
        setLoading(true);
        try {
            const params = {};
            if (type) params.type = type;
            const res = await getLostFoundItems(params);
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { load(typeFilter); }, [typeFilter]);

    return (
        <div className="community-page">
            <div className="community-container">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "14px" }}>
                    <div>
                        <button onClick={() => navigate("/community")}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "8px", padding: 0 }}>
                            ← Back to Community
                        </button>
                        <h1 style={{ color: "#fff", margin: 0, fontSize: "clamp(1.5rem, 4vw, 2rem)", fontFamily: "var(--font-display)" }}>
                            🔍 Lost &amp; Found
                        </h1>
                        <p style={{ color: "var(--text-muted)", margin: "6px 0 0", fontSize: "0.9rem" }}>
                            Post or find lost items on campus
                        </p>
                    </div>
                    <button
                        id="lf-new-btn"
                        onClick={() => navigate("/community/lostfound/new")}
                        style={{
                            padding: "11px 24px",
                            background: "linear-gradient(135deg, #7000ff, #00d4ff)",
                            border: "none", borderRadius: "12px", color: "#fff",
                            fontWeight: "700", fontSize: "0.95rem", cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(112,0,255,0.35)",
                            transition: "transform 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = ""}
                    >
                        + Post Item
                    </button>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                    {TYPES.map(t => (
                        <button
                            key={t.val}
                            onClick={() => setTypeFilter(t.val)}
                            style={{
                                padding: "8px 18px", borderRadius: "20px", border: "none",
                                background: typeFilter === t.val ? "linear-gradient(135deg,#7000ff,#00d4ff)" : "rgba(255,255,255,0.06)",
                                color: typeFilter === t.val ? "#fff" : "var(--text-secondary)",
                                cursor: "pointer", fontWeight: typeFilter === t.val ? "700" : "400",
                                fontSize: "0.88rem", transition: "all 0.2s",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px", animation: "pulse 1.5s infinite" }}>⏳</div>
                        Loading items…
                    </div>
                ) : items.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "80px 0",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                    }}>
                        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ color: "#fff", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "6px" }}>No items yet</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
                            Be the first to post a lost or found item!
                        </p>
                        <button
                            onClick={() => navigate("/community/lostfound/new")}
                            style={{
                                padding: "10px 24px", background: "linear-gradient(135deg,#7000ff,#00d4ff)",
                                border: "none", borderRadius: "10px", color: "#fff",
                                fontWeight: "bold", cursor: "pointer",
                            }}
                        >
                            Post First Item
                        </button>
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
