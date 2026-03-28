import User from "../models/User.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// GET /profile/:userId
export const getCommunityProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select(
            "email role communitySupport.bloodType communitySupport.isDonorActive " +
            "communitySupport.totalDonations communitySupport.ratings " +
            "communitySupport.qaContribScore communitySupport.itemsReturned " +
            "communitySupport.sessionsCompleted communitySupport.communityBadges"
            // NOTE: moodLogs and counselorBookings are intentionally excluded
        );

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const cs = user.communitySupport || {};

        const avgRating = (r) => (r && r.count > 0 ? (r.total / r.count).toFixed(1) : null);

        return res.json({
            success: true,
            data: {
                userId:            user._id,
                email:             user.email,
                role:              user.role,
                bloodType:         cs.bloodType || null,
                isDonorActive:     cs.isDonorActive,
                totalDonations:    cs.totalDonations || 0,
                qaContribScore:    cs.qaContribScore || 0,
                itemsReturned:     cs.itemsReturned || 0,
                sessionsCompleted: cs.sessionsCompleted || 0,
                communityBadges:   cs.communityBadges || [],
                ratings: {
                    asTutor:      avgRating(cs.ratings?.asTutor),
                    asLearner:    avgRating(cs.ratings?.asLearner),
                    asSkillGiver: avgRating(cs.ratings?.asSkillGiver),
                    asSkillTaker: avgRating(cs.ratings?.asSkillTaker),
                    asLFReturner: avgRating(cs.ratings?.asLFReturner),
                    asLFClaimer:  avgRating(cs.ratings?.asLFClaimer),
                },
            },
        });
    } catch (err) { return handleError(res, err); }
};
