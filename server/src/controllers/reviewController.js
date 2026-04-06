import Review from '../models/Review.js';
import User from '../models/User.js';
import TradeRequest from '../models/TradeRequest.js';
import Order from '../models/Order.js';
import { getIO } from '../utils/socketUtils.js';
import { checkAndAwardBadges } from '../utils/badgeUtils.js';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
    try {
        const { tradeId, rating, comment, type } = req.body;

        if (!tradeId || !rating || !type) {
            return res.status(400).json({ message: 'Trade ID, rating, and type are required' });
        }

        // Validate trade
        const trade = await TradeRequest.findById(tradeId);

        if (!trade) {
            return res.status(404).json({ message: 'Trade not found' });
        }

        if (trade.status !== 'completed' && trade.status !== 'accepted') {
            return res.status(400).json({ message: 'Can only review completed or fully accepted trades' });
        }

        // Determine who is reviewing who based on 'type'
        // type: "buyer", "seller", "borrower", "lender" - indicates the role of the person BEING reviewed
        let revieweeId;

        if (trade.requester.toString() === req.user._id.toString()) {
            // Requester is reviewing owner
            revieweeId = trade.owner;
        } else if (trade.owner.toString() === req.user._id.toString()) {
            // Owner is reviewing requester
            revieweeId = trade.requester;
        } else {
            return res.status(403).json({ message: 'You are not part of this trade' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            trade: tradeId,
            reviewer: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this trade' });
        }

        const review = await Review.create({
            trade: tradeId,
            reviewer: req.user._id,
            reviewee: revieweeId,
            rating,
            comment,
            type
        });

        // Update the average rating on the reviewee
        const allReviews = await Review.find({ reviewee: revieweeId });
        const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;

        // Recalculate simple Trust factor (can be adjusted with formula later)
        const newTrustScore = Math.min(100, Math.max(0, 50 + (avgRating * 10)));

        await User.findByIdAndUpdate(revieweeId, {
            averageRating: Number(avgRating.toFixed(1)),
            trustScore: Number(newTrustScore.toFixed(0))
        });

        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'email trustScore')
            .populate('trade', 'type status')
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Submit a review for a DormDash order
 * @route   POST /api/dormdash/orders/:id/review
 * @access  Private
 */
export const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Valid rating (1-5) is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (!['delivered', 'COMPLETED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Can only review delivered or completed orders" });
    }

    const userId = req.user._id.toString();
    const requesterId = order.requester.toString();
    const dasherId = order.dasher?.toString();

    if (userId === requesterId) {
      if (order.dasherReview?.submitted) return res.status(400).json({ success: false, message: "Review already submitted" });
      order.dasherReview = { rating, comment, submitted: true };
    } else if (userId === dasherId) {
      if (order.requesterReview?.submitted) return res.status(400).json({ success: false, message: "Review already submitted" });
      order.requesterReview = { rating, comment, submitted: true };
    } else {
      return res.status(403).json({ success: false, message: "Not authorized to review this order" });
    }

    // Check if both submitted
    if (order.dasherReview?.submitted && order.requesterReview?.submitted) {
      order.reviewsRevealed = true;

      // Update rated users' dormDash.ratings
      const dasherUser = await User.findById(dasherId);
      const requesterUser = await User.findById(requesterId);

      if (dasherUser?.dormDash) {
        dasherUser.dormDash.ratings.asDasher.total += order.dasherReview.rating;
        dasherUser.dormDash.ratings.asDasher.count += 1;
        checkAndAwardBadges(dasherUser);
        await dasherUser.save();
      }

      if (requesterUser?.dormDash) {
        requesterUser.dormDash.ratings.asRequester.total += order.requesterReview.rating;
        requesterUser.dormDash.ratings.asRequester.count += 1;
        checkAndAwardBadges(requesterUser);
        await requesterUser.save();
      }

      await order.save();

      // Emit socket event to both users
      const io = getIO();
      const payload = { 
        orderId: order._id,
        dasherReview: order.dasherReview,
        requesterReview: order.requesterReview 
      };
      io.to(requesterId).emit("review:revealed", payload);
      io.to(dasherId).emit("review:revealed", payload);

      return res.status(200).json({ success: true, message: "Review submitted. Both reviews are now revealed", data: payload });
    }

    await order.save();
    return res.status(200).json({ success: true, message: "Review submitted. Waiting for the other party." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get revealed review (only if both submitted)
 * @route   GET /api/dormdash/orders/:id/review
 * @access  Private
 */
export const getReview = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const userId = req.user._id.toString();
    if (userId !== order.requester.toString() && userId !== order.dasher?.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view these reviews" });
    }

    if (order.reviewsRevealed) {
      return res.status(200).json({
        success: true,
        data: {
          dasherReview: order.dasherReview,
          requesterReview: order.requesterReview
        }
      });
    } else {
      return res.status(200).json({ success: true, waiting: true, message: "Waiting for the other party to review." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
