import mongoose from "mongoose";

const CanteenItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // "meal", "snack", "drink", etc.
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
    canteenName: { type: String, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("CanteenItem", CanteenItemSchema);
