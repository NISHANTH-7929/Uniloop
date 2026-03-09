import React, { useState, useEffect } from 'react';
import { getAllUsers, assignOrganizerRole, demoteOrganizerRole, resetTestData } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [validity, setValidity] = useState({ from: '', to: '' });

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadUsers();
        }
    }, [user]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignOrganizer = async (e) => {
        e.preventDefault();
        if (!selectedUser) return toast.warning("Select a user first");

        // Validate Dates
        if (validity.from || validity.to) {
            if (!validity.from || !validity.to) {
                return toast.warning("Please provide both From and To dates, or leave them both blank for permanent status.");
            }
            
            const fromDate = new Date(validity.from);
            const toDate = new Date(validity.to);
            const now = new Date();

            if (toDate <= fromDate) {
                return toast.warning("'Valid To' must be strictly after 'Valid From' time.");
            }
            if (toDate <= now) {
                return toast.warning("The validity period must end in the future.");
            }
        }

        try {
            await assignOrganizerRole(selectedUser._id, validity);
            toast.success("Organizer role assigned successfully!");
            setSelectedUser(null);
            setValidity({ from: '', to: '' });
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Assignment failed");
        }
    };

    const handleDemote = async (userId) => {
        if (!window.confirm("Are you sure you want to demote this organizer back to a student?")) return;

        try {
            await demoteOrganizerRole(userId);
            toast.success("Organizer successfully demoted!");
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Demotion failed");
        }
    };

    const handleReset = async () => {
        if (!window.confirm("CRITICAL WARNING: This will permanently delete ALL events, subevents, tickets, and demote all non-admin users to 'student'. Are you absolutely sure?")) {
            return;
        }

        try {
            const { data } = await resetTestData();
            toast.success(data.message || "Database reset successfully");
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset database");
        }
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>Loading Admin Panel...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '100px 20px 40px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="text-gradient">Admin Dashboard</h2>
                    <button className="btn-neon" style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={handleReset}>
                        ⚠️ WIPE & RESET TEST DATA
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 className="text-gradient" style={{ marginBottom: '20px' }}>Assign Time-Limited Organizer Role</h3>
                    <form onSubmit={handleAssignOrganizer} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Select User</label>
                            <select 
                                className="neon-input w-100" 
                                required
                                value={selectedUser?._id || ''}
                                onChange={(e) => setSelectedUser(users.find(u => u._id === e.target.value))}
                            >
                                <option value="">-- Choose User --</option>
                                {users.filter(u => u.role !== 'admin').map(u => (
                                    <option key={u._id} value={u._id}>
                                        {u.email} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Valid From (Optional)</label>
                                <input 
                                    type="datetime-local" 
                                    className="neon-input w-100" 
                                    min={new Date().toISOString().slice(0, 16)}
                                    value={validity.from}
                                    onChange={e => setValidity({ ...validity, from: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Valid To (Optional)</label>
                                <input 
                                    type="datetime-local" 
                                    className="neon-input w-100" 
                                    min={validity.from || new Date().toISOString().slice(0, 16)}
                                    value={validity.to}
                                    onChange={e => setValidity({ ...validity, to: e.target.value })}
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Leave blank for permanent status.</small>
                            </div>
                        </div>

                        <button className="btn-neon primary" type="submit" disabled={!selectedUser}>
                            Grant Organizer Status
                        </button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 className="text-gradient" style={{ marginBottom: '20px' }}>System Users</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <th style={{ padding: '15px' }}>Email</th>
                                    <th style={{ padding: '15px' }}>Role</th>
                                    <th style={{ padding: '15px' }}>Validity</th>
                                    <th style={{ padding: '15px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px' }}>{u.email}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '12px', 
                                                fontSize: '0.8rem',
                                                background: u.role === 'admin' ? 'rgba(0,255,136,0.2)' : 
                                                            u.role === 'organizer' ? 'rgba(112,0,255,0.2)' : 'rgba(255,255,255,0.1)',
                                                color: u.role === 'admin' ? '#0f8' : 
                                                       u.role === 'organizer' ? '#a6f' : '#ccc'
                                            }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {u.organizerValidity?.to 
                                                ? `Until ${new Date(u.organizerValidity.to).toLocaleString()}` 
                                                : (u.role === 'organizer' ? 'Permanent' : '-')}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            {u.role === 'organizer' && (
                                                <button 
                                                    className="btn-neon" 
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem', color: '#ff4444', borderColor: '#ff4444' }}
                                                    onClick={() => handleDemote(u._id)}
                                                >
                                                    Demote
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
