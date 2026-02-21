import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import { motion } from "framer-motion";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const { data } = await resetPassword(token, password);
            setMessage(data.message);
            setTimeout(() => {
                navigate("/auth");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-root">
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="glass-panel"
                style={{ maxWidth: "450px", width: "100%", padding: "40px", position: "relative", zIndex: 10 }}
            >
                <div className="text-center mb-4">
                    <h2 className="text-gradient" style={{ marginBottom: "10px" }}>Reset Password</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Enter your new password below.</p>
                </div>

                {message && <div style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.3)", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>{message}</div>}
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="form-group mb-3">
                        <label htmlFor="password" className="form-label">New Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                            className="neon-input"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                            className="neon-input"
                        />
                    </div>

                    <button type="submit" className="btn-neon primary w-100 mt-2" disabled={isLoading} style={{ width: '100%' }}>
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
