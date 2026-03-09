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

export const createTradeRequest = (data) => API.post('/trades', data);
export const fetchTrades = (params) => API.get('/trades', { params });
export const respondToTrade = (id, data) => API.put(`/trades/${id}/respond`, data);

export const fetchBorrows = (params) => API.get('/borrows', { params });
export const confirmReturn = (id) => API.put(`/borrows/${id}/confirm-return`);
export const completeTrade = (id) => API.put(`/trades/${id}/complete`);
