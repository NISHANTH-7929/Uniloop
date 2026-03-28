import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLostFoundItem, claimItem, confirmClaim, submitLFReview, getLFReview } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import ClaimModal from "../../components/community/ClaimModal";
import ReviewReveal from "../../components/community/ReviewReveal";
import ReviewModal from "../../components/shared/ReviewModal";
import AnonymousTag from "../../components/community/AnonymousTag";
import { toast } from "react-toastify";

const LostFoundDetail = () => {
    const { id }    = useParams();
    const { user }  = useAuth();
    const [item, setItem]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [showClaim, setShowClaim] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [review, setReview]       = useState(null);

    const load = async () => {
        try {
            const res = await getLostFoundItem(id);
            setItem(res.data.data);
        } catch (_) {}
        setLoading(false);
    };

    const loadReview = async () => {
        try { const r = await getLFReview(id); setReview(r.data); } catch (_) {}
    };

    useEffect(() => { load(); loadReview(); }, [id]);

    const userId    = user?._id || user?.id;
    const isFinder  = item?.reporter?._id === userId || item?.reporter === userId;
    const isClaimer = item?.claimVerification?.claimedBy?._id === userId || item?.claimVerification?.claimedBy === userId;

    const handleClaim = async (answer) => {
        try {
            await claimItem(id, { answer });
            toast.success("Claim request sent!");
            setShowClaim(false);
        } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handleConfirm = async () => {
        try { await confirmClaim(id); toast.success("Claim confirmed!"); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handleReview = async ({ rating, comment }) => {
        try { await submitLFReview(id, { rating, comment }); toast.success("Review submitted!"); setShowReview(false); loadReview(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;
    if (!item) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px", color: "var(--text-muted)" }}>Item not found.</div>;

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <span style={{ color: item.type === "lost" ? "#ff6464" : "#00ff88", fontWeight: "bold", textTransform: "uppercase" }}>{item.type}</span>
                        {item.isAnonymous && <AnonymousTag />}
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 12px", fontSize: "1.6rem" }}>{item.title}</h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "20px" }}>{item.description}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px" }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Category</div>
                            <div style={{ color: "#fff" }}>{item.category}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px" }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Location</div>
                            <div style={{ color: "#fff" }}>{item.locationTag}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    {item.status === "active" && item.type === "found" && !isFinder && (
                        <button id="lf-claim-btn" onClick={() => setShowClaim(true)} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #7000ff, #00d4ff)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", cursor: "pointer", marginBottom: "12px" }}>
                            📦 I Lost This — Claim It
                        </button>
                    )}
                    {isFinder && item.claimVerification?.claimedBy && item.status === "active" && (
                        <button id="lf-confirm-btn" onClick={handleConfirm} style={{ width: "100%", padding: "13px", background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", borderRadius: "12px", color: "#00ff88", fontWeight: "bold", cursor: "pointer", marginBottom: "12px" }}>
                            ✅ Confirm Claim
                        </button>
                    )}
                    {item.status === "claimed" && (isFinder || isClaimer) && (
                        <button id="lf-review-btn" onClick={() => setShowReview(true)} style={{ width: "100%", padding: "13px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "12px", color: "#ffd700", fontWeight: "bold", cursor: "pointer", marginBottom: "12px" }}>
                            ⭐ Leave Review
                        </button>
                    )}

                    {/* Review reveal */}
                    {review && !review.waiting && <ReviewReveal finderReview={review.data?.finderReview} claimerReview={review.data?.claimerReview} />}
                    {review?.waiting && <p style={{ color: "var(--text-muted)", fontSize: "0.87rem", textAlign: "center" }}>⏳ Waiting for the other party's review…</p>}
                </div>
            </div>

            {showClaim && <ClaimModal item={item} onClose={() => setShowClaim(false)} onSubmit={handleClaim} />}
            {showReview && <ReviewModal title="Review this exchange" onClose={() => setShowReview(false)} onSubmit={handleReview} />}
        </div>
    );
};

export default LostFoundDetail;
