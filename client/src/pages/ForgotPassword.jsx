import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import { motion } from "framer-motion";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setIsLoading(true);

        try {
            const { data } = await forgotPassword(email);
            setMessage(data.message);
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
                    <h2 className="text-gradient" style={{ marginBottom: "10px" }}>Forgot Password?</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Enter your email to reset your password.</p>
                </div>

                {message && <div style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.3)", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>{message}</div>}
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="form-group mb-4">
                        <label htmlFor="email" className="form-label">Student Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="rollno@student.annauniv.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="neon-input"
                        />
                    </div>

                    <button type="submit" className="btn-neon primary w-100" disabled={isLoading} style={{ width: '100%', marginBottom: '20px' }}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <Link to="/auth" className="link-btn" style={{ textDecoration: "none" }}>Back to Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
