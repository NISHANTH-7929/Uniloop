import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeRequest',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    type: {
        type: String,
        enum: ['buyer', 'seller', 'borrower', 'lender'],
        required: true
    }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
