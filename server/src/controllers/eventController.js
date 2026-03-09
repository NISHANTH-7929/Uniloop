import Event from "../models/Event.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Notification from "../models/Notification.js";
import RoleTransition from "../models/RoleTransition.js";
import AttendanceLog from "../models/AttendanceLog.js";

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizer)
export const createEvent = async (req, res) => {
    try {
        if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to create events" });
        }

        if (req.body.date && new Date(req.body.date) < new Date()) {
            return res.status(400).json({ message: "Event date must be in the future" });
        }

        const eventData = { ...req.body, organizer: req.user._id };
        const event = await Event.create(eventData);

        res.status(201).json(event);
    } catch (error) {
        console.error("Create event error:", error);
        res.status(500).json({ message: "Server error creating event" });
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'email role')
            .populate('partOrganizers', 'email role')
            .populate('volunteers', 'email role');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching events" });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'email role')
            .populate('partOrganizers', 'email role')
            .populate('volunteers', 'email role');

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching event" });
    }
};

// @desc    Add subevent (organizer only)
// @route   POST /api/events/:id/subevents
// @access  Private (Organizer)
export const addSubevent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() &&
            (!event.partOrganizers || !event.partOrganizers.includes(req.user._id.toString())) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to add subevents" });
        }

        const { title, description, date, endDate, capacity, isUnlimitedCapacity, location, categories } = req.body;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date && new Date(date) < yesterday) {
            return res.status(400).json({ message: "Subevent date cannot be strictly in the past" });
        }

        // generate unique qr_secret for subevent
        const crypto = await import('crypto');
        const qr = crypto.randomBytes(12).toString('hex');

        // Parse categories, default to free General if empty
        const validCategories = Array.isArray(categories) && categories.length > 0
            ? categories
            : [{ name: 'General', price: 0 }];

        const sub = { title, description, date, endDate, capacity, isUnlimitedCapacity, location, qr_secret: qr, categories: validCategories };
        event.subevents = event.subevents || [];
        event.subevents.push(sub);
        await event.save();

        res.status(201).json({ message: 'Subevent added', subevent: event.subevents[event.subevents.length - 1] });
    } catch (error) {
        console.error('Add subevent error:', error);
        res.status(500).json({ message: 'Server error adding subevent' });
    }
};

// @desc    Add update/news to event and notify registered users
// @route   POST /api/events/:id/updates
// @access  Private (Organizer)
export const addEventUpdate = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { title, text, attachments } = req.body;
        event.updates = event.updates || [];
        event.updates.unshift({ title, text, attachments });
        await event.save();

        // Notify all registered users (tickets) and volunteers
        const tickets = await Ticket.find({ event: event._id }).select('user');
        const userIds = new Set(tickets.map(t => t.user.toString()));
        if (event.volunteers) event.volunteers.forEach(v => userIds.add(v.toString()));

        const notifications = [];
        for (let uid of userIds) {
            notifications.push({
                user: uid,
                type: 'info',
                title: `Update for ${event.title}`,
                message: title || 'New update',
                relatedEvent: event._id
            });
        }
        if (notifications.length > 0) await Notification.insertMany(notifications);

        res.status(201).json({ message: 'Update added and users notified' });
    } catch (error) {
        console.error('Add update error:', error);
        res.status(500).json({ message: 'Server error adding update' });
    }
};

