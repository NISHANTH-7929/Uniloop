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

export const fetchConversations = () => API.get('/chat/conversations');
export const fetchMessages = (conversationId) => API.get(`/chat/${conversationId}/messages`);
export const sendMessageFallback = (conversationId, data) => API.post(`/chat/${conversationId}/messages`, data);
