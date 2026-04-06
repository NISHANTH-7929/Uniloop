import Order from "../models/Order.js";
import { getIO } from "../utils/socketUtils.js";

/**
 * @desc    Create a group order
 * @route   POST /api/dormdash/orders/group
 * @access  Private
 */
export const createGroup = async (req, res) => {
  try {
    // A group order is created with charge = 0 initially to hide it from dasher feed
    const newOrder = await Order.create({
      ...req.body,
      requester: req.user._id,
      isGroupOrder: true,
      charge: 0, 
      groupMembers: [
        {
          user: req.user._id,
          items: req.body.items || [],
          shareCharge: req.body.shareCharge || 0
        }
      ]
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @desc    Join an existing group order
 * @route   PATCH /api/dormdash/orders/group/:id/join
 * @access  Private
 */
export const joinGroup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    
    // Check if user is already in the group
    const alreadyMember = order.groupMembers.find(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: "Already in this group order" });

    // Ensure order is group order and not published yet
    if (!order.isGroupOrder || order.charge > 0) {
      return res.status(400).json({ success: false, message: "Cannot join this order" });
    }

    const { items, shareCharge } = req.body;
    order.groupMembers.push({ user: req.user._id, items, shareCharge });
    
    // Add items to main order list
    if (items && Array.isArray(items)) {
      order.items.push(...items);
    }

    await order.save();

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @desc    Host closes group and publishes to dasher feed
 * @route   PATCH /api/dormdash/orders/group/:id/close
 * @access  Private
 */
export const closeGroup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the host can close the group order" });
    }

    if (!order.isGroupOrder || order.charge > 0) {
      return res.status(400).json({ success: false, message: "Order already closed or not a group order" });
    }

    // Set final charge to the sum of all members' shares, or provided total
    const { finalCharge } = req.body;
    if (!finalCharge || finalCharge <= 0) {
       return res.status(400).json({ success: false, message: "Valid final charge required to close group order" });
    }

    order.charge = finalCharge;
    await order.save();

    // Broadcast to online dashers
    const io = getIO();
    io.emit("order:new", order);

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
