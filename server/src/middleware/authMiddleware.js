import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            // Time-Limited Organizer Enforcement
            if (req.user.role === "organizer" && req.user.organizerValidity?.to) {
                const now = new Date();
                const toDate = new Date(req.user.organizerValidity.to);
                if (now > toDate) {
                    req.user.role = "student";
                    req.user.organizerValidity = undefined;
                    await req.user.save();
                }
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
