import BorrowTracking from '../models/BorrowTracking.js';
import TradeRequest from '../models/TradeRequest.js';
import User from '../models/User.js';

// @desc    Get user's active borrows and lent items
// @route   GET /api/borrows
// @access  Private
export const getActiveBorrows = async (req, res) => {
    try {
        const { roleStatus } = req.query; // 'borrower' or 'lender'

        let query = {};

        if (roleStatus === 'borrower') {
            query = { borrower: req.user._id };
        } else if (roleStatus === 'lender') {
            query = { lender: req.user._id };
        } else {
            query = { $or: [{ borrower: req.user._id }, { lender: req.user._id }] };
        }

        const borrows = await BorrowTracking.find(query)
            .populate('listing', 'title price images status')
            .populate('borrower', 'email trustScore punctualityScore')
            .populate('lender', 'email trustScore punctualityScore')
            .populate('tradeRequest', 'message proposedMeetup')
            .sort({ returnDate: 1 });

        res.status(200).json(borrows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Confirm item return
// @route   PUT /api/borrows/:id/confirm-return
// @access  Private
export const confirmBorrowReturn = async (req, res) => {
    try {
        const borrow = await BorrowTracking.findById(req.params.id);

        if (!borrow) {
            return res.status(404).json({ message: 'Borrow tracking record not found' });
        }

        if (borrow.status === 'returned') {
            return res.status(400).json({ message: 'This item has already been marked as returned' });
        }

        const isBorrower = borrow.borrower.toString() === req.user._id.toString();
        const isLender = borrow.lender.toString() === req.user._id.toString();

        if (!isBorrower && !isLender) {
            return res.status(403).json({ message: 'Not authorized for this borrow record' });
        }

        if (isBorrower) {
            borrow.borrowerConfirmedReturn = true;
        }

        if (isLender) {
            borrow.lenderConfirmedReturn = true;
        }

        // If both confirmed
        if (borrow.borrowerConfirmedReturn && borrow.lenderConfirmedReturn) {
            borrow.status = 'returned';

            // Also update TradeRequest status to completed
            const trade = await TradeRequest.findById(borrow.tradeRequest);
            if (trade) {
                trade.status = 'completed';
                await trade.save();
            }

            // Update user stats - give them a point for successful transaction
            await User.findByIdAndUpdate(borrow.borrower, { $inc: { totalCompletedTrades: 1 } });
            await User.findByIdAndUpdate(borrow.lender, { $inc: { totalCompletedTrades: 1 } });

            // If it was overdue, maybe there's a penalty. Handled externally or by cron.
        }

        await borrow.save();

        res.status(200).json(borrow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
