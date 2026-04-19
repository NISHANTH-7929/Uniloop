import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQAQuestion } from "../../api/communityApi";
import subjectCodes from "../../data/subjectCodes";
import { toast } from "react-toastify";

const inputStyle = { width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" };
const labelStyle = { color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" };

const NewQuestionForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: "", body: "", subjectCode: "", subjectName: "", department: "CSE", semester: 1, tags: "" });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubjectCode = (e) => {
        const code = e.target.value;
        const s = subjectCodes.find(x => x.code === code);
        if (s) setForm(f => ({ ...f, subjectCode: code, subjectName: s.name, semester: s.semester, department: s.department }));
        else setForm(f => ({ ...f, subjectCode: code }));
    };

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
            const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
            
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("body", form.body);
            formData.append("subjectCode", form.subjectCode);
            formData.append("subjectName", form.subjectName);
            formData.append("department", form.department);
            formData.append("semester", Number(form.semester));
            tags.forEach(tag => formData.append("tags[]", tag));
            if (imageFile) formData.append("image", imageFile);

            await createQAQuestion(formData);
            toast.success("Question posted!");
            navigate("/community/qa");
        } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
                <h1 style={{ color: "#fff", marginBottom: "30px" }}>💬 Ask a Question</h1>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
                    <div><label style={labelStyle}>Subject Code</label>
                        <select style={inputStyle} value={form.subjectCode} onChange={handleSubjectCode}>
                            <option value="">Select from list</option>
                            {subjectCodes.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                        </select>
                    </div>
                    <div><label style={labelStyle}>Subject Name *</label><input required style={inputStyle} value={form.subjectName} onChange={set("subjectName")} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div><label style={labelStyle}>Department</label><input style={inputStyle} value={form.department} onChange={set("department")} /></div>
                        <div><label style={labelStyle}>Semester</label>
                            <select style={inputStyle} value={form.semester} onChange={set("semester")}>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </div>
                    </div>
                    <div><label style={labelStyle}>Question Title *</label><input required style={inputStyle} value={form.title} onChange={set("title")} placeholder="Clear, concise summary" /></div>
                    <div><label style={labelStyle}>Details *</label><textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.body} onChange={set("body")} placeholder="Explain your question in detail..." /></div>
                    <div><label style={labelStyle}>Tags (comma-separated)</label><input style={inputStyle} value={form.tags} onChange={set("tags")} placeholder="e.g. arrays, sorting, complexity" /></div>
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
                    <button id="qa-submit-btn" type="submit" disabled={loading} style={{ padding: "14px", background: "linear-gradient(135deg, #00d4ff, #7000ff)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Posting…" : "Post Question"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default NewQuestionForm;