// @desc    Assign volunteer to event via roll number or email
// @route   POST /api/events/:id/volunteers
// @access  Private (Organizer)
export const assignVolunteer = async (req, res) => {
    try {
        const { rollNumberOrEmail } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() &&
            !event.partOrganizers.includes(req.user._id.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Find user by rollNumber/email
        let emailQuery = rollNumberOrEmail;
        if (!rollNumberOrEmail.includes('@')) {
            emailQuery = `${rollNumberOrEmail}@student.annauniv.edu`;
        }

        const volunteer = await User.findOne({ email: emailQuery });
        if (!volunteer) {
            return res.status(404).json({ message: "Student not found with that roll number/email" });
        }

        if (event.volunteers.includes(volunteer._id)) {
            return res.status(400).json({ message: "Already a volunteer for this event" });
        }

        // Assign Volunteer
        event.volunteers.push(volunteer._id);
        await event.save();

        // 1. Log transition
        await RoleTransition.create({
            user: volunteer._id,
            event: event._id,
            previousRole: volunteer.role,
            newRole: 'volunteer',
            reason: 'Assigned by organizer',
            changedBy: req.user._id
        });

        // 2. Check if user already has a ticket and cancel it
        const ticket = await Ticket.findOne({ user: volunteer._id, event: event._id, status: 'ACTIVE' });
        if (ticket) {
            ticket.status = 'CANCELLED';
            await ticket.save();
            event.registeredCount = Math.max(0, event.registeredCount - 1);
            await event.save();

            // Note: Add business logic here to trigger actual financial refund API if needed.

            await Notification.create({
                user: volunteer._id,
                type: 'warning',
                title: 'Registration Cancelled',
                message: `Your paid registration for ${event.title} was cancelled and refunded because you were assigned as a volunteer.`
            });
        }

        // 3. Notify them
        await Notification.create({
            user: volunteer._id,
            type: 'success',
            title: 'Volunteer Assigned',
            message: `You have been assigned as a volunteer for ${event.title}. Access the scanner from your dashboard.`
        });

        res.json({ message: "Volunteer assigned successfully", event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error assigning volunteer" });
    }
};

// @desc    Get all attendees for a specific event
// @route   GET /api/events/:id/attendees
// @access  Private (Organizer)
export const getEventAttendees = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Ensure user is organizer or admin
        if (event.organizer.toString() !== req.user._id.toString() &&
            !event.partOrganizers.includes(req.user._id.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to view attendees" });
        }

        const tickets = await Ticket.find({ event: req.params.id, status: { $in: ['ACTIVE', 'USED'] } })
            .populate('user', 'email role _id createdAt');

        res.json(tickets);
    } catch (error) {
        console.error("Fetch attendees error:", error);
        res.status(500).json({ message: "Server error fetching attendees" });
    }
};

// @desc    Get all students for recruitment and their clash status
// @route   GET /api/events/:id/recruitment-students
// @access  Private (Organizer)
export const getUsersForRecruitment = async (req, res) => {
    try {
        const targetEvent = await Event.findById(req.params.id);
        if (!targetEvent) return res.status(404).json({ message: "Event not found" });

        if (targetEvent.organizer.toString() !== req.user._id.toString() &&
            !targetEvent.partOrganizers.includes(req.user._id.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to recruit for this event" });
        }

        // Fetch all potential users (excluding admin)
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');

        // Find all events occurring on the exact same date (ignoring time for simplicity, or we can check exact date)
        const targetDate = new Date(targetEvent.date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const simultaneousEvents = await Event.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            _id: { $ne: targetEvent._id }
        });

        const usersWithClashes = users.map(u => {
            const userObj = u.toObject();
            const clashes = [];

            simultaneousEvents.forEach(ev => {
                if (ev.organizer.toString() === u._id.toString()) {
                    clashes.push({ type: 'organizer', eventName: ev.title });
                }
                if (ev.partOrganizers && ev.partOrganizers.some(o => o.toString() === u._id.toString())) {
                    clashes.push({ type: 'co_organizer', eventName: ev.title });
                }
                if (ev.volunteers && ev.volunteers.some(v => v.toString() === u._id.toString())) {
                    clashes.push({ type: 'volunteer', eventName: ev.title });
                }
            });

            // Also check if already a volunteer or partOrganizer for THIS event
            const isAlreadyVolunteer = targetEvent.volunteers && targetEvent.volunteers.some(v => v.toString() === u._id.toString());
            const isAlreadyPartOrganizer = targetEvent.partOrganizers && targetEvent.partOrganizers.some(o => o.toString() === u._id.toString());

            return { ...userObj, clashes, isAlreadyVolunteer, isAlreadyPartOrganizer };
        });

        res.json(usersWithClashes);
    } catch (error) {
        console.error("Recruitment fetch error:", error);
        res.status(500).json({ message: "Server error fetching recruitment users" });
    }
};

// @desc    Send Volunteer Request
// @route   POST /api/events/:id/volunteer-requests
// @access  Private (Organizer)
export const sendVolunteerRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const targetEvent = await Event.findById(req.params.id);

        if (!targetEvent) return res.status(404).json({ message: "Event not found" });

        if (targetEvent.organizer.toString() !== req.user._id.toString() &&
            !targetEvent.partOrganizers.includes(req.user._id.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        if (targetEvent.volunteers && targetEvent.volunteers.includes(targetUserId)) {
            return res.status(400).json({ message: "User is already a volunteer for this event" });
        }

        // Check if request already sent
        const existingReq = await Notification.findOne({
            user: targetUserId,
            action: 'volunteer_request',
            relatedEvent: targetEvent._id,
            isRead: false
        });

        if (existingReq) {
            return res.status(400).json({ message: "A pending request has already been sent to this user" });
        }

        // Send request notification
        await Notification.create({
            user: targetUserId,
            type: 'info',
            title: 'Volunteer Request',
            message: `You have been requested to volunteer for ${targetEvent.title}.`,
            action: 'volunteer_request',
            relatedEvent: targetEvent._id
        });

        res.json({ message: "Request sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error sending request" });
    }
};

// @desc    Send Part Organizer Request
// @route   POST /api/events/:id/part-organizer-requests
// @access  Private (Main Organizer)
export const sendPartOrganizerRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const targetEvent = await Event.findById(req.params.id);

        if (!targetEvent) return res.status(404).json({ message: "Event not found" });

        if (targetEvent.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only main organizers can request part organizers" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        if (targetEvent.partOrganizers && targetEvent.partOrganizers.includes(targetUserId)) {
            return res.status(400).json({ message: "User is already a part organizer for this event" });
        }

        const existingReq = await Notification.findOne({
            user: targetUserId,
            action: 'part_organizer_request',
            relatedEvent: targetEvent._id,
            isRead: false
        });

        if (existingReq) {
            return res.status(400).json({ message: "A pending request has already been sent to this user" });
        }

        await Notification.create({
            user: targetUserId,
            type: 'info',
            title: 'Part Organizer Request',
            message: `You have been requested to co-organize ${targetEvent.title} by the main organizer.`,
            action: 'part_organizer_request',
            relatedEvent: targetEvent._id
        });

        res.json({ message: "Request sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error sending part organizer request" });
    }
};

