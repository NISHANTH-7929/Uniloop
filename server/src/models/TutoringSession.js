import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const tutoringSessionSchema = new Schema({
    tutor:        { type: Types.ObjectId, ref: "User", required: true },
    learner:      { type: Types.ObjectId, ref: "User", default: null },
    subject:      { type: String, required: true },
    subjectCode:  { type: String, required: true },
    department:   { type: String, required: true },
    semester:     { type: Number, required: true },
    sessionType:  { type: String, enum: ["offer","request"], required: true },
    description:  { type: String },
    chargePerHour: { type: Number, default: 0 },
    mode:         { type: String, enum: ["inperson","online"], default: "inperson" },
    status: {
        type: String,
        enum: ["open","matched","scheduled","completed","cancelled"],
        default: "open"
    },
    scheduledAt:  { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    completedByFirst: { type: Types.ObjectId, ref: "User", default: null }, // first party to call complete
    tutorReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    learnerReview: {
        rating:      Number,
        comment:     String,
        submitted:   { type: Boolean, default: false },
        submittedAt: Date,
    },
    reviewsRevealed: { type: Boolean, default: false },
}, { timestamps: true });

const TutoringSession = model("TutoringSession", tutoringSessionSchema);
export default TutoringSession;
