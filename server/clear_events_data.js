import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './src/models/Event.js';
import Ticket from './src/models/Ticket.js';
import AttendanceLog from './src/models/AttendanceLog.js';
import RoleTransition from './src/models/RoleTransition.js';
import Notification from './src/models/Notification.js';
import User from './src/models/User.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const clearData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Clearing Event data...');

        const ev = await Event.deleteMany({});
        console.log(`Deleted ${ev.deletedCount} events.`);

        const tk = await Ticket.deleteMany({});
        console.log(`Deleted ${tk.deletedCount} tickets.`);

        const al = await AttendanceLog.deleteMany({});
        console.log(`Deleted ${al.deletedCount} attendance logs.`);

        const rt = await RoleTransition.deleteMany({});
        console.log(`Deleted ${rt.deletedCount} role transitions.`);

        const nt = await Notification.deleteMany({
            $or: [
                { relatedEvent: { $ne: null } },
                { action: { $in: ['volunteer_request', 'part_organizer_request', 'volunteer_withdrawal'] } }
            ]
        });
        console.log(`Deleted ${nt.deletedCount} event-related notifications.`);

        // Reset roles of all users to 'student' except 'admin'
        const users = await User.updateMany(
            { role: { $ne: 'admin' } },
            { $set: { role: 'student' } }
        );
        console.log(`Reset ${users.modifiedCount} user roles back to 'student'.`);

        console.log('Successfully wiped all event data! Database is clean.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
