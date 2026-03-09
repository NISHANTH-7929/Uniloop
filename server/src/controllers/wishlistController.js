import Wishlist from '../models/Wishlist.js';
import Listing from '../models/Listing.js';

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
    try {
        const { listingId } = req.body;

        if (!listingId) {
            return res.status(400).json({ message: 'Listing ID is required' });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({ user: req.user._id, listing: listingId });
        if (existing) {
            return res.status(400).json({ message: 'Already in wishlist' });
        }

        const item = await Wishlist.create({
            user: req.user._id,
            listing: listingId
        });

        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        const items = await Wishlist.find({ user: req.user._id })
            .populate('listing', 'title price images status listingType')
            .sort({ createdAt: -1 });

        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:id
// @access  Private
export const removeFromWishlist = async (req, res) => {
    try {
        // Find by Wishlist document ID
        const item = await Wishlist.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }

        if (item.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // we use .deleteOne() rather than .remove() since remove() is deprecated
        await item.deleteOne();

        res.status(200).json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
