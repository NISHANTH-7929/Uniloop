import mongoose from "mongoose";

const roleTransitionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.ObjectId,
        ref: 'Event'
    },
    previousRole: String,
    newRole: String,
    reason: String,
    changedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model("RoleTransition", roleTransitionSchema);
