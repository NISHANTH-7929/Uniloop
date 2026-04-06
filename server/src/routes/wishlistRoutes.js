import express from 'express';
import {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    togglePriceAlert
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getWishlist)
    .post(protect, addToWishlist);

router.route('/:id')
    .delete(protect, removeFromWishlist);

router.route('/:id/price-alert')
    .patch(protect, togglePriceAlert);

export default router;
