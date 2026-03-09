import express from 'express';
import {
    getCategories,
    createCategory,
    getMeetupLocations,
    createMeetupLocation
} from '../controllers/directoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Categories
router.route('/categories')
    .get(getCategories)
    .post(protect, createCategory); // Admin wrapper could be added here

// Meetup Locations
router.route('/locations')
    .get(getMeetupLocations)
    .post(protect, createMeetupLocation);

export default router;
