import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const skillExchangeSchema = new Schema({
    poster:      { type: Types.ObjectId, ref: "User", required: true },
    offerSkill:  { type: String, required: true },
    wantSkill:   { type: String, required: true },
    offerDetail: { type: String },
    wantDetail:  { type: String },
    duration:    { type: String },
    chargeIfAny: { type: Number, default: 0 },
    category: {
        type: String,
        enum: ["academic","music","art","sports","tech","language","other"]
    },
    status: {
        type: String,
        enum: ["open","matched","completed","cancelled"],
        default: "open"
    },
    matchedWith: { type: Types.ObjectId, ref: "User", default: null },
    completedByFirst: { type: Types.ObjectId, ref: "User", default: null },
    giverReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    takerReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    reviewsRevealed: { type: Boolean, default: false },
}, { timestamps: true });

const SkillExchange = model("SkillExchange", skillExchangeSchema);
export default SkillExchange;
