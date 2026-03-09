import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";
import AttendanceLog from "../models/AttendanceLog.js";
import jwt from "jsonwebtoken";

// @desc    Register for an event
// @route   POST /api/tickets/:eventId
// @access  Private
export const registerForEvent = async (req, res) => {
    try {
        // Debug logging: capture incoming request info to aid troubleshooting
        try {
            console.log("[Register] Incoming registration request:", {
                eventId: req.params.eventId,
                userId: req.user && req.user._id,
                bodyType: typeof req.body,
                bodyKeys: Object.keys(req.body || {}),
                personsSample: Array.isArray(req.body.persons) ? req.body.persons.slice(0, 3) : req.body.persons,
                jwtSecretPresent: !!process.env.JWT_SECRET
            });
        } catch (logErr) {
            console.warn("[Register] Failed to log request details:", logErr);
        }
        const { eventId } = req.params;
        const userId = req.user._id;
        const { persons, alias, subeventId, ticketCategory } = req.body; // Array of { name, age }, alias, subeventId, and optionally ticketCategory

        if (!subeventId) {
            return res.status(400).json({ message: "A subevent must be selected to book a ticket" });
        }

        // Validate persons data
        if (!persons || persons.length === 0) {
            return res.status(400).json({ message: "At least one person must be added to book" });
        }

        // Validate each person has name and age
        // Validate each person has name and age
        const isValidPersons = persons.every(p => {
            return p.name && typeof p.name === 'string' && p.name.trim() !== '' &&
                p.age && typeof p.age === 'number' && p.age > 0;
        });

        if (!isValidPersons) {
            return res.status(400).json({ message: "Each person must have a valid name and age (1-120)" });
        }

        // Specific range check for age (0 is too young for most events, usually students/visitors)
        const isAgeInRange = persons.every(p => p.age >= 1 && p.age <= 120);
        if (!isAgeInRange) {
            return res.status(400).json({ message: "Age must be between 1 and 120" });
        }

        const event = await Event.findById(eventId).populate('organizer', 'email');
        if (!event) return res.status(404).json({ message: "Event not found" });

        const organizerId = event.organizer?._id || event.organizer;
        if (organizerId.toString() === userId.toString()) {
            return res.status(400).json({ message: "Organizers cannot book tickets for their own events" });
        }

        const subevent = event.subevents.id(subeventId);
        if (!subevent) {
            return res.status(404).json({ message: "Subevent not found" });
        }

        if (!subevent.isUnlimitedCapacity && (subevent.registeredCount + persons.length > subevent.capacity)) {
            return res.status(400).json({ message: "Not enough capacity left for this subevent" });
        }

        const now = new Date();
        const eventEnd = subevent.endDate ? new Date(subevent.endDate) : new Date(subevent.date);
        if (now > eventEnd) {
            return res.status(400).json({ message: "Cannot book for a subevent that has already ended" });
        }

        // Multiple registrations allowed (like transport tickets)
        // Previous check for existing ticket removed to enable batch bookings

        const ticket = await Ticket.create({
            user: userId,
            event: eventId,
            subevent: subeventId,
            alias: alias || `Booking for ${subevent.title}`,
            ticketCategory: ticketCategory || 'General',
            persons: persons
        });

        const qr_token = jwt.sign({ ticketId: ticket._id }, process.env.JWT_SECRET);

        subevent.registeredCount += persons.length;
        await event.save();

        res.status(201).json({ ticket, qr_token });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};

// @desc    Get logged in user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
export const getMyTickets = async (req, res) => {
    try {
        const { eventId } = req.query;
        let query = { user: req.user._id };
        if (eventId) query.event = eventId;

        const tickets = await Ticket.find(query)
            .populate('event', 'title date location image subevents')
            .sort({ alias: 1 }); // Alpha order by alias as requested

        // Map over tickets to attach a freshly signed qr_token
        const ticketsWithToken = tickets.map(ticket => {
            const qr_token = jwt.sign({ ticketId: ticket._id }, process.env.JWT_SECRET);
            return { ...ticket.toObject(), qr_token };
        });

        res.json(ticketsWithToken);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tickets" });
    }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private
export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.status === 'USED') {
            return res.status(400).json({ message: "Cannot delete a ticket that has already been used" });
        }

        // Update subevent capacity
        const pCount = ticket.persons ? ticket.persons.length : 1;
        await Event.findOneAndUpdate(
            { _id: ticket.event, "subevents._id": ticket.subevent },
            { $inc: { "subevents.$.registeredCount": -pCount } }
        );

        await Ticket.findByIdAndDelete(req.params.id);
        res.json({ message: "Ticket deleted successfully and capacity restored" });
    } catch (error) {
        console.error("Delete ticket error:", error);
        res.status(500).json({ message: "Server error deleting ticket" });
    }
};

