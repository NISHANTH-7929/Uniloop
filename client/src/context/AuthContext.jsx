import React, { createContext, useState, useEffect, useContext } from "react";
import api, { loginUser, logoutUser, registerUser } from "../api/authApi";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom"; // AuthContext shouldn't control navigation directly usually, but can.

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true); // Renamed for clarity
    // We can keep a generic 'loading' for actions if we want, or let components handle it.
    // Let's rely on components for action loading to avoid global state conflicts.

    // Check for existing token on load
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("accessToken");

            // Safety timeout
            const timeoutId = setTimeout(() => {
                setInitialLoading(false);
            }, 3000);

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    // Check expiry?
                    if (decoded.exp * 1000 < Date.now()) {
                        // Token expired, try refresh
                        await api.post("/refresh").then(res => {
                            localStorage.setItem("accessToken", res.data.accessToken);
                            const newDecoded = jwtDecode(res.data.accessToken);
                            setUser({ ...newDecoded, ...res.data.user });
                        }).catch(() => {
                            localStorage.removeItem("accessToken");
                            setUser(null);
                        });
                    } else {
                        setUser(decoded);
                    }
                } catch (err) {
                    localStorage.removeItem("accessToken");
                    setUser(null);
                }
            } else {
                // Try silent refresh
                try {
                    const res = await api.post("/refresh");
                    localStorage.setItem("accessToken", res.data.accessToken);
                    const decoded = jwtDecode(res.data.accessToken);
                    setUser(decoded);
                } catch (err) {
                    // No refresh token either
                }
            }
            // Ensure loading is set to false after all checks
            clearTimeout(timeoutId);
            setInitialLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        // No global loading set here, return promise for component to handle
        try {
            const { data } = await loginUser({ email, password });
            localStorage.setItem("accessToken", data.accessToken);
            setUser({ email: data.email, _id: data._id }); // Or decode token
            toast.success("Login successful!");
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed";
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await registerUser(userData);
            toast.success(data.message || "Registration successful!");
            return { success: true, message: data.message };
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed";
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem("accessToken");
            setUser(null);
            toast.info("Logged out successfully");
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const value = {
        user,
        loading: initialLoading, // Expose as 'loading' for ProtectedRoute
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
