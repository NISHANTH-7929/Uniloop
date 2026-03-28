import axios from "axios";

// Create Axios instance – use relative path so the Vite dev proxy forwards to the backend
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "http://localhost:5000";
const api = axios.create({
    baseURL: API_BASE.startsWith('http') ? `${API_BASE}/api/auth` : '/api/auth',
    withCredentials: true, // Important for cookies (refresh token)
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            // Skip silent refresh for auth endpoints themselves to avoid infinite loops
            const authEndpoints = ['/login', '/register', '/refresh', '/verify'];
            const reqUrl = originalRequest.url || '';
            if (authEndpoints.some(ep => reqUrl.includes(ep))) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            try {
                const res = await api.post('/refresh');
                const { accessToken } = res.data;
                localStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
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
