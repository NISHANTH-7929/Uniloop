import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getSubeventDetails, updateSubevent, deleteEvent, getVolunteerDetails, removeVolunteerFromEvent, addSubeventUpdate, registerEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';

const SubeventDetails = () => {
    const { id, subeventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [grandEvent, setGrandEvent] = useState(null);
    const [event, setEvent] = useState(null); // This is the subevent
    const [loading, setLoading] = useState(true);

    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    // Booking State
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookingPersons, setBookingPersons] = useState([{ name: "", age: "" }]);
    const [bookingAlias, setBookingAlias] = useState("");
    const [bookingCategory, setBookingCategory] = useState("");
    const [bookingAcknowledged, setBookingAcknowledged] = useState(false);
    const [volunteerAcknowledge, setVolunteerAcknowledge] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);

    // Organizer Forms State
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [updateForm, setUpdateForm] = useState({ title: '', text: '', attachments: [] });
    const [editForm, setEditForm] = useState({ title: '', description: '', date: '', endDate: '', locationName: '', promoLink: '', imageFile: null, imageUrl: '', additionalMediaFiles: [] });

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
            const res = await getSubeventDetails(id, subeventId);
            setEvent(res.data.subevent);
            setGrandEvent(res.data.event);
        } catch (err) {
            toast.error('Failed to load subevent details');
            navigate(`/events/${id}`);
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

    const submitUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...updateForm };
            if (updateForm.attachments.length > 0) {
                payload.attachments = updateForm.attachments.map(f => ({
                    filename: f.filename,
                    mime: f.mime,
                    url: f.data
                }));
            }
            await addSubeventUpdate(id, subeventId, payload);
            toast.success('Update posted!');
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
            date: toLocalISOString(event.date),
            endDate: event.endDate ? toLocalISOString(event.endDate) : '',
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
                        reader.onload = () => resolve({ filename: f.name, mime: f.type, data: reader.result });
                    });
                    payload.additionalMedia.push(b64);
                }
            }
            await updateSubevent(id, subeventId, payload);
            toast.success("Subevent Updated Successfully");
            setShowEditForm(false);
            loadEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update subevent");
        }
    };

    const handleDeleteSubevent = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete "${event.title}"? This cannot be undone.`)) return;
        try {
            await deleteEvent(grandEvent._id, event._id);
            toast.success('Subevent deleted successfully');
            navigate(`/events/${grandEvent._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete subevent');
        }
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const isValid = bookingPersons.every(p => p.name.trim() !== "" && p.age !== "" && p.age > 0);
        if (!isValid) return toast.error("Please fill in details for all persons");
        const isAgeValid = bookingPersons.every(p => p.age >= 1 && p.age <= 120);
        if (!isAgeValid) return toast.error("Age must be between 1 and 120");
        if (!bookingAcknowledged) return toast.error("Please acknowledge the ticket policy before booking.");
        if (isVolunteer && !volunteerAcknowledge) return toast.error("Volunteers must acknowledge the capacity policy.");
        if (!bookingCategory) return toast.error("Please select a ticket tier/category.");
        setShowFinalConfirm(true);
    };

    const proceedWithBooking = async () => {
        try {
            const sanitizedPersons = bookingPersons.map(p => ({
                name: p.name.trim(),
                age: Number(p.age)
            }));
            await registerEvent(grandEvent._id, sanitizedPersons, bookingAlias.trim(), event._id, bookingCategory);
            toast.success("Successfully booked subevent tickets!");
            setShowBookModal(false);
            setShowFinalConfirm(false);
            setBookingPersons([{ name: "", age: "" }]);
            setBookingAlias("");
            setBookingCategory("");
            setBookingAcknowledged(false);
            setVolunteerAcknowledge(false);
            loadEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Booking failed");
        }
    };

    if (loading) return <Loader fullScreen />;
    if (!event || !grandEvent) return <div style={{ padding: '100px', textAlign: 'center' }}><h2>Subevent not found</h2></div>;

    const isMainOrganizer = user && grandEvent.organizer && (grandEvent.organizer._id === user._id || grandEvent.organizer === user._id);
    const isPartOrganizer = user && grandEvent.partOrganizers && grandEvent.partOrganizers.some(o => o._id === user._id || o === user._id);
    // Subevent management is restricted to the part-organizer only (not even main organizer)
    const isSubeventOrganizer = isPartOrganizer;
    const isOrganizer = user && (user.role === 'admin' || isMainOrganizer);
    const isVolunteer = user && grandEvent.volunteers && grandEvent.volunteers.some(v => v._id === user._id || v === user._id);
    const isActive = new Date() <= new Date(event.endDate || new Date(event.date).getTime() + 24 * 60 * 60 * 1000);

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
                        <div style={{ color: 'var(--accent-pink)', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                            Subevent of <span style={{ color: 'var(--accent-cyan)' }}>{grandEvent.title}</span>
                        </div>
                        <h1 style={{ fontSize: '4rem', marginBottom: '10px' }} className="text-gradient">{event.title}</h1>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Date: {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.endDate && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    → Ends: {new Date(event.endDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📍 {event.location?.name || "Venue TBD"}
                            </span>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: isActive ? 'rgba(0,255,180,0.15)' : 'rgba(255,60,60,0.15)',
                                color: isActive ? 'var(--accent-cyan)' : '#ff4d4d',
                                border: `1px solid ${isActive ? 'var(--accent-cyan)' : '#ff4d4d'}`
                            }}>
                                {isActive ? '● ACTIVE' : '✕ ENDED'}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content Body */}
            <div style={{ maxWidth: '1200px', margin: '-40px auto 40px', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Description */}
                    {event.description && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 className="text-gradient" style={{ marginBottom: '15px' }}>About This Subevent</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>{event.description}</p>
                            <div style={{ marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Capacity: {event.isUnlimitedCapacity ? '∞ Unlimited' : `${event.registeredCount || 0} / ${event.capacity}`}
                                </span>
                                {event.categories && event.categories.length > 0 ? (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Tiers: {event.categories.map(c => `${c.name} ₹${c.price}`).join(' | ')}
                                    </span>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Price: ₹{event.price || 0}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Promo Section */}
                    {event.promoLink && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 className="text-gradient">Featured Promo</h3>
                            {event.promoLink.includes('youtube.com') || event.promoLink.includes('youtu.be') ? (
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: 'var(--shadow-neon)' }}>
                                    <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                        src={`https://www.youtube.com/embed/${event.promoLink.split('v=')[1]?.split('&')[0] || event.promoLink.split('/').pop()}`}
                                        title="YouTube video player" frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <a href={event.promoLink} target="_blank" rel="noreferrer" className="btn-neon primary w-100" style={{ padding: '15px' }}>
                                    Watch Promotional Content
                                </a>
                            )}
                        </div>
                    )}

                    {/* Additional Media */}
                    {event.additionalMedia && event.additionalMedia.length > 0 && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 className="text-gradient" style={{ marginBottom: '20px' }}>Event Highlights &amp; Media</h3>
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

                    {/* Edit Section — ONLY for isSubeventOrganizer (part-organizer) */}
                    {isSubeventOrganizer && (
                        <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px', border: showEditForm ? '1px solid var(--accent-cyan)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <h3 className="text-gradient" style={{ margin: 0 }}>Subevent Settings</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className={`btn-neon ${showEditForm ? '' : 'primary'}`} onClick={showEditForm ? () => setShowEditForm(false) : handleEditClick}>
                                        {showEditForm ? 'Cancel Edit' : 'Edit Subevent'}
                                    </button>
                                    <button className="btn-neon" style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={handleDeleteSubevent}>
                                        Delete Subevent
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showEditForm && (
                                    <motion.form
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        onSubmit={submitEdit}
                                        style={{ display: 'grid', gap: '20px', marginTop: '25px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}
                                    >
                                        <div>
                                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Subevent Name</label>
                                            <input type="text" className="form-control bg-dark text-white border-secondary" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Description</label>
                                            <textarea className="form-control bg-dark text-white border-secondary" required rows="3" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}></textarea>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Start (Date &amp; Time)</label>
                                                <input type="datetime-local" className="form-control bg-dark text-white border-secondary" required value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>End</label>
                                                <input type="datetime-local" className="form-control bg-dark text-white border-secondary" value={editForm.endDate} min={editForm.date} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
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
                                        <button className="btn-neon primary" type="submit">Save Changes</button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Updates Section */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="text-gradient">Latest Buzz &amp; Promos</h3>
                            {/* Only subevent organizer (part-organizer) can post updates */}
                            {isSubeventOrganizer && (
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

                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Action Card */}
                    <div className="glass-panel" style={{ padding: '25px', position: 'sticky', top: '100px' }}>
                        <div style={{ marginBottom: '25px' }}>
                            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Quick Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* VIEW MY TICKETS — scoped to this subevent */}
                                <button
                                    className="btn-neon w-100"
                                    style={{ padding: '15px' }}
                                    onClick={() => navigate(`/view-tickets?subeventId=${subeventId}&eventId=${id}`)}
                                >
                                    VIEW MY TICKETS
                                </button>

                                {/* DUTY HUB for volunteers */}
                                {isVolunteer && (
                                    <button
                                        className="btn-neon primary w-100"
                                        style={{ padding: '15px', background: 'var(--accent-purple)' }}
                                        onClick={() => navigate(`/volunteer/${grandEvent._id}/${user._id}`)}
                                    >
                                        DUTY HUB
                                    </button>
                                )}

                                {/* BOOK TICKETS or ENDED */}
                                {isActive ? (
                                    <button
                                        className="btn-neon primary w-100"
                                        style={{ padding: '15px' }}
                                        onClick={() => setShowBookModal(true)}
                                    >
                                        BOOK TICKETS
                                    </button>
                                ) : (
                                    <button className="btn-neon w-100" disabled style={{ padding: '15px', opacity: 0.6 }}>
                                        ENDED
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Grand Event</label>
                                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{grandEvent.title}</div>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Organizer</label>
                                <div style={{ color: '#fff', fontSize: '0.9rem' }}>{grandEvent.organizer?.email || "Unknown"}</div>
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
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>Secure your spot. Enter attendee details.</p>

                            <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Ticket Alias (e.g. Family Trip, Friends Hub)</label>
                                    <input type="text" placeholder="Enter an alias for this booking" value={bookingAlias} onChange={e => setBookingAlias(e.target.value)} className="neon-input w-100" />
                                </div>

                                {event?.categories && event.categories.length > 0 && (
                                    <div>
                                        <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Select Ticket Tier / Category</label>
                                        <select className="neon-input w-100" required value={bookingCategory} onChange={e => setBookingCategory(e.target.value)}>
                                            <option value="">-- Choose Category --</option>
                                            {event.categories.map((cat, idx) => (
                                                <option key={idx} value={cat.name}>{cat.name} (₹{cat.price})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {bookingPersons.map((person, index) => (
                                    <div key={index} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "15px", borderRadius: "12px", background: "rgba(0,0,0,0.3)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <span style={{ color: "var(--accent-cyan)", fontWeight: "bold" }}>Attendee {index + 1}</span>
                                            {bookingPersons.length > 1 && (
                                                <button type="button" onClick={() => setBookingPersons(prev => prev.filter((_, i) => i !== index))} style={{ background: "none", border: "none", color: "var(--accent-pink)", cursor: "pointer" }}>Remove</button>
                                            )}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                                            <input type="text" required placeholder="Name" value={person.name} onChange={(e) => { const newArr = [...bookingPersons]; newArr[index].name = e.target.value; setBookingPersons(newArr); }} className="neon-input" />
                                            <input type="number" required min="1" max="120" placeholder="Age" value={person.age} onChange={(e) => { const newArr = [...bookingPersons]; newArr[index].age = e.target.value; setBookingPersons(newArr); }} className="neon-input" />
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

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "10px", background: "rgba(112,0,255,0.1)", borderRadius: "8px" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>Total Amount:</span>
                                    <span style={{ color: "var(--accent-cyan)", fontSize: "1.2rem", fontWeight: "bold" }}>
                                        ₹{(() => {
                                            if (!event || !bookingCategory) return 0;
                                            const cat = event.categories?.find(c => c.name === bookingCategory);
                                            const price = cat ? cat.price : (event.price || 0);
                                            return price * bookingPersons.length;
                                        })()}
                                    </span>
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button type="submit" className="btn-neon primary flex-grow-1" style={{ padding: '12px' }}>Book Tickets</button>
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
                                I acknowledge that <strong>{bookingPersons.length} member{bookingPersons.length > 1 ? 's' : ''}</strong> at a total of <strong>₹{bookingPersons.length * (event?.categories?.find(c => c.name === bookingCategory)?.price ?? event?.price ?? 0)}</strong> are correct, and I proceed to book the ticket.
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button className="btn-neon primary flex-grow-1" style={{ padding: '12px' }} onClick={proceedWithBooking} type="button">Yes, Confirm &amp; Book</button>
                                <button className="btn-neon text-white flex-grow-1" style={{ padding: '12px' }} onClick={() => setShowFinalConfirm(false)} type="button">Back to Edit</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            <div style={{ marginTop: '60px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate(`/events/${grandEvent._id}`)}
                    className="btn-neon"
                    style={{ padding: '12px 40px', fontSize: '1.1rem' }}
                >
                    ← Back to {grandEvent.title}
                </button>
            </div>

            <style>{`
                .media-container video { transition: transform 0.3s ease; }
                .media-container:hover video { transform: scale(1.02); }
            `}</style>
        </div>
    );
};

export default SubeventDetails;
