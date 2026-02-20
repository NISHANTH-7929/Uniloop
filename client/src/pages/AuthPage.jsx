import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import Login from "./Login"; // Reuse existing components but modify them slightly to fit? 
// Actually, better to Inline or adapt the forms here for smoother transition if they share state?
// Or just wrap them. Let's wrap them.
import Register from "./Register";
// Use plain Bootstrap grid/classes instead of react-bootstrap components
import "./AuthPage.css"; // Custom styles for specific layout

const AuthPage = () => {
    const { user, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    if (loading) return <Loader />;
    if (user) return <Navigate to="/dashboard" replace />;

    const toggleAuth = () => setIsLogin(!isLogin);

    return (
        <div className="container-fluid auth-container d-flex justify-content-center align-items-center p-0">
            <div className="auth-wrapper shadow-lg position-relative" style={{ maxWidth: "900px", width: "90%", minHeight: "550px", borderRadius: "20px" }}>
                <div className="row h-100 g-0 w-100">
                    {/* Left Side: Form Container */}
                    <div className="col-md-6 bg-white p-4 d-flex flex-column justify-content-center position-relative h-500px" style={{ zIndex: 2, minHeight: "500px" }}>
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-100"
                                >
                                    <Login onSwitch={toggleAuth} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="register"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-100"
                                >
                                    <Register onSwitch={toggleAuth} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Side: Overlay/Info Panel */}
                    <div className="col-md-6 d-none d-md-flex bg-primary text-white p-4 flex-column justify-content-center align-items-center text-center">
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login-text"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2>New Here?</h2>
                                    <p className="mb-4">Sign up and discover a great amount of new opportunities!</p>
                                    <button className="btn btn-outline-light btn-lg" onClick={toggleAuth}>Sign Up</button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="register-text"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2>One of us?</h2>
                                    <p className="mb-4">If you already have an account, just sign in. We've missed you!</p>
                                    <button className="btn btn-outline-light btn-lg" onClick={toggleAuth}>Sign In</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
