import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const VerificationSent = () => {
    const location = useLocation();
    const email = location.state?.email || "your email";

    return (
        <div className="auth-page-root">
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="glass-panel"
                style={{ maxWidth: "550px", width: "100%", padding: "40px", textAlign: "center", position: "relative", zIndex: 10 }}
            >
                <div style={{ fontSize: "60px", color: "var(--accent-purple)", marginBottom: "20px", textShadow: "0 0 20px var(--accent-purple)" }}>
                    🚀
                </div>
                <h2 className="text-gradient">Verification Sent</h2>
                <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-glass)", marginBottom: "30px" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "15px", fontSize: "1.1rem" }}>
                        Your journey begins soon.
                    </p>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "0" }}>
                        We have sent a verification link to <strong style={{ color: '#fff' }}>{email}</strong>. <br />
                        Please check your email (and <b>Spam/Junk</b> folder) to activate your account.
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <Link to="/auth" className="btn-neon primary" style={{ textDecoration: 'none', padding: "10px 40px" }}>Back to Login</Link>
                </div>
            </motion.div>
        </div >
    );
};

export default VerificationSent;
