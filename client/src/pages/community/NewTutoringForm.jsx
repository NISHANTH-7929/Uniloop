import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTutoringSession } from "../../api/communityApi";
import subjectCodes from "../../data/subjectCodes";
import { toast } from "react-toastify";

const NewTutoringForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ sessionType: "offer", subject: "", subjectCode: "", department: "CSE", semester: 1, description: "", chargePerHour: 0, mode: "inperson" });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
    const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

    const handleSubjectCode = (e) => {
        const code = e.target.value;
        const subject = subjectCodes.find(s => s.code === code);
        if (subject) setForm(f => ({ ...f, subjectCode: code, subject: subject.name, semester: subject.semester, department: subject.department }));
        else setForm(f => ({ ...f, subjectCode: code }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await createTutoringSession({ ...form, chargePerHour: Number(form.chargePerHour) }); toast.success("Session posted!"); navigate("/community/tutoring"); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>🎓 Post Tutoring Session</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {["offer","request"].map(t => (
                            <button key={t} type="button" onClick={() => setForm(f => ({ ...f, sessionType: t }))}
                                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold",
                                    background: form.sessionType === t ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)", color: form.sessionType === t ? "#fff" : "var(--text-muted)" }}>
                                {t === "offer" ? "I Can Teach" : "I Need Help"}
                            </button>
                        ))}
                    </div>
                    <div><label style={labelStyle}>Subject Code</label>
                        <select style={inputStyle} value={form.subjectCode} onChange={handleSubjectCode}>
                            <option value="">Select from list</option>
                            {subjectCodes.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                        </select>
                    </div>
                    <div><label style={labelStyle}>Subject Name *</label><input required style={inputStyle} value={form.subject} onChange={set("subject")} placeholder="e.g. Data Structures" /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div><label style={labelStyle}>Department</label><input style={inputStyle} value={form.department} onChange={set("department")} /></div>
                        <div><label style={labelStyle}>Semester</label>
                            <select style={inputStyle} value={form.semester} onChange={set("semester")}>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </div>
                    </div>
                    <div><label style={labelStyle}>Description</label><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="What will you cover / what do you need help with?" /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div><label style={labelStyle}>Charge/hr (₹, 0=Free)</label><input type="number" min="0" style={inputStyle} value={form.chargePerHour} onChange={set("chargePerHour")} /></div>
                        <div><label style={labelStyle}>Mode</label>
                            <select style={inputStyle} value={form.mode} onChange={set("mode")}><option value="inperson">In Person</option><option value="online">Online</option></select>
                        </div>
                    </div>
                    <button id="tutoring-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #a855f7, #7000ff)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Session"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default NewTutoringForm;
