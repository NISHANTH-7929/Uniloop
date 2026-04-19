import Complaint from "../models/Complaint.js";
import Notification from "../models/Notification.js";
import { stripReporter, stripReporterArray } from "../middleware/stripReporter.js";
import { getIO } from "../utils/socketUtils.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /complaints
export const createComplaint = async (req, res) => {
    try {
        const bodyData = { ...req.body };
        if (req.file) {
            bodyData.imageUrl = req.file.path;
            bodyData.imagePublicId = req.file.filename;
        }
        const complaint = await Complaint.create({ reporter: req.user._id, ...bodyData });
        // Return with reporter stripped
        return res.status(201).json({ success: true, data: stripReporter(complaint) });
    } catch (err) {
        if (req.file && req.file.filename) {
            deleteFromCloudinary(req.file.filename).catch(console.error);
        }
        return handleError(res, err);
    }
};

// GET /complaints (public — no reporter)
export const getComplaints = async (req, res) => {
    try {
        const { category, status } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (status)   filter.status   = status;

        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, data: stripReporterArray(complaints) });
    } catch (err) { return handleError(res, err); }
};

// GET /complaints/my — reporter can see their own
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ reporter: req.user._id }).sort({ createdAt: -1 });
        return res.json({ success: true, data: complaints.map(c => c.toObject()) });
    } catch (err) { return handleError(res, err); }
};

// GET /complaints/:id (public — no reporter)
export const getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
        return res.json({ success: true, data: stripReporter(complaint) });
    } catch (err) { return handleError(res, err); }
};

// PATCH /complaints/:id/metoo
export const toggleMeToo = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

        const userId = req.user._id;
        if (complaint.reporter.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot Me Too your own complaint" });
        }

        const idx = complaint.meTooVoters.indexOf(userId);
        if (idx === -1) {
            complaint.meTooVoters.push(userId);
        } else {
            complaint.meTooVoters.splice(idx, 1);
        }
        await complaint.save();

        // Milestone notifications to reporter
        const count = complaint.meTooVoters.length;
        if ([5, 10, 20].includes(count)) {
            try {
                getIO().to(complaint.reporter.toString()).emit("complaint:metooed", {
                    complaintId: complaint._id,
                    count,
                });
            } catch (_) {}
            await Notification.create({
                recipient: complaint.reporter,
                type:      "complaint_metoo",
                title:     "Me Too Milestone",
                message:   `Your complaint now has ${count} Me Too votes!`,
                relatedId: complaint._id,
            });
        }

        return res.json({ success: true, count, hasVoted: idx === -1 });
    } catch (err) { return handleError(res, err); }
};

// PATCH /complaints/:id/respond — admin only
export const adminRespond = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

        complaint.adminResponse = req.body.adminResponse || null;
        if (req.body.status) complaint.status = req.body.status;
        if (req.body.status === "resolved") complaint.resolvedAt = new Date();
        await complaint.save();

        // Notify reporter via socket (identity safe — only to their room)
        try {
            getIO().to(complaint.reporter.toString()).emit("complaint:responded", {
                complaintId:   complaint._id,
                adminResponse: complaint.adminResponse,
                status:        complaint.status,
            });
        } catch (_) {}

        // Return full doc to admin
        return res.json({ success: true, data: complaint.toObject() });
    } catch (err) { return handleError(res, err); }
};
