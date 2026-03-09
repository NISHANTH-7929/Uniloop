import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: 'Target type, ID, and reason are required' });
        }

        // Prevent self-reporting
        if (targetType === 'user' && targetId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot report yourself' });
        }

        const report = await Report.create({
            reporter: req.user._id,
            targetType,
            targetId,
            reason,
            description
        });

        res.status(201).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private
export const getReports = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }

        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const reports = await Report.find(query)
            .populate('reporter', 'email')
            .sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update report status (Admin)
// @route   PUT /api/reports/:id/status
// @access  Private
export const updateReportStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }

        const { status, adminNotes, addStrike } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status || report.status;
        if (adminNotes) report.adminNotes = adminNotes;

        await report.save();

        if (status === 'resolved' && addStrike && report.targetType === 'user') {
            await User.findByIdAndUpdate(report.targetId, {
                $inc: { strikeCount: 1, trustScore: -20 }
            });
            // Could add logic to ban user here if strikeCount > X
        }

        res.status(200).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
