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
import { createUploader } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const listingUploader = createUploader('listings');

router.route('/')
    .get(getListings)
    .post(protect, listingUploader.array('images', 5), createListing);

// Must be before /:id to avoid 'mine' being treated as an ObjectId
router.route('/mine')
    .get(protect, getMyListings);

router.route('/:id')
    .get(getListingById)
    .put(protect, listingUploader.array('images', 5), updateListing)
    .delete(protect, deleteListing);

export default router;
