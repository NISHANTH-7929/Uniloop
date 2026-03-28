import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQAQuestions } from "../../api/communityApi";
import QAQuestionCard from "../../components/community/QAQuestionCard";

const QAFeed = () => {
    const [posts, setPosts]     = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getQAQuestions({}).then(r => setPosts(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>💬 Academic Q&A</h1>
                    <button id="qa-new-btn" onClick={() => navigate("/community/qa/new")}
                        style={{ padding: "10px 22px", background: "linear-gradient(135deg, #00d4ff, #7000ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                        + Ask a Question
                    </button>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                : <div style={{ display: "grid", gap: "14px" }}>
                    {posts.map(p => <QAQuestionCard key={p._id} post={p} onClick={() => navigate(`/community/qa/${p._id}`)} />)}
                  </div>
                }
            </div>
        </div>
    );
};
export default QAFeed;
