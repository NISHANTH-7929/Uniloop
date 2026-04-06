import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

// Controllers
import {
  createOrder,
  getOrderFeed,
  getMyOrders,
  getOrderById,
  acceptOrder,
  markPickup,
  markInTransit,
  verifyOTPController,
  cancelOrder,
  confirmOrder,
  completeOrder,
  regenerateOTPController,
  declineDasher
} from "../controllers/orderController.js";

import { toggleOnline, getEarnings } from "../controllers/dasherController.js";
import { createGroup, joinGroup, closeGroup } from "../controllers/groupOrderController.js";
import { getItems, addItem, updateItem, deleteItem } from "../controllers/canteenController.js";
import { submitReview, getReview } from "../controllers/reviewController.js";

const router = express.Router();

// --- Orders ---
router.post("/orders", protect, createOrder);
router.get("/orders/feed", protect, getOrderFeed);
router.get("/orders/my", protect, getMyOrders);
router.get("/orders/:id", protect, getOrderById);
router.patch("/orders/:id/accept", protect, acceptOrder);
router.patch("/orders/:id/confirm", protect, confirmOrder);
router.patch("/orders/:id/pickup", protect, markPickup);
router.patch("/orders/:id/complete", protect, completeOrder);
router.patch("/orders/:id/intransit", protect, markInTransit);
router.post("/orders/:id/otp/verify", protect, verifyOTPController);
router.patch("/orders/:id/regenerate-otp", protect, regenerateOTPController);
router.patch("/orders/:id/cancel", protect, cancelOrder);
router.patch("/orders/:id/decline", protect, declineDasher);

// --- Reviews ---
router.post("/orders/:id/review", protect, submitReview);
router.get("/orders/:id/review", protect, getReview);

// --- Group Orders ---
router.post("/orders/group", protect, createGroup);
router.patch("/orders/group/:id/join", protect, joinGroup);
router.patch("/orders/group/:id/close", protect, closeGroup);

// --- Dasher ---
router.patch("/dasher/toggle", protect, toggleOnline);
router.get("/dasher/earnings", protect, getEarnings);

// --- Canteen Menu ---
router.get("/canteen/items", getItems); // [PUBLIC]
router.post("/canteen/items", protect, addItem); // [ADMIN]
router.patch("/canteen/items/:id", protect, updateItem); // [ADMIN]
router.delete("/canteen/items/:id", protect, deleteItem); // [ADMIN]

// --- Profile ---
router.get("/profile/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name avatar dormDash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
