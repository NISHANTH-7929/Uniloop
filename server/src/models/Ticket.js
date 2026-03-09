import mongoose from "mongoose";
import crypto from "crypto";

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.ObjectId,
        ref: 'Event',
        required: true
    },
    subevent: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    alias: {
        type: String,
        trim: true,
        default: 'My Booking'
    },
    ticketCategory: {
        type: String,
        trim: true,
        default: 'General'
    },
    persons: [{
        name: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        }
    }],
    qr_secret: {
        type: String,
        unique: true,
        default: function () {
            return crypto.randomBytes(16).toString('hex');
        }
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'USED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    checkin_time: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for faster queries, but not unique to allow multiple batch bookings
ticketSchema.index({ user: 1, event: 1 });

export default mongoose.model("Ticket", ticketSchema);
