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
    imageUrl:    { type: String, required: [true, "A photo is required for all lost & found submissions."] },
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
        imageUrl: { type: String, required: true },
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
