import User from "../models/User.js";
import Notification from "../models/Notification.js";
import sendEmail from "../utils/sendEmail.js";
import { generateAccessToken, generateRefreshToken, generateVerificationToken } from "../utils/generateToken.js";
import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import RoleTransition from "../models/RoleTransition.js";

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


        // 3. Create Verification Token (Stateless)
        // Instead of saving the user, we encode their info securely in a JWT that expires in 24 hours.
        const verificationToken = jwt.sign(
            { email, password },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Send Verification Email (Non-blocking for speed)
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${verificationToken}`;

        const message = `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
        `;

        sendEmail({
            to: email,
            subject: "Account Verification",
            text: message,
        }).catch(async (err) => {
            console.error("Email send failed:", err);
            // Optional: retry logic or cleanup could go here, but for now we prioritize the user response.
            // Converting back to unverified or deleting user might be too aggressive if it's just a transient email error.
        });

        res.status(200).json({ message: "Registration successful. Please check your email." });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};



// @desc    Verify user email
// @route   GET /api/auth/verify/:token
// @access  Public
export const verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired verification link" });
        }

        const { email, password } = decoded;

        // Ensure user hasn't already been verified/created
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User is already verified and registered" });
        }

        // Create the user permanently in the DB since they are now verified
        await User.create({
            email,
            password,
            isVerified: true
        });

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

            return res.status(401).json({ message: "Please verify your email first", requiresVerification: true });
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

        // Send email asynchronously so the endpoint responds quickly
        sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            text: message,
        }).then(() => {
            // optionally log success
        }).catch(async (error) => {
            console.error("Forgot password email send failed:", error);
            // rollback token if email failed
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        });

        // Respond immediately to make UX snappy; email is being delivered in background
        res.status(200).json({ message: "If an account exists with that email, a reset link has been sent." });

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

// @desc    Get User Notifications
// @route   GET /api/auth/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching notifications" });
    }
};

// @desc    Respond to Volunteer Request
// @route   POST /api/auth/notifications/:id/respond
// @access  Private
export const respondToVolunteerRequest = async (req, res) => {
    try {
        const { response } = req.body; // 'accept' or 'decline'
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOne({ _id: notificationId, user: userId });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.action !== 'volunteer_request' && notification.action !== 'part_organizer_request') {
            return res.status(400).json({ message: "Invalid action type" });
        }

        if (notification.isRead) {
            return res.status(400).json({ message: "Request has already been processed" });
        }

        const event = await Event.findById(notification.relatedEvent);
        if (!event) {
            notification.isRead = true;
            await notification.save();
            return res.status(404).json({ message: "The associated event no longer exists" });
        }

        if (response === 'accept') {
            if (notification.action === 'part_organizer_request') {
                if (!event.partOrganizers) event.partOrganizers = [];
                if (!event.partOrganizers.includes(userId)) {
                    event.partOrganizers.push(userId);
                    await event.save();

                    const userDoc = await User.findById(userId);
                    if (userDoc && userDoc.role !== 'organizer' && userDoc.role !== 'admin') {
                        userDoc.role = 'organizer';
                        await userDoc.save();
                    }

                    await RoleTransition.create({
                        user: userId,
                        event: event._id,
                        previousRole: req.user.role,
                        newRole: 'organizer',
                        reason: 'Accepted part organizer request',
                        changedBy: userId
                    });
                }
                notification.title = "Part Organizer Request Accepted";
                notification.message = `You are now a part organizer for ${event.title}.`;
                notification.type = "success";
            } else {
                // Check if already a volunteer
                if (!event.volunteers.includes(userId)) {
                    event.volunteers.push(userId);
                    await event.save();

                    // Log role transition
                    await RoleTransition.create({
                        user: userId,
                        event: event._id,
                        previousRole: req.user.role,
                        newRole: 'volunteer',
                        reason: 'Accepted volunteer request',
                        changedBy: userId
                    });

                    // Cancel existing tickets if any
                    const tickets = await Ticket.find({ user: userId, event: event._id, status: 'ACTIVE' });
                    for (let ticket of tickets) {
                        ticket.status = 'CANCELLED';
                        await ticket.save();

                        const pCount = ticket.persons ? ticket.persons.length : 1;
                        event.registeredCount = Math.max(0, event.registeredCount - pCount);
                    }
                    if (tickets.length > 0) await event.save();
                }
                notification.title = "Volunteer Request Accepted";
                notification.message = `You are now a volunteer for ${event.title}.`;
                notification.type = "success";
            }
        } else if (response === 'decline') {
            const roleName = notification.action === 'part_organizer_request' ? 'part organizer' : 'volunteer';
            notification.title = "Request Declined";
            notification.message = `You declined the request to be a ${roleName} for ${event.title}.`;
            notification.type = "info";
        } else {
            return res.status(400).json({ message: "Invalid response" });
        }

        notification.isRead = true;
        notification.action = null; // Clear action so buttons hide
        await notification.save();

        res.json({ message: `Request ${response}ed successfully`, notification });
    } catch (error) {
        console.error("Respond request error:", error);
        res.status(500).json({ message: "Server Error responding to request" });
    }
};

// @desc    Mark all notifications as read
// @route   POST /api/auth/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { 
                user: req.user._id, 
                isRead: false,
                $or: [{ action: null }, { action: { $exists: false } }, { action: "" }]
            },
            { isRead: true }
        );
        res.json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ message: "Server Error marking notifications as read" });
    }
};
