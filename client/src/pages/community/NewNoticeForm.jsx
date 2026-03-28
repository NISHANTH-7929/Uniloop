import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotice } from "../../api/communityApi";
import { toast } from "react-toastify";

const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

const NewNoticeForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", body: "", targetDept: "all", targetBlock: "all", expiresInDays: 7 });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const expiresAt = new Date(Date.now() + Number(form.expiresInDays) * 24 * 60 * 60 * 1000);
        try { await createNotice({ ...form, expiresAt }); toast.success("Notice posted!"); navigate("/community/notices"); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>📌 Post Notice</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div><label style={labelStyle}>Title *</label><input required style={inputStyle} value={form.title} onChange={set("title")} placeholder="Brief notice title" /></div>
                    <div><label style={labelStyle}>Body *</label><textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.body} onChange={set("body")} placeholder="Full notice details..." /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div><label style={labelStyle}>Target Department</label>
                            <select style={inputStyle} value={form.targetDept} onChange={set("targetDept")}>
                                <option value="all">All</option>
                                {["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS"].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div><label style={labelStyle}>Target Block</label>
                            <select style={inputStyle} value={form.targetBlock} onChange={set("targetBlock")}>
                                <option value="all">All</option>
                                {["A","B","C","D","E"].map(b => <option key={b} value={b}>Block {b}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label style={labelStyle}>Expires In (days)</label>
                        <select style={inputStyle} value={form.expiresInDays} onChange={set("expiresInDays")}>
                            {[1,3,7,14,30].map(d => <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""}</option>)}
                        </select>
                    </div>
                    <button id="notice-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #00d4ff, #7000ff)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Notice"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default NewNoticeForm;
