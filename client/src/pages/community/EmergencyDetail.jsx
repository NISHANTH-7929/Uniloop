import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEmergency, respondToEmergency, resolveEmergency, confirmResponder } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import BloodTypeBadge from "../../components/community/BloodTypeBadge";
import { toast } from "react-toastify";

const EmergencyDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [item, setItem]   = useState(null);
    const [msg, setMsg]     = useState("");
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try { const r = await getEmergency(id); setItem(r.data.data); } catch (_) {}
    };
    useEffect(() => { load(); }, [id]);

    if (!item) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const userId  = user?._id || user?.id;
    const isOwner = item.poster?._id === userId || item.poster === userId;

    const handleRespond = async () => {
        setLoading(true);
        try { await respondToEmergency(id, { message: msg }); toast.success("Response sent!"); load(); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    const handleResolve = async () => {
        try { await resolveEmergency(id); toast.success("Marked as resolved"); load(); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: "18px", padding: "30px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ color: item.urgency === "critical" ? "#ff4444" : "#ffd700", fontWeight: "bold" }}>{item.urgency.toUpperCase()} • {item.type.toUpperCase()}</span>
                        {item.bloodType && <BloodTypeBadge bloodType={item.bloodType} />}
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 12px", fontSize: "1.5rem" }}>{item.title}</h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>{item.description}</p>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>📍 {item.location}</div>
                </div>

                {/* Respond */}
                {item.status === "active" && !isOwner && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
                        <h3 style={{ color: "#fff", margin: "0 0 14px" }}>{item.type === "blood" ? "🩸 I Can Donate" : "🆘 Respond"}</h3>
                        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Your message to the poster..."
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", resize: "vertical", boxSizing: "border-box", marginBottom: "12px" }} rows={2} />
                        <button id="emergency-respond-btn" onClick={handleRespond} disabled={loading}
                            style={{ padding: "11px 24px", background: item.type === "blood" ? "linear-gradient(135deg, #e74c3c, #c0392b)" : "linear-gradient(135deg, #7000ff, #00d4ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                            {loading ? "Sending…" : item.type === "blood" ? "I Can Donate" : "Respond"}
                        </button>
                    </div>
                )}

                {/* Responses */}
                <div>
                    <h3 style={{ color: "#fff", marginBottom: "14px" }}>Responses ({item.responses?.length || 0})</h3>
                    {item.responses?.map((r, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{r.responder?.email?.split("@")[0] || "User"}</span>
                                {r.confirmed && <span style={{ color: "#00ff88", fontSize: "0.78rem" }}>✓ Confirmed</span>}
                            </div>
                            <p style={{ color: "var(--text-secondary)", margin: 0 }}>{r.message}</p>
                            {isOwner && !r.confirmed && (
                                <button onClick={() => confirmResponder(id, r.responder?._id || r.responder).then(() => { toast.success("Confirmed!"); load(); })}
                                    style={{ marginTop: "8px", padding: "5px 14px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "8px", color: "#00ff88", cursor: "pointer", fontSize: "0.82rem" }}>
                                    Confirm
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {isOwner && item.status === "active" && (
                    <button id="emergency-resolve-btn" onClick={handleResolve}
                        style={{ marginTop: "20px", width: "100%", padding: "12px", background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "12px", color: "#00ff88", fontWeight: "bold", cursor: "pointer" }}>
                        ✅ Mark as Resolved
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmergencyDetail;
