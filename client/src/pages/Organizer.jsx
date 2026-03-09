import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { fetchEvents, createEvent, updateEvent, deleteEvent, fetchEventAttendees, assignVolunteer, getUsersForRecruitment, sendVolunteerRequest, sendPartOrganizerRequest, getVolunteerDetails, removeVolunteerFromEvent } from "../api/events";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
};

const Organizer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Core State
    const [activeTab, setActiveTab] = useState("events"); // "events" | "attendees" | "volunteers"
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Event Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [additionalMediaFiles, setAdditionalMediaFiles] = useState([]);
    const [promoLink, setPromoLink] = useState("");

    // Management State
    const [selectedEventId, setSelectedEventId] = useState("");
    const [attendees, setAttendees] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [recruitmentUsers, setRecruitmentUsers] = useState([]);
    const [loadingRecruitment, setLoadingRecruitment] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalPayload, setModalPayload] = useState(null);

    const [volunteers, setVolunteers] = useState([]);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [viewingVolunteer, setViewingVolunteer] = useState(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    useEffect(() => {
        if (user && (user.role === "organizer" || user.role === "admin")) {
            loadMyEvents();
        } else {
            toast.error("Unauthorized access");
            navigate("/dashboard");
        }
    }, [user, navigate]);

    const loadMyEvents = async () => {
        try {
            setLoading(true);
            const { data } = await fetchEvents();
            const myEvents = data.filter(ev =>
                (ev.organizer && (ev.organizer._id === user._id || ev.organizer === user._id)) ||
                (ev.partOrganizers && ev.partOrganizers.some(po => typeof po === 'object' ? po._id === user._id : po === user._id))
            );
            setEvents(myEvents);
        } catch (error) {
            toast.error("Failed to load your organized events");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate("");
        setEndDate("");
        setImageUrl("");
        setImageFile(null);
        setPromoLink("");
        setAdditionalMediaFiles([]);
        setShowCreateForm(false);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!endDate) {
            return toast.error("Event end date is required");
        }
        if (new Date(endDate) < new Date(date)) {
            return toast.error("Event end date cannot be before the start date");
        }
        if (!imageFile && !imageUrl) {
            return toast.error("Main event photo is required");
        }
        try {
            const eventPayload = {
                title, description, date, endDate,
                promoLink
            };
            if (imageFile) {
                const b64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(imageFile);
                    reader.onload = () => resolve(reader.result);
                });
                eventPayload.image = b64;
            } else if (imageUrl) {
                eventPayload.image = imageUrl;
            }

            if (additionalMediaFiles.length > 0) {
                eventPayload.additionalMedia = [];
                for (const f of additionalMediaFiles) {
                    const b64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(f);
                        reader.onload = () => resolve({
                            filename: f.name,
                            mime: f.type,
                            data: reader.result
                        });
                    });
                    eventPayload.additionalMedia.push(b64);
                }
            }

            await createEvent(eventPayload);
            toast.success("Event launched successfully");
            resetForm();
            loadMyEvents();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };


    const loadAttendees = async (eventId) => {
        if (!eventId) return setAttendees([]);
        try {
            setLoadingAttendees(true);
            const { data } = await fetchEventAttendees(eventId);
            setAttendees(data);
        } catch (error) {
            toast.error("Failed to load attendees");
            setAttendees([]);
        } finally {
            setLoadingAttendees(false);
        }
    };

    const loadRecruitment = async (eventId) => {
        if (!eventId) return setRecruitmentUsers([]);
        try {
            setLoadingRecruitment(true);
            const { data } = await getUsersForRecruitment(eventId);
            setRecruitmentUsers(data);
        } catch (error) {
            toast.error("Failed to load recruitment candidates");
        } finally {
            setLoadingRecruitment(false);
        }
    };

    const loadVolunteersData = async (eventId) => {
        if (!eventId) return setVolunteers([]);
        try {
            setLoadingVolunteers(true);
            const res = await fetchEvents();
            const event = res.data.find(ev => ev._id === eventId);
            const combined = [
                ...(event?.partOrganizers || []).map(o => ({ ...o, systemRole: 'Co-Organizer' })),
                ...(event?.volunteers || []).map(v => ({ ...v, systemRole: 'Volunteer' }))
            ];
            setVolunteers(combined);
        } catch (err) {
            toast.error("Failed to load volunteers");
        } finally {
            setLoadingVolunteers(false);
        }
    };

    const handleViewVolunteer = async (vId) => {
        try {
            const res = await getVolunteerDetails(selectedEventId, vId);
            setViewingVolunteer(res.data);
        } catch (err) {
            toast.error("Failed to load volunteer details");
        }
    };

    const handleRemoveVolunteer = async (vId) => {
        if (!window.confirm("FIRE VOLUNTEER? This will remove them immediately and send a 'Fired' notification.")) return;
        try {
            await removeVolunteerFromEvent(selectedEventId, vId);
            toast.success("Volunteer fired successfully.");
            setVolunteers(prev => prev.filter(v => (v._id || v) !== vId));
            setViewingVolunteer(null);
        } catch (err) {
            toast.error("Failed to remove volunteer");
        }
    };

    const handlePromoteVolunteer = (email, ticketId) => {
        setModalPayload({ type: 'assign', email, ticketId });
        setShowConfirmModal(true);
    };

    const handleSendVolunteerRequest = (u, isPartOrganizerReq = false) => {
        setModalPayload({ type: isPartOrganizerReq ? 'request_part_organizer' : 'request_volunteer', user: u });
        setShowConfirmModal(true);
    };

    const handleConfirmModal = async (confirmed) => {
        setShowConfirmModal(false);
        if (!confirmed || !modalPayload) return;
        try {
            if (modalPayload.type === 'assign') {
                await assignVolunteer(selectedEventId, modalPayload.email);
                toast.success(`Succesfully promoted ${modalPayload.email}!`);
                loadAttendees(selectedEventId);
            } else if (modalPayload.type === 'request_part_organizer') {
                await sendPartOrganizerRequest(selectedEventId, modalPayload.user._id);
                toast.success('Part Organizer request sent');
            } else {
                await sendVolunteerRequest(selectedEventId, modalPayload.user._id);
                toast.success('Volunteer request sent');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
        setModalPayload(null);
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto", minHeight: '100vh' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>Organizer Hub</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Central command for cosmic experiences.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className={`btn-neon ${activeTab === 'events' ? 'primary' : ''}`} onClick={() => setActiveTab('events')}>Events</button>
                    <button className={`btn-neon ${activeTab === 'attendees' ? 'primary' : ''}`} onClick={() => setActiveTab('attendees')}>Recruit</button>
                    <button className={`btn-neon ${activeTab === 'volunteers' ? 'primary' : ''}`} onClick={() => setActiveTab('volunteers')}>Team</button>
                </div>
            </motion.div>

            {activeTab === "events" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
                        <button className="btn-neon primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                            {showCreateForm ? "Close Form" : "+ Create New Event"}
                        </button>
                    </div>
                    {showCreateForm && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: "30px", marginBottom: "40px", border: "1px solid var(--accent-cyan)" }}>
                            <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>Launch a New Grand Event</h2>
                            <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Event Name</label>
                                        <input type="text" className="form-control bg-dark text-white border-secondary" required value={title} onChange={e => setTitle(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Description</label>
                                    <textarea className="form-control bg-dark text-white border-secondary" required rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Mission Start (Date & Time)</label>
                                        <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required min={getMinDateTime()} value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Mission End</label>
                                        <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required min={date || getMinDateTime()} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Main Photo *</label>
                                        <input type="file" accept="image/*" className="form-control bg-dark text-white border-secondary" onChange={e => setImageFile(e.target.files[0])} required />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Additional Media (Photos, Videos, PDFs)</label>
                                        <input type="file" multiple accept="image/*,video/*,.pdf" className="form-control bg-dark text-white border-secondary" onChange={e => setAdditionalMediaFiles(Array.from(e.target.files))} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="submit" className="btn-neon primary">Initialize Grand Event</button>
                                    <button type="button" className="btn-neon" onClick={resetForm}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    )}


                    {loading ? <p>Scanning galaxy...</p> : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                            {events.map(ev => (
                                <div key={ev._id} className="glass-panel" style={{ padding: "24px", border: ev.status === 'finished' ? '1px solid var(--accent-pink)' : '1px solid var(--border-glass)' }}>
                                    <h3 style={{ color: "var(--accent-cyan)" }}>{ev.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(ev.date).toLocaleString()}</p>
                                    <div style={{ marginTop: '10px' }}>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                        <button className="btn-neon" style={{ flex: 1, padding: '6px' }} onClick={() => navigate(`/events/${ev._id}`)}>Stats</button>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {activeTab === "attendees" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="glass-panel" style={{ padding: "30px", marginBottom: "30px" }}>
                        <h2 style={{ color: "var(--accent-cyan)", marginBottom: '20px' }}>Recruitment Terminal</h2>
                        <select className="form-control bg-dark text-white border-secondary" style={{ maxWidth: '400px' }} value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); loadAttendees(e.target.value); loadRecruitment(e.target.value); }}>
                            <option value="">Select Target Event</option>
                            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                        </select>
                    </div>
                    {selectedEventId && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h3>{events.find(e => e._id === selectedEventId)?.organizer?._id === user._id ? 'Registered Students (Cannot Promote to Organizers directly, send invite)' : 'Registered Students'}</h3>
                                {attendees.map(t => (
                                    <div key={t._id} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{t.user.email}</span>
                                        {!(events.find(e => e._id === selectedEventId)?.organizer?._id === user._id) && (
                                            <button className="btn-neon primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handlePromoteVolunteer(t.user.email, t._id)}>Promote limits</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h3>Recruit Candidates</h3>
                                {recruitmentUsers.map(u => {
                                    const isMain = events.find(e => e._id === selectedEventId)?.organizer?._id === user._id || events.find(e => e._id === selectedEventId)?.organizer === user._id;

                                    if (isMain) {
                                        return (
                                            <div key={u._id} style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{u.email}</span>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn-neon" disabled={u.isAlreadyPartOrganizer} onClick={() => handleSendVolunteerRequest(u, true)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>{u.isAlreadyPartOrganizer ? 'Co-Org Active' : 'Invite Co-Org'}</button>
                                                    <button className="btn-neon primary" disabled={u.isAlreadyVolunteer} onClick={() => handleSendVolunteerRequest(u, false)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>{u.isAlreadyVolunteer ? 'Vol Active' : 'Invite Vol'}</button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={u._id} style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{u.email}</span>
                                                <button className="btn-neon" disabled={u.isAlreadyVolunteer} onClick={() => handleSendVolunteerRequest(u, false)}>{u.isAlreadyVolunteer ? 'Active' : 'Send Volunteer Invite'}</button>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {activeTab === "volunteers" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="glass-panel" style={{ padding: "30px", marginBottom: "30px" }}>
                        <h2 style={{ color: "var(--accent-cyan)", marginBottom: '20px' }}>Active Duty Management</h2>
                        <select className="form-control bg-dark text-white border-secondary" style={{ maxWidth: '400px' }} value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); loadVolunteersData(e.target.value); }}>
                            <option value="">Select Target Event</option>
                            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                        </select>
                    </div>
                    {selectedEventId && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            {volunteers.map(v => (
                                <div key={v._id || v} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>{v.email || 'Crew Member'}</span>
                                        <div style={{ fontSize: '0.8rem', color: v.systemRole === 'Co-Organizer' ? 'var(--accent-pink)' : 'var(--accent-cyan)' }}>{v.systemRole}</div>
                                    </div>
                                    <button className="btn-neon primary" onClick={() => handleViewVolunteer(v._id || v)}>View Intel</button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Confirm Actions Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel" style={{ padding: '30px', maxWidth: '400px', textAlign: 'center' }}>
                            <h3>Confirm Action</h3>
                            <p>Are you sure you want to {modalPayload.type === 'assign' ? `promote ${modalPayload.email}` : `send a request to ${modalPayload.user.email}`}?</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-neon primary w-100" onClick={() => handleConfirmModal(true)}>Yes</button>
                                <button className="btn-neon w-100" onClick={() => handleConfirmModal(false)}>No</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Volunteer Details Modal */}
            <AnimatePresence>
                {viewingVolunteer && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel" style={{ padding: '30px', maxWidth: '450px', width: '90%' }}>
                            <h3 className="text-gradient">Volunteer Intel</h3>
                            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                                <div><label>Identity:</label> <span>{viewingVolunteer.email}</span></div>
                                <div><label>Roll:</label> <span>{viewingVolunteer.rollNumber}</span></div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{viewingVolunteer.checkinCount}</div>
                                    <div>Check-ins Completed</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                <button className="btn-neon w-100" style={{ color: 'var(--accent-pink)', borderColor: 'var(--accent-pink)' }} onClick={() => handleRemoveVolunteer(viewingVolunteer._id)}>FIRE VOLUNTEER</button>
                                <button className="btn-neon w-100" onClick={() => setViewingVolunteer(null)}>Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
                <button className="btn-neon" onClick={() => navigate('/dashboard')}>Return to Command</button>
            </div>
        </div>
    );
};

export default Organizer;
