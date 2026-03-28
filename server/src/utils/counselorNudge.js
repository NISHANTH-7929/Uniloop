/**
 * counselorNudge.js
 * After every mood log, checks if 5+ of the last 7 logs have score <= 2.
 * If so (and not already nudged in the last 7 days), creates a DB Notification.
 */
import Notification from "../models/Notification.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const runCounselorNudge = async (user) => {
    try {
        const cs = user.communitySupport;
        if (!cs) return;

        // Check 7-day cooldown
        if (cs.counselorNudgeSent && cs.counselorNudgedAt) {
            const elapsed = Date.now() - new Date(cs.counselorNudgedAt).getTime();
            if (elapsed < SEVEN_DAYS_MS) return;
        }

        // Get last 7 mood logs
        const last7 = [...cs.moodLogs]
            .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
            .slice(0, 7);

        const lowCount = last7.filter(log => log.score <= 2).length;
        if (lowCount < 5) return;

        // Create notification
        await Notification.create({
            recipient: user._id,
            type:      "counselor_nudge",
            title:     "Support Available",
            message:   "Our campus counselor is available. Would you like to schedule a session?",
            link:      "/community/mentalhealth/book",
            relatedId: user._id,
        });

        // Set flag
        cs.counselorNudgeSent = true;
        cs.counselorNudgedAt  = new Date();
        await user.save();
    } catch (err) {
        console.error("counselorNudge error:", err);
    }
};
