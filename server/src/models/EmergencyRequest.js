import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const emergencyRequestSchema = new Schema({
    poster: { type: Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: ["blood","medical","safety","fire","infrastructure"],
        required: true
    },
    bloodType:      { type: String, default: null },
    urgency:        { type: String, enum: ["critical","normal"], default: "normal" },
    title:          { type: String, required: true },
    description:    { type: String, required: true },
    location:       { type: String, required: true },
    broadcastScope: { type: String, enum: ["block","campus"], default: "block" },
    status:         { type: String, enum: ["active","resolved"], default: "active" },
    responses: [{
        responder:   { type: Types.ObjectId, ref: "User" },
        message:     String,
        respondedAt: { type: Date, default: Date.now },
        confirmed:   { type: Boolean, default: false },
    }],
    resolvedAt: { type: Date, default: null },
}, { timestamps: true });

const EmergencyRequest = model("EmergencyRequest", emergencyRequestSchema);
export default EmergencyRequest;
