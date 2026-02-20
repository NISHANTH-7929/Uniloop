import axios from "axios";

// Create Axios instance
const API_BASE = import.meta.env.VITE_API_URI || "http://localhost:5000";
const api = axios.create({
    baseURL: `${API_BASE}/api/auth`,
    withCredentials: true, // Important for cookies (refresh token)
});

// Request interceptor to add Access Token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 Unauthorized and not already retried
        if (error.response.status === 401 && !originalRequest._retry) {
            // Do not attempt silent refresh for auth endpoints themselves.
            // Let callers handle auth-related errors like "Please verify your email first".
            const authEndpoints = ["/login", "/register", "/refresh", "/verify"];
            const reqUrl = originalRequest.url || "";
            if (authEndpoints.some(ep => reqUrl.includes(ep))) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                const res = await api.post("/refresh");
                const { accessToken } = res.data;

                // Save new token
                localStorage.setItem("accessToken", accessToken);

                // Update header and retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                // If refresh fails, redirect to login
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const registerUser = (userData) => api.post("/register", userData);
export const verifyEmail = (token) => api.get(`/verify/${token}`);
export const loginUser = (userData) => api.post("/login", userData);
export const logoutUser = () => api.post("/logout");

export const forgotPassword = (email) => api.post("/forgot-password", { email });
export const resetPassword = (token, password) => api.post(`/reset-password/${token}`, { password });

export default api;
