/**
 * matchUtils.js
 * Lost & Found smart matching: when a new item is posted, query
 * the opposite type with same category, emit socket to reporter.
 */
import LostFoundItem from "../models/LostFoundItem.js";
import { getIO } from "./socketUtils.js";

export const runLostFoundMatch = async (newItem) => {
    try {
        const oppositeType = newItem.type === "found" ? "lost" : "found";
        const matches = await LostFoundItem.find({
            type: oppositeType,
            category: newItem.category,
            status: "active",
            matchNotified: false,
        });

        if (matches.length === 0) return;

        const io = getIO();
        for (const match of matches) {
            if (!match.reporter || match.isAnonymous) continue;
            io.to(match.reporter.toString()).emit("lostfound:match", {
                foundItemId:    newItem.type === "found" ? newItem._id : match._id,
                foundItemTitle: newItem.type === "found" ? newItem.title : match.title,
                locationTag:    newItem.type === "found" ? newItem.locationTag : match.locationTag,
            });
        }

        // Mark the new item as having triggered a match notification
        newItem.matchNotified = true;
        await newItem.save();
    } catch (err) {
        console.error("matchUtils error:", err);
    }
};
