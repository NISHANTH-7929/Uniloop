import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const answerSchema = new Schema({
    author:           { type: Types.ObjectId, ref: "User", required: true },
    body:             { type: String, required: true },
    imageUrl:         { type: String, default: null },
    upvotes:          [{ type: Types.ObjectId, ref: "User" }],
    isVerifiedSenior: { type: Boolean, default: false },
    createdAt:        { type: Date, default: Date.now },
}, { _id: true });

const qaPostSchema = new Schema({
    author:        { type: Types.ObjectId, ref: "User", required: true },
    subjectCode:   { type: String, required: true },
    subjectName:   { type: String, required: true },
    department:    { type: String, required: true },
    semester:      { type: Number, required: true },
    title:         { type: String, required: true },
    body:          { type: String, required: true },
    imageUrl:      { type: String, default: null },
    tags:          [String],
    status:        { type: String, enum: ["open","solved"], default: "open" },
    solvedAnswerId:{ type: Types.ObjectId, default: null },
    viewCount:     { type: Number, default: 0 },
    answers:       [answerSchema],
}, { timestamps: true });

const QAPost = model("QAPost", qaPostSchema);
export default QAPost;
