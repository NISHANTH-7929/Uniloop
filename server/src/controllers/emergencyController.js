import EmergencyRequest from "../models/EmergencyRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getIO } from "../utils/socketUtils.js";
import { isSosLimitExceeded } from "../utils/sosRateLimit.js";
import { checkAndAwardBadges } from "../utils/communityBadgeUtils.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// POST /emergency
export const createEmergency = async (req, res) => {
    try {
        const { type, bloodType, urgency, title, description, location, broadcastScope } = req.body;

        // SOS rate limit check (non-blood only)
        if (type !== "blood") {
            const limited = await isSosLimitExceeded(req.user._id);
            if (limited) {
                return res.status(429).json({ success: false, message: "You can send max 3 SOS alerts per 24 hours" });
            }
        }

        const emergency = await EmergencyRequest.create({
            poster: req.user._id,
            type, bloodType: bloodType || null,
            urgency: urgency || "normal",
            title, description, location,
            broadcastScope: broadcastScope || "block",
        });

        const io = getIO();

        if (type === "blood") {
            // Find eligible donors
            const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
            const donors = await User.find({
                "communitySupport.bloodType": bloodType,
                "communitySupport.isDonorActive": true,
                $or: [
                    { "communitySupport.lastDonationDate": null },
                    { "communitySupport.lastDonationDate": { $lt: cutoff } },
                ],
            });

            for (const donor of donors) {
                io.to(donor._id.toString()).emit("emergency:blood", {
                    emergencyId: emergency._id,
                    bloodType,
                    location,
                    title,
                });
                // DB notification
                await Notification.create({
                    recipient: donor._id,
                    type: "blood_request",
                    title: `Blood Donation Needed: ${bloodType}`,
                    message: title,
                    relatedId: emergency._id,
                });
            }
        } else {
            // SOS broadcast
            if (broadcastScope === "campus") {
                io.emit("emergency:sos", { emergencyId: emergency._id, title, location, urgency });
            } else {
                // Broadcast to users with same hostelBlock
                const blockUsers = await User.find({ hostelBlock: req.user.hostelBlock });
                for (const u of blockUsers) {
                    io.to(u._id.toString()).emit("emergency:sos", {
                        emergencyId: emergency._id, title, location, urgency
                    });
                }
            }
        }

        return res.status(201).json({ success: true, data: emergency });
    } catch (err) { return handleError(res, err); }
};

// GET /emergency
export const getEmergencies = async (req, res) => {
    try {
        const { bloodType, status } = req.query;
        const filter = { status: status || "active" };
        if (bloodType) filter.bloodType = bloodType;
        const items = await EmergencyRequest.find(filter)
            .populate("poster", "email hostelBlock")
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: items });
    } catch (err) { return handleError(res, err); }
};

// GET /emergency/:id
export const getEmergency = async (req, res) => {
    try {
        const item = await EmergencyRequest.findById(req.params.id)
            .populate("poster", "email")
            .populate("responses.responder", "email");
        if (!item) return res.status(404).json({ success: false, message: "Emergency not found" });
        return res.json({ success: true, data: item });
    } catch (err) { return handleError(res, err); }
};

// POST /emergency/:id/respond
export const respondToEmergency = async (req, res) => {
    try {
        const item = await EmergencyRequest.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Emergency not found" });
        if (item.poster.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot respond to your own emergency" });
        }

        item.responses.push({ responder: req.user._id, message: req.body.message || "" });
        await item.save();

        try {
            getIO().to(item.poster.toString()).emit("emergency:responded", {
                emergencyId: item._id,
                responder: req.user.email,
            });
        } catch (_) {}

        return res.json({ success: true, message: "Response registered" });
    } catch (err) { return handleError(res, err); }
};

// PATCH /emergency/:id/confirm/:responderId
export const confirmResponder = async (req, res) => {
    try {
        const item = await EmergencyRequest.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Emergency not found" });
        if (item.poster.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the poster can confirm responses" });
        }

        const response = item.responses.find(r => r.responder.toString() === req.params.responderId);
        if (!response) return res.status(404).json({ success: false, message: "Responder not found" });

        if (response.confirmed) return res.status(400).json({ success: false, message: "Already confirmed" });
        response.confirmed = true;
        await item.save();

        // If blood donation: update donor stats
        if (item.type === "blood") {
            const donor = await User.findById(req.params.responderId);
            if (donor) {
                donor.communitySupport.totalDonations += 1;
                donor.communitySupport.lastDonationDate = new Date();
                await donor.save();
                await checkAndAwardBadges(donor);
            }
        }

        return res.json({ success: true, message: "Responder confirmed" });
    } catch (err) { return handleError(res, err); }
};

// PATCH /emergency/:id/resolve
export const resolveEmergency = async (req, res) => {
    try {
        const item = await EmergencyRequest.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Emergency not found" });
        if (item.poster.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the poster can resolve" });
        }

        item.status = "resolved";
        item.resolvedAt = new Date();
        await item.save();

        // Notify all responders
        try {
            const io = getIO();
            for (const r of item.responses) {
                io.to(r.responder.toString()).emit("emergency:resolved", { emergencyId: item._id });
            }
        } catch (_) {}

        return res.json({ success: true, message: "Emergency resolved" });
    } catch (err) { return handleError(res, err); }
};
