import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getComplaint, toggleMeToo, adminRespondComplaint } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import MeTooButton from "../../components/community/MeTooButton";
import { toast } from "react-toastify";

const ComplaintDetail = () => {
    const { id }   = useParams();
    const { user } = useAuth();
    const [item, setItem]         = useState(null);
    const [adminMsg, setAdminMsg] = useState("");
    const [adminStatus, setAdminStatus] = useState("resolved");
    const isAdmin = user?.role === "admin";

    const load = async () => { try { const r = await getComplaint(id); setItem(r.data.data); } catch (_) {} };
    useEffect(() => { load(); }, [id]);

    if (!item) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const userId = user?._id || user?.id;
    const hasVoted = item.meTooVoters?.some(v => (v?._id || v) === userId);

    const handleMeToo = async () => {
        try { await toggleMeToo(id); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handleAdminRespond = async () => {
        try { await adminRespondComplaint(id, { adminResponse: adminMsg, status: adminStatus }); toast.success("Response sent!"); load(); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const STATUS_COLORS = { submitted: "#00d4ff", under_review: "#ffd700", resolved: "#00ff88", dismissed: "#888" };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "30px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem", textTransform: "capitalize" }}>{item.category}</span>
                        <span style={{ background: `${STATUS_COLORS[item.status]}22`, color: STATUS_COLORS[item.status], padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "bold" }}>
                            {item.status?.replace("_", " ")}
                        </span>
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 14px", fontSize: "1.4rem" }}>{item.title}</h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>{item.description}</p>

                    {item.adminResponse && (
                        <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "12px", padding: "16px", marginTop: "20px" }}>
                            <div style={{ color: "#00d4ff", fontSize: "0.78rem", fontWeight: "bold", marginBottom: "6px" }}>ADMIN RESPONSE</div>
                            <p style={{ color: "var(--text-secondary)", margin: 0 }}>{item.adminResponse}</p>
                        </div>
                    )}

                    <div style={{ marginTop: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
                        <MeTooButton count={item.meTooVoters?.length || 0} hasVoted={hasVoted} onToggle={handleMeToo} />
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Admin panel */}
                {isAdmin && (
                    <div style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: "14px", padding: "24px" }}>
                        <h3 style={{ color: "#ff6464", margin: "0 0 14px" }}>🔐 Admin Panel</h3>
                        <textarea value={adminMsg} onChange={e => setAdminMsg(e.target.value)} placeholder="Official response..." rows={3}
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", resize: "vertical", boxSizing: "border-box", marginBottom: "10px" }} />
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <select value={adminStatus} onChange={e => setAdminStatus(e.target.value)}
                                style={{ padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff" }}>
                                {["under_review","resolved","dismissed"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                            </select>
                            <button id="admin-respond-btn" onClick={handleAdminRespond}
                                style={{ padding: "10px 20px", background: "rgba(255,68,68,0.2)", border: "1px solid rgba(255,68,68,0.4)", borderRadius: "10px", color: "#ff6464", fontWeight: "bold", cursor: "pointer" }}>
                                Send Response
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default ComplaintDetail;
