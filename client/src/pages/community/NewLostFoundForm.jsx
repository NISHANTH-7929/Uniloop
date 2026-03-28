import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLostFoundItem } from "../../api/communityApi";
import { toast } from "react-toastify";

const CATEGORIES = ["wallet","phone","keys","id-card","bag","clothing","stationery","electronics","jewellery","other"];

const NewLostFoundForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        type: "lost", title: "", description: "", category: "other",
        locationTag: "", isAnonymous: false, claimQuestion: "", claimAnswer: "",
    });
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createLostFoundItem(form);
            toast.success("Item posted!");
            navigate("/community/lostfound");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post");
        }
        setLoading(false);
    };

    const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
    const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>📦 Post Lost or Found Item</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
                    {/* Type */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        {["lost", "found"].map(t => (
                            <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold",
                                    background: form.type === t ? (t === "lost" ? "rgba(255,100,100,0.3)" : "rgba(0,255,136,0.3)") : "rgba(255,255,255,0.06)",
                                    color: form.type === t ? "#fff" : "var(--text-muted)",
                                }}
                            >{t.toUpperCase()}</button>
                        ))}
                    </div>

                    <div><label style={labelStyle}>Title *</label><input required style={inputStyle} value={form.title} onChange={set("title")} placeholder="e.g. Blue wallet" /></div>
                    <div><label style={labelStyle}>Description *</label><textarea required rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Describe the item..." /></div>
                    <div><label style={labelStyle}>Category *</label>
                        <select required style={inputStyle} value={form.category} onChange={set("category")}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div><label style={labelStyle}>Location / Campus Zone *</label><input required style={inputStyle} value={form.locationTag} onChange={set("locationTag")} placeholder="e.g. Library Block A" /></div>

                    {form.type === "found" && (
                        <>
                            <div><label style={labelStyle}>Claim Verification Question (optional)</label><input style={inputStyle} value={form.claimQuestion} onChange={set("claimQuestion")} placeholder="e.g. What colour is the wallet?" /></div>
                            {form.claimQuestion && <div><label style={labelStyle}>Answer (kept secret)</label><input style={inputStyle} value={form.claimAnswer} onChange={set("claimAnswer")} placeholder="Correct answer" /></div>}
                        </>
                    )}

                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-secondary)" }}>
                        <input type="checkbox" checked={form.isAnonymous} onChange={set("isAnonymous")} style={{ width: "16px", height: "16px" }} />
                        Post anonymously
                    </label>

                    <button id="lf-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #7000ff, #00d4ff)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Item"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewLostFoundForm;
