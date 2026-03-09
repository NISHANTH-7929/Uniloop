import 'dotenv/config.js';
import connectDB from './src/config/db.js';
import Notification from './src/models/Notification.js';

const fixNotifications = async () => {
    try {
        await connectDB();
        console.log("Connected, fixing notifications...");
        const result = await Notification.updateMany(
            { action: { $in: ['volunteer_request', 'part_organizer_request', 'volunteer_withdrawal'] }, isRead: true },
            { isRead: false }
        );
        console.log(`Successfully restored ${result.modifiedCount} pending actions from 'read' to 'unread'.`);
        process.exit(0);
    } catch (err) {
        console.error("Fix failed:", err);
        process.exit(1);
    }
};

fixNotifications();
