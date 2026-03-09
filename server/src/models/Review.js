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

// Create compound unique index for trade and reviewer
reviewSchema.index({ trade: 1, reviewer: 1 }, { unique: true });

export default Review;
