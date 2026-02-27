import cron from 'node-cron';
import Listing from '../models/Listing.js';
import TradeRequest from '../models/TradeRequest.js';
import BorrowTracking from '../models/BorrowTracking.js';
import User from '../models/User.js';

const setupCronJobs = () => {
    // 1. Auto-expire listings (Runs every midnight)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running auto-expire listings cron job...');
            const result = await Listing.updateMany(
                { status: 'available', expiresAt: { $lt: new Date() } },
                { $set: { status: 'expired' } }
            );
            console.log(`Expired ${result.modifiedCount} listings.`);
        } catch (error) {
            console.error('Error in auto-expire listings cron:', error);
        }
    });

    // 2. Auto-cancel stale pending trade requests older than 7 days (Runs every midnight)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running auto-cancel stale trades cron job...');
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const result = await TradeRequest.updateMany(
                { status: 'pending', createdAt: { $lt: sevenDaysAgo } },
                { $set: { status: 'cancelled' } }
            );
            console.log(`Cancelled ${result.modifiedCount} stale trade requests.`);
        } catch (error) {
            console.error('Error in auto-cancel trades cron:', error);
        }
    });

    // 3. Mark borrows as overdue and penalize trust score (Runs every midnight)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running overdue borrows cron job...');

            // Find all active borrows that have passed their return date
            const overdueBorrows = await BorrowTracking.find({
                status: 'active',
                returnDate: { $lt: new Date() }
            });

            for (const borrow of overdueBorrows) {
                // Update borrow status
                borrow.status = 'overdue';
                await borrow.save();

                // Penalize borrower's punctuality and trust score
                await User.findByIdAndUpdate(borrow.borrower, {
                    $inc: {
                        punctualityScore: -5,
                        trustScore: -2 // small ding for every day late
                    }
                });

                // (Optional) Trigger a notification here to the borrower and lender
            }

            console.log(`Marked ${overdueBorrows.length} borrows as overdue.`);
        } catch (error) {
            console.error('Error in overdue borrows cron:', error);
        }
    });

    console.log('✓ Scheduled Lifecycle Automation Cron Jobs');
};

export default setupCronJobs;
