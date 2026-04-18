import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const lostFoundItemSchema = new Schema({
    reporter:    { type: Types.ObjectId, ref: "User", default: null },
    isAnonymous: { type: Boolean, default: false },
    type:        { type: String, enum: ["lost","found"], required: true },
    title:       { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ["wallet","phone","keys","id-card","bag","clothing",
               "stationery","electronics","jewellery","other"],
        required: true
    },
    locationTag: { type: String, required: true },
    imageUrl: {
        type: String,
        required: [true, "A photo is required for all lost & found submissions."],
        minlength: [50, "Image data is incomplete. Please re-upload the image."],
        validate: {
            validator: function(v) {
                // Ensure imageUrl is a non-empty string that looks like a base64 data URL or valid URL
                return v && (v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"));
            },
            message: "Image must be a valid data URL or web URL."
        }
    },
    status:      { type: String, enum: ["active","claimed","archived"], default: "active" },
    claimVerification: {
        question:   String,
        answerHash: String,
        claimedBy:  { type: Types.ObjectId, ref: "User", default: null },
        claimedAt:  Date,
    },
    expiresAt:     { type: Date },
    matchNotified: { type: Boolean, default: false },
    finderReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    claimerReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    reviewsRevealed: { type: Boolean, default: false },
    foundReports: [{
        reporter: { type: Types.ObjectId, ref: "User" },
        imageUrl: { 
            type: String, 
            required: true,
            minlength: [50, "Image data is incomplete."],
            validate: {
                validator: function(v) {
                    return v && (v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"));
                },
                message: "Image must be a valid data URL or web URL."
            }
        },
        message: { type: String },
        reportedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

// Auto-set expiresAt
lostFoundItemSchema.pre("save", function () {
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
});

const LostFoundItem = model("LostFoundItem", lostFoundItemSchema);
export default LostFoundItem;
