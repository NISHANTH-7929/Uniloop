import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
};

export const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
};

export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
