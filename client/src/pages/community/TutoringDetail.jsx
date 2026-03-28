import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTutoringSession, matchTutoringSession, scheduleTutoringSession, completeTutoringSession, cancelTutoringSession, submitTutoringReview, getTutoringReview } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import ChargeDisplay from "../../components/shared/ChargeDisplay";
import ReviewModal from "../../components/shared/ReviewModal";
import ReviewReveal from "../../components/community/ReviewReveal";
import { toast } from "react-toastify";

const TutoringDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [session, setSession]    = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [review, setReview]      = useState(null);
    const [schedDate, setSchedDate]= useState("");

    const load = async () => {
        try { const r = await getTutoringSession(id); setSession(r.data.data); } catch (_) {}
    };
    const loadReview = async () => {
        try { const r = await getTutoringReview(id); setReview(r.data); } catch (_) {}
    };

    useEffect(() => { load(); loadReview(); }, [id]);
    if (!session) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const userId  = user?._id || user?.id;
    const tutorId = session.tutor?._id || session.tutor;
    const learnerId = session.learner?._id || session.learner;
    const isParty = userId === tutorId || userId === learnerId;

    const action = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); } };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "30px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ color: session.sessionType === "offer" ? "#a855f7" : "#00d4ff", fontWeight: "bold" }}>{session.sessionType.toUpperCase()}</span>
                        <ChargeDisplay chargePerHour={session.chargePerHour} />
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1.5rem" }}>{session.subject}</h1>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>{session.department} · Semester {session.semester} · {session.mode}</p>
                    {session.description && <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{session.description}</p>}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                        {session.status === "open" && userId !== tutorId && (
                            <button id="tutoring-match-btn" onClick={() => action(() => matchTutoringSession(id), "Matched!")}
                                style={{ padding: "11px 24px", background: "linear-gradient(135deg, #a855f7, #7000ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                                {session.sessionType === "offer" ? "I Want to Learn" : "I Can Teach"}
                            </button>
                        )}
                        {["matched","scheduled"].includes(session.status) && isParty && (
                            <>
                                {session.status === "matched" && (
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <input type="datetime-local" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                                            style={{ padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#fff" }} />
                                        <button id="tutoring-schedule-btn" onClick={() => action(() => scheduleTutoringSession(id, { scheduledAt: schedDate }), "Scheduled!")}
                                            style={{ padding: "10px 18px", background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "10px", color: "#00d4ff", fontWeight: "bold", cursor: "pointer" }}>
                                            Schedule
                                        </button>
                                    </div>
                                )}
                                <button id="tutoring-complete-btn" onClick={() => action(() => completeTutoringSession(id), "Session marked!")}
                                    style={{ padding: "11px 22px", background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "10px", color: "#00ff88", fontWeight: "bold", cursor: "pointer" }}>
                                    ✅ Mark Complete
                                </button>
                                <button id="tutoring-cancel-btn" onClick={() => action(() => cancelTutoringSession(id), "Cancelled")}
                                    style={{ padding: "11px 22px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "var(--text-muted)", cursor: "pointer" }}>
                                    Cancel
                                </button>
                            </>
                        )}
                        {session.status === "completed" && isParty && (
                            <button id="tutoring-review-btn" onClick={() => setShowReview(true)}
                                style={{ padding: "11px 22px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "10px", color: "#ffd700", fontWeight: "bold", cursor: "pointer" }}>
                                ⭐ Leave Review
                            </button>
                        )}
                    </div>
                </div>

                {review && !review.waiting && <ReviewReveal tutorReview={review.data?.tutorReview} learnerReview={review.data?.learnerReview} />}
                {review?.waiting && <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "0.87rem" }}>⏳ Waiting for both reviews…</p>}
            </div>
            {showReview && <ReviewModal title="Rate this session" onClose={() => setShowReview(false)} onSubmit={async (d) => { await submitTutoringReview(id, d); toast.success("Review submitted!"); setShowReview(false); loadReview(); }} />}
        </div>
    );
};
export default TutoringDetail;
