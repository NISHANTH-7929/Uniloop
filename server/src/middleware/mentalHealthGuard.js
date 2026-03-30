/**
 * mentalHealthGuard.js
 * Ensures only the owner or an admin can access mood/mental health data.
 * Must be mounted AFTER the protect middleware so req.user is available.
 */
export const mentalHealthGuard = (req, res, next) => {
    const requestedUserId = req.params.userId || req.user._id.toString();
    const currentUserId   = req.user._id.toString();
    const isAdmin         = req.user.role === "admin";

    if (currentUserId === requestedUserId || isAdmin) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "Mental health data is private",
    });
};
