import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    tradeRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeRequest',
        required: true,
        unique: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
