import axios from "axios";

// Create Axios instance – use relative path so the Vite dev proxy forwards to the backend correctly along with token
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "http://localhost:5000";
const api = axios.create({
    baseURL: API_BASE.startsWith('http') ? `${API_BASE}/api` : '/api',
    withCredentials: true,
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
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // If token expired, UI handles refresh logic in AuthApi, so we can try triggering a refresh endpoint
                // or just fail so UI redirect happens. We will attempt a standard refresh.
                const authApiBase = API_BASE.startsWith('http') ? `${API_BASE}/api/auth` : '/api/auth';
                const res = await axios.post(`${authApiBase}/refresh`, {}, { withCredentials: true });
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

export default api;
