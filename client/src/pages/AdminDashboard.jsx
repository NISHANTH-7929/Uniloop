import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { ShieldAlert, TrendingUp, Users, AlertTriangle } from "lucide-react";

// Inline API wrapper since it's only for this file
const API_BASE = import.meta.env.VITE_API_URI || "http://localhost:5000";
const API = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true
});
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

const AdminDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalUsers: 142,
        activeListings: 56,
        totalBorrows: 89,
        overdueBorrows: 4
    }); // Mock stats for display

    useEffect(() => {
        if (user?.role !== 'admin') {
            setLoading(false);
            return;
        }

        const fetchAdminData = async () => {
            try {
                // Fetch reports
                const res = await API.get('/reports');
                setReports(res.data);
            } catch (error) {
                console.error("Failed to load admin data", error);
                toast.error("Failed to load admin terminal");
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [user]);

    const handleReportResolution = async (reportId, action) => {
        try {
            await API.put(`/reports/${reportId}/status`, {
                status: 'resolved',
                adminNotes: `Resolved with action: ${action}`,
                addStrike: action === 'strike'
            });
            toast.success("Report resolved successfully");
            setReports(reports.filter(r => r._id !== reportId));
        } catch (error) {
            toast.error("Failed to resolve report");
        }
    };

    if (!user) return null;
    if (user.role !== 'admin') {
        return (
            <div style={{ padding: "150px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <ShieldAlert size={60} style={{ marginBottom: "20px", opacity: 0.5 }} />
                <h2>Access Denied</h2>
                <p>You do not have clearance to view this sector.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", margin: 0, display: "flex", alignItems: "center", gap: "15px" }}>
                        <ShieldAlert size={40} color="var(--accent-pink)" /> Admin Overseer
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "10px" }}>Global platform statistics and moderation queue.</p>
                </div>
            </motion.div>

            {/* Global Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-cyan)" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={16} /> Total Loopers
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#fff" }}>{stats.totalUsers}</div>
                </div>
                <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-purple)" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <TrendingUp size={16} /> Active Listings
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#fff" }}>{stats.activeListings}</div>
                </div>
                <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-pink)" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertTriangle size={16} /> Overdue Borrows
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#fff" }}>{stats.overdueBorrows}</div>
                </div>
            </div>

            {/* Moderation Queue */}
            <h2 style={{ color: "#fff", marginBottom: "20px" }}>Moderation Queue</h2>
            <div className="glass-panel" style={{ minHeight: "300px", padding: "30px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Loading logs...</div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                        No pending reports. All sectors secure. 🛡️
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        {reports.map(report => (
                            <div key={report._id} style={{ padding: "20px", background: "rgba(255,68,68,0.05)", borderLeft: "4px solid #ff4444", borderRadius: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "inline-block", background: "rgba(255,68,68,0.1)", color: "#ff4444", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                                            {report.reportType}
                                        </div>
                                        <h4 style={{ color: "#fff", margin: "0 0 10px" }}>Target: {report.targetId} ({report.targetModel})</h4>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontStyle: "italic", margin: "0 0 10px", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
                                            "{report.description}"
                                        </p>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Reported by User ID: {report.reporter}</div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "150px" }}>
                                        <button onClick={() => handleReportResolution(report._id, 'dismiss')} className="btn-neon" style={{ background: "rgba(255,255,255,0.05)", borderColor: "transparent", fontSize: "0.85rem", padding: "8px" }}>Dismiss (False Alarm)</button>
                                        <button onClick={() => handleReportResolution(report._id, 'warn')} className="btn-neon" style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", borderColor: "rgba(255,215,0,0.3)", fontSize: "0.85rem", padding: "8px" }}>Issue Warning</button>
                                        <button onClick={() => handleReportResolution(report._id, 'strike')} className="btn-neon" style={{ background: "rgba(255,68,68,0.2)", color: "#ff4444", borderColor: "rgba(255,68,68,0.5)", fontSize: "0.85rem", padding: "8px" }}>Issue Strike (+1)</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
