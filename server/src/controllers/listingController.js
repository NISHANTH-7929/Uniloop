import Listing from '../models/Listing.js';
import Category from '../models/Category.js';
import MeetupLocation from '../models/MeetupLocation.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res) => {
    try {
        const { title, description, price, category, listingType, images, meetupLocations, expiresAt } = req.body;

        if (!title || !description || price === undefined || !category || !listingType) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const listing = await Listing.create({
            seller: req.user._id,
            title,
            description,
            price,
            category,
            listingType,
            images: images || [],
            meetupLocations: meetupLocations || [],
            expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
        });

        res.status(201).json(listing);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
    try {
        const { category, listingType, search, status } = req.query;

        let query = {};

        // Default to available listings unless status is specified
        query.status = status ? status : 'available';

        if (category) query.category = category;
        if (listingType) query.listingType = listingType;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await Listing.find(query)
            .populate('seller', 'email role trustScore averageRating punctualityScore')
            .populate('category', 'name icon')
            .populate('meetupLocations', 'name campus')
            .sort({ createdAt: -1 });

        res.status(200).json(listings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('seller', 'email role trustScore averageRating punctualityScore')
            .populate('category', 'name icon description')
            .populate('meetupLocations', 'name campus description');

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.status(200).json(listing);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res) => {
    try {
        let listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Make sure user owns the listing
        if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        // Check if price is dropping
        const oldPrice = listing.price;
        const newPrice = req.body.price;
        const isPriceDrop = newPrice !== undefined && newPrice < oldPrice;

        listing = await Listing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Dispatch price drop notifications
        if (isPriceDrop) {
            try {
                const wishlists = await Wishlist.find({ listing: listing._id, priceAlert: true }).populate('user');

                for (const item of wishlists) {
                    if (item.user) {
                        await Notification.create({
                            recipient: item.user._id,
                            type: 'price_drop',
                            title: 'Price Drop Alert!',
                            message: `The price for "${listing.title}" has dropped from $${oldPrice} to $${newPrice}.`,
                            relatedId: listing._id
                        });

                        await sendEmail({
                            to: item.user.email,
                            subject: 'Price Drop Alert: ' + listing.title,
                            text: `Good news! The price for "${listing.title}" has dropped to $${newPrice}. Check it out on UniLoop now!`
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to process price drop notifications:", err);
            }
        }

        res.status(200).json(listing);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete/Cancel listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Make sure user owns the listing
        if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        // Soft delete (cancel) if it has associated trades, or hard delete if fresh
        // For simplicity now, we'll mark as cancelled instead of dropping the document
        listing.status = 'cancelled';
        await listing.save();

        res.status(200).json({ message: 'Listing cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
