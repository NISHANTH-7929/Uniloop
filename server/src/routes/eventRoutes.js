import express from "express";
import {
    createEvent, getEvents, getEventById, updateEvent, deleteEvent,
    assignVolunteer, getEventAttendees, getUsersForRecruitment,
    sendVolunteerRequest, sendPartOrganizerRequest, addSubevent, addEventUpdate,
    requestVolunteerWithdrawal, handleWithdrawalResponse,
    getVolunteerDetails, removeVolunteer,
    getSubeventDetails, updateSubevent, addSubeventUpdate
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .post(protect, createEvent)
    .get(protect, getEvents);

router.route("/:id")
    .get(protect, getEventById)
    .put(protect, updateEvent)
    .delete(protect, deleteEvent);

router.get("/:id/attendees", protect, getEventAttendees);
router.post("/:id/volunteers", protect, assignVolunteer); // Legacy backup or immediate promote

router.post("/:id/subevents", protect, addSubevent);
router.get("/:id/subevents/:subeventId", getSubeventDetails);
router.put("/:id/subevents/:subeventId", protect, updateSubevent);
router.post("/:id/subevents/:subeventId/updates", protect, addSubeventUpdate);

router.post("/:id/updates", protect, addEventUpdate);

router.get("/:id/recruitment-students", protect, getUsersForRecruitment);
router.post("/:id/volunteer-requests", protect, sendVolunteerRequest);
router.post("/:id/part-organizer-requests", protect, sendPartOrganizerRequest);

// Volunteer Withdrawal & Management
router.post("/:id/volunteer-withdrawal", protect, requestVolunteerWithdrawal);
router.post("/:id/volunteer-withdrawal-response/:notificationId", protect, handleWithdrawalResponse);
router.get("/:id/volunteer-details/:volunteerId", protect, getVolunteerDetails);
router.delete("/:id/volunteers/:volunteerId", protect, removeVolunteer);

export default router;
