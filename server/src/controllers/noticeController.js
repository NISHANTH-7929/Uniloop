import Notice from "../models/Notice.js";
import { getIO } from "../utils/socketUtils.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /notices
export const createNotice = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Only administrators and official personnel can post campus notices" });
        }

        const bodyData = { ...req.body };
        if (req.file) {
            bodyData.imageUrl = req.file.path;
            bodyData.imagePublicId = req.file.filename;
        }

        const notice = await Notice.create({
            postedBy:   req.user._id,
            posterRole: req.user.role,
            ...bodyData,
        });

        // Broadcast new notice socket event
        try {
            const io = getIO();
            if (notice.targetBlock && notice.targetBlock !== "all") {
                // Block-scoped: emit to users in that block (client-side filters)
                io.emit("notice:new", { noticeId: notice._id, targetBlock: notice.targetBlock });
            } else {
                io.emit("notice:new", { noticeId: notice._id, targetBlock: "all" });
            }
        } catch (_) {}

        return res.status(201).json({ success: true, data: notice });
    } catch (err) {
        if (req.file && req.file.filename) {
            deleteFromCloudinary(req.file.filename).catch(console.error);
        }
        return handleError(res, err);
    }
};

// GET /notices
export const getNotices = async (req, res) => {
    try {
        const { department, year, block } = req.query;
        const filter = { expiresAt: { $gt: new Date() } };
        if (department && department !== "all") filter.targetDept  = { $in: [department, "all"] };
        if (year)        filter.targetYear  = { $in: [Number(year), 0] };
        if (block && block !== "all")        filter.targetBlock = { $in: [block, "all"] };

        const notices = await Notice.find(filter)
            .populate("postedBy", "email role")
            .sort({ pinned: -1, createdAt: -1 });

        return res.json({ success: true, data: notices });
    } catch (err) { return handleError(res, err); }
};

// GET /notices/:id
export const getNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id).populate("postedBy", "email");
        if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
        return res.json({ success: true, data: notice });
    } catch (err) { return handleError(res, err); }
};

// DELETE /notices/:id
export const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
        if (notice.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        
        if (notice.imagePublicId) {
            deleteFromCloudinary(notice.imagePublicId).catch(console.error);
        }
        
        await notice.deleteOne();
        return res.json({ success: true, message: "Notice deleted" });
    } catch (err) { return handleError(res, err); }
};

// PATCH /notices/:id/pin — admin only
export const pinNotice = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });

        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

        notice.pinned = !notice.pinned;
        await notice.save();
        return res.json({ success: true, pinned: notice.pinned });
    } catch (err) { return handleError(res, err); }
};
