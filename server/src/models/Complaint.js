import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const complaintSchema = new Schema({
    // reporter stored internally — NEVER exposed in public API responses
    reporter:  { type: Types.ObjectId, ref: "User", required: true },
    category: {
        type: String,
        enum: ["canteen","hostel","lab","infrastructure","academic",
               "safety","cleanliness","other"],
        required: true
    },
    title:         { type: String, required: true },
    description:   { type: String, required: true },
    imageUrl:      { type: String, default: null },
    status: {
        type: String,
        enum: ["submitted","under_review","resolved","dismissed"],
        default: "submitted"
    },
    adminResponse: { type: String, default: null },
    meTooVoters:   [{ type: Types.ObjectId, ref: "User" }],
    resolvedAt:    { type: Date, default: null },
}, { timestamps: true });

const Complaint = model("Complaint", complaintSchema);
export default Complaint;
