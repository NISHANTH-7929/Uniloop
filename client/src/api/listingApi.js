import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URI || "http://localhost:5000";
const API = axios.create({
    baseURL: `${API_BASE}/api`, // Adjust in prod or proxy
    withCredentials: true // send cookies
});

// Needed if token is added via interceptor later, but for now assuming cookie or same domain
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const fetchListings = (params) => API.get('/listings', { params });
export const fetchListingById = (id) => API.get(`/listings/${id}`);
export const createListing = (data) => API.post('/listings', data);
export const updateListing = (id, data) => API.put(`/listings/${id}`, data);
export const deleteListing = (id) => API.delete(`/listings/${id}`);

export const fetchCategories = () => API.get('/directory/categories');
export const fetchLocations = () => API.get('/directory/locations');
