import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVolunteerStats, requestVolunteerWithdrawal } from "../api/events";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const VolunteerDetails = () => {
    const { eventId, volunteerId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const handleWithdrawalRequest = async () => {
        const eventDate = new Date(data.event.date);
        const now = new Date();
        const diffHours = (eventDate - now) / (1000 * 60 * 60);

        if (diffHours < 1) {
            return toast.error("Cannot boycott the volunteering with having less than 1 hour remaining!");
        }

        if (!window.confirm("Are you sure you want to request withdrawal? The organizer must approve your request.")) return;

        try {
            await requestVolunteerWithdrawal(eventId);
            toast.success("Withdrawal request sent to the organizer.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send request");
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await getVolunteerStats(eventId, volunteerId);
                setData(res.data);
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load volunteer details");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId, volunteerId]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>No data</div>;

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: 900, margin: "0 auto", position: 'relative' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                {(data.event.status === 'finished' || (data.event.endDate && new Date() > new Date(data.event.endDate))) ? (
                    <h1 className="text-gradient"> Past Contributions</h1>
                ) : (
                    <h1 className="text-gradient"> Volunteer Duty Hub</h1>
                )}
                <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Event:</div>
                    <div style={{ fontWeight: 'bold' }}>{data.event.title}</div>
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Organizer: {data.event.organizer?.email || data.event.organizer}</div>
                <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Event Date: {new Date(data.event.date).toLocaleString()}</div>

                <div style={{ marginTop: 20, padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: 10 }}>Mission Impact</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{data.personsCheckedIn}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Total Persons Verified</div>
                    <div style={{ marginTop: 15, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Volunteer ID: {data.volunteerId}</div>
                </div>

                <div style={{ marginTop: 20 }}>
                    <h3 style={{ color: 'var(--accent-cyan)', marginBottom: 10 }}>Recent Check-ins</h3>
                    {data.details && data.details.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {data.details.map((d, idx) => (
                                <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{d.attendeeEmail || 'Unknown Attendee'}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Persons: {d.personsCount} • {new Date(d.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ticket: ...{d.ticketId?.toString().slice(-6)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>No successful check-ins recorded by this volunteer yet.</div>
                    )}
                </div>

                <div style={{ marginTop: '60px', paddingBottom: '60px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
                    {(data.event.status === 'finished' || (data.event.endDate && new Date() > new Date(data.event.endDate))) ? (
                        <>
                            <button className="btn-neon" disabled style={{ padding: '12px 30px', opacity: 0.5, cursor: 'not-allowed' }}>Scanner Disabled</button>
                            <button className="btn-neon" disabled style={{ padding: '12px 30px', opacity: 0.5, cursor: 'not-allowed' }}>Withdrawal Closed</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-neon primary" style={{ padding: '12px 30px' }} onClick={() => navigate(`/scanner/${eventId}`)}>Open Scanner</button>
                            <button className="btn-neon" style={{ padding: '12px 30px', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={handleWithdrawalRequest}>Request Withdrawal</button>
                        </>
                    )}
                    <button className="btn-neon" style={{ padding: '12px 30px' }} onClick={() => navigate('/events')}>Exit Hub</button>
                </div>
            </motion.div>
        </div>
    );
};

export default VolunteerDetails;
