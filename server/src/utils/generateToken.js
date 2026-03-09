import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "1h", // Extended slightly for dev convenience
    });
};

export const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
};

export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
