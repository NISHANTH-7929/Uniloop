import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Assign Organizer Role
// @route   PUT /api/admin/users/:id/organizer
// @access  Private (Admin)
export const assignOrganizer = async (req, res) => {
    try {
        const { from, to } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = "organizer";
        if (from || to) {
            if (!from || !to) {
                return res.status(400).json({ message: "Both 'Valid From' and 'Valid To' must be provided together." });
            }
            
            const fromDate = new Date(from);
            const toDate = new Date(to);
            const now = new Date();

            if (toDate <= fromDate) {
                return res.status(400).json({ message: "'Valid To' date must be strictly after the 'Valid From' date." });
            }
            if (toDate <= now) {
                return res.status(400).json({ message: "The 'Valid To' date must be in the future." });
            }

            user.organizerValidity = {
                from: fromDate,
                to: toDate
            };
        } else {
            user.organizerValidity = undefined; // Permanent organizer
        }

        await user.save();
        res.status(200).json({ message: "Organizer role assigned successfully", user });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Demote Organizer to Student
// @route   PUT /api/admin/users/:id/demote
// @access  Private (Admin)
export const demoteOrganizer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = "student";
        user.organizerValidity = undefined;

        await user.save();
        res.status(200).json({ message: "Organizer successfully demoted to student", user });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Reset Testing Data (Wipe events/tickets & demote users)
// @route   POST /api/admin/reset
// @access  Private (Admin)
export const resetDatabase = async (req, res) => {
    try {
        // 1. Delete all Events and Tickets
        await Event.deleteMany({});
        await Ticket.deleteMany({});

        // 2. Demote all non-admin users to student
        // Using updateMany is faster than looping
        const demoteResult = await User.updateMany(
            { role: { $ne: 'admin' } },
            { 
                $set: { role: 'student' },
                $unset: { organizerValidity: "" }
            }
        );

        res.status(200).json({ 
            message: "Testing data reset successfully. All events/tickets deleted and users demoted.",
            usersDemoted: demoteResult.modifiedCount
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to reset database", error: error.message });
    }
};
