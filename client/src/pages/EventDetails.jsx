import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEvent, addSubevent, addEventUpdate, registerEvent, updateEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Loader from "../components/Loader";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookingPersons, setBookingPersons] = useState([{ name: "", age: "" }]);
    const [bookingAlias, setBookingAlias] = useState("");
    const [bookingAcknowledged, setBookingAcknowledged] = useState(false);
    const [volunteerAcknowledge, setVolunteerAcknowledge] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);

    // Organizer Forms State
    const [showSubeventForm, setShowSubeventForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [subForm, setSubForm] = useState({ title: '', description: '', date: '', endDate: '', locationName: '', capacity: '', isUnlimitedCapacity: false, price: '' });
    const [updateForm, setUpdateForm] = useState({ title: '', text: '', attachments: [] });
    const [editForm, setEditForm] = useState({ title: '', description: '', date: '', endDate: '', locationName: '', promoLink: '', imageFile: null, imageUrl: '', additionalMediaFiles: [] });
    const [selectedSubevent, setSelectedSubevent] = useState(null);

    const LOCATION_OPTIONS = [
        "Tag Audi", "Vivekananda Audi", "Ground", "CEG Square", "CSE Department",
        "IT Department", "ECE Department", "Mechanical Department", "Civil Department",
        "Boys Hostel", "Girls Hostel", "Library", "Hall", "Canteen", "Mess"
    ];

    useEffect(() => {
        loadEventData();
    }, [id]);

    const loadEventData = async () => {
        try {
            setLoading(true);
            const res = await getEvent(id);
            setEvent(res.data);
        } catch (err) {
            toast.error('Failed to load event details');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const handleFileAdd = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = () => {
                setUpdateForm(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, { filename: f.name, mime: f.type, data: reader.result }]
                }));
            };
            reader.readAsDataURL(f);
        });
    };

    const submitSubevent = async (e) => {
        e.preventDefault();

        if (new Date(subForm.date) < new Date()) {
            return toast.error("Subevent date must be in the future");
        }

        try {
            const payload = {
                title: subForm.title,
                description: subForm.description,
                date: subForm.date,
                endDate: subForm.endDate || undefined,
                location: { name: subForm.locationName },
                capacity: subForm.isUnlimitedCapacity ? null : Number(subForm.capacity),
                isUnlimitedCapacity: subForm.isUnlimitedCapacity,
                price: Number(subForm.price) || 0
            };
            await addSubevent(id, payload);
            toast.success('Subevent added successfully');
            loadEventData();
            setSubForm({ title: '', description: '', date: '', endDate: '', locationName: '', capacity: '', isUnlimitedCapacity: false, price: '' });
            setShowSubeventForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add subevent');
        }
    };

    const submitUpdate = async (e) => {
        e.preventDefault();
        try {
            await addEventUpdate(id, updateForm);
            toast.success('Update posted and users notified');
            loadEventData();
            setUpdateForm({ title: '', text: '', attachments: [] });
            setShowUpdateForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post update');
        }
    };

    const handleEditClick = () => {
        setEditForm({
            title: event.title,
            description: event.description || '',
            date: new Date(event.date).toISOString().slice(0, 16),
            endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
            locationName: event.location?.name || LOCATION_OPTIONS[0],
            promoLink: event.promoLink || '',
            imageFile: null,
            imageUrl: event.image || '',
            additionalMediaFiles: []
        });
        setShowEditForm(true);
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                endDate: editForm.endDate,
                location: { name: editForm.locationName },
                promoLink: editForm.promoLink
            };

            if (editForm.imageFile) {
                const b64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(editForm.imageFile);
                    reader.onload = () => resolve(reader.result);
                });
                payload.image = b64;
            } else if (editForm.imageUrl) {
                payload.image = editForm.imageUrl;
            }

            if (editForm.additionalMediaFiles.length > 0) {
                payload.additionalMedia = [];
                for (const f of editForm.additionalMediaFiles) {
                    const b64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(f);
                        reader.onload = () => resolve({
                            filename: f.name,
                            mime: f.type,
                            data: reader.result
                        });
                    });
                    payload.additionalMedia.push(b64);
                }
            }

            await updateEvent(id, payload);
            toast.success("Mission Core Updated Successfully");
            setShowEditForm(false);
            loadEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update mission");
        }
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const isValid = bookingPersons.every(p => p.name.trim() !== "" && p.age !== "" && p.age > 0);
        if (!isValid) return toast.error("Please fill in details for all persons");

        const isAgeValid = bookingPersons.every(p => p.age >= 1 && p.age <= 120);
        if (!isAgeValid) return toast.error("Age must be between 1 and 120");

        if (!bookingAcknowledged) {
            return toast.error("Please acknowledge the ticket policy before booking.");
        }

        if (isVolunteer && !volunteerAcknowledge) {
            return toast.error("Volunteers must acknowledge the capacity policy.");
        }

        setShowFinalConfirm(true);
    };

    const proceedWithBooking = async () => {
        try {
            const sanitizedPersons = bookingPersons.map(p => ({
                name: p.name.trim(),
                age: Number(p.age)
            }));
            await registerEvent(event._id, sanitizedPersons, bookingAlias.trim(), selectedSubevent._id);
            toast.success("Successfully booked subevent tickets!");
            setShowBookModal(false);
            setShowFinalConfirm(false);
            setBookingPersons([{ name: "", age: "" }]);
            setBookingAlias("");
            setBookingAcknowledged(false);
            setVolunteerAcknowledge(false);
            setSelectedSubevent(null);
            loadEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Booking failed");
        }
    };

    if (loading) return <Loader fullScreen />;
    if (!event) return <div style={{ padding: '100px', textAlign: 'center' }}><h2>Event not found</h2></div>;

    const isMainOrganizer = user && event.organizer && (event.organizer._id === user._id || event.organizer === user._id);
    const isOrganizer = user && (user.role === 'admin' || isMainOrganizer);
    const isVolunteer = user && event.volunteers && event.volunteers.some(v => v._id === user._id || v === user._id);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>

            {/* Hero Section */}
            <div style={{ position: 'relative', height: '450px', width: '100%', overflow: 'hidden' }}>
                <img
                    src={event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200"}
                    alt={event.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '40px 10%'
                }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '4rem', marginBottom: '10px' }} className="text-gradient">{event.title}</h1>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Date: {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Location: {event.location?.name || "Venue TBD"}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content Body */}
            <div style={{ maxWidth: '1200px', margin: '-40px auto 40px', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Mission Debrief for Finished Events */}
                    {(event.status === 'finished' || (event.endDate && new Date() > new Date(event.endDate))) && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '30px', border: '1px solid var(--accent-pink)', background: 'rgba(255,0,110,0.02)' }}>
                            <h3 className="text-gradient" style={{ marginBottom: '20px' }}>Mission Debrief: Performance Recap</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{event.subevents?.length || 0}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Subevents</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{event.volunteers?.length || 0}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Crew Members</div>
                                </div>
                            </div>
                            {isOrganizer && (
                                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
                                    <button className="btn-neon primary" style={{ padding: '10px 25px' }} onClick={() => navigate('/organizer')}>View Detailed Intel</button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* About Section */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <h3 className="text-gradient">About the Event</h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{event.description}</p>
                        {isVolunteer && (
                            <div style={{ marginTop: '15px', padding: '10px 15px', borderRadius: '8px', background: 'rgba(112,0,255,0.1)', border: '1px solid var(--accent-purple)', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                Authorized Volunteer
                            </div>
                        )}
                    </div>

                    {/* Promo Section if exists */}
                    {event.promoLink && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 className="text-gradient">Featured Promo</h3>
                            {event.promoLink.includes('youtube.com') || event.promoLink.includes('youtu.be') ? (
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: 'var(--shadow-neon)' }}>
                                    <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                        src={`https://www.youtube.com/embed/${event.promoLink.split('v=')[1]?.split('&')[0] || event.promoLink.split('/').pop()}`}
                                        title="YouTube video player" frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
                                    ></iframe>
                                </div>
                            ) : (
                                <a href={event.promoLink} target="_blank" rel="noreferrer" className="btn-neon primary w-100" style={{ padding: '15px' }}>
                                    Watch Promotional Content
                                </a>
                            )}
                        </div>
                    )}

                    {/* Additional Media Section */}
                    {event.additionalMedia && event.additionalMedia.length > 0 && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 className="text-gradient" style={{ marginBottom: '20px' }}>Event Highlights & Media</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                {event.additionalMedia.map((a, i) => (
                                    <div key={i} className="media-container">
                                        {a.mime?.startsWith('video') ? (
                                            <video controls src={a.data || a.url} style={{ width: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-neon)' }} />
                                        ) : a.mime?.startsWith('image') ? (
                                            <img src={a.data || a.url} alt={a.filename} style={{ width: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-neon)' }} />
                                        ) : (
                                            <a href={a.data || a.url} download={a.filename} className="btn-neon" style={{ width: '100%', fontSize: '0.85rem' }}>
                                                Download: {a.filename}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit Section */}
                    {isMainOrganizer && (
                        <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px', border: showEditForm ? '1px solid var(--accent-cyan)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="text-gradient">Mission Core Settings</h3>
                                <button className={`btn-neon ${showEditForm ? '' : 'primary'}`} onClick={showEditForm ? () => setShowEditForm(false) : handleEditClick}>
                                    {showEditForm ? 'Cancel Edit' : 'Edit Mission'}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showEditForm && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        onSubmit={submitEdit}
                                        style={{ display: 'grid', gap: '20px', marginTop: '25px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}
                                    >
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Event Name</label>
                                                <input type="text" className="form-control bg-dark text-white border-secondary" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Description</label>
                                            <textarea className="form-control bg-dark text-white border-secondary" required rows="3" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}></textarea>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Mission Start (Date & Time)</label>
                                                <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Mission End</label>
                                                <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Location</label>
                                                <select className="form-control bg-dark text-white border-secondary" required value={editForm.locationName} onChange={e => setEditForm({ ...editForm, locationName: e.target.value })}>
                                                    {LOCATION_OPTIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Promotional Link / Trailer</label>
                                            <input type="url" className="form-control bg-dark text-white border-secondary" placeholder="https://youtube.com/..." value={editForm.promoLink} onChange={e => setEditForm({ ...editForm, promoLink: e.target.value })} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Change Main Photo</label>
                                                <input type="file" accept="image/*" className="form-control bg-dark text-white border-secondary" onChange={e => setEditForm({ ...editForm, imageFile: e.target.files[0] })} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Add New Media (Photos, Videos, PDFs)</label>
                                                <input type="file" multiple accept="image/*,video/*,.pdf" className="form-control bg-dark text-white border-secondary" onChange={e => setEditForm({ ...editForm, additionalMediaFiles: Array.from(e.target.files) })} />
                                            </div>
                                        </div>
                                        <button className="btn-neon primary" type="submit">Update Core</button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Updates Section */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="text-gradient">Latest Buzz & Promos</h3>
                            {isOrganizer && (
                                <button className="btn-neon" onClick={() => setShowUpdateForm(!showUpdateForm)}>
                                    {showUpdateForm ? 'Cancel' : 'New Update'}
                                </button>
                            )}
                        </div>

                        {showUpdateForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={submitUpdate}
                                style={{ display: 'grid', gap: '15px', marginBottom: '25px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}
                            >
                                <input className="neon-input" required placeholder="Update Title" value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })} />
                                <textarea className="neon-input" placeholder="What's happening?" rows="3" value={updateForm.text} onChange={e => setUpdateForm({ ...updateForm, text: e.target.value })} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attach images, videos, or documents</label>
                                    <input type="file" multiple onChange={handleFileAdd} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{updateForm.attachments.length} files attached</span>
                                </div>
                                <button className="btn-neon primary" type="submit">Post Update</button>
                            </motion.form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {event.updates && event.updates.length > 0 ? (
                                event.updates.map((u, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
                                        style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, color: 'var(--accent-cyan)' }}>{u.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ marginBottom: u.attachments?.length > 0 ? '15px' : 0 }}>{u.text}</p>

                                        {u.attachments && u.attachments.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                                {u.attachments.map((a, i) => (
                                                    <div key={i} className="media-container">
                                                        {a.mime?.startsWith('video') ? (
                                                            <video controls src={a.data || a.url} style={{ width: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-neon)' }} />
                                                        ) : a.mime?.startsWith('image') ? (
                                                            <img src={a.data || a.url} alt={a.filename} style={{ width: '100%', borderRadius: '8px' }} />
                                                        ) : (
                                                            <a href={a.data || a.url} download={a.filename} className="btn-neon" style={{ width: '100%', fontSize: '0.85rem' }}>
                                                                File: {a.filename}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (<p style={{ textAlign: 'center', padding: '20px' }}>No updates yet. Stay tuned!</p>)}
                        </div>
                    </div>

                    {/* Subevents Section */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="text-gradient">Event Schedule & Sub-Events</h3>
                            {isOrganizer && (
                                <button className="btn-neon" onClick={() => setShowSubeventForm(!showSubeventForm)}>
                                    {showSubeventForm ? 'Cancel' : 'Add Subevent'}
                                </button>
                            )}
                        </div>

                        {showSubeventForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={submitSubevent}
                                style={{ display: 'grid', gap: '15px', marginBottom: '25px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}
                            >
                                <input className="neon-input" required placeholder="Subevent Title" value={subForm.title} onChange={e => setSubForm({ ...subForm, title: e.target.value })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input className="neon-input" type="datetime-local" required min={new Date().toISOString().slice(0, 16)} value={subForm.date} onChange={e => setSubForm({ ...subForm, date: e.target.value })} />
                                    <input className="neon-input" type="datetime-local" placeholder="End Date (Optional)" min={subForm.date || new Date().toISOString().slice(0, 16)} value={subForm.endDate} onChange={e => setSubForm({ ...subForm, endDate: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <input className="neon-input" placeholder="Location Name" value={subForm.locationName} onChange={e => setSubForm({ ...subForm, locationName: e.target.value })} />
                                    {!subForm.isUnlimitedCapacity && (
                                        <input className="neon-input" type="number" placeholder="Capacity" required={!subForm.isUnlimitedCapacity} value={subForm.capacity} onChange={e => setSubForm({ ...subForm, capacity: e.target.value })} />
                                    )}
                                    <input className="neon-input" type="number" placeholder="Price (₹) - 0 for Free" value={subForm.price} onChange={e => setSubForm({ ...subForm, price: e.target.value })} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <input type="checkbox" checked={subForm.isUnlimitedCapacity} onChange={e => setSubForm({ ...subForm, isUnlimitedCapacity: e.target.checked, capacity: '' })} style={{ width: 16, height: 16 }} />
                                    Unlimited Capacity
                                </label>
                                <textarea className="neon-input" placeholder="Description" rows="2" value={subForm.description} onChange={e => setSubForm({ ...subForm, description: e.target.value })} />
                                <button className="btn-neon primary" type="submit">Publish Subevent</button>
                            </motion.form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {event.subevents && event.subevents.length > 0 ? (
                                event.subevents.map(s => (
                                    <div key={s._id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(112,0,255,0.05)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>{s.title}</div>
                                            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{s.date ? new Date(s.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Price: ₹{s.price || 0} | Capacity: {s.registeredCount} / {s.isUnlimitedCapacity ? '∞' : s.capacity} {s.location?.name ? `| Location: ${s.location.name}` : ''}</div>
                                            <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.description}</p>
                                        </div>
                                        {new Date() <= new Date(s.endDate || s.date) ? (
                                            <button
                                                className="btn-neon primary"
                                                onClick={() => { setSelectedSubevent(s); setShowBookModal(true); }}
                                            >
                                                Book Subevent
                                            </button>
                                        ) : (
                                            <button className="btn-neon" disabled style={{ opacity: 0.6 }}>Ended</button>
                                        )}
                                    </div>
                                ))
                            ) : (<p style={{ color: 'var(--text-muted)' }}>No subevents listed yet.</p>)}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info & Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Action Card */}
                    <div className="glass-panel" style={{ padding: '25px', position: 'sticky', top: '100px' }}>
                        <div style={{ marginBottom: '25px' }}>
                            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Quick Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    className="btn-neon w-100"
                                    style={{ padding: '15px' }}
                                    onClick={() => window.open(`/view-tickets?eventId=${event._id}`, '_blank')}
                                >
                                    VIEW MY TICKETS
                                </button>
                                {isVolunteer && (
                                    <button
                                        className="btn-neon primary w-100"
                                        style={{ padding: '15px', background: 'var(--accent-purple)' }}
                                        onClick={() => navigate(`/volunteer/${event._id}/${user._id}`)}
                                    >
                                        DUTY HUB
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Organizer</label>
                                <div style={{ color: '#fff', fontSize: '0.9rem' }}>{event.organizer?.email || "Unknown"}</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {showBookModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(10px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
                            <h3 className="text-gradient">Book Tickets for {event.title}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>Secure your spot in the cosmos. Enter attendee details.</p>

                            <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Ticket Alias (e.g. Family Trip, Friends Hub)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter an alias for this booking"
                                        value={bookingAlias}
                                        onChange={e => setBookingAlias(e.target.value)}
                                        className="neon-input w-100"
                                    />
                                </div>

                                {bookingPersons.map((person, index) => (
                                    <div key={index} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "15px", borderRadius: "12px", background: "rgba(0,0,0,0.3)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <span style={{ color: "var(--accent-cyan)", fontWeight: "bold" }}>Attendee {index + 1}</span>
                                            {bookingPersons.length > 1 && (
                                                <button type="button" onClick={() => setBookingPersons(prev => prev.filter((_, i) => i !== index))} style={{ background: "none", border: "none", color: "var(--accent-pink)", cursor: "pointer" }}>Remove</button>
                                            )}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                                            <input type="text" required placeholder="Name" value={person.name} onChange={(e) => {
                                                const newArr = [...bookingPersons]; newArr[index].name = e.target.value; setBookingPersons(newArr);
                                            }} className="neon-input" />
                                            <input type="number" required min="1" max="120" placeholder="Age" value={person.age} onChange={(e) => {
                                                const newArr = [...bookingPersons]; newArr[index].age = e.target.value; setBookingPersons(newArr);
                                            }} className="neon-input" />
                                        </div>
                                    </div>
                                ))}

                                <button type="button" className="btn-neon w-100" style={{ padding: "10px", border: "1px dashed var(--accent-cyan)", background: "transparent" }} onClick={() => setBookingPersons([...bookingPersons, { name: "", age: "" }])}>
                                    + Add Person
                                </button>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '5px 0' }}>
                                        <input type="checkbox" checked={bookingAcknowledged} onChange={e => setBookingAcknowledged(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3 }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            I acknowledge that once a ticket is booked, individual attendee cancellation is not possible, and no refunds will be applicable for this transaction.
                                        </span>
                                    </label>

                                    {isVolunteer && (
                                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '5px 0' }}>
                                            <input type="checkbox" checked={volunteerAcknowledge} onChange={e => setVolunteerAcknowledge(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3 }} />
                                            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                                                I acknowledge that as a volunteer for this event, I am participating in an official capacity and cannot be a participant myself. I have not included my own name in this attendee list.
                                            </span>
                                        </label>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button type="submit" className="btn-neon primary flex-grow-1" style={{ padding: '12px' }}>Book This Event</button>
                                    <button type="button" className="btn-neon text-white flex-grow-1" style={{ padding: '12px' }} onClick={() => setShowBookModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showFinalConfirm && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, backdropFilter: "blur(15px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: "90%", maxWidth: "450px", padding: "30px", border: '1px solid var(--accent-cyan)' }}>
                            <h3 className="text-gradient">Final Confirmation</h3>
                            <div style={{ margin: '25px 0', fontSize: '1.1rem', color: '#fff', lineHeight: '1.6' }}>
                                I acknowledge that <strong>{bookingPersons.length} members</strong> and its respective total price of <strong>₹{bookingPersons.length * (selectedSubevent?.price || 0)}</strong> are correct, and I proceed to book the ticket.
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button className="btn-neon primary flex-grow-1" style={{ padding: '12px' }} onClick={proceedWithBooking} type="button">Yes, Confirm & Book</button>
                                <button className="btn-neon text-white flex-grow-1" style={{ padding: '12px' }} onClick={() => setShowFinalConfirm(false)} type="button">Back to Edit</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div style={{ marginTop: '60px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate(isOrganizer ? '/organizer' : '/events')}
                    className="btn-neon"
                    style={{ padding: '12px 40px', fontSize: '1.1rem' }}
                >
                    {isOrganizer ? "Back to Organizer Hub" : "Back to Events Listing"}
                </button>
            </div>

            <style>{`
                .media-container video {
                    transition: transform 0.3s ease;
                }
                .media-container:hover video {
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
};

export default EventDetails;
