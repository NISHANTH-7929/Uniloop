/**
 * sosRateLimit.js
 * Checks whether a user has already sent 3 SOS alerts in the last 24 hours.
 * Returns true if limit exceeded.
 */
import EmergencyRequest from "../models/EmergencyRequest.js";

export const isSosLimitExceeded = async (userId) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await EmergencyRequest.countDocuments({
        poster: userId,
        type:   { $ne: "blood" },
        createdAt: { $gt: since },
    });
    return count >= 3;
};
