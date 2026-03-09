import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'trade_request', 'trade_accepted', 'trade_rejected', 'borrow_reminder', 'borrow_overdue', 'listing_expired', 'price_drop', 'system'],
        default: 'info'
    },
    title: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        trim: true
    },
    action: {
        type: String, // e.g., 'volunteer_request'
        default: null
    },
    relatedEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId // Polymorphic - for marketplace trades, borrows, etc.
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
