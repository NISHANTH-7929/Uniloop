import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { getMyTickets, getNotifications, respondToVolunteerRequest } from "../api/events";
import { QRCodeSVG } from "qrcode.react";

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const displayName = user?.email ? user.email.split('@')[0] : "Traveler";

    useEffect(() => {
        getMyTickets()
            .then(res => setTickets(res.data))
            .catch(err => console.error("Could not fetch tickets"));

        getNotifications()
            .then(res => setNotifications(res.data))
            .catch(err => console.error("Could not fetch notifications"));
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "40px" }}>
                <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>
                    Welcome back, {displayName}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>Your command center for the UniLoop universe.</p>
            </motion.div>

            {/* Small notifications shortcut */}
            <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'flex-end' }}>
                <a href="/notifications" style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Notifications
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span style={{ width: 10, height: 10, borderRadius: 6, background: 'var(--accent-pink)' }} />
                    )}
                </a>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>

                {/* Stats Cards ... */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(112, 0, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>My Registrations</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>{tickets.length}</div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(0, 212, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Role</h3>
                    <div style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", margin: "10px 0", textTransform: "capitalize" }}>{user?.role || "Student"}</div>
                </motion.div>

                {/* My Tickets Section */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ gridColumn: "1 / -1", padding: "30px", marginTop: "10px" }}>
                    <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>My Event Tickets (QR Codes)</h2>
                    {tickets.length === 0 ? (
                        <div style={{ border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "40px", textAlign: "center", background: "rgba(0,0,0,0.2)" }}>
                            <div style={{ fontSize: "40px", marginBottom: "15px", opacity: "0.5" }}>🛰️</div>
                            <h4 style={{ color: "var(--text-secondary)", margin: "0" }}>You have no active event tickets.</h4>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                            {tickets.map(ticket => (
                                <div key={ticket._id} style={{ border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.05)", textAlign: "center", position: "relative" }}>
                                    <h4 style={{ color: "var(--accent-cyan)", marginBottom: "5px" }}>{ticket.event?.title}</h4>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
                                        Status: <strong style={{ color: ticket.status === 'ACTIVE' ? '#28a745' : (ticket.status === 'USED' ? '#ffc107' : '#dc3545') }}>{ticket.status}</strong>
                                    </p>

                                    {ticket.status === 'ACTIVE' && (
                                        <div style={{ background: "#fff", padding: "10px", display: "inline-block", borderRadius: "10px" }}>
                                            <QRCodeSVG value={ticket.qr_token || ticket._id} size={150} />
                                        </div>
                                    )}

                                    {ticket.status !== 'ACTIVE' && (
                                        <div style={{ padding: "40px 10px", fontSize: "1.2rem", color: "var(--text-muted)" }}>
                                            {ticket.status === 'USED' ? 'Ticket Scanned & Used' : 'Registration Cancelled'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
