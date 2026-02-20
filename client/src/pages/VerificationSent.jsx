import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const VerificationSent = () => {
    const location = useLocation();
    const email = location.state?.email || "your email";

    // Check if redirected from login page (optional, based on state or query param if we added one, 
    // but for now we can infer or just make the message generic enough or check previous path if sent)
    // Actually, Login.jsx sends { state: { email } }. We can add a flag there too.

    // Let's assume if we are here, we need verification. 
    // The user asked for "if the user is not verified go to another page".
    // We can make this page say "Verification Required" if that was the context.

    // To be precise, let's update Login.jsx to send a flag, but for now, 
    // let's just make the message very clear.

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded shadow text-center"
                style={{ maxWidth: "500px" }}
            >
                <div style={{ fontSize: "60px", color: "#ffc107", marginBottom: "20px" }}>
                    ⚠️
                </div>
                <h2 className="mb-3">Verification Required</h2>
                <p className="text-muted mb-4">
                    Your account is not verified yet. <br />
                    We have sent a verification link to <strong>{email}</strong>. <br />
                    Please check your email (and <b>Spam/Junk</b> folder) to activate your account.
                </p>
                <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-primary btn-lg">Back to Login</Link>
                </div>
            </motion.div>
        </div >
    );
};

export default VerificationSent;
