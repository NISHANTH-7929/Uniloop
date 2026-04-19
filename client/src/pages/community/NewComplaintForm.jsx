import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createComplaint } from "../../api/communityApi";
import { toast } from "react-toastify";

const CATS = ["canteen","hostel","lab","infrastructure","academic","safety","cleanliness","other"];
const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

const NewComplaintForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ category: "other", title: "", description: "" });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("category", form.category);
            formData.append("title", form.title);
            formData.append("description", form.description);
            if (imageFile) formData.append("image", imageFile);

            await createComplaint(formData);
            toast.success("Complaint submitted anonymously!");
            navigate("/community/complaints");
        } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "10px" }}>📋 File Anonymous Complaint</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "0.9rem" }}>Your identity is never revealed. Only campus admins can track complaints internally.</p>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div><label style={labelStyle}>Category *</label>
                        <select required style={inputStyle} value={form.category} onChange={set("category")}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div><label style={labelStyle}>Title *</label><input required style={inputStyle} value={form.title} onChange={set("title")} placeholder="Brief summary of the issue" /></div>
                    <div><label style={labelStyle}>Description *</label><textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Describe the issue in detail..." /></div>
                    <div>
                        <label style={labelStyle}>Photo (optional, max 5MB)</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}
                            style={{ ...inputStyle, padding: "8px" }} />
                        {imagePreview && (
                            <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                                <img src={imagePreview} alt="preview" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8 }} />
                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                            </div>
                        )}
                    </div>
                    <button id="complaints-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #ff7f50, #ff4444)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Submitting…" : "Submit Anonymously"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default NewComplaintForm;