// @desc    Update event (organizer only)
// @route   PUT /api/events/:id
// @access  Private (Organizer)
export const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Ensure user is organizer or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const oldTitle = event.title;
        event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // Notify all registered users about the update
        const participants = await Ticket.find({ event: event._id }).distinct('user');
        const volunteers = event.volunteers || [];
        const usersToNotify = [...new Set([...participants.map(p => p.toString()), ...volunteers.map(v => v.toString())])];

        for (const userId of usersToNotify) {
            await Notification.create({
                user: userId,
                type: 'info',
                title: 'Event Updated',
                message: `An event you are part of, "${event.title}", has been updated by the organizer.`,
                relatedEvent: event._id
            });
        }

        res.json({ message: "Event updated successfully", event });
    } catch (error) {
        console.error("Update event error:", error);
        res.status(500).json({ message: "Server error updating event" });
    }
};

// @desc    Delete event (organizer only)
// @route   DELETE /api/events/:id
// @access  Private (Organizer)
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Ensure user is organizer or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Categorize users to be notified
        const participants = await Ticket.find({ event: event._id }).distinct('user');
        const volunteers = event.volunteers || [];
        const partOrganizers = event.partOrganizers || [];

        const staffIds = [...new Set([
            ...volunteers.map(v => v.toString()),
            ...partOrganizers.map(po => po.toString())
        ])];

        const participantIds = [...new Set(participants.map(p => p.toString()))]
            .filter(pId => !staffIds.includes(pId));

        // 1. Notify regular participants
        for (const pId of participantIds) {
            await Notification.create({
                user: pId,
                type: 'warning',
                title: 'Grand Event Cancelled',
                message: `The grand event "${event.title}" is deleted, so your registered event is also deleted and amount will be refunded soon.`,
                relatedEvent: null
            });
        }

        // 2. Notify and Demote Staff (Co-organizers and volunteers)
        for (const staffId of staffIds) {
            // Send cancellation notification
            await Notification.create({
                user: staffId,
                type: 'warning',
                title: 'Grand Event Cancelled',
                message: `The grand event "${event.title}" is officially deleted.`,
                relatedEvent: null
            });

            // Demote their role if they are not admin
            const staffUser = await User.findById(staffId);
            if (staffUser && staffUser.role !== 'admin' && staffUser.role !== 'student') {
                staffUser.role = 'student';
                await staffUser.save();
            }
        }

        // Cancel all tickets
        await Ticket.updateMany({ event: event._id }, { status: 'CANCELLED' });

        // Now delete the event
        await Event.findByIdAndDelete(req.params.id);

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete event error:", error);
        res.status(500).json({ message: "Server error deleting event" });
    }
};

