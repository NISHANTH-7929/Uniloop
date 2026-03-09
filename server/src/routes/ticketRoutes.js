import express from "express";
import { registerForEvent, getMyTickets, checkinTicket, getEventStats, verifyTicketQR, getVolunteerStats, deleteTicket } from "../controllers/ticketController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Define specific static routes BEFORE dynamic param routes
router.get("/my-tickets", protect, getMyTickets);
router.post("/checkin", protect, checkinTicket);
router.post("/verify-qr", protect, verifyTicketQR);
// Volunteer-specific stats (organizer/admin or volunteer themself)
router.get("/stats/:eventId/volunteer/:volunteerId", protect, getVolunteerStats);
router.get("/stats/:eventId", protect, getEventStats);
// Dynamic param route LAST
router.post("/:eventId", protect, registerForEvent);
router.delete("/:id", protect, deleteTicket);

export default router;
