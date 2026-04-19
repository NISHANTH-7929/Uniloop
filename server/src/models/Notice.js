import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const noticeSchema = new Schema({
    postedBy:   { type: Types.ObjectId, ref: "User", required: true },
    posterRole: { type: String, enum: ["student","club","dept","admin"] },
    title:      { type: String, required: true },
    body:       { type: String, required: true },
    imageUrl:   { type: String, default: null },
    imagePublicId:{ type: String, default: null },
    targetDept: { type: String, default: "all" },
    targetYear: { type: Number, default: 0 },
    targetBlock:{ type: String, default: "all" },
    expiresAt:  { type: Date, required: true },
    pinned:     { type: Boolean, default: false },
}, { timestamps: true });

const Notice = model("Notice", noticeSchema);
export default Notice;
