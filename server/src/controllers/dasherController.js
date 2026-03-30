import User from "../models/User.js";
import Order from "../models/Order.js";
import { getIO } from "../utils/socketUtils.js";

/**
 * @desc    Toggle dasher online/offline status
 * @route   PATCH /api/dormdash/dasher/toggle
 * @access  Private
 */
export const toggleOnline = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.dormDash) {
      user.dormDash = {};
    }

    const newStatus = req.body.isOnline;
    user.dormDash.isOnline = newStatus;
    // Turn on Dasher mode if going online
    if (newStatus) {
      user.dormDash.dasherMode = true;
    }
    await user.save();

    // Broadcast dasher online status if they came online
    if (newStatus) {
      const io = getIO();
      // Notify requesters of open orders that a dasher became online
      // We broadcast to everyone for simplicity, frontend handles it
      io.emit("dasher:online", { dasherId: user._id, name: user.name });
    }

    res.status(200).json({ success: true, isOnline: user.dormDash.isOnline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get earnings log for dasher
 * @route   GET /api/dormdash/dasher/earnings
 * @access  Private
 */
export const getEarnings = async (req, res) => {
  try {
    const orders = await Order.find({
      dasher: req.user._id,
      status: "delivered"
    }).sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
