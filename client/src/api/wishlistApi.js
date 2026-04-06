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

// Returns array of wishlist items: { _id, listing: { _id, title, ... } }
export const fetchWishlist = () => API.get('/wishlist');

// Add a listing to wishlist
export const addToWishlist = (listingId) => API.post('/wishlist', { listingId });

// Remove by wishlist doc _id (not listing id)
export const removeFromWishlist = (wishlistItemId) => API.delete(`/wishlist/${wishlistItemId}`);

// Toggle price drop alert for a wishlist item
export const toggleWishlistPriceAlert = (wishlistItemId) => API.patch(`/wishlist/${wishlistItemId}/price-alert`);
