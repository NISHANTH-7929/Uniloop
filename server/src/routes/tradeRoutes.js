import express from 'express';
import {
    createTradeRequest,
    getTradeRequests,
    respondToTradeRequest,
    completeTradeRequest
} from '../controllers/tradeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getTradeRequests)
    .post(protect, createTradeRequest);

router.route('/:id/respond')
    .put(protect, respondToTradeRequest);

router.route('/:id/complete')
    .put(protect, completeTradeRequest);

export default router;
