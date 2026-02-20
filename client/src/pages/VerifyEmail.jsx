import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import Loader from "../components/Loader";

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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
            <div style={{ width: "500px", padding: "20px", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
                <div className="text-center">
                    {status === "idle" && (
                        <>
                            <div style={{ fontSize: "60px", color: "#0d6efd" }}>
                                <i className="bi bi-shield-lock-fill"></i> 🛡️
                            </div>
                            <h2 className="mt-3">Verify Your Email</h2>
                            <p className="text-muted mb-4">Click the button below to activate your account.</p>
                            <button onClick={handleVerify} className="btn btn-primary btn-lg w-100 rounded-pill">
                                Verify Now
                            </button>
                        </>
                    )}

                    {status === "verifying" && (
                        <>
                            <Loader />
                            <h3 className="mt-4">Verifying...</h3>
                            <p className="text-muted">Please wait a moment.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div style={{ fontSize: "60px", color: "#28a745" }}>
                                <i className="bi bi-check-circle-fill"></i> ✅
                            </div>
                            <h2 className="mt-3 text-success">Verified!</h2>
                            <p className="mb-4">{message}</p>
                            <Link to="/auth" className="btn btn-primary btn-lg w-100">Proceed to Login</Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div style={{ fontSize: "60px", color: "#dc3545" }}>
                                <i className="bi bi-x-circle-fill"></i> ❌
                            </div>
                            <h2 className="mt-3 text-danger">Verification Failed</h2>
                            <div className="alert alert-danger mt-3">{message}</div>
                            <p className="text-muted">The link might be invalid or expired. Please register again.</p>
                            <Link to="/auth" className="btn btn-outline-secondary mt-3">Register Again</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
