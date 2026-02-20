import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Loader from "../components/Loader"; // Import Loader if you want to use it inside button or full page

const Login = ({ onSwitch }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await login(email, password);
        setIsLoading(false);
        if (res.success) {
            navigate("/dashboard");
        } else if (res.error && res.error.toLowerCase().includes("verify")) {
            navigate("/verification-sent", { state: { email } });
        }
    };

    return (
        <div className="w-100 d-flex flex-column justify-content-center h-100 px-4">
            <h2 className="text-center mb-2 text-primary fw-bold display-6">Welcome Back</h2>
            <p className="text-center text-muted mb-4">Login to your account</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
                <div className="mb-3">
                    <label htmlFor="email" className="fw-semibold">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                        className="form-control form-control-lg rounded-3"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="fw-semibold">Password</label>
                    <div className="input-group">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            className="form-control form-control-lg rounded-start-3"
                            style={{ borderRight: "none" }}
                        />
                        <span className="input-group-text bg-white rounded-end-3" style={{ cursor: "pointer", borderLeft: "none" }} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                                    <path d="M11.297 9.32l.766.766a2.775 2.775 0 0 1-4.31.296l.766-.766.778.779z" />
                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                    <path d="M1.646 2.354l12.793 12.793a.5.5 0 0 1-.707.707L.939 3.061a.5.5 0 0 1 .707-.707z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                </svg>
                            )}
                        </span>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-lg mb-3 rounded-pill fw-bold shadow-sm" disabled={isLoading}>
                    {isLoading ? "Logging In... (This may take a few seconds)" : "Log In"}
                </button>
                <div className="text-end mb-3">
                    <Link to="/forgot-password" className="text-decoration-none small">Forgot Password?</Link>
                </div>
            </form>
            <div className="d-md-none text-center mt-3">
                <p>New here? <button type="button" className="btn btn-link p-0 align-baseline" onClick={onSwitch}>Sign Up</button></p>
            </div>
        </div>
    );
};

export default Login;
