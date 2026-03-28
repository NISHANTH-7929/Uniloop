import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLostFoundItem, claimItem, confirmClaim, submitLFReview, getLFReview } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import ReviewReveal from "../../components/community/ReviewReveal";
import ReviewModal from "../../components/shared/ReviewModal";
import AnonymousTag from "../../components/community/AnonymousTag";
import { toast } from "react-toastify";

const CAT_ICONS = {
    wallet:"👛", phone:"📱", keys:"🔑", "id-card":"🪪",
    bag:"🎒", clothing:"👕", stationery:"✏️", electronics:"💻",
    jewellery:"💍", other:"📦",
};

const LostFoundDetail = () => {
    const { id }    = useParams();
    const navigate  = useNavigate();
    const { user }  = useAuth();
    const [item, setItem]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [showClaim, setShowClaim] = useState(false);
    const [claimAnswer, setClaimAnswer] = useState("");
    const [claimLoading, setClaimLoading] = useState(false);
    const [showReview, setShowReview]   = useState(false);
    const [review, setReview]           = useState(null);
    const [error, setError]             = useState("");

    const load = async () => {
        try {
            const res = await getLostFoundItem(id);
            setItem(res.data.data);
        } catch (_) {}
        setLoading(false);
    };

    const loadReview = async () => {
        try {
            const r = await getLFReview(id);
            setReview(r.data);
        } catch (_) {}
    };

    useEffect(() => { load(); loadReview(); }, [id]);

    const userId    = user?._id || user?.id;
    const reporterId = item?.reporter?._id || item?.reporter;
    const isFinder  = reporterId && reporterId === userId;
    const claimedById = item?.claimVerification?.claimedBy?._id || item?.claimVerification?.claimedBy;
    const isClaimer = claimedById && claimedById === userId;

    const handleClaim = async (e) => {
        e.preventDefault();
        setClaimLoading(true);
        setError("");
        try {
            await claimItem(id, { answer: claimAnswer.trim() });
            toast.success("✅ Claim request sent! The finder will verify and confirm.");
            setShowClaim(false);
            load();
        } catch (err) {
            const msg = err.response?.data?.message || "Claim failed";
            setError(msg);
            toast.error(msg);
        }
        setClaimLoading(false);
    };

    const handleConfirm = async () => {
        try {
            await confirmClaim(id);
            toast.success("✅ Claim confirmed!");
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed");
        }
    };

    const handleReview = async (data) => {
        try {
            await submitLFReview(id, data);
            toast.success("⭐ Review submitted!");
            setShowReview(false);
            loadReview();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed");
        }
    };

    if (loading) return (
        <div className="community-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2rem", animation: "pulse 1.5s infinite" }}>⏳</div>
                <p style={{ marginTop: "12px" }}>Loading…</p>
            </div>
        </div>
    );

    if (!item) return (
        <div className="community-page">
            <div className="community-container">
                <button onClick={() => navigate("/community/lostfound")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: "20px", padding: 0 }}>
                    ← Back to Lost &amp; Found
                </button>
                <p style={{ color: "var(--text-muted)" }}>Item not found or has been removed.</p>
            </div>
        </div>
    );

    const STATUS_COLOR = { active: "#00ff88", claimed: "#a855f7", archived: "#888" };

    return (
        <div className="community-page">
            <div className="community-container" style={{ maxWidth: "720px" }}>
                {/* Back */}
                <button onClick={() => navigate("/community/lostfound")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "20px", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    ← Lost &amp; Found
                </button>

                {/* Main card */}
                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "20px", padding: "30px",
                    marginBottom: "20px",
                }}>
                    {/* Badges row */}
                    <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{
                            padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700",
                            background: item.type === "lost" ? "rgba(255,100,100,0.15)" : "rgba(0,255,136,0.12)",
                            color: item.type === "lost" ? "#ff6464" : "#00ff88",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>
                            {item.type === "lost" ? "😟 Lost" : "📦 Found"}
                        </span>
                        {CAT_ICONS[item.category] && (
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                {CAT_ICONS[item.category]} {item.category}
                            </span>
                        )}
                        <span style={{
                            marginLeft: "auto", padding: "4px 12px", borderRadius: "20px",
                            background: `${STATUS_COLOR[item.status] || "#888"}18`,
                            color: STATUS_COLOR[item.status] || "#888",
                            fontSize: "0.78rem", fontWeight: "700", textTransform: "capitalize",
                        }}>
                            {item.status}
                        </span>
                        {item.isAnonymous && <AnonymousTag />}
                    </div>

                    {/* Title & description */}
                    <h1 style={{ color: "#fff", margin: "0 0 12px", fontSize: "1.6rem", fontFamily: "var(--font-display)" }}>
                        {item.title}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 20px" }}>
                        {item.description}
                    </p>

                    {/* Info grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                        {[
                            { label: "Location", val: item.locationTag, icon: "📍" },
                            { label: "Posted", val: new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), icon: "📅" },
                            item.reporter && !item.isAnonymous && { label: "Posted by", val: item.reporter.email?.split("@")[0] || "Unknown", icon: "👤" },
                        ].filter(Boolean).map(row => (
                            <div key={row.label} style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "12px", padding: "14px 16px",
                            }}>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "4px" }}>{row.icon} {row.label}</div>
                                <div style={{ color: "#fff", fontWeight: "600" }}>{row.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* === Actions === */}
                    <div style={{ display: "grid", gap: "10px" }}>
                        {/* Claim button (only for found items, not own) */}
                        {item.status === "active" && item.type === "found" && !isFinder && (
                            <button
                                id="lf-claim-btn"
                                onClick={() => setShowClaim(v => !v)}
                                style={{
                                    padding: "13px", background: "linear-gradient(135deg, #7000ff, #00d4ff)",
                                    border: "none", borderRadius: "12px", color: "#fff",
                                    fontWeight: "700", fontSize: "1rem", cursor: "pointer",
                                    boxShadow: "0 4px 20px rgba(112,0,255,0.3)",
                                }}
                            >
                                🙋 I Lost This — Claim It
                            </button>
                        )}

                        {/* Claim form (inline) */}
                        {showClaim && (
                            <form onSubmit={handleClaim} style={{
                                background: "rgba(112,0,255,0.08)", border: "1px solid rgba(112,0,255,0.2)",
                                borderRadius: "14px", padding: "20px",
                            }}>
                                {error && (
                                    <div style={{ background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ff6464", fontSize: "0.88rem", marginBottom: "14px" }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                {item.claimVerification?.question ? (
                                    <>
                                        <p style={{ color: "#a855f7", fontWeight: "600", marginBottom: "8px" }}>
                                            🔒 Verification Question
                                        </p>
                                        <p style={{ color: "#fff", marginBottom: "12px" }}>{item.claimVerification.question}</p>
                                        <input
                                            className="community-input"
                                            value={claimAnswer}
                                            onChange={e => setClaimAnswer(e.target.value)}
                                            placeholder="Your answer..."
                                            required
                                            style={{ marginBottom: "12px" }}
                                        />
                                    </>
                                ) : (
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
                                        No verification question set. The finder will confirm your claim manually.
                                    </p>
                                )}
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="submit"
                                        disabled={claimLoading}
                                        style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #7000ff, #00d4ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        {claimLoading ? "Sending…" : "Submit Claim"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowClaim(false); setError(""); }}
                                        style={{ padding: "11px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "var(--text-muted)", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Finder confirm button */}
                        {isFinder && item.claimVerification?.claimedBy && item.status === "active" && (
                            <div style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "14px", padding: "18px" }}>
                                <p style={{ color: "#00ff88", fontWeight: "600", marginBottom: "12px" }}>
                                    📨 Someone claimed this item!
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "14px" }}>
                                    Claimer: <strong style={{ color: "#fff" }}>
                                        {item.claimVerification.claimedBy?.email?.split("@")[0] || "A user"}
                                    </strong>
                                </p>
                                <button
                                    id="lf-confirm-btn"
                                    onClick={handleConfirm}
                                    style={{ padding: "11px 24px", background: "rgba(0,255,136,0.2)", border: "1px solid rgba(0,255,136,0.4)", borderRadius: "10px", color: "#00ff88", fontWeight: "700", cursor: "pointer" }}
                                >
                                    ✅ Confirm — Item Returned
                                </button>
                            </div>
                        )}

                        {/* Review button */}
                        {item.status === "claimed" && (isFinder || isClaimer) && (
                            <button
                                id="lf-review-btn"
                                onClick={() => setShowReview(true)}
                                style={{ padding: "11px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "12px", color: "#ffd700", fontWeight: "700", cursor: "pointer" }}
                            >
                                ⭐ Leave a Review
                            </button>
                        )}
                    </div>

                    {/* Review state */}
                    {review && (
                        <div style={{ marginTop: "20px" }}>
                            {review.waiting
                                ? <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", textAlign: "center" }}>⏳ Waiting for the other party's review — reviews reveal together</p>
                                : <ReviewReveal finderReview={review.data?.finderReview} claimerReview={review.data?.claimerReview} />
                            }
                        </div>
                    )}
                </div>
            </div>

            {showReview && (
                <ReviewModal
                    title="Review this exchange"
                    onClose={() => setShowReview(false)}
                    onSubmit={handleReview}
                />
            )}
        </div>
    );
};

export default LostFoundDetail;
