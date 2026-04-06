import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    threadType: {
        type: String,
        enum: ['marketplace', 'dormdash', 'emergency', 'tutoring', 'skill', 'direct'],
        default: 'direct',
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'threadModel'
    },
    threadModel: {
        type: String,
        required: false,
        enum: ['TradeRequest', 'Order', 'EmergencyRequest', 'TutoringSession', 'SkillExchange']
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
