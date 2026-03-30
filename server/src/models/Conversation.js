import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    threadType: {
        type: String,
        enum: ['marketplace', 'dormdash'],
        default: 'marketplace',
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'threadModel'
    },
    threadModel: {
        type: String,
        required: true,
        enum: ['TradeRequest', 'Order']
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isReadOnly: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
