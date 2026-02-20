import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
        <div className="auth-container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded shadow-lg"
                style={{ maxWidth: "500px", width: "100%" }}
            >
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">Reset Password</h2>
                    <p className="text-muted">Enter your new password below.</p>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password">New Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                            className="form-control rounded-3"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                            className="form-control rounded-3"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 btn-lg mb-3 rounded-pill fw-bold shadow-sm" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
