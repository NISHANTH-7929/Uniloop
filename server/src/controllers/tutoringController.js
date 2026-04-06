import TutoringSession from "../models/TutoringSession.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getIO } from "../utils/socketUtils.js";
import { checkAndAwardBadges } from "../utils/communityBadgeUtils.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /tutoring
export const createSession = async (req, res) => {
    try {
        const session = await TutoringSession.create({
            tutor: req.user._id,
            ...req.body,
        });
        return res.status(201).json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// GET /tutoring
export const getSessions = async (req, res) => {
    try {
        const { subjectCode, department, semester, sessionType, status } = req.query;
        const filter = {};
        if (subjectCode)  filter.subjectCode  = subjectCode;
        if (department)   filter.department   = department;
        if (semester)     filter.semester     = Number(semester);
        if (sessionType)  filter.sessionType  = sessionType;
        filter.status = status || "open";

        const sessions = await TutoringSession.find(filter)
            .populate("tutor",   "email communitySupport.ratings")
            .populate("learner", "email")
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: sessions });
    } catch (err) { return handleError(res, err); }
};

// GET /tutoring/:id
export const getSession = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id)
            .populate("tutor",   "email communitySupport.ratings communitySupport.communityBadges")
            .populate("learner", "email");
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        return res.json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// PATCH /tutoring/:id/match
export const matchSession = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        if (session.status !== "open") return res.status(400).json({ success: false, message: "Session is not open" });

        const userId = req.user._id.toString();
        if (session.tutor.toString() === userId) {
            return res.status(400).json({ success: false, message: "You cannot match your own post" });
        }

        if (session.sessionType === "offer") {
            session.learner = req.user._id;
        } else {
            session.tutor = req.user._id;
        }
        session.status = "matched";
        await session.save();

        try {
            const io = getIO();
            const ids = [session.tutor.toString(), session.learner?.toString()].filter(Boolean);
            ids.forEach(id => io.to(id).emit("tutoring:matched", { sessionId: session._id }));
            // DB notifications for both parties
            for (const id of ids) {
                const partnerLabel = id === session.tutor.toString() ? "A learner" : "A tutor";
                await Notification.create({
                    recipient: id,
                    type: "success",
                    title: "🎓 Tutoring Session Matched!",
                    message: `${partnerLabel} matched with your '${session.subject}' session. Message them to schedule!`,
                    relatedId: session._id,
                });
            }
        } catch (_) {}

        return res.json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// PATCH /tutoring/:id/schedule
export const scheduleSession = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        if (!["matched"].includes(session.status)) return res.status(400).json({ success: false, message: "Cannot schedule now" });

        session.scheduledAt = req.body.scheduledAt;
        session.status = "scheduled";
        await session.save();

        try {
            const io = getIO();
            const ids = [session.tutor.toString(), session.learner?.toString()].filter(Boolean);
            ids.forEach(id => io.to(id).emit("tutoring:scheduled", { sessionId: session._id, scheduledAt: session.scheduledAt }));
            for (const id of ids) {
                await Notification.create({
                    recipient: id,
                    type: "info",
                    title: "📅 Session Scheduled",
                    message: `Your '${session.subject}' session is scheduled for ${new Date(session.scheduledAt).toLocaleString()}.`,
                    relatedId: session._id,
                });
            }
        } catch (_) {}

        return res.json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// PATCH /tutoring/:id/complete