// @desc    Get ticket overview (for QR scan preview)
// @route   POST /api/tickets/verify-qr
// @access  Private (Volunteer/Organizer)
export const verifyTicketQR = async (req, res) => {
    try {
        const { qr_token } = req.body;
        if (!qr_token) return res.status(400).json({ message: "No QR token provided" });

        // Try JWT decode first (ticket QR)
        try {
            const decoded = jwt.verify(qr_token, process.env.JWT_SECRET);
            if (decoded.ticketId) {
                const ticket = await Ticket.findById(decoded.ticketId).populate('event').populate('user', 'email');
                if (!ticket) return res.status(404).json({ message: "Ticket not found" });
                if (ticket.status !== 'ACTIVE') {
                    return res.status(400).json({ message: `Ticket is ${ticket.status}` });
                }
                return res.json({ ticket });
            }
        } catch (err) {
            // not a valid JWT for ticket — fall through to try matching subevent qr_secret
        }

        // If not a ticket JWT, try matching a subevent qr_secret directly
        try {
            const event = await Event.findOne({ 'subevents.qr_secret': qr_token }, { 'subevents.$': 1, title: 1, organizer: 1, date: 1 });
            if (!event) return res.status(400).json({ message: "Invalid or corrupted QR code" });

            const sub = event.subevents && event.subevents[0];
            return res.json({ subevent: sub, event: { _id: event._id, title: event.title, organizer: event.organizer, date: event.date } });
        } catch (err) {
            console.error('Subevent lookup error:', err);
            return res.status(400).json({ message: "Invalid or corrupted QR code" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error verifying QR" });
    }
};

// @desc    Scan and verify QR code
// @route   POST /api/tickets/checkin
// @access  Private (Volunteer/Organizer)
export const checkinTicket = async (req, res) => {
    try {
        const { qr_token } = req.body;
        const scannerId = req.user._id;

        if (!qr_token) return res.status(400).json({ success: false, status: 'invalid', message: "No QR token provided" });

        // 1. Decode JWT to get Ticket ID
        let decoded;
        try {
            decoded = jwt.verify(qr_token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, status: 'invalid', message: "Invalid or corrupted QR code" });
        }

        const ticketId = decoded.ticketId;

        // 2. Fetch ticket and event details for auth check
        const rawTicket = await Ticket.findById(ticketId).populate('event').populate('user', 'email');
        if (!rawTicket) {
            return res.status(404).json({ success: false, status: 'invalid', message: "Ticket not found" });
        }

        const eventId = rawTicket.event._id;

        // 3. Verify scanner authorization
        const isOrganizer = rawTicket.event.organizer.toString() === scannerId.toString();
        const isVolunteer = rawTicket.event.volunteers.includes(scannerId);

        if (!isOrganizer && !isVolunteer && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, status: 'invalid', message: "Not authorized to scan for this event" });
        }

        // 4. Log attempt helper
        const logAttempt = async (result) => {
            await AttendanceLog.create({
                ticket_id: ticketId,
                event_id: eventId,
                scanner_id: scannerId,
                result
            });
        };

        // 5. Atomic Update (Concurrency Control)
        // Find ticket that is exactly ACTIVE and update to USED.
        // If it returns null, another request already marked it USED or it's CANCELLED.
        const updatedTicket = await Ticket.findOneAndUpdate(
            { _id: ticketId, status: 'ACTIVE' },
            { status: 'USED', checkin_time: Date.now() },
            { new: true }
        );

        if (!updatedTicket) {
            await logAttempt('already_used'); // or invalid if cancelled
            return res.status(400).json({ success: false, status: 'already_used', message: "Ticket already used or invalid" });
        }

        // Update subevent checkedInCount by the number of persons
        const personsCount = updatedTicket.persons && updatedTicket.persons.length > 0 ? updatedTicket.persons.length : 1;
        await Event.findOneAndUpdate(
            { _id: eventId, "subevents._id": updatedTicket.subevent },
            { $inc: { "subevents.$.checkedInCount": personsCount } }
        );
        await logAttempt('success');

        res.json({ success: true, status: 'success', message: "Check-in successful", user: rawTicket.user.email, personsCount });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Scan error" });
    }
};