// @desc    Request withdrawal from volunteering
// @route   POST /api/events/:id/volunteer-withdrawal
// @access  Private (Volunteer)
export const requestVolunteerWithdrawal = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const isVolunteer = event.volunteers && event.volunteers.some(v => v.toString() === req.user._id.toString());
        if (!isVolunteer) return res.status(403).json({ message: "You are not a volunteer for this event" });

        // Check if more than 1 hour remains
        const timeDiff = new Date(event.date).getTime() - Date.now();
        const oneHour = 60 * 60 * 1000;

        if (timeDiff < oneHour) {
            return res.status(400).json({ message: "Cannot boycott the volunteering with having less than 1 hour remaining" });
        }

        // Send request to organizer
        await Notification.create({
            user: event.organizer,
            type: 'warning',
            title: 'Volunteer Withdrawal Request',
            message: `A volunteer has requested to withdraw from ${event.title}.`,
            action: 'volunteer_withdrawal',
            relatedEvent: event._id,
            fromUser: req.user._id
        });

        res.json({ message: "Withdrawal request sent to the organizer" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error requesting withdrawal" });
    }
};

// @desc    Respond to volunteer withdrawal request
// @route   POST /api/events/:id/volunteer-withdrawal-response/:notificationId
// @access  Private (Organizer)
export const handleWithdrawalResponse = async (req, res) => {
    try {
        const { response } = req.body; // 'accept' or 'decline'
        const notification = await Notification.findById(req.params.notificationId);
        if (!notification) return res.status(404).json({ message: "Request notification not found" });

        const event = await Event.findById(notification.relatedEvent);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const volunteerId = notification.fromUser;

        if (response === 'accept') {
            event.volunteers = event.volunteers.filter(v => v.toString() !== volunteerId.toString());
            await event.save();

            await Notification.create({
                user: volunteerId,
                type: 'info',
                title: 'Withdrawal Accepted',
                message: `Your request to withdraw from ${event.title} has been accepted.`,
                relatedEvent: event._id
            });
        } else {
            await Notification.create({
                user: volunteerId,
                type: 'warning',
                title: 'Withdrawal Declined',
                message: `Your request to withdraw from ${event.title} was declined by the organizer.`,
                relatedEvent: event._id
            });
        }

        notification.isRead = true;
        notification.action = null;
        await notification.save();

        res.json({ message: `Withdrawal request ${response}ed` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error responding to withdrawal" });
    }
};

// @desc    Get detailed stats for a volunteer
// @route   GET /api/events/:id/volunteer-details/:volunteerId
// @access  Private (Organizer)
export const getVolunteerDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const volunteer = await User.findById(req.params.volunteerId).select('-password');
        if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

        // Count check-ins
        const checkinCount = await AttendanceLog.countDocuments({
            event_id: req.params.id,
            scanner_id: req.params.volunteerId,
            result: 'success'
        });

        // Roll number extraction
        const rollNumber = volunteer.email.split('@')[0];

        res.json({
            _id: volunteer._id,
            name: volunteer.email,
            email: volunteer.email,
            rollNumber: rollNumber,
            checkinCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching volunteer details" });
    }
};

// @desc    Remove (Fire) a volunteer
// @route   DELETE /api/events/:id/volunteers/:volunteerId
// @access  Private (Organizer)
export const removeVolunteer = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() &&
            !event.partOrganizers.includes(req.user._id.toString()) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        event.volunteers = event.volunteers.filter(v => v.toString() !== req.params.volunteerId);
        if (event.partOrganizers) {
            event.partOrganizers = event.partOrganizers.filter(o => o.toString() !== req.params.volunteerId);
        }
        await event.save();

        // Notify volunteer
        await Notification.create({
            user: req.params.volunteerId,
            type: 'error',
            title: 'Volunteer Status Removed',
            message: `Fired: You have been removed from your volunteer position for "${event.title}".`,
            relatedEvent: event._id
        });

        res.json({ message: "Volunteer removed successfully ('Fired' message sent)" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error removing volunteer" });
    }
};

// @desc    Get Subevent Details
// @route   GET /api/events/:id/subevents/:subeventId
// @access  Public
export const getSubeventDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'email role')
            .populate('partOrganizers', 'email role')
            .populate('volunteers', 'email role');

        if (!event) return res.status(404).json({ message: "Event not found" });

        const subevent = event.subevents.id(req.params.subeventId);
        if (!subevent) return res.status(404).json({ message: "Subevent not found" });

        res.json({ event, subevent });
    } catch (error) {
        console.error("Fetch subevent details error:", error);
        res.status(500).json({ message: "Server error fetching subevent details" });
    }
};

