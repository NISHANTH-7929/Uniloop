import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationsAsRead, respondToVolunteerRequest, handleWithdrawalResponse } from '../api/events';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await getNotifications();
            setNotifications(data);
            // Mark as read after loading
            if (data.some(n => !n.isRead)) {
                await markNotificationsAsRead();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, resp) => {
        try {
            await respondToVolunteerRequest(id, resp);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            navigate('/events');
        } catch (err) {
            console.error(err);
        }
    };

    const handleWithdrawalAction = async (id, eventId, resp) => {
        try {
            await handleWithdrawalResponse(eventId, id, resp);
            toast.success(`Withdrawal request ${resp}ed`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true, action: null } : n));
        } catch (err) {
            console.error(err);
            toast.error("Failed to process withdrawal response");
        }
    };

    return (
        <div style={{ padding: '100px 20px 40px', maxWidth: '900px', margin: '0 auto' }}>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-gradient">Notifications</motion.h1>
            <p style={{ color: 'var(--text-secondary)' }}>All your system notifications — requests, alerts and updates.</p>

            <div style={{ marginTop: 24 }}>
                {loading ? (
                    <div style={{ color: 'var(--accent-cyan)' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No notifications</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {notifications.map(n => (
                            <div key={n._id} className="glass-panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ maxWidth: '70%' }}>
                                    <div style={{ fontWeight: 700 }}>{n.title || (n.type === 'warning' ? 'Notice' : 'Info')}</div>
                                    <div style={{ color: 'var(--text-primary)', marginTop: 6 }}>{n.message}</div>
                                    {n.relatedEvent && (
                                        <div style={{ marginTop: 8 }}>
                                            <button className="btn-neon" onClick={() => navigate(`/events`)}>View Event</button>
                                        </div>
                                    )}
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(n.action === 'volunteer_request' || n.action === 'part_organizer_request') && !n.isRead && (
                                        <>
                                            <button className="btn-neon primary" onClick={() => handleRespond(n._id, 'accept')}>Accept</button>
                                            <button className="btn-neon" onClick={() => handleRespond(n._id, 'decline')}>Decline</button>
                                        </>
                                    )}
                                    {n.action === 'volunteer_withdrawal' && n.action !== null && (
                                        <>
                                            <button className="btn-neon primary" style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={() => handleWithdrawalAction(n._id, n.relatedEvent, 'accept')}>Approve Withdrawal</button>
                                            <button className="btn-neon" onClick={() => handleWithdrawalAction(n._id, n.relatedEvent, 'decline')}>Refuse</button>
                                        </>
                                    )}
                                    {!n.action && (
                                        <div style={{ width: 10, height: 10, borderRadius: 6, background: n.isRead ? 'rgba(255,255,255,0.08)' : 'var(--accent-cyan)' }} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
