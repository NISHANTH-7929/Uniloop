import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    enum: ['Workshop', 'Seminar', 'Cultural', 'Party'],
    required: true
  },

  dateTime: {
    type: Date,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    default: 0  // 0 means free
  },

  capacity: {
    type: Number,
    default: null  // If null → unlimited capacity (like culturals)
  },

  checkInRequired: {
    type: Boolean,
    default: true  // False for culturals etc
  },

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
