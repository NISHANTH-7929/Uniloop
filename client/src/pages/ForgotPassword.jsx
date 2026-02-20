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
        <div className="auth-container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded shadow-lg"
                style={{ maxWidth: "500px", width: "100%" }}
            >
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">Forgot Password?</h2>
                    <p className="text-muted">Enter your email to reset your password.</p>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email">Student Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="rollno@student.annauniv.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control rounded-3"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 btn-lg mb-3 rounded-pill fw-bold shadow-sm" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <Link to="/auth" className="text-decoration-none fw-semibold">Back to Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
