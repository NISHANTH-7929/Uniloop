import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSkills } from "../../api/communityApi";
import SkillExchangeCard from "../../components/community/SkillExchangeCard";

const SkillExchangeFeed = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getSkills({ status: "open" }).then(r => setSkills(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ color: "#fff", margin: 0 }}>🤝 Skill Exchange</h1>
                    <button id="skills-new-btn" onClick={() => navigate("/community/skills/new")}
                        style={{ padding: "10px 22px", background: "linear-gradient(135deg, #ffd700, #ff7f50)", border: "none", borderRadius: "10px", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                        + Post My Skills
                    </button>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading…</div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {skills.map(s => <SkillExchangeCard key={s._id} skill={s} onClick={() => navigate(`/community/skills/${s._id}`)} />)}
                  </div>
                }
            </div>
        </div>
    );
};
export default SkillExchangeFeed;
