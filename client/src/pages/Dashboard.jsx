import React from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const Dashboard = () => {
    const { user } = useAuth();

    // Extracted display name from email for a better greeting
    const displayName = user?.email ? user.email.split('@')[0] : "Traveler";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px" }}
            >
                <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>
                    Welcome back, {displayName}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
                    Your command center for the UniLoop universe.
                </p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "24px"
                }}
            >
                {/* Stats Card 1 */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(112, 0, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Upcoming Events</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>0</div>
                    <p style={{ color: "var(--accent-cyan)", margin: "0", fontSize: "0.9rem" }}>+2 this week</p>
                </motion.div>

                {/* Stats Card 2 */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(0, 212, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Marketplace Listings</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>0</div>
                    <p style={{ color: "var(--accent-purple)", margin: "0", fontSize: "0.9rem" }}>Active items</p>
                </motion.div>

                {/* Stats Card 3 */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(255, 0, 200, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Profile Status</h3>
                    <div style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", margin: "15px 0" }}>Verified ✅</div>
                    <p style={{ color: "var(--text-secondary)", margin: "0", fontSize: "0.9rem" }}>All systems online</p>
                </motion.div>

                {/* Recent Activity Section */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ gridColumn: "1 / -1", padding: "30px", marginTop: "10px" }}>
                    <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>Recent Activity</h2>
                    <div style={{
                        border: "1px solid var(--border-glass)",
                        borderRadius: "12px",
                        padding: "40px",
                        textAlign: "center",
                        background: "rgba(0,0,0,0.2)"
                    }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px", opacity: "0.5" }}>🛰️</div>
                        <h4 style={{ color: "var(--text-secondary)", margin: "0" }}>It's quiet in space... No recent activity to show yet.</h4>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
