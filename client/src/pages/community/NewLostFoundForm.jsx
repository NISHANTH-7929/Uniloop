import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLostFoundItem } from "../../api/communityApi";
import { toast } from "react-toastify";

const CATEGORIES = [
    { val: "wallet",      label: "👛 Wallet" },
    { val: "phone",       label: "📱 Phone" },
    { val: "keys",        label: "🔑 Keys" },
    { val: "id-card",     label: "🪪 ID Card" },
    { val: "bag",         label: "🎒 Bag" },
    { val: "clothing",    label: "👕 Clothing" },
    { val: "stationery",  label: "✏️ Stationery" },
    { val: "electronics", label: "💻 Electronics" },
    { val: "jewellery",   label: "💍 Jewellery" },
    { val: "other",       label: "📦 Other" },
];

const NewLostFoundForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        type: "lost",
        title: "",
        description: "",
        category: "other",
        locationTag: "",
        isAnonymous: false,
        claimQuestion: "",
        claimAnswer: "",
    });
    const [imageData, setImageData] = useState(""); // base64 data URL
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k) => (e) =>
        setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageData(reader.result); // base64 data URL
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.title.trim()) { setError("Title is required"); return; }
        if (!form.description.trim()) { setError("Description is required"); return; }
        if (!form.locationTag.trim()) { setError("Location is required"); return; }
        if (!imageData) { setError("A photo is required for all posts."); return; }
        if (form.type === "found" && (!form.claimQuestion.trim() || !form.claimAnswer.trim())) {
            setError("A claim verification question and answer are mandatory for found items."); return;
        }

        setLoading(true);
        try {
            // Send only fields that matter for the request
            const payload = {
                type:       form.type,
                title:      form.title.trim(),
                description:form.description.trim(),
                category:   form.category,
                locationTag:form.locationTag.trim(),
                imageUrl:   imageData,
                isAnonymous:form.isAnonymous,
            };
            if (form.type === "found" && form.claimQuestion.trim()) {
                payload.claimQuestion = form.claimQuestion.trim();
                payload.claimAnswer = form.claimAnswer.trim();
            }

            await createLostFoundItem(payload);
            toast.success("✅ Item posted successfully!");
            navigate("/community/lostfound");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to post item. Please try again.";
            setError(msg);
            toast.error(msg);
        }
        setLoading(false);
    };

    return (
        <div className="community-page">
            <div className="community-container" style={{ maxWidth: "640px" }}>
                {/* Back button */}
                <button
                    onClick={() => navigate("/community/lostfound")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "16px", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
                >
                    ← Back to Lost &amp; Found
                </button>

                <h1 style={{ color: "#fff", marginBottom: "6px", fontSize: "1.8rem", fontFamily: "var(--font-display)" }}>
                    📦 Post Item
                </h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "0.9rem" }}>
                    Report a lost item or a found item to help the community
                </p>

                {/* Error banner */}
                {error && (
                    <div style={{
                        background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.3)",
                        borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
                        color: "#ff6464", fontSize: "0.9rem",
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px", padding: "28px",
                }}>
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "22px" }}>

                        {/* Type toggle */}
                        <div>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "10px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                I am posting a…
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                {[
                                    { val: "lost",  label: "😟 Lost Item",  col: "#ff6464" },
                                    { val: "found", label: "😊 Found Item", col: "#00ff88" },
                                ].map(t => (
                                    <button
                                        key={t.val} type="button"
                                        onClick={() => setForm(f => ({ ...f, type: t.val }))}
                                        style={{
                                            padding: "14px", borderRadius: "12px", border: `2px solid ${form.type === t.val ? t.col : "rgba(255,255,255,0.08)"}`,
                                            cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                                            background: form.type === t.val ? `${t.col}18` : "rgba(255,255,255,0.03)",
                                            color: form.type === t.val ? t.col : "var(--text-muted)",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "8px", display: "block" }}>
                                Title <span style={{ color: "#ff6464" }}>*</span>
                            </label>
                            <input
                                required
                                className="community-input"
                                value={form.title}
                                onChange={set("title")}
                                placeholder={`e.g. ${form.type === "lost" ? "Blue leather wallet" : "Found: Black phone near cafeteria"}`}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "8px", display: "block" }}>
                                Description <span style={{ color: "#ff6464" }}>*</span>
                            </label>
                            <textarea
                                required
                                className="community-input"
                                rows={3}
                                value={form.description}
                                onChange={set("description")}
                                placeholder="Describe the item in detail — colour, brand, distinctive marks…"
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        {/* Category + Location */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                                <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "8px", display: "block" }}>
                                    Category <span style={{ color: "#ff6464" }}>*</span>
                                </label>
                                <select required className="community-input" value={form.category} onChange={set("category")}>
                                    {CATEGORIES.map(c => (
                                        <option key={c.val} value={c.val}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "8px", display: "block" }}>
                                    Last Seen Location <span style={{ color: "#ff6464" }}>*</span>
                                </label>
                                <input
                                    required
                                    className="community-input"
                                    value={form.locationTag}
                                    onChange={set("locationTag")}
                                    placeholder="e.g. Library Block A"
                                />
                            </div>
                        </div>

                        {/* Image Upload — Mandatory */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                <label style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Photo</label>
                                <span style={{
                                    padding: "2px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "700",
                                    background: imageData ? "rgba(0,255,136,0.15)" : "rgba(255,68,68,0.15)",
                                    color: imageData ? "#00ff88" : "#ff6464",
                                    letterSpacing: "0.5px", textTransform: "uppercase",
                                }}>
                                    {imageData ? "✓ Photo Added" : "Required"}
                                </span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: "auto" }}>max 5 MB</span>
                            </div>

                            <label
                                htmlFor="lf-image-input"
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    gap: "10px", padding: "28px 16px",
                                    border: `2px dashed ${imageData ? "rgba(0,212,255,0.5)" : "rgba(255,68,68,0.4)"}`,
                                    borderRadius: "14px", cursor: "pointer",
                                    background: imageData ? "rgba(0,212,255,0.05)" : "rgba(255,68,68,0.04)",
                                    transition: "all 0.25s",
                                    minHeight: imageData ? "auto" : "130px",
                                }}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: "100%", maxHeight: "240px", objectFit: "cover", borderRadius: "10px" }}
                                    />
                                ) : (
                                    <>
                                        <span style={{ fontSize: "2.4rem" }}>📸</span>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", marginBottom: "4px" }}>
                                                Tap to upload a photo
                                            </div>
                                            <div style={{ color: "#ff6464", fontSize: "0.8rem" }}>
                                                A photo is required — no post without one
                                            </div>
                                        </div>
                                    </>
                                )}
                                {imagePreview && (
                                    <span style={{ fontSize: "0.78rem", color: "#00d4ff" }}>🔄 Click to change photo</span>
                                )}
                            </label>
                            <input
                                id="lf-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                            />
                        </div>

                        {/* Claim verification (Found only) */}
                        {form.type === "found" && (
                            <div style={{
                                background: "rgba(0,212,255,0.06)",
                                border: "1px solid rgba(0,212,255,0.15)",
                                borderRadius: "12px", padding: "18px",
                            }}>
                                <p style={{ color: "#00d4ff", fontSize: "0.82rem", fontWeight: "bold", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    🔒 Claim Verification <span style={{ color: "#ff6464" }}>*</span>
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "12px" }}>
                                    Set a question only the owner could answer, to verify claims.
                                </p>
                                <div style={{ display: "grid", gap: "12px" }}>
                                    <input
                                        required
                                        className="community-input"
                                        value={form.claimQuestion}
                                        onChange={set("claimQuestion")}
                                        placeholder="Question e.g. What's unique about the item?"
                                    />
                                    {form.claimQuestion && (
                                        <input
                                            required
                                            className="community-input"
                                            value={form.claimAnswer}
                                            onChange={set("claimAnswer")}
                                            placeholder="Correct answer (kept secret)"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Anonymous toggle */}
                        <label style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${form.isAnonymous ? "rgba(112,0,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: "12px", padding: "14px 16px",
                            transition: "border-color 0.2s",
                        }}>
                            <div
                                onClick={() => setForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}
                                style={{
                                    width: "44px", height: "24px", borderRadius: "12px",
                                    background: form.isAnonymous ? "var(--accent-purple)" : "rgba(255,255,255,0.1)",
                                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    position: "absolute", top: "3px",
                                    left: form.isAnonymous ? "22px" : "3px",
                                    width: "18px", height: "18px",
                                    borderRadius: "50%", background: "#fff",
                                    transition: "left 0.2s",
                                }} />
                            </div>
                            <div>
                                <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem" }}>Post Anonymously</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Your name won't be shown on this item</div>
                            </div>
                        </label>

                        {/* Submit */}
                        <button
                            id="lf-submit-btn"
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "15px",
                                background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #7000ff, #00d4ff)",
                                border: "none", borderRadius: "12px", color: "#fff",
                                fontWeight: "700", fontSize: "1rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: loading ? "none" : "0 4px 20px rgba(112,0,255,0.35)",
                                transition: "all 0.2s",
                            }}
                        >
                            {loading ? "Posting…" : `Post ${form.type === "lost" ? "Lost" : "Found"} Item`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewLostFoundForm;