export const completeSession = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        if (!["matched","scheduled"].includes(session.status)) {
            return res.status(400).json({ success: false, message: "Session must be matched before completing" });
        }

        const userId = req.user._id.toString();
        if (!session.completedByFirst) {
            session.completedByFirst = req.user._id;
            await session.save();
            // Notify the other party that first confirmation is in
            const otherId = req.user._id.toString() === session.tutor.toString() ? session.learner : session.tutor;
            if (otherId) {
                try {
                    await Notification.create({
                        recipient: otherId,
                        type: "info",
                        title: "🟡 Waiting for Your Completion Confirmation",
                        message: `Your partner marked the '${session.subject}' session as complete. Please confirm to finalise.`,
                        relatedId: session._id,
                    });
                } catch (_) {}
            }
            return res.json({ success: true, message: "Marked — waiting for other party to confirm" });
        }

        if (session.completedByFirst.toString() === userId) {
            return res.json({ success: true, message: "Already marked — waiting for other party" });
        }

        // Both have confirmed
        session.status = "completed";
        session.completedAt = new Date();
        await session.save();

        // Increment sessionsCompleted for both
        const [tutor, learner] = await Promise.all([
            User.findById(session.tutor),
            User.findById(session.learner),
        ]);
        for (const u of [tutor, learner].filter(Boolean)) {
            u.communitySupport.sessionsCompleted += 1;
            await u.save();
            await checkAndAwardBadges(u);
        }

        try {
            const io = getIO();
            const ids = [session.tutor.toString(), session.learner?.toString()].filter(Boolean);
            ids.forEach(id => io.to(id).emit("tutoring:completed", { sessionId: session._id }));
            for (const id of ids) {
                await Notification.create({
                    recipient: id,
                    type: "success",
                    title: "✅ Session Completed!",
                    message: `Your '${session.subject}' tutoring session is complete. Don't forget to leave a review!`,
                    relatedId: session._id,
                });
            }
        } catch (_) {}

        return res.json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// PATCH /tutoring/:id/cancel
export const cancelSession = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        session.status = "cancelled";
        await session.save();
        return res.json({ success: true, data: session });
    } catch (err) { return handleError(res, err); }
};

// POST /tutoring/:id/review
export const submitReview = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        if (session.status !== "completed") return res.status(400).json({ success: false, message: "Reviews only unlock after completion" });

        const userId   = req.user._id.toString();
        const tutorId  = session.tutor.toString();
        const learnerId= session.learner?.toString();

        const isTutor   = userId === tutorId;
        const isLearner = userId === learnerId;
        if (!isTutor && !isLearner) return res.status(403).json({ success: false, message: "Not a party to this session" });

        const reviewKey = isTutor ? "tutorReview" : "learnerReview";

        if (session[reviewKey].submitted && session[reviewKey].submittedAt) {
            if (Date.now() - new Date(session[reviewKey].submittedAt).getTime() > 48 * 3600 * 1000) {
                return res.status(403).json({ success: false, message: "Review edit window closed" });
            }
        }

        session[reviewKey] = { rating: req.body.rating, comment: req.body.comment, submitted: true, submittedAt: new Date() };

        if (session.tutorReview.submitted && session.learnerReview.submitted) {
            session.reviewsRevealed = true;

            const [tutor, learner] = await Promise.all([
                User.findById(tutorId),
                User.findById(learnerId),
            ]);
            if (tutor) {
                tutor.communitySupport.ratings.asTutor.total += session.learnerReview.rating;
                tutor.communitySupport.ratings.asTutor.count += 1;
                await tutor.save();
                await checkAndAwardBadges(tutor);
            }
            if (learner) {
                learner.communitySupport.ratings.asLearner.total += session.tutorReview.rating;
                learner.communitySupport.ratings.asLearner.count += 1;
                await learner.save();
            }

            try {
                const io = getIO();
                [tutorId, learnerId].filter(Boolean).forEach(id =>
                    io.to(id).emit("tutoring:reviewRevealed", { sessionId: session._id })
                );
            } catch (_) {}
        }

        await session.save();
        return res.json({ success: true, message: "Review submitted" });
    } catch (err) { return handleError(res, err); }
};

// GET /tutoring/:id/review
export const getReview = async (req, res) => {
    try {
        const session = await TutoringSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        if (!session.reviewsRevealed) return res.json({ success: true, waiting: true });
        return res.json({ success: true, data: { tutorReview: session.tutorReview, learnerReview: session.learnerReview } });
    } catch (err) { return handleError(res, err); }
};
