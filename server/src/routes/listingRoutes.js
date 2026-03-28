import express from 'express';
import {
    createListing,
    getListings,
    getMyListings,
    getListingById,
    updateListing,
    deleteListing,
} from '../controllers/listingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getListings)
    .post(protect, createListing);

// Must be before /:id to avoid 'mine' being treated as an ObjectId
router.route('/mine')
    .get(protect, getMyListings);

router.route('/:id')
    .get(getListingById)
    .put(protect, updateListing)
    .delete(protect, deleteListing);

export default router;
