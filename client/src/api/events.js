import axios from "axios";

// Setup base instance with auth token interceptor
// Use Vite env var `VITE_API_URL` when provided, otherwise default to relative `/api`.
// Using a relative path allows the dev server proxy (or same-origin in production)
// to forward requests to the backend and makes the app accessible from mobile devices.
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "";
const API = axios.create({
    baseURL: API_BASE.startsWith('http') ? `${API_BASE}/api` : '/api',
    withCredentials: true
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Refresh endpoint is at /api/auth/refresh
                const refreshBase = API.defaults.baseURL.endsWith('/api') ?
                    API.defaults.baseURL + '/auth/refresh' :
                    API.defaults.baseURL + '/api/auth/refresh';

                const res = await axios.post(refreshBase, {}, { withCredentials: true });
                const { accessToken } = res.data;
                localStorage.setItem("accessToken", accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return API(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

// Event APIs
export const fetchEvents = () => API.get("/events");
export const createEvent = (eventData) => API.post("/events", eventData);
export const getEvent = (id) => API.get(`/events/${id}`);
export const updateEvent = (id, eventData) => API.put(`/events/${id}`, eventData);
export const deleteEvent = (id) => API.delete(`/events/${id}`);
export const assignVolunteer = (eventId, rollNumberOrEmail) => API.post(`/events/${eventId}/volunteers`, { rollNumberOrEmail });
export const fetchEventAttendees = (eventId) => API.get(`/events/${eventId}/attendees`);
export const getUsersForRecruitment = (eventId) => API.get(`/events/${eventId}/recruitment-students`);
export const sendVolunteerRequest = (eventId, targetUserId) => API.post(`/events/${eventId}/volunteer-requests`, { targetUserId });
export const sendPartOrganizerRequest = (eventId, targetUserId) => API.post(`/events/${eventId}/part-organizer-requests`, { targetUserId });
export const addSubevent = (eventId, payload) => API.post(`/events/${eventId}/subevents`, payload);
export const addEventUpdate = (eventId, payload) => API.post(`/events/${eventId}/updates`, payload);
export const requestVolunteerWithdrawal = (eventId) => API.post(`/events/${eventId}/volunteer-withdrawal`);
export const handleWithdrawalResponse = (eventId, notificationId, response) => API.post(`/events/${eventId}/volunteer-withdrawal-response/${notificationId}`, { response });
export const getVolunteerDetails = (eventId, volunteerId) => API.get(`/events/${eventId}/volunteer-details/${volunteerId}`);
export const removeVolunteerFromEvent = (eventId, volunteerId) => API.delete(`/events/${eventId}/volunteers/${volunteerId}`);

// Ticket APIs
export const registerEvent = (eventId, persons, alias, subeventId) => API.post(`/tickets/${eventId}`, { persons, alias, subeventId });
export const getMyTickets = (eventId = null) => API.get("/tickets/my-tickets", { params: { eventId } });
export const deleteTicket = (id) => API.delete(`/tickets/${id}`);
export const verifyTicketQR = (qr_token) => API.post("/tickets/verify-qr", { qr_token });
export const checkinTicket = (qr_token) => API.post("/tickets/checkin", { qr_token });
export const getEventStats = (eventId) => API.get(`/tickets/stats/${eventId}`);
export const getVolunteerStats = (eventId, volunteerId) => API.get(`/tickets/stats/${eventId}/volunteer/${volunteerId}`);

// Notification APIs
export const getNotifications = () => API.get("/auth/notifications");
export const markNotificationsAsRead = () => API.post("/auth/notifications/read");
export const respondToVolunteerRequest = (notificationId, response) => API.post(`/auth/notifications/${notificationId}/respond`, { response });

