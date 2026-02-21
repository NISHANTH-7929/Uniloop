import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import Login from "./Login";
import Register from "./Register";
import "./AuthPage.css";

const AuthPage = () => {
    const { user, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    if (loading) return <div className="auth-page-root"><Loader /></div>;
    if (user) return <Navigate to="/dashboard" replace />;

    const toggleAuth = () => setIsLogin(!isLogin);

    // Animation variants
    const formVariants = {
        hidden: (isLogin) => ({ x: isLogin ? -30 : 30, opacity: 0 }),
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
        exit: (isLogin) => ({ x: isLogin ? 30 : -30, opacity: 0, transition: { duration: 0.3 } })
    };

    const infoVariants = {
        hidden: (isLogin) => ({ x: isLogin ? 30 : -30, opacity: 0 }),
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut", delay: 0.1 } },
        exit: (isLogin) => ({ x: isLogin ? -30 : 30, opacity: 0, transition: { duration: 0.3 } })
    };

    return (
        <div className="auth-page-root">
            {/* Animated Background Elements */}
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            <div className="auth-container-glass">
                {/* Left Side: Forms */}
                <div className="auth-form-column">
                    <AnimatePresence mode="wait" custom={isLogin}>
                        {isLogin ? (
                            <motion.div
                                key="login"
                                custom={isLogin}
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-100"
                            >
                                <Login onSwitch={toggleAuth} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register"
                                custom={!isLogin}
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-100"
                            >
                                <Register onSwitch={toggleAuth} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Information / Switcher */}
                <div className="auth-info-column">
                    <AnimatePresence mode="wait" custom={isLogin}>
                        {isLogin ? (
                            <motion.div
                                key="login-info"
                                custom={isLogin}
                                variants={infoVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="auth-info-content"
                            >
                                <h2 className="text-gradient">New Here?</h2>
                                <p>Sign up and discover a cosmic amount of new opportunities!</p>
                                <button className="btn-neon" onClick={toggleAuth}>
                                    Create Account
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register-info"
                                custom={!isLogin}
                                variants={infoVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="auth-info-content"
                            >
                                <h2 className="text-gradient">Welcome Back!</h2>
                                <p>If you already have an account, sign in to continue your journey.</p>
                                <button className="btn-neon" onClick={toggleAuth}>
                                    Sign In
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
