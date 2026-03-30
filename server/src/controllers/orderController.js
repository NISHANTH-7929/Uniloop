import Order from "../models/Order.js";
import User from "../models/User.js";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otpUtils.js";
import { getIO } from "../utils/socketUtils.js";

/**
 * @desc    Create new order
 * @route   POST /api/dormdash/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, requester: req.user._id });
    const io = getIO();
    io.emit("order:new", order);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Dasher feed: open orders near pickup location
 * @route   GET /api/dormdash/orders/feed
 * @access  Private
 */
export const getOrderFeed = async (req, res) => {
  try {
    // Only fetch orders that are open and published (charge > 0 protects forming group orders from appearing)
    const orders = await Order.find({ status: "open", charge: { $gt: 0 } })
      .populate("requester", "name avatar dormDash.ratings dormDash.badges")
      .select("-otpHash -groupMembers")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    All orders where user is requester OR dasher
 * @route   GET /api/dormdash/orders/my
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ requester: req.user._id }, { dasher: req.user._id }]
    })
      .populate("requester", "name avatar")
      .populate("dasher", "name avatar")
      .select("-otpHash")
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Single order detail
 * @route   GET /api/dormdash/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("requester", "name avatar email")
      .populate("dasher", "name avatar email")
      .populate("groupMembers.user", "name avatar email");
      
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Strip sensitive fields
    const safeOrder = order.toObject();
    delete safeOrder.otpHash;
    
    // Only requester see the plain text OTP
    const isRequester = req.user._id.toString() === order.requester._id.toString();
    if (!isRequester) {
      delete safeOrder.otpCode;
    }

    res.status(200).json({ success: true, data: safeOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Dasher accepts order
 * @route   PATCH /api/dormdash/orders/:id/accept
 * @access  Private
 */
export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "open") {
      return res.status(409).json({ success: false, message: "Order already taken" });
    }

    if (order.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot dash your own order" });
    }

    order.dasher = req.user._id;
    order.status = "ACCEPTED_BY_DASHER";
    order.acceptedAt = new Date();
    await order.save();

    const io = getIO();
    io.to(order.requester.toString()).emit("order:accepted", order);
    io.to(order.dasher.toString()).emit("order:accepted", order);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Dasher marks picked up
 * @route   PATCH /api/dormdash/orders/:id/pickup
 * @access  Private
 */
export const markPickup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (!["accepted", "ACCEPTED_BY_DASHER", "CONFIRMED_BY_USER"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Invalid status transition" });
    }

    if (order.dasher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (req.body.photoProofUrl) {
      order.photoProofUrl = req.body.photoProofUrl;
    }
    
    order.status = "picked_up";
    await order.save();

    const io = getIO();
    io.to(order.requester.toString()).emit("order:pickedup", order);
    io.to(order.dasher.toString()).emit("order:pickedup", order);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Dasher marks in transit
 * @route   PATCH /api/dormdash/orders/:id/intransit
 * @access  Private
 */
export const markInTransit = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "picked_up") {
      return res.status(400).json({ success: false, message: "Invalid status transition" });
    }
    if (order.dasher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    order.status = "in_transit";

    // Generate, hash, store OTP
    const rawOtp = generateOTP();
    order.otpHash = await hashOTP(rawOtp);
    order.otpCode = rawOtp; // Persist for requester recovery
    await order.save();

    const io = getIO();
    // Notify both for state sync
    io.to(order.requester.toString()).emit("order:intransit", order);
    io.to(order.dasher.toString()).emit("order:intransit", order);
    
    // Specifically notify requester about the plain text OTP if they are connected
    io.to(order.requester.toString()).emit("otp:generated", { otp: rawOtp, orderId: order._id });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const otpAttemptsMap = {};

/**
 * @desc    Dasher submits OTP to confirm delivery
 * @route   POST /api/dormdash/orders/:id/otp/verify
 * @access  Private
 */
export const verifyOTPController = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "in_transit") {
      return res.status(400).json({ success: false, message: "Invalid status transition" });
    }
    if (order.dasher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

    const attemptKey = `otp_attempts_${order._id}`;
    otpAttemptsMap[attemptKey] = otpAttemptsMap[attemptKey] || 0;

    if (otpAttemptsMap[attemptKey] >= 5) {
      return res.status(423).json({ success: false, message: "Order locked after too many OTP attempts" });
    }

    const isValid = await verifyOTP(otp, order.otpHash);
    if (!isValid) {
      otpAttemptsMap[attemptKey] += 1;
      return res.status(400).json({ success: false, message: "Incorrect OTP", attempts: otpAttemptsMap[attemptKey] });
    }

    // Success
    delete otpAttemptsMap[attemptKey];
    order.status = "delivered";
    order.otpCode = null; // Clear OTP once delivered

    // Update orders completed for requester and dasher
    const dasherUser = await User.findById(order.dasher);
    const requesterUser = await User.findById(order.requester);
    if (dasherUser?.dormDash) {
      dasherUser.dormDash.ordersCompleted += 1;
      await dasherUser.save();
    }
    if (requesterUser?.dormDash) {
      requesterUser.dormDash.ordersCompleted += 1;
      await requesterUser.save();
    }

    await order.save();

    const io = getIO();
    io.to(order.requester.toString()).emit("order:delivered", order);
    io.to(order.dasher.toString()).emit("order:delivered", order);

    res.status(200).json({ success: true, message: "Delivery confirmed", data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Cancel order
 * @route   PATCH /api/dormdash/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "open" && order.status !== "ACCEPTED_BY_DASHER") {
      return res.status(400).json({ success: false, message: "Cannot cancel order at this stage" });
    }

    const isRequester = order.requester.toString() === req.user._id.toString();
    const isDasher = order.dasher?.toString() === req.user._id.toString();

    if (!isRequester && !isDasher) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel" });
    }

    // "accepted -> cancelled (either party within 5 min of acceptance only)"
    // The timestamp checking is omitted for simplicity or could be added here
    if (order.status === "accepted") {
      const msSinceAccepted = Date.now() - new Date(order.updatedAt).getTime();
      if (msSinceAccepted > 5 * 60 * 1000) {
        return res.status(400).json({ success: false, message: "Cannot cancel 5 minutes after acceptance" });
      }
    }

    order.status = "cancelled";
    await order.save();

    const io = getIO();
    io.to(order.requester.toString()).emit("order:cancelled", order);
    if (order.dasher) {
      io.to(order.dasher.toString()).emit("order:cancelled", order);
      // Phase 5: Mark chat as read-only on cancellation
      const Conversation = (await import('../models/Conversation.js')).default;
      const conversation = await Conversation.findOneAndUpdate(
        { threadType: 'dormdash', referenceId: order._id },
        { $set: { isReadOnly: true } },
        { new: true }
      );
      if (conversation) {
        io.to(conversation._id.toString()).emit("chat_archived", { conversationId: conversation._id });
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Requester confirms Dasher (2-way handshake)
 * @route   PATCH /api/dormdash/orders/:id/confirm
 * @access  Private
 */
export const confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "ACCEPTED_BY_DASHER") {
      return res.status(400).json({ success: false, message: "Order not pending confirmation" });
    }

    if (order.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only requester can confirm" });
    }

    // 1-minute expiration rule
    const startTime = order.acceptedAt || order.updatedAt;
    const msSinceAccept = Date.now() - new Date(startTime).getTime();
    if (msSinceAccept > 60 * 1000) {
      const lapsedDasherId = order.dasher;
      order.status = "open";
      order.dasher = undefined;
      order.acceptedAt = null;
      await order.save();
      
      const io = getIO();
      if (lapsedDasherId) {
        io.to(lapsedDasherId.toString()).emit("order:cancelled", order);
      }
      return res.status(400).json({ success: false, message: "Request timed out! Over 1 minute passed. Dasher was released back to the general pool." });
    }

    order.status = "CONFIRMED_BY_USER";
    await order.save();

    // Phase 2: Event-Driven Lifecycle Initialization
    const Conversation = (await import('../models/Conversation.js')).default;
    const conversation = await Conversation.create({
      threadType: 'dormdash',
      referenceId: order._id,
      threadModel: 'Order',
      participants: [order.requester, order.dasher]
    });

    const io = getIO();
    io.to(order.dasher.toString()).emit("order:confirmed", order);
    io.to(order.requester.toString()).emit("order:confirmed", order);

    // Return chatThreadId in the payload as requested
    res.status(200).json({ success: true, data: order, chatThreadId: conversation._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Requester declines Dasher's request
 * @route   PATCH /api/dormdash/orders/:id/decline
 * @access  Private
 */
export const declineDasher = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "ACCEPTED_BY_DASHER") {
      return res.status(400).json({ success: false, message: "No pending dasher request to decline" });
    }

    if (order.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only requester can decline a dasher" });
    }

    const declinedDasherId = order.dasher;
    order.status = "open";
    order.dasher = undefined;
    order.acceptedAt = null;
    await order.save();

    const io = getIO();
    if (declinedDasherId) {
      io.to(declinedDasherId.toString()).emit("order:cancelled", order);
    }
    io.to(order.requester.toString()).emit("order:declined", order);

    res.status(200).json({ success: true, message: "Dasher declined. Order is now open again.", data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Requester marks order officially complete
 * @route   PATCH /api/dormdash/orders/:id/complete
 * @access  Private
 */
export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only requester can complete the order" });
    }

    order.status = "COMPLETED";
    await order.save();

    const io = getIO();
    if (order.dasher) {
      io.to(order.dasher.toString()).emit("order:completed", order);
      
      // Phase 5: Mark chat as read-only on completion
      const Conversation = (await import('../models/Conversation.js')).default;
      const conversation = await Conversation.findOneAndUpdate(
        { threadType: 'dormdash', referenceId: order._id },
        { $set: { isReadOnly: true } },
        { new: true }
      );
      if (conversation) {
        io.to(conversation._id.toString()).emit("chat_archived", { conversationId: conversation._id });
      }
    }
    io.to(order.requester.toString()).emit("order:completed", order);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Regenerate OTP for an in-transit order
 * @route   PATCH /api/dormdash/orders/:id/regenerate-otp
 * @access  Private
 */
export const regenerateOTPController = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "in_transit") {
      return res.status(400).json({ success: false, message: "OTP can only be regenerated for in-transit orders" });
    }
    if (order.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only requester can regenerate OTP" });
    }

    const rawOtp = generateOTP();
    order.otpHash = await hashOTP(rawOtp);
    order.otpCode = rawOtp;
    await order.save();

    const io = getIO();
    io.to(order.requester.toString()).emit("otp:generated", { otp: rawOtp, orderId: order._id });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
