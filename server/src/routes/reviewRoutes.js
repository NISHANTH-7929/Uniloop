import express from 'express';
import {
    createReview,
    getUserReviews
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createReview);

router.route('/user/:userId')
    .get(getUserReviews);

export default router;
