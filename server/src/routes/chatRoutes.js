import express from 'express';
import {
    getConversations,
    getMessages,
    sendMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/conversations')
    .get(protect, getConversations);

router.route('/:conversationId/messages')
    .get(protect, getMessages)
    .post(protect, sendMessage); // HTTP fallback

export default router;
