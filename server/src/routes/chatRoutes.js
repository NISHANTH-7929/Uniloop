import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    getConversations,
    getMessages,
    sendMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 chat messages per `window` (here, per minute)
    message: { message: 'Too many messages sent, please try again after a minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.route('/conversations')
    .get(protect, getConversations);

router.route('/:conversationId/messages')
    .get(protect, getMessages)
    .post(protect, chatLimiter, sendMessage); // HTTP fallback with rate limiting

export default router;