// @desc    Update Subevent
// @route   PUT /api/events/:id/subevents/:subeventId
// @access  Private (Main or Part Organizer)
export const updateSubevent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() &&
            (!event.partOrganizers || !event.partOrganizers.includes(req.user._id.toString())) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to update this subevent" });
        }

        const subevent = event.subevents.id(req.params.subeventId);
        if (!subevent) return res.status(404).json({ message: "Subevent not found" });

        // Update fields
        const { title, description, date, endDate, locationName, capacity, isUnlimitedCapacity, categories, image, promoLink, additionalMedia } = req.body;

        if (title) subevent.title = title;
        if (description) subevent.description = description;
        if (date) subevent.date = date;
        if (endDate) subevent.endDate = endDate;
        if (locationName) subevent.location.name = locationName;
        if (capacity !== undefined) subevent.capacity = capacity;
        if (isUnlimitedCapacity !== undefined) subevent.isUnlimitedCapacity = isUnlimitedCapacity;
        if (categories) subevent.categories = categories;

        // Rich media fields
        if (image) subevent.image = image;
        if (promoLink !== undefined) subevent.promoLink = promoLink;
        if (additionalMedia) subevent.additionalMedia = subevent.additionalMedia.concat(additionalMedia);

        await event.save();
        res.json({ message: "Subevent updated successfully", subevent });
    } catch (error) {
        console.error("Update subevent error:", error);
        res.status(500).json({ message: "Server error updating subevent" });
    }
};

// @desc    Add Buzz / Update to a Subevent
// @route   POST /api/events/:id/subevents/:subeventId/updates
// @access  Private (Main or Part Organizer)
export const addSubeventUpdate = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== req.user._id.toString() &&
            (!event.partOrganizers || !event.partOrganizers.includes(req.user._id.toString())) &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const subevent = event.subevents.id(req.params.subeventId);
        if (!subevent) return res.status(404).json({ message: "Subevent not found" });

        const { title, text, attachments } = req.body;
        subevent.updates = subevent.updates || [];
        subevent.updates.unshift({ title, text, attachments });

        await event.save();

        // Notify registered users of THIS specific subevent
        const tickets = await Ticket.find({ event: event._id, subevent: subevent._id }).select('user');
        const userIds = new Set(tickets.map(t => t.user.toString()));
        if (event.volunteers) event.volunteers.forEach(v => userIds.add(v.toString()));

        const notifications = [];
        for (let uid of userIds) {
            notifications.push({
                user: uid,
                type: 'info',
                title: `Update for ${subevent.title}`,
                message: title || 'New update',
                relatedEvent: event._id
            });
        }
        if (notifications.length > 0) await Notification.insertMany(notifications);

        res.status(201).json({ message: "Buzz posted successfully", updates: subevent.updates });
    } catch (error) {
        console.error("Add Subevent Update Error:", error);
        res.status(500).json({ message: "Server error posting subevent update" });
    }
};
