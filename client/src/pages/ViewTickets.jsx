import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { getMyTickets, deleteTicket } from "../api/events";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import Loader from "../components/Loader";
import { toast } from "react-toastify";

const ViewTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketToDelete, setTicketToDelete] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const eventIdFilter = searchParams.get("eventId");

    useEffect(() => {
        fetchTickets();
    }, [eventIdFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await getMyTickets(eventIdFilter);
            setTickets(res.data);
        } catch (err) {
            toast.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!ticketToDelete) return;
        try {
            await deleteTicket(ticketToDelete._id);
            toast.success("Ticket deleted successfully");
            setTickets(prev => prev.filter(t => t._id !== ticketToDelete._id));
            setTicketToDelete(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete ticket");
        }
    };

    const filteredTickets = tickets.filter(t =>
    (t.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subevent?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.persons?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (loading) return <Loader fullScreen />;

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto", minHeight: '100vh' }}>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "40px" }}>
                <h1 className="text-gradient" style={{ fontSize: "3rem" }}>
                    {eventIdFilter ? "Event Bookings" : "My Universe of Tickets"}
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    {eventIdFilter ? `Manage your tickets for this specific odyssey.` : `Find all your cosmic passes here.`}
                </p>
            </motion.div>


            {/* Search Bar */}
            <div style={{ marginBottom: '30px', position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Search by Event Name, Subevent Name, or Alias..."
                    className="neon-input w-100"
                    style={{ padding: '15px 40px', fontSize: '1.1rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                    <h3>No tickets orbit this search.</h3>
                    <p>Try a different alias or explorer name.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
                    {filteredTickets.map(ticket => (
                        <motion.div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.03, boxShadow: "0px 0px 20px rgba(0, 212, 255, 0.4)" }}
                            className="glass-panel"
                            style={{
                                cursor: "pointer",
                                padding: "24px",
                                position: "relative",
                                border: '1px solid var(--border-glass)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {ticket.event?.title || "GRAND EVENT"}
                                    </div>
                                    <h3 style={{ color: '#fff', margin: '0 0 5px', fontSize: '1.4rem' }}> {ticket.subevent?.title || ticket.alias || "UNNAMED"}</h3>
                                </div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                                    background: ticket.status === 'ACTIVE' ? 'rgba(40,167,69,0.1)' : 'rgba(255,255,255,0.05)',
                                    color: ticket.status === 'ACTIVE' ? '#28a745' : 'var(--text-muted)',
                                    border: `1px solid ${ticket.status === 'ACTIVE' ? '#28a745' : 'rgba(255,255,255,0.1)'}`
                                }}>
                                    {ticket.status}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                Date: {new Date(ticket.subevent?.date || ticket.event?.date).toLocaleDateString()} at {new Date(ticket.subevent?.date || ticket.event?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>


                        </motion.div>
                    ))}
                </div>
            )}

            {/* Ticket Details Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(15px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: "95%", maxWidth: "500px", padding: "30px", maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2 className="text-gradient">{selectedTicket.alias}</h2>
                                <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>

                            <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'center', marginBottom: '25px', boxShadow: 'var(--shadow-neon)' }}>
                                <QRCodeSVG value={selectedTicket.qr_token} size={200} />
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)' }}>
                                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '10px' }}>ATTENDEE LIST ({selectedTicket.persons?.length} persons)</h4>
                                    {selectedTicket.persons?.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === selectedTicket.persons.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ color: '#fff' }}>{p.name}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>Age: {p.age}</span>
                                        </div>
                                    ))}
                                </div>

                                {selectedTicket.subevent && (
                                    <div className="glass-panel" style={{ padding: '15px', background: 'rgba(112,0,255,0.05)' }}>
                                        <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '10px' }}>REGISTERED SESSION</h4>
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>{selectedTicket.subevent.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(selectedTicket.subevent.date).toLocaleString()}</div>
                                            {selectedTicket.subevent.location?.name && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    Venue: {selectedTicket.subevent.location.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                                <button className="btn-neon primary w-100" style={{ padding: '15px' }} onClick={() => setSelectedTicket(null)}>Close View</button>
                                <button className="btn-neon w-100" style={{ padding: '15px', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={() => {
                                    setTicketToDelete(selectedTicket);
                                    setSelectedTicket(null);
                                }}>Delete Ticket</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {ticketToDelete && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, backdropFilter: "blur(20px)" }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ width: "90%", maxWidth: "400px", padding: "30px", textAlign: 'center', border: '1px solid var(--accent-pink)' }}>
                            <h3 style={{ color: 'var(--accent-pink)', marginBottom: '15px' }}>Delete Booking?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                                You are about to cancel the booking for <strong>{ticketToDelete.alias}</strong>. This action is irreversible and will restore capacity for others.
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-neon" style={{ flex: 1, borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={handleDelete}>Yes, Cancel</button>
                                <button className="btn-neon" style={{ flex: 1 }} onClick={() => setTicketToDelete(null)}>Go Back</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div style={{ marginTop: '60px', paddingBottom: '60px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate('/events')}
                    className="btn-neon"
                    style={{ padding: '12px 40px', fontSize: '1.1rem' }}
                >
                    Return to Mission Hub
                </button>
            </div>
        </div>
    );
};

export default ViewTickets;
