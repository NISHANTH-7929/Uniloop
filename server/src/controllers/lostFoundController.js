import bcrypt from "bcryptjs";
import LostFoundItem from "../models/LostFoundItem.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getIO } from "../utils/socketUtils.js";
import { runLostFoundMatch } from "../utils/matchUtils.js";
import { checkAndAwardBadges } from "../utils/communityBadgeUtils.js";

const USER_SELECT = "-password -communitySupport.moodLogs -communitySupport.counselorBookings";

// Helper: handle Mongoose errors
const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /lostfound
export const createItem = async (req, res) => {
    try {
        const { type, title, description, category, locationTag, imageUrl,
                isAnonymous, claimQuestion, claimAnswer } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "An image is required for all lost & found submissions." });
        }
        if (type === "found" && (!claimQuestion || !claimAnswer)) {
            return res.status(400).json({ success: false, message: "A claim question and answer are mandatory for found items." });
        }

        let answerHash = null;
        if (type === "found" && claimAnswer) {
            answerHash = await bcrypt.hash(claimAnswer, 10);
        }

        const item = await LostFoundItem.create({
            reporter:    isAnonymous ? null : req.user._id,
            isAnonymous: !!isAnonymous,
            type, title, description, category, locationTag,
            imageUrl,
            claimVerification: {
                question: claimQuestion || null,
                answerHash,
            },
        });

        // Smart match — fire and forget
        runLostFoundMatch(item).catch(() => {});

        return res.status(201).json({ success: true, data: item });
    } catch (err) { return handleError(res, err); }
};

// GET /lostfound
export const getItems = async (req, res) => {
    try {
        const { type, category, status } = req.query;
        const filter = {};
        if (type)     filter.type     = type;
        if (category) filter.category = category;
        if (status)   filter.status   = status;
        else          filter.status   = { $ne: "archived" };

        const items = await LostFoundItem.find(filter)
            .populate("reporter", "email")
            .sort({ createdAt: -1 });

        // Strip reporter if anonymous
        const safe = items.map(item => {
            const obj = item.toObject();
            if (obj.isAnonymous) { obj.reporter = null; }
            return obj;
        });
        return res.json({ success: true, data: safe });
    } catch (err) { return handleError(res, err); }
};

// GET /lostfound/my
export const getMyItems = async (req, res) => {
    try {
        const items = await LostFoundItem.find({ reporter: req.user._id, isAnonymous: false })
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: items });
    } catch (err) { return handleError(res, err); }
};

// GET /lostfound/:id
export const getItem = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id)
            .populate("reporter", "email")
            .populate("claimVerification.claimedBy", "email");
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        const obj = item.toObject();
        if (obj.isAnonymous) obj.reporter = null;
        // Hide answerHash from response
        if (obj.claimVerification) delete obj.claimVerification.answerHash;
        return res.json({ success: true, data: obj });
    } catch (err) { return handleError(res, err); }
};

// POST /lostfound/:id/claim
export const claimItem = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id).populate("reporter", "email");
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        if (item.status !== "active") return res.status(400).json({ success: false, message: "Item is not claimable" });
        if (item.type !== "found") return res.status(400).json({ success: false, message: "Only 'found' items can be claimed" });

        const userId = req.user._id.toString();
        const reporterId = item.reporter?._id?.toString() || item.reporter?.toString();
        if (!item.isAnonymous && reporterId === userId) {
            return res.status(400).json({ success: false, message: "You cannot claim your own item" });
        }

        // If item has a claim verification question, validate the answer
        if (item.claimVerification?.answerHash) {
            const { answer } = req.body;
            if (!answer) {
                return res.status(400).json({ success: false, message: "Please provide the answer to claim this item" });
            }
            const match = await bcrypt.compare(answer, item.claimVerification.answerHash);
            if (!match) return res.status(400).json({ success: false, message: "Incorrect answer — only the true owner would know" });
        }

        item.claimVerification.claimedBy = req.user._id;
        await item.save();

        // Notify reporter (finder) via socket + DB
        if (item.reporter && !item.isAnonymous) {
            try {
                const reporterIdStr = item.reporter._id?.toString() || item.reporter.toString();
                getIO().to(reporterIdStr).emit("lostfound:claimRequest", {
                    itemId:       item._id,
                    claimerName:  req.user.email.split("@")[0],
                    claimerId:    req.user._id,
                });
                await Notification.create({
                    recipient: reporterIdStr,
                    type: "info",
                    title: "📦 Claim Request Received",
                    message: `${req.user.email.split("@")[0]} claimed your item '${item.title}'. Go confirm it!`,
                    relatedId: item._id,
                });
            } catch (_) {}
        }

        return res.json({ success: true, message: "Claim request sent — the finder will confirm." });
    } catch (err) { return handleError(res, err); }
};

