import 'dotenv/config.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

const runCleanup = async () => {
    try {
        await connectDB();
        console.log("Connected, performing cleanup...");
        const result = await User.deleteMany({ isVerified: false });
        console.log(`Successfully deleted ${result.deletedCount} unverified users.`);
        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err);
        process.exit(1);
    }
};

runCleanup();
