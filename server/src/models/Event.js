import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please provide an event title"],
        trim: true,
        maxlength: [100, "Event title cannot be more than 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please provide an event description"],
        trim: true,
        maxlength: [1000, "Description cannot be more than 1000 characters"]
    },
    date: {
        type: Date,
        required: [true, "Please provide an event date"]
    },
    endDate: {
        type: Date,
        required: [true, "Please provide an event end date"]
    },
    location: {
        name: {
            type: String,
            default: "TBD"
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                index: '2dsphere',
                default: [0, 0] // [longitude, latitude]
            },
            radius: {
                type: Number,
                default: 50 // In meters, for geofencing validation
            }
        }
    },
    organizer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    partOrganizers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    volunteers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    subevents: [{
        title: String,
        description: String,
        date: Date,
        endDate: Date,
        location: {
            name: String,
            coordinates: { type: [Number], default: [0, 0] }
        },
        capacity: { type: Number, default: null },
        isUnlimitedCapacity: { type: Boolean, default: false },
        categories: [{
            name: { type: String, required: true },
            price: { type: Number, required: true }
        }],
        price: { type: Number, default: 0 }, // Kept for backwards compatibility but can be ignored
        registeredCount: { type: Number, default: 0 },
        checkedInCount: { type: Number, default: 0 },
        qr_secret: { type: String, unique: true, sparse: true },
        image: { type: String },
        promoLink: { type: String, default: '' },
        additionalMedia: [{
            filename: String,
            mime: String,
            url: String,
            data: String
        }],
        updates: [{
            title: String,
            text: String,
            attachments: [{ filename: String, mime: String, url: String, data: String }],
            createdAt: { type: Date, default: Date.now }
        }]
    }],
    updates: [{
        title: String,
        text: String,
        attachments: [{ filename: String, mime: String, url: String, data: String }],
        createdAt: { type: Date, default: Date.now }
    }],
    additionalMedia: [{
        filename: String,
        mime: String,
        url: String,
        data: String
    }],
    registeredCount: {
        type: Number,
        default: 0
    },
    checkedInCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'completed', 'cancelled', 'finished'],
        default: 'published'
    },
    image: {
        type: String,
        required: [true, "Please provide a main event photo"]
    },
    promoLink: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);
