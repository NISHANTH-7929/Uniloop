import TradeRequest from '../models/TradeRequest.js';
import Listing from '../models/Listing.js';
import Conversation from '../models/Conversation.js';
import BorrowTracking from '../models/BorrowTracking.js';
import User from '../models/User.js';
import MeetupLocation from '../models/MeetupLocation.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create a trade request
// @route   POST /api/trades
// @access  Private
export const createTradeRequest = async (req, res) => {
    try {
        const { listingId, type, proposedMeetup, proposedPrice, message } = req.body;

        if (!listingId || !type) {
            return res.status(400).json({ message: 'Listing ID and trade type are required' });
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.seller.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot request your own listing' });
        }

        if (listing.status !== 'available') {
            return res.status(400).json({ message: 'Listing is no longer available' });
        }

        // Check if user already has an active request for this listing
        const existingRequest = await TradeRequest.findOne({
            listing: listingId,
            requester: req.user._id,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have an active request for this listing' });
        }

        const tradeRequest = await TradeRequest.create({
            listing: listingId,
            requester: req.user._id,
            owner: listing.seller,
            type,
            proposedMeetup,
            proposedPrice,
            message
        });

        // Notifications logic can be fired here for the owner
        try {
            const owner = await User.findById(listing.seller);
            let meetupText = "a proposed location";
            if (proposedMeetup) {
                const meetup = await MeetupLocation.findById(proposedMeetup);
                if (meetup) meetupText = `${meetup.name} (${meetup.campus})`;
            }

            const emailMessage = `
                <h2>New Trade Request!</h2>
                <p>You have received a new ${type} request for your listing: <b>${listing.title}</b>.</p>
                <p><b>Proposed Meetup Location:</b> ${meetupText}</p>
                ${proposedPrice ? `<p><b>Proposed Price:</b> $${proposedPrice}</p>` : ''}
                <p><b>Message:</b> "${message || 'No additional message'}"</p>
                <p>Log in to your UniLoop Dashboard to accept or reject this request!</p>
            `;

            await sendEmail({
                to: owner.email,
                subject: 'New Uniloop Trade Request',
                text: emailMessage
            });
        } catch (err) {
            console.error("Email sending failed:", err);
        }

        // In-App Notification
        try {
            await Notification.create({
                recipient: listing.seller,
                type: 'trade_request',
                title: 'New Trade Request',
                message: `You have received a new ${type} request for: ${listing.title}`,
                relatedId: tradeRequest._id
            });
        } catch (err) {
            console.error("In-app notification failed:", err);
        }

        res.status(201).json(tradeRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's trade requests (incoming and outgoing)
// @route   GET /api/trades
// @access  Private
export const getTradeRequests = async (req, res) => {
    try {
        const { roleStatus } = req.query; // e.g., 'incoming' or 'outgoing'

        let query = {};

        if (roleStatus === 'incoming') {
            query = { owner: req.user._id };
        } else if (roleStatus === 'outgoing') {
            query = { requester: req.user._id };
        } else {
            query = { $or: [{ owner: req.user._id }, { requester: req.user._id }] };
        }

        let trades = await TradeRequest.find(query)
            .populate('listing', 'title price images listingType status')
            .populate('requester', 'email trustScore averageRating punctualityScore')
            .populate('owner', 'email trustScore averageRating punctualityScore')
            .sort({ createdAt: -1 })
            .lean(); // Use lean() to return plain JS objects so we can easily mutate properties

        // Fetch user's reviews to cross-reference
        const myReviews = await Review.find({ reviewer: req.user._id }).select('trade');
        const myReviewedTradeIds = myReviews.map(r => r.trade.toString());

        trades = trades.map(trade => ({
            ...trade,
            isReviewedByMe: myReviewedTradeIds.includes(trade._id.toString())
        }));

        res.status(200).json(trades);
    } catch (error) {
        console.error("Trade API Error:", error.message, error.stack);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc    Accept or reject a trade request
// @route   PUT /api/trades/:id/respond
// @access  Private
export const respondToTradeRequest = async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status response' });
        }

        const tradeRequest = await TradeRequest.findById(req.params.id)
            .populate('listing');

        if (!tradeRequest) {
            return res.status(404).json({ message: 'Trade request not found' });
        }

        // Only the owner can respond
        if (tradeRequest.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to respond to this request' });
        }

        if (tradeRequest.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${tradeRequest.status}` });
        }

        tradeRequest.status = status;
        await tradeRequest.save();

        if (status === 'accepted') {
            // Update listing status
            const listing = await Listing.findById(tradeRequest.listing._id);
            listing.status = 'pending'; // Mark as pending while trade happens
            await listing.save();

            // Create Conversation channel between the two parties
            const conversationExists = await Conversation.findOne({ tradeRequest: tradeRequest._id });

            if (!conversationExists) {
                await Conversation.create({
                    tradeRequest: tradeRequest._id,
                    participants: [tradeRequest.requester, tradeRequest.owner]
                });
            }

            // Also reject all other pending requests for this listing
            await TradeRequest.updateMany(
                { listing: listing._id, _id: { $ne: tradeRequest._id }, status: 'pending' },
                { $set: { status: 'rejected' } }
            );

            // Handle BorrowTracking if type is 'borrow'
            if (tradeRequest.type === 'borrow') {
                await BorrowTracking.create({
                    tradeRequest: tradeRequest._id,
                    listing: listing._id,
                    borrower: tradeRequest.requester,
                    lender: tradeRequest.owner,
                    status: 'active',
                    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days from now
                });
            }

            // Send Email to Requester
            try {
                const requester = await User.findById(tradeRequest.requester);
                let meetupText = "the agreed location";
                if (tradeRequest.proposedMeetup) {
                    const meetup = await MeetupLocation.findById(tradeRequest.proposedMeetup);
                    if (meetup) meetupText = `${meetup.name} (${meetup.campus})`;
                }

                const emailMessage = `
                    <h2>Trade Request Accepted!</h2>
                    <p>Your ${tradeRequest.type} request for <b>${listing.title}</b> has been accepted!</p>
                    <p><b>Meetup Location:</b> ${meetupText}</p>
                    <p>You can now open your Uniloop Dashboard to chat with the owner and coordinate the exchange.</p>
                `;

                await sendEmail({
                    to: requester.email,
                    subject: 'Trade Request Accepted',
                    text: emailMessage
                });
            } catch (err) {
                console.error("Email sending failed:", err);
            }
        }

        // In-App Notification for Requester
        try {
            await Notification.create({
                recipient: tradeRequest.requester,
                type: status === 'accepted' ? 'trade_accepted' : 'trade_rejected',
                title: `Trade Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your trade request for ${tradeRequest.listing?.title || 'a listing'} has been ${status}.`,
                relatedId: tradeRequest._id
            });
        } catch (err) {
            console.error("In-app notification failed:", err);
        }

        res.status(200).json(tradeRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a trade request
// @route   PUT /api/trades/:id/complete
// @access  Private
export const completeTradeRequest = async (req, res) => {
    try {
        const tradeRequest = await TradeRequest.findById(req.params.id).populate('listing');

        if (!tradeRequest) {
            return res.status(404).json({ message: 'Trade request not found' });
        }

        if (tradeRequest.status !== 'accepted') {
            return res.status(400).json({ message: `Only accepted trades can be completed. This is ${tradeRequest.status}` });
        }

        // Both owners and requesters can mark a normal trade as complete.
        if (tradeRequest.owner.toString() !== req.user._id.toString() && tradeRequest.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to complete this request' });
        }

        tradeRequest.status = 'completed';
        await tradeRequest.save();

        if (tradeRequest.listing) {
            const listing = await Listing.findById(tradeRequest.listing._id);
            if (listing) {
                listing.status = 'completed';
                await listing.save();
            }
        }

        // Grant Trust Points to Both Users
        await User.findByIdAndUpdate(tradeRequest.owner, { $inc: { totalCompletedTrades: 1 } });
        await User.findByIdAndUpdate(tradeRequest.requester, { $inc: { totalCompletedTrades: 1 } });

        res.status(200).json(tradeRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
