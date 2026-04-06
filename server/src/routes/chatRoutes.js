import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    getConversations,
    getMessages,
    sendMessage,
    resetAllChats,
    findOrCreateConversation
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

router.route('/conversations/find-or-create')
    .post(protect, findOrCreateConversation);

router.route('/:conversationId/messages')
    .get(protect, getMessages)
    .post(protect, chatLimiter, sendMessage); // HTTP fallback with rate limiting

// Admin-only: nuke all chat data
router.route('/admin/reset')
    .delete(protect, resetAllChats);

export default router;
