import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSkill } from "../../api/communityApi";
import { toast } from "react-toastify";

const CATS = ["academic","music","art","sports","tech","language","other"];
const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

const NewSkillForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ offerSkill: "", wantSkill: "", offerDetail: "", wantDetail: "", duration: "", chargeIfAny: 0, category: "other" });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await createSkill({ ...form, chargeIfAny: Number(form.chargeIfAny) }); toast.success("Skill posted!"); navigate("/community/skills"); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>🤝 Post Skill Exchange</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div><label style={labelStyle}>Skill I Offer *</label><input required style={inputStyle} value={form.offerSkill} onChange={set("offerSkill")} placeholder="e.g. Guitar lessons" /></div>
                    <div><label style={labelStyle}>Offer Details</label><textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.offerDetail} onChange={set("offerDetail")} /></div>
                    <div><label style={labelStyle}>Skill I Want *</label><input required style={inputStyle} value={form.wantSkill} onChange={set("wantSkill")} placeholder="e.g. Circuit diagram help" /></div>
                    <div><label style={labelStyle}>Want Details</label><textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.wantDetail} onChange={set("wantDetail")} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div><label style={labelStyle}>Charge if any (₹)</label><input type="number" min="0" style={inputStyle} value={form.chargeIfAny} onChange={set("chargeIfAny")} /></div>
                        <div><label style={labelStyle}>Duration</label><input style={inputStyle} value={form.duration} onChange={set("duration")} placeholder="e.g. 2 hours" /></div>
                    </div>
                    <div><label style={labelStyle}>Category</label>
                        <select style={inputStyle} value={form.category} onChange={set("category")}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <button id="skills-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #ffd700, #ff7f50)", border: "none", borderRadius: "12px", color: "#000", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Skill Exchange"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default NewSkillForm;
