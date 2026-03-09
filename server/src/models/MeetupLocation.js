import mongoose from 'mongoose';

const meetupLocationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a meetup location name'],
        trim: true
    },
    campus: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const MeetupLocation = mongoose.model('MeetupLocation', meetupLocationSchema);
export default MeetupLocation;
