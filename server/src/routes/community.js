import express from "express";
import { protect } from "../middleware/authMiddleware.js";


// Controllers
import * as lostFound        from "../controllers/lostFoundController.js";
import * as emergency        from "../controllers/emergencyController.js";
import * as tutoring         from "../controllers/tutoringController.js";
import * as skills           from "../controllers/skillExchangeController.js";
import * as qa               from "../controllers/qaController.js";
import * as complaints       from "../controllers/complaintController.js";
import * as notices          from "../controllers/noticeController.js";
import * as profile          from "../controllers/communityProfileController.js";
import { createUploader }    from "../middleware/uploadMiddleware.js";

const router = express.Router();

const lfUploader        = createUploader('lostfound');
const complaintUploader = createUploader('complaints');
const qaUploader        = createUploader('qa');
const noticeUploader    = createUploader('notices');

// ─── Lost & Found ───────────────────────────────────────────────────────────
router.post(  "/lostfound",                  protect, lfUploader.single("image"), lostFound.createItem);
router.get(   "/lostfound",                  protect, lostFound.getItems);
router.get(   "/lostfound/my",               protect, lostFound.getMyItems);
router.get(   "/lostfound/:id",              protect, lostFound.getItem);
router.post(  "/lostfound/:id/claim",        protect, lostFound.claimItem);
router.post(  "/lostfound/:id/report-found", protect, lfUploader.single("image"), lostFound.reportFound);
router.patch( "/lostfound/:id/confirm-claim",protect, lostFound.confirmClaim);
router.post(  "/lostfound/:id/review",       protect, lostFound.submitReview);
router.get(   "/lostfound/:id/review",       protect, lostFound.getReview);

// ─── Emergency Network ───────────────────────────────────────────────────────
router.post(  "/emergency",                               protect, emergency.createEmergency);
router.get(   "/emergency",                               protect, emergency.getEmergencies);
router.get(   "/emergency/:id",                           protect, emergency.getEmergency);
router.post(  "/emergency/:id/respond",                   protect, emergency.respondToEmergency);
router.patch( "/emergency/:id/confirm/:responderId",      protect, emergency.confirmResponder);
router.patch( "/emergency/:id/resolve",                   protect, emergency.resolveEmergency);

// ─── Peer Tutoring ───────────────────────────────────────────────────────────
router.post(  "/tutoring",                protect, tutoring.createSession);
router.get(   "/tutoring",                protect, tutoring.getSessions);
router.get(   "/tutoring/:id",            protect, tutoring.getSession);
router.patch( "/tutoring/:id/match",      protect, tutoring.matchSession);
router.patch( "/tutoring/:id/schedule",   protect, tutoring.scheduleSession);
router.patch( "/tutoring/:id/complete",   protect, tutoring.completeSession);
router.patch( "/tutoring/:id/cancel",     protect, tutoring.cancelSession);
router.post(  "/tutoring/:id/review",     protect, tutoring.submitReview);
router.get(   "/tutoring/:id/review",     protect, tutoring.getReview);

// ─── Skill Exchange ──────────────────────────────────────────────────────────
router.post(  "/skills",              protect, skills.createSkill);
router.get(   "/skills",              protect, skills.getSkills);
router.get(   "/skills/:id",          protect, skills.getSkill);
router.patch( "/skills/:id/match",    protect, skills.matchSkill);
router.patch( "/skills/:id/complete", protect, skills.completeSkill);
router.patch( "/skills/:id/cancel",   protect, skills.cancelSkill);
router.post(  "/skills/:id/review",   protect, skills.submitReview);
router.get(   "/skills/:id/review",   protect, skills.getReview);

// ─── Academic Q&A ───────────────────────────────────────────────────────────
router.post(  "/qa",                                   protect, qaUploader.single("image"), qa.createQuestion);
router.get(   "/qa",                                   protect, qa.getQuestions);
router.get(   "/qa/:id",                               protect, qa.getQuestion);
router.post(  "/qa/:id/answer",                        protect, qaUploader.single("image"), qa.postAnswer);
router.patch( "/qa/:id/answer/:answerId/upvote",       protect, qa.toggleUpvote);
router.patch( "/qa/:id/solve/:answerId",               protect, qa.markSolved);
router.delete("/qa/:id",                               protect, qa.deleteQuestion);
router.delete("/qa/:id/answer/:answerId",              protect, qa.deleteAnswer);

// ─── Complaint Box ───────────────────────────────────────────────────────────
router.post(  "/complaints",              protect, complaintUploader.single("image"), complaints.createComplaint);
router.get(   "/complaints",              protect, complaints.getComplaints);
router.get(   "/complaints/my",           protect, complaints.getMyComplaints);
router.get(   "/complaints/:id",          protect, complaints.getComplaint);
router.patch( "/complaints/:id/metoo",    protect, complaints.toggleMeToo);
router.patch( "/complaints/:id/respond",  protect, complaints.adminRespond);

// ─── Campus Notices ──────────────────────────────────────────────────────────
router.post(  "/notices",           protect, noticeUploader.single("image"), notices.createNotice);
router.get(   "/notices",           protect, notices.getNotices);
router.get(   "/notices/:id",       protect, notices.getNotice);
router.delete("/notices/:id",       protect, notices.deleteNotice);
router.patch( "/notices/:id/pin",   protect, notices.pinNotice);

// ─── Community Profile ───────────────────────────────────────────────────────
router.get("/profile/:userId", protect, profile.getCommunityProfile);

export default router;
