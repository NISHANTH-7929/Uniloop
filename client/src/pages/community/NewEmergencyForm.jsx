import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmergency } from "../../api/communityApi";
import { toast } from "react-toastify";

const TYPES = ["blood","medical","safety","fire","infrastructure"];
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

const NewEmergencyForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ type: "medical", bloodType: "", urgency: "normal", title: "", description: "", location: "", broadcastScope: "block" });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
    const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await createEmergency(form); toast.success("Emergency posted!"); navigate("/community/emergency"); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>🚨 Post Emergency</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
                    <div><label style={labelStyle}>Type *</label>
                        <select required style={inputStyle} value={form.type} onChange={set("type")}>
                            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>
                    {form.type === "blood" && (
                        <div><label style={labelStyle}>Blood Type Needed *</label>
                            <select required style={inputStyle} value={form.bloodType} onChange={set("bloodType")}>
                                <option value="">Select blood type</option>
                                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label style={labelStyle}>Urgency</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {["normal","critical"].map(u => (
                                <button key={u} type="button" onClick={() => setForm(f => ({ ...f, urgency: u }))}
                                    style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold",
                                        background: form.urgency === u ? (u === "critical" ? "rgba(255,68,68,0.3)" : "rgba(0,255,136,0.15)") : "rgba(255,255,255,0.06)",
                                        color: form.urgency === u ? "#fff" : "var(--text-muted)",
                                    }}
                                >{u.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>
                    <div><label style={labelStyle}>Title *</label><input required style={inputStyle} value={form.title} onChange={set("title")} placeholder="Short summary" /></div>
                    <div><label style={labelStyle}>Description *</label><textarea required rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Details..." /></div>
                    <div><label style={labelStyle}>Location *</label><input required style={inputStyle} value={form.location} onChange={set("location")} placeholder="Building / Block" /></div>
                    <div><label style={labelStyle}>Broadcast Scope</label>
                        <select style={inputStyle} value={form.broadcastScope} onChange={set("broadcastScope")}>
                            <option value="block">My Hostel Block</option>
                            <option value="campus">Entire Campus</option>
                        </select>
                    </div>
                    <button id="emergency-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #ff4444, #ff7f50)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Emergency"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewEmergencyForm;
