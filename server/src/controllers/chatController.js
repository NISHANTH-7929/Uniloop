import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user._id })
            .populate('participants', 'email trustScore averageRating')
            .populate('lastMessage')
            .populate({
                path: 'tradeRequest',
                populate: { path: 'listing', select: 'title images price' }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json(conversations);
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

        const messages = await Message.find({ conversation: req.params.conversationId })
            .populate('sender', 'email')
            .sort({ createdAt: 1 }); // Oldest to newest for chat UI

        // Mark messages as read
        await Message.updateMany(
            { conversation: req.params.conversationId, sender: { $ne: req.user._id }, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json(messages);
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

        const message = await Message.create({
            conversation: req.params.conversationId,
            sender: req.user._id,
            content
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
