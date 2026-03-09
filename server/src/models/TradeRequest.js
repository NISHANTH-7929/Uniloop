import mongoose from 'mongoose';

const tradeRequestSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['sell', 'rent', 'borrow'],
        required: true
    },
    proposedMeetup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MeetupLocation'
    },
    proposedPrice: {
        type: Number
    },
    message: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { timestamps: true });

const TradeRequest = mongoose.model('TradeRequest', tradeRequestSchema);
export default TradeRequest;
