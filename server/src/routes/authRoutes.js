import express from "express";
import { register, verifyEmail, login, refresh, logout, forgotPassword, resetPassword, getNotifications, respondToVolunteerRequest, markNotificationsAsRead } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.get("/notifications", protect, getNotifications);
router.post("/notifications/read", protect, markNotificationsAsRead);
router.post("/notifications/:id/respond", protect, respondToVolunteerRequest);

export default router;
