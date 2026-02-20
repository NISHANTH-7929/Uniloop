import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },

  registeredAt: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  }

}, { timestamps: true });

const Registration =mongoose.model('Registration',registrationSchema);
export default Registration;