// PATCH /lostfound/:id/confirm-claim
export const confirmClaim = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        const userId = req.user._id.toString();
        if (!item.reporter || item.reporter.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Only the finder can confirm a claim" });
        }
        if (!item.claimVerification?.claimedBy) {
            return res.status(400).json({ success: false, message: "No pending claim to confirm" });
        }

        item.status = "claimed";
        item.claimVerification.claimedAt = new Date();
        await item.save();

        // Notify claimer + log it
        try {
            getIO().to(item.claimVerification.claimedBy.toString()).emit("lostfound:claimed", {
                itemId:     item._id,
                finderName: req.user.email.split("@")[0],
            });
            await Notification.create({
                recipient: item.claimVerification.claimedBy,
                type: "success",
                title: "✅ Claim Confirmed!",
                message: `Your claim on '${item.title}' was confirmed by the finder. Collect it soon!`,
                relatedId: item._id,
            });
        } catch (_) {}

        return res.json({ success: true, message: "Claim confirmed", data: item });
    } catch (err) { return handleError(res, err); }
};

// POST /lostfound/:id/review
export const submitReview = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        if (item.status !== "claimed") return res.status(400).json({ success: false, message: "Reviews only unlock after item is claimed" });

        const userId    = req.user._id.toString();
        const finderId  = item.reporter?.toString();
        const claimerId = item.claimVerification?.claimedBy?.toString();

        const isFinder  = userId === finderId;
        const isClaimer = userId === claimerId;
        if (!isFinder && !isClaimer) return res.status(403).json({ success: false, message: "You are not a party to this item" });

        const { rating, comment } = req.body;
        const reviewKey = isFinder ? "finderReview" : "claimerReview";

        // 48h edit window
        if (item[reviewKey].submitted && item[reviewKey].submittedAt) {
            const elapsed = Date.now() - new Date(item[reviewKey].submittedAt).getTime();
            if (elapsed > 48 * 60 * 60 * 1000) {
                return res.status(403).json({ success: false, message: "Review edit window closed" });
            }
        }

        item[reviewKey] = { rating, comment, submitted: true, submittedAt: new Date() };

        if (item.finderReview.submitted && item.claimerReview.submitted) {
            item.reviewsRevealed = true;

            // Update ratings for both parties
            const [finder, claimer] = await Promise.all([
                User.findById(finderId),
                User.findById(claimerId),
            ]);
            if (finder) {
                finder.communitySupport.itemsReturned += 1;
                finder.communitySupport.ratings.asLFReturner.total += item.claimerReview.rating;
                finder.communitySupport.ratings.asLFReturner.count += 1;
                await finder.save();
                await checkAndAwardBadges(finder);
            }
            if (claimer) {
                claimer.communitySupport.ratings.asLFClaimer.total += item.finderReview.rating;
                claimer.communitySupport.ratings.asLFClaimer.count += 1;
                await claimer.save();
                await checkAndAwardBadges(claimer);
            }

            // Emit reveal event
            try {
                const io = getIO();
                [finderId, claimerId].filter(Boolean).forEach(id =>
                    io.to(id).emit("lostfound:reviewRevealed", { itemId: item._id })
                );
            } catch (_) {}
        }

        await item.save();
        return res.json({ success: true, message: "Review submitted" });
    } catch (err) { return handleError(res, err); }
};

// GET /lostfound/:id/review
export const getReview = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        if (!item.reviewsRevealed) return res.json({ success: true, waiting: true });
        return res.json({ success: true, data: { finderReview: item.finderReview, claimerReview: item.claimerReview } });
    } catch (err) { return handleError(res, err); }
};

// POST /lostfound/:id/report-found
export const reportFound = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id).populate("reporter", "email");
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        if (item.type !== "lost") return res.status(400).json({ success: false, message: "Can only report finding a 'lost' item" });
        if (item.status !== "active") return res.status(400).json({ success: false, message: "Item is not active" });

        const { imageUrl, message } = req.body;
        if (!imageUrl) return res.status(400).json({ success: false, message: "Image is required to verify you found it" });

        item.foundReports.push({
            reporter: req.user._id,
            imageUrl,
            message
        });
        await item.save();

        // Broadcast to reporter (lost item owner)
        if (item.reporter && !item.isAnonymous) {
            try {
                const reporterIdStr = item.reporter._id?.toString() || item.reporter.toString();
                getIO().to(reporterIdStr).emit("lostfound:foundReport", {
                    itemId: item._id, alertMessage: `Someone claims they found your '${item.title}'!`
                });
                await Notification.create({
                    recipient: reporterIdStr,
                    type: "success",
                    title: "🔍 Someone Found Your Item!",
                    message: `${req.user.email.split("@")[0]} says they found '${item.title}'. Check Lost & Found for their photo!`,
                    relatedId: item._id,
                });
            } catch (_) {}
        }
        return res.json({ success: true, message: "Report sent to the owner." });
    } catch (err) { return handleError(res, err); }
};
