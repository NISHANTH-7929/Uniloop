import mongoose from "mongoose";

const attendanceLogSchema = new mongoose.Schema({
    ticket_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ticket',
        required: true
    },
    event_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Event',
        required: true
    },
    scanner_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    result: {
        type: String,
        enum: ['success', 'already_used', 'invalid', 'geo_fail'],
        required: true
    },
    scanLocation: {
        latitude: Number,
        longitude: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("AttendanceLog", attendanceLogSchema);
