import Review from '../models/Review.js';
import User from '../models/User.js';
import TradeRequest from '../models/TradeRequest.js';

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
