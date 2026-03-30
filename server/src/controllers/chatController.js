import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import validator from 'validator';

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user._id })
            .populate('participants', 'name email trustScore averageRating')
            .populate('lastMessage')
            .populate({
                path: 'referenceId',
                select: 'title images price status items pickupLocation dropLocation charge',
                // Mongoose handles the dynamic ref via refPath 'threadModel' automatically
            })
            .sort({ updatedAt: -1 });

        // Calculate unread counts manually for each conversation
        const enrichedConversations = await Promise.all(conversations.map(async (c) => {
            const unreadCount = await Message.countDocuments({
                conversation: c._id,
                sender: { $ne: req.user._id },
                isRead: false
            });
            return { ...c.toObject(), unreadCount };
        }));

        res.status(200).json(enrichedConversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/:conversationId/messages
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this conversation' });
        }

        const { cursor, limit = 20 } = req.query;
        const query = { conversation: req.params.conversationId };
        
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email')
            .sort({ createdAt: -1 }) // Get newest first for pagination
            .limit(Number(limit));

        // Result should be oldest to newest for UI
        const sortedMessages = messages.reverse();

        // Mark messages as read
        await Message.updateMany(
            { conversation: req.params.conversationId, sender: { $ne: req.user._id }, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            messages: sortedMessages,
            nextCursor: messages.length === limit ? messages[0].createdAt : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send a message (HTTP Fallback)
// @route   POST /api/chat/:conversationId/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this conversation' });
        }

        if (conversation.isReadOnly) {
            return res.status(403).json({ message: 'This conversation is read-only. Order may be closed or cancelled.' });
        }

        const sanitizedContent = validator.escape(content);

        const message = await Message.create({
            conversation: req.params.conversationId,
            sender: req.user._id,
            content: sanitizedContent
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin: Delete all conversations & messages
// @route   DELETE /api/chat/admin/reset
// @access  Admin only
export const resetAllChats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const [msgResult, convResult] = await Promise.all([
            Message.deleteMany({}),
            Conversation.deleteMany({})
        ]);

        res.status(200).json({
            message: 'All chat data wiped successfully',
            messagesDeleted: msgResult.deletedCount,
            conversationsDeleted: convResult.deletedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
