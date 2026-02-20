import mongoose from 'mongoose';


const ticketSchema = new mongoose.Schema({
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

  status: {
    type: String,
    enum: ['unused', 'used', 'cancelled'],
    default: 'unused'
  },

  issuedAt: {
    type: Date,
    default: Date.now
  },

  usedAt: {
    type: Date,
    default: null
  },

  qrToken: {
    type: String,
    required: true
  }

}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;