// @desc    Get Event Statistics for Organizer
// @route   GET /api/tickets/stats/:eventId
// @access  Private (Organizer)
export const getEventStats = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Allow organizer, admin, or assigned volunteers to view stats
        const isOrganizer = event.organizer.toString() === req.user._id.toString();
        const isVolunteer = event.volunteers && event.volunteers.some(v => v.toString() === req.user._id.toString());
        if (!isOrganizer && !isVolunteer && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Fetch logs for recent scans
        const recentLogs = await AttendanceLog.find({ event_id: req.params.eventId })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('ticket_id');

        // Additionally compute how many persons this scanner (if a volunteer) has checked in
        let volunteerCheckedInCount = 0;
        try {
            volunteerCheckedInCount = await AttendanceLog.countDocuments({ event_id: req.params.eventId, scanner_id: req.user._id, result: 'success' });
        } catch (err) { /* ignore */ }

        res.json({
            registeredCount: event.registeredCount,
            checkedInCount: event.checkedInCount,
            capacity: event.capacity,
            recentLogs,
            volunteerCheckedInCount
        });
    } catch (error) {
        res.status(500).json({ message: "Stats error" });
    }
};

// @desc    Get stats for a specific volunteer within an event
// @route   GET /api/tickets/stats/:eventId/volunteer/:volunteerId
// @access  Private (Organizer/Admin or the volunteer themself)
export const getVolunteerStats = async (req, res) => {
    try {
        const { eventId, volunteerId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Authorization: organizer, admin, or the volunteer themself
        const isOrganizer = event.organizer.toString() === req.user._id.toString();
        const isVolunteerSelf = req.user._id.toString() === volunteerId.toString();
        if (!isOrganizer && !isVolunteerSelf && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Fetch attendance logs for this volunteer and event
        const logs = await AttendanceLog.find({ event_id: eventId, scanner_id: volunteerId, result: 'success' })
            .sort({ timestamp: -1 })
            .populate({ path: 'ticket_id', populate: { path: 'user', select: 'email' } });

        // Compute number of persons checked in by summing ticket.persons lengths
        let personsCheckedIn = 0;
        const details = logs.map(log => {
            const ticket = log.ticket_id;
            const pCount = ticket && ticket.persons ? ticket.persons.length : 1;
            personsCheckedIn += pCount;
            return {
                ticketId: ticket?._id,
                attendeeEmail: ticket?.user?.email,
                personsCount: pCount,
                timestamp: log.timestamp,
            };
        });

        res.json({ event: { _id: event._id, title: event.title, organizer: event.organizer, date: event.date }, volunteerId, personsCheckedIn, details });
    } catch (error) {
        console.error("getVolunteerStats error:", error);
        res.status(500).json({ message: "Server error fetching volunteer stats" });
    }
};
