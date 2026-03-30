import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dasher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        note: { type: String },
      },
    ],

    pickupLocation: { type: String, required: true }, // e.g. "A Block Canteen, Counter 3"
    dropLocation: { type: String, required: true }, // e.g. "Hostel B, Room 214"
    charge: { type: Number, required: true }, // INR, paid in person
    urgency: { type: String, enum: ["normal", "urgent"], default: "normal" },
    scheduledFor: { type: Date, default: null }, // null = ASAP

    status: {
      type: String,
      enum: ["open", "accepted", "ACCEPTED_BY_DASHER", "CONFIRMED_BY_USER", "COMPLETED", "picked_up", "in_transit", "delivered", "cancelled"],
      default: "open",
    },

    otpHash: { type: String, default: null }, // bcrypt hash of 4-digit OTP
    otpCode: { type: String, default: null }, // Plain text for the requester to see
    photoProofUrl: { type: String, default: null }, // Cloudinary URL
    chargeLogText: { type: String, default: null }, // e.g. "₹40 agreed, paid in person"

    isGroupOrder: { type: Boolean, default: false },
    groupMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        items: [{ name: String, quantity: Number }],
        shareCharge: Number,
      },
    ],

    requesterReview: {
      rating: Number, // 1-5
      comment: String,
      submitted: { type: Boolean, default: false },
    },
    dasherReview: {
      rating: Number,
      comment: String,
      submitted: { type: Boolean, default: false },
    },
    reviewsRevealed: { type: Boolean, default: false }, // true when BOTH submitted
    acceptedAt: { type: Date, default: null }, // for handshake timeout
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
