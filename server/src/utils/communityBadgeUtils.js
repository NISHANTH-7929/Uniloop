/**
 * communityBadgeUtils.js
 * Evaluates all 8 community badge conditions and awards missing ones.
 * Always call after rating updates or score changes.
 */
import { getIO } from "./socketUtils.js";

const BADGES = {
    GOOD_SAMARITAN: "Good Samaritan",
    CAMPUS_HERO:    "Campus Hero",
    VERIFIED_TUTOR: "Verified Tutor",
    SKILL_SHARER:   "Skill Sharer",
    DEPT_MENTOR:    "Dept. Mentor",
    TOP_CONTRIBUTOR:"Top Contributor",
};

const avgRating = (ratingObj) => {
    if (!ratingObj || ratingObj.count === 0) return 0;
    return ratingObj.total / ratingObj.count;
};

export const checkAndAwardBadges = async (user) => {
    if (!user.communitySupport) return;
    const cs = user.communitySupport;
    const awarded = [];

    const award = (badge) => {
        if (!cs.communityBadges.includes(badge)) {
            cs.communityBadges.push(badge);
            awarded.push(badge);
        }
    };

    // Good Samaritan — 3+ items returned AND L&F returner avg >= 4.5
    if (cs.itemsReturned >= 3 && avgRating(cs.ratings?.asLFReturner) >= 4.5) {
        award(BADGES.GOOD_SAMARITAN);
    }

    // Campus Hero — 3+ blood donations
    if (cs.totalDonations >= 3) {
        award(BADGES.CAMPUS_HERO);
    }

    // Verified Tutor — tutor rating avg >= 4.5 AND sessions >= 5
    if (cs.sessionsCompleted >= 5 && avgRating(cs.ratings?.asTutor) >= 4.5) {
        award(BADGES.VERIFIED_TUTOR);
    }

    // Skill Sharer — skill sessions >= 5 AND skill giver avg >= 4.5
    if (cs.sessionsCompleted >= 5 && avgRating(cs.ratings?.asSkillGiver) >= 4.5) {
        award(BADGES.SKILL_SHARER);
    }

    // Dept. Mentor — qaContribScore >= 50
    if (cs.qaContribScore >= 50) {
        award(BADGES.DEPT_MENTOR);
    }

    // Top Contributor — holds 3+ other badges simultaneously
    const coreCount = [
        BADGES.GOOD_SAMARITAN,
        BADGES.CAMPUS_HERO,
        BADGES.VERIFIED_TUTOR,
        BADGES.SKILL_SHARER,
        BADGES.DEPT_MENTOR,
    ].filter(b => cs.communityBadges.includes(b)).length;

    if (coreCount >= 3) {
        award(BADGES.TOP_CONTRIBUTOR);
    }

    if (awarded.length > 0) {
        await user.save();
        try {
            const io = getIO();
            for (const badge of awarded) {
                io.to(user._id.toString()).emit("badge:awarded", { badge });
            }
        } catch (_) { /* socket not critical */ }
    }
};
