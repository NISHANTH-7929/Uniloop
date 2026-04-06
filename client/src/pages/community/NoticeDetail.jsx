import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getNotice, deleteNotice, pinNotice } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const NoticeDetail = () => {
    const { id }  = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        getNotice(id).then(r => setNotice(r.data.data)).catch(() => {});
    }, [id]);

    if (!notice) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const isAdmin  = user?.role === "admin";
    const isOwner  = notice.postedBy?._id === (user?._id || user?.id) || notice.postedBy === (user?._id || user?.id);

    const handleDelete = async () => {
        try { await deleteNotice(id); toast.success("Notice deleted"); navigate("/community/notices"); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handlePin = async () => {
        try { const r = await pinNotice(id); toast.success(r.data.pinned ? "Notice pinned" : "Notice unpinned"); setNotice(n => ({ ...n, pinned: r.data.pinned })); }
        catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const ROLE_COLORS = { admin: "#ff6464", dept: "#00d4ff", club: "#a855f7", student: "#00ff88" };
    const daysLeft = Math.max(0, Math.floor((new Date(notice.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ background: notice.pinned ? "rgba(112,0,255,0.07)" : "rgba(255,255,255,0.04)", border: `1px solid ${notice.pinned ? "rgba(112,0,255,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: "18px", padding: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ background: `${ROLE_COLORS[notice.posterRole] || "#888"}22`, color: ROLE_COLORS[notice.posterRole] || "#888", padding: "3px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>
                            {notice.posterRole}
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {notice.pinned && <span>📌</span>}
                            <span style={{ color: daysLeft <= 2 ? "#ff6464" : "var(--text-muted)", fontSize: "0.78rem" }}>
                                ⏳ {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                            </span>
                        </div>
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 16px", fontSize: "1.5rem" }}>{notice.title}</h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{notice.body}</p>
                    <div style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Posted by {notice.postedBy?.email?.split("@")[0] || "Unknown"} · {new Date(notice.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        {isAdmin && <button onClick={handlePin} id="notice-pin-btn" style={{ padding: "8px 16px", background: notice.pinned ? "rgba(255,255,255,0.08)" : "rgba(112,0,255,0.2)", border: "1px solid rgba(112,0,255,0.4)", borderRadius: "10px", color: "#a855f7", cursor: "pointer", fontSize: "0.88rem" }}>
                            {notice.pinned ? "📍 Unpin" : "📌 Pin"}
                        </button>}
                        {(isOwner || isAdmin) && <button onClick={handleDelete} id="notice-delete-btn" style={{ padding: "8px 16px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "10px", color: "#ff6464", cursor: "pointer", fontSize: "0.88rem" }}>🗑️ Delete</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default NoticeDetail;
