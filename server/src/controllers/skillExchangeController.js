import SkillExchange from "../models/SkillExchange.js";
import User from "../models/User.js";
import { getIO } from "../utils/socketUtils.js";
import { checkAndAwardBadges } from "../utils/communityBadgeUtils.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

export const createSkill = async (req, res) => {
    try {
        const skill = await SkillExchange.create({ poster: req.user._id, ...req.body });
        return res.status(201).json({ success: true, data: skill });
    } catch (err) { return handleError(res, err); }
};

export const getSkills = async (req, res) => {
    try {
        const { category, offerSkill, wantSkill, status } = req.query;
        const filter = { status: status || "open" };
        if (category)   filter.category   = category;
        if (offerSkill) filter.offerSkill  = { $regex: offerSkill, $options: "i" };
        if (wantSkill)  filter.wantSkill   = { $regex: wantSkill,  $options: "i" };

        const skills = await SkillExchange.find(filter)
            .populate("poster", "email")
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: skills });
    } catch (err) { return handleError(res, err); }
};

export const getSkill = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id)
            .populate("poster",      "email communitySupport.ratings communitySupport.communityBadges")
            .populate("matchedWith", "email");
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        return res.json({ success: true, data: skill });
    } catch (err) { return handleError(res, err); }
};

export const matchSkill = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        if (skill.status !== "open") return res.status(400).json({ success: false, message: "Not open for matching" });
        if (skill.poster.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot match your own listing" });
        }

        skill.matchedWith = req.user._id;
        skill.status = "matched";
        await skill.save();

        try {
            getIO().to(skill.poster.toString()).emit("skills:matched", { skillId: skill._id });
        } catch (_) {}

        return res.json({ success: true, data: skill });
    } catch (err) { return handleError(res, err); }
};

export const completeSkill = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        if (skill.status !== "matched") return res.status(400).json({ success: false, message: "Not in matched state" });

        const userId = req.user._id.toString();
        if (!skill.completedByFirst) {
            skill.completedByFirst = req.user._id;
            await skill.save();
            return res.json({ success: true, message: "Marked — waiting for other party" });
        }
        if (skill.completedByFirst.toString() === userId) {
            return res.json({ success: true, message: "Already marked — waiting for other party" });
        }

        skill.status = "completed";
        await skill.save();

        const [poster, matched] = await Promise.all([
            User.findById(skill.poster),
            User.findById(skill.matchedWith),
        ]);
        for (const u of [poster, matched].filter(Boolean)) {
            u.communitySupport.sessionsCompleted += 1;
            await u.save();
            await checkAndAwardBadges(u);
        }

        try {
            const io = getIO();
            [skill.poster.toString(), skill.matchedWith?.toString()].filter(Boolean).forEach(id =>
                io.to(id).emit("skills:completed", { skillId: skill._id })
            );
        } catch (_) {}

        return res.json({ success: true, data: skill });
    } catch (err) { return handleError(res, err); }
};

export const cancelSkill = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        skill.status = "cancelled";
        await skill.save();
        return res.json({ success: true, data: skill });
    } catch (err) { return handleError(res, err); }
};

export const submitReview = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        if (skill.status !== "completed") return res.status(400).json({ success: false, message: "Reviews only unlock after completion" });

        const userId   = req.user._id.toString();
        const posterId = skill.poster.toString();
        const takerId  = skill.matchedWith?.toString();

        const isGiver = userId === posterId;
        const isTaker = userId === takerId;
        if (!isGiver && !isTaker) return res.status(403).json({ success: false, message: "Not a party to this exchange" });

        const reviewKey = isGiver ? "giverReview" : "takerReview";
        if (skill[reviewKey].submitted && skill[reviewKey].submittedAt) {
            if (Date.now() - new Date(skill[reviewKey].submittedAt).getTime() > 48 * 3600 * 1000) {
                return res.status(403).json({ success: false, message: "Review edit window closed" });
            }
        }

        skill[reviewKey] = { rating: req.body.rating, comment: req.body.comment, submitted: true, submittedAt: new Date() };

        if (skill.giverReview.submitted && skill.takerReview.submitted) {
            skill.reviewsRevealed = true;

            const [giver, taker] = await Promise.all([
                User.findById(posterId),
                User.findById(takerId),
            ]);
            if (giver) {
                giver.communitySupport.ratings.asSkillGiver.total += skill.takerReview.rating;
                giver.communitySupport.ratings.asSkillGiver.count += 1;
                await giver.save();
                await checkAndAwardBadges(giver);
            }
            if (taker) {
                taker.communitySupport.ratings.asSkillTaker.total += skill.giverReview.rating;
                taker.communitySupport.ratings.asSkillTaker.count += 1;
                await taker.save();
                await checkAndAwardBadges(taker);
            }

            try {
                const io = getIO();
                [posterId, takerId].filter(Boolean).forEach(id =>
                    io.to(id).emit("skills:reviewRevealed", { skillId: skill._id })
                );
            } catch (_) {}
        }

        await skill.save();
        return res.json({ success: true, message: "Review submitted" });
    } catch (err) { return handleError(res, err); }
};

export const getReview = async (req, res) => {
    try {
        const skill = await SkillExchange.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill exchange not found" });
        if (!skill.reviewsRevealed) return res.json({ success: true, waiting: true });
        return res.json({ success: true, data: { giverReview: skill.giverReview, takerReview: skill.takerReview } });
    } catch (err) { return handleError(res, err); }
};
