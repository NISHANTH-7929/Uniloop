import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSkill, matchSkill, completeSkill, cancelSkill, submitSkillReview, getSkillReview } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import ReviewModal from "../../components/shared/ReviewModal";
import ReviewReveal from "../../components/community/ReviewReveal";
import ChargeDisplay from "../../components/shared/ChargeDisplay";
import { findOrCreateConversation } from "../../api/chatApi";
import { toast } from "react-toastify";

const SkillDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [skill, setSkill]       = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [review, setReview]     = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [scheduleNote, setScheduleNote] = useState("");

    const load = async () => { try { const r = await getSkill(id); setSkill(r.data.data); } catch (_) {} };
    const loadReview = async () => { try { const r = await getSkillReview(id); setReview(r.data); } catch (_) {} };
    useEffect(() => { load(); loadReview(); }, [id]);

    if (!skill) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const userId   = user?._id || user?.id;
    const posterId = skill.poster?._id || skill.poster;
    const matchId  = skill.matchedWith?._id || skill.matchedWith;
    const isParty  = userId === posterId || userId === matchId;

    const action = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } };

    const handleMessage = async () => {
        const partnerId = userId === posterId ? matchId : posterId;
        if (!partnerId) return;
        setChatLoading(true);
        try {
            const res = await findOrCreateConversation({
                participantId: partnerId,
                referenceId: id,
                threadModel: "SkillExchange",
            });
            navigate("/dormdash/messages", { state: { conversationId: res.data._id, threadType: "skill" } });
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not open chat");
        }
        setChatLoading(false);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: "18px", padding: "30px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                        <ChargeDisplay chargeIfAny={skill.chargeIfAny} label="session" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                        <div style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ color: "#00ff88", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "6px" }}>OFFERS</div>
                            <div style={{ color: "#fff", fontSize: "1rem" }}>{skill.offerSkill}</div>
                            {skill.offerDetail && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px", marginBottom: 0 }}>{skill.offerDetail}</p>}
                        </div>
                        <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ color: "#00d4ff", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "6px" }}>WANTS</div>
                            <div style={{ color: "#fff", fontSize: "1rem" }}>{skill.wantSkill}</div>
                            {skill.wantDetail && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px", marginBottom: 0 }}>{skill.wantDetail}</p>}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {skill.status === "open" && userId !== posterId && (
                            <button id="skills-match-btn" onClick={() => action(() => matchSkill(id), "Matched!")}
                                style={{ padding: "11px 24px", background: "linear-gradient(135deg, #ffd700, #ff7f50)", border: "none", borderRadius: "10px", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                                🤝 I'm Interested
                            </button>
                        )}
                        {skill.status === "matched" && isParty && (
                            <>
                                <button id="skills-complete-btn" onClick={() => action(() => completeSkill(id), "Marked complete!")}
                                    style={{ padding: "11px 22px", background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "10px", color: "#00ff88", fontWeight: "bold", cursor: "pointer" }}>
                                    ✅ Mark Complete
                                </button>
                                <button id="skills-cancel-btn" onClick={() => action(() => cancelSkill(id), "Cancelled")}
                                    style={{ padding: "11px 22px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "var(--text-muted)", cursor: "pointer" }}>
                                    Cancel
                                </button>
                                {/* Message Partner */}
                                <button
                                    id="skills-message-btn"
                                    onClick={handleMessage}
                                    disabled={chatLoading}
                                    style={{ padding: "11px 22px", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "10px", color: "#00d4ff", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    💬 {chatLoading ? "Opening…" : "Message Partner"}
                                </button>
                            </>
                        )}
                        {skill.status === "completed" && isParty && (
                            <button id="skills-review-btn" onClick={() => setShowReview(true)}
                                style={{ padding: "11px 22px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "10px", color: "#ffd700", fontWeight: "bold", cursor: "pointer" }}>
                                ⭐ Leave Review
                            </button>
                        )}
                    </div>
                </div>

                {review && !review.waiting && <ReviewReveal giverReview={review.data?.giverReview} takerReview={review.data?.takerReview} />}
                {review?.waiting && <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "0.87rem" }}>⏳ Waiting for both reviews…</p>}

                {/* Schedule coordination panel (matched only) */}
                {skill.status === "matched" && isParty && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: "14px", padding: "22px", marginTop: "0" }}>
                        <p style={{ color: "#ffd700", fontWeight: "700", fontSize: "0.9rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            📅 Schedule Coordination
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>
                            Use the Message button above to agree on a location and time. You can paste your schedule details here as a note.
                        </p>
                        <textarea
                            value={scheduleNote}
                            onChange={e => setScheduleNote(e.target.value)}
                            placeholder="e.g. Meet at Library Block A, Saturday 3 PM"
                            rows={2}
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: "10px", color: "#fff", resize: "vertical", boxSizing: "border-box", fontSize: "0.9rem" }}
                        />
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "8px", marginBottom: 0 }}>
                            💡 This note is local-only. Use 💬 Message Partner to share it with your partner.
                        </p>
                    </div>
                )}
            </div>
            {showReview && <ReviewModal title="Rate this skill exchange" onClose={() => setShowReview(false)} onSubmit={async (d) => { await submitSkillReview(id, d); toast.success("Review submitted!"); setShowReview(false); loadReview(); }} />}
        </div>
    );
};
export default SkillDetail;
