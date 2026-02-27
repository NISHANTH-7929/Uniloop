import TradeRequest from '../models/TradeRequest.js';
import Listing from '../models/Listing.js';
import Conversation from '../models/Conversation.js';

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

        const trades = await TradeRequest.find(query)
            .populate('listing', 'title price images listingType status')
            .populate('requester', 'email trustScore averageRating punctualityScore')
            .populate('owner', 'email trustScore averageRating punctualityScore')
            .sort({ createdAt: -1 });

        res.status(200).json(trades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
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
                // Usually BorrowTracking is fully initialized when they actually meet, 
                // but we might want to provision it now with a 'pending' state or wait till item handed over.
                // For now, deferred to Borrow Lifecycle implementation phase.
            }
        }

        res.status(200).json(tradeRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
