import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URI || "http://localhost:5000";
const API = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const submitReview = (data) => API.post('/reviews', data);
export const getUserReviews = (userId) => API.get(`/reviews/user/${userId}`);
