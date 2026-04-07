import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchEvents, registerEvent, assignVolunteer, getMyTickets } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Events = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasNewEvents, setHasNewEvents] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [subTab, setSubTab] = useState('upcoming'); // 'upcoming' | 'past'
    const [myTickets, setMyTickets] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [volunteerEmail, setVolunteerEmail] = useState("");

    // Booking State
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookingPersons, setBookingPersons] = useState([{ name: "", age: "" }]);
    const [bookingAlias, setBookingAlias] = useState("");
    const [bookingAcknowledged, setBookingAcknowledged] = useState(false);

    // Event Details Modal State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);

    // Fallback images if event doesn't have one
    const placeholderImages = [
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=500&q=80"
    ];

    useEffect(() => {
        // Load cached events (if any) immediately so UI isn't empty while fetching.
        const cached = localStorage.getItem('cachedEvents');
        if (cached) {
            try {
                setEvents(JSON.parse(cached));
                setLoading(false);
            } catch (e) { }
        }
        // If we had cached events, perform a background refresh; otherwise show initial loader.
        loadEvents(!cached);
    }, []);


    const loadEvents = async (initial = false) => {
        try {
            if (initial) setLoading(true);
            else setIsRefreshing(true);

            const [eventsRes, ticketsRes] = await Promise.all([
                fetchEvents(),
                getMyTickets()
            ]);

            const data = eventsRes.data;
            setEvents(data);
            setMyTickets(ticketsRes.data);
            // Cache events locally to show immediately on next load
            try { localStorage.setItem('cachedEvents', JSON.stringify(data)); } catch (e) { }
            // Mark events as seen shortly after load to allow dot to show briefly
            setTimeout(() => { try { localStorage.setItem('seenEventsCount', data.length); } catch (e) { } }, 1500);
        } catch (error) {
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const isValid = bookingPersons.every(p => p.name.trim() !== "" && p.age !== "" && p.age > 0);
        if (!isValid) return toast.error("Please fill in details for all persons");

        const isAgeValid = bookingPersons.every(p => p.age >= 1 && p.age <= 120);
        if (!isAgeValid) return toast.error("Age must be between 1 and 120");

        if (!bookingAcknowledged) return toast.error("Please acknowledge the ticket policy before booking.");

        try {
            // Ensure all ages are numbers before sending
            const sanitizedPersons = bookingPersons.map(p => ({
                name: p.name.trim(),
                age: Number(p.age)
            }));
            await registerEvent(selectedEventId, sanitizedPersons, bookingAlias.trim());
            toast.success("Successfully booked event tickets!");
            setShowBookModal(false);
            setBookingPersons([{ name: "", age: "" }]);
            setBookingAlias("");
            setBookingAcknowledged(false);
            loadEvents();
        } catch (error) {
            toast.error(error.response?.data?.message || "Booking failed");
        }
    };

    const handleAssignVolunteer = async (e) => {
        e.preventDefault();
        try {
            await assignVolunteer(selectedEventId, volunteerEmail);
            toast.success("Volunteer assigned successfully!");
            setShowAssignModal(false);
            setVolunteerEmail("");
            loadEvents();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign volunteer");
        }
    };

    const filteredEvents = events.filter((ev) => {
        const isFinished = ev.status === 'finished' || (ev.endDate && new Date() > new Date(ev.endDate));
        const isLive = !isFinished && new Date() >= new Date(ev.date) && (!ev.endDate || new Date() <= new Date(ev.endDate));
        const isUpcoming = !isFinished && !isLive;

        if (subTab === "upcoming") {
            return !isFinished;
        }

        if (subTab === "past") {
            return isFinished;
        }

        return true;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const cardVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const openDetailsModal = (event) => {
        navigate(`/events/${event._id}`);
    };

    const openBookModal = (eventId) => {
        setSelectedEventId(eventId);
        setShowDetailsModal(false);
        setShowBookModal(true);
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px", display: 'flex', alignItems: 'center', gap: 8 }}>
                        Discover Events
                        {hasNewEvents && <span style={{ width: 10, height: 10, borderRadius: 6, background: 'var(--accent-pink)' }} />}
                        {isRefreshing && <span style={{ marginLeft: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Refreshing…</span>}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Explore upcoming cosmic gatherings and workshops.</p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {(user?.role === "organizer" || user?.role === "admin") && (
                        <button className="btn-neon" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => navigate("/organizer")}>
                            Organizer Hub
                        </button>
                    )}
                    {events.some(ev => ev.volunteers && ev.volunteers.some(v => (v._id || v) === user._id)) && (
                        <button className="btn-neon primary" style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'var(--accent-purple)' }} onClick={() => {
                            // Find first ongoing duty or just navigate to top
                            const duty = events.find(ev => ev.volunteers && ev.volunteers.some(v => (v._id || v) === user._id));
                            if (duty) navigate(`/volunteer/${duty._id}/${user._id}`);
                        }}>
                            Duty Hub
                        </button>
                    )}
                </div>
            </motion.div>

            <div style={{ marginBottom: "30px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button className={`btn-neon ${subTab === 'upcoming' ? 'primary' : ''}`} onClick={() => setSubTab('upcoming')}>Upcoming Events</button>
                <button className={`btn-neon ${subTab === 'past' ? 'primary' : ''}`} onClick={() => setSubTab('past')}>Past Events</button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", color: "var(--accent-cyan)", padding: "50px" }}>Loading Events...</div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        gap: "30px"
                    }}
                >
                    {filteredEvents.map((ev, i) => {
                        const isExpired = new Date() > new Date(ev.endDate || ev.date);
                        return (
                            <motion.div key={ev._id} variants={cardVariants} className="glass-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform var(--transition-fast), box-shadow var(--transition-fast)", cursor: "pointer", filter: isExpired ? 'grayscale(0.6) opacity(0.8)' : 'none' }}
                                whileHover={isExpired ? {} : { scale: 1.03, boxShadow: "0 15px 40px rgba(112,0,255,0.2)" }}
                            >
                                <div style={{ height: "200px", position: "relative", overflow: "hidden" }}>
                                    <img src={ev.image || placeholderImages[i % placeholderImages.length]} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} className="event-img" />
                                    {ev.volunteers && ev.volunteers.some(v => (v._id || v) === user._id) && (
                                        <div
                                            style={{
                                                position: "absolute", top: "15px", left: "15px",
                                                background: "var(--accent-purple)", width: "14px", height: "14px",
                                                borderRadius: "50%", boxShadow: "var(--shadow-neon)",
                                                border: "2px solid #fff", zIndex: 10
                                            }}
                                            title="You are a volunteer"
                                        />
                                    )}
                                    <div style={{ position: "absolute", top: "15px", right: "15px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.3)" }}>
                                        {ev.location?.name || "TBD"}
                                    </div>
                                </div>
                                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                                    <h3 style={{ margin: "0 0 10px", fontSize: "1.4rem", color: "var(--text-primary)" }}>{ev.title}</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "20px", fontSize: "0.9rem" }}>
                                        Date: {new Date(ev.date).toLocaleDateString()}
                                    </div>
                                    <div style={{ marginTop: "auto", display: "flex", gap: "10px", flexDirection: "column" }}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                className="btn-neon w-100"
                                                style={{ padding: "8px", fontSize: "0.9rem", background: "rgba(0,212,255,0.1)" }}
                                                onClick={() => openDetailsModal(ev)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {filteredEvents.length === 0 && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "1.1rem" }}>
                            No cosmic events found for this view.
                        </div>
                    )}
                </motion.div>
            )}

            {/* Volunteer Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: "400px", padding: "30px" }}>
                            <h3 className="text-gradient">Assign Volunteer</h3>
                            <form onSubmit={handleAssignVolunteer} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>Roll Number or Email</label>
                                    <input
                                        type="text"
                                        required
                                        value={volunteerEmail}
                                        onChange={(e) => setVolunteerEmail(e.target.value)}
                                        className="form-control"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                                        placeholder="e.g. 2024103543"
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button type="submit" className="btn-neon primary flex-grow-1">Assign</button>
                                    <button type="button" className="btn-neon text-white flex-grow-1" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showBookModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
                            <h3 className="text-gradient">Book Tickets</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>Secure your spot in the cosmos. Enter attendee details.</p>

                            <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Ticket Alias (e.g. Family Trip, Friends Hub)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter an alias for this booking"
                                        value={bookingAlias}
                                        onChange={e => setBookingAlias(e.target.value)}
                                        className="form-control"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                                    />
                                </div>
                                {bookingPersons.map((person, index) => (
                                    <div key={index} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "15px", borderRadius: "8px", background: "rgba(0,0,0,0.2)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <span style={{ color: "var(--accent-cyan)", fontWeight: "bold" }}>Person {index + 1}</span>
                                            {bookingPersons.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBookingPersons(prev => prev.filter((_, i) => i !== index))}
                                                    style={{ background: "none", border: "none", color: "var(--accent-pink)", cursor: "pointer" }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Full Name"
                                                value={person.name}
                                                onChange={(e) => {
                                                    const newArr = [...bookingPersons];
                                                    newArr[index].name = e.target.value;
                                                    setBookingPersons(newArr);
                                                }}
                                                className="form-control"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                                            />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Age"
                                                value={person.age}
                                                onChange={(e) => {
                                                    const newArr = [...bookingPersons];
                                                    newArr[index].age = Number(e.target.value);
                                                    setBookingPersons(newArr);
                                                }}
                                                className="form-control"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '5px 0' }}>
                                    <input type="checkbox" checked={bookingAcknowledged} onChange={e => setBookingAcknowledged(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3 }} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        I acknowledge that once a ticket is booked, individual attendee cancellation is not possible, and no refunds will be applicable for this transaction.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    className="btn-neon w-100"
                                    style={{ padding: "8px", border: "1px dashed var(--accent-cyan)", background: "transparent" }}
                                    onClick={() => setBookingPersons([...bookingPersons, { name: "", age: "" }])}
                                >
                                    + Add Another Person
                                </button>

                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button type="submit" className="btn-neon primary flex-grow-1">Confirm Booking</button>
                                    <button type="button" className="btn-neon text-white flex-grow-1" onClick={() => { setShowBookModal(false); setBookingPersons([{ name: "", age: "" }]); }}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Event Details Modal */}
                {showDetailsModal && selectedEventDetails && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: "90%", maxWidth: "600px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
                            <h2 className="text-gradient" style={{ marginBottom: "20px" }}>{selectedEventDetails.title}</h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "25px" }}>
                                <div style={{ background: "rgba(0,212,255,0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(0,212,255,0.3)" }}>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>📍 Location</div>
                                    <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>{selectedEventDetails.location?.name || "TBD"}</div>
                                </div>

                                <div style={{ background: "rgba(200,100,255,0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(200,100,255,0.3)" }}>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>📅 Date & Time</div>
                                    <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>{new Date(selectedEventDetails.date).toLocaleString()}</div>
                                </div>

                                <div style={{ background: "rgba(100,200,255,0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(100,200,255,0.3)" }}>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>💰 Ticket Price</div>
                                    <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>₹ {selectedEventDetails.price === 0 ? "Free" : selectedEventDetails.price}</div>
                                </div>

                                <div style={{ background: "rgba(100,255,200,0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(100,255,200,0.3)" }}>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>🎯 Capacity</div>
                                    <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>
                                        {selectedEventDetails.registeredCount} / {selectedEventDetails.isUnlimitedCapacity ? "∞" : selectedEventDetails.capacity}
                                    </div>
                                </div>

                                <div style={{ background: "rgba(255,150,100,0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,150,100,0.3)" }}>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>👤 Organizer</div>
                                    <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedEventDetails.organizer?.email || "Unknown"}</div>
                                </div>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "8px", marginBottom: "25px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <h3 style={{ color: "var(--accent-cyan)", marginTop: 0, marginBottom: "12px", fontSize: "1rem" }}>Description</h3>
                                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>{selectedEventDetails.description || "No description provided."}</p>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    className="btn-neon primary flex-grow-1"
                                    style={{ padding: "12px", fontSize: "1rem" }}
                                    onClick={() => openBookModal(selectedEventDetails._id)}
                                >
                                    Book Event
                                </button>
                                <button
                                    className="btn-neon text-white flex-grow-1"
                                    style={{ padding: "12px", fontSize: "1rem" }}
                                    onClick={() => setShowDetailsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .glass-panel:hover .event-img {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};

export default Events;
