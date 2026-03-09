import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "";
const api = axios.create({
    baseURL: API_BASE.startsWith('http') ? `${API_BASE}/api/admin` : '/api/admin',
    withCredentials: true,
});

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

// Response interceptor to handle token refresh automatically
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
                const { accessToken } = res.data;

                localStorage.setItem("accessToken", accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const getAllUsers = () => api.get("/users");
export const assignOrganizerRole = (userId, payload) => api.put(`/users/${userId}/organizer`, payload);
export const demoteOrganizerRole = (userId) => api.put(`/users/${userId}/demote`);
export const resetTestData = () => api.post("/reset");

export default api;
