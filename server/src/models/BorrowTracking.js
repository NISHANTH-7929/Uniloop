import mongoose from 'mongoose';

const borrowTrackingSchema = new mongoose.Schema({
    tradeRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeRequest',
        required: true,
        unique: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'returned', 'overdue'],
        default: 'active'
    },
    returnDate: {
        type: Date,
        required: true
    },
    borrowerConfirmedReturn: {
        type: Boolean,
        default: false
    },
    lenderConfirmedReturn: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const BorrowTracking = mongoose.model('BorrowTracking', borrowTrackingSchema);
export default BorrowTracking;
