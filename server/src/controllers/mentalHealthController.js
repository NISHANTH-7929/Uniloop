import User from "../models/User.js";
import { runCounselorNudge } from "../utils/counselorNudge.js";
import { campusCounselorSlots } from "../../seeds/campusCounselorSlots.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /mentalhealth/log
export const logMood = async (req, res) => {
    try {
        const { score, note } = req.body;
        if (!score || score < 1 || score > 5) {
            return res.status(400).json({ success: false, message: "Score must be between 1 and 5" });
        }

        const user = await User.findById(req.user._id);
        user.communitySupport.moodLogs.push({ score, note: note || "", loggedAt: new Date() });
        await user.save();

        // Run counselor nudge check
        runCounselorNudge(user).catch(() => {});

        return res.status(201).json({ success: true, message: "Mood logged" });
    } catch (err) { return handleError(res, err); }
};

// GET /mentalhealth/log — own data only
export const getMoodLogs = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("communitySupport.moodLogs");
        return res.json({ success: true, data: user.communitySupport.moodLogs });
    } catch (err) { return handleError(res, err); }
};

// GET /mentalhealth/trend — last 30 entries
export const getMoodTrend = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("communitySupport.moodLogs");
        const logs = [...user.communitySupport.moodLogs]
            .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))
            .slice(-30);
        return res.json({ success: true, data: logs });
    } catch (err) { return handleError(res, err); }
};

// GET /mentalhealth/slots — [PUBLIC]
export const getCounselorSlots = async (req, res) => {
    try {
        // Get all booked slots to mark as unavailable
        const users = await User.find({
            "communitySupport.counselorBookings": { $exists: true, $ne: [] }
        }).select("communitySupport.counselorBookings");

        const bookedSlots = new Set();
        for (const u of users) {
            for (const b of u.communitySupport.counselorBookings) {
                if (b.status !== "done") {
                    bookedSlots.add(`${b.slotDate}_${b.slotTime}`);
                }
            }
        }

        const slots = campusCounselorSlots.map(slot => ({
            ...slot,
            isBooked: bookedSlots.has(`${slot.date}_${slot.time}`),
        }));

        return res.json({ success: true, data: slots });
    } catch (err) { return handleError(res, err); }
};

// POST /mentalhealth/book
export const bookCounselorSlot = async (req, res) => {
    try {
        const { slotDate, slotTime } = req.body;
        if (!slotDate || !slotTime) {
            return res.status(400).json({ success: false, message: "slotDate and slotTime are required" });
        }

        // Check if slot is already booked
        const conflict = await User.findOne({
            "communitySupport.counselorBookings": {
                $elemMatch: { slotDate, slotTime, status: { $ne: "done" } }
            }
        });
        if (conflict) return res.status(409).json({ success: false, message: "This slot is already booked" });

        const user = await User.findById(req.user._id);
        user.communitySupport.counselorBookings.push({ slotDate, slotTime });
        await user.save();

        return res.status(201).json({ success: true, message: `Session requested for ${slotDate} ${slotTime}` });
    } catch (err) { return handleError(res, err); }
};

// GET /mentalhealth/bookings — own only
export const getMyBookings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("communitySupport.counselorBookings");
        return res.json({ success: true, data: user.communitySupport.counselorBookings });
    } catch (err) { return handleError(res, err); }
};
