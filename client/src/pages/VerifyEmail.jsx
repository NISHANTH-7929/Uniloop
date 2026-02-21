import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import Loader from "../components/Loader";
import { motion } from "framer-motion";

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState("idle"); // idle, verifying, success, error
    const [message, setMessage] = useState("");

    const handleVerify = async () => {
        setStatus("verifying");
        try {
            const { data } = await verifyEmail(token);
            setStatus("success");
            setMessage(data.message);
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Verification failed");
        }
    };

    return (
        <div className="auth-page-root">
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-panel"
                style={{ maxWidth: "500px", width: "100%", padding: "40px", textAlign: "center", position: "relative", zIndex: 10 }}
            >
                {status === "idle" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: "60px", color: "var(--accent-cyan)", marginBottom: "20px" }}>
                            🛡️
                        </div>
                        <h2 className="text-gradient">Verify Your Email</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
                            Click the button below to activate your cosmic account.
                        </p>
                        <button onClick={handleVerify} className="btn-neon primary w-100">
                            Verify Now
                        </button>
                    </motion.div>
                )}

                {status === "verifying" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader />
                        <h3 className="mt-4" style={{ color: "var(--text-primary)" }}>Verifying...</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Please wait a moment.</p>
                    </motion.div>
                )}

                {status === "success" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: "60px", color: "var(--accent-purple)", marginBottom: "20px", textShadow: "0 0 20px var(--accent-purple)" }}>
                            ✅
                        </div>
                        <h2 className="text-gradient">Verified!</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>{message}</p>
                        <Link to="/auth" className="btn-neon primary w-100" style={{ textDecoration: 'none' }}>
                            Proceed to Login
                        </Link>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: "60px", color: "#ff00c8", marginBottom: "20px", textShadow: "0 0 20px #ff00c8" }}>
                            ❌
                        </div>
                        <h2 style={{ color: "#ff00c8" }}>Verification Failed</h2>
                        <div className="auth-error mt-3">{message}</div>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
                            The link might be invalid or expired. Please register again.
                        </p>
                        <Link to="/auth" className="btn-neon w-100" style={{ textDecoration: 'none' }}>
                            Register Again
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
