import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const Register = ({ onSwitch }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const recaptchaRef = useRef(null);

    const { email, password, confirmPassword } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onCaptchaChange = (token) => {
        setRecaptchaToken(token);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        if (!recaptchaToken) {
            setMessage("Please verify that you are not a robot");
            return;
        }

        setIsLoading(true);
        const res = await register({ ...formData, recaptchaToken });
        setIsLoading(false);
        if (res.success) {
            navigate("/verification-sent", { state: { email } });
        } else {
            if (!res.error) setMessage(res.message);
        }
    };

    return (
        <div className="auth-form-wrapper">
            <h2 className="auth-title text-gradient">Create Account</h2>
            <p className="auth-subtitle">Join the UniLoop galaxy today</p>

            {message && <div className="auth-error">{message}</div>}

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Student Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="rollno@student.annauniv.edu"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                        className="neon-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="password-input-group">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (min 6 chars)"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            minLength="6"
                            className="neon-input"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                                    <path d="M11.297 9.32l.766.766a2.775 2.775 0 0 1-4.31.296l.766-.766.778.779z" />
                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                    <path d="M1.646 2.354l12.793 12.793a.5.5 0 0 1-.707.707L.939 3.061a.5.5 0 0 1 .707-.707z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        required
                        minLength="6"
                        className="neon-input"
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={onCaptchaChange}
                            size="normal"
                            theme="dark"
                        />
                    </div>
                </div>

                <button type="submit" className="btn-neon primary w-100 mt-2" disabled={isLoading} style={{ width: '100%' }}>
                    {isLoading ? "Registering..." : "Create Account"}
                </button>
            </form>

            <div className="auth-switch-mobile">
                <p>Already have an account? <button type="button" className="link-btn" onClick={onSwitch}>Log In</button></p>
            </div>
        </div>
    );
};

export default Register;
