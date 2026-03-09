import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { ShieldAlert, TrendingUp, Users, AlertTriangle, ShieldCheck, UserX } from "lucide-react";

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
    const [systemUsers, setSystemUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalUsers: 142,
        activeListings: 56,
        totalBorrows: 89,
        overdueBorrows: 4
    }); // Mock stats for display

    const [organizerEmail, setOrganizerEmail] = useState("");
    const [validDays, setValidDays] = useState(7);
    const [assigningLoading, setAssigningLoading] = useState(false);

    useEffect(() => {
        if (user?.role !== 'admin') {
            setLoading(false);
            return;
        }

        const fetchAdminData = async () => {
            try {
                // Fetch reports
                const reportsRes = await API.get('/reports');
                setReports(reportsRes.data);

                // Fetch all users for role management
                const usersRes = await API.get('/admin/users');
                setSystemUsers(usersRes.data);
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

    const handleAssignOrganizer = async (e) => {
        e.preventDefault();
        setAssigningLoading(true);
        try {
            const { data } = await API.post('/admin/assign-organizer', { email: organizerEmail, validDays });
            toast.success(data.message);
            setOrganizerEmail("");

            // Refresh users
            const usersRes = await API.get('/admin/users');
            setSystemUsers(usersRes.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign role");
        } finally {
            setAssigningLoading(false);
        }
    };

    const handleDemoteOrganizer = async (userId) => {
        if (!window.confirm("Revoke organizer privileges for this user immediately?")) return;
        try {
            const { data } = await API.post('/admin/remove-organizer', { userId });
            toast.success(data.message);

            // Refresh users
            const usersRes = await API.get('/admin/users');
            setSystemUsers(usersRes.data);
        } catch (error) {
            toast.error("Failed to revoke privileges");
        }
    };

    const handleResetData = async () => {
        const password = prompt("DANGER: Type 'WIPE_DB' to delete all test users and events.");
        if (password === 'WIPE_DB') {
            try {
                await API.post('/admin/reset-data');
                toast.success("Data wiped successfully. Only admin remains.");
                const usersRes = await API.get('/admin/users');
                setSystemUsers(usersRes.data);
            } catch (error) {
                toast.error("Wipe failed");
            }
        } else {
            toast.info("Wipe cancelled");
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
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", margin: 0, display: "flex", alignItems: "center", gap: "15px" }}>
                        <ShieldAlert size={40} color="var(--accent-pink)" /> Admin Overseer
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "10px" }}>Global platform statistics, moderation queue, and role management.</p>
                </div>
                {/* DANGER ZONE */}
                <div>
                    <button onClick={handleResetData} className="btn-neon" style={{ background: "rgba(255,0,0,0.1)", color: "#ff4444", borderColor: "rgba(255,0,0,0.3)" }}>
                        WIPE & RESET TEST DATA
                    </button>
                </div>
            </motion.div>

            {/* Global Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-cyan)" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={16} /> Total Loopers
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#fff" }}>{systemUsers.length > 0 ? systemUsers.length : stats.totalUsers}</div>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px", alignItems: "start" }}>

                {/* Role Management (Event Branch Feature) */}
                <div>
                    <h2 style={{ color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <ShieldCheck size={24} color="var(--accent-purple)" /> Role Allocation
                    </h2>
                    <div className="glass-panel" style={{ padding: "30px" }}>
                        <form onSubmit={handleAssignOrganizer}>
                            <div className="form-group" style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "10px", color: "var(--text-secondary)" }}>Assign Time-Limited Organizer Role</label>
                                <input
                                    type="email"
                                    placeholder="Student Email"
                                    value={organizerEmail}
                                    onChange={(e) => setOrganizerEmail(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", marginBottom: "15px" }}
                                />
                                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                    <span style={{ color: "var(--text-muted)" }}>Valid for (Days):</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={validDays}
                                        onChange={(e) => setValidDays(e.target.value)}
                                        style={{ width: "80px", padding: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", textAlign: "center" }}
                                    />
                                    <button type="submit" className="btn-neon primary" disabled={assigningLoading} style={{ flex: 1, padding: "10px" }}>
                                        {assigningLoading ? "Processing..." : "Grant Clearance"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* System Users Table (Event Branch Feature) */}
                <div>
                    <h2 style={{ color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Users size={24} color="var(--accent-cyan)" /> System Directory
                    </h2>
                    <div className="glass-panel" style={{ padding: "20px", maxHeight: "300px", overflowY: "auto" }}>
                        {loading ? <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading personnel...</p> : (
                            <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff", fontSize: "0.9rem" }}>
                                <thead style={{ background: "rgba(255,255,255,0.05)", textAlign: "left" }}>
                                    <tr>
                                        <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Email</th>
                                        <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Role</th>
                                        <th style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {systemUsers.map(u => (
                                        <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{u.email}</td>
                                            <td style={{ padding: "10px" }}>
                                                <span style={{
                                                    padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", textTransform: "uppercase",
                                                    background: u.role === 'admin' ? 'rgba(255,68,68,0.1)' : u.role === 'organizer' ? 'rgba(112,0,255,0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: u.role === 'admin' ? '#ff4444' : u.role === 'organizer' ? '#a466ff' : 'var(--text-muted)'
                                                }}>
                                                    {u.role}
                                                    {u.role === 'organizer' && u.organizerValidity?.to && (
                                                        <span style={{ marginLeft: "5px", fontSize: "0.6rem", opacity: 0.8 }}>
                                                            ({new Date(u.organizerValidity.to).toLocaleDateString()})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td style={{ padding: "10px", textAlign: "right" }}>
                                                {u.role === 'organizer' && (
                                                    <button
                                                        onClick={() => handleDemoteOrganizer(u._id)}
                                                        title="Revoke Privileges"
                                                        style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", padding: "5px" }}
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

            {/* Moderation Queue (Marketplace Branch Feature) */}
            <h2 style={{ color: "#fff", marginBottom: "20px" }}>Moderation Queue</h2>
            <div className="glass-panel" style={{ minHeight: "300px", padding: "30px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Loading logs...</div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                        No pending reports. All sectors secure. ✅
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
