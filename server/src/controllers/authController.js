import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import { generateAccessToken, generateRefreshToken, generateVerificationToken } from "../utils/generateToken.js";
import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email, password, confirmPassword, recaptchaToken } = req.body;

        // 1. Validation
        if (!email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const emailRegex = /^\d{10}@student\.annauniv\.edu$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please use a valid student email (e.g., 2024103543@student.annauniv.edu)" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Google ReCaptcha Verification
        if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
            try {
                const recaptchaResponse = await axios.post(
                    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
                );

                if (!recaptchaResponse.data.success) {
                    // console.log("ReCaptcha Failed:", recaptchaResponse.data); // Reduce logging
                    return res.status(400).json({ message: "ReCaptcha verification failed" });
                }
            } catch (err) {
                console.error("ReCaptcha Error:", err);
                // Fail open or closed? Let's fail open for dev if network error, but closed for production
                if (process.env.NODE_ENV === 'production') {
                    return res.status(400).json({ message: "ReCaptcha error" });
                }
            }
        } else if (process.env.NODE_ENV === 'production') {
            return res.status(400).json({ message: "ReCaptcha is required" });
        } else {
            console.log("Skipping ReCaptcha verification (No key or token provided in dev)");
        }


        // 3. Create User (Unverified)
        const verificationToken = generateVerificationToken();
        const verificationTokenHash = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const user = await User.create({
            email,
            password,
            verificationToken: verificationTokenHash,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
        });

        // 4. Send Verification Email (Non-blocking for speed)
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${verificationToken}`;

        const message = `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
        `;

        sendEmail({
            to: user.email,
            subject: "Account Verification",
            text: message,
        }).catch(async (err) => {
            console.error("Email send failed:", err);
            // Optional: retry logic or cleanup could go here, but for now we prioritize the user response.
            // Converting back to unverified or deleting user might be too aggressive if it's just a transient email error.
        });

        res.status(200).json({ message: "Registration successful. Please check your email." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};



// @desc    Verify user email
// @route   GET /api/auth/verify/:token
// @access  Public
export const verifyEmail = async (req, res) => {
    try {
        const verificationToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            verificationToken,
            verificationTokenExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" }); // Keep generic for password
        }

        if (!user.isVerified) {
            // Resend a fresh verification token and email so user can activate their account
            try {
                const verificationToken = generateVerificationToken();
                const verificationTokenHash = crypto
                    .createHash("sha256")
                    .update(verificationToken)
                    .digest("hex");

                user.verificationToken = verificationTokenHash;
                user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
                await user.save({ validateBeforeSave: false });

                const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${verificationToken}`;
                const message = `
                    <h1>Email Verification</h1>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
                `;

                sendEmail({
                    to: user.email,
                    subject: "Account Verification",
                    text: message,
                }).catch((err) => console.error("Email send failed:", err));
            } catch (err) {
                console.error("Error while resending verification token:", err);
            }

            return res.status(401).json({ message: "Please verify your email first" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Send refresh token in HTTP-only cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            _id: user._id,
            email: user.email,
            accessToken,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
    const refreshToken = req.cookies.jwt;

    if (!refreshToken) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const accessToken = generateAccessToken(user);

        res.json({ accessToken });
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You have requested a password reset. Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                text: message,
            });

            res.status(200).json({ message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ message: "Email could not be sent" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.resetToken)
        .digest("hex");

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: "Password updated successfully. Please login." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
