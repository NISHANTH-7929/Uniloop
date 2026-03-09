import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a listing title'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, 'Please provide a listing description'],
        trim: true,
        maxlength: 1000
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    listingType: {
        type: String,
        enum: ['sell', 'rent', 'borrow'],
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'pending', 'completed', 'expired', 'cancelled'],
        default: 'available'
    },
    images: [{
        type: String
    }],
    meetupLocations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MeetupLocation'
    }],
    expiresAt: {
        type: Date
    }
}, { timestamps: true });

// Auto-expire listings index
listingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
