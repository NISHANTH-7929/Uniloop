import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "http://localhost:5000";

const api = axios.create({
    baseURL: API_BASE.startsWith("http") ? `${API_BASE}/api/community` : "/api/community",
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Lost & Found ────────────────────────────────────────────────────────────
export const getLostFoundItems  = (params) => api.get("/lostfound", { params });
export const getMyLostFoundItems= ()       => api.get("/lostfound/my");
export const getLostFoundItem   = (id)     => api.get(`/lostfound/${id}`);
export const createLostFoundItem= (data)   => api.post("/lostfound", data);
export const claimItem          = (id, data)=> api.post(`/lostfound/${id}/claim`, data);
export const confirmClaim       = (id)     => api.patch(`/lostfound/${id}/confirm-claim`);
export const submitLFReview     = (id, data)=> api.post(`/lostfound/${id}/review`, data);
export const getLFReview        = (id)     => api.get(`/lostfound/${id}/review`);

// ─── Emergency ───────────────────────────────────────────────────────────────
export const getEmergencies     = (params) => api.get("/emergency", { params });
export const getEmergency       = (id)     => api.get(`/emergency/${id}`);
export const createEmergency    = (data)   => api.post("/emergency", data);
export const respondToEmergency = (id, data)=> api.post(`/emergency/${id}/respond`, data);
export const confirmResponder   = (id, rId)=> api.patch(`/emergency/${id}/confirm/${rId}`);
export const resolveEmergency   = (id)     => api.patch(`/emergency/${id}/resolve`);

// ─── Tutoring ────────────────────────────────────────────────────────────────
export const getTutoringSessions = (params)=> api.get("/tutoring", { params });
export const getTutoringSession  = (id)    => api.get(`/tutoring/${id}`);
export const createTutoringSession=(data)  => api.post("/tutoring", data);
export const matchTutoringSession = (id)   => api.patch(`/tutoring/${id}/match`);
export const scheduleTutoringSession=(id,d)=> api.patch(`/tutoring/${id}/schedule`, d);
export const completeTutoringSession=(id)  => api.patch(`/tutoring/${id}/complete`);
export const cancelTutoringSession  =(id)  => api.patch(`/tutoring/${id}/cancel`);
export const submitTutoringReview   =(id,d)=> api.post(`/tutoring/${id}/review`, d);
export const getTutoringReview      =(id)  => api.get(`/tutoring/${id}/review`);

// ─── Skills ──────────────────────────────────────────────────────────────────
export const getSkills       = (params)=> api.get("/skills", { params });
export const getSkill        = (id)    => api.get(`/skills/${id}`);
export const createSkill     = (data)  => api.post("/skills", data);
export const matchSkill      = (id)    => api.patch(`/skills/${id}/match`);
export const completeSkill   = (id)    => api.patch(`/skills/${id}/complete`);
export const cancelSkill     = (id)    => api.patch(`/skills/${id}/cancel`);
export const submitSkillReview=(id,d)  => api.post(`/skills/${id}/review`, d);
export const getSkillReview  = (id)    => api.get(`/skills/${id}/review`);

// ─── Q&A ─────────────────────────────────────────────────────────────────────
export const getQAQuestions  = (params)=> api.get("/qa", { params });
export const getQAQuestion   = (id)    => api.get(`/qa/${id}`);
export const createQAQuestion= (data)  => api.post("/qa", data);
export const postAnswer      = (id,d)  => api.post(`/qa/${id}/answer`, d);
export const toggleUpvote    = (id,aId)=> api.patch(`/qa/${id}/answer/${aId}/upvote`);
export const markSolved      = (id,aId)=> api.patch(`/qa/${id}/solve/${aId}`);
export const deleteQuestion  = (id)    => api.delete(`/qa/${id}`);
export const deleteAnswer    = (id,aId)=> api.delete(`/qa/${id}/answer/${aId}`);

// ─── Complaints ──────────────────────────────────────────────────────────────
export const getComplaints    = (params)=> api.get("/complaints", { params });
export const getMyComplaints  = ()      => api.get("/complaints/my");
export const getComplaint     = (id)    => api.get(`/complaints/${id}`);
export const createComplaint  = (data)  => api.post("/complaints", data);
export const toggleMeToo      = (id)    => api.patch(`/complaints/${id}/metoo`);
export const adminRespondComplaint=(id,d)=> api.patch(`/complaints/${id}/respond`, d);

// ─── Mental Health ───────────────────────────────────────────────────────────
export const logMood          = (data)  => api.post("/mentalhealth/log", data);
export const getMoodLogs      = ()      => api.get("/mentalhealth/log");
export const getMoodTrend     = ()      => api.get("/mentalhealth/trend");
export const getCounselorSlots= ()      => api.get("/mentalhealth/slots");
export const bookCounselorSlot= (data)  => api.post("/mentalhealth/book", data);
export const getMyBookings    = ()      => api.get("/mentalhealth/bookings");

// ─── Notices ─────────────────────────────────────────────────────────────────
export const getNotices     = (params)=> api.get("/notices", { params });
export const getNotice      = (id)    => api.get(`/notices/${id}`);
export const createNotice   = (data)  => api.post("/notices", data);
export const deleteNotice   = (id)    => api.delete(`/notices/${id}`);
export const pinNotice      = (id)    => api.patch(`/notices/${id}/pin`);

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getCommunityProfile = (userId) => api.get(`/profile/${userId}`);
